import React, { useState } from 'react';
import {
  Gamepad2,
  Wifi,
  Lock,
  ChevronRight,
  ChevronDown,
  Gauge,
  BarChart2,
  Layers,
  Terminal,
  Link as LinkIcon,
  Cloud,
  Info,
  Tv,
} from 'lucide-react';
import { AppSettings, Server, TrafficStats } from '../types';
import { translations } from '../services/i18n';
import {
  AppearanceModal,
  ConnectionModal,
  TunnelModal,
  PingSettingsModal,
  StatisticsModal,
  TunnelLogsModal,
  BackupModal,
  AboutModal,
  DnsModal,
  UrlSchemesModal,
} from './settings/SettingsModals';
import { AppearanceView } from './settings/AppearanceView';
import { ConnectionView } from './settings/ConnectionView';
import { TunnelView } from './settings/TunnelView';
import {
  StatisticsView,
  PingSettingsView,
  AdvancedSettingsView,
  TunnelLogsView,
  UrlSchemesView,
  BackupView,
  AboutView,
} from './settings/FullSettingsViews';

export type SettingsSubView =
  | 'main'
  | 'appearance'
  | 'connection'
  | 'tunnel'
  | 'perAppProxy'
  | 'statistics'
  | 'ping'
  | 'advanced'
  | 'tunnelLogs'
  | 'urlSchemes'
  | 'backup'
  | 'about';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  language: 'en' | 'ar';
  onOpenTvSync?: () => void;
  trafficStats?: TrafficStats;
  servers?: Server[];
  onRestore?: (servers: Server[], settings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  language,
  onOpenTvSync,
  trafficStats,
  servers = [],
  onRestore,
}) => {
  const t = translations[language];

  // Navigation Sub-View state
  const [subView, setSubView] = useState<SettingsSubView>('main');

  // Active Modals state (fallback or quick modals)
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (subView === 'appearance') {
    return (
      <AppearanceView
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onBack={() => setSubView('main')}
      />
    );
  }

  if (subView === 'connection') {
    return (
      <ConnectionView
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onBack={() => setSubView('main')}
        language={language}
      />
    );
  }

  if (subView === 'tunnel') {
    return (
      <TunnelView
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onBack={() => setSubView('main')}
        language={language}
      />
    );
  }

  if (subView === 'perAppProxy') {
    return (
      <TunnelView
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onBack={() => setSubView('main')}
        language={language}
        initialPage="perAppProxy"
      />
    );
  }

  if (subView === 'statistics') {
    return (
      <StatisticsView
        onBack={() => setSubView('main')}
        language={language}
        trafficStats={trafficStats}
      />
    );
  }

  if (subView === 'ping') {
    return (
      <PingSettingsView
        onBack={() => setSubView('main')}
        language={language}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    );
  }

  if (subView === 'advanced') {
    return (
      <AdvancedSettingsView
        onBack={() => setSubView('main')}
        language={language}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    );
  }

  if (subView === 'tunnelLogs') {
    return (
      <TunnelLogsView
        onBack={() => setSubView('main')}
        language={language}
      />
    );
  }

  if (subView === 'urlSchemes') {
    return (
      <UrlSchemesView
        onBack={() => setSubView('main')}
        language={language}
      />
    );
  }

  if (subView === 'backup') {
    return (
      <BackupView
        onBack={() => setSubView('main')}
        language={language}
        servers={servers}
        settings={settings}
        onRestore={onRestore}
      />
    );
  }

  if (subView === 'about') {
    return (
      <AboutView
        onBack={() => setSubView('main')}
        language={language}
      />
    );
  }

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

  const handleResetSettings = () => {
    if (window.confirm(t.resetConfirm)) {
      onUpdateSettings({
        appearanceTheme: 'dark',
        accentColor: 'blue',
        autoConnect: false,
        killSwitch: false,
        lanAccess: false,
        routing: 'rule',
        socksPort: 10808,
        httpPort: 10809,
        tlsFragmentation: true,
        multiplexing: false,
        remoteDns: 'https://1.1.1.1/dns-query',
        domesticDns: '8.8.8.8',
        fakeDns: false,
        autoUpdate: true,
        autoUpdateInterval: '2h',
        notifyOnUpdate: false,
        updateOnLaunch: true,
        pingOnLaunch: false,
        sendHwid: true,
        serverSortOrder: 'default',
        expiryNotification: true,
        expiryDays: 3,
        disconnectOnSleep: false,
        memoryMonitor: false,
        minimizeToTray: true,
        startMinimized: false,
        autoStart: false,
      });
    }
  };

  return (
    <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
        {/* Header with Language Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </h1>
            <p className="text-xs font-bold text-zinc-400 tracking-wider mt-0.5 uppercase">
              NovaProxy • {language === 'ar' ? 'خيارات النظام والاتصال' : 'System & Connection Options'}
            </p>
          </div>
        </div>

        {/* 🌟 LANGUAGE SELECTION CARD (Arabic & English Only) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/90 border border-zinc-700/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0 shadow-inner">
              <span className="text-xl">🌐</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {language === 'ar' ? 'لغة التطبيق (Language)' : 'Application Language'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'ar' ? 'اختر بين العربية والإنجليزية بنقرة واحدة' : 'Switch between Arabic and English with one tap'}
              </p>
            </div>
          </div>

          {/* Quick Dual Language Switcher Buttons */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-black/60 border border-zinc-700 shadow-inner w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onUpdateSettings({ language: 'ar', languagePreference: 'ar' })}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                language === 'ar'
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-500/25 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-base">🇸🇦</span>
              <span>العربية</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ language: 'en', languagePreference: 'en' })}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                language === 'en'
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-500/25 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-base">🇺🇸</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* 1. APPEARANCE */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secAppearance}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setSubView('appearance')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1b2336] flex items-center justify-center text-[#4f88f7] flex-shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemAppearance}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {settings.appearanceTheme === 'dark' ? 'Dark' : settings.appearanceTheme}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. CONNECTION */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secConnection}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setSubView('connection')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1b2336] flex items-center justify-center text-[#4f88f7] flex-shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemConnection}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subConnection}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. TUNNEL */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secTunnel}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setSubView('tunnel')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#271b38] flex items-center justify-center text-[#aa66f8] flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-purple-400 transition-colors">
                    {t.itemTunnel}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subTunnel}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3.3. TV SYNC (Send / Receive between Mobile & TV) */}
        {onOpenTvSync && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
              {language === 'ar' ? 'مزامنة التلفزيون والجوال' : 'TV & Mobile Sync'}
            </h3>
            <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={onOpenTvSync}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0">
                    <Tv className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-teal-400 transition-colors">
                        {language === 'ar' ? 'مزامنة الخوادم مع التلفزيون (TV Sync)' : 'Sync Servers with TV (TV Sync)'}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {language === 'ar' ? 'QR كود وواي فاي' : 'QR & Wi-Fi'}
                      </span>
                    </div>
                    <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                      {language === 'ar'
                        ? 'إرسال واستقبال الخوادم بين الجوال وشاشة التلفزيون عبر كود QR أو شبكة Wi-Fi مباشرة'
                        : 'Transfer and receive proxy servers between mobile and TV screen seamlessly'}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* 3.5. PER-APP PROXY */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secPerApp}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setSubView('perAppProxy')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#14292b] flex items-center justify-center text-teal-400 flex-shrink-0">
                  <span className="text-lg">⇄</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-teal-400 transition-colors">
                      {t.itemPerApp}
                    </h4>
                    {settings.perAppProxyEnabled && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        {settings.perAppProxyMode === 'proxy_only'
                          ? (language === 'ar' ? 'تطبيق محدد فقط' : 'Proxy Only')
                          : (language === 'ar' ? 'استثناء' : 'Bypass')}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subPerApp}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4. DNS */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secDns}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-sm">
            {/* Remote DNS */}
            <div
              onClick={() => setActiveModal('dns')}
              className="px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
            >
              <span className="text-[13.5px] font-medium text-theme-primary group-hover:text-blue-400 transition-colors">
                {t.remoteDns}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-mono text-theme-secondary group-hover:text-zinc-200">
                  {settings.remoteDns}
                </span>
                <ChevronRight className="w-4 h-4 text-[#505561] group-hover:text-theme-primary" />
              </div>
            </div>

            {/* Domestic DNS */}
            <div
              onClick={() => setActiveModal('dns')}
              className="px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
            >
              <span className="text-[13.5px] font-medium text-theme-primary group-hover:text-blue-400 transition-colors">
                {t.domesticDns}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-mono text-theme-secondary group-hover:text-zinc-200">
                  {settings.domesticDns}
                </span>
                <ChevronRight className="w-4 h-4 text-[#505561] group-hover:text-theme-primary" />
              </div>
            </div>

            {/* FakeDNS */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.fakeDns}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subFakeDns}</p>
              </div>
              <ToggleSwitch
                checked={settings.fakeDns}
                onChange={() => onUpdateSettings({ fakeDns: !settings.fakeDns })}
              />
            </div>
          </div>
        </div>

        {/* 5. SUBSCRIPTIONS */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secSubscriptions}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-sm">
            {/* Auto Update + Intervals */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13.5px] font-medium text-theme-primary">{t.autoUpdate}</h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5">{t.subAutoUpdate}</p>
                </div>
                <ToggleSwitch
                  checked={settings.autoUpdate}
                  onChange={() => onUpdateSettings({ autoUpdate: !settings.autoUpdate })}
                />
              </div>

              {/* Intervals Pills */}
              {settings.autoUpdate && (
                <div className="flex items-center gap-2 pt-1 text-xs overflow-x-auto">
                  {(
                    [
                      { id: '30m', label: language === 'ar' ? '30 دقيقة' : '30 min' },
                      { id: '1h', label: language === 'ar' ? 'ساعة' : '1 hr' },
                      { id: '2h', label: language === 'ar' ? 'ساعتان' : '2 hrs' },
                      { id: '6h', label: language === 'ar' ? '6 ساعات' : '6 hrs' },
                      { id: '12h', label: language === 'ar' ? '12 ساعة' : '12 hrs' },
                      { id: '24h', label: language === 'ar' ? '24 ساعة' : '24 hrs' },
                    ] as const
                  ).map(item => (
                    <button
                      key={item.id}
                      onClick={() => onUpdateSettings({ autoUpdateInterval: item.id })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settings.autoUpdateInterval === item.id
                          ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-xs'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notify on Update */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.notifyOnUpdate}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subNotifyOnUpdate}</p>
              </div>
              <ToggleSwitch
                checked={settings.notifyOnUpdate}
                onChange={() => onUpdateSettings({ notifyOnUpdate: !settings.notifyOnUpdate })}
              />
            </div>

            {/* Update on Launch */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.updateOnLaunch}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subUpdateOnLaunch}</p>
              </div>
              <ToggleSwitch
                checked={settings.updateOnLaunch}
                onChange={() => onUpdateSettings({ updateOnLaunch: !settings.updateOnLaunch })}
              />
            </div>

            {/* Ping on Launch */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.pingOnLaunch}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subPingOnLaunch}</p>
              </div>
              <ToggleSwitch
                checked={settings.pingOnLaunch}
                onChange={() => onUpdateSettings({ pingOnLaunch: !settings.pingOnLaunch })}
              />
            </div>

            {/* Send HWID */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.sendHwid}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subSendHwid}</p>
              </div>
              <ToggleSwitch
                checked={settings.sendHwid}
                onChange={() => onUpdateSettings({ sendHwid: !settings.sendHwid })}
              />
            </div>

            {/* Server Sort Order */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-[13.5px] font-medium text-theme-primary">{t.serverSortOrder}</span>
              <div className="relative flex items-center gap-1 text-[12.5px] text-theme-secondary cursor-pointer hover:text-theme-primary">
                <select
                  value={settings.serverSortOrder}
                  onChange={e => onUpdateSettings({ serverSortOrder: e.target.value as any })}
                  className="bg-theme-subtle border border-theme-card focus:border-theme-accent rounded-xl outline-none appearance-none cursor-pointer px-3 py-1.5 text-xs text-theme-primary font-semibold"
                >
                  <option value="default" className="bg-theme-card text-theme-primary">
                    {language === 'ar' ? 'افتراضي' : 'Default'}
                  </option>
                  <option value="latency" className="bg-theme-card text-theme-primary">
                    {t.sortLatency}
                  </option>
                  <option value="name" className="bg-theme-card text-theme-primary">
                    {t.sortName}
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-theme-secondary" />
              </div>
            </div>

            {/* Expiry Notification */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13.5px] font-medium text-theme-primary">{t.expiryNotification}</h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5">{t.subExpiryNotification}</p>
                </div>
                <ToggleSwitch
                  checked={settings.expiryNotification}
                  onChange={() =>
                    onUpdateSettings({ expiryNotification: !settings.expiryNotification })
                  }
                />
              </div>

              {settings.expiryNotification && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  {[1, 3, 5, 7].map(days => (
                    <button
                      key={days}
                      onClick={() => onUpdateSettings({ expiryDays: days })}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer ${
                        settings.expiryDays === days
                          ? 'bg-[#202e47] text-[#5593f7] font-semibold'
                          : 'text-theme-secondary hover:text-theme-primary font-medium'
                      }`}
                    >
                      {days}
                    </button>
                  ))}
                  <span className="text-[12px] text-theme-secondary ml-1 rtl:ml-0 rtl:mr-1">
                    {language === 'ar' ? 'التنبيه قبل (أيام)' : 'Notify before (days)'}
                  </span>
                </div>
              )}
            </div>

            {/* Ping Settings */}
            <button
              onClick={() => setSubView('ping')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#271b38] flex items-center justify-center text-[#aa66f8] flex-shrink-0">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-purple-400 transition-colors">
                    {t.itemPingSettings}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subPingSettings}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>

            {/* Statistics */}
            <button
              onClick={() => setSubView('statistics')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1b2336] flex items-center justify-center text-[#4f88f7] flex-shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemStatistics}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subStatistics}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6. PERFORMANCE */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secPerformance}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-sm">
            {/* Advanced Settings */}
            <button
              onClick={() => setSubView('advanced')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1b2336] flex items-center justify-center text-[#4f88f7] flex-shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemAdvancedSettings}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subAdvancedSettings}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>

            {/* Disconnect on Sleep */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.disconnectOnSleep}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subDisconnectOnSleep}</p>
              </div>
              <ToggleSwitch
                checked={settings.disconnectOnSleep}
                onChange={() =>
                  onUpdateSettings({ disconnectOnSleep: !settings.disconnectOnSleep })
                }
              />
            </div>

            {/* Memory Monitor */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.memoryMonitor}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subMemoryMonitor}</p>
              </div>
              <ToggleSwitch
                checked={settings.memoryMonitor}
                onChange={() => onUpdateSettings({ memoryMonitor: !settings.memoryMonitor })}
              />
            </div>
          </div>
        </div>

        {/* 7. DESKTOP */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secDesktop}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-sm">
            {/* Minimize to Tray */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.minimizeToTray}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subMinimizeToTray}</p>
              </div>
              <ToggleSwitch
                checked={settings.minimizeToTray}
                onChange={() => onUpdateSettings({ minimizeToTray: !settings.minimizeToTray })}
              />
            </div>

            {/* Start Minimized */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.startMinimized}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subStartMinimized}</p>
              </div>
              <ToggleSwitch
                checked={settings.startMinimized}
                onChange={() => onUpdateSettings({ startMinimized: !settings.startMinimized })}
              />
            </div>

            {/* Autostart */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-medium text-theme-primary">{t.autostart}</h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">{t.subAutostart}</p>
              </div>
              <ToggleSwitch
                checked={settings.autoStart}
                onChange={() => onUpdateSettings({ autoStart: !settings.autoStart })}
              />
            </div>
          </div>
        </div>

        {/* 8. DEBUG */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secDebug}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setSubView('tunnelLogs')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1f2228] flex items-center justify-center text-[#7e8896] flex-shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemTunnelLogs}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subTunnelLogs}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 9. APP */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-theme-muted tracking-wider uppercase px-1">
            {t.secApp}
          </h3>
          <div className="bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-sm">
            {/* URL Schemes */}
            <button
              onClick={() => setSubView('urlSchemes')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#271b38] flex items-center justify-center text-[#aa66f8] flex-shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-purple-400 transition-colors">
                    {t.itemUrlSchemes}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subUrlSchemes}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>

            {/* Backup */}
            <button
              onClick={() => setSubView('backup')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1b2336] flex items-center justify-center text-[#4f88f7] flex-shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemBackup}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subBackup}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>

            {/* About */}
            <button
              onClick={() => setSubView('about')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-theme-card-hover transition-colors group text-left rtl:text-right cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1f2228] flex items-center justify-center text-[#7e8896] flex-shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-theme-primary group-hover:text-blue-400 transition-colors">
                    {t.itemAbout}
                  </h4>
                  <p className="text-[12px] text-theme-secondary mt-0.5 font-normal">
                    {t.subAbout}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#505561] group-hover:text-theme-primary transition-colors ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 10. Reset Settings Button */}
        <div className="pt-2">
          <button
            onClick={handleResetSettings}
            className="w-full py-4 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border-2 border-rose-600/40 hover:border-rose-500 text-rose-300 font-bold text-xs sm:text-sm transition-all duration-200 active:scale-98 text-center cursor-pointer shadow-md"
          >
            {language === 'ar' ? '⚠️ إعادة ضبط جميع الإعدادات للوضع الافتراضي' : '⚠️ Reset All Settings to Default'}
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <AppearanceModal
        isOpen={activeModal === 'appearance'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdate={onUpdateSettings}
        language={language}
      />

      <ConnectionModal
        isOpen={activeModal === 'connection'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdate={onUpdateSettings}
        language={language}
      />

      <TunnelModal
        isOpen={activeModal === 'tunnel'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdate={onUpdateSettings}
        language={language}
      />

      <PingSettingsModal
        isOpen={activeModal === 'ping'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdate={onUpdateSettings}
        language={language}
      />

      <StatisticsModal
        isOpen={activeModal === 'statistics'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdate={onUpdateSettings}
        language={language}
      />

      <TunnelLogsModal
        isOpen={activeModal === 'logs'}
        onClose={() => setActiveModal(null)}
      />

      <BackupModal
        isOpen={activeModal === 'backup'}
        onClose={() => setActiveModal(null)}
      />

      <AboutModal
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
      />

      <DnsModal
        isOpen={activeModal === 'dns'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdate={onUpdateSettings}
        language={language}
      />

      <UrlSchemesModal
        isOpen={activeModal === 'urlSchemes'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};
