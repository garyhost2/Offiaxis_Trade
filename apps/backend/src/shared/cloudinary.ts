import { v2 as cloudinary } from 'cloudinary';
import { config } from '../core/config';

type UploadResourceType = 'image' | 'video' | 'raw' | 'auto';

export interface UploadedAsset {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
}

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(buffer: Buffer, folder: string): Promise<string> {
  const uploaded = await uploadAsset(buffer, folder, 'image');
  return uploaded.url;
}

export async function uploadAsset(
  buffer: Buffer,
  folder: string,
  resourceType: UploadResourceType = 'auto'
): Promise<UploadedAsset> {
  return new Promise<UploadedAsset>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || result === undefined) {
          reject(error ?? new Error('Upload failed: no result returned'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

