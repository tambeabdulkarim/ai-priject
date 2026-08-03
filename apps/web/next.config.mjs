// Foundation-layer config: makes the shared, TypeScript-source workspace
// packages (packages/api-client, packages/types) importable and buildable
// from apps/web without a separate compile step per package — Next.js
// transpiles them itself. Extend this list only when a new shared package
// is actually imported from apps/web.
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@phoenix/api-client', '@phoenix/types'],
};

export default nextConfig;
