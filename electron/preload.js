const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    registerPortSelectionCallback: (callback) => {
        ipcRenderer.on("port_callback", (event, data) => {
            callback(data);
        })
    },
    portSelected: (portId) => {
        ipcRenderer.invoke("port_selected", portId);
    }
})