import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Workflow } from '../../shared/models';

let workflowsDirectory: string;

export function init(dataDirectory: string): void {
  workflowsDirectory = path.join(dataDirectory, 'workflows');
}

export async function save(workflow: Workflow): Promise<Workflow> {
  const all = await getAll();
  const duplicate = all.find(
    (w) => w.name === workflow.name && w.id !== workflow.id,
  );
  if (duplicate) {
    throw new Error(`A workflow named "${workflow.name}" already exists.`);
  }

  if (workflow.steps.length === 0) {
    throw new Error('A workflow must have at least one step.');
  }

  if (!workflow.id) {
    workflow.id = randomUUID();
    workflow.version = 1;
  } else {
    const existing = await getById(workflow.id);
    if (existing) {
      workflow.version = existing.version + 1;
    }
  }

  const filePath = path.join(workflowsDirectory, `${workflow.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
  return workflow;
}

export async function getById(id: string): Promise<Workflow | null> {
  const filePath = path.join(workflowsDirectory, `${id}.json`);
  try {
    const json = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(json) as Workflow;
  } catch {
    return null;
  }
}

export async function getAll(): Promise<Workflow[]> {
  const files = await fs.readdir(workflowsDirectory);
  const workflows: Workflow[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const json = await fs.readFile(
      path.join(workflowsDirectory, file),
      'utf-8',
    );
    const workflow = JSON.parse(json) as Workflow;
    workflows.push(workflow);
  }

  return workflows;
}

export async function setFolder(id: string, folder: string): Promise<void> {
  const workflow = await getById(id);
  if (!workflow) return;
  workflow.folder = folder || undefined;
  const filePath = path.join(workflowsDirectory, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
}

export async function remove(id: string): Promise<void> {
  const filePath = path.join(workflowsDirectory, `${id}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, nothing to do
  }
}

export async function findByScriptId(scriptId: string): Promise<Workflow[]> {
  const all = await getAll();
  return all.filter((w) => w.steps.some((s) => s.scriptId === scriptId));
}
