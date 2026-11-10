package cc.incy.proxy;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Log;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TvSyncServer {
    private static final String TAG = "TvSyncServer";
    public static final int DEFAULT_PORT = 8888;

    private ServerSocket serverSocket;
    private ExecutorService threadPool;
    private volatile boolean isRunning = false;
    private final TvSyncListener listener;
    private final Context context;
    private int port = DEFAULT_PORT;

    public interface TvSyncListener {
        void onDataReceived(String content);
    }

    public TvSyncServer(Context context, TvSyncListener listener) {
        this.context = context;
        this.listener = listener;
    }

    public synchronized boolean start() {
        if (isRunning) return true;

        try {
            serverSocket = new ServerSocket(DEFAULT_PORT);
            port = serverSocket.getLocalPort();
            threadPool = Executors.newCachedThreadPool();
            isRunning = true;

            new Thread(this::listenLoop, "TvSyncServer-Listener").start();
            Log.i(TAG, "TvSyncServer started on port " + port);
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Failed to start TvSyncServer: " + e.getMessage());
            // Try ephemeral port if 8888 is busy
            try {
                serverSocket = new ServerSocket(0);
                port = serverSocket.getLocalPort();
                threadPool = Executors.newCachedThreadPool();
                isRunning = true;
                new Thread(this::listenLoop, "TvSyncServer-Listener").start();
                Log.i(TAG, "TvSyncServer started on ephemeral port " + port);
                return true;
            } catch (IOException ex) {
                Log.e(TAG, "Failed fallback start: " + ex.getMessage());
                return false;
            }
        }
    }

    public synchronized void stop() {
        isRunning = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) {}
            serverSocket = null;
        }
        if (threadPool != null) {
            threadPool.shutdownNow();
            threadPool = null;
        }
        Log.i(TAG, "TvSyncServer stopped.");
    }

    public boolean isRunning() {
        return isRunning;
    }

    public int getPort() {
        return port;
    }

    public String getLocalIpAddress() {
        try {
            WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                int ipInt = wm.getConnectionInfo().getIpAddress();
                if (ipInt != 0) {
                    return (ipInt & 0xFF) + "." + ((ipInt >> 8) & 0xFF) + "." + ((ipInt >> 16) & 0xFF) + "." + ((ipInt >> 24) & 0xFF);
                }
            }
        } catch (Exception ignored) {}

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;
                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {}

        return "127.0.0.1";
    }

    private void listenLoop() {
        while (isRunning && serverSocket != null && !serverSocket.isClosed()) {
            try {
                Socket client = serverSocket.accept();
                if (threadPool != null) {
                    threadPool.execute(() -> handleClient(client));
                }
            } catch (IOException e) {
                if (!isRunning) break;
            }
        }
    }

    private void handleClient(Socket client) {
        try {
            client.setSoTimeout(10000);
            InputStream in = client.getInputStream();
            OutputStream out = client.getOutputStream();

            BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            String requestLine = reader.readLine();
            if (requestLine == null || requestLine.isEmpty()) {
                client.close();
                return;
            }

            String[] parts = requestLine.split("\\s+");
            if (parts.length < 2) {
                client.close();
                return;
            }

            String method = parts[0].toUpperCase();
            String path = parts[1];

            int contentLength = 0;
            String headerLine;
            while ((headerLine = reader.readLine()) != null && !headerLine.isEmpty()) {
                String lower = headerLine.toLowerCase();
                if (lower.startsWith("content-length:")) {
                    try {
                        contentLength = Integer.parseInt(headerLine.substring(15).trim());
                    } catch (NumberFormatException ignored) {}
                }
            }

            if ("OPTIONS".equals(method)) {
                sendResponse(out, 200, "OK", "text/plain", "");
                client.close();
                return;
            }

            if ("GET".equals(method) && ("/".equals(path) || path.startsWith("/?"))) {
                String html = getWebPageHtml();
                sendResponse(out, 200, "OK", "text/html; charset=utf-8", html);
                client.close();
                return;
            }

            if ("POST".equals(method) && path.startsWith("/api/sync")) {
                StringBuilder body = new StringBuilder();
                if (contentLength > 0) {
                    char[] buffer = new char[contentLength];
                    int read = 0;
                    while (read < contentLength) {
                        int r = reader.read(buffer, read, contentLength - read);
                        if (r == -1) break;
                        read += r;
                    }
                    body.append(buffer, 0, read);
                }

                String receivedContent = body.toString();
                // Try to extract from JSON if { "content": "..." } or { "text": "..." }
                String extracted = extractContent(receivedContent);

                if (listener != null && !extracted.trim().isEmpty()) {
                    listener.onDataReceived(extracted.trim());
                }

                String jsonResponse = "{\"success\":true,\"message\":\"Servers received successfully!\"}";
                sendResponse(out, 200, "OK", "application/json; charset=utf-8", jsonResponse);
                client.close();
                return;
            }

            // Fallback 404
            sendResponse(out, 404, "Not Found", "text/plain", "Not Found");
            client.close();

        } catch (Exception e) {
            Log.w(TAG, "Client handle error: " + e.getMessage());
        } finally {
            try {
                client.close();
            } catch (Exception ignored) {}
        }
    }

    private String extractContent(String raw) {
        if (raw == null) return "";
        String trimmed = raw.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                org.json.JSONObject obj = new org.json.JSONObject(trimmed);
                if (obj.has("servers") || obj.has("type")) return trimmed;
                if (obj.has("content")) return obj.getString("content");
                if (obj.has("text")) return obj.getString("text");
            } catch (Exception ignored) {}
        }
        return raw;
    }

    private void sendResponse(OutputStream out, int statusCode, String statusText, String contentType, String body) throws IOException {
        byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
        String header = "HTTP/1.1 " + statusCode + " " + statusText + "\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Content-Length: " + bodyBytes.length + "\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                "Access-Control-Allow-Headers: Content-Type, Authorization, Access-Control-Request-Private-Network\r\n" +
                "Access-Control-Allow-Private-Network: true\r\n" +
                "Cache-Control: no-cache, no-store, must-revalidate\r\n" +
                "Connection: close\r\n\r\n";

        out.write(header.getBytes(StandardCharsets.UTF_8));
        out.write(bodyBytes);
        out.flush();
    }

    private String getWebPageHtml() {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"ar\" dir=\"rtl\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>NovaProxy - إرسال الخوادم إلى التلفزيون</title>\n" +
                "  <style>\n" +
                "    body { background: #0b0f19; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }\n" +
                "    .card { background: #151d2f; border: 1px solid #23314d; border-radius: 28px; padding: 24px; max-width: 460px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.6); box-sizing: border-box; }\n" +
                "    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }\n" +
                "    .logo { width: 36px; height: 36px; border-radius: 10px; background: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 20px; }\n" +
                "    h1 { font-size: 19px; margin: 0; color: #f8fafc; font-weight: 800; }\n" +
                "    p { font-size: 12.5px; color: #94a3b8; margin: 0 0 16px 0; line-height: 1.5; }\n" +
                "    .paste-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }\n" +
                "    .label { font-size: 12px; color: #cbd5e1; font-weight: 600; }\n" +
                "    .btn-paste { background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 6px 12px; border-radius: 10px; font-size: 11.5px; font-weight: 600; cursor: pointer; }\n" +
                "    textarea { width: 100%; height: 160px; background: #0b0f19; border: 1px solid #23314d; border-radius: 16px; color: #f8fafc; font-family: monospace; font-size: 14px; padding: 12px; box-sizing: border-box; outline: none; resize: vertical; line-height: 1.4; -webkit-user-select: text; user-select: text; }\n" +
                "    textarea:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56,189,248,0.2); }\n" +
                "    .btn-submit { width: 100%; padding: 14px; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; border-radius: 16px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 14px; box-shadow: 0 4px 15px rgba(37,99,235,0.3); transition: 0.15s; }\n" +
                "    .btn-submit:active { transform: scale(0.98); }\n" +
                "    .msg { display: none; padding: 14px; border-radius: 16px; font-size: 13px; margin-top: 14px; text-align: center; font-weight: 600; }\n" +
                "    .msg-success { background: #064e3b; border: 1px solid #059669; color: #a7f3d0; }\n" +
                "    .msg-error { background: #4c0519; border: 1px solid #e11d48; color: #fecdd3; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"card\">\n" +
                "    <div class=\"header\">\n" +
                "      <div class=\"logo\">📺</div>\n" +
                "      <div>\n" +
                "        <h1>إرسال إلى التلفزيون</h1>\n" +
                "        <span style=\"font-size:11px;color:#38bdf8;font-weight:600;\">NovaProxy TV Sync</span>\n" +
                "      </div>\n" +
                "    </div>\n" +
                "    <p>الصق روابط أو إعدادات البروكسي أدناه، وسيتم إرسالها وتثبيتها فوراً على شاشة التلفزيون دون الحاجة للكتابة بريموت التحكم.</p>\n" +
                "    <div class=\"paste-row\">\n" +
                "      <span class=\"label\">روابط أو كود البروكسي:</span>\n" +
                "      <button type=\"button\" class=\"btn-paste\" onclick=\"pasteClipboard()\">📋 لصق من الحافظة</button>\n" +
                "    </div>\n" +
                "    <textarea id=\"proxyData\" placeholder=\"vless://...&#10;vmess://...&#10;trojan://...&#10;ss://...&#10;http://...&#10;socks5://...\"></textarea>\n" +
                "    <button type=\"button\" class=\"btn-submit\" id=\"btnSend\" onclick=\"sendToTv()\">🚀 إرسال إلى التلفزيون الآن</button>\n" +
                "    <div id=\"msgBox\" class=\"msg\"></div>\n" +
                "  </div>\n" +
                "  <script>\n" +
                "    async function pasteClipboard() {\n" +
                "      try {\n" +
                "        if (navigator.clipboard && navigator.clipboard.readText) {\n" +
                "          const text = await navigator.clipboard.readText();\n" +
                "          if (text) { document.getElementById('proxyData').value = text; return; }\n" +
                "        }\n" +
                "      } catch (e) {}\n" +
                "      const ta = document.getElementById('proxyData');\n" +
                "      ta.focus();\n" +
                "    }\n" +
                "    async function sendToTv() {\n" +
                "      const data = document.getElementById('proxyData').value.trim();\n" +
                "      const btn = document.getElementById('btnSend');\n" +
                "      const msg = document.getElementById('msgBox');\n" +
                "      if (!data) { alert('يرجى كتابة أو لصق رابط البروكسي أولاً.'); return; }\n" +
                "      btn.disabled = true; btn.innerText = 'جاري الإرسال...';\n" +
                "      try {\n" +
                "        const res = await fetch('/api/sync', {\n" +
                "          method: 'POST',\n" +
                "          headers: { 'Content-Type': 'application/json' },\n" +
                "          body: JSON.stringify({ content: data })\n" +
                "        });\n" +
                "        const json = await res.json();\n" +
                "        msg.className = 'msg msg-success';\n" +
                "        msg.innerText = '✅ تم إرسال الخوادم بنجاح إلى شاشة التلفزيون!';\n" +
                "        msg.style.display = 'block';\n" +
                "        document.getElementById('proxyData').value = '';\n" +
                "      } catch (err) {\n" +
                "        msg.className = 'msg msg-error';\n" +
                "        msg.innerText = '❌ فشل الاتصال بالتلفزيون. تأكد أن الهاتف والتلفزيون متصلان بنفس شبكة الواي فاي.';\n" +
                "        msg.style.display = 'block';\n" +
                "      } finally {\n" +
                "        btn.disabled = false; btn.innerText = '🚀 إرسال إلى التلفزيون الآن';\n" +
                "      }\n" +
                "    }\n" +
                "  </script>\n" +
                "</body>\n" +
                "</html>";
    }
}
