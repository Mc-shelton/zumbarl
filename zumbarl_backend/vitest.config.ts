import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Integration suites share the local database and seed the same canonical
    // records. Running test files concurrently creates artificial deadlocks and
    // uniqueness failures that cannot occur in a single production request.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 120_000
  }
})
