import React from 'react';
import { Shield, Server, Settings } from 'lucide-react';
import { translations } from '../services/i18n';
import { AccentColor } from '../types';

interface MobileBottomNavProps {
  currentTab: 'home' | 'servers' | 'settings';
  onSelectTab: (tab: 'home' | 'servers' | 'settings') => void;
  serversCount: number;
  isConnected: boolean;
  language: 'en' | 'ar';
  accentColor?: AccentColor;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  serversCount,
  isConnected,
  language,
}) => {
  const t = translations[language];

  const tabs: Array<{
    id: 'home' | 'servers' | 'settings';
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'home',
      label: t.navHome,
      icon: (
        <div className="relative">
          <Shield className="w-5 h-5 transition-transform group-active:scale-90" />
          {isConnected && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-incy-green animate-ping" />
          )}
        </div>
      ),
    },
    {
      id: 'servers',
      label: t.navServers,
      icon: (
        <div className="relative">
          <Server className="w-5 h-5 transition-transform group-active:scale-90" />
          {serversCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-bold bg-theme-accent text-white flex items-center justify-center shadow-md ring-2 ring-theme-sidebar">
              {serversCount}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: <Settings className="w-5 h-5 transition-transform group-active:scale-90" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 transition-colors duration-200 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around px-3">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-white font-black scale-105'
                  : 'text-zinc-400 hover:text-white font-medium'
              }`}
            >
              <div
                className={`p-1.5 px-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-theme-accent/25 border border-theme-accent/50 text-white shadow-md shadow-theme-accent/20'
                    : 'text-zinc-400 group-hover:text-white'
                }`}
              >
                {tab.icon}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-extrabold text-white' : 'font-semibold text-zinc-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
