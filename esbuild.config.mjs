
import { build } from 'esbuild';
import { resolve } from 'path';

await build({
  entryPoints: ['client/src/main.tsx'],
  bundle: true,
  outfile: 'dist/public/main.js',
  format: 'esm',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file'
  },
  target: 'es2020',
  minify: true,
  alias: {
    '@': resolve('./client/src'),
    '@shared': resolve('./shared'),
    '@assets': resolve('./attached_assets')
  }
});
