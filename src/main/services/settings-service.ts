import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppSettings } from '../../shared/models';

const SETTINGS_DIR = path.join(app.getPath('appData'), 'Lapland');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const json = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(json) as AppSettings;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function ensureDataDirectoryExists(
  dataDirectory: string,
): Promise<void> {
  await fs.mkdir(path.join(dataDirectory, 'scripts'), { recursive: true });
  await fs.mkdir(path.join(dataDirectory, 'workflows'), { recursive: true });
  await fs.mkdir(path.join(dataDirectory, 'logs'), { recursive: true });
  await fs.mkdir(path.join(dataDirectory, 'config'), { recursive: true });
}
