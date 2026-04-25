export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: 'created' | 'updated' | 'deleted';
  entityType: 'script' | 'workflow';
  entityId: string;
  entityName: string;
  version?: number;
}
