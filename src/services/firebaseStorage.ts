import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';
import { imageHosting } from './imageHosting';
import { CLOUDINARY_CONFIG } from '@/config/constants';
const requireCloudinaryConfig = (): void => {
  if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
    throw new Error('Cloudinary image hosting is not configured. Set a Cloudinary cloud name and unsigned upload preset.');
  }
};

export const firebaseStorage = {
  // Image uploads use Cloudinary; Firebase Storage is reserved for documents.
  async uploadFile(file: File, _path: string): Promise<string> {
    requireCloudinaryConfig();
    return imageHosting.uploadImage(file);
  },

  // Batch image uploads go directly to Cloudinary with no Firebase fallback.
  async uploadFiles(files: File[], _basePath: string): Promise<string[]> {
    requireCloudinaryConfig();
    return imageHosting.uploadImages(files);
  },

  async uploadDocument(file: File, path: string): Promise<string> {
    if (!auth.currentUser) {
      throw new Error('You must be logged in to upload files');
    }

    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading document:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'storage/unauthorized'
      ) {
        throw new Error('You do not have permission to upload files. Please check Firebase Storage rules.');
      }
      throw error;
    }
  },

  // Delete a file from Firebase Storage
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Get download URL from path
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  },
};
