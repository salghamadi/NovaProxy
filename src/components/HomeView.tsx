import React, { useState } from 'react';
import {
  Power,
  Clipboard,
  Plus,
  Server as ServerIcon,
  ArrowDown,
  ArrowUp,
  Activity,
  Clock,
  ShieldCheck,
  Shield,
  Zap,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Lock,
  Wifi,
  Globe2,
  Tv,
} from 'lucide-react';
import { ConnectionMode, ConnectionState, Server, TrafficStats } from '../types';
import { translations } from '../services/i18n';
import { formatServerLocation } from '../services/protocolParser';
import { AppIcon } from '../services/appIconService';

interface HomeViewProps {
  mode: ConnectionMode;
  onChangeMode: (mode: ConnectionMode) => void;
  connectionState: ConnectionState;
  onToggleConnect: () => void;
  activeServer: Server | null;
  trafficStats: TrafficStats;
  language: 'en' | 'ar';
  connectionStyle?: 'classic' | 'compact';
  pinConnectionButton?: boolean;
  onOpenAddModal: () => void;
  onQuickPaste: () => void;
  onOpenServerSelect: () => void;
  onPingActiveServer?: () => Promise<void> | void;
  perAppProxyEnabled?: boolean;
  perAppProxyMode?: 'bypass' | 'proxy_only';
  perAppSelectedApps?: string[];
  perAppAppsMeta?: Record<string, { name: string; icon?: string }>;
  onOpenPerAppSettings?: () => void;
  onOpenTvSync?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  mode,
  onChangeMode,
  connectionState,
  onToggleConnect,
  activeServer,
  trafficStats,
  language,
  connectionStyle = 'classic',
  pinConnectionButton = false,
  onOpenAddModal,
  onQuickPaste,
  onOpenServerSelect,
  onPingActiveServer,
  perAppProxyEnabled,
  perAppProxyMode,
  perAppSelectedApps,
  perAppAppsMeta,
  onOpenPerAppSettings,
  onOpenTvSync,
}) => {
  const t = translations[language];
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isDisconnecting = connectionState === 'disconnecting';
  const isRtl = language === 'ar';

  const [isPinging, setIsPinging] = useState(false);
  const activeLoc = activeServer ? formatServerLocation(activeServer, language) : null;

  // Trigger single server ping
  const handlePing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onPingActiveServer || isPinging) return;
    setIsPinging(true);
    try {
      await onPingActiveServer();
    } finally {
      setIsPinging(false);
    }
  };

  // Format speed bytes to human readable string
  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  // Format total bytes
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format duration into hh:mm:ss
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Ping badge styling
  const getPingColor = (ping: number | null) => {
    if (ping === null) return 'text-zinc-300 bg-zinc-800/80 border-zinc-700/80';
    if (ping < 80) return 'text-incy-green bg-emerald-950/60 border-emerald-500/40 shadow-xs shadow-emerald-500/20';
    if (ping < 180) return 'text-amber-300 bg-amber-950/60 border-amber-500/40 shadow-xs shadow-amber-500/20';
    return 'text-rose-300 bg-rose-950/60 border-rose-500/40 shadow-xs shadow-rose-500/20';
  };

  return (
    <div className="flex-1 h-full flex flex-col justify-between px-3.5 sm:px-8 py-3 sm:py-5 relative overflow-y-auto pb-24 md:pb-6 bg-theme-app text-theme-primary transition-colors duration-200">
      {/* Background Ambient Glow when connected */}
      {isConnected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-gradient-to-tr from-lime-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      )}

      {/* TOP SECTION: Mode Selector (TUN | System Proxy | TV Sync) */}
      <div className="w-full flex justify-center pt-0.5 z-10 mb-3">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 shadow-lg shadow-black/40 backdrop-blur-md">
          {/* TUN Toggle */}
          <button
            onClick={() => onChangeMode('tun')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold tracking-wide transition-all duration-200 cursor-pointer ${
              mode === 'tun'
                ? 'bg-gradient-to-r from-theme-accent/25 to-theme-accent/15 text-white border-2 border-theme-accent shadow-md shadow-theme-accent/20 scale-[1.03]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
            }`}
          >
            <Shield className={`w-4 h-4 ${mode === 'tun' ? 'text-theme-accent' : 'text-zinc-400'}`} />
            <span>{t.tunMode}</span>
          </button>

          {/* System Proxy Toggle */}
          <button
            onClick={() => onChangeMode('system_proxy')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold tracking-wide transition-all duration-200 cursor-pointer ${
              mode === 'system_proxy'
                ? 'bg-gradient-to-r from-theme-accent/25 to-theme-accent/15 text-white border-2 border-theme-accent shadow-md shadow-theme-accent/20 scale-[1.03]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
            }`}
          >
            <Wifi className={`w-4 h-4 ${mode === 'system_proxy' ? 'text-theme-accent' : 'text-zinc-400'}`} />
            <span>{t.systemProxyMode}</span>
          </button>

          {/* TV Sync Button */}
          {onOpenTvSync && (
            <button
              onClick={onOpenTvSync}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold tracking-wide transition-all duration-200 cursor-pointer text-teal-300 hover:text-white bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/40 shadow-xs"
              title={language === 'ar' ? 'مزامنة مع التلفزيون' : 'Sync with TV'}
            >
              <Tv className="w-4 h-4 text-teal-400" />
              <span>{language === 'ar' ? 'مزامنة TV' : 'TV Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* PER-APP PROXY BADGE (Interactive & clear) */}
      {perAppProxyEnabled && (
        <div className="w-full max-w-md mx-auto z-10 mb-2.5">
          <button
            type="button"
            onClick={onOpenPerAppSettings}
            className="w-full py-2.5 px-4 rounded-2xl bg-teal-950/50 hover:bg-teal-900/60 border border-teal-500/40 flex items-center justify-between text-xs sm:text-sm text-teal-300 cursor-pointer transition-all shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 truncate">
              {perAppSelectedApps && perAppSelectedApps.length === 1 ? (
                <>
                  <AppIcon
                    icon={perAppAppsMeta?.[perAppSelectedApps[0]]?.icon}
                    name={perAppAppsMeta?.[perAppSelectedApps[0]]?.name || perAppSelectedApps[0]}
                    packageName={perAppSelectedApps[0]}
                    className="w-6 h-6 rounded-lg"
                  />
                  <span className="font-bold truncate text-white">
                    {language === 'ar'
                      ? `توجيه ${perAppAppsMeta?.[perAppSelectedApps[0]]?.name || perAppSelectedApps[0]} فقط بالبروكسي`
                      : `Proxy only for ${perAppAppsMeta?.[perAppSelectedApps[0]]?.name || perAppSelectedApps[0]}`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base text-teal-400 font-bold">⇄</span>
                  <span className="font-bold truncate text-white">
                    {perAppProxyMode === 'proxy_only'
                      ? language === 'ar'
                        ? `توجيه التطبيقات: ${perAppSelectedApps?.length || 0} تطبيق بالبروكسي (الباقي مباشر)`
                        : `Per-App: ${perAppSelectedApps?.length || 0} app(s) via proxy (rest direct)`
                      : language === 'ar'
                        ? `استثناء التطبيقات: ${perAppSelectedApps?.length || 0} تطبيق مستثنى`
                        : `Per-App: ${perAppSelectedApps?.length || 0} app(s) bypassed`}
                  </span>
                </>
              )}
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/25 text-teal-200 font-extrabold border border-teal-400/30 flex-shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
              {language === 'ar' ? 'تعديل ⚙️' : 'Edit ⚙️'}
            </span>
          </button>
        </div>
      )}

      {/* ACTIVE SERVER CARD (Prominent & interactive) */}
      <div className="w-full max-w-md mx-auto z-10 mb-3">
        {activeServer ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onOpenServerSelect}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenServerSelect();
              }
            }}
            className="group w-full p-4 rounded-3xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/70 hover:border-theme-accent/80 shadow-xl shadow-black/50 backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
          >
            {/* Left/Start: Flag + Only Country and City */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                <span>{activeLoc?.flag || activeServer.flag || '🌐'}</span>
              </div>

              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-white truncate group-hover:text-theme-accent transition-colors">
                  {activeLoc?.country}
                </h4>
                <p className="text-xs text-zinc-300 font-semibold truncate mt-0.5">
                  {activeLoc?.city}
                </p>
              </div>
            </div>

            {/* Right/End: Ping Pill + Chevron */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={handlePing}
                disabled={isPinging}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer ${getPingColor(
                  activeServer.ping
                )}`}
                title={t.quickPing || 'Ping'}
              >
                {isPinging ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>{activeServer.ping !== null ? `${activeServer.ping}ms` : '--'}</span>
              </button>

              <div className="text-zinc-400 group-hover:text-white transition-colors">
                {isRtl ? (
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Server State */
          <div
            role="button"
            tabIndex={0}
            onClick={onOpenAddModal}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenAddModal();
              }
            }}
            className="w-full p-4 rounded-3xl border-2 border-dashed border-zinc-700 hover:border-theme-accent/80 bg-zinc-900/60 hover:bg-zinc-800/80 transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer text-center group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-theme-accent">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-xs sm:text-sm font-extrabold text-white group-hover:text-theme-accent transition-colors">
                  {t.noServerSelected}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">{t.selectServerPrompt}</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-theme-accent text-white shadow-md">
              {t.buttonAdd}
            </span>
          </div>
        )}
      </div>

      {/* CENTER: Main Connection Stage (Power Button & Rings) */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 sm:my-4 z-10">
        <div className="relative group flex items-center justify-center">
          {/* Animated concentric rings when connected */}
          {isConnected && (
            <>
              <div className="absolute -inset-6 sm:-inset-8 rounded-full border border-incy-green/40 animate-ping opacity-35 pointer-events-none" />
              <div className="absolute -inset-3 sm:-inset-4 rounded-full border-2 border-incy-green/60 shadow-[0_0_50px_rgba(163,230,53,0.45)] pointer-events-none animate-pulse-slow" />
            </>
          )}

          {/* Animated dual spinner ring when connecting */}
          {isConnecting && (
            <div className="absolute -inset-4 sm:-inset-5 rounded-full border-3 border-dashed border-incy-green animate-spin pointer-events-none" />
          )}

          {/* Large Tactile Circular Power Button */}
          <button
            onClick={onToggleConnect}
            disabled={isConnecting || isDisconnecting}
            className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative cursor-pointer active:scale-95 focus:ring-4 focus:ring-incy-green/60 focus:outline-none ${
              isConnected
                ? 'bg-gradient-to-b from-[#1b3416] via-[#11220e] to-[#081206] border-3 border-incy-green shadow-[0_0_65px_rgba(163,230,53,0.55)] hover:scale-105'
                : isConnecting
                ? 'bg-zinc-900 border-3 border-incy-green/80 animate-pulse'
                : 'bg-gradient-to-b from-[#20291e] via-[#151c14] to-[#0c100b] border-2 border-zinc-600/80 hover:border-theme-accent hover:scale-105 shadow-2xl shadow-black/80'
            }`}
            title={isConnected ? t.tapToDisconnect : t.tapToConnect}
          >
            {/* Center Power Icon with enhanced glow */}
            <Power
              className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 ${
                isConnected
                  ? 'text-incy-green drop-shadow-[0_0_20px_rgba(163,230,53,1)]'
                  : isConnecting
                  ? 'text-incy-green animate-pulse'
                  : 'text-zinc-300 group-hover:text-theme-accent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'
              }`}
            />
          </button>
        </div>

        {/* Connection Status Label & Live Pills */}
        <div className="mt-5 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? 'bg-incy-green animate-ping shadow-[0_0_10px_rgba(163,230,53,1)]'
                  : isConnecting
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <h3
              className={`text-lg sm:text-xl font-black tracking-tight transition-colors ${
                isConnected
                  ? 'text-incy-green drop-shadow-[0_0_10px_rgba(163,230,53,0.4)]'
                  : isConnecting || isDisconnecting
                  ? 'text-amber-300 animate-pulse'
                  : 'text-white'
              }`}
            >
              {isConnecting
                ? t.connecting
                : isDisconnecting
                ? t.disconnecting
                : isConnected
                ? t.connectedAndProtected || t.connected
                : (language === 'ar' ? 'غير متصل - اضغط للاتصال' : 'Disconnected - Tap to Connect')}
            </h3>
          </div>

          {/* Subtext info pill */}
          <p className="text-xs sm:text-sm text-zinc-300 font-medium">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 text-zinc-200">
                <Lock className="w-3.5 h-3.5 text-incy-green" />
                <span>{t.secureTunnelActive || '256-bit Encrypted Tunnel Active'}</span>
              </span>
            ) : (
              <span>{mode === 'tun' ? t.tunModeDesc : t.systemProxyDesc}</span>
            )}
          </p>
        </div>

        {/* LIVE METRICS DASHBOARD (When Connected) */}
        {isConnected ? (
          <div className="mt-5 w-full max-w-md grid grid-cols-3 gap-2 sm:gap-3 animate-fadeIn">
            {/* Download Speed */}
            <div className="p-3 rounded-2xl bg-theme-card/90 border border-theme-card/90 flex flex-col items-center shadow-md">
              <div className="flex items-center gap-1 text-[11px] text-[#7e8c7c] mb-1 font-semibold">
                <ArrowDown className="w-3.5 h-3.5 text-incy-green" />
                <span>{t.speedDown}</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white font-mono">
                {formatSpeed(trafficStats.downloadSpeed)}
              </div>
              <div className="text-[10px] text-[#6b7768] font-mono mt-0.5">
                {formatBytes(trafficStats.totalDownloaded)}
              </div>
            </div>

            {/* Upload Speed */}
            <div className="p-3 rounded-2xl bg-theme-card/90 border border-theme-card/90 flex flex-col items-center shadow-md">
              <div className="flex items-center gap-1 text-[11px] text-[#7e8c7c] mb-1 font-semibold">
                <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.speedUp}</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white font-mono">
                {formatSpeed(trafficStats.uploadSpeed)}
              </div>
              <div className="text-[10px] text-[#6b7768] font-mono mt-0.5">
                {formatBytes(trafficStats.totalUploaded)}
              </div>
            </div>

            {/* Duration */}
            <div className="p-3 rounded-2xl bg-theme-card/90 border border-theme-card/90 flex flex-col items-center shadow-md">
              <div className="flex items-center gap-1 text-[11px] text-[#7e8c7c] mb-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.duration}</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white font-mono">
                {formatDuration(trafficStats.connectedDuration)}
              </div>
              <div className="text-[10px] text-incy-green font-mono mt-0.5">
                ● Live
              </div>
            </div>
          </div>
        ) : (
          /* Disconnected Security Status Badge */
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-theme-card/50 border border-theme-card/80 text-xs text-[#7e8c7c]">
            <ShieldCheck className="w-4 h-4 text-theme-accent" />
            <span>{t.securityActive}</span>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR: Quick Actions Hub */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center gap-2.5 sm:gap-3 z-10 pt-3 pb-1">
        {/* + Add Button */}
        <button
          onClick={onOpenAddModal}
          className="flex-1 h-12 sm:h-13 rounded-2xl bg-theme-accent hover:opacity-90 border border-theme-accent text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-theme-accent/25 active:scale-95 focus:ring-2 focus:ring-theme-accent focus:outline-none cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 text-white stroke-[3]" />
          <span>{t.buttonAdd}</span>
        </button>

        {/* Paste Button */}
        <button
          onClick={onQuickPaste}
          className="flex-1 h-12 sm:h-13 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 focus:ring-2 focus:ring-theme-accent focus:outline-none cursor-pointer"
        >
          <Clipboard className="w-4.5 h-4.5 text-theme-accent stroke-[2.5]" />
          <span>{t.buttonPaste}</span>
        </button>

        {/* Server Quick Switcher Button */}
        <button
          onClick={onOpenServerSelect}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-white transition-all active:scale-95 focus:ring-2 focus:ring-theme-accent focus:outline-none flex-shrink-0 cursor-pointer shadow-md"
          title={t.changeServer}
        >
          <ServerIcon className="w-5 h-5 text-theme-accent" />
        </button>

        {/* TV Sync Button */}
        {onOpenTvSync && (
          <button
            onClick={onOpenTvSync}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-teal-950/70 hover:bg-teal-900/80 border border-teal-500/50 flex items-center justify-center text-teal-300 hover:text-white transition-all active:scale-95 focus:ring-2 focus:ring-teal-400 focus:outline-none flex-shrink-0 cursor-pointer shadow-md"
            title={language === 'ar' ? 'مزامنة مع التلفزيون (TV Sync)' : 'Sync with TV'}
          >
            <Tv className="w-5 h-5 text-teal-400" />
          </button>
        )}
      </div>
    </div>
  );
};
