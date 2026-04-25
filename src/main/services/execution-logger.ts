import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { ExecutionLogEntry } from '../../shared/models';

let logsDirectory: string;

export function init(dataDirectory: string): void {
  logsDirectory = path.join(dataDirectory, 'logs');
}

function getLogFilePath(date: string): string {
  return path.join(logsDirectory, `${date}.jsonl`);
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function logExecution(
  entry: Omit<ExecutionLogEntry, 'timestamp' | 'user'>,
): Promise<void> {
  const fullEntry: ExecutionLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    user: os.userInfo().username,
  };

  const filePath = getLogFilePath(todayString());
  await fs.appendFile(filePath, JSON.stringify(fullEntry) + '\n');
}

export async function getEntriesByDate(
  date: string,
): Promise<ExecutionLogEntry[]> {
  const filePath = getLogFilePath(date);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as ExecutionLogEntry);
  } catch {
    return [];
  }
}
