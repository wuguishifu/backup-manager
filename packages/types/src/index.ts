/** Sent as the POST /backup request body. */
export interface BackupRequest {
  prefix: string;
}

/**
 * A backup job triggered via the adapter API.
 *
 * Adapters must return this shape from both POST /backup and GET /backup/:jobId.
 */
export interface BackupJob {
  jobId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}
