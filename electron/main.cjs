const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 420,
    minHeight: 600,
    title: "KeepScribe - Creative Writer's Studio",
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    backgroundColor: '#202124',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load the built app index.html
  win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Distraction-free clean top bar for creative writing
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
