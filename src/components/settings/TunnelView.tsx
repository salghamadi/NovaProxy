import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Check,
  ChevronUp,
  Plus,
  MoreVertical,
  Edit2,
  X,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { proxyService } from '../../services/proxyController';
import { AppIcon, POPULAR_PRESET_APPS, OFFICIAL_APP_ICONS } from '../../services/appIconService';

interface TunnelViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBack: () => void;
  language?: 'en' | 'ar';
  initialPage?: 'main' | 'perAppProxy';
}

export const TunnelView: React.FC<TunnelViewProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  language = 'en',
  initialPage = 'main',
}) => {
  // Navigation inside Tunnel: 'main' | 'perAppProxy'
  const [currentTunnelPage, setCurrentTunnelPage] = useState<'main' | 'perAppProxy'>(initialPage);

  // Modals for Custom DNS and Custom MTU
  const [isCustomDnsOpen, setIsCustomDnsOpen] = useState(false);
  const [customDnsInput, setCustomDnsInput] = useState(settings.customVpnDns || '1.1.1.1, 8.8.8.8');
  const [isCustomMtuOpen, setIsCustomMtuOpen] = useState(false);
  const [customMtuInput, setCustomMtuInput] = useState((settings.customTunnelMtu || 1420).toString());

  // Dropdown open/close states
  const [isPreferredIpOpen, setIsPreferredIpOpen] = useState(false);
  const [isVpnDnsOpen, setIsVpnDnsOpen] = useState(false);
  const [isTunnelMtuOpen, setIsTunnelMtuOpen] = useState(false);

  // Add App Modal state in Per-App Proxy
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [customAppName, setCustomAppName] = useState('');
  const [installedApps, setInstalledApps] = useState<Array<{ packageName: string; name: string; icon?: string }>>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [activeModalTab, setActiveModalTab] = useState<'installed' | 'presets' | 'custom'>('installed');

  const isAr = language === 'ar';

  // Toggle Switch Component - High Contrast, Tactile & RTL-Safe
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

  // Settings states
  const routingProfiles = settings.routingProfiles ?? false;
  const fragmentation = settings.fragmentation ?? false;
  const mux = settings.mux ?? false;
  const sniffing = settings.sniffing ?? true;
  const preferredIp = settings.preferredIp || 'auto';
  const vpnDns = settings.vpnDns || 'internal';
  const tunnelMtu = settings.tunnelMtu || 'auto';

  // Per-App Proxy states
  const perAppProxyEnabled = settings.perAppProxyEnabled ?? false;
  const perAppProxyMode = settings.perAppProxyMode || 'proxy_only';
  const selectedApps = settings.perAppSelectedApps || [];

  const handleToggleApp = (appId: string, name?: string, icon?: string) => {
    let updated: string[];
    const meta = { ...(settings.perAppAppsMeta || {}) };
    if (selectedApps.includes(appId)) {
      updated = selectedApps.filter((id) => id !== appId);
      delete meta[appId];
    } else {
      updated = [...selectedApps, appId];
      const foundInstalled = installedApps.find((a) => a.packageName === appId);
      const foundPreset = POPULAR_PRESET_APPS.find((p) => p.id === appId);
      const resolvedName = name || foundInstalled?.name || foundPreset?.name || appId;
      const resolvedIcon = icon || foundInstalled?.icon || foundPreset?.icon || OFFICIAL_APP_ICONS[appId];
      meta[appId] = { name: resolvedName, icon: resolvedIcon };
    }
    onUpdateSettings({ perAppSelectedApps: updated, perAppAppsMeta: meta });
  };

  const handleOpenAddModal = async () => {
    setIsAddAppModalOpen(true);
    setAppSearchQuery('');
    if (installedApps.length === 0) {
      setIsLoadingApps(true);
      try {
        const apps = await proxyService.getInstalledApps();
        if (apps && apps.length > 0) {
          setInstalledApps(apps);
          setActiveModalTab('installed');
        } else {
          setActiveModalTab('presets');
        }
      } catch (err) {
        console.warn('Failed to load apps:', err);
        setActiveModalTab('presets');
      } finally {
        setIsLoadingApps(false);
      }
    }
  };

  const handleAddCustomApp = () => {
    if (!customAppName.trim()) return;
    const cleanName = customAppName.trim();
    if (!selectedApps.includes(cleanName)) {
      const meta = { ...(settings.perAppAppsMeta || {}) };
      meta[cleanName] = {
        name: cleanName,
        icon: OFFICIAL_APP_ICONS[cleanName],
      };
      onUpdateSettings({
        perAppSelectedApps: [...selectedApps, cleanName],
        perAppAppsMeta: meta,
      });
    }
    setCustomAppName('');
    setIsAddAppModalOpen(false);
  };

  const getAppLabel = (appId: string) => {
    const saved = settings.perAppAppsMeta?.[appId];
    if (saved?.name) return saved.name;
    const installed = installedApps.find((a) => a.packageName === appId);
    if (installed) return installed.name;
    const preset = POPULAR_PRESET_APPS.find((p) => p.id === appId);
    if (preset) return preset.name;
    return appId;
  };

  const getAppIcon = (appId: string) => {
    const saved = settings.perAppAppsMeta?.[appId];
    if (saved?.icon) return saved.icon;
    const installed = installedApps.find((a) => a.packageName === appId);
    if (installed?.icon) return installed.icon;
    const preset = POPULAR_PRESET_APPS.find((p) => p.id === appId);
    if (preset?.icon) return preset.icon;
    return OFFICIAL_APP_ICONS[appId];
  };

  const filteredInstalled = installedApps.filter((app) => {
    const q = appSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      app.name.toLowerCase().includes(q) ||
      app.packageName.toLowerCase().includes(q)
    );
  });

  const filteredPresets = POPULAR_PRESET_APPS.filter((p) => {
    const q = appSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const dnsOptions = [
    {
      id: 'internal',
      title: isAr ? 'داخلي (DNS المعين للنظام)' : 'Internal (mapped DNS)',
      ip: '198.18.0.2',
    },
    {
      id: 'cloudflare_google',
      title: 'Cloudflare + Google',
      ip: '1.1.1.1, 8.8.8.8',
    },
    {
      id: 'google',
      title: 'Google DNS',
      ip: '8.8.8.8, 8.8.4.4',
    },
    {
      id: 'cloudflare',
      title: 'Cloudflare DNS',
      ip: '1.1.1.1, 1.0.0.1',
    },
    {
      id: 'quad9',
      title: 'Quad9',
      ip: '9.9.9.9, 149.112.112.112',
    },
    {
      id: 'custom',
      title: isAr ? 'DNS مخصص' : 'Custom DNS',
      ip: settings.customVpnDns || (isAr ? 'أدخل عناوين IP مفصولة بفواصل' : 'Enter comma-separated IPs'),
      isCustom: true,
    },
  ];

  const mtuOptions = [
    { id: 'auto', label: isAr ? 'تلقائي (Auto)' : 'Auto' },
    { id: '1420', label: '1420' },
    { id: '1380', label: '1380' },
    { id: '1280', label: '1280' },
    { id: 'custom', label: isAr ? `مخصص (${settings.customTunnelMtu || 1420})` : `Custom (${settings.customTunnelMtu || 1420})`, isCustom: true },
  ];

  // -------------------------------------------------------------
  // VIEW: Per-App Proxy Sub-View
  // -------------------------------------------------------------
  if (currentTunnelPage === 'perAppProxy') {
    return (
      <div className="flex-1 h-full px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto bg-theme-app text-theme-primary select-none transition-colors duration-200">
        <div className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-12">
          {/* Header with Back Arrow */}
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (initialPage === 'perAppProxy') {
                    onBack();
                  } else {
                    setCurrentTunnelPage('main');
                  }
                }}
                className="text-theme-primary hover:text-theme-accent transition-colors cursor-pointer p-1 -ml-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent"
                title={language === 'ar' ? 'رجوع' : 'Back'}
              >
                <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
              <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-theme-primary font-sans">
                {language === 'ar' ? 'توجيه التطبيقات' : 'Per-App Proxy'}
              </h1>
            </div>
            <p className="text-[11px] font-bold text-theme-muted tracking-wider uppercase mt-1 px-1">
              {language === 'ar' ? 'SPLIT TUNNELING - توجيه مخصص' : 'SPLIT TUNNELING'}
            </p>
          </div>

          {/* Top Enable Card */}
          <div className="bg-theme-card border border-theme-card rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
            <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-semibold text-theme-primary">
                  {language === 'ar' ? 'تفعيل توجيه التطبيقات' : 'Enable Per-App Proxy'}
                </h4>
                <p className="text-[12px] text-theme-secondary mt-0.5">
                  {language === 'ar'
                    ? 'تحديد تطبيقات معينة للاتصال بالبروكسي أو استثنائها'
                    : 'Route traffic per application'}
                </p>
              </div>
              <ToggleSwitch
                checked={perAppProxyEnabled}
                onChange={() =>
                  onUpdateSettings({
                    perAppProxyEnabled: !perAppProxyEnabled,
                    perAppProxyMode: perAppProxyMode || 'proxy_only',
                  })
                }
              />
            </div>
          </div>

          {/* Active Per-App Proxy Configuration */}
          {perAppProxyEnabled && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Mode switcher cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ perAppProxyMode: 'proxy_only' })}
                  className={`p-4 rounded-2xl text-left rtl:text-right transition-all cursor-pointer flex flex-col gap-1.5 border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    perAppProxyMode === 'proxy_only'
                      ? 'bg-emerald-950/50 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500'
                      : 'bg-zinc-900/80 text-zinc-300 hover:text-white border-zinc-700/70 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-extrabold flex items-center gap-2 text-emerald-400">
                      <span className="text-lg">⇄</span>
                      {language === 'ar' ? 'توجيه التطبيقات المحددة فقط' : 'Proxy Only'}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      perAppProxyMode === 'proxy_only'
                        ? 'border-emerald-400 bg-emerald-500 text-black'
                        : 'border-zinc-600'
                    }`}>
                      {perAppProxyMode === 'proxy_only' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="inline-block">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {language === 'ar' ? '⭐ الخيار الموصى به' : 'Recommended'}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-300 leading-relaxed mt-1">
                    {language === 'ar'
                      ? 'التطبيقات المحددة فقط تتصل بالبروكسي. باقي تطبيقات الجهاز (البنوك، STC، المتصفحات) تعمل بالـ IP المحلي المباشر لمنع الحظر.'
                      : 'Only selected apps connect via proxy. Banking, local apps & browsers use your direct IP.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSettings({ perAppProxyMode: 'bypass' })}
                  className={`p-4 rounded-2xl text-left rtl:text-right transition-all cursor-pointer flex flex-col gap-1.5 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    perAppProxyMode === 'bypass'
                      ? 'bg-amber-950/50 text-white border-2 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                      : 'bg-zinc-900/80 text-zinc-300 hover:text-white border-zinc-700/70 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-extrabold flex items-center gap-2 text-amber-400">
                      <span className="text-lg">🛡️</span>
                      {language === 'ar' ? 'استثناء التطبيقات المحددة' : 'Bypass VPN'}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      perAppProxyMode === 'bypass'
                        ? 'border-amber-400 bg-amber-500 text-black'
                        : 'border-zinc-600'
                    }`}>
                      {perAppProxyMode === 'bypass' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="inline-block">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {language === 'ar' ? 'استثناء من البروكسي' : 'Direct Bypass'}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-300 leading-relaxed mt-1">
                    {language === 'ar'
                      ? 'جميع تطبيقات الجهاز تمر بالبروكسي، ما عدا التطبيقات المحددة هنا تتصل مباشرة بالإنترنت المحلي.'
                      : 'All device apps route through the proxy, except the selected apps which connect directly.'}
                  </p>
                </button>
              </div>

              {/* Informative Explanatory Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 text-[12.5px] text-zinc-200 flex items-start gap-3 shadow-md">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="leading-relaxed">
                  {perAppProxyMode === 'proxy_only'
                    ? language === 'ar'
                      ? 'ملاحظة هامة: التطبيقات المضافة بالقائمة أدناه هي فقط من ستعمل بالبروكسي. باقي التطبيقات كالبنوك أو متجر التطبيقات ستتصل كالمعتاد بدون أي مشكلة.'
                      : 'Important: Only the apps in the list below will route via proxy. Other apps will connect directly with no issues.'
                    : language === 'ar'
                      ? 'ملاحظة: التطبيقات في القائمة أدناه ستتصل بالإنترنت مباشرة، وباقي الجهاز بأكمله سيمر عبر البروكسي.'
                      : 'Note: Selected apps will bypass the proxy and connect directly.'}
                </p>
              </div>

              {/* Section Header with Add button */}
              <div className="flex items-center justify-between pt-2 px-1">
                <div>
                  <h4 className="text-[14px] font-extrabold text-white">
                    {language === 'ar' ? 'التطبيقات المحددة' : 'Selected applications'}
                  </h4>
                  <p className="text-[12px] text-zinc-400 font-medium">
                    {language === 'ar' ? `${selectedApps.length} تطبيق محدد حالياً` : `${selectedApps.length} app(s) selected`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 rounded-xl bg-theme-accent hover:opacity-90 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-theme-accent/25 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{language === 'ar' ? '+ إضافة تطبيق...' : '+ Add App...'}</span>
                  </button>
                  {selectedApps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ perAppSelectedApps: [] })}
                      className="px-3 py-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/15 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                      title={language === 'ar' ? 'مسح الكل' : 'Clear all'}
                    >
                      {language === 'ar' ? 'مسح الكل' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              {/* App List or Empty State */}
              {selectedApps.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-theme-divider bg-theme-card/50">
                  <Smartphone className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-50" />
                  <p className="text-[13px] font-medium text-theme-muted">
                    {language === 'ar'
                      ? 'لم يتم تحديد أي تطبيق بعد. اضغط على "+ إضافة تطبيق..." لاختيار التطبيق المطلوب.'
                      : 'No apps selected. Tap "+ Add App..." to select an application.'}
                  </p>
                </div>
              ) : (
                <div className="bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-sm">
                  {selectedApps.map((appId) => {
                    const appLabel = getAppLabel(appId);
                    const appIcon = getAppIcon(appId);

                    return (
                      <div
                        key={appId}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AppIcon icon={appIcon} name={appLabel} packageName={appId} />
                          <div className="truncate">
                            <p className="text-[13px] font-semibold text-theme-primary truncate">
                              {appLabel}
                            </p>
                            <p className="text-[11px] font-mono text-theme-secondary truncate">
                              {appId}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleApp(appId)}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ml-2 rtl:ml-0 rtl:mr-2 flex-shrink-0"
                          title={language === 'ar' ? 'حذف التطبيق' : 'Remove app'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Add App Modal */}
          {isAddAppModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-lg bg-theme-card border border-theme-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-theme-primary max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
                  <div>
                    <h3 className="text-base font-bold text-theme-primary">
                      {language === 'ar' ? 'اختيار تطبيق لتوجيهه عبر البروكسي' : 'Select Application'}
                    </h3>
                    <p className="text-xs text-theme-secondary">
                      {language === 'ar'
                        ? 'اختر من تطبيقات جهازك أو أدخل اسم الحزمة'
                        : 'Choose from installed device apps or enter package name'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddAppModalOpen(false)}
                    className="text-theme-muted hover:text-theme-primary p-1.5 rounded-xl hover:bg-theme-subtle cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-theme-muted absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث في التطبيقات...' : 'Search applications...'}
                    className="w-full bg-theme-subtle/70 border border-theme-card rounded-xl py-2 px-9 text-xs text-theme-primary outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
                  />
                  {appSearchQuery && (
                    <button
                      onClick={() => setAppSearchQuery('')}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-theme-divider gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('installed')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      activeModalTab === 'installed'
                        ? 'border-theme-accent text-theme-accent'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    {language === 'ar'
                      ? `تطبيقات الجهاز (${installedApps.length})`
                      : `Installed (${installedApps.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('presets')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      activeModalTab === 'presets'
                        ? 'border-theme-accent text-theme-accent'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    {language === 'ar' ? 'شائعة' : 'Popular'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('custom')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      activeModalTab === 'custom'
                        ? 'border-theme-accent text-theme-accent'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    {language === 'ar' ? 'يدوي' : 'Custom'}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px] max-h-[360px]">
                  {activeModalTab === 'installed' && (
                    <>
                      {isLoadingApps ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-theme-secondary">
                          <Loader2 className="w-6 h-6 animate-spin text-theme-accent" />
                          <span className="text-xs">
                            {language === 'ar' ? 'جاري قراءة تطبيقات الجهاز...' : 'Loading installed apps...'}
                          </span>
                        </div>
                      ) : filteredInstalled.length === 0 ? (
                        <div className="py-12 text-center text-xs text-theme-muted">
                          {appSearchQuery
                            ? language === 'ar'
                              ? 'لا توجد نتائج مطابقة للبحث'
                              : 'No matching apps found'
                            : language === 'ar'
                              ? 'لم يتم العثور على تطبيقات أو أنت لست على جهاز أندرويد. يمكنك الاختيار من قائمة "شائعة" أو "يدوي".'
                              : 'No installed apps detected. You can choose from "Popular" or "Custom".'}
                        </div>
                      ) : (
                        filteredInstalled.map((app) => {
                          const isAdded = selectedApps.includes(app.packageName);
                          return (
                            <div
                              key={app.packageName}
                              onClick={() => handleToggleApp(app.packageName, app.name, app.icon)}
                              className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                                isAdded
                                  ? 'bg-theme-subtle border-theme-accent shadow-xs'
                                  : 'bg-theme-subtle/30 hover:bg-theme-subtle border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                <AppIcon icon={app.icon} name={app.name} packageName={app.packageName} />
                                <div className="truncate">
                                  <p className="text-xs font-semibold text-theme-primary truncate">
                                    {app.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-theme-secondary truncate">
                                    {app.packageName}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 ml-2 rtl:ml-0 rtl:mr-2 ${
                                  isAdded
                                    ? 'bg-theme-accent border-theme-accent text-white'
                                    : 'border-theme-divider'
                                }`}
                              >
                                {isAdded && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {activeModalTab === 'presets' && (
                    <>
                      {filteredPresets.map((p) => {
                        const isAdded = selectedApps.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleToggleApp(p.id, p.name, p.icon)}
                            className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                              isAdded
                                ? 'bg-theme-subtle border-theme-accent shadow-xs'
                                : 'bg-theme-subtle/30 hover:bg-theme-subtle border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                              <AppIcon icon={p.icon} name={p.name} packageName={p.id} />
                              <div className="truncate">
                                <p className="text-xs font-semibold text-theme-primary truncate">{p.name}</p>
                                <p className="text-[10px] font-mono text-theme-secondary truncate">{p.id}</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 ml-2 rtl:ml-0 rtl:mr-2 ${
                                isAdded
                                  ? 'bg-theme-accent border-theme-accent text-white'
                                  : 'border-theme-divider'
                              }`}
                            >
                              {isAdded && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {activeModalTab === 'custom' && (
                    <div className="space-y-3 py-2">
                      <p className="text-xs text-theme-secondary leading-relaxed">
                        {language === 'ar'
                          ? 'أدخل اسم حزمة التطبيق (Package Name) بالضبط مثل com.google.android.youtube أو اسم الملف.'
                          : 'Enter the exact application package name or executable.'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customAppName}
                          onChange={(e) => setCustomAppName(e.target.value)}
                          placeholder="e.g. com.example.iptv"
                          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent select-text"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustomApp();
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const clip = await navigator.clipboard.readText();
                              if (clip) setCustomAppName(clip.trim());
                            } catch (e) {}
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-800 text-teal-400 border border-teal-500/30 text-xs font-bold hover:bg-zinc-700 cursor-pointer flex items-center gap-1"
                        >
                          <span>📋</span>
                          <span>{language === 'ar' ? 'لصق' : 'Paste'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomApp}
                          className="px-4 py-2 rounded-xl bg-theme-accent text-white text-xs font-bold hover:opacity-90 cursor-pointer shadow-sm active:scale-95"
                        >
                          {language === 'ar' ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-theme-divider flex items-center justify-between">
                  <span className="text-xs text-theme-secondary">
                    {language === 'ar' ? `المحدد: ${selectedApps.length}` : `Selected: ${selectedApps.length}`}
                  </span>
                  <button
                    onClick={() => setIsAddAppModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-theme-accent text-white text-xs font-semibold cursor-pointer hover:opacity-90"
                  >
                    {language === 'ar' ? 'تم وحفظ' : 'Done'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Main Tunnel Screen (Matching Screenshot 1 & 3)
  // -------------------------------------------------------------
  const preferredIpOptions = [
    { id: 'auto', label: isAr ? 'تلقائي (Auto)' : 'Auto' },
    { id: 'ipv4', label: 'IPv4' },
    { id: 'ipv6', label: 'IPv6' },
  ];

  const currentIpObj =
    preferredIpOptions.find((p) => p.id === preferredIp) || preferredIpOptions[0];
  const currentVpnDnsObj =
    dnsOptions.find((d) => d.id === vpnDns) || dnsOptions[0];
  const currentMtuObj =
    mtuOptions.find((m) => m.id === tunnelMtu) || mtuOptions[0];

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
              {isAr ? 'إعدادات النفق والتوجيه' : 'Tunnel Settings'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-theme-muted tracking-wider uppercase mt-1 px-1">
            {isAr ? 'خيارات التوجيه، التجزئة، وتخصيص DNS و MTU' : 'TUNNEL & ROUTING OPTIONS'}
          </p>
        </div>

        {/* 1. Main Tunnel Settings Card */}
        <div className="bg-theme-card border border-theme-card rounded-3xl divide-y divide-theme-divider overflow-hidden shadow-lg transition-colors duration-200">
          {/* Routing Profiles */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'ملفات التوجيه (Routing Profiles)' : 'Routing Profiles'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr
                  ? 'تفعيل تقسيم مسارات النفق وتوجيه الحزم حسب القواعد المحددة'
                  : 'Enable split tunneling with routing profiles'}
              </p>
            </div>
            <ToggleSwitch
              checked={routingProfiles}
              onChange={() =>
                onUpdateSettings({ routingProfiles: !routingProfiles })
              }
            />
          </div>

          {/* Fragmentation */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'تجزئة الحزم (Fragmentation)' : 'Fragmentation'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr
                  ? 'تجزئة مصافحة TLS لتجاوز الحجب والقيود وفلاتر الرقابة'
                  : 'Split TLS hello for censorship bypass'}
              </p>
            </div>
            <ToggleSwitch
              checked={fragmentation}
              onChange={() =>
                onUpdateSettings({
                  fragmentation: !fragmentation,
                  tlsFragmentation: !fragmentation,
                })
              }
            />
          </div>

          {/* Mux */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'تعدد المسارات (Mux)' : 'Mux'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr
                  ? 'دمج اتصالات TCP في اتصال واحد لتقليل التأخير وتسريع فتح الروابط'
                  : 'Multiplex connections'}
              </p>
            </div>
            <ToggleSwitch
              checked={mux}
              onChange={() =>
                onUpdateSettings({
                  mux: !mux,
                  multiplexing: !mux,
                })
              }
            />
          </div>

          {/* Sniffing */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'فحص البروتوكول (Sniffing)' : 'Sniffing'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr
                  ? 'التعرف التلقائي على البروتوكولات ونطاقات المواقع لتوجيه دقيق'
                  : 'Detect protocol for routing'}
              </p>
            </div>
            <ToggleSwitch
              checked={sniffing}
              onChange={() => onUpdateSettings({ sniffing: !sniffing })}
            />
          </div>

          {/* Per-App Proxy Row */}
          <div
            onClick={() => setCurrentTunnelPage('perAppProxy')}
            className="p-4 sm:p-5 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-theme-primary group-hover:text-teal-400 transition-colors">
                  {isAr ? 'توجيه التطبيقات (Per-App Proxy)' : 'Per-App Proxy'}
                </h4>
                {perAppProxyEnabled && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    {perAppProxyMode === 'proxy_only'
                      ? (isAr ? 'تطبيق محدد فقط' : 'Proxy Only')
                      : (isAr ? 'استثناء' : 'Bypass')}
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr
                  ? 'تحديد تطبيقات معينة للاتصال بالبروكسي أو استثنائها (حل لمشكلة البنوك و STC)'
                  : 'Split tunneling per application'}
              </p>
            </div>
            <ChevronRight className={`w-4 h-4 text-theme-muted group-hover:text-theme-primary transition-colors ${isAr ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* 2. Preferred IP Section (Dropdown List) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-theme-primary px-1 block">
            {isAr ? 'بروتوكول IP المفضل' : 'Preferred IP'}
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsPreferredIpOpen(!isPreferredIpOpen);
                setIsVpnDnsOpen(false);
                setIsTunnelMtuOpen(false);
              }}
              className="w-full px-4 py-3.5 rounded-2xl bg-theme-card border border-theme-card hover:border-theme-accent/80 transition-all flex items-center justify-between cursor-pointer shadow-md text-left rtl:text-right"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-bold text-theme-primary uppercase">
                  {currentIpObj.label}
                </span>
                {preferredIp === 'auto' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {isAr ? 'موصى به' : 'Recommended'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`w-4 h-4 text-teal-400 transition-transform duration-200 ${
                    isPreferredIpOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Options */}
            {isPreferredIpOpen && (
              <div className="mt-1.5 bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-2xl animate-fadeIn z-20">
                {preferredIpOptions.map((opt) => {
                  const isSelected = preferredIp === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        onUpdateSettings({ preferredIp: opt.id as any });
                        setIsPreferredIpOpen(false);
                      }}
                      className={`px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-theme-subtle text-teal-400 font-bold border-l-4 rtl:border-l-0 rtl:border-r-4 border-teal-400'
                          : 'hover:bg-theme-card-hover text-theme-secondary hover:text-theme-primary'
                      }`}
                    >
                      <span className="text-xs sm:text-sm uppercase font-bold">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-400 stroke-[3]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. VPN DNS Section (Dropdown List) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-theme-primary">
              {isAr ? 'خوادم أسماء النطاقات للنفق (VPN DNS)' : 'VPN DNS'}
            </label>
            <span className="text-[11px] text-theme-muted">
              {isAr ? 'انقر لتغيير خادم DNS' : 'Tap to change DNS'}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsVpnDnsOpen(!isVpnDnsOpen);
                setIsPreferredIpOpen(false);
                setIsTunnelMtuOpen(false);
              }}
              className="w-full px-4 py-3.5 rounded-2xl bg-theme-card border border-theme-card hover:border-theme-accent/80 transition-all flex items-center justify-between cursor-pointer shadow-md text-left rtl:text-right"
            >
              <div className="min-w-0 pr-3 rtl:pr-0 rtl:pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary truncate">
                    {currentVpnDnsObj.title}
                  </span>
                  {vpnDns === 'custom' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {isAr ? 'مخصص' : 'Custom'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-theme-secondary mt-0.5 truncate">
                  {currentVpnDnsObj.ip}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {currentVpnDnsObj.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCustomDnsOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-teal-400 hover:text-white hover:bg-theme-subtle transition-colors cursor-pointer border border-teal-500/30"
                    title={isAr ? 'تعديل DNS المخصص' : 'Edit Custom DNS'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-teal-400 transition-transform duration-200 ${
                    isVpnDnsOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Options */}
            {isVpnDnsOpen && (
              <div className="mt-1.5 bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-2xl animate-fadeIn z-20">
                {dnsOptions.map((opt) => {
                  const isSelected = vpnDns === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        onUpdateSettings({ vpnDns: opt.id as any });
                        setIsVpnDnsOpen(false);
                        if (opt.isCustom) {
                          setIsCustomDnsOpen(true);
                        }
                      }}
                      className={`p-3.5 sm:p-4 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-theme-subtle text-teal-400 border-l-4 rtl:border-l-0 rtl:border-r-4 border-teal-400'
                          : 'hover:bg-theme-card-hover text-theme-secondary hover:text-theme-primary'
                      }`}
                    >
                      <div>
                        <h5
                          className={`text-xs sm:text-sm font-bold ${
                            isSelected ? 'text-teal-400' : 'text-theme-primary'
                          }`}
                        >
                          {opt.title}
                        </h5>
                        <p className="text-[11px] font-mono text-theme-secondary mt-0.5">
                          {opt.ip}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {opt.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCustomDnsOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-subtle transition-colors"
                            title={isAr ? 'تعديل DNS المخصص' : 'Edit Custom DNS'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-400 stroke-[3]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Tunnel MTU Section (Dropdown List) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-theme-primary">
              {isAr ? 'حجم حزم النفق (Tunnel MTU)' : 'Tunnel MTU'}
            </label>
            <span className="text-[11px] text-theme-muted">
              {isAr ? 'انقر لتعديل MTU' : 'Tap to change MTU'}
            </span>
          </div>

          <p className="text-xs text-theme-secondary leading-relaxed px-1">
            {isAr
              ? 'حجم أقصى وحدة نقل (MTU) لبطاقة النفق TUN. لا تقم بتغييره إلا إذا واجهت توقفاً أو بطئاً في تحميل البيانات: جرّب 1420، ثم 1380، ثم 1280. يطبق التغيير بعد إعادة الاتصال.'
              : 'MTU of the TUN interface, not a server protocol setting. Change only if you see stalls: try 1420, then 1380, then 1280. Applied after reconnecting.'}
          </p>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsTunnelMtuOpen(!isTunnelMtuOpen);
                setIsPreferredIpOpen(false);
                setIsVpnDnsOpen(false);
              }}
              className="w-full px-4 py-3.5 rounded-2xl bg-theme-card border border-theme-card hover:border-theme-accent/80 transition-all flex items-center justify-between cursor-pointer shadow-md text-left rtl:text-right"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-bold text-theme-primary">
                  {currentMtuObj.label}
                </span>
                {tunnelMtu === 'custom' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {isAr ? 'مخصص' : 'Custom'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentMtuObj.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCustomMtuOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-teal-400 hover:text-white hover:bg-theme-subtle transition-colors cursor-pointer border border-teal-500/30"
                    title={isAr ? 'تعديل MTU المخصص' : 'Edit Custom MTU'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-teal-400 transition-transform duration-200 ${
                    isTunnelMtuOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Options */}
            {isTunnelMtuOpen && (
              <div className="mt-1.5 bg-theme-card border border-theme-card rounded-2xl divide-y divide-theme-divider overflow-hidden shadow-2xl animate-fadeIn z-20">
                {mtuOptions.map((opt) => {
                  const isSelected = tunnelMtu === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        onUpdateSettings({ tunnelMtu: opt.id as any });
                        setIsTunnelMtuOpen(false);
                        if (opt.isCustom) {
                          setIsCustomMtuOpen(true);
                        }
                      }}
                      className={`p-3.5 sm:p-4 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-theme-subtle text-teal-400 border-l-4 rtl:border-l-0 rtl:border-r-4 border-teal-400 font-bold'
                          : 'hover:bg-theme-card-hover text-theme-secondary hover:text-theme-primary'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold">
                        {opt.label}
                      </span>

                      <div className="flex items-center gap-2">
                        {opt.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCustomMtuOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-subtle transition-colors"
                            title={isAr ? 'تعديل MTU المخصص' : 'Edit Custom MTU'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-400 stroke-[3]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom DNS Modal */}
      {isCustomDnsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-750 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تخصيص خوادم DNS للنفق' : 'Custom VPN DNS'}
              </h3>
              <button
                onClick={() => setIsCustomDnsOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-zinc-300 font-medium">
                {isAr ? 'أدخل عناوين خوادم DNS (مفصولة بفواصل):' : 'Enter DNS Server IP Addresses (comma-separated):'}
              </label>
              <input
                type="text"
                value={customDnsInput}
                onChange={(e) => setCustomDnsInput(e.target.value)}
                placeholder="1.1.1.1, 8.8.8.8"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 select-text"
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setIsCustomDnsOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onUpdateSettings({
                    customVpnDns: customDnsInput.trim() || '1.1.1.1, 8.8.8.8',
                    vpnDns: 'custom',
                  });
                  setIsCustomDnsOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom MTU Modal */}
      {isCustomMtuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-750 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تخصيص قيمة MTU للنفق' : 'Custom Tunnel MTU'}
              </h3>
              <button
                onClick={() => setIsCustomMtuOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-zinc-300 font-medium">
                {isAr ? 'أدخل قيمة MTU (من 1280 إلى 1500):' : 'Enter MTU Value (e.g. 1280 - 1500):'}
              </label>
              <input
                type="number"
                value={customMtuInput}
                onChange={(e) => setCustomMtuInput(e.target.value)}
                placeholder="1420"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 select-text"
              />
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setIsCustomMtuOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const val = parseInt(customMtuInput, 10) || 1420;
                  onUpdateSettings({
                    customTunnelMtu: val,
                    tunnelMtu: 'custom',
                  });
                  setIsCustomMtuOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};