// api/blog.js -> se sirve en /blog (ver rewrite en vercel.json)
const { getPosts } = require('../lib/medium');
const { renderShell, escapeHtml, formatDate } = require('../lib/layout');

function renderCard(post) {
  const cover = post.cover
    ? `<img class="post-card-cover" src="${escapeHtml(post.cover)}" alt="" loading="lazy">`
    : '';
  return `
  <a class="post-card" href="/blog/${encodeURIComponent(post.slug)}">
    ${cover}
    <div class="post-card-body">
      <span class="post-card-date">${escapeHtml(formatDate(post.pubDate))}</span>
      <h2 class="post-card-title">${escapeHtml(post.title)}</h2>
      <p class="post-card-excerpt">${escapeHtml(post.excerpt)}</p>
    </div>
  </a>`;
}

async function handleBlogList(req, res) {
  let posts = [];
  let errorMessage = null;

  try {
    posts = await getPosts();
  } catch (err) {
    console.error('[api/blog] error obteniendo el feed:', err);
    errorMessage =
      'No se pudo cargar el blog en este momento. Intenta de nuevo en unos minutos.';
  }

  const body = errorMessage
    ? `<div class="error-state">${escapeHtml(errorMessage)}</div>`
    : posts.length
    ? `<div class="post-grid">${posts.map(renderCard).join('')}</div>
       <p class="feed-note">Mostrando los últimos ${posts.length} artículos publicados en Medium.</p>`
    : `<div class="empty-state">Todavía no hay artículos publicados.</div>`;

  const html = renderShell({
    title: 'Blog — melissagallegosg',
    description: 'Artículos publicados en Medium, sincronizados automáticamente.',
    bodyHtml: `
      <h1 class="page-title">Blog</h1>
      <p class="page-subtitle">Artículos y reflexiones, directo desde mi Medium.</p>
      ${body}
    `,
    activeIsBlog: true,
  });

  res.writeHead(errorMessage ? 502 : 200, {
    'Content-Type': 'text/html; charset=utf-8',
    // Caché de navegador/CDN corta: el refresco "real" del contenido lo
    // controla el TTL en memoria de lib/medium.js (ver README).
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
  });
  res.end(html);
}

module.exports = handleBlogList;
// Export por defecto también, para compatibilidad con el runtime de Vercel
module.exports.default = handleBlogList;
