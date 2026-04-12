import { NextRequest, NextResponse } from 'next/server';
import { getBucketById } from '@/lib/config';
import { getDownloadUrl } from '@/lib/s3';

type Ctx = { params: Promise<{ bucketId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { bucketId } = await params;
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

  const bucket = getBucketById(bucketId);
  if (!bucket)
    return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });

  try {
    const url = await getDownloadUrl(bucket, key);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
