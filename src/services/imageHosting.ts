/**
 * Image hosting service using Cloudinary
 * Free tier: 25GB storage, 25GB bandwidth/month
 * No backend API needed - direct upload from browser
 */

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

import { CLOUDINARY_CONFIG } from '@/config/constants';
import { prepareImageFile, prepareImageFiles } from '@/utils/imageUtils';

// Get Cloudinary config
const getCloudinaryConfig = (): CloudinaryConfig => {
  return {
    cloudName: CLOUDINARY_CONFIG.cloudName,
    uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
  };
};

export const imageHosting = {
  /**
   * Upload a single image to Cloudinary
   */
  async uploadImage(file: File): Promise<string> {
    try {
      const processedFile = await prepareImageFile(file);
      const { cloudName, uploadPreset } = getCloudinaryConfig();

      console.log('Uploading to Cloudinary:', {
        cloudName,
        uploadPreset,
        fileName: processedFile.name,
        fileSize: processedFile.size,
      });

      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'properties'); // Explicitly set folder to match preset

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Cloudinary upload error response:', error);

        let errorMessage = error.error?.message || 'Failed to upload image';

        if (errorMessage.includes('Invalid upload preset') || errorMessage.includes('preset')) {
          errorMessage = `Upload preset '${uploadPreset}' is invalid or not found. Please check Cloudinary dashboard.`;
        } else if (errorMessage.includes('whitelisted') || errorMessage.includes('unsigned')) {
          errorMessage = `Upload configuration error. The preset must allow unsigned uploads.`;
        } else if (errorMessage.includes('Invalid image file')) {
          errorMessage = `Invalid image file. Please upload a valid image format (JPG, PNG, etc.)`;
        } else if (response.status === 401) {
          errorMessage = `Authentication failed. Upload preset may not be configured for unsigned uploads.`;
        } else if (response.status === 400) {
          errorMessage = `Bad request: ${errorMessage}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Cloudinary upload successful:', data.secure_url);
      return data.secure_url;
    } catch (error: any) {
      console.error('Image upload error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      throw new Error(error.message || 'Failed to upload image');
    }
  },

  /**
   * Upload multiple images
   */
  async uploadImages(files: File[]): Promise<string[]> {
    try {
      const processedFiles = await prepareImageFiles(files);
      const uploadPromises = processedFiles.map((file) => this.uploadImage(file));
      return await Promise.all(uploadPromises);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  /**
   * Delete an image from Cloudinary (optional - requires signed requests or backend)
   * Note: This requires additional setup with Cloudinary admin API
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // For now, we'll just log - actual deletion requires backend or signed requests
    console.warn('Image deletion not implemented. Images will remain in Cloudinary.');
    // In production, you might want to track image URLs in Firestore
    // and delete them via a Cloud Function or backend
  },
};
