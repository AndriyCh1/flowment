import { defineConfig } from '@hey-api/openapi-ts';

// openapi.json is written by `pnpm --filter @flowment/api openapi:generate`.
// `clean` wipes src/api on every run, so nothing hand-written may live there.
export default defineConfig({
  input: './openapi.json',
  output: {
    path: './src/api',
    postProcess: ['prettier'],
    clean: true,
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      // Calls return { data, error, request, response } instead of throwing.
      throwOnError: false,
      runtimeConfigPath: './src/api-runtime-config.ts',
    },
    {
      name: '@hey-api/sdk',
      // One exported function per operation, so unused ones are tree-shaken.
      operations: { strategy: 'flat' },
    },
  ],
});
