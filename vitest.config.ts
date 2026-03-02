import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        globals: false,
        testTimeout: 15_000,
        hookTimeout: 10_000,
        // Each test file gets its own worker so rate-limit state doesn't leak
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: false,
            },
        },
    },
});

