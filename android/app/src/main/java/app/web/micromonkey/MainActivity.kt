package app.web.micromonkey

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Context.USB_SERVICE
import android.content.Intent
import android.hardware.usb.UsbManager
import android.net.Uri
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Base64
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import app.web.micromonkey.ui.theme.MicroMonkeyTheme
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager


class MainActivity : ComponentActivity() {
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>
    private var webView: WebView? = null

    // Suppressed because I'm only loading a trusted page
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val data: Intent? = result.data
            val resultUris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
            fileCallback?.onReceiveValue(resultUris)
            fileCallback = null
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        enableEdgeToEdge()
        setContent {
            MicroMonkeyTheme {
                Scaffold(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight()
                ) { innerPadding ->
                    AndroidView(factory = {
                        WebView(it).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                            webViewClient = MyWebViewClient(assetLoader)
                            webChromeClient = object : WebChromeClient() {
                                override fun onShowFileChooser(
                                    webView: WebView?,
                                    filePathCallback: ValueCallback<Array<Uri>>,
                                    fileChooserParams: FileChooserParams
                                ): Boolean {
                                    fileCallback?.onReceiveValue(null)
                                    fileCallback = filePathCallback

                                    val intent = try {
                                        fileChooserParams.createIntent()
                                    } catch (e: ActivityNotFoundException) {
                                        fileCallback = null
                                        return false
                                    }

                                    fileChooserLauncher.launch(intent)
                                    return true
                                }
                            }

                            settings.javaScriptEnabled = true
                            settings.allowFileAccess = true
                            settings.domStorageEnabled = true
                            addJavascriptInterface(
                                SerialPolyfill(applicationContext, this),
                                "serialPolyfill"
                            )

                            webView = this

                            if (savedInstanceState === null) {
                                loadUrl("https://appassets.androidplatform.net/index.html")
                            }
                        }
                    }, modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle, outPersistentState: PersistableBundle) {
        super.onSaveInstanceState(outState, outPersistentState)
        webView?.saveState(outState)
    }

    override fun onRestoreInstanceState(
        savedInstanceState: Bundle?,
        persistentState: PersistableBundle?
    ) {
        super.onRestoreInstanceState(savedInstanceState, persistentState)
        if (savedInstanceState != null) {
            webView?.restoreState(savedInstanceState)
        }
    }
}

class MyWebViewClient(private val assetLoader: WebViewAssetLoader): WebViewClientCompat() {
    @RequiresApi(21)
    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(request.url)
    }

    // To support API < 21.
    override fun shouldInterceptRequest(
        view: WebView,
        url: String
    ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(Uri.parse(url))
    }
}


class SerialPolyfill {
    var context: Context
    var webview: WebView
    var port: UsbSerialPort? = null
    constructor(context: Context, webview: WebView) {
        this.context = context
        this.webview = webview
    }

    @JavascriptInterface
    fun requestPort(): Boolean {
        val permissionIntent =
        PendingIntent.getBroadcast(
            context,
            0,
            Intent("com.dubster.hazelhope.micromonkey.USB_PERMISSION"),
            PendingIntent.FLAG_IMMUTABLE
        )

        // Find all available drivers from attached devices.
        val manager = context.getSystemService(USB_SERVICE) as UsbManager
        val availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager)
        if (availableDrivers.isEmpty()) {
            Toast.makeText(context, "So sad", Toast.LENGTH_SHORT).show()
            return false
        }


        // Open a connection to the first available driver.
        val driver = availableDrivers[0]
        val connection = manager.openDevice(driver.device)
        if (connection == null) {
            Toast.makeText(context, "No connection", Toast.LENGTH_SHORT).show()
            manager.requestPermission(driver.device, permissionIntent);
            return false
        }

        port = driver.ports[0] // Most devices have just one port (port 0)
        port?.open(connection)
        port?.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)

        val usbIoManager = SerialInputOutputManager(port, OutputManager(webview))
        usbIoManager.start()

        return true
    }

    @JavascriptInterface
    fun write(base64: String) {
        val bytes = Base64.decode(base64, Base64.DEFAULT)
        port?.write(bytes, 10000)
    }

    @JavascriptInterface
    @Deprecated("DO NOT USE. Blocks WebView thread")
    fun read(): String {
        val bytes: ByteArray = ByteArray(64)
        port?.read(bytes, 10000)
        val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
        return base64
    }

    @JavascriptInterface
    fun close() {
        port?.close()
    }

}

class OutputManager : SerialInputOutputManager.Listener {
    val webview: WebView
    constructor(webview: WebView) {
        this.webview = webview
    }

    override fun onNewData(data: ByteArray) {
        val base64 = Base64.encodeToString(data, Base64.NO_WRAP)
        webview.post { webview.evaluateJavascript("onSerialDataReceived(\"$base64\")", null) }
    }

    override fun onRunError(p0: Exception?) {
        p0?.printStackTrace()
    }
}



@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MicroMonkeyTheme {
        Greeting("Android")
    }
}