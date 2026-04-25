export interface WorkflowStep {
  scriptId: string;
  scriptName: string;
}

export interface Workflow {
  id: string;
  name: string;
  version: number;
  steps: WorkflowStep[];
  folder?: string;
}
