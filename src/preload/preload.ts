import { contextBridge, ipcRenderer } from 'electron';
import type {
  Script,
  AppSettings,
  ProcessResult,
  ExecutionLogEntry,
  Workflow,
  AuditLogEntry,
  CliTool,
} from '../shared/models';

const api = {
  settings: {
    get: (): Promise<AppSettings | null> => ipcRenderer.invoke('settings:get'),
    save: (settings: AppSettings): Promise<void> =>
      ipcRenderer.invoke('settings:save', settings),
    pickDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke('settings:pickDirectory'),
    ensureDataDirectory: (dir: string): Promise<void> =>
      ipcRenderer.invoke('settings:ensureDataDirectory', dir),
  },
  scripts: {
    getAll: (): Promise<Script[]> => ipcRenderer.invoke('scripts:getAll'),
    getById: (id: string): Promise<Script | null> =>
      ipcRenderer.invoke('scripts:getById', id),
    save: (script: Script): Promise<Script> =>
      ipcRenderer.invoke('scripts:save', script),
    delete: (id: string): Promise<void> =>
      ipcRenderer.invoke('scripts:delete', id),
    referencingWorkflows: (scriptId: string): Promise<Workflow[]> =>
      ipcRenderer.invoke('scripts:referencingWorkflows', scriptId),
    run: (resolvedScript: string): Promise<ProcessResult> =>
      ipcRenderer.invoke('scripts:run', resolvedScript),
    setFolder: (id: string, folder: string): Promise<void> =>
      ipcRenderer.invoke('scripts:setFolder', id, folder),
  },
  workflows: {
    getAll: (): Promise<Workflow[]> => ipcRenderer.invoke('workflows:getAll'),
    getById: (id: string): Promise<Workflow | null> =>
      ipcRenderer.invoke('workflows:getById', id),
    save: (workflow: Workflow): Promise<Workflow> =>
      ipcRenderer.invoke('workflows:save', workflow),
    delete: (id: string): Promise<void> =>
      ipcRenderer.invoke('workflows:delete', id),
    setFolder: (id: string, folder: string): Promise<void> =>
      ipcRenderer.invoke('workflows:setFolder', id, folder),
  },
  log: {
    write: (
      entry: Omit<ExecutionLogEntry, 'timestamp' | 'user'>,
    ): Promise<void> => ipcRenderer.invoke('log:write', entry),
    getByDate: (date: string): Promise<ExecutionLogEntry[]> =>
      ipcRenderer.invoke('log:getByDate', date),
  },
  folders: {
    getAll: (type: string): Promise<string[]> =>
      ipcRenderer.invoke('folders:getAll', type),
    create: (type: string, name: string): Promise<string[]> =>
      ipcRenderer.invoke('folders:create', type, name),
    remove: (type: string, name: string): Promise<string[]> =>
      ipcRenderer.invoke('folders:remove', type, name),
    rename: (type: string, oldName: string, newName: string): Promise<string[]> =>
      ipcRenderer.invoke('folders:rename', type, oldName, newName),
  },
  audit: {
    getByDate: (date: string): Promise<AuditLogEntry[]> =>
      ipcRenderer.invoke('audit:getByDate', date),
  },
  cliTools: {
    getAll: (): Promise<CliTool[]> => ipcRenderer.invoke('cliTools:getAll'),
    save: (tool: CliTool): Promise<CliTool> =>
      ipcRenderer.invoke('cliTools:save', tool),
    remove: (id: string): Promise<void> =>
      ipcRenderer.invoke('cliTools:remove', id),
    checkVersion: (id: string, force = false): Promise<ProcessResult | null> =>
      ipcRenderer.invoke('cliTools:checkVersion', id, force),
    update: (id: string): Promise<ProcessResult | null> =>
      ipcRenderer.invoke('cliTools:update', id),
    clearCache: (): Promise<void> => ipcRenderer.invoke('cliTools:clearCache'),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type LaplandApi = typeof api;
