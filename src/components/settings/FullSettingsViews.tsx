import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  MinusCircle,
  PlusCircle,
  ExternalLink,
  QrCode,
  Link as LinkIcon,
  Search,
  ShieldCheck,
  Clock,
  Gauge,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { AppSettings, Server, TrafficStats } from '../../types';

// Helper for formatting duration
function formatDuration(seconds: number, isAr: boolean): string {
  if (!seconds || seconds <= 0) return isAr ? '0 ثانية' : '0 sec';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return isAr ? `${hrs} س ${mins} د` : `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return isAr ? `${mins} د ${secs} ث` : `${mins}m ${secs}s`;
  }
  return isAr ? `${secs} ثانية` : `${secs} sec`;
}

// Helper for formatting bytes
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ==========================================
// 1. STATISTICS VIEW (matches screenshot 1)
// ==========================================
interface StatisticsViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
  trafficStats?: TrafficStats;
  onResetStats?: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  onBack,
  language,
  trafficStats,
  onResetStats,
}) => {
  const isAr = language === 'ar';
  const [toast, setToast] = useState<string | null>(null);

  // Stored stats or props
  const [todayOffset, setTodayOffset] = useState({ sent: 0, received: 0, time: 0 });
  const [totalOffset, setTotalOffset] = useState({ sent: 0, received: 0, time: 0, connections: 0 });

  const currentUploaded = trafficStats?.totalUploaded || 0;
  const currentDownloaded = trafficStats?.totalDownloaded || 0;
  const currentDuration = trafficStats?.connectedDuration || 0;

  const todaySent = Math.max(0, currentUploaded - todayOffset.sent);
  const todayReceived = Math.max(0, currentDownloaded - todayOffset.received);
  const todayTime = Math.max(0, currentDuration - todayOffset.time);

  const totalSent = Math.max(0, currentUploaded - totalOffset.sent);
  const totalReceived = Math.max(0, currentDownloaded - totalOffset.received);
  const totalTime = Math.max(0, currentDuration - totalOffset.time);
  const totalConnections = currentDuration > 0 ? 1 : 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleResetToday = () => {
    setTodayOffset({
      sent: currentUploaded,
      received: currentDownloaded,
      time: currentDuration,
    });
    showToast(isAr ? 'تمت إعادة تعيين إحصائيات اليوم بنجاح' : 'Today stats reset successfully');
  };

  const handleResetAll = () => {
    setTodayOffset({ sent: currentUploaded, received: currentDownloaded, time: currentDuration });
    setTotalOffset({ sent: currentUploaded, received: currentDownloaded, time: currentDuration, connections: 0 });
    onResetStats?.();
    showToast(isAr ? 'تم تصفير كافة الإحصائيات' : 'All statistics reset to zero');
  };

  // Weekly days
  const weekDays = [
    { en: 'WED', ar: 'الأربعاء', active: false },
    { en: 'THU', ar: 'الخميس', active: false },
    { en: 'FRI', ar: 'الجمعة', active: false },
    { en: 'SAT', ar: 'السبت', active: false },
    { en: 'SUN', ar: 'الأحد', active: false },
    { en: 'MON', ar: 'الإثنين', active: false },
    { en: 'TUE', ar: 'الثلاثاء', active: true },
  ];

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع' : 'Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {isAr ? 'الإحصائيات' : 'Statistics'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mt-1 px-1">
            {isAr ? 'بيانات استهلاك حركة المرور والاتصال' : 'SYSTEM TRAFFIC & USAGE'}
          </p>
        </div>

        {/* 1. Today Card */}
        <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-5 shadow-sm space-y-3.5">
          <span className="text-xs font-bold text-zinc-300">
            {isAr ? 'اليوم' : 'Today'}
          </span>

          {/* Dual Bar */}
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: todaySent + todayReceived > 0 ? `${(todaySent / (todaySent + todayReceived)) * 100}%` : '50%' }}
            />
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: todaySent + todayReceived > 0 ? `${(todayReceived / (todaySent + todayReceived)) * 100}%` : '50%' }}
            />
          </div>

          {/* Metrics */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">{isAr ? 'المُرسَل' : 'Sent'}</span>
              <span className="font-bold font-mono text-white">{formatBytes(todaySent)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-400">{isAr ? 'المُستقبَل' : 'Received'}</span>
              <span className="font-bold font-mono text-white">{formatBytes(todayReceived)}</span>
            </div>
          </div>

          {/* Connection time */}
          <div className="pt-2 border-t border-zinc-800/80">
            <p className="text-[11px] text-zinc-400">{isAr ? 'وقت الاتصال' : 'Connection time'}</p>
            <p className="text-sm font-bold text-white font-mono mt-0.5">{formatDuration(todayTime, isAr)}</p>
          </div>
        </div>

        {/* 2. Total Card */}
        <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-5 shadow-sm space-y-3.5">
          <span className="text-xs font-bold text-zinc-300">
            {isAr ? 'الإجمالي' : 'Total'}
          </span>

          {/* Dual Bar */}
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: totalSent + totalReceived > 0 ? `${(totalSent / (totalSent + totalReceived)) * 100}%` : '50%' }}
            />
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: totalSent + totalReceived > 0 ? `${(totalReceived / (totalSent + totalReceived)) * 100}%` : '50%' }}
            />
          </div>

          {/* Metrics */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">{isAr ? 'المُرسَل' : 'Sent'}</span>
              <span className="font-bold font-mono text-white">{formatBytes(totalSent)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-400">{isAr ? 'المُستقبَل' : 'Received'}</span>
              <span className="font-bold font-mono text-white">{formatBytes(totalReceived)}</span>
            </div>
          </div>

          {/* Connection time & Connections count */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-400">{isAr ? 'وقت الاتصال' : 'Connection time'}</p>
              <p className="text-sm font-bold text-white font-mono mt-0.5">{formatDuration(totalTime, isAr)}</p>
            </div>
            <div className="text-right rtl:text-left">
              <p className="text-[11px] text-zinc-400">{isAr ? 'الاتصالات' : 'Connections'}</p>
              <p className="text-sm font-bold text-white font-mono mt-0.5">{totalConnections}</p>
            </div>
          </div>
        </div>

        {/* 3. Weekly Section */}
        <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-5 shadow-sm space-y-4">
          <span className="text-xs font-bold text-zinc-300">
            {isAr ? 'أسبوعي' : 'Weekly'}
          </span>

          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
            {weekDays.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex justify-center items-end h-20">
                  <div
                    className={`w-6 sm:w-8 rounded-full transition-all duration-300 ${
                      d.active
                        ? 'h-3 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                        : 'h-1.5 bg-zinc-700/60'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  {isAr ? d.ar.slice(0, 3) : d.en}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Two Metric Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Tile 1: Total time */}
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">{isAr ? 'الوقت الكلي' : 'Total time'}</p>
              <p className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                {formatDuration(totalTime, isAr)}
              </p>
            </div>
          </div>

          {/* Tile 2: Connections */}
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">{isAr ? 'الاتصالات' : 'Connections'}</p>
              <p className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                {totalConnections}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Bottom Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleResetToday}
            className="py-3 px-4 rounded-xl bg-[#181b20] hover:bg-[#20242b] border border-[#232730] text-zinc-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer text-center"
          >
            {isAr ? 'إعادة تعيين اليوم' : 'Reset today'}
          </button>
          <button
            onClick={handleResetAll}
            className="py-3 px-4 rounded-xl bg-[#181b20] hover:bg-rose-950/20 border border-[#232730] hover:border-rose-900/40 text-rose-500 hover:text-rose-400 font-semibold text-xs sm:text-sm transition-all cursor-pointer text-center"
          >
            {isAr ? 'إعادة تعيين الكل' : 'Reset all'}
          </button>
        </div>

        {/* Feedback Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold shadow-2xl z-50 animate-fadeIn">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. PING SETTINGS VIEW (matches screenshot 2)
// ==========================================
interface PingSettingsViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const PingSettingsView: React.FC<PingSettingsViewProps> = ({
  onBack,
  language,
  settings,
  onUpdateSettings,
}) => {
  const isAr = language === 'ar';
  const protocol = settings.pingProtocol || 'nova';
  const displayMode = settings.pingDisplay || 'numbers';
  const targetUrl = settings.pingTargetUrl || 'https://www.gstatic.com/generate_204';
  const timeout = settings.pingTimeout || 3;

  const presets = [
    { id: 'google', name: 'Google 204', url: 'https://www.gstatic.com/generate_204' },
    { id: 'cloudflare', name: 'Cloudflare', url: 'https://1.1.1.1/cdn-cgi/trace' },
    { id: 'apple', name: 'Apple', url: 'https://captive.apple.com/hotspot-detect.html' },
  ];

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع' : 'Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {isAr ? 'إعدادات الفحص السريع' : 'Ping Settings'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mt-1 px-1">
            {isAr ? 'بروتوكولات فحص زمن الاستجابة وعرض البينج' : 'LATENCY TEST & PROBING'}
          </p>
        </div>

        {/* 1. PROTOCOL */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'البروتوكول' : 'PROTOCOL'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'nova', label: 'Nova Ping' },
              { id: 'tcp', label: 'TCP' },
              { id: 'http_get', label: 'HTTP GET' },
              { id: 'http_head', label: 'HTTP HEAD' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onUpdateSettings({ pingProtocol: item.id as any })}
                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center truncate ${
                  protocol === item.id
                    ? 'bg-[#1b253b] border border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-[#181b20] border border-[#232730] text-zinc-400 hover:text-white hover:bg-[#20242b]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. PING DISPLAY */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'عرض البينج' : 'PING DISPLAY'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'numbers', en: 'Numbers', ar: 'الأرقام' },
              { id: 'scale', en: 'Scale', ar: 'المقياس' },
              { id: 'both', en: 'Both', ar: 'كلاهما' },
              { id: 'dots', en: 'Dots', ar: 'النقاط' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onUpdateSettings({ pingDisplay: item.id as any })}
                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center truncate ${
                  displayMode === item.id
                    ? 'bg-[#1b253b] border border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-[#181b20] border border-[#232730] text-zinc-400 hover:text-white hover:bg-[#20242b]'
                }`}
              >
                {isAr ? item.ar : item.en}
              </button>
            ))}
          </div>
        </div>

        {/* 3. TEST URL */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'رابط الاختبار' : 'TEST URL'}
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={targetUrl}
              onChange={e => onUpdateSettings({ pingTargetUrl: e.target.value })}
              className="w-full bg-[#181b20] border border-[#232730] focus:border-blue-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-mono outline-none transition-colors"
            />

            {/* Presets List */}
            <div className="bg-[#181b20] border border-[#232730] rounded-2xl divide-y divide-[#232730] overflow-hidden">
              <div className="px-4 py-2 text-[11px] font-bold text-zinc-400 uppercase">
                {isAr ? 'الإعدادات المسبقة' : 'Presets'}
              </div>
              {presets.map(preset => {
                const isSelected = targetUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onUpdateSettings({ pingTargetUrl: preset.url })}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#20242b] transition-colors cursor-pointer text-left rtl:text-right"
                  >
                    <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-blue-400' : 'text-zinc-300'}`}>
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. TIMEOUT */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'المهلة' : 'TIMEOUT'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                {isAr ? 'مهلة فحص البينج' : 'Ping Timeout'}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isAr ? 'أقصى وقت انتظار لاستجابة فحص الاتصال' : 'Maximum wait time for ping response'}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSettings({ pingTimeout: Math.max(1, timeout - 1) })}
                className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
              >
                -
              </button>
              <span className="w-12 text-center font-mono font-bold text-blue-400 text-xs sm:text-sm px-2 py-1 bg-[#141a24] rounded-lg border border-blue-500/20">
                {timeout}s
              </span>
              <button
                onClick={() => onUpdateSettings({ pingTimeout: Math.min(15, timeout + 1) })}
                className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ADVANCED SETTINGS VIEW (matches screenshot 3)
// ==========================================
interface AdvancedSettingsViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const AdvancedSettingsView: React.FC<AdvancedSettingsViewProps> = ({
  onBack,
  language,
  settings,
  onUpdateSettings,
}) => {
  const isAr = language === 'ar';
  const idleTimeout = settings.idleTimeout ?? 300;
  const tcpMax = settings.tcpMaxConnections ?? 256;
  const udpMax = settings.udpMaxConnections ?? 128;
  const excludedRoutes = settings.excludedRoutes ?? ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8'];

  const [isExcludedOpen, setIsExcludedOpen] = useState(false);
  const [newCidr, setNewCidr] = useState('');

  const handleAddCidr = () => {
    if (!newCidr.trim()) return;
    const updated = [...excludedRoutes, newCidr.trim()];
    onUpdateSettings({ excludedRoutes: updated });
    setNewCidr('');
  };

  const handleRemoveCidr = (idx: number) => {
    const updated = excludedRoutes.filter((_, i) => i !== idx);
    onUpdateSettings({ excludedRoutes: updated });
  };

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع' : 'Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {isAr ? 'إعدادات متقدمة' : 'Advanced Settings'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mt-1 px-1">
            {isAr ? 'خيارات ضبط النواة وتدفق الاتصالات' : 'KERNEL & CONNECTION TUNING'}
          </p>
        </div>

        {/* 1. CONNECTIONS */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'الاتصالات' : 'CONNECTIONS'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl divide-y divide-[#232730] overflow-hidden">
            {/* Idle Timeout */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  {isAr ? 'مهلة الخمول' : 'Idle Timeout'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isAr ? 'إغلاق الاتصالات الخاملة بعد' : 'Close idle connections after'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateSettings({ idleTimeout: Math.max(30, idleTimeout - 30) })}
                  className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
                >
                  -
                </button>
                <span className="w-14 text-center font-mono font-bold text-blue-400 text-xs sm:text-sm px-2 py-1 bg-[#141a24] rounded-lg border border-blue-500/20">
                  {idleTimeout}s
                </span>
                <button
                  onClick={() => onUpdateSettings({ idleTimeout: Math.min(1800, idleTimeout + 30) })}
                  className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* TCP Max Connections */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  {isAr ? 'أقصى اتصالات TCP' : 'TCP Max Connections'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isAr ? 'الحد الأقصى لاتصالات TCP المتزامنة' : 'Maximum concurrent TCP connections'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateSettings({ tcpMaxConnections: Math.max(32, tcpMax - 32) })}
                  className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
                >
                  -
                </button>
                <span className="w-14 text-center font-mono font-bold text-blue-400 text-xs sm:text-sm px-2 py-1 bg-[#141a24] rounded-lg border border-blue-500/20">
                  {tcpMax}
                </span>
                <button
                  onClick={() => onUpdateSettings({ tcpMaxConnections: Math.min(2048, tcpMax + 32) })}
                  className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* UDP Max Connections */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  {isAr ? 'أقصى اتصالات UDP' : 'UDP Max Connections'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isAr ? 'الحد الأقصى لاتصالات UDP المتزامنة' : 'Maximum concurrent UDP connections'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateSettings({ udpMaxConnections: Math.max(16, udpMax - 16) })}
                  className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
                >
                  -
                </button>
                <span className="w-14 text-center font-mono font-bold text-blue-400 text-xs sm:text-sm px-2 py-1 bg-[#141a24] rounded-lg border border-blue-500/20">
                  {udpMax}
                </span>
                <button
                  onClick={() => onUpdateSettings({ udpMaxConnections: Math.min(1024, udpMax + 16) })}
                  className="w-8 h-8 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 flex items-center justify-center font-bold text-base cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ROUTES */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'المسارات' : 'ROUTES'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl overflow-hidden">
            <button
              onClick={() => setIsExcludedOpen(!isExcludedOpen)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#20242b] transition-colors cursor-pointer text-left rtl:text-right"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <MinusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">
                    {isAr ? 'المسارات المستثناة' : 'Excluded Routes'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isAr ? 'نطاقات CIDR المستثناة من نفق VPN' : 'CIDR ranges excluded from VPN tunnel'}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isExcludedOpen ? 'rotate-90' : isAr ? 'rotate-180' : ''}`} />
            </button>

            {/* Expandable CIDR Editor */}
            {isExcludedOpen && (
              <div className="p-4 border-t border-[#232730] space-y-3 bg-black/20">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCidr}
                    onChange={e => setNewCidr(e.target.value)}
                    placeholder="e.g. 192.168.1.0/24"
                    className="flex-1 bg-[#14171a] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                  <button
                    onClick={handleAddCidr}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isAr ? 'إضافة' : 'Add'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {excludedRoutes.map((cidr, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#14171a] border border-[#232730] text-xs font-mono">
                      <span className="text-zinc-300">{cidr}</span>
                      <button
                        onClick={() => handleRemoveCidr(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title={isAr ? 'حذف' : 'Remove'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. TUNNEL LOGS VIEW (matches screenshot 4)
// ==========================================
interface TunnelLogsViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
}

export const TunnelLogsView: React.FC<TunnelLogsViewProps> = ({ onBack, language }) => {
  const isAr = language === 'ar';
  const [logLevel, setLogLevel] = useState<'None' | 'Info' | 'Debug' | 'Warning' | 'Error'>('None');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Realistic tunnel logs matching screenshot
  const initialLogs = [
    { line: 1, text: '[SingleInstance] Mutex locked for instance id: novaproxy-core-01' },
    { line: 2, text: '[INFO/CORE] NovaCore engine v26.10.28 initializing' },
    { line: 3, text: '[INFO/ROUTING] Rule set loaded: bypass-lan, direct-country, proxy-all' },
    { line: 4, text: '[INFO/TUN] Creating TUN virtual interface (mtu: 1420)' },
    { line: 5, text: '[INFO/TUN] TUN interface state up: ip 172.19.0.1/30, dns 198.18.0.2' },
    { line: 6, text: '[INFO/DNS] FakeDNS pool allocated 198.18.0.0/15' },
    { line: 7, text: '[INFO/APP] Outbound connector [VLESS Reality] initialized' },
    { line: 8, text: '[DEBUG] Reality handshake: dest=gateway.icloud.com:443, latency=34ms' },
    { line: 9, text: '[INFO/TLS] TLS 1.3 session negotiated with uTLS fingerprint Chrome_120' },
    { line: 10, text: '[INFO] Routing table applied: 34 default CIDR rules cached' },
    { line: 11, text: '[DEBUG] tcp:1.1.1.1:443 -> proxied via outbound node [VLESS]' },
    { line: 12, text: '[DEBUG] tcp:142.250.180.206:443 -> direct (Google GeoIP)' },
    { line: 13, text: '[INFO] Inbound connection active, speed limit: unlimited' },
    { line: 14, text: '[INFO] Memory monitor: current 38 MB / threshold 256 MB' },
    { line: 15, text: '[DEBUG] udp:8.8.8.8:53 -> DNS intercept -> FakeDNS 198.18.0.24' },
    { line: 16, text: '[INFO] Multiplexing (Mux) established: 8 concurrent sub-streams' },
    { line: 17, text: '[INFO] Keepalive ping returned: 28ms (target: gstatic.com/generate_204)' },
  ];

  const [logs, setLogs] = useState(initialLogs);

  const filteredLogs = logs.filter(l =>
    l.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = () => {
    const text = filteredLogs.map(l => `${l.line}  ${l.text}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = filteredLogs.map(l => `${l.line}  ${l.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaproxy-tunnel-logs-${Date.now()}.log`;
    a.click();
  };

  const handleDelete = () => {
    setLogs([]);
  };

  const handleRefresh = () => {
    setLogs(initialLogs);
  };

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
                title={isAr ? 'الرجوع' : 'Back'}
              >
                <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                {isAr ? 'سجلات النفق' : 'Tunnel Logs'}
              </h1>
            </div>

            {/* Log level selector */}
            <div className="relative">
              <select
                value={logLevel}
                onChange={e => setLogLevel(e.target.value as any)}
                className="bg-theme-subtle border border-theme-card text-theme-primary rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer appearance-none pr-7 rtl:pr-3 rtl:pl-7"
              >
                <option value="None">None</option>
                <option value="Info">Info</option>
                <option value="Debug">Debug</option>
                <option value="Warning">Warning</option>
                <option value="Error">Error</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 rtl:right-auto rtl:left-2 top-2.5 pointer-events-none" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 px-1">
            {isAr
              ? 'سجل أحداث النواة، توجيه الحزم، وتشخيص الاتصال المباشر'
              : 'Logs of all tunnel events, network packets and diagnostic records'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'نص، عنوان IP، أو نطاق...' : 'Text, IP or domain'}
            className="w-full bg-[#181b20] border border-[#232730] focus:border-blue-500 rounded-2xl pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 text-xs sm:text-sm text-white outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Filter Count Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="px-3 py-1 rounded-lg bg-[#181b20] border border-[#232730] text-blue-400 font-bold">
            {isAr ? 'الكل' : 'All'}
          </span>
          <span className="text-zinc-400 font-mono">
            {filteredLogs.length} / {logs.length}
          </span>
        </div>

        {/* Code / Log Console Viewer */}
        <div className="bg-[#0f1214] border border-[#232730] rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto space-y-1.5 shadow-inner">
          {filteredLogs.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">{isAr ? 'لا توجد سجلات تطابق البحث' : 'No logs found'}</p>
          ) : (
            filteredLogs.map(item => (
              <div key={item.line} className="flex items-start gap-3 leading-relaxed">
                <span className="text-zinc-600 select-none w-6 text-right flex-shrink-0">{item.line}</span>
                <span className={`break-all ${
                  item.text.includes('INFO') ? 'text-zinc-300' :
                  item.text.includes('DEBUG') ? 'text-blue-400/90' :
                  item.text.includes('WARN') ? 'text-amber-400' :
                  item.text.includes('ERR') ? 'text-rose-400' : 'text-zinc-400'
                }`}>
                  {item.text}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bottom Action Bar (4 Buttons) */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="py-3 px-2 rounded-xl bg-[#181b20] hover:bg-[#20242b] border border-[#232730] text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="py-3 px-2 rounded-xl bg-[#181b20] hover:bg-[#20242b] border border-[#232730] text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
          </button>

          {/* Export all */}
          <button
            onClick={handleExport}
            className="py-3 px-2 rounded-xl bg-[#181b20] hover:bg-[#20242b] border border-[#232730] text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير الكل' : 'Export all'}</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="py-3 px-2 rounded-xl bg-[#181b20] hover:bg-rose-950/20 border border-[#232730] hover:border-rose-900/40 text-rose-500 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'حذف' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. URL SCHEMES VIEW (matches screenshots 5 & 6)
// ==========================================
interface UrlSchemesViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
}

export const UrlSchemesView: React.FC<UrlSchemesViewProps> = ({ onBack, language }) => {
  const isAr = language === 'ar';
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const schemeSections = [
    {
      titleEn: 'Start Connection',
      titleAr: 'بدء الاتصال',
      items: [
        { cmd: 'novaproxy://connect', descEn: 'Connect to the active server', descAr: 'الاتصال بالخادم النشط فوراً' },
        { cmd: 'novaproxy://open', descEn: 'Open application and connect', descAr: 'فتح التطبيق وبدء الاتصال' },
      ],
    },
    {
      titleEn: 'Stop Connection',
      titleAr: 'إيقاف الاتصال',
      items: [
        { cmd: 'novaproxy://disconnect', descEn: 'Disconnect the active VPN tunnel', descAr: 'فصل نفق VPN النشط' },
        { cmd: 'novaproxy://close', descEn: 'Disconnect tunnel and close application', descAr: 'قطع الاتصال وإغلاق التطبيق' },
      ],
    },
    {
      titleEn: 'Toggle Connection',
      titleAr: 'تبديل حالة الاتصال',
      items: [
        { cmd: 'novaproxy://toggle', descEn: 'Switch tunnel state between connect and disconnect', descAr: 'تبديل حالة الاتصال بين تشغيل وإيقاف' },
      ],
    },
    {
      titleEn: 'Add Configuration',
      titleAr: 'إضافة التكوين والخوادم',
      items: [
        { cmd: 'novaproxy://import/{base64}', descEn: 'Import multiple proxy servers encoded in Base64', descAr: 'استيراد خوادم مشفرة بصيغة Base64' },
        { cmd: 'novaproxy://add/{url}', descEn: 'Add subscription link or direct server URI', descAr: 'إضافة رابط اشتراك أو رابط خادم' },
      ],
    },
    {
      titleEn: 'Routing',
      titleAr: 'التوجيه المخصص',
      items: [
        { cmd: 'novaproxy://routing/add/{base64}', descEn: 'Add custom routing rule in Base64 format', descAr: 'إضافة قاعدة توجيه مخصصة' },
        { cmd: 'novaproxy://routing/onadd/{base64}', descEn: 'Enable routing mode and add rule', descAr: 'تفعيل نمط التوجيه وإضافة القاعدة' },
      ],
    },
  ];

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع' : 'Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {isAr ? 'روابط التشغيل السريع' : 'URL Schemes'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mt-1 px-1">
            {isAr ? 'التحكم الخارجي والأتمتة عبر روابط النظام' : 'AUTOMATION & EXTERNAL CONTROL'}
          </p>
        </div>

        {/* Scheme Sections */}
        {schemeSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
              {isAr ? sec.titleAr : sec.titleEn}
            </label>
            <div className="bg-[#181b20] border border-[#232730] rounded-2xl divide-y divide-[#232730] overflow-hidden">
              {sec.items.map((item, iIdx) => {
                const isCopied = copiedCmd === item.cmd;
                return (
                  <div key={iIdx} className="p-4 flex items-center justify-between hover:bg-[#20242b] transition-colors">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white font-mono">
                        {item.cmd}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(item.cmd)}
                      className="p-2 rounded-xl bg-[#222731] hover:bg-[#2c3340] text-zinc-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                      title={isAr ? 'نسخ الرابط' : 'Copy scheme'}
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom Info Card */}
        <div className="p-4 rounded-2xl bg-[#14171a] border border-[#232730] flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            {isAr
              ? 'يمكن استخدام روابط URL Schemes للتحكم في NovaProxy من خلال الاختصارات (Shortcuts)، الودجات، تطبيقات الطرف الثالث (مثل Tasker)، أو سطر الأوامر.'
              : 'These URL schemes can be used to control NovaProxy from scripts, shortcuts, widgets, third-party apps, or browser links on Android and other operating systems.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. BACKUP VIEW (matches screenshot 7)
// ==========================================
interface BackupViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
  servers?: Server[];
  settings: AppSettings;
  onRestore?: (servers: Server[], settings: AppSettings) => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  onBack,
  language,
  servers = [],
  settings,
  onRestore,
}) => {
  const isAr = language === 'ar';
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [incServers, setIncServers] = useState(true);
  const [incSettings, setIncSettings] = useState(true);
  const [incLogs, setIncLogs] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const getBackupPayload = () => {
    return {
      appName: 'NovaProxy',
      version: '4.2.5',
      exportDate: new Date().toISOString(),
      servers: incServers ? servers : [],
      settings: incSettings ? settings : {},
      includeLogs: incLogs,
    };
  };

  const handleExport = () => {
    const payload = getBackupPayload();
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaproxy-backup-${Date.now()}.json`;
    a.click();
    showToast(isAr ? 'تم تنزيل النسخة الاحتياطية بنجاح' : 'Backup downloaded successfully');
  };

  const handleCopyLink = () => {
    const payload = getBackupPayload();
    navigator.clipboard?.writeText(JSON.stringify(payload));
    showToast(isAr ? 'تم نسخ بيانات النسخة الاحتياطية للحافظة' : 'Backup JSON copied to clipboard');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.servers || parsed.settings) {
          const restoredServers = Array.isArray(parsed.servers) ? parsed.servers : servers;
          const restoredSettings = parsed.settings && typeof parsed.settings === 'object' ? { ...settings, ...parsed.settings } : settings;
          onRestore?.(restoredServers, restoredSettings);
          showToast(isAr ? 'تمت استعادة النسخة الاحتياطية بنجاح' : 'Backup restored successfully');
        } else {
          showToast(isAr ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file');
        }
      } catch (err) {
        showToast(isAr ? 'حدث خطأ أثناء قراءة الملف' : 'Error reading backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const qrBackupString = encodeURIComponent(JSON.stringify({
    app: 'NovaProxy',
    v: '4.2.5',
    serversCount: servers.length,
    date: new Date().toISOString().slice(0, 10),
  }));

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع' : 'Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {isAr ? 'النسخ الاحتياطي' : 'Backup'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mt-1 px-1">
            {isAr ? 'حفظ واسترجاع إعدادات وخوادم التطبيق' : 'CONFIGURATION BACKUP & RESTORE'}
          </p>
        </div>

        {/* 1. Create Backup Section */}
        <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'إنشاء نسخة احتياطية' : 'Create backup'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              {isAr
                ? 'حفظ كافة الاشتراكات، الخوادم، ملفات التوجيه، وإعدادات النظام'
                : 'Saves all subscriptions, servers, routing profiles and app settings'}
            </p>
          </div>

          {/* Big Export Button */}
          <button
            onClick={handleExport}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isAr ? 'تصدير النسخة' : 'Export'}</span>
          </button>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQrModalOpen(true)}
              className="py-3 px-3 rounded-xl bg-[#222731] hover:bg-[#2c3340] border border-[#2c3340] text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-teal-400" />
              <span>{isAr ? 'عرض كود QR' : 'Show QR'}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="py-3 px-3 rounded-xl bg-[#222731] hover:bg-[#2c3340] border border-[#2c3340] text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-4 h-4 text-blue-400" />
              <span>{isAr ? 'نسخ الرابط' : 'Copy link'}</span>
            </button>
          </div>

          {/* Advanced Dropdown */}
          <div className="pt-1">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              <span>{isAr ? 'خيارات متقدمة' : 'Advanced'}</span>
            </button>

            {isAdvancedOpen && (
              <div className="mt-3 p-3 bg-black/30 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incServers}
                    onChange={e => setIncServers(e.target.checked)}
                    className="accent-teal-500"
                  />
                  <span className="text-zinc-300">{isAr ? 'تضمين الخوادم والاشتراكات' : 'Include servers & subscriptions'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incSettings}
                    onChange={e => setIncSettings(e.target.checked)}
                    className="accent-teal-500"
                  />
                  <span className="text-zinc-300">{isAr ? 'تضمين إعدادات التطبيق' : 'Include app settings'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incLogs}
                    onChange={e => setIncLogs(e.target.checked)}
                    className="accent-teal-500"
                  />
                  <span className="text-zinc-300">{isAr ? 'تضمين سجلات التشخيص' : 'Include diagnostic logs'}</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* 2. Restore Section */}
        <div className="bg-[#181b20] border border-[#232730] rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'استعادة' : 'Restore'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              {isAr
                ? 'اختر ملف نسخة احتياطية (.json) لاستعادة كافة البيانات'
                : 'Pick a backup file (.json) to restore all data'}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 rounded-xl bg-[#222731] hover:bg-[#2c3340] border border-dashed border-zinc-600 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>{isAr ? 'اختيار ملف' : 'Choose file'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Bottom Note */}
        <div className="p-4 rounded-2xl bg-[#14171a] border border-[#232730] flex items-start gap-3">
          <Info className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            {isAr
              ? 'لأسباب أمنية مشددة، لا تتضمن النسخة الاحتياطية كلمات مرور SOCKS5 أو المفاتيح الخاصة بالشهادات.'
              : 'Backup does not include SOCKS5 passwords or confidential certificate private keys for security purposes.'}
          </p>
        </div>

        {/* QR Modal */}
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm bg-[#181b20] border border-[#232730] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">{isAr ? 'كود QR للنسخة الاحتياطية' : 'Backup QR Code'}</h3>
                <button onClick={() => setQrModalOpen(false)} className="text-zinc-500 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${qrBackupString}`}
                  alt="Backup QR"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <p className="text-xs text-zinc-400">
                {isAr ? 'امسح الكود بجهاز آخر لاسترجاع البيانات سريعاً' : 'Scan with another device to restore quickly'}
              </p>

              <button
                onClick={() => setQrModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold shadow-2xl z-50 animate-fadeIn">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 7. ABOUT VIEW (matches screenshots 8 & 9)
// ==========================================
interface AboutViewProps {
  onBack: () => void;
  language: 'en' | 'ar';
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, language }) => {
  const isAr = language === 'ar';
  const [copiedHwid, setCopiedHwid] = useState(false);
  const hwid = 'NP-8F4C-99B1-2E04';

  const handleCopyHwid = () => {
    navigator.clipboard?.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2000);
  };

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1.5 rounded-xl bg-theme-subtle border border-theme-card"
              title={isAr ? 'الرجوع' : 'Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {isAr ? 'حول التطبيق' : 'About'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mt-1 px-1">
            {isAr ? 'معلومات التطبيق، النواة، وتشخيص النظام' : 'APP INFO, CORE & SYSTEM DIAGNOSTICS'}
          </p>
        </div>

        {/* 1. Where to get servers? */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'من أين تحصل على الخوادم؟' : 'Where to get servers?'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between hover:bg-[#20242b] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">
                    {isAr ? 'البروكسيات والخوادم الموصى بها' : 'Recommended VPN'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isAr ? 'مزودو خوادم موثوقة وعالية السرعة متوافقة مع NovaProxy' : 'Trusted high-speed proxy providers'}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 ${isAr ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* 2. Information */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'معلومات النظام' : 'Information'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl divide-y divide-[#232730] overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'المحرك الأساسي' : 'Core / Engine'}</span>
              <span className="text-xs font-mono font-bold text-blue-400">NovaCore 26.10.28 (Xray/Sing-box)</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'إصدار التطبيق' : 'App Version'}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">v4.2.5</span>
            </div>
          </div>
        </div>

        {/* 3. Links */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'الروابط' : 'Links'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl divide-y divide-[#232730] overflow-hidden">
            <a
              href="https://novaproxy.net/terms"
              target="_blank"
              rel="noreferrer"
              className="p-4 flex items-center justify-between hover:bg-[#20242b] transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'شروط الخدمة' : 'Terms of Service'}</span>
              <ChevronRight className={`w-4 h-4 text-zinc-500 ${isAr ? 'rotate-180' : ''}`} />
            </a>
            <a
              href="https://novaproxy.net/privacy"
              target="_blank"
              rel="noreferrer"
              className="p-4 flex items-center justify-between hover:bg-[#20242b] transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
              <ChevronRight className={`w-4 h-4 text-zinc-500 ${isAr ? 'rotate-180' : ''}`} />
            </a>
            <div className="p-4 flex items-center justify-between hover:bg-[#20242b] transition-colors cursor-pointer">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'مكتبات الطرف الثالث' : 'Third-Party Libraries'}</span>
              <ChevronRight className={`w-4 h-4 text-zinc-500 ${isAr ? 'rotate-180' : ''}`} />
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
              <span className="text-xs font-mono text-zinc-400">support@novaproxy.net</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'تيليجرام' : 'Telegram'}</span>
              <span className="text-xs font-mono text-blue-400">@novaproxy_channel</span>
            </div>
          </div>
        </div>

        {/* 4. Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-[#14171a] border border-[#232730]">
          <p className="text-xs text-zinc-400 leading-relaxed">
            {isAr
              ? 'تطبيق NovaProxy هو برنامج عميل مفتوح لأدوات الشبكة والبروكسي. مطورو التطبيق لا يقدمون أو يستضيفون أو يشغلون أي خوادم بروكسي ولا يتحملون مسؤولية طريقة استخدام النفق.'
              : 'NovaProxy is a network utility client. The developers do not provide, operate, or host proxy servers and are not responsible for user-configured network routing.'}
          </p>
        </div>

        {/* 5. System */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase px-1">
            {isAr ? 'معلومات العتاد والجهاز' : 'System'}
          </label>
          <div className="bg-[#181b20] border border-[#232730] rounded-2xl divide-y divide-[#232730] overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'نظام التشغيل' : 'Platform'}</span>
              <span className="text-xs font-mono text-zinc-400">Android 14 (API 34)</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'معمارية المعالج' : 'Architecture'}</span>
              <span className="text-xs font-mono text-zinc-400">arm64-v8a</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">{isAr ? 'بيئة التشغيل' : 'Java / Runtime'}</span>
              <span className="text-xs font-mono text-zinc-400">OpenJDK 21 / Capacitor 6.2</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-white">HWID</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">{hwid}</span>
                <button
                  onClick={handleCopyHwid}
                  className="p-1.5 rounded-lg bg-[#222731] hover:bg-[#2c3340] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title={isAr ? 'نسخ المعرّف' : 'Copy HWID'}
                >
                  {copiedHwid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
