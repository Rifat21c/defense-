const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("assessNovaMonitor", {
  login: (payload) => ipcRenderer.invoke("monitor:login", payload),
  logout: () => ipcRenderer.invoke("monitor:logout"),
  sendTestEvent: (eventType) => ipcRenderer.invoke("monitor:manual-event", eventType),
  onStatus: (callback) => {
    ipcRenderer.on("monitor:status", (_event, status) => callback(status));
  },
});
