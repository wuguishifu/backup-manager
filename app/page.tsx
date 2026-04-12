import { BucketSection } from '@/components/bucket-section';
import { Header } from '@/components/header';
import { getPublicBuckets } from '@/lib/config';

export default function Page() {
  let buckets;
  try {
    buckets = getPublicBuckets();
  } catch {
    return (
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="font-heading text-sm font-semibold">
              No configuration found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a <code className="font-mono">config.yaml</code> to the
              project root (or set the{' '}
              <code className="font-mono">CONFIG_PATH</code> environment
              variable). See{' '}
              <code className="font-mono">config.example.yaml</code> for the
              expected format.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-6">
        {buckets.map((bucket) => (
          <BucketSection key={bucket.id} bucket={bucket} />
        ))}
      </main>
    </div>
  );
}
