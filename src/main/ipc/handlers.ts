import { ipcMain, dialog, BrowserWindow, app, shell } from 'electron';
import path from 'node:path';
import * as settingsService from '../services/settings-service';
import * as scriptRepository from '../services/script-repository';
import * as workflowRepository from '../services/workflow-repository';
import * as processRunner from '../services/process-runner';
import * as executionLogger from '../services/execution-logger';
import * as auditLogger from '../services/audit-logger';
import * as folderRepository from '../services/folder-repository';
import * as cliToolRepository from '../services/cli-tool-repository';
import type { Script, Workflow, AuditLogEntry, CliTool } from '../../shared/models';

export function registerIpcHandlers(): void {
  ipcMain.handle('settings:get', () => settingsService.getSettings());
  ipcMain.handle('settings:save', async (_, settings) => {
    await settingsService.saveSettings(settings);
    scriptRepository.init(settings.dataDirectory);
    workflowRepository.init(settings.dataDirectory);
    executionLogger.init(settings.dataDirectory);
    auditLogger.init(settings.dataDirectory);
    folderRepository.init(settings.dataDirectory);
    cliToolRepository.init(settings.dataDirectory);
  });

  ipcMain.handle('settings:pickDirectory', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: 'Choose a folder to store Lapland data',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('settings:ensureDataDirectory', (_, dataDirectory: string) =>
    settingsService.ensureDataDirectoryExists(dataDirectory),
  );

  ipcMain.handle('app:getInfo', () => ({
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    platform: process.platform,
    arch: process.arch,
    settingsPath: path.join(app.getPath('appData'), 'Lapland', 'settings.json'),
  }));

  ipcMain.handle('shell:revealPath', async (_, target: string) => {
    shell.showItemInFolder(target);
  });
  ipcMain.handle('shell:openPath', async (_, target: string) => {
    return shell.openPath(target);
  });

  ipcMain.handle('scripts:getAll', () => scriptRepository.getAll());
  ipcMain.handle('scripts:getById', (_, id: string) =>
    scriptRepository.getById(id),
  );
  ipcMain.handle('scripts:save', async (_, script: Script) => {
    const isNew = !script.id;
    const saved = await scriptRepository.save(script);
    await auditLogger.log({
      action: isNew ? 'created' : 'updated',
      entityType: 'script',
      entityId: saved.id,
      entityName: saved.name,
    });
    return saved;
  });
  ipcMain.handle('scripts:delete', async (_, id: string) => {
    const script = await scriptRepository.getById(id);
    await scriptRepository.remove(id);
    if (script) {
      await auditLogger.log({
        action: 'deleted',
        entityType: 'script',
        entityId: id,
        entityName: script.name,
      });
    }
  });
  ipcMain.handle('scripts:referencingWorkflows', (_, scriptId: string) =>
    workflowRepository.findByScriptId(scriptId),
  );

  ipcMain.handle('scripts:run', (_, resolvedScript: string) =>
    processRunner.run(resolvedScript),
  );

  ipcMain.handle('workflows:getAll', () => workflowRepository.getAll());
  ipcMain.handle('workflows:getById', (_, id: string) =>
    workflowRepository.getById(id),
  );
  ipcMain.handle('workflows:save', async (_, workflow: Workflow) => {
    const isNew = !workflow.id;
    const saved = await workflowRepository.save(workflow);
    await auditLogger.log({
      action: isNew ? 'created' : 'updated',
      entityType: 'workflow',
      entityId: saved.id,
      entityName: saved.name,
      version: saved.version,
    });
    return saved;
  });
  ipcMain.handle('workflows:delete', async (_, id: string) => {
    const workflow = await workflowRepository.getById(id);
    await workflowRepository.remove(id);
    if (workflow) {
      await auditLogger.log({
        action: 'deleted',
        entityType: 'workflow',
        entityId: id,
        entityName: workflow.name,
        version: workflow.version,
      });
    }
  });

  ipcMain.handle(
    'log:write',
    (_, entry) => executionLogger.logExecution(entry),
  );
  ipcMain.handle('log:getByDate', (_, date: string) =>
    executionLogger.getEntriesByDate(date),
  );
  ipcMain.handle('audit:getByDate', (_, date: string) =>
    auditLogger.getEntriesByDate(date),
  );

  ipcMain.handle('scripts:setFolder', (_, id: string, folder: string) =>
    scriptRepository.setFolder(id, folder),
  );
  ipcMain.handle('workflows:setFolder', (_, id: string, folder: string) =>
    workflowRepository.setFolder(id, folder),
  );

  ipcMain.handle('folders:getAll', (_, type: string) =>
    folderRepository.getAll(type),
  );
  ipcMain.handle('folders:create', (_, type: string, name: string) =>
    folderRepository.create(type, name),
  );
  ipcMain.handle('folders:remove', (_, type: string, name: string) =>
    folderRepository.remove(type, name),
  );
  ipcMain.handle(
    'folders:rename',
    (_, type: string, oldName: string, newName: string) =>
      folderRepository.rename(type, oldName, newName),
  );

  ipcMain.handle('cliTools:getAll', () => cliToolRepository.getAll());
  ipcMain.handle('cliTools:save', async (_, tool: CliTool) => {
    const isNew = !tool.id;
    const saved = await cliToolRepository.save(tool);
    await auditLogger.log({
      action: isNew ? 'created' : 'updated',
      entityType: 'cli-tool',
      entityId: saved.id,
      entityName: saved.name,
    });
    return saved;
  });
  ipcMain.handle('cliTools:remove', async (_, id: string) => {
    const tool = await cliToolRepository.getById(id);
    await cliToolRepository.remove(id);
    if (tool) {
      await auditLogger.log({
        action: 'deleted',
        entityType: 'cli-tool',
        entityId: id,
        entityName: tool.name,
      });
    }
  });
  ipcMain.handle(
    'cliTools:checkVersion',
    (_, id: string, force = false) =>
      cliToolRepository.checkVersion(id, { force }),
  );
  ipcMain.handle('cliTools:update', async (_, id: string) => {
    const tool = await cliToolRepository.getById(id);
    const result = await cliToolRepository.update(id);
    if (tool && result) {
      await executionLogger.logExecution({
        scriptId: tool.id,
        scriptName: tool.name,
        resolvedScript: tool.updateCommand,
        parameters: {},
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
      });
    }
    return result;
  });
  ipcMain.handle('cliTools:clearCache', () => cliToolRepository.clearVersionCache());
}
