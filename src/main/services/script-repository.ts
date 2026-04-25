import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Script } from '../../shared/models';

let scriptsDirectory: string;

export function init(dataDirectory: string): void {
  scriptsDirectory = path.join(dataDirectory, 'scripts');
}

export async function save(script: Script): Promise<Script> {
  if (!script.id) {
    script.id = randomUUID();
  }
  const filePath = path.join(scriptsDirectory, `${script.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(script, null, 2));
  return script;
}

export async function getById(id: string): Promise<Script | null> {
  const filePath = path.join(scriptsDirectory, `${id}.json`);
  try {
    const json = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(json) as Script;
  } catch {
    return null;
  }
}

export async function getAll(): Promise<Script[]> {
  const files = await fs.readdir(scriptsDirectory);
  const scripts: Script[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const json = await fs.readFile(path.join(scriptsDirectory, file), 'utf-8');
    const script = JSON.parse(json) as Script;
    scripts.push(script);
  }

  return scripts;
}

export async function setFolder(id: string, folder: string): Promise<void> {
  const script = await getById(id);
  if (!script) return;
  script.folder = folder || undefined;
  const filePath = path.join(scriptsDirectory, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(script, null, 2));
}

export async function remove(id: string): Promise<void> {
  const filePath = path.join(scriptsDirectory, `${id}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, nothing to do
  }
}
