const { app, BrowserWindow, ipcMain, shell } = require('electron')

const path = require("path");

let portCallback;

ipcMain.handle("port_selected", (event, port) => {
    portCallback(port);
});

ipcMain.handle("minimize", () => {
    win.minimize();
});

ipcMain.handle("fullscreen", () => {
    if (win.isMaximized()) {
        win.restore();
    } else {
        win.maximize();
    }
})

ipcMain.handle("close", () => {
    win.close();
})

let win;
const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false
        }
    })

    if (!app.isPackaged) {
        win.loadURL('http://localhost:5173')
    } else {
        win.loadFile(path.resolve(
            __dirname,
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

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url.startsWith("file://") ? url.replace("file://", "https://micromonkey.web.app") : url);
        
        return { action: 'deny' };
    });

}

app.whenReady().then(() => {
    createWindow()
})