import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './server/apiHandler.js';

const root = path.dirname(fileURLToPath(import.meta.url));

async function loadEnvFile() {
  try {
    const content = await readFile(path.join(root, '.env'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || Object.hasOwn(process.env, match[1])) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  } catch {
    // Hosted deployments provide environment variables directly.
  }
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

async function serveBuiltApp(request, response, pathname) {
  const distRoot = path.resolve(root, 'dist');
  let filePath = pathname === '/'
    ? path.join(distRoot, 'index.html')
    : path.resolve(distRoot, `.${decodeURIComponent(pathname)}`);
  if (filePath !== path.join(distRoot, 'index.html') && !filePath.startsWith(`${distRoot}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if (!(await stat(filePath)).isFile()) filePath = path.join(distRoot, 'index.html');
  } catch {
    filePath = path.join(distRoot, 'index.html');
  }
  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(file);
  } catch {
    response.writeHead(404).end('Build output not found. Run npm run build first.');
  }
}

async function main() {
  await loadEnvFile();
  const apiOnly = process.argv.includes('--api-only');
  const port = Number(process.env.PORT || (apiOnly ? 3001 : 5173));

  const app = createHttpServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname.startsWith('/api/')) return handleApi(request, response, pathname);
    if (apiOnly) {
      response.writeHead(404).end('Not found');
      return;
    }
    await serveBuiltApp(request, response, pathname);
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`App ${apiOnly ? 'AI API' : 'server'} listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error('Could not start the app server:', error.message);
  process.exitCode = 1;
});
