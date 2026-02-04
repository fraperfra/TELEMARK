import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://cokyqhfxvvmrtkmlgcjm.supabase.co';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/supabase': {
            target: supabaseUrl,
            changeOrigin: true,
            secure: true,
            ws: true,
            rewrite: (path) => path.replace(/^\/supabase/, ''),
          },
        },
      },
      plugins: [react(), tsconfigPaths()],
      build: {
        // Raise warning limit (modules still large should be split by manualChunks)
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (!id.includes('node_modules')) return undefined;

              // Attempt to extract package name (supports scoped packages)
              const match = id.match(/node_modules\/(?:@[^\/]+\/[^^\/]+|[^\/]+)/);
              if (match) {
                const pkg = match[0].replace('node_modules/', '').replace('/', '-');
                return `vendor.${pkg}`;
              }

              return 'vendor';
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
