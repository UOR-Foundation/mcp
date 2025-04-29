import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'mcp-uor-server',
      fileName: (format) => `mcp-uor-server.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        '@octokit/rest',
        'express',
        'cors',
        'dotenv',
        'express-oauth2-jwt-bearer',
        'ipfs-http-client',
        'json-schema',
        'jsonschema',
        'ajv',
        'ajv-formats',
      ],
      output: {
        globals: {
          '@octokit/rest': 'Octokit',
          express: 'express',
          cors: 'cors',
          dotenv: 'dotenv',
          'express-oauth2-jwt-bearer': 'expressOAuth2JwtBearer',
          'ipfs-http-client': 'ipfsHttpClient',
          'json-schema': 'jsonSchema',
          jsonschema: 'jsonschema',
          ajv: 'Ajv',
          'ajv-formats': 'ajvFormats',
        },
      },
    },
    minify: true,
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__mocks__/**'],
      rollupTypes: true,
      copyDtsFiles: true,
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
