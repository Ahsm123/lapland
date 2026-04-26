import { describe, it, expect, beforeEach, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { ProcessResult } from '../src/shared/models';

const runMock = vi.fn<(script: string, timeoutMs?: number) => Promise<ProcessResult>>();

vi.mock('../src/main/services/process-runner', () => ({
  run: (script: string, timeoutMs?: number) => runMock(script, timeoutMs),
}));

import * as repo from '../src/main/services/cli-tool-repository';

async function freshTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lapland-cli-tools-'));
  await fs.mkdir(path.join(dir, 'cli-tools'), { recursive: true });
  return dir;
}

function ok(stdout: string): ProcessResult {
  return { exitCode: 0, stdout, stderr: '', durationMs: 1 };
}

beforeEach(async () => {
  runMock.mockReset();
  repo.clearVersionCache();
  const dir = await freshTempDir();
  repo.init(dir);
});

describe('cli-tool-repository version cache', () => {
  it('caches version result after first check', async () => {
    runMock.mockResolvedValue(ok('v1.0.0'));
    const tool = await repo.save({
      id: '',
      name: 'node',
      versionCommand: 'node --version',
      updateCommand: 'brew upgrade node',
    });

    await repo.checkVersion(tool.id);
    await repo.checkVersion(tool.id);

    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it('force re-runs the version command and updates the cache', async () => {
    runMock.mockResolvedValueOnce(ok('v1.0.0')).mockResolvedValueOnce(ok('v2.0.0'));
    const tool = await repo.save({
      id: '',
      name: 'node',
      versionCommand: 'node --version',
      updateCommand: '',
    });

    const first = await repo.checkVersion(tool.id);
    const second = await repo.checkVersion(tool.id, { force: true });

    expect(first?.stdout).toBe('v1.0.0');
    expect(second?.stdout).toBe('v2.0.0');
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it('update busts the cache so the next checkVersion re-runs', async () => {
    runMock
      .mockResolvedValueOnce(ok('v1.0.0'))
      .mockResolvedValueOnce(ok('updated'))
      .mockResolvedValueOnce(ok('v2.0.0'));
    const tool = await repo.save({
      id: '',
      name: 'node',
      versionCommand: 'node --version',
      updateCommand: 'brew upgrade node',
    });

    await repo.checkVersion(tool.id);
    await repo.update(tool.id);
    const after = await repo.checkVersion(tool.id);

    expect(after?.stdout).toBe('v2.0.0');
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it('remove drops the cache entry for that tool', async () => {
    runMock.mockResolvedValue(ok('v1.0.0'));
    const tool = await repo.save({
      id: '',
      name: 'node',
      versionCommand: 'node --version',
      updateCommand: '',
    });

    await repo.checkVersion(tool.id);
    expect(repo._getCacheForTesting().has(tool.id)).toBe(true);

    await repo.remove(tool.id);
    expect(repo._getCacheForTesting().has(tool.id)).toBe(false);
  });

  it('clearVersionCache empties the entire cache', async () => {
    runMock.mockResolvedValue(ok('v1.0.0'));
    const a = await repo.save({ id: '', name: 'a', versionCommand: 'a', updateCommand: '' });
    const b = await repo.save({ id: '', name: 'b', versionCommand: 'b', updateCommand: '' });

    await repo.checkVersion(a.id);
    await repo.checkVersion(b.id);
    expect(repo._getCacheForTesting().size).toBe(2);

    repo.clearVersionCache();
    expect(repo._getCacheForTesting().size).toBe(0);
  });

  it('passes the update timeout (300s) to the process runner', async () => {
    runMock.mockResolvedValue(ok(''));
    const tool = await repo.save({
      id: '',
      name: 'node',
      versionCommand: 'node --version',
      updateCommand: 'brew upgrade node',
    });

    await repo.update(tool.id);

    expect(runMock).toHaveBeenCalledWith('brew upgrade node', 300_000);
  });
});
