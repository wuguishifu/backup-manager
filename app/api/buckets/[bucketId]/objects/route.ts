import { NextRequest, NextResponse } from "next/server";
import { getBucketById, findMatchingRule } from "@/lib/config";
import { listObjects, deleteObject } from "@/lib/s3";
import { computeTtlStatus } from "@/lib/ttl";
import type { EnrichedObject } from "@/lib/types";

type Ctx = { params: Promise<{ bucketId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { bucketId } = await params;
  const bucket = getBucketById(bucketId);
  if (!bucket) return NextResponse.json({ error: "Bucket not found" }, { status: 404 });

  try {
    const raw = await listObjects(bucket);
    const rules = bucket.config?.lifecycleRules;

    const objects: EnrichedObject[] = raw.map((obj) => {
      const rule = findMatchingRule(obj.key, rules);
      const { status, expiresAt } = computeTtlStatus(
        obj.lastModified,
        rule?.ttl,
        rule?.retentionPolicy,
      );
      return {
        key: obj.key,
        size: obj.size,
        lastModified: obj.lastModified,
        rulePrefix: rule?.prefix ?? null,
        ttl: rule?.ttl ?? null,
        retentionPolicy: rule?.retentionPolicy ?? null,
        ttlStatus: status,
        expiresAt,
      };
    });

    return NextResponse.json({ objects });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { bucketId } = await params;
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const bucket = getBucketById(bucketId);
  if (!bucket) return NextResponse.json({ error: "Bucket not found" }, { status: 404 });

  try {
    await deleteObject(bucket, key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
