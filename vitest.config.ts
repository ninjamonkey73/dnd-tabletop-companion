import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'], // run only *.test.ts (none for now)
    exclude: ['src/**/*.spec.ts'], // skip existing Angular specs temporarily
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html'],
    },
  },
});
