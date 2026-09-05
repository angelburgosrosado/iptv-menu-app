import { put, del } from '@vercel/blob';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('vercel-blob-storage');

/**
 * Uploads a buffer or string to Vercel Blob storage
 */
export async function uploadToBlob(
  pathname: string,
  content: Buffer | string,
  contentType = 'application/octet-stream'
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const blob = await put(pathname, content, {
      access: 'public',
      contentType,
      token,
    });
    logger.info(`Uploaded file to Vercel Blob`, { url: blob.url, pathname });
    return blob.url;
  } catch (err) {
    logger.error(`Failed to upload to Vercel Blob at ${pathname}`, err);
    throw err;
  }
}

/**
 * Deletes a file from Vercel Blob storage by its URL
 */
export async function deleteFromBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    await del(url, { token });
    logger.info(`Deleted file from Vercel Blob`, { url });
  } catch (err) {
    logger.error(`Failed to delete from Vercel Blob at ${url}`, err);
    throw err;
  }
}

/**
 * Downloads a file buffer from Vercel Blob by URL
 */
export async function downloadFromBlob(url: string): Promise<Buffer> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching blob from ${url}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    logger.error(`Failed to download blob from ${url}`, err);
    throw err;
  }
}
