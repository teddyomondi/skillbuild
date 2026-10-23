import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApi } from './server/apiHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function apiMiddlewarePlugin() {
  const handler = async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      return handleApi(req, res, url.pathname);
    }
    next();
  };

  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

// Cross-Origin Isolation headers required for @webcontainer/api (SharedArrayBuffer)
export default defineConfig(({ mode }) => {
  // Ensure all .env variables (LLM_API_KEY, LLM_PROVIDER, etc.) are available to Node server middleware
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiMiddlewarePlugin()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    preview: {
      port: 5173,
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  };
});
