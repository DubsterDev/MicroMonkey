package app.web.micromonkey

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.ContentValues
import android.content.Context
import android.content.Context.USB_SERVICE
import android.content.Intent
import android.hardware.usb.UsbManager
import android.net.Uri
import android.os.Bundle
import android.os.PersistableBundle
import android.provider.MediaStore
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
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import app.web.micromonkey.ui.theme.MicroMonkeyTheme
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import java.io.BufferedOutputStream
import java.io.IOException


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
                                    } catch (_: ActivityNotFoundException) {
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

                            addJavascriptInterface(
                                FileBridge(applicationContext),
                                "androidFileBridge"
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
    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(request.url)
    }
}

class FileBridge {
    var context: Context
    constructor(context: Context) {
        this.context = context
    }

    @JavascriptInterface
    fun downloadFile(fileName: String, mimeType: String, base64: String) {
        try {
            val decodedBase64 = Base64.decode(base64, Base64.DEFAULT)

            val resolver = context.contentResolver

            val contentValues = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                put(MediaStore.Downloads.MIME_TYPE, mimeType)  // e.g. "application/pdf"
                put(MediaStore.Downloads.IS_PENDING, 1)
            }

            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                ?: throw IOException("Failed to create file")

            resolver.openOutputStream(uri)?.use { outputStream ->
                BufferedOutputStream(outputStream).use { bos ->
                    bos.write(decodedBase64)
                }
            } ?: throw IOException("Failed to open output stream")

            contentValues.clear()
            contentValues.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, contentValues, null, null)
            Toast.makeText(context, "File saved to Downloads folder", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(context, "Sorry, the file was not successfully saved.", Toast.LENGTH_SHORT).show()
            e.printStackTrace()
        }
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
                Intent("app.web.micromonkey.USB_PERMISSION"),
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
            manager.requestPermission(driver.device, permissionIntent)
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
        val bytes = ByteArray(64)
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