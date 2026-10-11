import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/api',
  test: {
    name: '@flowment/api',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    globalSetup: ['./tests/global-setup.ts'],
    env: {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'test',
      DB_PASSWORD: 'test',
      DB_SSL: 'false',
      ...loadEnv(mode, import.meta.dirname, 'DB_'),
      DB_NAME: 'flowment_test',
      AI_PROVIDER: 'mock',
    },
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
