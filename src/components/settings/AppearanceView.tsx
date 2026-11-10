import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronUp,
  CircleDot,
  ToggleLeft,
  Globe,
  Gamepad2,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { AppSettings } from '../../types';

interface AppearanceViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBack: () => void;
}

export const AppearanceView: React.FC<AppearanceViewProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  // Modal State for Language and App Icon
  const [activeSubModal, setActiveSubModal] = useState<'language' | 'appIcon' | null>(null);

  const isAr = settings.language === 'ar';
  const currentTheme = settings.appearanceTheme || 'dark';
  const connectionStyle = settings.connectionStyle || 'classic';
  const pinConnectionButton = settings.pinConnectionButton ?? false;
  const hardwareAcceleration = settings.hardwareAcceleration ?? true;
  const disableFontSmoothing = settings.disableFontSmoothing ?? false;
  const reduceMotion = settings.reduceMotion ?? false;
  const scale = settings.interfaceScale ?? 100;
  const currentAppIcon = settings.appIcon || 'default';

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

  // Scale slider steps
  const scaleSteps = [75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150];
  const activeIdx = Math.max(0, scaleSteps.indexOf(scale));
  const fillWidthPercent = (activeIdx / (scaleSteps.length - 1)) * 100;

  // Language options - Arabic & English only
  const languageOptions = [
    {
      id: 'ar',
      name: 'العربية',
      nativeName: 'Arabic (العربية)',
      flag: '🇸🇦',
      appLang: 'ar' as const,
    },
    {
      id: 'en',
      name: 'English',
      nativeName: 'English (United States)',
      flag: '🇺🇸',
      appLang: 'en' as const,
    },
  ];

  // App Icon options
  const appIconOptions = [
    {
      id: 'default',
      name: isAr ? 'نوفا الكلاسيكية' : 'Nova Classic',
      subtitle: isAr ? 'أيقونة نوفا الفضائية باللون البنفسجي والأزرق (الافتراضية)' : 'Cosmic Indigo & Violet 3D Orbit (Default)',
      src: '/app_icon_default.png',
    },
    {
      id: 'purple',
      name: isAr ? 'السديم المتوهج' : 'Neon Nebula',
      subtitle: isAr ? 'توهج بنفسجي ووردي فائق السطوع' : 'Electric Violet & Magenta Burst',
      src: '/app_icon_purple.png',
    },
    {
      id: 'blue',
      name: isAr ? 'الأفق الأزرق' : 'Cyber Cobalt',
      subtitle: isAr ? 'أزرق سماوي وأزرق بحري عميق' : 'Vibrant Cyan & Deep Navy Gradient',
      src: '/app_icon_blue.png',
    },
    {
      id: 'green',
      name: isAr ? 'الزمرد الأخضر' : 'Emerald Shield',
      subtitle: isAr ? 'أخضر ليموني نيون مع هالة حماية' : 'Matrix Lime & Cyberpunk Hex Shield',
      src: '/app_icon_green.png',
    },
    {
      id: 'dark',
      name: isAr ? 'العقيق الأسود' : 'Stealth Onyx',
      subtitle: isAr ? 'تيتانيوم كربوني أسود مطفي فاخر' : 'Matte Titanium Carbon & Silver Ring',
      src: '/app_icon_dark.png',
    },
  ];

  const currentLanguageLabel = isAr ? '🇸🇦 العربية' : '🇺🇸 English';

  const currentAppIconObj =
    appIconOptions.find(o => o.id === currentAppIcon) || appIconOptions[0];

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
              {isAr ? 'المظهر واللغة' : 'Appearance & Language'}
            </h1>
          </div>
          <p className="text-[11px] font-bold text-theme-muted tracking-wider uppercase mt-1 px-1">
            {isAr ? 'خيارات الواجهة، الألوان، وأنماط العرض' : 'APPEARANCE, THEMES & DISPLAY'}
          </p>
        </div>

        {/* Main Appearance Card */}
        <div className="bg-theme-card border border-theme-card rounded-3xl divide-y divide-theme-divider overflow-hidden shadow-lg transition-colors duration-200">
          {/* 1. Theme Section */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-theme-primary">
                {isAr ? 'نمط المظهر (الثيم)' : 'Theme'}
              </span>
              <span className="text-xs font-bold text-teal-400 capitalize">
                {currentTheme === 'dark' ? (isAr ? 'الداكن' : 'Dark') : currentTheme === 'green' ? (isAr ? 'الأخضر' : 'Green') : currentTheme === 'light' ? (isAr ? 'الفاتح' : 'Light') : (isAr ? 'تلقائي' : 'System')}
              </span>
            </div>

            {/* 4 Theme preview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              {/* Dark Theme */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ appearanceTheme: 'dark' })}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  currentTheme === 'dark'
                    ? 'border-teal-400 bg-theme-subtle shadow-md shadow-teal-500/20'
                    : 'border-theme-card bg-theme-card hover:border-theme-accent/50'
                }`}
              >
                <div className="w-full h-10 rounded-xl bg-[#090b0e] border border-zinc-850 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-teal-400" />
                </div>
                <span className={`text-xs font-bold ${currentTheme === 'dark' ? 'text-teal-400' : 'text-theme-secondary'}`}>
                  {isAr ? 'الداكن (Dark)' : 'Dark'}
                </span>
              </button>

              {/* Green Theme */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ appearanceTheme: 'green' })}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  currentTheme === 'green'
                    ? 'border-emerald-400 bg-theme-subtle shadow-md shadow-emerald-500/20'
                    : 'border-theme-card bg-theme-card hover:border-theme-accent/50'
                }`}
              >
                <div className="w-full h-10 rounded-xl bg-[#08150c] border border-emerald-900/80 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-emerald-400" />
                </div>
                <span className={`text-xs font-bold ${currentTheme === 'green' ? 'text-emerald-400' : 'text-theme-secondary'}`}>
                  {isAr ? 'الأخضر (Emerald)' : 'Green'}
                </span>
              </button>

              {/* Light Theme */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ appearanceTheme: 'light' })}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  currentTheme === 'light'
                    ? 'border-blue-400 bg-theme-subtle shadow-md shadow-blue-500/20'
                    : 'border-theme-card bg-theme-card hover:border-theme-accent/50'
                }`}
              >
                <div className="w-full h-10 rounded-xl bg-[#f8fafc] border border-slate-300 flex items-center justify-center shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-blue-600" />
                </div>
                <span className={`text-xs font-bold ${currentTheme === 'light' ? 'text-blue-500' : 'text-theme-secondary'}`}>
                  {isAr ? 'الفاتح (Light)' : 'Light'}
                </span>
              </button>

              {/* System Theme */}
              <button
                type="button"
                onClick={() => onUpdateSettings({ appearanceTheme: 'system' })}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  currentTheme === 'system'
                    ? 'border-purple-400 bg-theme-subtle shadow-md shadow-purple-500/20'
                    : 'border-theme-card bg-theme-card hover:border-theme-accent/50'
                }`}
              >
                <div className="w-full h-10 rounded-xl bg-gradient-to-r from-[#090b0e] to-[#f8fafc] border border-zinc-700 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-purple-400" />
                </div>
                <span className={`text-xs font-bold ${currentTheme === 'system' ? 'text-purple-400' : 'text-theme-secondary'}`}>
                  {isAr ? 'تلقائي (System)' : 'System'}
                </span>
              </button>
            </div>

            {/* Connection style */}
            <div className="pt-3 space-y-2">
              <span className="text-xs font-bold text-theme-secondary block">
                {isAr ? 'نمط واجهة الشاشة الرئيسية:' : 'Connection Screen Style:'}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {/* Classic */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ connectionStyle: 'classic' })}
                  className={`p-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border-2 ${
                    connectionStyle === 'classic'
                      ? 'bg-theme-subtle border-teal-400 shadow-md text-teal-400'
                      : 'bg-theme-card border-theme-card text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  <CircleDot className="w-4.5 h-4.5" />
                  <span className="text-xs font-extrabold">
                    {isAr ? 'النمط الكلاسيكي (Classic)' : 'Classic Style'}
                  </span>
                </button>

                {/* Compact */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ connectionStyle: 'compact' })}
                  className={`p-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border-2 ${
                    connectionStyle === 'compact'
                      ? 'bg-theme-subtle border-teal-400 shadow-md text-teal-400'
                      : 'bg-theme-card border-theme-card text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  <ToggleLeft className="w-4.5 h-4.5" />
                  <span className="text-xs font-extrabold">
                    {isAr ? 'النمط المدمج (Compact)' : 'Compact Style'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Pin connection button */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'تثبيت زر الاتصال' : 'Pin connection button'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'في النمط الكلاسيكي، يتم تمرير قائمة الخوادم مع بقاء زر الاتصال ثابتاً في الواجهة' : 'In Classic mode, only the server list scrolls. Turn off to scroll the whole screen.'}
              </p>
            </div>
            <ToggleSwitch
              checked={pinConnectionButton}
              onChange={() =>
                onUpdateSettings({ pinConnectionButton: !pinConnectionButton })
              }
            />
          </div>

          {/* 3. Language - Interactive Row */}
          <div
            onClick={() => setActiveSubModal('language')}
            className="p-4 sm:p-5 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-theme-primary group-hover:text-teal-400 transition-colors">
                  {isAr ? 'لغة التطبيق' : 'Language'}
                </h4>
                <p className="text-xs text-teal-400 font-bold mt-0.5 flex items-center gap-1.5">
                  {currentLanguageLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
              <span>{isAr ? 'تغيير' : 'Change'}</span>
              <ChevronRight className={`w-4 h-4 text-theme-muted group-hover:text-theme-primary transition-colors ${isAr ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* 4. App Icon - Interactive Row */}
          <div
            onClick={() => setActiveSubModal('appIcon')}
            className="p-4 sm:p-5 flex items-center justify-between hover:bg-theme-card-hover transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-theme-primary group-hover:text-purple-400 transition-colors">
                  {isAr ? 'شعار وأيقونة التطبيق' : 'App Icon'}
                </h4>
                <p className="text-xs text-theme-secondary mt-0.5">
                  {currentAppIconObj.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <img
                src={currentAppIconObj.src}
                alt={currentAppIconObj.name}
                className="w-8 h-8 rounded-xl object-contain border border-theme-card shadow-sm bg-theme-subtle p-0.5"
              />
              <ChevronRight className={`w-4 h-4 text-theme-muted group-hover:text-theme-primary transition-colors ${isAr ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* 5. Hardware acceleration */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'تسريع العتاد (Hardware Acceleration)' : 'Hardware acceleration'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'استخدام معالج الرسومات لزيادة سرعة وسلاسة الواجهة وتقليل استهلاك البطارية' : 'Use GPU rendering for smoother performance and lower CPU consumption'}
              </p>
            </div>
            <ToggleSwitch
              checked={hardwareAcceleration}
              onChange={() =>
                onUpdateSettings({ hardwareAcceleration: !hardwareAcceleration })
              }
            />
          </div>

          {/* 6. Disable font smoothing */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'إلغاء تنعيم الخطوط' : 'Disable font smoothing'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'عرض النصوص بحدّة عالية وبدون تنعيم الخط' : 'Render text without anti-aliasing'}
              </p>
            </div>
            <ToggleSwitch
              checked={disableFontSmoothing}
              onChange={() =>
                onUpdateSettings({ disableFontSmoothing: !disableFontSmoothing })
              }
            />
          </div>

          {/* 7. Reduce motion */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-theme-primary">
                {isAr ? 'تقليل المؤثرات الحركية' : 'Reduce motion'}
              </h4>
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {isAr ? 'إيقاف الحركات والأنيميشن لتسريع التنقل الفوري في الشاشات' : 'Turn off animations and moving effects'}
              </p>
            </div>
            <ToggleSwitch
              checked={reduceMotion}
              onChange={() =>
                onUpdateSettings({ reduceMotion: !reduceMotion })
              }
            />
          </div>

          {/* 8. Interface Scale Slider */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-theme-primary">
                  {isAr ? 'حجم الواجهة والخطوط' : 'Interface Scale'}
                </h4>
                <p className="text-xs text-theme-secondary mt-0.5">
                  {isAr ? 'تكبير أو تصغير عناصر التطبيق لتناسب حجم شاشتك' : 'Adjust UI size for your display'}
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-teal-400 bg-theme-subtle px-3 py-1 rounded-xl border border-theme-card">
                {scale}%
              </span>
            </div>

            {/* Dotted Scale Slider */}
            <div className="pt-2 pb-2">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  const stepIndex = Math.round(ratio * (scaleSteps.length - 1));
                  onUpdateSettings({ interfaceScale: scaleSteps[stepIndex] });
                }}
                className="w-full h-3 rounded-full bg-zinc-800 relative flex items-center cursor-pointer select-none border border-zinc-700"
              >
                {/* Filled Accent Pill */}
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 absolute left-0 top-0 transition-all duration-150 flex items-center justify-end"
                  style={{ width: `calc(${fillWidthPercent}% + 8px)` }}
                >
                  <div className="w-1.5 h-6 rounded-full bg-white shadow-md absolute -right-0.5 pointer-events-none" />
                </div>

                {/* 16 Evenly spaced dots across the track */}
                <div className="w-full flex items-center justify-between px-2 z-10 pointer-events-auto">
                  {scaleSteps.map((stepVal, idx) => (
                    <button
                      key={stepVal}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateSettings({ interfaceScale: stepVal });
                      }}
                      className="w-2 h-2 rounded-full transition-transform hover:scale-150 p-0 m-0 border-none outline-none cursor-pointer"
                      style={{
                        backgroundColor:
                          idx <= activeIdx ? '#ffffff' : '#52525b',
                      }}
                      title={`${stepVal}%`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
      {activeSubModal === 'language' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4 text-theme-primary">
            <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary">
                    {isAr ? 'لغة التطبيق' : 'Application Language'}
                  </h3>
                  <p className="text-xs text-theme-secondary">
                    {isAr ? 'العربية والإنجليزية فقط' : 'Arabic & English only'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubModal(null)}
                className="text-theme-muted hover:text-theme-primary p-1.5 rounded-xl hover:bg-theme-subtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 py-1">
              {languageOptions.map((opt) => {
                const isSelected = settings.language === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onUpdateSettings({
                        languagePreference: opt.id as any,
                        language: opt.appLang,
                      });
                      setActiveSubModal(null);
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left rtl:text-right border-2 ${
                      isSelected
                        ? 'bg-theme-subtle border-teal-400 shadow-md shadow-teal-500/20'
                        : 'bg-theme-card border-theme-card hover:bg-theme-subtle hover:border-theme-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl">{opt.flag}</span>
                      <div>
                        <span className={`text-sm font-extrabold block ${isSelected ? 'text-teal-400' : 'text-theme-primary'}`}>
                          {opt.name}
                        </span>
                        <p className="text-xs text-theme-secondary mt-0.5">{opt.nativeName}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center text-black">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-theme-divider flex justify-end">
              <button
                onClick={() => setActiveSubModal(null)}
                className="px-5 py-2.5 rounded-xl bg-theme-subtle hover:bg-theme-card-hover text-theme-primary text-xs font-bold transition-all cursor-pointer border border-theme-card"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Icon Modal */}
      {activeSubModal === 'appIcon' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4 text-theme-primary">
            <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary">
                    {isAr ? 'أيقونة التطبيق' : 'App Icon'}
                  </h3>
                  <p className="text-xs text-theme-secondary">
                    {isAr ? 'اختر مظهر الأيقونة المفضل لديك' : 'Select your favorite icon theme'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubModal(null)}
                className="text-theme-muted hover:text-theme-primary p-1.5 rounded-xl hover:bg-theme-subtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 py-1 max-h-[60vh] overflow-y-auto pr-1">
              {appIconOptions.map((opt) => {
                const isSelected = currentAppIcon === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onUpdateSettings({ appIcon: opt.id as any });
                      setActiveSubModal(null);
                    }}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left rtl:text-right border-2 ${
                      isSelected
                        ? 'bg-theme-subtle border-purple-400 shadow-md shadow-purple-500/20'
                        : 'bg-theme-card border-theme-card hover:bg-theme-subtle hover:border-theme-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={opt.src}
                        alt={opt.name}
                        className="w-10 h-10 rounded-xl object-contain border border-theme-card shadow-sm bg-theme-subtle p-0.5"
                      />
                      <div>
                        <span className={`text-sm font-extrabold block ${isSelected ? 'text-purple-400' : 'text-theme-primary'}`}>
                          {opt.name}
                        </span>
                        <p className="text-xs text-theme-secondary mt-0.5">{opt.subtitle}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center text-black">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-theme-divider flex justify-end">
              <button
                onClick={() => setActiveSubModal(null)}
                className="px-5 py-2.5 rounded-xl bg-theme-subtle hover:bg-theme-card-hover text-theme-primary text-xs font-bold transition-all cursor-pointer border border-theme-card"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
