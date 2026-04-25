import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { registerIpcHandlers } from './ipc/handlers';
import * as settingsService from './services/settings-service';
import * as scriptRepository from './services/script-repository';
import * as workflowRepository from './services/workflow-repository';
import * as executionLogger from './services/execution-logger';
import * as auditLogger from './services/audit-logger';
import * as folderRepository from './services/folder-repository';

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.webContents.openDevTools({ mode: 'detach' });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

app.on('ready', async () => {
  registerIpcHandlers();

  // Initialize script repository if settings already exist
  const settings = await settingsService.getSettings();
  if (settings) {
    scriptRepository.init(settings.dataDirectory);
    workflowRepository.init(settings.dataDirectory);
    executionLogger.init(settings.dataDirectory);
    auditLogger.init(settings.dataDirectory);
    folderRepository.init(settings.dataDirectory);
  }

  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
