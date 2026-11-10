import React from 'react';
import { Shield, Server, Settings, ChevronLeft, ChevronRight, Globe2 } from 'lucide-react';
import { translations } from '../services/i18n';
import { AccentColor } from '../types';

interface SidebarProps {
  currentTab: 'home' | 'servers' | 'settings';
  onSelectTab: (tab: 'home' | 'servers' | 'settings') => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  appIcon?: string;
  version?: string;
  isConnected?: boolean;
  accentColor?: AccentColor;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  language,
  onToggleLanguage,
  isCollapsed = false,
  onToggleCollapse,
  appIcon = 'default',
  version,
  isConnected = false,
  accentColor = 'blue',
}) => {
  const t = translations[language];

  // Colors based on current tab or accent
  const getTabActiveClass = (tab: 'home' | 'servers' | 'settings') => {
    if (currentTab !== tab) {
      return 'text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover';
    }

    return 'bg-theme-card text-theme-accent border border-theme-accent shadow-sm';
  };

  return (
    <aside
      className={`hidden md:flex h-full bg-theme-sidebar border-r border-theme-card flex-col justify-between transition-all duration-300 select-none z-40 ${
        isCollapsed ? 'w-18' : 'w-56'
      }`}
    >
      {/* Top Branding Section */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* NovaProxy Logo Icon */}
            <img
              src={`/app_icon_${appIcon}.png`}
              alt="NovaProxy"
              className="w-10 h-10 rounded-2xl object-contain shadow-lg shadow-purple-600/35 flex-shrink-0 border border-purple-500/30 bg-black/40 p-0.5"
            />

            {!isCollapsed && (
              <div className="flex items-baseline font-sans tracking-tight" dir="ltr">
                <span className="text-xl font-extrabold text-theme-primary">Nova</span>
                <span className="text-xl font-extrabold bg-gradient-to-r from-[#9d4edd] to-[#3a86ff] bg-clip-text text-transparent">
                  Proxy
                </span>
              </div>
            )}
          </div>

          {/* Collapse Chevron Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-theme-muted hover:text-theme-primary p-1 rounded-md transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-[15px] transition-all duration-200 cursor-pointer ${getTabActiveClass(
            'home'
          )}`}
          title={t.navHome}
        >
          <div className="relative">
            <Shield className="w-5 h-5 flex-shrink-0" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            )}
          </div>
          {!isCollapsed && <span>{t.navHome}</span>}
        </button>

        {/* Servers */}
        <button
          onClick={() => onSelectTab('servers')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-[15px] transition-all duration-200 cursor-pointer ${getTabActiveClass(
            'servers'
          )}`}
          title={t.navServers}
        >
          <Server className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{t.navServers}</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-[15px] transition-all duration-200 cursor-pointer ${getTabActiveClass(
            'settings'
          )}`}
          title={t.navSettings}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{t.navSettings}</span>}
        </button>
      </nav>

      {/* Bottom Section: Language Switcher */}
      <div className="p-3 border-t border-theme-card">
        <button
          onClick={onToggleLanguage}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-theme-accent text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95"
          title={language === 'ar' ? 'التحويل للإنجليزية' : 'Switch to Arabic'}
        >
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-theme-accent" />
            {!isCollapsed && (
              <span>{language === 'ar' ? '🇸🇦 العربية' : '🇺🇸 English'}</span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-theme-accent font-bold">
              {language === 'ar' ? 'EN' : 'عربي'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
