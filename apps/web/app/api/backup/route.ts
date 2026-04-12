import { NextRequest, NextResponse } from 'next/server';
import type { BackupJob, BackupRequest } from '@backup-manager/types';

const ADAPTER_URL = process.env.BACKUP_ADAPTER_URL;

export async function POST(req: NextRequest) {
  if (!ADAPTER_URL) {
    return NextResponse.json(
      { error: 'Backup adapter not configured (BACKUP_ADAPTER_URL is unset)' },
      { status: 503 }
    );
  }

  const body = (await req.json()) as BackupRequest;

  try {
    const res = await fetch(`${ADAPTER_URL}/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as BackupJob;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
