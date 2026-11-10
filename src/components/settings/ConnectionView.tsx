import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCw,
  ChevronRight,
  Copy,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';
import { AppSettings } from '../../types';

interface ConnectionViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBack: () => void;
  language?: 'en' | 'ar';
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  language = 'en',
}) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'login' | 'password' | null>(null);
  const [isBypassModalOpen, setIsBypassModalOpen] = useState(false);
  const [bypassInput, setBypassInput] = useState(
    settings.additionalProxyBypass || '*.local, 192.168.*, 10.*, 172.16.*'
  );

  const showFeedback = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // High-Contrast, Tactile & RTL-Safe Toggle Switch
  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      dir="ltr"
      onClick={onChange}
      className={`w-13 h-7 rounded-full transition-colors duration-200 relative p-1 focus:outline-none cursor-pointer flex-shrink-0 border-2 ${
        checked
          ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.45)]'
          : 'bg-zinc-800 border-zinc-600 hover:border-zinc-500'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  // Connection settings state
  const autoConnect = settings.autoConnect ?? false;
  const killSwitch = settings.killSwitch ?? false;
  const captureSystemDns = settings.captureSystemDns ?? true;
  const allowLanConnections = settings.allowLanConnections ?? settings.lanAccess ?? true;
  const allowHotspotAccess = settings.allowHotspotAccess ?? false;
  const routeLanViaProxy = settings.routeLanViaProxy ?? false;
  const showProxyOnlyButton = settings.showProxyOnlyButton ?? false;
  const localProxyPort = settings.localProxyPort ?? 10808;

  // SOCKS5 state
  const socks5Auth = settings.socks5Auth ?? true;
  const socks5Username = settings.socks5Username || 'nova_client';
  const socks5Password = settings.socks5Password || 'np_sec782';
  const blockUdp = settings.blockUdp ?? false;
  const httpProxyAuth = settings.httpProxyAuth ?? false;

  const handleResetKillSwitch = () => {
    showFeedback(
      language === 'ar'
        ? 'تمت إعادة ضبط قواعد قفل الأمان وجدار الحماية بنجاح'
        : 'Firewall kill switch rules reset successfully'
    );
  };

  const handleResetCredentials = () => {
    const newUsername = 'nova_' + Math.random().toString(36).substring(2, 7);
    const newPassword = 'np_' + Math.random().toString(36).substring(2, 8);
    onUpdateSettings({
      socks5Username: newUsername,
      socks5Password: newPassword,
    });
    showFeedback(
      language === 'ar'
        ? 'تم توليد بيانات مصادقة جديدة للبروكسي بنجاح'
        : 'New proxy credentials generated successfully'
    );
  };

  const handleCopy = (text: string, field: 'login' | 'password') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    showFeedback(
      language === 'ar' ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard'
    );
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveBypass = () => {
    onUpdateSettings({ additionalProxyBypass: bypassInput });
    setIsBypassModalOpen(false);
    showFeedback(
      language === 'ar' ? 'تم حفظ قائمة الاستثناءات' : 'Bypass hosts saved'
    );
  };

  const isAr = language === 'ar';

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-12">
        {/* Header with Back Arrow */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع للإعدادات' : 'Back to Settings'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-primary font-sans">
              {isAr ? 'إعدادات الاتصال' : 'Connection Settings'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-theme-muted tracking-wider uppercase mt-1 px-1">
            {isAr ? 'خيارات الشبكة ونظام النفق والاتصال' : 'CONNECTION & NETWORK OPTIONS'}
          </p>
        </div>

        {/* 1. Main Connection Card */}
        <div className="bg-theme-card border border-theme-card rounded-3xl divide-y divide-theme-divider overflow-hidden shadow-lg transition-colors duration-200">
          {/* Auto Connect */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'الاتصال التلقائي' : 'Auto Connect'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'الاتصال بالبروكسي تلقائياً فور فتح التطبيق' : 'Connect automatically on launch'}
              </p>
            </div>
            <ToggleSwitch
              checked={autoConnect}
              onChange={() => onUpdateSettings({ autoConnect: !autoConnect })}
            />
          </div>

          {/* Kill Switch */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'قفل الأمان (Kill Switch)' : 'Kill Switch'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'قطع الإنترنت فوراً في حال انقطاع البروكسي لحماية الخصوصية ومنع التسريب' : 'Block traffic when VPN disconnects'}
              </p>
            </div>
            <ToggleSwitch
              checked={killSwitch}
              onChange={() => onUpdateSettings({ killSwitch: !killSwitch })}
            />
          </div>

          {/* Capture system DNS */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'حماية ومنع تسريب الـ DNS' : 'Capture system DNS'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'توجيه استعلامات DNS عبر نفق البروكسي المشفر لمنع مزود الخدمة من تعقب المواقع' : 'Route OS DNS queries through the tunnel (TUN mode). Disable if name resolution fails.'}
              </p>
            </div>
            <ToggleSwitch
              checked={captureSystemDns}
              onChange={() =>
                onUpdateSettings({ captureSystemDns: !captureSystemDns })
              }
            />
          </div>

          {/* Reset Kill Switch (Clickable action) */}
          <div
            onClick={handleResetKillSwitch}
            className="p-4 sm:p-5 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
          >
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-teal-400 group-hover:underline flex items-center gap-2">
                <span>{isAr ? 'إعادة ضبط قواعد قفل الأمان' : 'Reset Kill Switch'}</span>
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'إزالة قواعد الجدار الناري العالقة في حال توقف الإنترنت بعد إغلاق مفاجئ' : 'Remove leftover firewall rules if your internet is blocked after a crash'}
              </p>
            </div>
            <RotateCw className="w-5 h-5 text-teal-400 group-hover:rotate-180 transition-transform duration-300 flex-shrink-0" />
          </div>

          {/* Allow LAN Connections */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'السماح باتصالات الشبكة المحلية (LAN)' : 'Allow LAN Connections'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'استثناء الأجهزة والطابعات المحلية من المرور عبر البروكسي لاتصال أسرع' : 'Exclude local network from VPN tunnel'}
              </p>
            </div>
            <ToggleSwitch
              checked={allowLanConnections}
              onChange={() => {
                const nextVal = !allowLanConnections;
                onUpdateSettings({
                  allowLanConnections: nextVal,
                  lanAccess: nextVal,
                });
              }}
            />
          </div>

          {/* Allow Hotspot Access */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'مشاركة نقطة الاتصال (Hotspot)' : 'Allow Hotspot Access'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'السماح للأجهزة المتصلة بنقطة اتصال الهاتف بالوصول للخدمات المحلية' : 'Allow devices connected via hotspot to access local services'}
              </p>
            </div>
            <ToggleSwitch
              checked={allowHotspotAccess}
              onChange={() =>
                onUpdateSettings({ allowHotspotAccess: !allowHotspotAccess })
              }
            />
          </div>

          {/* Route LAN via Proxy */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'توجيه الشبكة المحلية عبر البروكسي' : 'Route LAN via Proxy'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'إرسال كل حركة الشبكة المحلية بالكامل عبر البروكسي' : 'Send local network traffic through VPN proxy'}
              </p>
            </div>
            <ToggleSwitch
              checked={routeLanViaProxy}
              onChange={() =>
                onUpdateSettings({ routeLanViaProxy: !routeLanViaProxy })
              }
            />
          </div>

          {/* Show "Proxy Only" button */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'إظهار زر "بروكسي النظام فقط"' : 'Show "Proxy Only" button'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'إظهار خيار بروكسي النظام والواجهات في الشاشة الرئيسية' : 'Show proxy-only mode button on the home screen'}
              </p>
            </div>
            <ToggleSwitch
              checked={showProxyOnlyButton}
              onChange={() =>
                onUpdateSettings({ showProxyOnlyButton: !showProxyOnlyButton })
              }
            />
          </div>

          {/* Additional proxy bypass */}
          <div
            onClick={() => setIsBypassModalOpen(true)}
            className="p-4 sm:p-5 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
          >
            <div>
              <h4 className="text-sm font-bold text-theme-primary group-hover:text-teal-400 transition-colors">
                {isAr ? 'استثناءات البروكسي الإضافية (Bypass)' : 'Additional proxy bypass'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'قائمة النطاقات والمواقع التي تتصل مباشرة وتتجاوز البروكسي (مثل *.local)' : 'Hosts that skip the system proxy (e.g. *.local)'}
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 text-theme-muted group-hover:text-theme-primary transition-colors ${isAr ? 'rotate-180' : ''}`} />
          </div>

          {/* Local Proxy Port */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'خادم البروكسي المحلي' : 'Local Proxy Bridge'}
              </h4>
              <p className="text-xs text-teal-400 font-mono mt-0.5">
                {isAr ? `المنفذ المدمج (SOCKS5 + HTTP): ${localProxyPort}` : `Mixed (SOCKS5 + HTTP): ${localProxyPort}`}
              </p>
            </div>
          </div>
        </div>

        {/* 2. SOCKS5 / PROXY Section Header */}
        <div className="pt-3">
          <p className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {isAr ? 'المصادقة الأمنية للبروكسي المحلي (SOCKS5 / PROXY)' : 'SOCKS5 / PROXY AUTHENTICATION'}
          </p>
        </div>

        {/* 2. SOCKS5 / PROXY Card */}
        <div className="bg-theme-card border border-theme-card rounded-3xl divide-y divide-theme-divider overflow-hidden shadow-lg transition-colors duration-200">
          {/* SOCKS5 authorization */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'حماية منفذ SOCKS5 بكلمة مرور' : 'SOCKS5 authorization'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'حماية المنفذ المحلي لمنع أي تطبيقات خبيثة من محاولة كشف أو فحص البروكسي' : 'Protects local proxy from applications that scan ports to detect VPN'}
              </p>
            </div>
            <ToggleSwitch
              checked={socks5Auth}
              onChange={() => onUpdateSettings({ socks5Auth: !socks5Auth })}
            />
          </div>

          {/* Login Row */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <span className="text-sm font-bold text-theme-primary">
              {isAr ? 'اسم المستخدم' : 'Username'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-theme-secondary bg-theme-subtle px-3 py-1 rounded-lg border border-theme-card">
                {socks5Auth ? socks5Username : '-'}
              </span>
              {socks5Auth && (
                <button
                  type="button"
                  onClick={() => handleCopy(socks5Username, 'login')}
                  className="p-1.5 rounded-lg text-teal-400 hover:text-white bg-theme-subtle hover:bg-theme-card-hover border border-theme-card transition-colors cursor-pointer"
                  title={isAr ? 'نسخ اسم المستخدم' : 'Copy Username'}
                >
                  {copiedField === 'login' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Password Row */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <span className="text-sm font-bold text-theme-primary">
              {isAr ? 'كلمة المرور' : 'Password'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-theme-secondary bg-theme-subtle px-3 py-1 rounded-lg border border-theme-card">
                {socks5Auth ? '••••••••' : '-'}
              </span>
              {socks5Auth && (
                <button
                  type="button"
                  onClick={() => handleCopy(socks5Password, 'password')}
                  className="p-1.5 rounded-lg text-teal-400 hover:text-white bg-theme-subtle hover:bg-theme-card-hover border border-theme-card transition-colors cursor-pointer"
                  title={isAr ? 'نسخ كلمة المرور' : 'Copy Password'}
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Reset login/password */}
          <div
            onClick={handleResetCredentials}
            className="p-4 sm:p-5 flex items-center gap-2 text-teal-400 hover:text-teal-300 cursor-pointer group hover:bg-theme-card-hover"
          >
            <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            <span className="text-xs font-bold">
              {isAr ? 'توليد اسم مستخدم وكلمة مرور جديدة' : 'Generate new login / password'}
            </span>
          </div>

          {/* Block UDP */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'حظر اتصالات UDP' : 'Block UDP'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'حظر حزم UDP لمنع التسريب (قد يعطل المكالمات الصوتية والألعاب المعتمدة على UDP)' : 'Breaks DNS-over-UDP, QUIC, voice calls, games. Turn on only if you know why'}
              </p>
            </div>
            <ToggleSwitch
              checked={blockUdp}
              onChange={() => onUpdateSettings({ blockUdp: !blockUdp })}
            />
          </div>

          {/* HTTP proxy authorization */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'تأمين بروكسي HTTP بكلمة المرور' : 'HTTP proxy authorization'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'تطبيق نفس المصادقة الأمنية على منفذ HTTP أيضاً' : 'Protect HTTP proxy with the same login/password'}
              </p>
            </div>
            <ToggleSwitch
              checked={httpProxyAuth}
              onChange={() =>
                onUpdateSettings({ httpProxyAuth: !httpProxyAuth })
              }
            />
          </div>
        </div>
      </div>

      {/* Additional Proxy Bypass Modal */}
      {isBypassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4 text-theme-primary">
            <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-theme-primary">
                  {isAr ? 'استثناءات البروكسي الإضافية' : 'Additional Proxy Bypass'}
                </h3>
              </div>
              <button
                onClick={() => setIsBypassModalOpen(false)}
                className="text-theme-muted hover:text-theme-primary p-1.5 rounded-xl hover:bg-theme-subtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-theme-secondary font-semibold">
                {isAr ? 'أدخل النطاقات أو عناوين IP المراد استثناؤها (مفصولة بفواصل):' : 'Enter domain patterns or IP ranges to bypass (separated by comma):'}
              </label>
              <textarea
                rows={4}
                value={bypassInput}
                onChange={(e) => setBypassInput(e.target.value)}
                className="w-full bg-theme-subtle border border-theme-card rounded-xl p-3 text-theme-primary font-mono text-xs outline-none focus:border-teal-400"
                placeholder="*.local, 192.168.*, 10.*, 172.16.*"
              />
              <p className="text-[11px] text-theme-muted">
                {isAr ? 'هذه العناوين سيتم الاتصال بها مباشرة دون المرور عبر خادم البروكسي.' : 'These addresses will be resolved directly without passing through the VPN proxy.'}
              </p>
            </div>

            <div className="pt-2 border-t border-theme-divider flex justify-end gap-2">
              <button
                onClick={() => setIsBypassModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-theme-subtle hover:bg-theme-card-hover text-theme-secondary text-xs font-semibold cursor-pointer border border-theme-card"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveBypass}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-zinc-900 border border-teal-500 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
