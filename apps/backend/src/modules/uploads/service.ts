import { config } from '../../core/config';
import { uploadAsset } from '../../shared/cloudinary';
import { ValidationError } from '../../shared/errors';
import { UploadAssetInput, UploadAssetResponse } from './schema';

function decodeBase64(input: string): Buffer {
  const base64 = input.includes(',') ? input.split(',').pop() : input;
  if (!base64) {
    throw new ValidationError('Upload payload is empty');
  }
  return Buffer.from(base64, 'base64');
}

function sanitizeFolderPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function uploadAssetService(
  orgId: string,
  input: UploadAssetInput
): Promise<UploadAssetResponse> {
  const buffer = decodeBase64(input.fileBase64);
  if (buffer.length > config.MAX_UPLOAD_BYTES) {
    throw new ValidationError(`Upload exceeds ${config.MAX_UPLOAD_BYTES} bytes`);
  }

  const folder = `offiaxis/${sanitizeFolderPart(orgId)}/${input.folder}`;
  return uploadAsset(buffer, folder);
}