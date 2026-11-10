import React, { useState } from 'react';

// Official & crisp vector SVG brand icons (Google Play style)
export const OFFICIAL_APP_ICONS: Record<string, string> = {
  // Google Play Store
  'com.android.vending': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#4CAF50" d="M6 5.8C5.4 6.4 5 7.4 5 8.7v30.6c0 1.3.4 2.3 1 2.9l19-19L6 5.8z"/><path fill="#FFC107" d="M31.2 18.2l-6.2 5 6.2 5 6.3-3.6c1.8-1 1.8-2.7 0-3.8l-6.3-2.6z"/><path fill="#FF3D00" d="M6 42.2l19-19 6.2 5-18.4 10.6c-2.3 1.3-4.8 1.4-6.8 3.4z"/><path fill="#1976D2" d="M6 5.8c2 2 4.5 2.1 6.8 3.4L31.2 19.8l-6.2 3.4-19-17.4z"/></svg>`,

  // YouTube
  'com.google.android.youtube': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23FF0000"/><path fill="%23FFFFFF" d="M19 14.5v19l15-9.5-15-9.5z"/></svg>`,

  // Google Chrome
  'com.android.chrome': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="%23ECEFF1"/><path fill="%234CAF50" d="M24 2a22 22 0 0 0-19.1 11L14 28l9.5-5.5 14.6 8.4A22 22 0 0 0 46 24h-22z"/><path fill="%23FFC107" d="M46 24a22 22 0 0 1-32.9 19.1L24 24h-10l-9.1-15.8A22 22 0 0 0 2 24a22 22 0 0 0 44 0z"/><path fill="%23F44336" d="M24 2c7.3 0 13.8 3.6 17.9 9.1L28 26l-4-2-9.9 5.8L4.9 13A22 22 0 0 1 24 2z"/><circle cx="24" cy="24" r="9.5" fill="%23FFFFFF"/><circle cx="24" cy="24" r="7.5" fill="%231976D2"/></svg>`,

  // Telegram
  'org.telegram.messenger': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="%2329B6F6"/><path fill="%23FFFFFF" d="M35.7 12.8L9.6 22.9c-1.8.7-1.8 1.7-.3 2.2l6.7 2.1 15.5-9.8c.7-.4 1.4-.2.9.3l-12.6 11.4-.5 7.1c.7 0 1-.3 1.4-.7l3.4-3.3 7 5.2c1.3.7 2.2.3 2.5-1.2l4.6-21.7c.5-1.9-.7-2.8-2.5-1.6z"/></svg>`,

  // WhatsApp
  'com.whatsapp': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="%2325D366"/><path fill="%23FFFFFF" d="M34.2 28.5c-.5-.2-2.9-1.4-3.3-1.6-.4-.2-.8-.2-1.1.2s-1.3 1.6-1.6 1.9c-.3.4-.6.4-1.1.2-3.1-1.3-5.2-3.6-6.5-6.7-.2-.5 0-.7.3-1 .3-.3.6-.7.9-1.1.3-.3.4-.6.2-1.1-.2-.4-1.1-2.6-1.5-3.6-.4-.9-.8-.8-1.1-.8h-1c-.3 0-.9.1-1.4.7-.5.5-1.9 1.9-1.9 4.6 0 2.7 2 5.3 2.3 5.7.3.4 3.9 6 9.4 8.4 3.6 1.6 5 1.7 6.8 1.4 1.1-.2 2.9-1.2 3.3-2.3.4-1.2.4-2.1.3-2.3-.2-.3-.6-.5-1.1-.7z"/></svg>`,

  // Netflix
  'com.netflix.mediaclient': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23141414"/><path fill="%23E50914" d="M14 10h6v28h-6zm14 0h6v28h-6z"/><path fill="%23B20710" d="M14 10l14 28h6L20 10z"/></svg>`,

  // Spotify
  'com.spotify.music': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="%231ED760"/><path fill="%23121212" d="M33.8 29.8c-.3.5-.9.7-1.4.4-4-2.5-9-3-15-1.7-.6.1-1.1-.3-1.2-.8-.1-.6.3-1.1.8-1.2 6.6-1.5 12.1-.9 16.5 1.8.5.3.7.9.3 1.5zm2.3-5.2c-.4.6-1.2.8-1.8.4-4.6-2.9-11.7-3.7-17.2-2-.7.2-1.4-.2-1.6-.9-.2-.7.2-1.4.9-1.6 6.3-1.9 14.1-1 19.3 2.2.6.5.8 1.3.4 1.9zm.2-5.4C30.6 16 21.8 15.6 15 17.7c-1 .3-2-.3-2.3-1.2-.3-1 .3-2 1.2-2.3 8-2.4 17.8-2 24.3 1.9 1 .6 1.3 1.8.7 2.7-.6.9-1.7 1.2-2.6.5z"/></svg>`,

  // Discord
  'com.discord': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%235865F2"/><path fill="%23FFFFFF" d="M34.5 14.5s-2.8-2-6-2.1l-.3.7c3.3 1 4.8 2.4 4.8 2.4-2.1-1.1-4.2-1.7-6.2-2-2.1-.3-4.2-.2-6.2.2-2.8.5-5.3 1.6-7.4 3 0 0 1.6-1.5 5.1-2.5l-.2-.6c-3.2.1-6 2.1-6 2.1s-3.7 5.7-4.1 14.8c3.2 2.4 6.3 2.3 6.3 2.3l1.3-1.8c-2.4-.7-3.3-2.2-3.3-2.2s.2.2.6.4c3.4 1.9 7.3 2.5 11 2.5s7.6-.6 11-2.5c.4-.2.6-.4.6-.4s-1 1.5-3.4 2.2l1.3 1.8s3.1.1 6.3-2.3c-.4-9.1-4.1-14.8-4.1-14.8zM18.8 24.4c-1.5 0-2.7-1.3-2.7-2.9s1.2-2.9 2.7-2.9 2.7 1.3 2.7 2.9-1.2 2.9-2.7 2.9zm10.4 0c-1.5 0-2.7-1.3-2.7-2.9s1.2-2.9 2.7-2.9 2.7 1.3 2.7 2.9-1.2 2.9-2.7 2.9z"/></svg>`,

  // Instagram
  'com.instagram.android': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><radialGradient id="ig" cx="20%" cy="110%" r="130%"><stop offset="0%" stop-color="%23fdf497"/><stop offset="25%" stop-color="%23fd5949"/><stop offset="50%" stop-color="%23d6249f"/><stop offset="100%" stop-color="%23285AEB"/></radialGradient></defs><rect width="48" height="48" rx="13" fill="url(%23ig)"/><rect x="11" y="11" width="26" height="26" rx="7" fill="none" stroke="%23FFFFFF" stroke-width="3.2"/><circle cx="24" cy="24" r="6" fill="none" stroke="%23FFFFFF" stroke-width="3.2"/><circle cx="31.5" cy="16.5" r="1.5" fill="%23FFFFFF"/></svg>`,

  // TikTok
  'com.zhiliaoapp.musically': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23010101"/><path fill="%2325F4EE" d="M28 10c.8 4 3.7 6.9 7.7 7.2v5.1c-2.8-.1-5.3-1.1-7.4-2.7v10.9c0 6.5-5.3 11.5-11.8 11.5S5 27 11.5 27c.9 0 1.8.1 2.6.4v5.3c-.8-.4-1.7-.6-2.6-.6-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5V10h6.5z"/><path fill="%23FE2C55" d="M30 8c.8 4 3.7 6.9 7.7 7.2v5.1c-2.8-.1-5.3-1.1-7.4-2.7v10.9c0 6.5-5.3 11.5-11.8 11.5S7 25 13.5 25c.9 0 1.8.1 2.6.4v5.3c-.8-.4-1.7-.6-2.6-.6-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5V8h6.5z"/><path fill="%23FFFFFF" d="M29 9c.8 4 3.7 6.9 7.7 7.2v5.1c-2.8-.1-5.3-1.1-7.4-2.7v10.9c0 6.5-5.3 11.5-11.8 11.5S6 26 12.5 26c.9 0 1.8.1 2.6.4v5.3c-.8-.4-1.7-.6-2.6-.6-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5V9h6.5z"/></svg>`,

  // X (Twitter)
  'com.twitter.android': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="%23000000"/><path fill="%23FFFFFF" d="M28.4 12h3.9l-8.5 9.7L33.8 36h-7.8l-6.1-8-7 8H9l9-10.3L8.4 12h8l5.5 7.3L28.4 12zm-1.4 21.6h2.2L14.7 14.2h-2.3l14.6 19.4z"/></svg>`,

  // Steam
  'com.valvesoftware.android.steam.community': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="st" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23111D2E"/><stop offset="100%" stop-color="%231B2838"/></linearGradient></defs><circle cx="24" cy="24" r="22" fill="url(%23st)"/><path fill="%23FFFFFF" d="M24 10a14 14 0 0 0-13.8 11.6l8.4 3.5a4.2 4.2 0 0 1 7.4-1.1l5.5-3.8A7 7 0 1 1 31.5 24l-3.8 5.5a4.2 4.2 0 0 1-5.7 4.2l-6.8-2.8A14 14 0 1 0 24 10zm7.5 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>`,

  // Firefox Browser
  'org.mozilla.firefox': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="ff" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23FF9400"/><stop offset="50%" stop-color="%23FF3A00"/><stop offset="100%" stop-color="%2390248A"/></linearGradient></defs><circle cx="24" cy="24" r="22" fill="url(%23ff)"/><path fill="%23FFFFFF" d="M24 6a18 18 0 1 0 18 18c0-7.2-4.2-13.5-10.4-16.4 1 2.3 1.4 4.8 1 7.4-1.2 7-6.8 12.3-13.8 12.3-4.5 0-8.5-2.2-11-5.7.5 4.3 3.5 7.8 7.6 9 6.2 1.8 12.8-.7 15.8-6.1 1.7-3 2.1-6.6 1.1-9.9-.4 2.2-1.5 4.2-3.1 5.7 1-4.7-.5-9.6-3.8-13.1-2.4-2.5-5.6-4.2-9-5.1 2.8 1 5.3 2.6 7.6 4.9z"/></svg>`,

  // IPTV Smarters Pro
  'com.nst.iptvsmarterstvbox': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="iptv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%237B1FA2"/><stop offset="100%" stop-color="%23311B92"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(%23iptv)"/><rect x="9" y="11" width="30" height="20" rx="4" fill="none" stroke="%23FFFFFF" stroke-width="2.5"/><path fill="%23FFFFFF" d="M22 17l8 5-8 5zM17 35h14M24 31v4" stroke="%23FFFFFF" stroke-width="2.5" stroke-linecap="round"/></svg>`,

  // Shahid VIP
  'net.mbc.shahid': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2300E5FF"/><stop offset="100%" stop-color="%23006064"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(%23sh)"/><path fill="%23FFFFFF" d="M12 28l4-12 8 8 8-8 4 12z"/><circle cx="24" cy="34" r="3" fill="%23FFD700"/></svg>`,
};

export const POPULAR_PRESET_APPS = [
  { id: 'com.android.vending', name: 'Google Play Store', icon: OFFICIAL_APP_ICONS['com.android.vending'] },
  { id: 'com.google.android.youtube', name: 'YouTube', icon: OFFICIAL_APP_ICONS['com.google.android.youtube'] },
  { id: 'com.android.chrome', name: 'Google Chrome', icon: OFFICIAL_APP_ICONS['com.android.chrome'] },
  { id: 'org.telegram.messenger', name: 'Telegram', icon: OFFICIAL_APP_ICONS['org.telegram.messenger'] },
  { id: 'com.whatsapp', name: 'WhatsApp', icon: OFFICIAL_APP_ICONS['com.whatsapp'] },
  { id: 'net.mbc.shahid', name: 'Shahid VIP (شاهد)', icon: OFFICIAL_APP_ICONS['net.mbc.shahid'] },
  { id: 'com.nst.iptvsmarterstvbox', name: 'IPTV Smarters Pro', icon: OFFICIAL_APP_ICONS['com.nst.iptvsmarterstvbox'] },
  { id: 'com.netflix.mediaclient', name: 'Netflix', icon: OFFICIAL_APP_ICONS['com.netflix.mediaclient'] },
  { id: 'com.spotify.music', name: 'Spotify', icon: OFFICIAL_APP_ICONS['com.spotify.music'] },
  { id: 'com.discord', name: 'Discord', icon: OFFICIAL_APP_ICONS['com.discord'] },
  { id: 'com.zhiliaoapp.musically', name: 'TikTok', icon: OFFICIAL_APP_ICONS['com.zhiliaoapp.musically'] },
  { id: 'com.instagram.android', name: 'Instagram', icon: OFFICIAL_APP_ICONS['com.instagram.android'] },
  { id: 'com.twitter.android', name: 'X (Twitter)', icon: OFFICIAL_APP_ICONS['com.twitter.android'] },
  { id: 'com.valvesoftware.android.steam.community', name: 'Steam', icon: OFFICIAL_APP_ICONS['com.valvesoftware.android.steam.community'] },
  { id: 'org.mozilla.firefox', name: 'Firefox Browser', icon: OFFICIAL_APP_ICONS['org.mozilla.firefox'] },
];

export const getPresetAppIcon = (packageName: string): string | undefined => {
  return OFFICIAL_APP_ICONS[packageName];
};

interface AppIconProps {
  icon?: string;
  name?: string;
  packageName?: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  icon,
  name = 'App',
  packageName,
  className = 'w-9 h-9 sm:w-10 sm:h-10',
}) => {
  const [imageError, setImageError] = useState(false);

  // 1. Try provided icon (Base64 from Android device or explicit SVG)
  const resolvedIcon = icon || (packageName ? OFFICIAL_APP_ICONS[packageName] : undefined);

  if (resolvedIcon && !imageError) {
    return (
      <img
        src={resolvedIcon}
        alt={name}
        className={`${className} rounded-xl object-contain shadow-xs bg-black/25 p-1 flex-shrink-0 transition-transform`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // 2. Elegant Google Play gradient tile fallback with app's initial letters
  const cleanName = (name || packageName || '?').trim();
  const initials = cleanName.length > 1 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase();

  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [
      'from-blue-600 to-indigo-700',
      'from-emerald-600 to-teal-700',
      'from-purple-600 to-violet-800',
      'from-rose-600 to-pink-700',
      'from-amber-500 to-orange-700',
      'from-cyan-600 to-blue-700',
    ];
    return hues[Math.abs(hash) % hues.length];
  };

  return (
    <div
      className={`${className} rounded-xl bg-gradient-to-br ${getGradient(cleanName)} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0 uppercase tracking-wider border border-white/10`}
    >
      {initials}
    </div>
  );
};
