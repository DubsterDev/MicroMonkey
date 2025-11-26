package app.web.micromonkey

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ResultReceiver
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsIntent.SHARE_STATE_OFF
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.core.net.toUri
import app.web.micromonkey.ui.theme.MicroMonkeyTheme


class MainActivity : ComponentActivity() {
    private val receiver = object : ResultReceiver(Handler(Looper.getMainLooper())) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
            if (resultCode == 1) {
                val intent = CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .setShareState(SHARE_STATE_OFF)
                intent.build().launchUrl(this@MainActivity, "http://localhost:64276".toUri())
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val intent = Intent(this, ServerForegroundService::class.java)
        intent.putExtra("receiver", receiver)
        if (Build.VERSION.SDK_INT >= 26) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        Toast.makeText(this, "Hello!", Toast.LENGTH_SHORT).show()
        enableEdgeToEdge()
        setContent {
            MicroMonkeyTheme {
                Scaffold(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight()
                ) { innerPadding ->
                    Column(
                        modifier = Modifier.padding(innerPadding)
                            .fillMaxWidth()
                            .fillMaxHeight(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Connect a board with USB to start Native Serial proxy")
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        stopService(Intent(this, ServerForegroundService::class.java))
        super.onDestroy()
    }
}