import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeView } from './components/HomeView';
import { ServersView } from './components/ServersView';
import { SettingsView } from './components/SettingsView';
import { AddServerModal } from './components/AddServerModal';
import { ServerSelectModal } from './components/ServerSelectModal';
import { TvSyncModal } from './components/TvSyncModal';

import { Server, AppSettings, ConnectionState, TrafficStats, ConnectionMode } from './types';
import { StorageService } from './services/storageService';
import { proxyService } from './services/proxyController';
import { PingService } from './services/pingService';
import { parseBulkText } from './services/protocolParser';
import { fetchGeoLocation } from './services/geoService';
import { translations } from './services/i18n';

export const App: React.FC = () => {
  // App State
  const [currentTab, setCurrentTab] = useState<'home' | 'servers' | 'settings'>('home');
  const [servers, setServers] = useState<Server[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [trafficStats, setTrafficStats] = useState<TrafficStats>(proxyService.getStats());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPingingAll, setIsPingingAll] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isServerSelectOpen, setIsServerSelectOpen] = useState(false);
  const [isTvSyncOpen, setIsTvSyncOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Load initial servers & settings
  useEffect(() => {
    const loadedServers = StorageService.getServers();
    setServers(loadedServers);
    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);

    // Subscribe to proxy controller
    const unTraffic = proxyService.onTraffic(stats => {
      setTrafficStats(stats);
    });

    const unState = proxyService.onStateChange(state => {
      setConnectionState(state);
    });

    return () => {
      unTraffic();
      unState();
    };
  }, []);

  // Track currently resolving server IDs to prevent duplicate concurrent network lookups
  const resolvingGeoServerIds = useRef<Set<string>>(new Set());

  // Auto-resolve real Country, City and Flag for any servers with 'Global Node' or missing details
  useEffect(() => {
    if (servers.length === 0) return;
    const unknownServers = servers.filter(
      s => (!s.city || s.country === 'Global Node' || s.city === 'Fast Direct Server' || !s.countryAr || !s.cityAr || s.countryAr === 'خادم عالمي' || s.name.includes('Global Node')) &&
           s.host &&
           !resolvingGeoServerIds.current.has(s.id)
    );
    if (unknownServers.length === 0) return;

    let isMounted = true;
    (async () => {
      for (const srv of unknownServers) {
        resolvingGeoServerIds.current.add(srv.id);
        try {
          const loc = await fetchGeoLocation(srv.host, srv.name);
          if (loc && loc.country && loc.country !== 'Global Node') {
            if (!isMounted) return;
            setServers(current => {
              const enriched = current.map(s => {
                if (s.id === srv.id || (s.host === srv.host && s.port === srv.port)) {
                  return {
                    ...s,
                    country: loc.country,
                    city: loc.city,
                    countryAr: loc.countryAr,
                    cityAr: loc.cityAr,
                    flag: loc.flag,
                    name: `${loc.country} - ${loc.city}`,
                  };
                }
                return s;
              });
              StorageService.saveServers(enriched);
              return enriched;
            });
          } else {
            // Allow retry if GeoIP failed or returned generic
            resolvingGeoServerIds.current.delete(srv.id);
          }
        } catch (e) {
          console.warn('GeoIP resolution error for', srv.host, e);
          resolvingGeoServerIds.current.delete(srv.id);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [servers]);

  // Android TV Remote Control (D-Pad & Back key handler)
  useEffect(() => {
    const handleTvRemoteKey = (e: KeyboardEvent) => {
      // Android TV / Remote Back Button (Escape, GoBack, keyCode 27, 4)
      if (e.key === 'Escape' || e.key === 'GoBack' || e.keyCode === 27 || e.keyCode === 4) {
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
          e.preventDefault();
        } else if (isServerSelectOpen) {
          setIsServerSelectOpen(false);
          e.preventDefault();
        } else if (currentTab !== 'home') {
          setCurrentTab('home');
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleTvRemoteKey);
    return () => window.removeEventListener('keydown', handleTvRemoteKey);
  }, [isAddModalOpen, isServerSelectOpen, currentTab]);

  // Save settings when changed
  const updateSettings = (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  // 1. Apply Interface Scale dynamically
  useEffect(() => {
    const scale = settings.interfaceScale || 100;
    (document.documentElement.style as any).zoom = `${scale}%`;
  }, [settings.interfaceScale]);

  // 2. Apply Font Smoothing dynamically
  useEffect(() => {
    if (settings.disableFontSmoothing) {
      document.documentElement.style.webkitFontSmoothing = 'none';
      (document.documentElement.style as any).fontSmooth = 'never';
    } else {
      document.documentElement.style.webkitFontSmoothing = 'antialiased';
      (document.documentElement.style as any).fontSmooth = 'auto';
    }
  }, [settings.disableFontSmoothing]);

  // 3. Apply Reduce Motion dynamically
  useEffect(() => {
    const styleId = 'novaproxy-reduce-motion';
    let styleEl = document.getElementById(styleId);
    if (settings.reduceMotion) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `*, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }`;
        document.head.appendChild(styleEl);
      }
    } else if (styleEl) {
      styleEl.remove();
    }
  }, [settings.reduceMotion]);

  // 4. Apply Dynamic App Icon (Favicon & web badge)
  useEffect(() => {
    const iconKey = settings.appIcon || 'default';
    const iconUrl = `/app_icon_${iconKey}.png`;
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl;
  }, [settings.appIcon]);

  // 5. Global TV Sync Server & Listener
  useEffect(() => {
    // Start TV sync server so it's always ready to receive from phone/browser
    proxyService.startTvSyncServer().catch(() => {});

    const removeSync = proxyService.onTvSyncData((content: string) => {
      try {
        const parsed = parseBulkText(content);
        if (parsed && parsed.length > 0) {
          handleAddServers(parsed);
          showToast(`📺 ${settings.language === 'ar' ? 'تم استلام وتفعيل خوادم جديدة بنجاح!' : 'New servers received and activated!'}`);
        }
      } catch (e) {
        console.warn('Global TV Sync error:', e);
      }
    });

    return () => {
      removeSync();
    };
  }, [settings.language]);

  // Active Server
  const activeServer = useMemo(() => {
    if (servers.length === 0) return null;
    if (!settings.activeServerId) {
      return servers[0] || null;
    }
    return servers.find(s => s.id === settings.activeServerId) || servers[0] || null;
  }, [servers, settings.activeServerId]);

  // Handle select active server
  const handleSelectServer = async (server: Server) => {
    updateSettings({ activeServerId: server.id });
    showToast(`${translations[settings.language].currentServer}: ${server.name}`);
    if (connectionState === 'connected') {
      try {
        await proxyService.disconnect();
        setTimeout(async () => {
          await proxyService.connect(server, settings.mode, settings);
        }, 400);
      } catch (e) {
        console.error('Failed to switch connected server:', e);
      }
    }
  };

  // Handle add servers (with GeoIP auto-resolution for pure IPs or raw links)
  const handleAddServers = (newServers: Server[]) => {
    if (!newServers || newServers.length === 0) return;

    // Filter out identical existing servers (matching host + port)
    const existingMap = new Map(servers.map(s => [`${s.host}:${s.port}`, s]));
    const toAdd: Server[] = [];
    let targetActiveId: string | null = null;

    for (const ns of newServers) {
      const key = `${ns.host}:${ns.port}`;
      if (existingMap.has(key)) {
        // Merge & update existing server with better metadata if available
        const exist = existingMap.get(key)!;
        const betterCountry = ns.country && ns.country !== 'Global Node' ? ns.country : exist.country;
        const betterCity = ns.city && ns.city !== 'Fast Direct Server' ? ns.city : exist.city;
        const betterCountryAr = ns.countryAr && ns.countryAr !== 'خادم عالمي' ? ns.countryAr : exist.countryAr;
        const betterCityAr = ns.cityAr && ns.cityAr !== 'اتصال مباشر فائق السرعة' ? ns.cityAr : exist.cityAr;
        const betterFlag = ns.flag && ns.flag !== '🌐' ? ns.flag : exist.flag;

        const updatedServer: Server = {
          ...exist,
          ...ns,
          id: exist.id, // keep stable ID
          country: betterCountry,
          city: betterCity,
          countryAr: betterCountryAr,
          cityAr: betterCityAr,
          flag: betterFlag,
          name: `${betterCountry} - ${betterCity}`,
        };
        existingMap.set(key, updatedServer);
        if (!targetActiveId) targetActiveId = exist.id;
      } else {
        toAdd.push(ns);
        if (!targetActiveId) targetActiveId = ns.id;
      }
    }

    const merged = [...toAdd, ...Array.from(existingMap.values())];
    setServers(merged);
    StorageService.saveServers(merged);

    if (targetActiveId) {
      updateSettings({ activeServerId: targetActiveId });
    }
    showToast(`+${newServers.length} ${translations[settings.language].serversList}`);

    // If currently connected, immediately switch to the new/received server!
    if (connectionState === 'connected' && targetActiveId) {
      const activeObj = merged.find(s => s.id === targetActiveId);
      if (activeObj) {
        proxyService.disconnect().then(() => {
          setTimeout(() => {
            proxyService.connect(activeObj, settings.mode, settings);
          }, 400);
        });
      }
    }
  };

  // Handle delete server
  const handleDeleteServer = (id: string) => {
    const updated = servers.filter(s => s.id !== id);
    setServers(updated);
    StorageService.saveServers(updated);
    if (settings.activeServerId === id) {
      updateSettings({ activeServerId: updated.length > 0 ? updated[0].id : null });
    }
  };

  // Ping All
  const handlePingAll = async () => {
    if (isPingingAll || servers.length === 0) return;
    setIsPingingAll(true);
    try {
      const updated = await PingService.pingAll(servers, srv => {
        setServers(prev => prev.map(s => (s.id === srv.id ? srv : s)));
      });
      setServers(updated);
      StorageService.saveServers(updated);
    } finally {
      setIsPingingAll(false);
    }
  };

  // Ping Single
  const handlePingSingle = async (server: Server) => {
    const ping = await PingService.pingServer(server);
    let extra = {};
    if (!server.city || server.country === 'Global Node' || server.countryAr === 'خادم عالمي' || server.name.includes('Global Node')) {
      try {
        const geo = await fetchGeoLocation(server.host, server.name);
        if (geo && geo.country !== 'Global Node') {
          extra = {
            country: geo.country,
            city: geo.city,
            countryAr: geo.countryAr,
            cityAr: geo.cityAr,
            flag: geo.flag,
            name: `${geo.country} - ${geo.city}`,
          };
        }
      } catch (err) {
        console.warn('Ping geo lookup error:', err);
      }
    }
    const updated = servers.map(s => (s.id === server.id ? { ...s, ping, ...extra } : s));
    setServers(updated);
    StorageService.saveServers(updated);
  };

  // Toggle Connect / Disconnect
  const handleToggleConnect = async () => {
    if (connectionState === 'connected') {
      await proxyService.disconnect();
    } else if (connectionState === 'disconnected') {
      if (!activeServer) {
        setIsAddModalOpen(true);
        return;
      }
      if (
        settings.perAppProxyEnabled &&
        (settings.perAppProxyMode === 'proxy_only' || !settings.perAppProxyMode) &&
        (!settings.perAppSelectedApps || settings.perAppSelectedApps.length === 0)
      ) {
        showToast(
          settings.language === 'ar'
            ? 'يرجى اختيار تطبيق واحد على الأقل في إعدادات توجيه التطبيقات'
            : 'Please select at least one application in Per-App Proxy settings'
        );
        setCurrentTab('settings');
        return;
      }
      await proxyService.connect(activeServer, settings.mode, settings);
    }
  };

  // Quick Paste from Clipboard
  const handleQuickPaste = async () => {
    try {
      let clipboardText = '';
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        clipboardText = await (window as any).electronAPI.readClipboard();
      } else if (navigator.clipboard) {
        clipboardText = await navigator.clipboard.readText();
      }

      if (!clipboardText || !clipboardText.trim()) {
        showToast(translations[settings.language].pasteError);
        return;
      }

      const parsed = parseBulkText(clipboardText);
      if (parsed.length === 0) {
        showToast(translations[settings.language].pasteError);
        return;
      }

      handleAddServers(parsed);
      showToast(translations[settings.language].pasteSuccess);
    } catch (err) {
      console.error('Clipboard read failed:', err);
      showToast(translations[settings.language].pasteError);
    }
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    const nextLang = settings.language === 'ar' ? 'en' : 'ar';
    updateSettings({ language: nextLang });
  };

  // Resolve Theme & Apply [data-theme] to document.documentElement and body
  useEffect(() => {
    let resolved = settings.appearanceTheme || 'dark';
    if (resolved === 'system') {
      const isLight =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches;
      resolved = isLight ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    document.body.setAttribute('data-theme', resolved);
  }, [settings.appearanceTheme]);

  return (
    <div
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      className="h-screen w-screen flex flex-col bg-theme-app text-theme-primary select-none overflow-hidden font-sans transition-colors duration-200"
    >
      {/* Desktop Frameless Window Title Bar (hidden on mobile and native Android) */}
      <TitleBar appIcon={settings.appIcon} />

      {/* Mobile Top App Header (visible on mobile < md) */}
      <MobileHeader
        appIcon={settings.appIcon}
        mode={settings.mode}
        onChangeMode={m => updateSettings({ mode: m })}
        language={settings.language}
        onToggleLanguage={handleToggleLanguage}
        isConnected={connectionState === 'connected'}
        onOpenTvSync={() => setIsTvSyncOpen(true)}
      />

      {/* Main App Layout: Desktop Sidebar + Content Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Desktop Sidebar (hidden on mobile < md) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          language={settings.language}
          onToggleLanguage={handleToggleLanguage}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          appIcon={settings.appIcon}
          isConnected={connectionState === 'connected'}
          accentColor={settings.accentColor}
        />

        {/* Center Main Stage (full width on mobile, padded above mobile bottom nav) */}
        <main className="flex-1 h-full flex flex-col overflow-hidden relative w-full pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {currentTab === 'home' && (
            <HomeView
              mode={settings.mode}
              onChangeMode={m => updateSettings({ mode: m })}
              connectionState={connectionState}
              onToggleConnect={handleToggleConnect}
              activeServer={activeServer}
              trafficStats={trafficStats}
              language={settings.language}
              connectionStyle={settings.connectionStyle}
              pinConnectionButton={settings.pinConnectionButton}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onQuickPaste={handleQuickPaste}
              onOpenServerSelect={() => setIsServerSelectOpen(true)}
              onOpenTvSync={() => setIsTvSyncOpen(true)}
              onPingActiveServer={activeServer ? () => handlePingSingle(activeServer) : undefined}
              perAppProxyEnabled={settings.perAppProxyEnabled}
              perAppProxyMode={settings.perAppProxyMode}
              perAppSelectedApps={settings.perAppSelectedApps}
              perAppAppsMeta={settings.perAppAppsMeta}
              onOpenPerAppSettings={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'servers' && (
            <ServersView
              servers={servers}
              activeServerId={settings.activeServerId}
              onSelectServer={handleSelectServer}
              onDeleteServer={handleDeleteServer}
              onPingAll={handlePingAll}
              onPingSingle={handlePingSingle}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenTvSync={() => setIsTvSyncOpen(true)}
              language={settings.language}
              isPingingAll={isPingingAll}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={updateSettings}
              language={settings.language}
              onOpenTvSync={() => setIsTvSyncOpen(true)}
              trafficStats={trafficStats}
              servers={servers}
              onRestore={(newServers, newSettings) => {
                setServers(newServers);
                StorageService.saveServers(newServers);
                updateSettings(newSettings);
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (visible on mobile < md) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        serversCount={servers.length}
        isConnected={connectionState === 'connected'}
        language={settings.language}
        accentColor={settings.accentColor}
      />

      {/* Add Server Modal */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddServers={handleAddServers}
        language={settings.language}
      />

      {/* Quick Server Switcher Modal */}
      <ServerSelectModal
        isOpen={isServerSelectOpen}
        onClose={() => setIsServerSelectOpen(false)}
        servers={servers}
        activeServerId={settings.activeServerId}
        onSelectServer={handleSelectServer}
        onDeleteServer={handleDeleteServer}
        language={settings.language}
      />

      {/* TV & Mobile Sync Modal */}
      <TvSyncModal
        isOpen={isTvSyncOpen}
        onClose={() => setIsTvSyncOpen(false)}
        servers={servers}
        activeServer={activeServer}
        onAddServers={handleAddServers}
        language={settings.language}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#162114] border border-incy-green/60 text-incy-green text-xs font-semibold shadow-xl shadow-black/80 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-incy-green animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
