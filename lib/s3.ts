import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { BucketEntry } from './config';

function resolveClientConfig(bucket: BucketEntry): {
  endpoint?: string;
  region: string;
} {
  if (!bucket.s3ApiUrl) {
    return { region: bucket.region ?? 'us-east-1' };
  }
  // Detect S3 virtual-hosted bucket URLs (bucket-name.s3.region.amazonaws.com)
  // and discard them — use region only, not a bucket-specific endpoint
  const s3Match = bucket.s3ApiUrl.match(
    /https?:\/\/[^.]+\.s3\.([a-z0-9-]+)\.amazonaws\.com/
  );
  if (s3Match) {
    return { region: bucket.region ?? s3Match[1] };
  }
  // Everything else (R2, MinIO, etc.) — use as service endpoint
  return {
    endpoint: bucket.s3ApiUrl,
    region: bucket.region ?? 'auto',
  };
}

export function createS3Client(bucket: BucketEntry): S3Client {
  const accessKeyId = process.env[bucket.accessKeyIdName];
  const secretAccessKey = process.env[bucket.secretAccessKeyName];
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      `Missing credentials for "${bucket.name}": env vars ${bucket.accessKeyIdName} and/or ${bucket.secretAccessKeyName} are not set`
    );
  }
  const { endpoint, region } = resolveClientConfig(bucket);
  return new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

export async function listObjects(bucket: BucketEntry): Promise<S3Object[]> {
  const client = createS3Client(bucket);
  const objects: S3Object[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket.bucketName,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined && obj.LastModified) {
        objects.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified.toISOString(),
        });
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return objects.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}

export async function deleteObject(
  bucket: BucketEntry,
  key: string
): Promise<void> {
  const client = createS3Client(bucket);
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket.bucketName, Key: key })
  );
}

export async function getDownloadUrl(
  bucket: BucketEntry,
  key: string
): Promise<string> {
  const client = createS3Client(bucket);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket.bucketName, Key: key }),
    { expiresIn: 3600 }
  );
}
