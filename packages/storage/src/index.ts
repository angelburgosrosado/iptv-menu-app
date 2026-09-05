import { Storage } from '@google-cloud/storage';
import { config } from '@iptv-menu/config';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('gcs-storage');
let gcsStorageInstance: Storage | null = null;

export function getStorageClient(): Storage {
  if (gcsStorageInstance) return gcsStorageInstance;

  // Lazy-initialize client with automatic credentials lookup
  try {
    if (config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY) {
      gcsStorageInstance = new Storage({
        projectId: config.FIREBASE_PROJECT_ID,
        credentials: {
          client_email: config.FIREBASE_CLIENT_EMAIL,
          private_key: config.FIREBASE_PRIVATE_KEY,
        },
      });
    } else {
      // Automatic IAM authentication on Cloud Run / GCP environments
      gcsStorageInstance = new Storage({
        projectId: config.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    logger.warn('Failed to initialize real GCS client, fallback mock will be used in local dev.', { error });
    gcsStorageInstance = new Storage(); // Fallback
  }

  return gcsStorageInstance;
}

import { uploadToBlob, deleteFromBlob, downloadFromBlob } from './blob';

export * from './blob';

/**
 * Generates a Signed URL allowing direct client uploads/downloads to/from storage
 */
export async function getSignedUrl(
  bucketName: string,
  filePath: string,
  action: 'read' | 'write' = 'read',
  expiresInMinutes = 15
): Promise<string> {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // In Vercel Blob public mode, files are directly referenced by their URL
    return filePath;
  }

  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action,
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      contentType: action === 'write' ? 'application/octet-stream' : undefined,
    });

    logger.info(`Generated ${action} signed URL for file`, { bucketName, filePath });
    return url;
  } catch (error) {
    logger.error(`Error generating signed URL for ${filePath}`, error);
    throw error;
  }
}

/**
 * High-performance file streamer/uploader from buffer to bucket or Vercel Blob
 */
export async function uploadToBucket(
  bucketName: string,
  filePath: string,
  content: Buffer | string,
  contentType = 'application/octet-stream'
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return uploadToBlob(filePath, content, contentType);
  }

  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.save(content, {
      metadata: { contentType },
      resumable: false,
    });

    const publicUrl = `gs://${bucketName}/${filePath}`;
    logger.info(`Successfully uploaded file to GCS`, { publicUrl });
    return publicUrl;
  } catch (error) {
    logger.error(`Failed to upload to bucket ${bucketName} at ${filePath}`, error);
    throw error;
  }
}

export async function deleteFromBucket(bucketName: string, filePath: string): Promise<void> {
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || process.env.BLOB_READ_WRITE_TOKEN) {
    return deleteFromBlob(filePath);
  }

  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    await file.delete();
    logger.info(`Successfully deleted file from GCS`, { bucketName, filePath });
  } catch (error) {
    logger.error(`Failed to delete from bucket ${bucketName} at ${filePath}`, error);
    throw error;
  }
}

export async function downloadFromBucket(bucketName: string, filePath: string): Promise<Buffer> {
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || process.env.BLOB_READ_WRITE_TOKEN) {
    return downloadFromBlob(filePath);
  }

  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    const [buffer] = await file.download();
    logger.info(`Successfully downloaded file from GCS`, { bucketName, filePath });
    return buffer;
  } catch (error) {
    logger.error(`Failed to download from bucket ${bucketName} at ${filePath}`, error);
    throw error;
  }
}

