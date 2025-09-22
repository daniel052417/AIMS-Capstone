import { supabaseAdmin } from '../config/supabaseClient';

export interface PermissionAuditData {
  user_id: string;
  permission_id: string;
  action: 'granted' | 'revoked' | 'updated';
  old_value?: boolean;
  new_value?: boolean;
  changed_by: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
}

export class PermissionAuditService {
  static async logPermissionChange(data: PermissionAuditData): Promise<void> {
    const { error } = await supabaseAdmin
      .from('permission_audit')
      .insert([{
        user_id: data.user_id,
        permission_id: data.permission_id,
        action: data.action,
        old_value: data.old_value,
        new_value: data.new_value,
        changed_by: data.changed_by,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        notes: data.notes
      }]);

    if (error) {
      console.error('Failed to log permission change:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async getPermissionAuditLogs(
    userId: string, 
    limit: number = 50
  ): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('permission_audit')
      .select(`
        *,
        permission:permissions!permission_audit_permission_id_fkey(
          permission_name,
          module,
          category
        ),
        changed_by_user:users!permission_audit_changed_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch permission audit logs: ${error.message}`);
    }

    return data || [];
  }
}