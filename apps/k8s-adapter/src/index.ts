import Fastify from 'fastify';
import { KubeConfig, BatchV1Api } from '@kubernetes/client-node';
import type { BackupJob } from '@backup-manager/types';

const NAMESPACE = process.env.CRONJOB_NAMESPACE ?? 'databases';
const CRONJOB_NAME = process.env.CRONJOB_NAME ?? 'sensitive-db-backup-daily';
const PORT = Number(process.env.PORT ?? 3001);

// Use in-cluster config when running inside Kubernetes, local kubeconfig otherwise.
const kc = new KubeConfig();
if (process.env.KUBERNETES_SERVICE_HOST) {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}
const batch = kc.makeApiClient(BatchV1Api);

const app = Fastify({ logger: true });

/**
 * POST /backup
 *
 * Triggers a backup by instantiating a one-off Job from the CronJob's
 * jobTemplate. Returns 202 with the job ID immediately — the job runs
 * asynchronously. Poll GET /backup/:jobId for completion.
 */
app.post('/backup', async (_req, reply) => {
  const cj = await batch.readNamespacedCronJob({
    name: CRONJOB_NAME,
    namespace: NAMESPACE,
  });

  const jobTemplate = cj.spec?.jobTemplate;
  if (!jobTemplate) {
    return reply.status(500).send({ error: 'CronJob has no jobTemplate' });
  }

  const jobId = `manual-backup-${Date.now()}`;
  const startedAt = new Date().toISOString();

  await batch.createNamespacedJob({
    namespace: NAMESPACE,
    body: {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobId,
        namespace: NAMESPACE,
        labels: { 'triggered-by': 'backup-manager' },
      },
      spec: jobTemplate.spec,
    },
  });

  const body: BackupJob = { jobId, status: 'pending', startedAt };
  return reply.status(202).send(body);
});

/**
 * GET /backup/:jobId
 *
 * Returns the current status of a backup job.
 */
app.get<{ Params: { jobId: string } }>('/backup/:jobId', async (req, reply) => {
  const { jobId } = req.params;

  const job = await batch.readNamespacedJob({
    name: jobId,
    namespace: NAMESPACE,
  });

  const conditions = job.status?.conditions ?? [];
  const startedAt =
    job.status?.startTime?.toISOString() ?? new Date().toISOString();
  const completedAt = job.status?.completionTime?.toISOString();

  let status: BackupJob['status'] = 'pending';
  if (job.status?.active) {
    status = 'running';
  } else if (
    conditions.some((c) => c.type === 'Complete' && c.status === 'True')
  ) {
    status = 'succeeded';
  } else if (
    conditions.some((c) => c.type === 'Failed' && c.status === 'True')
  ) {
    status = 'failed';
  }

  const body: BackupJob = {
    jobId,
    status,
    startedAt,
    ...(completedAt ? { completedAt } : {}),
  };
  return reply.send(body);
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
