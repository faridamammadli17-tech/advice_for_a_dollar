import { defineConfig } from 'vitest/config';

/**
 * Test configuration.
 *
 * `node:sqlite` is new enough that it is not in `module.builtinModules`, so
 * Vite's resolver strips the `node:` prefix and then fails to find a package
 * called "sqlite". Externalising every `node:` specifier tells Vite to leave
 * them to the runtime, which is where they belong anyway.
 */
export default defineConfig({
  test: {
    environment: 'node',
    server: {
      deps: {
        external: [/^node:/],
      },
    },
  },
  ssr: {
    external: ['node:sqlite'],
  },
});
