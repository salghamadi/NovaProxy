import React, { useState } from 'react';
import { X, Check, Copy, Download, Upload, Terminal, Shield, Cpu, RefreshCw, Radio, HardDrive, Info, Link, Sliders, ExternalLink } from 'lucide-react';
import { AppSettings, RoutingMode, AccentColor } from '../../types';
import { translations } from '../../services/i18n';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  language: 'en' | 'ar';
}

// 1. Appearance Modal
export const AppearanceModal: React.FC<ModalProps> = ({ isOpen, onClose, settings, onUpdate, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">{t.itemAppearance}</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="block text-[#828e9e] font-medium mb-2">Theme Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'oled', 'light'] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => onUpdate({ appearanceTheme: theme })}
                  className={`p-3 rounded-xl border capitalize font-semibold transition-all ${
                    settings.appearanceTheme === theme
                      ? 'bg-[#1b253b] border-blue-500 text-blue-400'
                      : 'bg-[#15191d] border-[#222830] text-[#717b88] hover:text-white'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#828e9e] font-medium mb-2">Accent Color</label>
            <div className="grid grid-cols-3 gap-2">
              {(['blue', 'lime', 'purple'] as AccentColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => onUpdate({ accentColor: color })}
                  className={`p-3 rounded-xl border capitalize font-semibold flex items-center justify-center gap-2 transition-all ${
                    settings.accentColor === color
                      ? 'bg-[#1b253b] border-blue-500 text-white'
                      : 'bg-[#15191d] border-[#222830] text-[#717b88] hover:text-white'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      color === 'blue' ? 'bg-blue-500' : color === 'lime' ? 'bg-lime-400' : 'bg-purple-500'
                    }`}
                  />
                  <span>{color}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-theme-divider flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Connection Modal
export const ConnectionModal: React.FC<ModalProps> = ({ isOpen, onClose, settings, onUpdate, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">{t.itemConnection}</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Auto Connect */}
          <div className="flex items-center justify-between py-2 border-b border-[#1a1f26]">
            <div>
              <p className="text-white font-medium">Auto Connect</p>
              <p className="text-[#6e7886] text-[11px]">Connect automatically when app starts</p>
            </div>
            <button
              onClick={() => onUpdate({ autoConnect: !settings.autoConnect })}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                settings.autoConnect ? 'bg-blue-600' : 'bg-[#222830]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoConnect ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Kill Switch */}
          <div className="flex items-center justify-between py-2 border-b border-[#1a1f26]">
            <div>
              <p className="text-white font-medium">Kill Switch</p>
              <p className="text-[#6e7886] text-[11px]">Block network leak if connection drops</p>
            </div>
            <button
              onClick={() => onUpdate({ killSwitch: !settings.killSwitch })}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                settings.killSwitch ? 'bg-blue-600' : 'bg-[#222830]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.killSwitch ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* LAN Access */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white font-medium">Allow LAN Access</p>
              <p className="text-[#6e7886] text-[11px]">Allow devices in local network to connect</p>
            </div>
            <button
              onClick={() => onUpdate({ lanAccess: !settings.lanAccess })}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                settings.lanAccess ? 'bg-blue-600' : 'bg-[#222830]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.lanAccess ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Tunnel Modal
export const TunnelModal: React.FC<ModalProps> = ({ isOpen, onClose, settings, onUpdate, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">{t.itemTunnel}</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Routing Mode */}
          <div>
            <label className="block text-[#828e9e] font-medium mb-2">Routing Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['rule', 'global', 'direct'] as RoutingMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => onUpdate({ routing: mode })}
                  className={`p-2.5 rounded-xl border text-center font-bold capitalize transition-all ${
                    settings.routing === mode
                      ? 'bg-[#1b253b] border-blue-500 text-blue-400'
                      : 'bg-[#15191d] border-[#222830] text-[#717b88] hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* TLS Fragmentation */}
          <div className="flex items-center justify-between py-2 border-t border-[#1a1f26]">
            <div>
              <p className="text-white font-medium">TLS Fragmentation</p>
              <p className="text-[#6e7886] text-[11px]">Bypass SNI-based Deep Packet Inspection</p>
            </div>
            <button
              onClick={() => onUpdate({ tlsFragmentation: !settings.tlsFragmentation })}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                settings.tlsFragmentation ? 'bg-blue-600' : 'bg-[#222830]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.tlsFragmentation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Multiplexing (Mux) */}
          <div className="flex items-center justify-between py-2 border-t border-[#1a1f26]">
            <div>
              <p className="text-white font-medium">TCP Multiplexing (Mux)</p>
              <p className="text-[#6e7886] text-[11px]">Reduces connection handshake latency</p>
            </div>
            <button
              onClick={() => onUpdate({ multiplexing: !settings.multiplexing })}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                settings.multiplexing ? 'bg-blue-600' : 'bg-[#222830]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.multiplexing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Ping Settings Modal
export const PingSettingsModal: React.FC<ModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">{t.itemPingSettings}</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[#828e9e] font-medium mb-1">Ping Target URL</label>
            <input
              type="text"
              defaultValue="https://www.google.com/generate_204"
              className="w-full bg-[#161a1e] border border-[#232932] rounded-xl px-3 py-2 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[#828e9e] font-medium mb-1">Timeout (ms)</label>
            <input
              type="number"
              defaultValue={3000}
              className="w-full bg-[#161a1e] border border-[#232932] rounded-xl px-3 py-2 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[#828e9e] font-medium mb-1">Test Protocol</label>
            <select className="w-full bg-[#161a1e] border border-[#232932] rounded-xl px-3 py-2 text-white outline-none">
              <option>HTTP HEAD (Accurate)</option>
              <option>TCP Handshake</option>
              <option>ICMP Ping</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Statistics Modal
export const StatisticsModal: React.FC<ModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">{t.itemStatistics}</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#161a1f] rounded-2xl border border-[#212731]">
            <span className="text-[#6e7887]">Total Downloaded</span>
            <p className="text-lg font-bold text-white font-mono mt-1">14.82 GB</p>
          </div>
          <div className="p-3 bg-[#161a1f] rounded-2xl border border-[#212731]">
            <span className="text-[#6e7887]">Total Uploaded</span>
            <p className="text-lg font-bold text-white font-mono mt-1">2.14 GB</p>
          </div>
          <div className="p-3 bg-[#161a1f] rounded-2xl border border-[#212731]">
            <span className="text-[#6e7887]">Total Sessions</span>
            <p className="text-lg font-bold text-white font-mono mt-1">48</p>
          </div>
          <div className="p-3 bg-[#161a1f] rounded-2xl border border-[#212731]">
            <span className="text-[#6e7887]">Active Tunnel Time</span>
            <p className="text-lg font-bold text-white font-mono mt-1">36h 24m</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. Tunnel Logs Modal
export const TunnelLogsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mockLogs = [
    `[INFO] 2026/11/07 12:40:01 Xray-core v1.8.8 started (built with go1.22)`,
    `[INFO] 2026/11/07 12:40:01 Inbound TUN adapter created successfully (MTU: 9000)`,
    `[INFO] 2026/11/07 12:40:02 Outbound [VLESS Reality] connecting to us-lax-01.incy-node.net:443`,
    `[INFO] 2026/11/07 12:40:02 Reality TLS handshake succeeded, SNI=gateway.icloud.com`,
    `[INFO] 2026/11/07 12:40:02 Routing table initialized (Rule mode: bypass LAN, direct CN)`,
    `[DEBUG] 2026/11/07 12:40:05 tcp:1.1.1.1:443 -> proxy tunnel accepted [latency: 38ms]`,
    `[DEBUG] 2026/11/07 12:40:08 udp:8.8.8.8:53 -> FakeDNS allocated [198.18.0.12]`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0f1214] border border-theme-card rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Tunnel Logs</h3>
          </div>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 p-4 bg-black/60 rounded-2xl border border-[#1b2027] font-mono text-xs text-zinc-300 overflow-y-auto space-y-1.5 flex-1">
          {mockLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              <span className="text-blue-400 select-none">$ </span>
              <span className={log.includes('INFO') ? 'text-emerald-400' : 'text-zinc-400'}>{log}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 7. Backup Modal
export const BackupModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const data = {
      servers: localStorage.getItem('incy_servers_v1'),
      settings: localStorage.getItem('incy_settings_v2'),
      date: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incy-backup-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">Backup & Restore</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <button
            onClick={handleExport}
            className="w-full p-4 rounded-2xl bg-[#161a1f] hover:bg-[#1b2128] border border-[#232932] flex items-center justify-between text-left transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-white">Export Backup</p>
              <p className="text-[#6f7a87] text-[11px] mt-0.5">Save all servers, subscriptions and settings to JSON</p>
            </div>
            <Download className="w-5 h-5 text-blue-400" />
          </button>

          <label className="w-full p-4 rounded-2xl bg-[#161a1f] hover:bg-[#1b2128] border border-[#232932] flex items-center justify-between text-left transition-all cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">Restore Backup</p>
              <p className="text-[#6f7a87] text-[11px] mt-0.5">Import and restore previously saved backup file</p>
            </div>
            <Upload className="w-5 h-5 text-purple-400" />
            <input type="file" accept=".json" className="hidden" />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 8. About Modal
export const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4 text-center">
        <img
          src="/logo.png"
          alt="NovaProxy"
          className="w-20 h-20 rounded-2xl object-contain mx-auto shadow-xl shadow-purple-600/40 border border-purple-500/30 bg-black/40 p-1"
        />

        <div>
          <h2 className="text-xl font-black text-white">Nova<span className="text-[#818cf8]">Proxy</span></h2>
          <span className="text-[11px] font-mono font-bold text-zinc-400">v4.1.7</span>
        </div>

        <p className="text-xs text-[#8c97a5] leading-relaxed">
          High-performance, modern proxy and VPN client powered by Xray-Core.
          Designed for privacy, speed, and deep packet inspection circumvention.
        </p>

        <div className="p-3 bg-[#161a1f] rounded-2xl border border-[#212731] text-xs text-[#717b88] space-y-1">
          <p>Core: Xray-core v1.8.8</p>
          <p>Protocols: VLESS, Reality, Hysteria 2, Trojan, VMess, SS</p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 9. DNS Modal
export const DnsModal: React.FC<ModalProps> = ({ isOpen, onClose, settings, onUpdate, language }) => {
  if (!isOpen) return null;
  const t = translations[language];
  const [remoteVal, setRemoteVal] = useState(settings.remoteDns);
  const [domesticVal, setDomesticVal] = useState(settings.domesticDns);

  const remotePresets = [
    { name: 'Cloudflare DoH', url: 'https://1.1.1.1/dns-query' },
    { name: 'Google DoH', url: 'https://dns.google/dns-query' },
    { name: 'Quad9 DoH', url: 'https://dns.quad9.net/dns-query' },
    { name: 'AdGuard DoH', url: 'https://dns.adguard.com/dns-query' },
  ];

  const domesticPresets = [
    { name: 'Google DNS', ip: '8.8.8.8' },
    { name: 'Cloudflare DNS', ip: '1.1.1.1' },
    { name: 'Quad9 DNS', ip: '9.9.9.9' },
    { name: 'OpenDNS', ip: '208.67.222.222' },
  ];

  const handleSave = () => {
    onUpdate({
      remoteDns: remoteVal.trim() || 'https://1.1.1.1/dns-query',
      domesticDns: domesticVal.trim() || '8.8.8.8',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <h3 className="text-base font-bold text-white">{t.secDns}</h3>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#828e9e] font-medium mb-1.5">{t.remoteDns}</label>
            <input
              type="text"
              value={remoteVal}
              onChange={(e) => setRemoteVal(e.target.value)}
              className="w-full bg-[#161a1e] border border-[#232932] rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-blue-500"
              placeholder="https://1.1.1.1/dns-query"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {remotePresets.map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setRemoteVal(p.url)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    remoteVal === p.url
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      : 'bg-[#1b2027] text-[#717d8e] hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#828e9e] font-medium mb-1.5">{t.domesticDns}</label>
            <input
              type="text"
              value={domesticVal}
              onChange={(e) => setDomesticVal(e.target.value)}
              className="w-full bg-[#161a1e] border border-[#232932] rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-blue-500"
              placeholder="8.8.8.8"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {domesticPresets.map((p) => (
                <button
                  key={p.ip}
                  type="button"
                  onClick={() => setDomesticVal(p.ip)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    domesticVal === p.ip
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      : 'bg-[#1b2027] text-[#717d8e] hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-theme-divider">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1b2027] hover:bg-[#252c36] text-[#8e98a5] text-xs font-semibold cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// 10. URL Schemes Modal
export const UrlSchemesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const schemes = [
    { title: 'Connect to Active Server', cmd: 'novaproxy://connect', desc: 'Triggers tunnel activation' },
    { title: 'Disconnect Tunnel', cmd: 'novaproxy://disconnect', desc: 'Stops active proxy connection' },
    { title: 'Toggle Connection', cmd: 'novaproxy://toggle', desc: 'Switches connection state' },
    { title: 'Import Proxy Configuration', cmd: 'novaproxy://import?url={url}', desc: 'Direct URI import' },
  ];

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-theme-card border border-theme-card rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-divider">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">URL Schemes</h3>
          </div>
          <button onClick={onClose} className="text-[#677281] hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {schemes.map((s, idx) => (
            <div key={s.cmd} className="p-3 bg-[#161a1f] rounded-2xl border border-[#212731] flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="font-mono text-purple-300 text-[11px] mt-0.5">{s.cmd}</p>
                <p className="text-[#6f7a87] text-[10.5px] mt-0.5">{s.desc}</p>
              </div>
              <button
                onClick={() => handleCopy(s.cmd, idx)}
                className="p-2 rounded-xl bg-[#202632] hover:bg-[#2b3342] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Copy command"
              >
                {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
