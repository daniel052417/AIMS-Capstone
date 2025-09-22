import { supabaseAdmin } from '../config/supabaseClient';

export interface AuditLogData {
  user_id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  changed_by: string;
  ip_address?: string;
  user_agent?: string;
}

export class UserAccountAuditService {
  static async logAction(data: AuditLogData): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_account_audit')
      .insert([{
        user_id: data.user_id,
        action: data.action,
        old_values: data.old_values,
        new_values: data.new_values,
        changed_by: data.changed_by,
        ip_address: data.ip_address,
        user_agent: data.user_agent
      }]);

    if (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async getAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('user_account_audit')
      .select(`
        *,
        changed_by_user:users!user_account_audit_changed_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  }
}