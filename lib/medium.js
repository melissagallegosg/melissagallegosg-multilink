// lib/medium.js
// Descarga, parsea, limpia y cachea el feed RSS público de Medium.
//
// Deliberadamente NO usamos librerías externas (xml2js, rss-parser,
// sanitize-html, etc.) para que el proyecto siga sin `node_modules` y sin
// paso de build, igual que el resto del sitio. El feed RSS de Medium tiene
// una estructura muy estable, así que un parser basado en regex es
// suficiente y queda documentado aquí si en el futuro se quiere reemplazar
// por una librería más robusta.

const { buildSlug } = require('./slugify');

const DEFAULT_TTL_MS = 12 * 60 * 1000; // 12 min: dentro del rango de 10-15 min pedido
const FETCH_TIMEOUT_MS = 10000;

function getFeedUrl() {
  return (
    process.env.MEDIUM_FEED_URL ||
    'https://medium.com/feed/@melissagallegosg'
  );
}

// --- Estado de caché en memoria (persiste mientras la función serverless
// siga "caliente"; ver README para las implicaciones de esto). ---
let cache = {
  fetchedAt: 0,
  posts: [],
};
let inflightFetch = null;

function invalidateCache() {
  cache.fetchedAt = 0;
}

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function extractAll(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g');
  const results = [];
  let m;
  while ((m = re.exec(xml))) {
    results.push(m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim());
  }
  return results;
}

/**
 * Quita del HTML del post:
 *  - el píxel de tracking de Medium (<img ... medium.com/_/stat ...>)
 *  - el párrafo final "Originally published at ... on Medium."
 *  - párrafos vacíos (solo espacios, &nbsp; o <br>)
 */
function cleanContent(html) {
  if (!html) return '';
  let out = html;

  // 1) píxel de tracking
  out = out.replace(
    /<img[^>]*src=["'][^"']*medium\.com\/_\/stat[^"']*["'][^>]*>/gi,
    ''
  );

  // 2) párrafo "Originally published at ... on ..."
  out = out.replace(
    /<p[^>]*>\s*(?:<[^>]+>\s*)*Originally published (?:at|on)[\s\S]*?<\/p>/gi,
    ''
  );

  // 3) párrafos vacíos
  out = out.replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');

  return out.trim();
}

/**
 * Busca la primera imagen "real" (no el píxel de tracking) para usar
 * como portada de la tarjeta / héroe del artículo.
 */
function extractCover(rawHtml) {
  if (!rawHtml) return null;
  const imgRe = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgRe.exec(rawHtml))) {
    if (!/medium\.com\/_\/stat/i.test(m[1])) return m[1];
  }
  return null;
}

/**
 * Si la portada (primera imagen "real" del post) aparece también como el
 * primer elemento del cuerpo del artículo (típico: Medium suele abrir el
 * post con un <figure> que contiene esa misma imagen), la quitamos del
 * cuerpo para no mostrarla duplicada (una vez como héroe arriba del
 * título, y otra dentro del contenido).
 */
function stripLeadingCoverFigure(html, coverUrl) {
  if (!html || !coverUrl) return html;
  const trimmed = html.trimStart();

  const figureMatch = trimmed.match(/^<figure[^>]*>[\s\S]*?<\/figure>/i);
  if (figureMatch && figureMatch[0].includes(coverUrl)) {
    return trimmed.slice(figureMatch[0].length).trimStart();
  }

  const imgMatch = trimmed.match(/^<img[^>]*>/i);
  if (imgMatch && imgMatch[0].includes(coverUrl)) {
    return trimmed.slice(imgMatch[0].length).trimStart();
  }

  return html;
}

function stripTags(html) {
  return decodeEntities((html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function makeExcerpt(cleanedHtml, maxLen = 160) {
  const text = stripTags(cleanedHtml);
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLen)}…`;
}

function parseItem(block) {
  const titleRaw = extractTag(block, 'title');
  const title = decodeEntities(titleRaw);
  const link = extractTag(block, 'link');
  const guid = extractTag(block, 'guid');
  const pubDate = extractTag(block, 'pubDate');
  const creator = decodeEntities(extractTag(block, 'dc:creator'));
  const rawContent = extractTag(block, 'content:encoded');
  const categories = extractAll(block, 'category').map(decodeEntities);

  const cover = extractCover(rawContent);
  const content = stripLeadingCoverFigure(cleanContent(rawContent), cover);
  const excerpt = makeExcerpt(content);
  const slug = buildSlug(title, link, guid);

  return {
    title,
    link,
    guid,
    pubDate,
    creator,
    categories,
    cover,
    content,
    excerpt,
    slug,
  };
}

function parseFeedXml(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    items.push(parseItem(m[1]));
  }
  return items;
}

async function fetchFeedXml(feedUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        // Medium bloquea algunos user-agents "de robot" sin esto.
        'User-Agent':
          'Mozilla/5.0 (compatible; SitioBlogBot/1.0; +https://vercel.com)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) {
      throw new Error(`Medium feed respondió ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAndParse() {
  const xml = await fetchFeedXml(getFeedUrl());
  return parseFeedXml(xml);
}

/**
 * Devuelve la lista de posts (más recientes primero, tal como los entrega
 * Medium: el RSS solo trae los últimos ~10).
 *
 * - Si el caché tiene menos de TTL_MS, lo devuelve sin llamar a Medium.
 * - Si hay una petición en curso, todas las llamadas concurrentes esperan
 *   esa misma promesa (evita golpear a Medium varias veces en paralelo).
 * - Si Medium falla y hay caché previo, sirve el caché "viejo" en vez de
 *   romper la página (mejor mostrar posts un poco desactualizados que un
 *   error 500).
 */
async function getPosts({ forceRefresh = false, ttlMs = DEFAULT_TTL_MS } = {}) {
  const now = Date.now();
  const isFresh = now - cache.fetchedAt < ttlMs;

  if (!forceRefresh && cache.posts.length && isFresh) {
    return cache.posts;
  }

  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = fetchAndParse()
    .then((posts) => {
      cache = { fetchedAt: Date.now(), posts };
      inflightFetch = null;
      return posts;
    })
    .catch((err) => {
      inflightFetch = null;
      if (cache.posts.length) {
        console.error('[medium] fallo al refrescar el feed, sirviendo caché anterior:', err.message);
        return cache.posts;
      }
      throw err;
    });

  return inflightFetch;
}

async function getPostBySlug(slug, opts = {}) {
  let posts = await getPosts(opts);
  let post = posts.find((p) => p.slug === slug);

  // Si no aparece, puede ser un post publicado hace segundos y el caché
  // todavía no lo tiene: forzamos un único refresh antes de dar 404.
  if (!post && !opts.forceRefresh) {
    posts = await getPosts({ ...opts, forceRefresh: true });
    post = posts.find((p) => p.slug === slug);
  }

  return post || null;
}

module.exports = {
  getFeedUrl,
  getPosts,
  getPostBySlug,
  invalidateCache,
  parseFeedXml, // exportado para tests
  cleanContent, // exportado para tests
  DEFAULT_TTL_MS,
};
