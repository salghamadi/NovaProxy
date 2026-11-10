package cc.incy.proxy;

import android.net.VpnService;
import android.util.Base64;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LocalProxyBridge {
    private static final String TAG = "LocalProxyBridge";

    private final VpnService vpnService;
    private final String upstreamHost;
    private final int upstreamPort;
    private final String protocol; // "http" or "socks" / "socks5"
    private final String username;
    private final String password;
    private final int localPort;

    private ServerSocket serverSocket;
    private ExecutorService threadPool;
    private volatile boolean isRunning = false;

    public LocalProxyBridge(VpnService vpnService, String upstreamHost, int upstreamPort,
                            String protocol, String username, String password, int localPort) {
        this.vpnService = vpnService;
        this.upstreamHost = upstreamHost;
        this.upstreamPort = upstreamPort;
        this.protocol = protocol != null ? protocol.toLowerCase() : "http";
        this.username = username != null ? username : "";
        this.password = password != null ? password : "";
        this.localPort = localPort;
    }

    public synchronized void start() throws IOException {
        if (isRunning) return;

        serverSocket = new ServerSocket();
        serverSocket.setReuseAddress(true);
        try {
            serverSocket.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), localPort), 50);
        } catch (IOException e) {
            Log.w(TAG, "Port " + localPort + " in use, retrying after short pause: " + e.getMessage());
            try {
                Thread.sleep(200);
            } catch (InterruptedException ignored) {}
            try {
                serverSocket = new ServerSocket();
                serverSocket.setReuseAddress(true);
                serverSocket.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), localPort), 50);
            } catch (IOException ex) {
                Log.w(TAG, "Still busy, binding ephemeral port: " + ex.getMessage());
                serverSocket = new ServerSocket();
                serverSocket.setReuseAddress(true);
                serverSocket.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 50);
            }
        }
        threadPool = Executors.newCachedThreadPool();
        isRunning = true;

        new Thread(this::listenLoop, "LocalProxyBridge-Acceptor").start();
        Log.i(TAG, "LocalProxyBridge started on 127.0.0.1:" + serverSocket.getLocalPort() + " forwarding to " + upstreamHost + ":" + upstreamPort + " (" + protocol + ")");
    }

    public int getLocalPort() {
        return (serverSocket != null && !serverSocket.isClosed()) ? serverSocket.getLocalPort() : localPort;
    }

    private void listenLoop() {
        while (isRunning && serverSocket != null && !serverSocket.isClosed()) {
            try {
                Socket clientSocket = serverSocket.accept();
                threadPool.execute(() -> handleClient(clientSocket));
            } catch (IOException e) {
                if (!isRunning) break;
                Log.w(TAG, "Accept error: " + e.getMessage());
            }
        }
    }

    private void handleClient(Socket clientSocket) {
        Socket upstreamSocket = null;
        try {
            clientSocket.setSoTimeout(30000);
            InputStream clientIn = clientSocket.getInputStream();
            OutputStream clientOut = clientSocket.getOutputStream();

            // Read the initial request line (e.g. CONNECT example.com:443 HTTP/1.1 or GET http://...)
            String initialLine = readLine(clientIn);
            if (initialLine == null || initialLine.trim().isEmpty()) {
                safeClose(clientSocket);
                return;
            }

            String[] parts = initialLine.split("\\s+");
            if (parts.length < 2) {
                safeClose(clientSocket);
                return;
            }

            String method = parts[0].toUpperCase();
            String target = parts[1];

            // Connect upstream
            upstreamSocket = new Socket();
            if (vpnService != null) {
                vpnService.protect(upstreamSocket);
            }
            upstreamSocket.connect(new InetSocketAddress(upstreamHost, upstreamPort), 15000);
            upstreamSocket.setSoTimeout(30000);

            InputStream upIn = upstreamSocket.getInputStream();
            OutputStream upOut = upstreamSocket.getOutputStream();

            if (isSocksProtocol()) {
                handleSocksUpstream(method, target, clientIn, clientOut, upIn, upOut);
            } else {
                handleHttpUpstream(method, target, initialLine, clientIn, clientOut, upIn, upOut);
            }

            // Pipe streams in both directions
            Socket fClient = clientSocket;
            Socket fUpstream = upstreamSocket;
            threadPool.execute(() -> pipe(clientIn, upOut, fClient, fUpstream));
            pipe(upIn, clientOut, fUpstream, fClient);

        } catch (Exception e) {
            Log.d(TAG, "Bridge connection handling ended: " + e.getMessage());
        } finally {
            safeClose(clientSocket);
            safeClose(upstreamSocket);
        }
    }

    private boolean isSocksProtocol() {
        return protocol.contains("socks");
    }

    private void handleHttpUpstream(String method, String target, String initialLine,
                                    InputStream clientIn, OutputStream clientOut,
                                    InputStream upIn, OutputStream upOut) throws IOException {
        String authHeader = "";
        if (!username.isEmpty()) {
            String token = username + ":" + password;
            String encoded = Base64.encodeToString(token.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
            authHeader = "Proxy-Authorization: Basic " + encoded + "\r\n";
        }

        if ("CONNECT".equalsIgnoreCase(method)) {
            // Read and consume remaining client headers
            String line;
            while ((line = readLine(clientIn)) != null && !line.isEmpty()) {
                // discard or read
            }

            // Send CONNECT request to upstream HTTP proxy
            String connectReq = "CONNECT " + target + " HTTP/1.1\r\n"
                    + "Host: " + target + "\r\n"
                    + authHeader
                    + "Proxy-Connection: Keep-Alive\r\n\r\n";
            upOut.write(connectReq.getBytes(StandardCharsets.UTF_8));
            upOut.flush();

            // Read upstream status response
            String responseStatus = readLine(upIn);
            if (responseStatus == null || !responseStatus.contains("200")) {
                throw new IOException("Upstream HTTP proxy refused CONNECT: " + responseStatus);
            }

            // Discard remaining headers from upstream
            while ((line = readLine(upIn)) != null && !line.isEmpty()) {
                // headers finished
            }

            // Notify client that connection is established
            clientOut.write("HTTP/1.1 200 Connection Established\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            clientOut.flush();

        } else {
            // Regular HTTP request (GET, POST, etc.)
            upOut.write((initialLine + "\r\n").getBytes(StandardCharsets.UTF_8));
            if (!authHeader.isEmpty()) {
                upOut.write(authHeader.getBytes(StandardCharsets.UTF_8));
            }

            // Forward the rest of headers
            String line;
            while ((line = readLine(clientIn)) != null && !line.isEmpty()) {
                if (!line.toLowerCase().startsWith("proxy-authorization:")) {
                    upOut.write((line + "\r\n").getBytes(StandardCharsets.UTF_8));
                }
            }
            upOut.write("\r\n".getBytes(StandardCharsets.UTF_8));
            upOut.flush();
        }
    }

    private void handleSocksUpstream(String method, String target,
                                     InputStream clientIn, OutputStream clientOut,
                                     InputStream upIn, OutputStream upOut) throws IOException {
        // Parse destination host and port
        String destHost;
        int destPort = 80;

        if (target.contains(":")) {
            String[] hParts = target.split(":");
            destHost = hParts[0];
            try {
                destPort = Integer.parseInt(hParts[1]);
            } catch (NumberFormatException ignored) {}
        } else {
            destHost = target;
        }

        // SOCKS5 Handshake
        if (!username.isEmpty()) {
            // Version 5, 2 auth methods (No Auth 0x00, User/Pass 0x02)
            upOut.write(new byte[]{0x05, 0x02, 0x00, 0x02});
        } else {
            // Version 5, 1 auth method (No Auth 0x00)
            upOut.write(new byte[]{0x05, 0x01, 0x00});
        }
        upOut.flush();

        int sVer = upIn.read();
        int authMethod = upIn.read();
        if (sVer != 0x05) {
            throw new IOException("Invalid SOCKS version from server: " + sVer);
        }

        if (authMethod == 0x02) {
            // Perform sub-negotiation username/password authentication (RFC 1929)
            byte[] userBytes = username.getBytes(StandardCharsets.UTF_8);
            byte[] passBytes = password.getBytes(StandardCharsets.UTF_8);

            ByteArrayOutputStream authBuf = new ByteArrayOutputStream();
            authBuf.write(0x01); // Auth version
            authBuf.write(userBytes.length);
            authBuf.write(userBytes);
            authBuf.write(passBytes.length);
            authBuf.write(passBytes);
            upOut.write(authBuf.toByteArray());
            upOut.flush();

            int authVer = upIn.read();
            int authStatus = upIn.read();
            if (authStatus != 0x00) {
                throw new IOException("SOCKS5 authentication failed with status: " + authStatus);
            }
        } else if (authMethod != 0x00) {
            throw new IOException("SOCKS5 server requested unsupported auth method: " + authMethod);
        }

        // SOCKS5 CONNECT command (CMD=0x01, RSV=0x00, ATYP=0x03 [Domain])
        byte[] domainBytes = destHost.getBytes(StandardCharsets.UTF_8);
        ByteArrayOutputStream reqBuf = new ByteArrayOutputStream();
        reqBuf.write(0x05); // Ver
        reqBuf.write(0x01); // Connect
        reqBuf.write(0x00); // Reserved
        reqBuf.write(0x03); // Domain name
        reqBuf.write(domainBytes.length);
        reqBuf.write(domainBytes);
        reqBuf.write((destPort >> 8) & 0xFF);
        reqBuf.write(destPort & 0xFF);

        upOut.write(reqBuf.toByteArray());
        upOut.flush();

        // Read SOCKS5 server reply
        int rVer = upIn.read();
        int rRep = upIn.read();
        int rRsv = upIn.read();
        int rAtyp = upIn.read();

        if (rRep != 0x00) {
            throw new IOException("SOCKS5 CONNECT failed with code: " + rRep);
        }

        // Read bound address and port to complete handshake
        if (rAtyp == 0x01) { // IPv4
            byte[] ipv4 = new byte[4];
            upIn.read(ipv4);
        } else if (rAtyp == 0x03) { // Domain
            int dLen = upIn.read();
            byte[] dBuf = new byte[dLen];
            upIn.read(dBuf);
        } else if (rAtyp == 0x04) { // IPv6
            byte[] ipv6 = new byte[16];
            upIn.read(ipv6);
        }
        // Read 2 bytes port
        upIn.read();
        upIn.read();

        if ("CONNECT".equalsIgnoreCase(method)) {
            // Discard remaining client headers
            String line;
            while ((line = readLine(clientIn)) != null && !line.isEmpty()) {
                // discard
            }
            clientOut.write("HTTP/1.1 200 Connection Established\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            clientOut.flush();
        }
    }

    private void pipe(InputStream in, OutputStream out, Socket s1, Socket s2) {
        byte[] buffer = new byte[16384];
        int read;
        try {
            while (isRunning && (read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
                out.flush();
            }
        } catch (IOException ignored) {
        } finally {
            safeClose(s1);
            safeClose(s2);
        }
    }

    private String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') {
                buffer.write(c);
            }
        }
        if (buffer.size() == 0 && c == -1) return null;
        return buffer.toString(StandardCharsets.UTF_8.name());
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
        Log.i(TAG, "LocalProxyBridge stopped.");
    }

    private void safeClose(Socket socket) {
        if (socket != null && !socket.isClosed()) {
            try {
                socket.close();
            } catch (IOException ignored) {}
        }
    }
}