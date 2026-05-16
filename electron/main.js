const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');

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

const menuTemplate = [
    { role: 'fileMenu' },
    {
        label: 'View',
        submenu: [
            { role: 'reload', },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
            { type: 'separator' },
            { role: 'toggleDevTools', label: "Debug" },
        ]
    },
    { role: 'windowMenu' },
    {
        role: 'help',
        submenu: [
            {
                label: "Documentation",
                submenu: [
                    {
                        label: 'Quick start',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/quickstart')
                        }
                    },
                    {
                        label: 'File Management',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/file-management')
                        }
                    },
                    {
                        label: 'Using Intellisense',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/intellisense')
                        }
                    },
                    {
                        label: 'Using the Serial Monitor',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/serial-monitor')
                        }
                    },
                    {
                        label: 'Using Git',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/git')
                        }
                    },
                    {
                        label: 'About the Command Palette',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/command-palette')
                        }
                    },
                    {
                        label: 'Flashing MicroPython',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/flash-micropython')
                        }
                    },
                    {
                        label: 'Troubleshooting',
                        click: async () => {
                            await shell.openExternal('https://micromonkey.web.app/docs/troubleshooting')
                        }
                    },
                ]
            },
            {
                label: "Third-party Licenses",
                click: async () => {
                    createThirdPartyLicensesWindow();
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

let win;
let thirdPartyLicensesWindow;
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

const createThirdPartyLicensesWindow = () => {
    if (thirdPartyLicensesWindow && !thirdPartyLicensesWindow.isDestroyed() && thirdPartyLicensesWindow.isFocusable()) {
      return thirdPartyLicensesWindow.focus();  
    }
    
    thirdPartyLicensesWindow = new BrowserWindow({
        width: 500,
        height: 600
    })

    thirdPartyLicensesWindow.loadFile(path.resolve(
        __dirname,
        'third_party_licenses.html'
    ))


    thirdPartyLicensesWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        
        return { action: 'deny' };
    });

}

app.whenReady().then(() => {
    createWindow()
})