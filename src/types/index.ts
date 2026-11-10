export type ProtocolType = 'vless' | 'vmess' | 'trojan' | 'ss' | 'hysteria2' | 'wireguard' | 'socks5' | 'http';

export type SecurityType = 'none' | 'tls' | 'reality';
export type NetworkType = 'tcp' | 'ws' | 'grpc' | 'h2';

export interface Server {
  id: string;
  name: string;
  protocol: ProtocolType;
  host: string;
  port: number;
  username?: string;
  uuid?: string;
  password?: string;
  security?: SecurityType;
  network?: NetworkType;
  sni?: string;
  alpn?: string;
  path?: string;
  pbk?: string; // Reality Public Key
  sid?: string; // Reality Short ID
  spx?: string; // Reality SpiderX
  country?: string;
  city?: string;
  countryAr?: string;
  cityAr?: string;
  flag?: string;
  ping: number | null; // ms or null if untested/error
  subscriptionId?: string;
  rawUri?: string;
  createdAt: number;
}

export type ConnectionMode = 'tun' | 'system_proxy';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';
export type RoutingMode = 'rule' | 'global' | 'direct';
export type AccentColor = 'blue' | 'lime' | 'purple';

export interface AppSettings {
  // Navigation & General
  mode: ConnectionMode;
  language: 'en' | 'ar';
  activeServerId: string | null;

  // Appearance
  appearanceTheme: 'green' | 'light' | 'dark' | 'system' | 'oled';
  accentColor: AccentColor;
  connectionStyle?: 'classic' | 'compact';
  pinConnectionButton?: boolean;
  appIcon?: 'default' | 'purple' | 'green' | 'dark' | 'solar';
  languagePreference?: 'system' | 'en' | 'ar';
  hardwareAcceleration?: boolean;
  disableFontSmoothing?: boolean;
  reduceMotion?: boolean;
  interfaceScale?: number;

  // Connection
  autoConnect: boolean;
  killSwitch: boolean;
  lanAccess: boolean;
  captureSystemDns?: boolean;
  allowLanConnections?: boolean;
  allowHotspotAccess?: boolean;
  routeLanViaProxy?: boolean;
  showProxyOnlyButton?: boolean;
  additionalProxyBypass?: string;
  localProxyPort?: number;
  socks5Auth?: boolean;
  socks5Username?: string;
  socks5Password?: string;
  blockUdp?: boolean;
  httpProxyAuth?: boolean;

  // Tunnel
  routing: RoutingMode;
  socksPort: number;
  httpPort: number;
  tlsFragmentation: boolean;
  multiplexing: boolean;
  routingProfiles?: boolean;
  fragmentation?: boolean;
  mux?: boolean;
  sniffing?: boolean;
  preferredIp?: 'ipv4' | 'ipv6' | 'auto';
  vpnDns?: 'internal' | 'cloudflare_google' | 'google' | 'cloudflare' | 'quad9' | 'custom';
  customVpnDns?: string;
  tunnelMtu?: 'auto' | '1420' | '1380' | '1280' | 'custom';
  customTunnelMtu?: number;

  // Per-App Proxy
  perAppProxyEnabled?: boolean;
  perAppProxyMode?: 'bypass' | 'proxy_only';
  perAppSelectedApps?: string[];
  perAppAppsMeta?: Record<string, { name: string; icon?: string }>;

  // DNS
  remoteDns: string;
  domesticDns: string;
  fakeDns: boolean;

  // Subscriptions
  autoUpdate: boolean;
  autoUpdateInterval: '30m' | '1h' | '2h' | '6h' | '12h' | '24h';
  notifyOnUpdate: boolean;
  updateOnLaunch: boolean;
  pingOnLaunch: boolean;
  sendHwid: boolean;
  serverSortOrder: 'default' | 'latency' | 'name' | 'country';
  expiryNotification: boolean;
  expiryDays: number; // 1 | 3 | 5 | 7

  // Performance
  disconnectOnSleep: boolean;
  memoryMonitor: boolean;

  // Ping Settings
  pingProtocol?: 'nova' | 'tcp' | 'http_get' | 'http_head';
  pingDisplay?: 'numbers' | 'scale' | 'both' | 'dots';
  pingTargetUrl?: string;
  pingTimeout?: number;

  // Advanced Connections
  idleTimeout?: number;
  tcpMaxConnections?: number;
  udpMaxConnections?: number;
  excludedRoutes?: string[];

  // Desktop
  minimizeToTray: boolean;
  startMinimized: boolean;
  autoStart: boolean;
}

export interface TrafficStats {
  uploadSpeed: number; // bytes/sec
  downloadSpeed: number; // bytes/sec
  totalUploaded: number; // bytes
  totalDownloaded: number; // bytes
  connectedDuration: number; // seconds
  latency: number; // ms
}

export interface Subscription {
  id: string;
  name: string;
  url: string;
  updatedAt: number;
  serversCount: number;
}
