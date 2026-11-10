import React from 'react';
import { Globe2, ShieldCheck, Zap, Tv } from 'lucide-react';
import { ConnectionMode } from '../types';
import { translations } from '../services/i18n';

interface MobileHeaderProps {
  appIcon?: string;
  mode: ConnectionMode;
  onChangeMode: (mode: ConnectionMode) => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
  isConnected: boolean;
  onOpenTvSync?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  appIcon = 'default',
  mode,
  onChangeMode,
  language,
  onToggleLanguage,
  isConnected,
  onOpenTvSync,
}) => {
  const t = translations[language];

  return (
    <header className="md:hidden w-full bg-theme-sidebar/95 backdrop-blur-md border-b border-theme-card px-3.5 py-2.5 flex items-center justify-between select-none z-30 transition-colors duration-200 pt-[calc(0.6rem+env(safe-area-inset-top,0px))]">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <img
            src={`/app_icon_${appIcon}.png`}
            alt="NovaProxy"
            className="w-8.5 h-8.5 rounded-xl object-contain shadow-md shadow-purple-600/40 border border-purple-500/40 flex-shrink-0 bg-black/50 p-0.5"
          />
          {isConnected && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-incy-green border-2 border-theme-sidebar animate-pulse" />
          )}
        </div>
        <div className="flex items-baseline font-sans tracking-tight">
          <span className="text-lg font-black text-white">Nova</span>
          <span className="text-lg font-black bg-gradient-to-r from-[#9d4edd] to-[#3a86ff] bg-clip-text text-transparent">
            Proxy
          </span>
        </div>
      </div>

      {/* Right Actions: Mode Selector & Language Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mode Pill Toggle (TUN | Proxy) */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-[11px] font-bold">
          <button
            onClick={() => onChangeMode('tun')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mode === 'tun'
                ? 'bg-theme-accent text-white border border-theme-accent shadow-xs'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            TUN
          </button>
          <button
            onClick={() => onChangeMode('system_proxy')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mode === 'system_proxy'
                ? 'bg-theme-accent text-white border border-theme-accent shadow-xs'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            {language === 'ar' ? 'بروكسي' : 'Proxy'}
          </button>
        </div>

        {/* TV Sync Button */}
        {onOpenTvSync && (
          <button
            onClick={onOpenTvSync}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-xs font-bold text-teal-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            title={language === 'ar' ? 'مزامنة مع التلفزيون' : 'TV Sync'}
          >
            <Tv className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px] font-extrabold">TV</span>
          </button>
        )}

        {/* Language Switcher */}
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-xs"
          title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe2 className="w-3.5 h-3.5 text-theme-accent" />
          <span className="text-[11px] font-extrabold uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
};
