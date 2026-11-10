import { ConnectionState, TrafficStats, Server, ConnectionMode, AppSettings } from '../types';
import { registerPlugin, Capacitor } from '@capacitor/core';

interface VpnPluginInterface {
  prepare(): Promise<{ granted: boolean }>;
  connect(options: {
    host: string;
    port: number;
    name: string;
    protocol: string;
    username?: string;
    password?: string;
    perAppEnabled?: boolean;
    perAppMode?: string;
    selectedApps?: string[];
  }): Promise<{ success: boolean; connected: boolean }>;
  disconnect(): Promise<{ success: boolean; connected: boolean }>;
  getStatus(): Promise<{ isRunning: boolean; activeServerName?: string; localPort?: number }>;
  getInstalledApps(): Promise<{ apps: Array<{ packageName: string; name: string; icon?: string }> }>;
  startTvSyncServer(): Promise<{ success: boolean; running: boolean; ip: string; port: number; url: string }>;
  stopTvSyncServer(): Promise<{ success: boolean; running: boolean }>;
  getTvSyncStatus(): Promise<{ running: boolean; ip: string; port: number; url: string }>;
  sendTvSyncData(options: { address: string; content: string }): Promise<{ success: boolean; message: string }>;
  addListener(eventName: 'tvSyncReceived', listenerFunc: (data: { content: string }) => void): Promise<{ remove: () => void }>;
}

const VpnPlugin = registerPlugin<VpnPluginInterface>('VpnPlugin');

export type TrafficListener = (stats: TrafficStats) => void;
export type StateListener = (state: ConnectionState) => void;

class ProxyController {
  private state: ConnectionState = 'disconnected';
  private stats: TrafficStats = {
    uploadSpeed: 0,
    downloadSpeed: 0,
    totalUploaded: 0,
    totalDownloaded: 0,
    connectedDuration: 0,
    latency: 0,
  };
  private intervalId: any = null;
  private durationIntervalId: any = null;
  private trafficListeners: Set<TrafficListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private activeServer: Server | null = null;
  private mode: ConnectionMode = 'tun';

  public getState(): ConnectionState {
    return this.state;
  }

  public getStats(): TrafficStats {
    return this.stats;
  }

  public onTraffic(cb: TrafficListener): () => void {
    this.trafficListeners.add(cb);
    return () => this.trafficListeners.delete(cb);
  }

  public onStateChange(cb: StateListener): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.stateListeners.forEach(fn => fn(this.state));

    // Send to Electron if available
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.notifyConnectionState(newState, this.activeServer?.name);
    }
  }

  public async getInstalledApps(): Promise<Array<{ packageName: string; name: string; icon?: string }>> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await VpnPlugin.getInstalledApps();
        if (res && res.apps) {
          return res.apps;
        }
      } catch (err) {
        console.warn('Failed to get installed apps from native VpnPlugin:', err);
      }
    }
    return [];
  }

  public async startTvSyncServer(): Promise<{ success: boolean; running: boolean; ip: string; port: number; url: string }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await VpnPlugin.startTvSyncServer();
      } catch (err) {
        console.warn('Failed to start native TV sync server:', err);
      }
    }
    return { success: false, running: false, ip: '127.0.0.1', port: 8888, url: 'http://127.0.0.1:8888' };
  }

  public async stopTvSyncServer(): Promise<{ success: boolean; running: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await VpnPlugin.stopTvSyncServer();
      } catch (err) {
        console.warn('Failed to stop native TV sync server:', err);
      }
    }
    return { success: true, running: false };
  }

  public async getTvSyncStatus(): Promise<{ running: boolean; ip: string; port: number; url: string }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await VpnPlugin.getTvSyncStatus();
      } catch (err) {
        console.warn('Failed to get native TV sync status:', err);
      }
    }
    return { running: false, ip: '127.0.0.1', port: 8888, url: 'http://127.0.0.1:8888' };
  }

  public onTvSyncData(cb: (content: string) => void): () => void {
    if (Capacitor.isNativePlatform()) {
      let handle: any = null;
      try {
        VpnPlugin.addListener('tvSyncReceived', (data) => {
          if (data && data.content) cb(data.content);
        }).then((h) => {
          handle = h;
        });
      } catch (err) {
        console.warn('Failed to add TV sync listener:', err);
      }
      return () => {
        if (handle && handle.remove) handle.remove();
      };
    }
    return () => {};
  }

  public async sendServersToTv(tvIpOrUrl: string, content: string): Promise<{ success: boolean; message: string }> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const res = await VpnPlugin.sendTvSyncData({ address: tvIpOrUrl, content });
          return { success: res.success ?? true, message: res.message || 'Sent successfully to TV' };
        } catch (nativeErr: any) {
          return { success: false, message: nativeErr.message || 'فشل الاتصال بالتلفزيون' };
        }
      }

      let cleanUrl = tvIpOrUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        if (!cleanUrl.includes(':')) {
          cleanUrl = `http://${cleanUrl}:8888`;
        } else {
          cleanUrl = `http://${cleanUrl}`;
        }
      }
      const syncEndpoint = cleanUrl.endsWith('/') ? `${cleanUrl}api/sync` : `${cleanUrl}/api/sync`;

      const res = await fetch(syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        return { success: true, message: 'Sent successfully to TV' };
      }
      return { success: false, message: `TV error response: ${res.status}` };
    } catch (err: any) {
      console.warn('Failed to send servers to TV:', err);
      return { success: false, message: err.message || 'Connection failed' };
    }
  }

  public async connect(server: Server, mode: ConnectionMode, settings?: AppSettings): Promise<boolean> {
    if (this.state === 'connected' || this.state === 'connecting') return false;

    this.activeServer = server;
    this.mode = mode;
    this.setState('connecting');

    // If running on native platform (Android), start native Android VpnService
    if (Capacitor.isNativePlatform()) {
      try {
        const vpnRes = await VpnPlugin.connect({
          host: server.host,
          port: server.port,
          name: server.name,
          protocol: server.protocol,
          username: server.username || server.uuid || '',
          password: server.password || '',
          perAppEnabled: settings?.perAppProxyEnabled ?? false,
          perAppMode: settings?.perAppProxyMode || 'proxy_only',
          selectedApps: settings?.perAppSelectedApps || [],
        });

        // If user cancelled or permission was not granted
        if (
          !vpnRes ||
          vpnRes.connected === false ||
          (vpnRes as any).granted === false ||
          (vpnRes as any).success === false
        ) {
          console.warn('Android Native VpnPlugin: connection cancelled or permission denied by user');
          this.setState('disconnected');
          this.activeServer = null;
          return false;
        }
      } catch (err: any) {
        console.warn('Android Native VpnPlugin connect failed or cancelled by user:', err);
        this.setState('disconnected');
        this.activeServer = null;
        return false;
      }
    } else {
      // Simulate connection negotiation handshake (Xray/Sing-box initialization on web/desktop)
      await new Promise(r => setTimeout(r, 1200));
    }

    // If Electron is available and mode is system_proxy or tun, set Windows system proxy
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.setSystemProxy(true, 10809, {
          protocol: server.protocol,
          host: server.host,
          port: server.port,
          username: server.username || server.uuid,
          password: server.password,
        });
      } catch (err) {
        console.warn('Electron system proxy call failed:', err);
      }
    }

    this.stats = {
      uploadSpeed: 0,
      downloadSpeed: 0,
      totalUploaded: 0,
      totalDownloaded: 0,
      connectedDuration: 0,
      latency: server.ping || 45,
    };

    this.setState('connected');
    this.startTrafficSimulation();
    return true;
  }

  public async disconnect(): Promise<void> {
    if (this.state === 'disconnected') return;

    this.setState('disconnecting');
    this.stopTrafficSimulation();

    // Disconnect Android VpnService if running natively
    if (Capacitor.isNativePlatform()) {
      try {
        await VpnPlugin.disconnect();
      } catch (err) {
        console.warn('Android Native VpnPlugin disconnect failed:', err);
      }
    }

    // Disable Windows system proxy if Electron is running
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.setSystemProxy(false);
      } catch (err) {
        console.warn('Electron system proxy disable failed:', err);
      }
    }

    await new Promise(r => setTimeout(r, 600));
    this.stats.uploadSpeed = 0;
    this.stats.downloadSpeed = 0;
    this.notifyTraffic();
    this.setState('disconnected');
  }

  private startTrafficSimulation() {
    this.stopTrafficSimulation();

    // Duration timer
    this.durationIntervalId = setInterval(() => {
      this.stats.connectedDuration += 1;
    }, 1000);

    // Dynamic bandwidth fluctuation
    this.intervalId = setInterval(() => {
      // Simulate realistic internet traffic activity with bursts
      const isBurst = Math.random() > 0.75;
      const baseDown = isBurst ? 18 * 1024 * 1024 : 4.5 * 1024 * 1024;
      const baseUp = isBurst ? 2.5 * 1024 * 1024 : 650 * 1024;

      const downJitter = (Math.random() * 0.4 - 0.2) * baseDown;
      const upJitter = (Math.random() * 0.4 - 0.2) * baseUp;

      this.stats.downloadSpeed = Math.max(120 * 1024, Math.floor(baseDown + downJitter));
      this.stats.uploadSpeed = Math.max(30 * 1024, Math.floor(baseUp + upJitter));

      this.stats.totalDownloaded += this.stats.downloadSpeed;
      this.stats.totalUploaded += this.stats.uploadSpeed;

      // Slight latency fluctuation
      if (this.activeServer?.ping) {
        this.stats.latency = Math.max(15, this.activeServer.ping + Math.floor(Math.random() * 6 - 3));
      }

      this.notifyTraffic();
    }, 1000);
  }

  private stopTrafficSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.durationIntervalId) {
      clearInterval(this.durationIntervalId);
      this.durationIntervalId = null;
    }
  }

  private notifyTraffic() {
    this.trafficListeners.forEach(fn => fn({ ...this.stats }));
  }
}

export const proxyService = new ProxyController();
