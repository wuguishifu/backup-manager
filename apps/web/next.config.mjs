import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Explicitly set the monorepo root so Turbopack doesn't try to infer it
    // from pnpm-workspace.yaml and end up with the wrong project directory.
    root: resolve(__dirname, '../..'),
  },
};

export default nextConfig;
