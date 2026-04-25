import fs from 'node:fs/promises';
import path from 'node:path';

let configDirectory: string;

export function init(dataDirectory: string): void {
  configDirectory = path.join(dataDirectory, 'config');
}

function filePath(type: string): string {
  return path.join(configDirectory, `${type}-folders.json`);
}

export async function getAll(type: string): Promise<string[]> {
  try {
    const json = await fs.readFile(filePath(type), 'utf-8');
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

async function save(type: string, folders: string[]): Promise<void> {
  await fs.writeFile(filePath(type), JSON.stringify(folders, null, 2));
}

export async function create(type: string, name: string): Promise<string[]> {
  const folders = await getAll(type);
  if (!folders.includes(name)) {
    folders.push(name);
    await save(type, folders);
  }
  return folders;
}

export async function remove(type: string, name: string): Promise<string[]> {
  const folders = (await getAll(type)).filter((f) => f !== name);
  await save(type, folders);
  return folders;
}

export async function rename(
  type: string,
  oldName: string,
  newName: string,
): Promise<string[]> {
  const folders = (await getAll(type)).map((f) =>
    f === oldName ? newName : f,
  );
  await save(type, folders);
  return folders;
}
