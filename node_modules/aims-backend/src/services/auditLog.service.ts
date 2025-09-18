// backend/src/services/auditLog.service.ts
export interface AuditLogEntry {
    userId: string;
    action: string;
    details?: string;
    timestamp?: Date;
  }
  
  export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
    console.log(`[AUDIT] ${entry.userId} ${entry.action} ${entry.details ?? ''}`);
    // here you can insert into DB etc.
  }
  // backend/src/services/auditLog.service.ts
export class AuditLogService {
    async log(userId: string, action: string, details?: string) {
      console.log(`[AUDIT] ${userId} ${action} ${details ?? ''}`);
      // write to DB here…
    }
  }
  