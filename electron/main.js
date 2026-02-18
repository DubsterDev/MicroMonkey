const { app, BrowserWindow, ipcMain } = require('electron')
const path = require("path");

let portCallback;

ipcMain.handle("port_selected", (event, port) => {
    portCallback(port);
})
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    if (!app.isPackaged) {
        win.loadURL('http://localhost:5173')
    } else {
        win.loadFile(path.resolve(
            __dirname,
            '..',
            'core',
            'dist',
            'index.html'
        ))
    }

    win.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
        // Add listeners to handle ports being added or removed before the callback for `select-serial-port`
        // is called.
        win.webContents.session.on('serial-port-added', (event, port) => {
            console.log('serial-port-added FIRED WITH', port)
            // Optionally update portList to add the new port
        })

        win.webContents.session.on('serial-port-removed', (event, port) => {
            console.log('serial-port-removed FIRED WITH', port)
            // Optionally update portList to remove the port
        })

        event.preventDefault()
        win.webContents.send("port_callback", portList);
        portCallback = callback;
    })

}

app.whenReady().then(() => {
    createWindow()
})