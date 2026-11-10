import { Server, AppSettings, Subscription } from '../types';
import { detectCountryAndFlag } from './protocolParser';

const STORAGE_KEY_SERVERS = 'novaproxy_servers_v2';
const STORAGE_KEY_SETTINGS = 'incy_settings_v2';
const STORAGE_KEY_SUBSCRIPTIONS = 'incy_subscriptions_v1';
const STORAGE_KEY_PURGE_SERVERS_V419 = 'novaproxy_purged_saved_servers_v419';

export const DEFAULT_SERVERS: Server[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'tun',
  language: 'en',
  activeServerId: null,

  // Appearance
  appearanceTheme: 'dark',
  accentColor: 'blue',
  connectionStyle: 'classic',
  pinConnectionButton: false,
  appIcon: 'default',
  languagePreference: 'system',
  hardwareAcceleration: true,
  disableFontSmoothing: false,
  reduceMotion: false,
  interfaceScale: 100,

  // Connection
  autoConnect: false,
  killSwitch: false,
  lanAccess: true,
  captureSystemDns: true,
  allowLanConnections: true,
  allowHotspotAccess: false,
  routeLanViaProxy: false,
  showProxyOnlyButton: false,
  additionalProxyBypass: '*.local, 192.168.*, 10.*, 172.16.*',
  localProxyPort: 10808,
  socks5Auth: true,
  socks5Username: 'nova_client',
  socks5Password: 'np_sec782',
  blockUdp: false,
  httpProxyAuth: false,

  // Tunnel
  routing: 'rule',
  socksPort: 10808,
  httpPort: 10809,
  tlsFragmentation: true,
  multiplexing: false,
  routingProfiles: false,
  fragmentation: false,
  mux: false,
  sniffing: true,
  preferredIp: 'auto',
  vpnDns: 'internal',
  customVpnDns: '1.1.1.1, 8.8.8.8',
  tunnelMtu: 'auto',
  customTunnelMtu: 1420,

  // Per-App Proxy
  perAppProxyEnabled: false,
  perAppProxyMode: 'bypass',
  perAppSelectedApps: [],

  // DNS
  remoteDns: 'https://1.1.1.1/dns-query',
  domesticDns: '8.8.8.8',
  fakeDns: false,

  // Subscriptions
  autoUpdate: true,
  autoUpdateInterval: '2h',
  notifyOnUpdate: false,
  updateOnLaunch: true,
  pingOnLaunch: false,
  sendHwid: true,
  serverSortOrder: 'default',
  expiryNotification: true,
  expiryDays: 3,

  // Performance
  disconnectOnSleep: false,
  memoryMonitor: false,

  // Ping Settings
  pingProtocol: 'nova',
  pingDisplay: 'numbers',
  pingTargetUrl: 'https://www.gstatic.com/generate_204',
  pingTimeout: 3,

  // Advanced Connections
  idleTimeout: 300,
  tcpMaxConnections: 256,
  udpMaxConnections: 128,
  excludedRoutes: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8'],

  // Desktop
  minimizeToTray: true,
  startMinimized: false,
  autoStart: false,
};

export const StorageService = {
  getServers(): Server[] {
    try {
      // One-time complete purge of previously saved default/sample proxies as requested
      if (!localStorage.getItem(STORAGE_KEY_PURGE_SERVERS_V419)) {
        localStorage.setItem(STORAGE_KEY_PURGE_SERVERS_V419, 'true');
        localStorage.removeItem(STORAGE_KEY_SERVERS);
        localStorage.removeItem('incy_servers_v1');
        this.saveServers([]);
        try {
          const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
          if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            parsed.activeServerId = null;
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
          }
        } catch (_) {}
        return [];
      }

      const data = localStorage.getItem(STORAGE_KEY_SERVERS);
      if (!data) {
        this.saveServers([]);
        return [];
      }
      let list: Server[] = JSON.parse(data);
      
      // Purge all default sample servers & legacy test nodes
      const sampleIds = new Set([
        'srv_us_01', 'srv_de_01', 'srv_nl_01', 'srv_sg_01', 'srv_gb_01', 'srv_jp_01',
        'srv_eg_socks_02', 'srv_eg_http_01'
      ]);
      list = list.filter(s =>
        !sampleIds.has(s.id) &&
        !s.host.includes('incy-node.net') &&
        !s.host.includes('ojosario.toodcomp.win') &&
        s.host !== '188.220.136.2'
      );

      // Auto-migrate any server missing city/country localization, stuck on Global Node, or with debug/protocol titles
      let migrated = false;
      list = list.map(s => {
        const isLegacyTitle = s.name && (s.name.includes('Dedicated') || s.name.includes('HTTP') || s.name.includes('Debug') || s.name.includes('🇪🇬 🇪🇬'));
        const isGeneric = !s.city || !s.countryAr || !s.cityAr || s.country === 'Global Node' || s.countryAr === 'خادم عالمي' || isLegacyTitle;
        if (isGeneric) {
          const loc = detectCountryAndFlag(s.name || '', s.host || '');
          if (loc.country !== 'Global Node') {
            migrated = true;
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
        }
        return s;
      });

      this.saveServers(list);
      return list;
    } catch {
      return [];
    }
  },

  saveServers(servers: Server[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SERVERS, JSON.stringify(servers));
    } catch (e) {
      console.error('Failed to save servers:', e);
    }
  },

  addServer(server: Server): void {
    const servers = this.getServers();
    servers.unshift(server);
    this.saveServers(servers);
  },

  addServers(newServers: Server[]): void {
    const servers = this.getServers();
    this.saveServers([...newServers, ...servers]);
  },

  deleteServer(id: string): void {
    const servers = this.getServers().filter(s => s.id !== id);
    this.saveServers(servers);
  },

  updateServer(updated: Server): void {
    const servers = this.getServers().map(s => s.id === updated.id ? updated : s);
    this.saveServers(servers);
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  resetSettings(): AppSettings {
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  getSubscriptions(): Subscription[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSubscriptions(subs: Subscription[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
    } catch (e) {
      console.error('Failed to save subscriptions:', e);
    }
  }
};
