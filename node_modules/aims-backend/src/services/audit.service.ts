import { supabaseAdmin } from '../config/supabaseClient';

export interface AuditLog {
  id?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values?: any;
  new_values?: any;
  user_id: string;
  created_at?: string;
}

export class AuditService {
  /**
   * Log an action to the audit_logs table
   * @param log AuditLog object
   */
  static async logAction(log: AuditLog): Promise<void> {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert([{
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        old_values: log.old_values ? JSON.stringify(log.old_values) : null,
        new_values: log.new_values ? JSON.stringify(log.new_values) : null,
        user_id: log.user_id,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to log audit action:', error);
      throw new Error(`Failed to log audit action: ${error.message}`);
    }
  }
}
