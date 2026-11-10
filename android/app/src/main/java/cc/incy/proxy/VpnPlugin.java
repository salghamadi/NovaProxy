package cc.incy.proxy;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VpnPlugin")
public class VpnPlugin extends Plugin {
    private static final String TAG = "VpnPlugin";

    @PluginMethod
    public void prepare(PluginCall call) {
        Intent intent = VpnService.prepare(getContext());
        if (intent != null) {
            startActivityForResult(call, intent, "vpnPermissionResult");
        } else {
            JSObject res = new JSObject();
            res.put("granted", true);
            call.resolve(res);
        }
    }

    @ActivityCallback
    private void vpnPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        boolean granted = result != null && result.getResultCode() == Activity.RESULT_OK;
        if (!granted) {
            Log.w(TAG, "VPN permission was denied or cancelled by user (resultCode=" + (result != null ? result.getResultCode() : -999) + ")");
            JSObject res = new JSObject();
            res.put("success", false);
            res.put("connected", false);
            res.put("granted", false);
            res.put("error", "VPN permission was cancelled or denied by user");
            call.reject("VPN_PERMISSION_DENIED", "VPN permission was cancelled or denied by user", null, res);
            return;
        }

        // Permission granted by user
        Log.i(TAG, "VPN permission granted by user, starting VPN service...");
        startVpnService(call);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        Intent vpnIntent = VpnService.prepare(getContext());
        if (vpnIntent != null) {
            // Need user approval from system VPN dialog
            startActivityForResult(call, vpnIntent, "vpnPermissionResult");
            return;
        }

        startVpnService(call);
    }

    private void startVpnService(PluginCall call) {
        try {
            String host = call.getString("host", "");
            int port = call.getInt("port", 8080);
            String name = call.getString("name", "NovaProxy Server");
            String protocol = call.getString("protocol", "http");
            String username = call.getString("username", "");
            String password = call.getString("password", "");
            boolean perAppEnabled = Boolean.TRUE.equals(call.getBoolean("perAppEnabled", false));
            String perAppMode = call.getString("perAppMode", "proxy_only");

            com.getcapacitor.JSArray appsJs = call.getArray("selectedApps");
            java.util.ArrayList<String> selectedApps = new java.util.ArrayList<>();
            if (appsJs != null) {
                for (int i = 0; i < appsJs.length(); i++) {
                    try {
                        String app = appsJs.getString(i);
                        if (app != null && !app.trim().isEmpty()) {
                            selectedApps.add(app.trim());
                        }
                    } catch (Exception ignored) {}
                }
            }

            Intent intent = new Intent(getContext(), IncyVpnService.class);
            intent.putExtra("host", host);
            intent.putExtra("port", port);
            intent.putExtra("name", name);
            intent.putExtra("protocol", protocol);
            intent.putExtra("username", username);
            intent.putExtra("password", password);
            intent.putExtra("perAppEnabled", perAppEnabled);
            intent.putExtra("perAppMode", perAppMode);
            intent.putStringArrayListExtra("selectedApps", selectedApps);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("connected", true);
            res.put("granted", true);
            res.put("localPort", IncyVpnService.LOCAL_PORT);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start VPN service: " + e.getMessage(), e);
            call.reject("Failed to start VPN: " + e.getMessage());
        }
    }

    private String drawableToBase64(android.graphics.drawable.Drawable drawable) {
        if (drawable == null) return null;
        try {
            int width = drawable.getIntrinsicWidth();
            int height = drawable.getIntrinsicHeight();
            int targetSize = 96;

            if (width <= 0 || height <= 0) {
                width = targetSize;
                height = targetSize;
            } else {
                if (width > targetSize || height > targetSize) {
                    float ratio = (float) width / (float) height;
                    if (ratio > 1) {
                        width = targetSize;
                        height = Math.max(1, (int) (targetSize / ratio));
                    } else {
                        height = targetSize;
                        width = Math.max(1, (int) (targetSize * ratio));
                    }
                }
            }

            android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888);
            android.graphics.Canvas canvas = new android.graphics.Canvas(bitmap);
            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
            drawable.draw(canvas);

            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 85, outputStream);
            byte[] byteArray = outputStream.toByteArray();
            return "data:image/png;base64," + android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP);
        } catch (Throwable t) {
            Log.w(TAG, "Failed to convert drawable to base64: " + t.getMessage());
            return null;
        }
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        new Thread(() -> {
            try {
                android.content.pm.PackageManager pm = getContext().getPackageManager();

                Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
                mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
                java.util.List<android.content.pm.ResolveInfo> resolveInfos = pm.queryIntentActivities(mainIntent, 0);

                Intent tvIntent = new Intent(Intent.ACTION_MAIN, null);
                tvIntent.addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER);
                java.util.List<android.content.pm.ResolveInfo> tvResolveInfos = pm.queryIntentActivities(tvIntent, 0);

                java.util.Map<String, JSObject> appsMap = new java.util.HashMap<>();
                java.util.List<android.content.pm.ResolveInfo> allApps = new java.util.ArrayList<>();
                if (resolveInfos != null) allApps.addAll(resolveInfos);
                if (tvResolveInfos != null) allApps.addAll(tvResolveInfos);

                String currentPackage = getContext().getPackageName();

                for (android.content.pm.ResolveInfo ri : allApps) {
                    if (ri.activityInfo != null && ri.activityInfo.packageName != null) {
                        String pkg = ri.activityInfo.packageName;
                        if (pkg.equals(currentPackage)) continue;
                        if (!appsMap.containsKey(pkg)) {
                            CharSequence labelSeq = ri.loadLabel(pm);
                            String name = labelSeq != null ? labelSeq.toString() : pkg;

                            String iconBase64 = null;
                            try {
                                android.graphics.drawable.Drawable iconDrawable = ri.loadIcon(pm);
                                iconBase64 = drawableToBase64(iconDrawable);
                            } catch (Throwable ignored) {}

                            JSObject appObj = new JSObject();
                            appObj.put("packageName", pkg);
                            appObj.put("name", name);
                            if (iconBase64 != null) {
                                appObj.put("icon", iconBase64);
                            }
                            appsMap.put(pkg, appObj);
                        }
                    }
                }

                java.util.List<JSObject> sortedList = new java.util.ArrayList<>(appsMap.values());
                java.util.Collections.sort(sortedList, (a, b) -> {
                    String nameA = a.optString("name", "");
                    String nameB = b.optString("name", "");
                    return nameA.compareToIgnoreCase(nameB);
                });

                com.getcapacitor.JSArray appsArray = new com.getcapacitor.JSArray();
                for (JSObject app : sortedList) {
                    appsArray.put(app);
                }

                JSObject res = new JSObject();
                res.put("apps", appsArray);
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "getInstalledApps error: " + e.getMessage(), e);
                call.reject("Failed to get installed apps: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), IncyVpnService.class);
            intent.setAction("STOP");
            getContext().startService(intent);

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("connected", false);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop VPN service: " + e.getMessage(), e);
            call.reject("Failed to stop VPN: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject res = new JSObject();
        res.put("isRunning", IncyVpnService.isRunning);
        res.put("activeServerName", IncyVpnService.activeServerName);
        res.put("localPort", IncyVpnService.LOCAL_PORT);
        call.resolve(res);
    }

    @PluginMethod
    public void resolveGeo(PluginCall call) {
        String rawHost = call.getString("host", "").trim();
        if (rawHost.isEmpty()) {
            call.reject("Host is empty");
            return;
        }

        new Thread(() -> {
            String cleanHost = rawHost.replaceAll("(?i)^https?://", "");
            if (cleanHost.contains("/")) {
                cleanHost = cleanHost.split("/")[0].trim();
            }
            if (cleanHost.contains(":")) {
                cleanHost = cleanHost.split(":")[0].trim();
            }

            if (cleanHost.isEmpty()) {
                call.reject("Invalid clean host");
                return;
            }

            // Resolve domain to IP if cleanHost is a domain
            String resolvedIp = cleanHost;
            try {
                java.net.InetAddress addr = java.net.InetAddress.getByName(cleanHost);
                resolvedIp = addr.getHostAddress();
            } catch (Exception e) {
                Log.w(TAG, "DNS resolution failed for " + cleanHost + ": " + e.getMessage());
            }

            // Provider 1: ip-api.com (Supports domains and IPs, fast, robust)
            try {
                java.net.URL url = new java.net.URL("http://ip-api.com/json/" + cleanHost);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "NovaProxy/4.0");

                if (conn.getResponseCode() == 200) {
                    java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) {
                        response.append(line);
                    }
                    in.close();

                    org.json.JSONObject json = new org.json.JSONObject(response.toString());
                    if ("success".equalsIgnoreCase(json.optString("status"))) {
                        String country = json.optString("country", "").trim();
                        String countryCode = json.optString("countryCode", "").trim();
                        String city = json.optString("city", "").trim();
                        if (city.isEmpty()) {
                            city = json.optString("regionName", "").trim();
                        }

                        if (!country.isEmpty()) {
                            JSObject ret = new JSObject();
                            ret.put("country", country);
                            ret.put("countryCode", countryCode);
                            ret.put("city", !city.isEmpty() ? city : country);
                            call.resolve(ret);
                            return;
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Native resolveGeo ip-api error: " + e.getMessage());
            }

            // Provider 2: ipwho.is (with resolved IP)
            try {
                java.net.URL url = new java.net.URL("https://ipwho.is/" + resolvedIp);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "NovaProxy/4.0");

                if (conn.getResponseCode() == 200) {
                    java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder response = new StringBuilder();
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();

                    org.json.JSONObject json = new org.json.JSONObject(response.toString());
                    if (json.optBoolean("success", false)) {
                        String country = json.optString("country", "").trim();
                        String countryCode = json.optString("country_code", "").trim();
                        String city = json.optString("city", "").trim();
                        if (city.isEmpty()) {
                            city = json.optString("region", "").trim();
                        }

                        if (!country.isEmpty()) {
                            JSObject ret = new JSObject();
                            ret.put("country", country);
                            ret.put("countryCode", countryCode);
                            ret.put("city", !city.isEmpty() ? city : country);
                            call.resolve(ret);
                            return;
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Native resolveGeo ipwho error: " + e.getMessage());
            }

            // Provider 3: api.country.is (Reliable minimal fallback)
            try {
                java.net.URL url = new java.net.URL("https://api.country.is/" + resolvedIp);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "NovaProxy/4.0");

                if (conn.getResponseCode() == 200) {
                    java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder response = new StringBuilder();
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();

                    org.json.JSONObject json = new org.json.JSONObject(response.toString());
                    String countryCode = json.optString("country", "").trim();
                    if (!countryCode.isEmpty()) {
                        java.util.Locale loc = new java.util.Locale("", countryCode);
                        String countryName = loc.getDisplayCountry(java.util.Locale.ENGLISH);
                        if (countryName.isEmpty()) countryName = countryCode;

                        JSObject ret = new JSObject();
                        ret.put("country", countryName);
                        ret.put("countryCode", countryCode);
                        ret.put("city", countryName);
                        call.resolve(ret);
                        return;
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Native resolveGeo country.is error: " + e.getMessage());
            }

            call.reject("Geo resolution failed");
        }).start();
    }

    private static TvSyncServer tvSyncServer = null;

    @PluginMethod
    public void startTvSyncServer(PluginCall call) {
        try {
            if (tvSyncServer != null) {
                tvSyncServer.stop();
                tvSyncServer = null;
            }
            tvSyncServer = new TvSyncServer(getContext(), (content) -> {
                if (getActivity() != null) {
                    getActivity().runOnUiThread(() -> {
                        JSObject ret = new JSObject();
                        ret.put("content", content);
                        notifyListeners("tvSyncReceived", ret);
                    });
                } else {
                    JSObject ret = new JSObject();
                    ret.put("content", content);
                    notifyListeners("tvSyncReceived", ret);
                }
            });

            boolean ok = tvSyncServer.start();
            String ip = tvSyncServer.getLocalIpAddress();
            int port = tvSyncServer.getPort();

            JSObject res = new JSObject();
            res.put("success", ok);
            res.put("running", tvSyncServer.isRunning());
            res.put("ip", ip);
            res.put("port", port);
            res.put("url", "http://" + ip + ":" + port);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "startTvSyncServer error: " + e.getMessage(), e);
            call.reject("Failed to start TV Sync Server: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTvSyncServer(PluginCall call) {
        try {
            if (tvSyncServer != null) {
                tvSyncServer.stop();
                tvSyncServer = null;
            }
            JSObject res = new JSObject();
            res.put("success", true);
            res.put("running", false);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "stopTvSyncServer error: " + e.getMessage(), e);
            call.reject("Failed to stop TV Sync Server: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getTvSyncStatus(PluginCall call) {
        try {
            JSObject res = new JSObject();
            if (tvSyncServer != null && tvSyncServer.isRunning()) {
                String ip = tvSyncServer.getLocalIpAddress();
                int port = tvSyncServer.getPort();
                res.put("running", true);
                res.put("ip", ip);
                res.put("port", port);
                res.put("url", "http://" + ip + ":" + port);
            } else {
                TvSyncServer temp = new TvSyncServer(getContext(), null);
                String ip = temp.getLocalIpAddress();
                res.put("running", false);
                res.put("ip", ip);
                res.put("port", TvSyncServer.DEFAULT_PORT);
                res.put("url", "http://" + ip + ":" + TvSyncServer.DEFAULT_PORT);
            }
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "getTvSyncStatus error: " + e.getMessage(), e);
            call.reject("Failed to get TV sync status: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendTvSyncData(PluginCall call) {
        String address = call.getString("address", "");
        String content = call.getString("content", "");

        if (address == null || address.trim().isEmpty()) {
            call.reject("يرجى كتابة عنوان IP التلفزيون");
            return;
        }

        if (content == null || content.trim().isEmpty()) {
            call.reject("لا توجد خوادم لإرسالها");
            return;
        }

        new Thread(() -> {
            try {
                String target = address.trim();
                if (!target.startsWith("http://") && !target.startsWith("https://")) {
                    if (!target.contains(":")) {
                        target = "http://" + target + ":" + TvSyncServer.DEFAULT_PORT;
                    } else {
                        target = "http://" + target;
                    }
                }
                if (!target.endsWith("/api/sync")) {
                    target = target.endsWith("/") ? target + "api/sync" : target + "/api/sync";
                }

                java.net.URL url = new java.net.URL(target);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setDoOutput(true);

                org.json.JSONObject body = new org.json.JSONObject();
                body.put("content", content);
                byte[] bodyBytes = body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                conn.setFixedLengthStreamingMode(bodyBytes.length);

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(bodyBytes);
                    os.flush();
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("message", "تم إرسال الخوادم إلى التلفزيون بنجاح!");
                    call.resolve(ret);
                } else {
                    call.reject("التلفزيون رد برمز: " + code);
                }
                conn.disconnect();
            } catch (java.net.SocketTimeoutException e) {
                call.reject("انتهت مهلة الاتصال بالتلفزيون. تأكد من فتح شاشة المزامنة على التلفزيون وصحة رقم الـ IP");
            } catch (java.net.ConnectException e) {
                call.reject("تعذر الاتصال بالتلفزيون. تأكد أن الجوال والتلفزيون متصلان بنفس شبكة الواي فاي وأن شاشة المزامنة مفتوحة");
            } catch (Exception e) {
                call.reject("فشل الاتصال: " + e.getMessage());
            }
        }).start();
    }
}
