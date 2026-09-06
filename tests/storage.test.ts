import { describe, it, expect } from 'vitest';
import { getSignedUrl } from '../packages/storage/src/index';

describe('packages/storage - Storage Driver & URLs', () => {
  it('should immediately return direct http/https URLs without signing', async () => {
    const directUrl = 'https://blob.vercel-storage.com/playlists/my_playlist.m3u';
    const result = await getSignedUrl('my-bucket', directUrl, 'read');
    expect(result).toBe(directUrl);
  });

  it('should return relative path directly when BLOB_READ_WRITE_TOKEN is active', async () => {
    const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = 'mock_vercel_blob_token';

    try {
      const filePath = 'users/u123/uploads/playlist.m3u';
      const result = await getSignedUrl('my-bucket', filePath, 'write');
      expect(result).toBe(filePath);
    } finally {
      if (prevToken !== undefined) {
        process.env.BLOB_READ_WRITE_TOKEN = prevToken;
      } else {
        delete process.env.BLOB_READ_WRITE_TOKEN;
      }
    }
  });
});
