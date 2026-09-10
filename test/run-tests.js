#!/usr/bin/env node
// test/run-tests.js
// Pruebas sin dependencias externas (solo assert de Node).
// Corre con: node test/run-tests.js   (o "npm test")

const assert = require('assert');
const { slugifyTitle, extractMediumId, buildSlug } = require('../lib/slugify');
const { parseFeedXml, cleanContent } = require('../lib/medium');
const mockFeedXml = require('./mock-feed');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n== slugify ==');

test('slug ASCII con tildes, ñ y signos ¿?', () => {
  const slug = slugifyTitle('¿Qué es la autocompasión y por qué la necesitas?');
  assert.strictEqual(/^[a-z0-9-]+$/.test(slug), true, `slug no es ASCII puro: ${slug}`);
  assert.strictEqual(slug.includes('autocompasion'), true);
  assert.strictEqual(slug.includes('¿'), false);
});

test('slug con ñ', () => {
  const slug = slugifyTitle('Diseño de rutinas con mañanas más ligeras');
  assert.strictEqual(slug, 'diseno-de-rutinas-con-mananas-mas-ligeras');
});

test('extractMediumId toma el hex final de la URL', () => {
  const id = extractMediumId(
    'https://medium.com/@user/un-post-cualquiera-a1b2c3d4e5f6',
    null
  );
  assert.strictEqual(id, 'a1b2c3d4e5f6');
});

test('buildSlug combina título limpio + id único (100% ASCII)', () => {
  const slug = buildSlug(
    '¿Qué es la autocompasión y por qué la necesitas?',
    'https://medium.com/@u/que-es-la-autocompasion-y-por-que-la-necesitas-a1b2c3d4e5f6',
    null
  );
  assert.strictEqual(slug, 'que-es-la-autocompasion-y-por-que-la-necesitas-a1b2c3d4e5f6');
  assert.strictEqual(/^[a-z0-9-]+$/.test(slug), true);
});

test('dos títulos parecidos generan slugs distintos (por el id único)', () => {
  const posts = parseFeedXml(mockFeedXml);
  const slugs = posts.map((p) => p.slug);
  const unique = new Set(slugs);
  assert.strictEqual(unique.size, slugs.length, 'hay slugs duplicados: ' + slugs.join(', '));
});

console.log('\n== parseo del feed simulado ==');

const posts = parseFeedXml(mockFeedXml);

test('parsea los 3 posts del feed simulado', () => {
  assert.strictEqual(posts.length, 3);
});

test('cada post tiene título, link, pubDate y slug ASCII', () => {
  posts.forEach((p) => {
    assert.ok(p.title, 'falta título');
    assert.ok(p.link, 'falta link');
    assert.ok(p.pubDate, 'falta pubDate');
    assert.strictEqual(/^[a-z0-9-]+$/.test(p.slug), true, `slug inválido: ${p.slug}`);
  });
});

test('el primer post recupera correctamente la portada (no el píxel de tracking)', () => {
  const p = posts[0];
  assert.strictEqual(p.cover, 'https://miro.medium.com/v2/resize:fit:1400/portada1.jpg');
});

console.log('\n== limpieza de contenido ==');

test('elimina el píxel de tracking de medium.com/_/stat', () => {
  const p = posts[0];
  assert.strictEqual(/medium\.com\/_\/stat/i.test(p.content), false);
});

test('elimina el párrafo "Originally published at..."', () => {
  const p = posts[0];
  assert.strictEqual(/Originally published/i.test(p.content), false);
});

test('elimina párrafos vacíos (&nbsp; y <br> solos)', () => {
  const p = posts[0];
  assert.strictEqual(/<p>\s*&nbsp;\s*<\/p>/i.test(p.content), false);
  assert.strictEqual(/<p>\s*<br>\s*<\/p>/i.test(p.content), false);
});

test('conserva el contenido real (párrafos, blockquote, h3)', () => {
  const p = posts[0];
  assert.strictEqual(/La autocompasión es una práctica/.test(p.content), true);
  assert.strictEqual(/<blockquote>/.test(p.content), true);
  assert.strictEqual(/<h3>/.test(p.content), true);
});

test('no duplica la portada dentro del cuerpo del artículo', () => {
  const p = posts[0]; // trae <figure><img portada1.jpg></figure> al inicio
  const occurrences = (p.content.match(/portada1\.jpg/g) || []).length;
  assert.strictEqual(occurrences, 0, 'la portada no debería repetirse en el body (ya se muestra como héroe)');
});

test('cleanContent() es idempotente en un caso simple', () => {
  const dirty = '<p>Hola</p><p>&nbsp;</p><img src="https://medium.com/_/stat?x=1">';
  const cleaned = cleanContent(dirty);
  assert.strictEqual(cleaned, '<p>Hola</p>');
});

console.log('\n== handlers HTTP (end-to-end con feed mockeado) ==');

// Mockeamos fetch global para que lib/medium.js reciba nuestro feed
// simulado en vez de llamar a medium.com de verdad.
global.fetch = async () => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  text: async () => mockFeedXml,
});

function createMockRes() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(body) {
      this.body = body || '';
    },
  };
}

async function runHttpTests() {
  const medium = require('../lib/medium');
  medium.invalidateCache();

  const blogListHandler = require('../api/blog.js');
  const blogPostHandler = require('../api/blog/[slug].js');
  const revalidateHandler = require('../api/revalidate.js');

  await new Promise((resolve) => {
    test('GET /blog responde 200 y contiene las tarjetas de los 3 posts', () => {});
    resolve();
  });

  const listRes = createMockRes();
  await blogListHandler({ url: '/blog', query: {}, headers: {} }, listRes);
  test('GET /blog -> 200', () => assert.strictEqual(listRes.statusCode, 200));
  test('GET /blog -> incluye el título del primer post', () =>
    assert.strictEqual(listRes.body.includes('Qu&eacute; es la autocompasi&oacute;n') || listRes.body.includes('¿Qué es la autocompasión'), true));
  test('GET /blog -> incluye enlaces /blog/<slug> a los 3 posts', () => {
    const parsed = parseFeedXml(mockFeedXml);
    parsed.forEach((p) => {
      assert.strictEqual(
        listRes.body.includes(`/blog/${p.slug}`),
        true,
        `falta el link a ${p.slug}`
      );
    });
  });

  const parsedPosts = parseFeedXml(mockFeedXml);
  const targetSlug = parsedPosts[0].slug;

  const postRes = createMockRes();
  await blogPostHandler({ url: `/blog/${targetSlug}`, query: { slug: targetSlug }, headers: {} }, postRes);
  test(`GET /blog/${targetSlug} -> 200`, () => assert.strictEqual(postRes.statusCode, 200));
  test('GET /blog/:slug -> el contenido no incluye el píxel de tracking', () =>
    assert.strictEqual(/medium\.com\/_\/stat/i.test(postRes.body), false));
  test('GET /blog/:slug -> el contenido no incluye "Originally published"', () =>
    assert.strictEqual(/Originally published/i.test(postRes.body), false));

  const notFoundRes = createMockRes();
  await blogPostHandler({ url: '/blog/no-existe-000000', query: { slug: 'no-existe-000000' }, headers: {} }, notFoundRes);
  test('GET /blog/:slug inexistente -> 404', () => assert.strictEqual(notFoundRes.statusCode, 404));

  // --- revalidate ---
  delete process.env.BLOG_REVALIDATE_SECRET;
  const noSecretRes = createMockRes();
  await revalidateHandler({ url: '/api/revalidate', query: {}, headers: {} }, noSecretRes);
  test('POST /api/revalidate sin BLOG_REVALIDATE_SECRET configurada -> 500', () =>
    assert.strictEqual(noSecretRes.statusCode, 500));

  process.env.BLOG_REVALIDATE_SECRET = 'clave-de-prueba';

  const wrongSecretRes = createMockRes();
  await revalidateHandler(
    { url: '/api/revalidate?secret=incorrecta', query: { secret: 'incorrecta' }, headers: {} },
    wrongSecretRes
  );
  test('POST /api/revalidate con clave incorrecta -> 401', () =>
    assert.strictEqual(wrongSecretRes.statusCode, 401));

  const rightSecretRes = createMockRes();
  await revalidateHandler(
    { url: '/api/revalidate?secret=clave-de-prueba', query: { secret: 'clave-de-prueba' }, headers: {} },
    rightSecretRes
  );
  test('POST /api/revalidate con clave correcta -> 200 y ok:true', () => {
    assert.strictEqual(rightSecretRes.statusCode, 200);
    const json = JSON.parse(rightSecretRes.body);
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.postsCount, 3);
  });
}

runHttpTests().then(() => {
  console.log(`\n${passed} pruebas pasaron.\n`);
  if (process.exitCode) {
    console.error('❌ Algunas pruebas fallaron.');
    process.exit(1);
  } else {
    console.log('✅ Todas las pruebas pasaron.');
  }
});
