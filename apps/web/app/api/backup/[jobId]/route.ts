import { NextRequest, NextResponse } from 'next/server';
import type { BackupJob } from '@backup-manager/types';

const ADAPTER_URL = process.env.BACKUP_ADAPTER_URL;

type Ctx = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!ADAPTER_URL) {
    return NextResponse.json(
      { error: 'Backup adapter not configured (BACKUP_ADAPTER_URL is unset)' },
      { status: 503 }
    );
  }

  const { jobId } = await params;

  try {
    const res = await fetch(`${ADAPTER_URL}/backup/${jobId}`);
    const data = (await res.json()) as BackupJob;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
