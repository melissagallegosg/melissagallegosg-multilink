// api/revalidate.js -> POST/GET /api/revalidate?secret=TU_CLAVE
//
// Endpoint protegido para forzar el refresco inmediato del feed justo
// después de publicar algo nuevo en Medium, en vez de esperar los 10-15
// minutos del refresco automático.
//
// Uso:
//   curl "https://tu-dominio.com/api/revalidate?secret=TU_CLAVE"
// o abriendo /admin-revalidate.html (ver ese archivo) e ingresando la clave.

const { invalidateCache, getPosts } = require('../lib/medium');

function getSecretFromRequest(req) {
  if (req.query && req.query.secret) return req.query.secret;

  const url = new URL(req.url, 'http://localhost');
  const fromQuery = url.searchParams.get('secret');
  if (fromQuery) return fromQuery;

  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return null;
}

async function handleRevalidate(req, res) {
  const expected = process.env.BLOG_REVALIDATE_SECRET;

  if (!expected) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        ok: false,
        error:
          'BLOG_REVALIDATE_SECRET no está configurada en las variables de entorno.',
      })
    );
    return;
  }

  const provided = getSecretFromRequest(req);

  if (!provided || provided !== expected) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Clave inválida o ausente.' }));
    return;
  }

  invalidateCache();

  try {
    const posts = await getPosts({ forceRefresh: true });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        ok: true,
        message: 'Feed refrescado.',
        postsCount: posts.length,
        revalidatedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('[api/revalidate] error refrescando el feed:', err);
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        ok: false,
        error: 'No se pudo contactar a Medium. El caché quedó invalidado; se reintentará en la próxima visita.',
      })
    );
  }
}

module.exports = handleRevalidate;
module.exports.default = handleRevalidate;
