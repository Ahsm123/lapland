export interface ExecutionLogEntry {
  timestamp: string;
  user: string;
  scriptId: string;
  scriptName: string;
  resolvedScript: string;
  parameters: Record<string, string>;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  workflowRunId?: string;
  workflowName?: string;
  workflowVersion?: number;
}
