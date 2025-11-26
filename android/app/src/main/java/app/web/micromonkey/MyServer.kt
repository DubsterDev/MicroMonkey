package app.web.micromonkey

import android.content.res.AssetManager
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.defaultForFileExtension
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.embeddedServer
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.Frame
import io.ktor.websocket.WebSocketSession
import io.ktor.websocket.readBytes
import io.ktor.websocket.send
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Collections

object MyServer {
    private const val PORT = 64276
    private val ioScope = CoroutineScope(Dispatchers.IO)
    var assetManager: AssetManager? = null
    var webSocketCallback: ((ByteArray) -> Unit)? = null

    val connections = Collections.synchronizedSet<WebSocketSession?>(LinkedHashSet())

    private val server by lazy {
        embeddedServer(CIO, PORT) {
            routing {
                install(WebSockets)


                webSocket("/serial") {
                    connections += this
                    try {
                        for (frame in incoming) {
                            if (frame is Frame.Binary) {
                                val receivedText = frame.readBytes()
                                webSocketCallback?.invoke(receivedText)
                            }
                        }
                    } catch (e: Exception) {
                        println("WebSocket closed: ${e.localizedMessage}")
                    } finally {
                        connections -= this
                    }
                }
                get("{path...}") {
                    val pathSegments = call.parameters.getAll("path") ?: emptyList()

                    val assetPath = if (pathSegments.isEmpty() || pathSegments.first().isEmpty()) {
                        "index.html"
                    } else {
                        pathSegments.joinToString("/")
                    }

                    try {
                        if (assetManager === null) {
                            call.respond(HttpStatusCode.InternalServerError, "Server not ready.")
                        } else {
                            assetManager!!.open(assetPath).use { stream ->
                                val bytes = stream.readBytes()
                                val ext = assetPath.substringAfterLast('.', "")
                                val contentType = ContentType.defaultForFileExtension(ext)

                                call.respondBytes(bytes, contentType)
                            }
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.NotFound, "Asset not found: $assetPath")
                    }
                }
            }
        }
    }

    fun broadcast(text: ByteArray) {
        ioScope.launch {
            connections.forEach { session ->
                session?.send(text)
            }
        }
    }

    fun start(assetManager: AssetManager, callback: ((ByteArray) -> Unit)?) {
        this.webSocketCallback = callback
        this.assetManager = assetManager
        ioScope.launch {
            try {
                server.start(wait = false)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun stop() {
        try {
            server.stop(1_000, 2_000)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}