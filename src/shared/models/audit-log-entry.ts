export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: 'created' | 'updated' | 'deleted';
  entityType: 'script' | 'workflow' | 'cli-tool';
  entityId: string;
  entityName: string;
  version?: number;
}
