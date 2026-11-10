import React, { useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface TitleBarProps {
  version?: string;
  appIcon?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ version, appIcon = 'default' }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isCapacitor = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && !!(window as any).Capacitor);

  // Never render desktop window bar on native mobile Android / Capacitor
  if (isCapacitor) {
    return null;
  }

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.maximize();
      setIsMaximized(!isMaximized);
    } else {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.close();
    } else {
      window.close();
    }
  };

  return (
    <header className="hidden md:flex h-8 bg-theme-header border-b border-theme-card items-center justify-between px-3 text-xs titlebar-drag select-none z-50 transition-colors duration-200">
      {/* Left Title: NovaProxy (No version) */}
      <div className="flex items-center gap-2" dir="ltr">
        <img
          src={`/app_icon_${appIcon}.png`}
          alt="NovaProxy"
          className="w-5 h-5 rounded-md object-contain bg-black/40 p-0.5 border border-purple-500/20"
        />
        <span className="font-extrabold tracking-wide text-theme-primary text-[13px]" dir="ltr">
          Nova<span className="text-[#818cf8]">Proxy</span>
        </span>
      </div>

      {/* Middle Draggable Area */}
      <div className="flex-1 h-full" />

      {/* Right Window Controls (Desktop Only) */}
      <div className="flex items-center titlebar-no-drag -mr-2">
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover transition-colors"
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover transition-colors"
          title="Maximize"
          aria-label="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center text-theme-secondary hover:text-white hover:bg-rose-600 transition-colors"
          title="Close"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
