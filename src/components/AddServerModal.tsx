import React, { useState, useEffect } from 'react';
import { X, Link2, Sliders, AlertCircle, CheckCircle, Sparkles, MapPin, Loader2, ChevronDown, Check } from 'lucide-react';
import { Server, ProtocolType, SecurityType } from '../types';
import { parseBulkText, detectCountryAndFlag, generateId, DetectedLocation } from '../services/protocolParser';
import { fetchGeoLocation } from '../services/geoService';
import { translations } from '../services/i18n';

// Normalize Arabic-Indic and Eastern Arabic-Indic numerals (٠-٩, ۰-۹) to standard Latin digits (0-9)
export function normalizeArabicNumbers(text: string): string {
  if (!text) return '';
  return text
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServers: (servers: Server[]) => void;
  language: 'en' | 'ar';
}

const PROTOCOL_OPTIONS: Array<{ id: ProtocolType; label: string }> = [
  { id: 'vless', label: 'VLESS' },
  { id: 'socks5', label: 'SOCKS5 Proxy' },
  { id: 'http', label: 'HTTP Proxy' },
  { id: 'hysteria2', label: 'Hysteria 2' },
  { id: 'trojan', label: 'Trojan' },
  { id: 'vmess', label: 'VMess' },
  { id: 'ss', label: 'Shadowsocks' },
];

const SECURITY_OPTIONS: Array<{ id: SecurityType; label: string }> = [
  { id: 'reality', label: 'Reality' },
  { id: 'tls', label: 'TLS' },
  { id: 'none', label: 'None' },
];

export const AddServerModal: React.FC<AddServerModalProps> = ({
  isOpen,
  onClose,
  onAddServers,
  language,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'paste' | 'manual'>('paste');

  // Paste / Bulk text
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Dropdown open states
  const [isProtocolDropdownOpen, setIsProtocolDropdownOpen] = useState(false);
  const [isSecurityDropdownOpen, setIsSecurityDropdownOpen] = useState(false);

  // Manual Form
  const [manualName, setManualName] = useState('');
  const [manualProtocol, setManualProtocol] = useState<ProtocolType>('vless');
  const [manualHost, setManualHost] = useState('');
  const [manualPort, setManualPort] = useState<string>('');
  const [manualUsername, setManualUsername] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manualUuid, setManualUuid] = useState('');
  const [manualSecurity, setManualSecurity] = useState<SecurityType>('reality');
  const [manualSni, setManualSni] = useState('gateway.icloud.com');
  const [manualPbk, setManualPbk] = useState('');
  const [manualSid, setManualSid] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [manualCity, setManualCity] = useState('');

  // Live GeoIP detection state
  const [detectedLoc, setDetectedLoc] = useState<DetectedLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Debounced live GeoIP detection when manualHost changes
  useEffect(() => {
    const raw = normalizeArabicNumbers(manualHost.trim());
    const clean = raw.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();
    if (!clean || clean.length < 3) {
      setDetectedLoc(null);
      return;
    }

    let isSubscribed = true;
    const timer = setTimeout(async () => {
      setIsDetectingLocation(true);
      try {
        const loc = await fetchGeoLocation(clean, manualName);
        if (isSubscribed) {
          setDetectedLoc(loc);
          if (loc.country !== 'Global Node') {
            setManualCountry(language === 'ar' ? loc.countryAr : loc.country);
            setManualCity(language === 'ar' ? loc.cityAr : loc.city);
          }
        }
      } catch {
        if (isSubscribed) {
          const loc = detectCountryAndFlag(manualName, clean);
          setDetectedLoc(loc);
          if (loc.country !== 'Global Node') {
            setManualCountry(language === 'ar' ? loc.countryAr : loc.country);
            setManualCity(language === 'ar' ? loc.cityAr : loc.city);
          }
        }
      } finally {
        if (isSubscribed) {
          setIsDetectingLocation(false);
        }
      }
    }, 500);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [manualHost, manualName, language]);

  if (!isOpen) return null;

  const handleParseAndAdd = async () => {
    setErrorMsg('');
    setSuccessCount(null);

    const parsed = parseBulkText(rawText);
    if (parsed.length === 0) {
      setErrorMsg(t.pasteError);
      return;
    }

    // Fast pre-resolve any pure IP server right away so user immediately sees real country
    for (const s of parsed) {
      if ((!s.country || s.country === 'Global Node') && s.host) {
        try {
          const loc = await fetchGeoLocation(s.host, s.name);
          if (loc && loc.country && loc.country !== 'Global Node') {
            s.country = loc.country;
            s.city = loc.city;
            s.countryAr = loc.countryAr;
            s.cityAr = loc.cityAr;
            s.flag = loc.flag;
            s.name = `${loc.country} - ${loc.city}`;
          }
        } catch {
          // Handled in background if network is slow
        }
      }
    }

    onAddServers(parsed);
    setSuccessCount(parsed.length);
    setTimeout(() => {
      onClose();
      setRawText('');
      setSuccessCount(null);
    }, 600);
  };

  const handleManualAdd = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');

    const rawHost = normalizeArabicNumbers(manualHost.trim());
    let host = rawHost;
    let rawPort = normalizeArabicNumbers(manualPort.trim()).replace(/[^0-9]/g, '');

    // Auto-detect host:port if user pasted something like 188.220.136.2:48120 or host.com:8080
    if (host.includes(':') && !host.startsWith('[')) {
      const parts = host.split(':');
      host = parts[0].trim();
      if (!rawPort && parts[1]) {
        rawPort = parts[1].trim();
      }
    }

    if (!host) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال عنوان الخادم (Host أو IP)' : 'Please enter server address (Host or IP)');
      return;
    }

    if (!rawPort) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال رقم المنفذ (Port)'
          : 'Please enter the port number'
      );
      return;
    }

    const portNumber = parseInt(rawPort, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال رقم منفذ (Port) صالح بين 1 و 65535'
          : 'Please enter a valid port number between 1 and 65535'
      );
      return;
    }

    const rawName = manualName.trim();
    const rawCountry = manualCountry.trim();
    const rawCity = manualCity.trim();

    let loc: DetectedLocation;
    if (rawCountry) {
      const match = detectCountryAndFlag(rawCountry + ' ' + (rawCity || ''), host);
      loc = {
        country: rawCountry,
        city: rawCity || match.city || rawCountry,
        countryAr: rawCountry,
        cityAr: rawCity || match.cityAr || rawCountry,
        flag: match.flag !== '🌐' ? match.flag : (detectedLoc?.flag || '🌐'),
      };
    } else if (detectedLoc && detectedLoc.country !== 'Global Node') {
      loc = detectedLoc;
    } else {
      setIsDetectingLocation(true);
      try {
        loc = await fetchGeoLocation(host, rawName);
      } catch {
        loc = detectCountryAndFlag(rawName, host);
      } finally {
        setIsDetectingLocation(false);
      }
    }

    const cleanName = rawName || (language === 'ar' ? `${loc.countryAr} - ${loc.cityAr}` : `${loc.country} - ${loc.city}`);

    const newServer: Server = {
      id: generateId(),
      name: cleanName,
      protocol: manualProtocol,
      host,
      port: portNumber,
      username: (manualProtocol === 'http' || manualProtocol === 'socks5') ? manualUsername.trim() : manualUuid.trim(),
      uuid: manualUuid.trim(),
      password: (manualProtocol === 'http' || manualProtocol === 'socks5') ? manualPassword.trim() : manualUuid.trim(),
      security: manualSecurity,
      sni: manualSni.trim(),
      pbk: manualPbk.trim(),
      sid: manualSid.trim(),
      country: loc.country,
      city: loc.city,
      countryAr: loc.countryAr,
      cityAr: loc.cityAr,
      flag: loc.flag,
      ping: 48,
      createdAt: Date.now(),
    };

    onAddServers([newServer]);
    onClose();
  };

  const handleInsertSample = (type: 'reality' | 'hy2' | 'trojan' | 'http' | 'socks') => {
    if (type === 'socks') {
      setRawText('socks://fiJ1J2IWltZwt9z:CfJKguVtatCfVV0@ojosario.toodcomp.win:48120#%F0%9F%87%AA%F0%9F%87%AC%20Egypt%20Cairo%20SOCKS5');
    } else if (type === 'http') {
      setRawText('http://aFxyu8E6QO6Kh28:7BPqHstEdqHsNlp@188.220.136.2:47168#%F0%9F%87%AA%F0%9F%87%AC%20Egypt%20Alexandria%20HTTP');
    } else if (type === 'reality') {
      setRawText(
        'vless://550e8400-e29b-41d4-a716-446655440000@us-lax.incy-node.net:443?type=tcp&security=reality&pbk=kP_9ywR3m2aB5h2Z1Eq8y1L7mY0Z4sX9bE5wO2m91&sid=4d5e6f7a&sni=gateway.icloud.com#%F0%9F%87%BA%F0%9F%87%B8%20US%20Fast%20Reality%20Node'
      );
    } else if (type === 'hy2') {
      setRawText(
        'hysteria2://password123@de-fra.incy-node.net:8443?sni=speed.cloudflare.com#%F0%9F%87%A9%F0%9F%87%AA%20DE%20Frankfurt%20Hysteria2'
      );
    } else {
      setRawText(
        'trojan://my-trojan-secret@sg-sin.incy-node.net:443?security=tls&sni=sg.speedtest.net#%F0%9F%87%B8%F0%9F%87%AC%20Singapore%20Trojan'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-theme-card border border-theme-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-theme-primary">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-theme-divider flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>{t.addServerTitle}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-theme-divider bg-theme-subtle/50 px-6 text-xs flex-shrink-0">
          <button
            onClick={() => {
              setActiveTab('paste');
              setErrorMsg('');
            }}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>{t.tabPaste}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              setErrorMsg('');
            }}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t.tabManual}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'paste' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-2">
                  Paste VLESS, VMess, Trojan, Shadowsocks, Hysteria 2 URI or Base64
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={e => {
                    setRawText(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="vless://... or hysteria2://... or trojan://..."
                  className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-2xl p-3 text-xs text-theme-primary font-mono outline-none resize-none transition-colors"
                />
              </div>

              {/* Sample Quick Links */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-theme-muted text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Sample:
                </span>
                <button
                  type="button"
                  onClick={() => handleInsertSample('socks')}
                  className="px-2.5 py-1 rounded-lg bg-theme-subtle hover:bg-theme-card-hover text-[11px] text-theme-secondary hover:text-theme-primary border border-theme-card cursor-pointer"
                >
                  SOCKS5 Proxy
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSample('http')}
                  className="px-2.5 py-1 rounded-lg bg-theme-subtle hover:bg-theme-card-hover text-[11px] text-theme-secondary hover:text-theme-primary border border-theme-card cursor-pointer"
                >
                  HTTP Proxy
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSample('reality')}
                  className="px-2.5 py-1 rounded-lg bg-theme-subtle hover:bg-theme-card-hover text-[11px] text-theme-secondary hover:text-theme-primary border border-theme-card cursor-pointer"
                >
                  VLESS Reality
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSample('hy2')}
                  className="px-2.5 py-1 rounded-lg bg-theme-subtle hover:bg-theme-card-hover text-[11px] text-theme-secondary hover:text-theme-primary border border-theme-card cursor-pointer"
                >
                  Hysteria 2
                </button>
              </div>

              {successCount !== null && (
                <div className="p-3 rounded-xl bg-[#192615] border border-incy-green/60 flex items-center gap-2 text-incy-green text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Added {successCount} server(s) successfully!</span>
                </div>
              )}
            </div>
          ) : (
            <form id="manualServerForm" onSubmit={handleManualAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">
                  {t.serverName}
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="e.g. 🇩🇪 Frankfurt Fast-01"
                  className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-semibold text-theme-secondary mb-1">
                    {t.protocol}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProtocolDropdownOpen(!isProtocolDropdownOpen);
                      setIsSecurityDropdownOpen(false);
                    }}
                    className="w-full bg-theme-subtle/80 hover:bg-theme-subtle border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-semibold flex items-center justify-between transition-all cursor-pointer shadow-sm text-left rtl:text-right"
                  >
                    <span>
                      {PROTOCOL_OPTIONS.find(p => p.id === manualProtocol)?.label || 'VLESS'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-theme-secondary transition-transform ${isProtocolDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProtocolDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProtocolDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-theme-card border-2 border-theme-card shadow-2xl rounded-2xl divide-y divide-theme-divider overflow-hidden z-50 animate-fadeIn max-h-56 overflow-y-auto">
                        {PROTOCOL_OPTIONS.map(opt => {
                          const isSelected = manualProtocol === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setManualProtocol(opt.id);
                                setIsProtocolDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer text-left rtl:text-right ${
                                isSelected
                                  ? 'bg-blue-600/15 text-blue-500 font-bold border-l-4 rtl:border-l-0 rtl:border-r-4 border-blue-500'
                                  : 'text-theme-primary hover:bg-theme-card-hover font-medium'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-secondary mb-1">
                    {t.port}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={manualPort}
                    onChange={e => {
                      const cleanVal = normalizeArabicNumbers(e.target.value).replace(/[^0-9]/g, '');
                      setManualPort(cleanVal);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder={language === 'ar' ? 'أدخل المنفذ' : 'Enter port'}
                    className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                  />
                  {/* Quick Preset Port Pills */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-theme-muted">{language === 'ar' ? 'شائع:' : 'Presets:'}</span>
                    {['443', '8080', '1080', '8443', '2083'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setManualPort(p);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                          manualPort === p
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-theme-subtle text-theme-secondary hover:text-theme-primary border border-theme-card'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">
                  {t.serverAddress}
                </label>
                <input
                  type="text"
                  required
                  value={manualHost}
                  onChange={e => {
                    const rawVal = e.target.value;
                    const normalized = normalizeArabicNumbers(rawVal);
                    // If user pasted host:port (e.g. 188.220.136.2:48120 or host.com:8080)
                    if (normalized.includes(':') && !normalized.startsWith('[')) {
                      const parts = normalized.split(':');
                      if (parts.length === 2 && /^\d+$/.test(parts[1].trim())) {
                        setManualHost(parts[0].trim());
                        setManualPort(parts[1].trim());
                        if (errorMsg) setErrorMsg('');
                        return;
                      }
                    }
                    setManualHost(normalized);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="ojosario.toodcomp.win or 188.220.136.2"
                  className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                />

                {/* Location Detection & Customization Box */}
                {isDetectingLocation ? (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-theme-subtle border border-theme-card text-xs text-theme-secondary animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>{language === 'ar' ? 'جاري التعرف على الدولة والمدينة تلقائياً...' : 'Detecting country & city...'}</span>
                  </div>
                ) : (
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-theme-subtle/70 border border-theme-card space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-theme-secondary">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === 'ar' ? 'الموقع الجغرافي (تلقائي أو اختياري):' : 'Location (Auto or Custom):'}</span>
                      </span>
                      {detectedLoc && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <span>{detectedLoc.flag}</span>
                          <span>{language === 'ar' ? 'تم التعرف' : 'Detected'}</span>
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          value={manualCountry}
                          onChange={e => setManualCountry(e.target.value)}
                          placeholder={language === 'ar' ? 'الدولة (مثال: الجزائر)' : 'Country (e.g. Algeria)'}
                          className="w-full bg-theme-card border border-theme-card focus:border-theme-accent rounded-xl px-2.5 py-1.5 text-xs text-theme-primary outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={manualCity}
                          onChange={e => setManualCity(e.target.value)}
                          placeholder={language === 'ar' ? 'المدينة (مثال: الجزائر)' : 'City (e.g. Algiers)'}
                          className="w-full bg-theme-card border border-theme-card focus:border-theme-accent rounded-xl px-2.5 py-1.5 text-xs text-theme-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {manualProtocol === 'http' || manualProtocol === 'socks5' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-theme-secondary mb-1">
                      Username (User)
                    </label>
                    <input
                      type="text"
                      value={manualUsername}
                      onChange={e => setManualUsername(e.target.value)}
                      placeholder="e.g. aFxyu8E6QO6Kh28"
                      className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-theme-secondary mb-1">
                      Password (Pass)
                    </label>
                    <input
                      type="password"
                      value={manualPassword}
                      onChange={e => setManualPassword(e.target.value)}
                      placeholder="e.g. 7BPqHstEdqHsNlp"
                      className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-theme-secondary mb-1">
                    {t.uuidOrPassword}
                  </label>
                  <input
                    type="text"
                    value={manualUuid}
                    onChange={e => setManualUuid(e.target.value)}
                    placeholder="UUID or password key"
                    className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                  />
                </div>
              )}

              {manualProtocol === 'vless' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-theme-secondary mb-1">
                        {t.security}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSecurityDropdownOpen(!isSecurityDropdownOpen);
                          setIsProtocolDropdownOpen(false);
                        }}
                        className="w-full bg-theme-subtle/80 hover:bg-theme-subtle border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-semibold flex items-center justify-between transition-all cursor-pointer shadow-sm text-left rtl:text-right"
                      >
                        <span>
                          {SECURITY_OPTIONS.find(s => s.id === manualSecurity)?.label || 'Reality'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-theme-secondary transition-transform ${isSecurityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSecurityDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsSecurityDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-theme-card border-2 border-theme-card shadow-2xl rounded-2xl divide-y divide-theme-divider overflow-hidden z-50 animate-fadeIn">
                            {SECURITY_OPTIONS.map(opt => {
                              const isSelected = manualSecurity === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setManualSecurity(opt.id);
                                    setIsSecurityDropdownOpen(false);
                                  }}
                                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer text-left rtl:text-right ${
                                    isSelected
                                      ? 'bg-blue-600/15 text-blue-500 font-bold border-l-4 rtl:border-l-0 rtl:border-r-4 border-blue-500'
                                      : 'text-theme-primary hover:bg-theme-card-hover font-medium'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-theme-secondary mb-1">
                        {t.sni}
                      </label>
                      <input
                        type="text"
                        value={manualSni}
                        onChange={e => setManualSni(e.target.value)}
                        placeholder="gateway.icloud.com"
                        className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                      />
                    </div>
                  </div>

                  {manualSecurity === 'reality' && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-theme-secondary mb-1">
                          {t.realityPublicKey}
                        </label>
                        <input
                          type="text"
                          value={manualPbk}
                          onChange={e => setManualPbk(e.target.value)}
                          placeholder="e.g. kP_9ywR3m2..."
                          className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-theme-secondary mb-1">
                          {t.realityShortId}
                        </label>
                        <input
                          type="text"
                          value={manualSid}
                          onChange={e => setManualSid(e.target.value)}
                          placeholder="e.g. 7a8f9c1b"
                          className="w-full bg-theme-subtle/80 border border-theme-card focus:border-theme-accent rounded-xl px-3 py-2 text-xs text-theme-primary font-mono outline-none"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </form>
          )}
        </div>

        {/* Modal Fixed Footer - Always Visible */}
        <div className="px-6 py-4 border-t border-theme-divider bg-theme-subtle/50 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-theme-secondary hover:text-theme-primary bg-theme-card hover:bg-theme-card-hover border border-theme-card transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={activeTab === 'paste' ? handleParseAndAdd : () => handleManualAdd()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 !text-white text-xs sm:text-sm font-black transition-all shadow-xl shadow-emerald-500/40 active:scale-95 cursor-pointer flex items-center gap-2 border border-emerald-300/50"
          >
            <span className="text-base font-black text-white leading-none">+</span>
            <span className="text-white font-black">{language === 'ar' ? 'حفظ وتفعيل الخادم' : 'Save & Activate Server'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
