import { supabaseAdmin } from '../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export class FileUploadService {
  static async uploadProfilePicture(file: any, staffId: string) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `profile_${staffId}_${uuidv4()}.${fileExtension}`;
      const filePath = `staff-profiles/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from('staff-files')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('staff-files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      throw new Error(`Failed to upload profile picture: ${error}`);
    }
  }
}