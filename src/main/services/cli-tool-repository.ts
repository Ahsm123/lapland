import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CliTool, ProcessResult } from '../../shared/models';
import * as processRunner from './process-runner';

const UPDATE_TIMEOUT_MS = 300_000;

let cliToolsDirectory: string;
const versionCache = new Map<string, ProcessResult>();

export function init(dataDirectory: string): void {
  cliToolsDirectory = path.join(dataDirectory, 'cli-tools');
}

export async function save(tool: CliTool): Promise<CliTool> {
  if (!tool.id) {
    tool.id = randomUUID();
  }
  await fs.mkdir(cliToolsDirectory, { recursive: true });
  const filePath = path.join(cliToolsDirectory, `${tool.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(tool, null, 2));
  return tool;
}

export async function getById(id: string): Promise<CliTool | null> {
  const filePath = path.join(cliToolsDirectory, `${id}.json`);
  try {
    const json = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(json) as CliTool;
  } catch {
    return null;
  }
}

export async function getAll(): Promise<CliTool[]> {
  try {
    const files = await fs.readdir(cliToolsDirectory);
    const tools: CliTool[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const json = await fs.readFile(path.join(cliToolsDirectory, file), 'utf-8');
      tools.push(JSON.parse(json) as CliTool);
    }
    return tools;
  } catch {
    return [];
  }
}

export async function remove(id: string): Promise<void> {
  versionCache.delete(id);
  const filePath = path.join(cliToolsDirectory, `${id}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, nothing to do
  }
}

export async function checkVersion(
  id: string,
  options: { force?: boolean } = {},
): Promise<ProcessResult | null> {
  if (!options.force) {
    const cached = versionCache.get(id);
    if (cached) return cached;
  }
  const tool = await getById(id);
  if (!tool) return null;
  const result = await processRunner.run(tool.versionCommand);
  versionCache.set(id, result);
  return result;
}

export async function update(id: string): Promise<ProcessResult | null> {
  const tool = await getById(id);
  if (!tool) return null;
  const result = await processRunner.run(tool.updateCommand, UPDATE_TIMEOUT_MS);
  versionCache.delete(id);
  return result;
}

export function clearVersionCache(): void {
  versionCache.clear();
}

export function _getCacheForTesting(): Map<string, ProcessResult> {
  return versionCache;
}
