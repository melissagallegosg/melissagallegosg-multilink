// api/blog/[slug].js -> se sirve en /blog/:slug (ver rewrite en vercel.json)
const { getPostBySlug } = require('../../lib/medium');
const { renderShell, escapeHtml, formatDate } = require('../../lib/layout');

function getSlugFromRequest(req) {
  // En Vercel, el archivo [slug].js hace que Vercel rellene req.query.slug
  // automáticamente. En local (dev-server.js) lo rellenamos a mano antes
  // de llamar a este handler, así el mismo código sirve para ambos casos.
  if (req.query && req.query.slug) return decodeURIComponent(req.query.slug);

  const parts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

function render404() {
  return renderShell({
    title: 'Artículo no encontrado — melissagallegosg',
    bodyHtml: `
      <div class="error-state">
        <p>No encontramos ese artículo (puede que ya no esté entre los últimos publicados en Medium).</p>
        <div class="post-footer-nav"><a href="/blog">Ver todos los artículos</a></div>
      </div>
    `,
    activeIsBlog: true,
  });
}

async function handleBlogPost(req, res) {
  const slug = getSlugFromRequest(req);

  if (!slug) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(render404());
    return;
  }

  let post = null;
  let errorMessage = null;

  try {
    post = await getPostBySlug(slug);
  } catch (err) {
    console.error('[api/blog/[slug]] error obteniendo el feed:', err);
    errorMessage =
      'No se pudo cargar este artículo en este momento. Intenta de nuevo en unos minutos.';
  }

  if (errorMessage) {
    res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      renderShell({
        title: 'Error — melissagallegosg',
        bodyHtml: `<div class="error-state">${escapeHtml(errorMessage)}</div>`,
        activeIsBlog: true,
      })
    );
    return;
  }

  if (!post) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(render404());
    return;
  }

  const hero = post.cover
    ? `<div class="post-hero"><img src="${escapeHtml(post.cover)}" alt=""></div>`
    : '';

  const html = renderShell({
    title: `${post.title} — melissagallegosg`,
    description: post.excerpt,
    bodyHtml: `
      ${hero}
      <p class="post-meta">${escapeHtml(formatDate(post.pubDate))}</p>
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      <div class="post-content">${post.content}</div>
      <div class="post-footer-nav"><a href="/blog">← Ver todos los artículos</a></div>
    `,
    activeIsBlog: true,
  });

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  });
  res.end(html);
}

module.exports = handleBlogPost;
module.exports.default = handleBlogPost;
