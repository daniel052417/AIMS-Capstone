import { supabaseAdmin } from '../config/supabaseClient';
import { BulkOperationResult } from '../types/crud';

export class BulkOperationsService {
  static async bulkCreate<T>(
    tableName: string, 
    items: Partial<T>[], 
    validateItem?: (item: Partial<T>) => { isValid: boolean; errors: string[] }
  ): Promise<BulkOperationResult> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < items.length; i++) {
      try {
        // Validate item if validator provided
        if (validateItem) {
          const validation = validateItem(items[i]);
          if (!validation.isValid) {
            results.failed++;
            results.errors.push({
              index: i,
              error: validation.errors.join(', ')
            });
            continue;
          }
        }

        const { error } = await supabaseAdmin
          .from(tableName)
          .insert(items[i]);

        if (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk operation completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    };
  }

  static async bulkUpdate<T>(
    tableName: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<BulkOperationResult> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < updates.length; i++) {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .update(updates[i].data)
          .eq('id', updates[i].id);

        if (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk update completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    };
  }

  static async bulkDelete(tableName: string, ids: string[]): Promise<BulkOperationResult> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>
    };

    for (let i = 0; i < ids.length; i++) {
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .eq('id', ids[i]);

        if (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk delete completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    };
  }
}