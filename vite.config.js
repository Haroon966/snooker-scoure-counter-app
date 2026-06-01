import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const base = '/snooker-scoure-counter-app/';
const baseNoSlash = base.replace(/\/$/, '');

function isSpaRoute(url) {
  const path = (url ?? '').split('?')[0];
  if (!path.startsWith(baseNoSlash)) return false;
  if (path === baseNoSlash || path === base || path === `${base}index.html`) return false;
  if (path.includes('/assets/') || path.includes('/src/') || path.includes('@')) return false;
  return !/\.[a-z0-9]+$/i.test(path.replace(/\/$/, '').split('/').pop() ?? '');
}

/** Redirect base path; SPA fallback for deep links in dev/preview. */
function redirectBasePathPlugin() {
  const spaFallback = (req, _res, next) => {
    if (req.method !== 'GET' || !isSpaRoute(req.url)) return next();
    req.url = `${base}index.html`;
    next();
  };

  return {
    name: 'redirect-base-path',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === baseNoSlash) {
          res.writeHead(301, { Location: base });
          res.end();
          return;
        }
        if (req.url === '/favicon.ico') {
          res.writeHead(302, { Location: `${base}logo.jpg` });
          res.end();
          return;
        }
        next();
      });
      server.middlewares.use(spaFallback);
    },
    configurePreviewServer(server) {
      server.middlewares.use(spaFallback);
    },
  };
}

/** Inject precache URLs and cache version into dist/sw.js after build. */
function injectPrecachePlugin() {
  return {
    name: 'inject-precache',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const indexPath = join(distDir, 'index.html');
      const swTemplatePath = resolve(__dirname, 'public/sw.js');
      const swOutPath = join(distDir, 'sw.js');

      if (!existsSync(indexPath) || !existsSync(swTemplatePath)) return;

      const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));
      const indexHtml = readFileSync(indexPath, 'utf8');
      const urls = new Set([
        base,
        `${base}index.html`,
        `${base}manifest.json`,
        `${base}logo.jpg`,
        `${base}404.html`,
      ]);

      for (const match of indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        const href = match[1];
        if (href.startsWith('http') || href.startsWith('//')) continue;
        const path = href.startsWith('/') ? href : `${base}${href.replace(/^\.\//, '')}`;
        urls.add(path);
      }

      const assetsDir = join(distDir, 'assets');
      if (existsSync(assetsDir)) {
        for (const file of readdirSync(assetsDir)) {
          urls.add(`${base}assets/${file}`);
        }
      }

      let buildHash = 'dev';
      const jsMatch = indexHtml.match(/assets\/(index-[^."']+\.js)/);
      if (jsMatch) buildHash = jsMatch[1].replace(/^index-/, '').replace(/\.js$/, '');

      const cacheVersion = `${pkg.version}-${buildHash}`;
      let sw = readFileSync(swTemplatePath, 'utf8');
      sw = sw.replace('__CACHE_VERSION__', cacheVersion);
      sw = sw.replace('__PRECACHE_URLS__', JSON.stringify([...urls].sort()));
      writeFileSync(swOutPath, sw);
    },
  };
}

export default defineConfig({
  plugins: [react(), redirectBasePathPlugin(), injectPrecachePlugin()],
  base,
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
  },
});
