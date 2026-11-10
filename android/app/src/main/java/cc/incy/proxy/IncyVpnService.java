package cc.incy.proxy;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.ProxyInfo;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.io.IOException;

public class IncyVpnService extends VpnService {
    private static final String TAG = "NovaProxyVpnService";
    private static final String CHANNEL_ID = "novaproxy_vpn_channel";
    private static final int NOTIFICATION_ID = 1001;
    public static final int LOCAL_PORT = 10809;

    public static boolean isRunning = false;
    public static String activeServerName = "";

    private ParcelFileDescriptor vpnInterface = null;
    private LocalProxyBridge localProxyBridge = null;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP".equals(intent.getAction())) {
            stopVpn();
            return START_NOT_STICKY;
        }

        String host = intent != null ? intent.getStringExtra("host") : "";
        int port = intent != null ? intent.getIntExtra("port", 8080) : 8080;
        String name = intent != null ? intent.getStringExtra("name") : "NovaProxy Server";
        String protocol = intent != null ? intent.getStringExtra("protocol") : "http";
        String username = intent != null ? intent.getStringExtra("username") : "";
        String password = intent != null ? intent.getStringExtra("password") : "";
        boolean perAppEnabled = intent != null && intent.getBooleanExtra("perAppEnabled", false);
        String perAppMode = intent != null ? intent.getStringExtra("perAppMode") : "proxy_only";
        java.util.ArrayList<String> selectedApps = intent != null ? intent.getStringArrayListExtra("selectedApps") : null;

        startVpn(name, host, port, protocol, username, password, perAppEnabled, perAppMode, selectedApps);
        return START_STICKY;
    }

    private void startVpn(String name, String host, int port, String protocol, String username, String password,
                          boolean perAppEnabled, String perAppMode, java.util.ArrayList<String> selectedApps) {
        if (isRunning) {
            Log.i(TAG, "VPN is already running. Stopping previous connection to switch to: " + name);
            stopVpn();
            try {
                Thread.sleep(300);
            } catch (InterruptedException ignored) {}
        }

        createNotificationChannel();
        String notifMsg = "Connected: " + name;
        if (perAppEnabled && "proxy_only".equals(perAppMode) && selectedApps != null && !selectedApps.isEmpty()) {
            notifMsg = "Proxy Only (" + selectedApps.size() + " app" + (selectedApps.size() > 1 ? "s" : "") + "): " + name;
        } else if (perAppEnabled && "bypass".equals(perAppMode) && selectedApps != null && !selectedApps.isEmpty()) {
            notifMsg = "Bypass Mode (" + selectedApps.size() + " app" + (selectedApps.size() > 1 ? "s" : "") + "): " + name;
        }
        Notification notification = createNotification(notifMsg);

        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.w(TAG, "startForeground fallback: " + e.getMessage());
            try {
                startForeground(NOTIFICATION_ID, notification);
            } catch (Exception ignored) {}
        }

        try {
            // Start local proxy bridge
            localProxyBridge = new LocalProxyBridge(this, host, port, protocol, username, password, LOCAL_PORT);
            localProxyBridge.start();
            int boundPort = localProxyBridge.getLocalPort();

            // Establish Android VpnService
            Builder builder = new Builder();
            builder.setSession("NovaProxy - " + name);
            builder.addAddress("10.0.0.2", 32);
            builder.addRoute("10.0.0.0", 32);
            builder.setMtu(1500);

            // Per-App Proxy Configuration
            if (perAppEnabled && "proxy_only".equals(perAppMode) && selectedApps != null && !selectedApps.isEmpty()) {
                int allowedCount = 0;
                for (String pkg : selectedApps) {
                    if (pkg == null) continue;
                    String cleanPkg = pkg.trim();
                    if (cleanPkg.isEmpty()) continue;
                    try {
                        builder.addAllowedApplication(cleanPkg);
                        allowedCount++;
                        Log.i(TAG, "VPN addAllowedApplication: " + cleanPkg);
                    } catch (Exception e) {
                        Log.w(TAG, "Failed to addAllowedApplication (" + cleanPkg + "): " + e.getMessage());
                    }
                }
                Log.i(TAG, "Per-App Proxy Mode [PROXY_ONLY] established for " + allowedCount + " app(s). All other apps connect directly.");
                if (allowedCount == 0) {
                    Log.e(TAG, "Per-App Proxy: None of the selected apps could be added. Aborting VPN to avoid leaking global traffic.");
                    stopVpn();
                    return;
                }
            } else if (perAppEnabled && "bypass".equals(perAppMode) && selectedApps != null && !selectedApps.isEmpty()) {
                try {
                    builder.addDisallowedApplication(getPackageName());
                } catch (Exception e) {
                    Log.w(TAG, "addDisallowedApplication failed: " + e.getMessage());
                }
                for (String pkg : selectedApps) {
                    if (pkg == null) continue;
                    String cleanPkg = pkg.trim();
                    if (cleanPkg.isEmpty()) continue;
                    try {
                        builder.addDisallowedApplication(cleanPkg);
                        Log.i(TAG, "VPN addDisallowedApplication: " + cleanPkg);
                    } catch (Exception e) {
                        Log.w(TAG, "Failed to addDisallowedApplication (" + cleanPkg + "): " + e.getMessage());
                    }
                }
                Log.i(TAG, "Per-App Proxy Mode [BYPASS] established for " + selectedApps.size() + " app(s).");
            } else {
                // Global VPN: Disallow NovaProxy itself to avoid loop
                try {
                    builder.addDisallowedApplication(getPackageName());
                } catch (Exception e) {
                    Log.w(TAG, "addDisallowedApplication failed: " + e.getMessage());
                }
                Log.i(TAG, "Global VPN established: all apps routed through proxy.");
            }

            // Set system HTTP proxy on Android 10+ with local/bank exclusions
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    java.util.List<String> exclusions = java.util.Arrays.asList(
                        "localhost",
                        "127.0.0.1",
                        "192.168.*",
                        "10.*",
                        "172.16.*",
                        "172.17.*",
                        "172.18.*",
                        "172.19.*",
                        "172.20.*",
                        "172.21.*",
                        "172.22.*",
                        "172.23.*",
                        "172.24.*",
                        "172.25.*",
                        "172.26.*",
                        "172.27.*",
                        "172.28.*",
                        "172.29.*",
                        "172.30.*",
                        "172.31.*",
                        "*.local",
                        "*.stc.com.sa",
                        "*.stc.com",
                        "*.mystc.com.sa",
                        "*.alrajhibank.com.sa",
                        "*.snb.com",
                        "*.alinma.com",
                        "*.bankalbilad.com",
                        "*.anb.com.sa",
                        "*.tawakkalna.gov.sa"
                    );
                    ProxyInfo proxyInfo = ProxyInfo.buildDirectProxy("127.0.0.1", boundPort, exclusions);
                    builder.setHttpProxy(proxyInfo);
                    Log.i(TAG, "Direct HTTP Proxy configured for VPN on 127.0.0.1:" + boundPort);
                } catch (Exception e) {
                    Log.w(TAG, "Failed to setHttpProxy: " + e.getMessage());
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                try {
                    setUnderlyingNetworks(null);
                } catch (Exception ignored) {}
            }

            vpnInterface = builder.establish();
            if (vpnInterface != null) {
                isRunning = true;
                activeServerName = name;
                Log.i(TAG, "INCY VPN interface established successfully!");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to establish VPN: " + e.getMessage(), e);
            stopVpn();
        }
    }

    private void stopVpn() {
        isRunning = false;
        activeServerName = "";

        if (localProxyBridge != null) {
            localProxyBridge.stop();
            localProxyBridge = null;
        }

        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing VPN interface: " + e.getMessage());
            }
            vpnInterface = null;
        }

        try {
            stopForeground(true);
        } catch (Exception ignored) {}

        stopSelf();
        Log.i(TAG, "INCY VPN stopped.");
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    @Override
    public void onRevoke() {
        stopVpn();
        super.onRevoke();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "NovaProxy VPN Status",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active NovaProxy connection status");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification(String text) {
        Intent launchIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, launchIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("NovaProxy")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }
}