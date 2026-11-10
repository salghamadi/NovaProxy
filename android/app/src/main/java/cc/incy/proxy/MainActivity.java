package cc.incy.proxy;

import android.app.UiModeManager;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VpnPlugin.class);
        super.onCreate(savedInstanceState);

        // Android TV & D-Pad focus configuration
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);
            webView.requestFocus();
            webView.setBackgroundColor(0xFF121316);
            webView.getSettings().setSupportZoom(false);

            UiModeManager uiModeManager = (UiModeManager) getSystemService(UI_MODE_SERVICE);
            boolean isTv = uiModeManager != null && uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
            if (isTv) {
                // TV user agent hint
                String currentUa = webView.getSettings().getUserAgentString();
                if (currentUa != null && !currentUa.contains("AndroidTV")) {
                    webView.getSettings().setUserAgentString(currentUa + " AndroidTV/NovaProxy");
                }
            }
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Ensure DPAD and Back keys reach WebView on TV remotes
        return super.dispatchKeyEvent(event);
    }
}
