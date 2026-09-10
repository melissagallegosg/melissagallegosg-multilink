#!/usr/bin/env node
// dev-server.js
// Servidor local mínimo, sin dependencias, que imita las rewrites de
// vercel.json para poder probar /blog y /blog/:slug en tu máquina antes
// de desplegar. En producción (Vercel) NO se usa este archivo: Vercel
// sirve los HTML estáticos y ejecuta las funciones en /api directamente.
//
// Uso:
//   node dev-server.js
//   (o "npm run dev")

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

loadEnvFile();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  });
}

function serveStatic(req, res, pathname) {
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  if (pathname === '/') filePath = path.join(ROOT, 'index.html');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  try {
    if (pathname === '/blog') {
      req.query = parsed.query;
      const handler = require('./api/blog.js');
      await handler(req, res);
      return;
    }

    if (pathname === '/api/revalidate') {
      req.query = parsed.query;
      const handler = require('./api/revalidate.js');
      await handler(req, res);
      return;
    }

    const blogPostMatch = pathname.match(/^\/blog\/([^/]+)$/);
    if (blogPostMatch) {
      req.query = { ...parsed.query, slug: blogPostMatch[1] };
      const handler = require('./api/blog/[slug].js');
      await handler(req, res);
      return;
    }

    serveStatic(req, res, pathname);
  } catch (err) {
    console.error('Error en dev-server:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n✦ Servidor local corriendo en http://localhost:${PORT}`);
  console.log(`  → http://localhost:${PORT}/          (sitio principal)`);
  console.log(`  → http://localhost:${PORT}/blog       (listado del blog)`);
  console.log(`  → http://localhost:${PORT}/admin-revalidate.html (refresco manual)\n`);
});
