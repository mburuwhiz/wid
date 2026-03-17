const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  showOpenDialog: (options) => ipcRenderer.invoke('dialog-open', options),
  showOpenDirDialog: (options) => ipcRenderer.invoke('dialog-open-dir', options),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog-save', options),

  readDirectory: (dirPath) => ipcRenderer.invoke('fs-readdir', dirPath),
  parseExcel: (filePath) => ipcRenderer.invoke('parse-excel', filePath),
  exportFailedExcel: (params) => ipcRenderer.invoke('export-failed-excel', params),
  generatePdf: (params) => ipcRenderer.invoke('generate-pdf', params),
  saveWzip: (params) => ipcRenderer.invoke('save-wzid', params),
  loadWzip: (filePath) => ipcRenderer.invoke('load-wzid', filePath),
  checkAutosave: () => ipcRenderer.invoke('check-autosave'),
  getAutosavePath: () => ipcRenderer.invoke('get-autosave-path'),
  discardAutosave: (path) => ipcRenderer.invoke('discard-autosave', path),
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts')
});
