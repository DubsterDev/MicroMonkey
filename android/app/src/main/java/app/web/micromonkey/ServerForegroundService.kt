package app.web.micromonkey

import android.app.ForegroundServiceStartNotAllowedException
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.ResultReceiver
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ServerForegroundService: Service() {
    private var receiver: ResultReceiver? = null

    private var port: UsbSerialPort? = null
    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "app.web.micromonkey.USB_PERMISSION") {
                if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                    requestPort()
                }
            } else if (intent?.action == UsbManager.ACTION_USB_DEVICE_ATTACHED) {
                requestPort()
            }
        }
    }

    val permissionFilter = IntentFilter("app.web.micromonkey.USB_PERMISSION")
    val attachedFilter = IntentFilter(UsbManager.ACTION_USB_DEVICE_ATTACHED)

    private fun startForeground() {
        try {
            createNotificationChannel(this)
            val notification = NotificationCompat.Builder(this, "BACKGROUND_WORK")
                // Create the notification to display while the service is running
                .setContentTitle(getString(R.string.app_name) + " is running")
                .setSmallIcon(R.drawable.monkeyfaceoutline)
                .build()
            ServiceCompat.startForeground(
                /* service = */ this,
                /* id = */ 100, // Cannot be 0
                /* notification = */ notification,
                /* foregroundServiceType = */
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                } else {
                    0
                },
            )
        } catch (e: Exception) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && e is ForegroundServiceStartNotAllowedException
            ) {
                // App not in a valid state to start foreground service
                // (e.g. started from bg)
            }
            // ...
        }
        CoroutineScope(Dispatchers.IO).launch {
            MyServer.start(assets) { data -> onWebSocketData(data) }
        }

        registerReceiver(usbReceiver, permissionFilter, RECEIVER_EXPORTED)
        registerReceiver(usbReceiver, attachedFilter, RECEIVER_EXPORTED)
        requestPort()
    }

    private fun onWebSocketData(data: ByteArray) {
        port?.write(data, 10000)
    }

    private fun createNotificationChannel(
        context: Context
    ) {
        val channel = NotificationChannel(
            "BACKGROUND_WORK",
            "App in use", NotificationManager.IMPORTANCE_MIN
        )
        channel.lockscreenVisibility = Notification.VISIBILITY_PRIVATE
        val service = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        service.createNotificationChannel(channel)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        receiver = intent?.getParcelableExtra("receiver", ResultReceiver::class.java)

        startForeground()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        CoroutineScope(Dispatchers.IO).launch {
            MyServer.stop()
        }
        super.onDestroy()
    }

    fun requestPort(): Boolean {
        val permissionIntent =
            PendingIntent.getBroadcast(
                this,
                0,
                Intent("app.web.micromonkey.USB_PERMISSION"),
                PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_ALLOW_UNSAFE_IMPLICIT_INTENT
            )

        // Find all available drivers from attached devices.
        val manager = getSystemService(USB_SERVICE) as UsbManager
        val availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager)
        if (availableDrivers.isEmpty()) {
            return false
        }


        // Open a connection to the first available driver.
        val driver = availableDrivers[0]
        val connection = manager.openDevice(driver.device)
        if (connection == null) {
            manager.requestPermission(driver.device, permissionIntent)
            return false
        }

        port = driver.ports[0] // Most devices have just one port (port 0)
        port?.open(connection)
        port?.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)

        val usbIoManager = SerialInputOutputManager(port, object : SerialInputOutputManager.Listener {
            override fun onNewData(byteArray: ByteArray?) {
                if (byteArray !== null) {
                    MyServer.broadcast(byteArray)
                }
            }

            override fun onRunError(p0: java.lang.Exception?) {
            }

        })
        usbIoManager.start()
        receiver?.send(1, Bundle())
        return true
    }
}