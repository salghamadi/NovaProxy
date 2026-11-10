import React, { useState, useEffect } from 'react';
import {
  X,
  Tv,
  Smartphone,
  QrCode,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Wifi,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Server } from '../types';
import { proxyService } from '../services/proxyController';
import { parseBulkText, exportServersToText } from '../services/protocolParser';

interface TvSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: Server[];
  activeServer: Server | null;
  onAddServers: (newServers: Server[]) => void;
  language: 'en' | 'ar';
}

function isValidTvAddress(addr: string): boolean {
  if (!addr) return false;
  let clean = addr.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  const colonIdx = clean.indexOf(':');
  if (colonIdx !== -1) {
    clean = clean.substring(0, colonIdx);
  }
  if (!clean || clean.endsWith('.') || clean === '127.0.0.1' || clean === 'localhost') return false;
  const parts = clean.split('.');
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (!p || isNaN(Number(p))) return false;
    const n = Number(p);
    if (n < 0 || n > 255) return false;
  }
  return true;
}

export const TvSyncModal: React.FC<TvSyncModalProps> = ({
  isOpen,
  onClose,
  servers,
  activeServer,
  onAddServers,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'receive' | 'send'>('receive');

  // Receiver State (TV mode)
  const [serverUrl, setServerUrl] = useState<string>('');
  const [serverIp, setServerIp] = useState<string>('');
  const [serverPort, setServerPort] = useState<number>(8888);
  const [isServerRunning, setIsServerRunning] = useState<boolean>(false);
  const [receivedCount, setReceivedCount] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sender State (Mobile mode)
  const [targetTvAddress, setTargetTvAddress] = useState<string>(() => {
    return localStorage.getItem('novaproxy_tv_ip') || '';
  });
  const [sendOption, setSendOption] = useState<'all' | 'active' | 'custom'>('all');
  const [customText, setCustomText] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-start TV Sync Server when opened on 'receive' tab
  useEffect(() => {
    if (!isOpen) return;

    let cleanupListener: (() => void) | null = null;

    if (activeTab === 'receive') {
      proxyService.startTvSyncServer().then((res) => {
        setIsServerRunning(res.running);
        setServerIp(res.ip);
        setServerPort(res.port);
        setServerUrl(res.url);
      });

      // Listen for incoming servers from mobile
      cleanupListener = proxyService.onTvSyncData((content: string) => {
        try {
          const parsed = parseBulkText(content);
          if (parsed && parsed.length > 0) {
            onAddServers(parsed);
            setReceivedCount(parsed.length);
          }
        } catch (e) {
          console.warn('Error parsing incoming TV sync servers:', e);
        }
      });
    }

    return () => {
      if (cleanupListener) cleanupListener();
    };
  }, [isOpen, activeTab]);

  // Clean up server on close if desired, or keep running
  const handleClose = () => {
    setReceivedCount(null);
    setSendResult(null);
    onClose();
  };

  const handleCopyUrl = async () => {
    if (!serverUrl) return;
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  const handleSendToTv = async () => {
    const cleanAddress = targetTvAddress.trim();
    if (!cleanAddress || !isValidTvAddress(cleanAddress)) {
      setSendResult({
        success: false,
        message:
          language === 'ar'
            ? '⚠️ يرجى كتابة عنوان IP التلفزيون كاملاً كما هو معروض على شاشة التلفزيون (مثال: 192.168.1.50)'
            : '⚠️ Please enter the complete TV IP address as shown on your TV screen (e.g. 192.168.1.50)',
      });
      return;
    }

    localStorage.setItem('novaproxy_tv_ip', cleanAddress);
    setIsSending(true);
    setSendResult(null);

    let payload = '';
    if (sendOption === 'all') {
      payload = JSON.stringify({
        type: 'novaproxy_sync',
        servers: servers,
      });
    } else if (sendOption === 'active' && activeServer) {
      payload = JSON.stringify({
        type: 'novaproxy_sync',
        servers: [activeServer],
      });
    } else if (sendOption === 'custom') {
      payload = customText.trim();
    }

    if (!payload.trim()) {
      setIsSending(false);
      setSendResult({
        success: false,
        message: language === 'ar' ? 'لا توجد خوادم لإرسالها' : 'No servers to send',
      });
      return;
    }

    try {
      const res = await proxyService.sendServersToTv(targetTvAddress, payload);
      setSendResult({
        success: res.success,
        message: res.success
          ? language === 'ar'
            ? 'تم إرسال الخوادم بنجاح إلى شاشة التلفزيون!'
            : 'Servers sent successfully to your TV!'
          : res.message,
      });
    } catch (err: any) {
      const errMsg = err?.message || '';
      let displayMsg = errMsg;
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || !errMsg) {
        displayMsg =
          language === 'ar'
            ? 'تعذر الوصول إلى التلفزيون (Failed to fetch). تأكد أن التلفزيون والجوال متصلان بنفس شبكة الواي فاي وأن عنوان IP التلفزيون صحيح.'
            : 'Failed to reach TV. Please verify both devices are on the exact same Wi-Fi and the IP is correct.';
      }
      setSendResult({
        success: false,
        message: displayMsg,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const qrImageUrl = serverUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(serverUrl)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-theme-card border border-theme-card rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 text-theme-primary max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-theme-primary">
                {language === 'ar' ? 'مزامنة وإرسال البروكسي (TV Sync)' : 'TV & Mobile Proxy Sync'}
              </h3>
              <p className="text-[11.5px] text-theme-secondary">
                {language === 'ar'
                  ? 'إرسال معلومات وخوادم البروكسي من الجوال إلى التلفزيون بكل سهولة'
                  : 'Transfer proxy configurations between phone and TV'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-theme-muted hover:text-theme-primary p-2 rounded-xl hover:bg-theme-subtle cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-theme-subtle/50 border border-theme-card text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-theme-accent text-white shadow-sm'
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>{language === 'ar' ? 'استقبال في التلفزيون (الشاشة)' : 'Receive on TV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-theme-accent text-white shadow-sm'
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'ar' ? 'إرسال من الجوال (الهاتف)' : 'Send from Phone'}</span>
          </button>
        </div>

        {/* TAB 1: RECEIVE ON TV (Screen Mode) */}
        {activeTab === 'receive' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-1 pr-1">
            {/* Success Banner when received */}
            {receivedCount !== null && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">
                    {language === 'ar'
                      ? `تم استلام ${receivedCount} خادم بنجاح من هاتفك!`
                      : `Successfully received ${receivedCount} server(s) from phone!`}
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    {language === 'ar'
                      ? 'تمت إضافة الخوادم وحفظها في التلفزيون وهي جاهزة للاتصال الآن.'
                      : 'Servers imported and saved to your TV list.'}
                  </p>
                </div>
              </div>
            )}

            {/* TV IP & Web link card */}
            <div className="p-4 rounded-2xl bg-theme-subtle/60 border border-theme-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-teal-400" />
                  {language === 'ar' ? 'عنوان التلفزيون في شبكة الواي فاي:' : 'TV Network Address:'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {language === 'ar' ? 'في انتظار الإرسال...' : 'Listening...'}
                </span>
              </div>

              {/* Big High-Contrast URL Display */}
              <div className="flex items-center justify-between bg-black/40 border border-theme-divider rounded-xl p-3">
                <span className="text-base sm:text-lg font-mono font-bold text-theme-accent tracking-wider select-all">
                  {serverUrl || 'http://192.168.x.x:8888'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-theme-subtle hover:bg-theme-card text-xs text-theme-primary font-semibold flex items-center gap-1.5 cursor-pointer border border-theme-divider"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {/* QR Code and Steps Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-theme-subtle/30 border border-theme-card rounded-2xl p-4">
              {/* Left/Top: High Resolution QR Code */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner max-w-[210px] mx-auto w-full">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="TV Sync QR Code"
                    className="w-44 h-44 object-contain"
                    loading="eager"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-zinc-400 text-xs text-center">
                    Generating QR...
                  </div>
                )}
                <span className="text-[11px] font-bold text-zinc-800 mt-2">
                  {language === 'ar' ? 'امسح بكاميرا الجوال 📷' : 'Scan with phone camera 📷'}
                </span>
              </div>

              {/* Right: How to use Instructions */}
              <div className="space-y-3 text-xs leading-relaxed text-theme-secondary">
                <h4 className="font-bold text-theme-primary text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-theme-accent" />
                  {language === 'ar' ? 'طريقة الإرسال من هاتفك:' : 'How to send from phone:'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-theme-card text-theme-accent font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      {language === 'ar'
                        ? 'امسح رمز الـ QR بكاميرا هاتفك أو افتح الرابط في متصفح الجوال.'
                        : 'Scan the QR code with phone camera or open the link in phone browser.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-theme-card text-theme-accent font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      {language === 'ar'
                        ? 'أو افتح NovaProxy في هاتفك واختر تبويب "إرسال من الجوال".'
                        : 'Or open NovaProxy on your phone and switch to "Send from Phone".'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-theme-card text-theme-accent font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      {language === 'ar'
                        ? 'الصق روابط البروكسي واضغط "إرسال"، وستصل للتلفزيون فوراً!'
                        : 'Paste your proxy links and tap Send; they will appear on your TV instantly!'}
                    </p>
                  </div>
                </div>

                {/* Android Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>{language === 'ar' ? 'ملاحظة هامة لجوالات أندرويد:' : 'Important for Android users:'}</span>
                  </p>
                  <p className="leading-relaxed">
                    {language === 'ar'
                      ? 'إذا ظهر لك "لا يمكن الوصول إلى الموقع"، تأكد من إيقاف الـ VPN مؤقتاً في هاتفك والتأكد أنك متصل بشبكة الواي فاي وليس بيانات الشريحة 4G/5G، أو افتح NovaProxy بالجوال واختر "إرسال من الجوال" مباشرة دون الحاجة للكاميرا.'
                      : 'If "Site can\'t be reached" appears, disable VPN on your phone and ensure you are on Wi-Fi (not mobile data), or use the "Send from Phone" tab inside NovaProxy directly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEND FROM PHONE (Mobile Sender Mode) */}
        {activeTab === 'send' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-1 pr-1">
            {/* TV IP Input Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isValidTvAddress(targetTvAddress)
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-zinc-900/90 border-teal-500/40 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-teal-400" />
                  {language === 'ar'
                    ? '1. اكتب عنوان IP التلفزيون (المعروض على شاشة التلفزيون):'
                    : '1. Enter TV IP Address (shown on TV screen):'}
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      if (clip) setTargetTvAddress(clip.trim());
                    } catch (e) {}
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-teal-400 border border-teal-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{language === 'ar' ? 'لصق IP' : 'Paste IP'}</span>
                </button>
              </div>

              <input
                type="text"
                value={targetTvAddress}
                onChange={(e) => setTargetTvAddress(e.target.value)}
                placeholder="192.168.1.50"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl py-3 px-3.5 text-sm text-white font-mono font-bold outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 select-text"
              />

              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-zinc-400">
                  {language === 'ar'
                    ? '📺 افتح تطبيق NovaProxy في التلفزيون واقرأ رقم الـ IP الظاهر في الشاشة'
                    : '📺 Open NovaProxy on TV and read the IP displayed at top'}
                </span>
                {isValidTvAddress(targetTvAddress) ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'العنوان مكتمل ومطابق' : 'Valid IP format'}
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    {targetTvAddress.trim()
                      ? (language === 'ar' ? '⚠️ الرقم غير مكتمل' : '⚠️ Incomplete IP')
                      : (language === 'ar' ? 'مطلوب إدخاله' : 'Required')}
                  </span>
                )}
              </div>
            </div>

            {/* What to Send options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-400" />
                {language === 'ar' ? '2. اختر ما تريد إرساله إلى التلفزيون:' : '2. Select data to send to TV:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSendOption('all')}
                  className={`p-3 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                    sendOption === 'all'
                      ? 'bg-theme-subtle border-theme-accent text-theme-primary ring-1 ring-theme-accent'
                      : 'bg-theme-card border-theme-card text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  <p className="text-xs font-bold text-theme-primary">
                    {language === 'ar' ? 'جميع الخوادم' : 'All Servers'}
                  </p>
                  <p className="text-[11px] text-theme-secondary mt-0.5 font-mono">
                    {servers.length} {language === 'ar' ? 'خادم' : 'server(s)'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSendOption('active')}
                  disabled={!activeServer}
                  className={`p-3 rounded-xl border text-left rtl:text-right transition-all cursor-pointer disabled:opacity-40 ${
                    sendOption === 'active'
                      ? 'bg-theme-subtle border-theme-accent text-theme-primary ring-1 ring-theme-accent'
                      : 'bg-theme-card border-theme-card text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  <p className="text-xs font-bold text-theme-primary">
                    {language === 'ar' ? 'الخادم النشط فقط' : 'Active Server'}
                  </p>
                  <p className="text-[11px] text-theme-secondary mt-0.5 truncate">
                    {activeServer ? activeServer.name : (language === 'ar' ? 'لا يوجد' : 'None')}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSendOption('custom')}
                  className={`p-3 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                    sendOption === 'custom'
                      ? 'bg-theme-subtle border-theme-accent text-theme-primary ring-1 ring-theme-accent'
                      : 'bg-theme-card border-theme-card text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  <p className="text-xs font-bold text-theme-primary">
                    {language === 'ar' ? 'إدخال مخصص' : 'Custom Links'}
                  </p>
                  <p className="text-[11px] text-theme-secondary mt-0.5">
                    {language === 'ar' ? 'كتابة أو لصق' : 'Type / Paste'}
                  </p>
                </button>
              </div>
            </div>

            {/* Custom Textarea if 'custom' is selected */}
            {sendOption === 'custom' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    {language === 'ar' ? '3. اكتب أو الصق روابط البروكسي:' : '3. Paste or type proxy links:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const clip = await navigator.clipboard.readText();
                          if (clip) setCustomText(clip);
                        } catch (e) {
                          alert(language === 'ar' ? 'يرجى لصق النص يدوياً' : 'Please paste manually');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-teal-400 border border-teal-500/40 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? '📋 لصق من الحافظة' : '📋 Paste'}</span>
                    </button>
                    {customText && (
                      <button
                        type="button"
                        onClick={() => setCustomText('')}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-rose-400 border border-rose-500/40 cursor-pointer active:scale-95 transition-all"
                      >
                        {language === 'ar' ? 'مسح' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={language === 'ar' ? 'الصق روابط الخوادم هنا مثل:\nvless://...\nvmess://...\ntrojan://...\nss://...' : 'Paste server URLs here:\nvless://...\nvmess://...'}
                  rows={4}
                  autoFocus
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/40 rounded-xl p-3 text-xs text-white font-mono outline-none select-text resize-y leading-relaxed"
                />
              </div>
            )}

            {/* Send Result Banner */}
            {sendResult && (
              <div
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fadeIn ${
                  sendResult.success
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                }`}
              >
                {sendResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{sendResult.message}</span>
              </div>
            )}

            {/* Action Send Button */}
            <button
              type="button"
              onClick={handleSendToTv}
              disabled={isSending}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'ar' ? 'جاري الإرسال إلى التلفزيون...' : 'Sending to TV...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{language === 'ar' ? '🚀 إرسال الخوادم إلى شاشة التلفزيون الآن' : 'Send Servers to TV Now'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-theme-divider flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-theme-subtle hover:bg-theme-card text-theme-primary text-xs font-semibold cursor-pointer border border-theme-card"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
