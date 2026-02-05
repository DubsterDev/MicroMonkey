const { app, BrowserWindow } = require('electron')
const path = require("path");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
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

}

app.whenReady().then(() => {
    createWindow()
})