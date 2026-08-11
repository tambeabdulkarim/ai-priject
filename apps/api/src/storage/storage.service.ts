// docs/09-PLATFORM-ARCHITECTURE.md §9 / docs/10-SECURITY-BIBLE.md §14:
// presigned-URL, direct-to-storage upload/download — the application
// server never buffers untrusted file content in memory, and never serves
// files from its own origin. S3-compatible client so any provider
// (S3, R2, MinIO, etc.) works via STORAGE_ENDPOINT.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../config/configuration';

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly configured: boolean;

  constructor(configService: ConfigService<AppConfig, true>) {
    const storageConfig = configService.get('storage', { infer: true });
    this.bucket = storageConfig.bucket;
    this.configured = Boolean(
      storageConfig.endpoint && storageConfig.bucket && storageConfig.accessKeyId,
    );
    this.client = new S3Client({
      endpoint: storageConfig.endpoint || undefined,
      forcePathStyle: true,
      region: storageConfig.region,
      credentials: {
        accessKeyId: storageConfig.accessKeyId || 'unconfigured',
        secretAccessKey: storageConfig.secretAccessKey || 'unconfigured',
      },
    });
    if (this.configured) {
      this.logger.log(
        `Storage configured: endpoint=${storageConfig.endpoint} bucket=${storageConfig.bucket} region=${storageConfig.region}`,
      );
    } else {
      // docs/known-issues.md "Object Storage Not Provisioned": STORAGE_*
      // credentials are blank — an infrastructure gap, not an
      // architectural one. The code path is real; it just has nothing to
      // talk to yet. Logged at startup (not just on first use) so this is
      // never a silent failure mode.
      this.logger.warn(
        'Storage is NOT configured (STORAGE_ENDPOINT/STORAGE_BUCKET/STORAGE_ACCESS_KEY_ID empty) — all storage operations will fail fast until this is resolved. See docs/phase13.6-storage-provisioning-report.md.',
      );
    }
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new Error(
        'Storage is not configured: STORAGE_ENDPOINT/STORAGE_BUCKET/STORAGE_ACCESS_KEY_ID are empty.',
      );
    }
  }

  async createPresignedUploadUrl(objectKey: string, contentType: string): Promise<string> {
    this.assertConfigured();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
  }

  async createPresignedDownloadUrl(objectKey: string): Promise<string> {
    this.assertConfigured();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  }

  /**
   * docs/10-SECURITY-BIBLE.md §14: "File type is validated by content
   * inspection (magic-byte sniffing), not by trusting the client-supplied
   * extension or MIME type." Reads only the first bytes via an HTTP Range
   * request — never buffers the full file.
   */
  async readObjectPrefix(objectKey: string, byteLength = 16): Promise<Buffer | null> {
    this.assertConfigured();
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Range: `bytes=0-${byteLength - 1}`,
      });
      const response = await this.client.send(command);
      const chunks: Buffer[] = [];
      const stream = response.Body as AsyncIterable<Buffer>;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to read object prefix for ${objectKey}`, error as Error);
      return null;
    }
  }
}
