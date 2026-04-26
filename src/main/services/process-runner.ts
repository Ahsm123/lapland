import { spawn } from 'node:child_process';
import type { ProcessResult } from '../../shared/models';

const DEFAULT_TIMEOUT_MS = 30_000;

export async function run(
  script: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ProcessResult> {
  const start = performance.now();

  return new Promise((resolve) => {
    const child = spawn('/bin/zsh', ['-c', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code, signal) => {
      const durationMs = Math.round(performance.now() - start);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr: signal === 'SIGTERM'
          ? stderr + '\n[Process timed out after ' + timeoutMs / 1000 + 's]'
          : stderr,
        durationMs,
      });
    });

    child.on('error', (err) => {
      const durationMs = Math.round(performance.now() - start);
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        durationMs,
      });
    });
  });
}
