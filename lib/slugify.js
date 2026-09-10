// lib/slugify.js
// Genera slugs 100% ASCII y estables para los posts de Medium.
//
// Por qué no reutilizamos el slug que trae la URL de Medium tal cual:
// Medium normalmente sí genera slugs ASCII, pero no es 100% garantizado en
// todos los casos (títulos con emojis, ciertos caracteres especiales, o
// cambios futuros de Medium). Para no depender de eso, generamos nuestro
// propio slug a partir del título limpio + el id hexadecimal único que
// Medium añade al final de cada URL (evita colisiones entre títulos
// parecidos, ej. "¿Qué es X?" publicado dos veces).

const crypto = require('crypto');

/**
 * Convierte un título en un slug ASCII: minúsculas, sin tildes/eñes
 * decoradas, sin signos de puntuación, espacios -> guiones.
 */
function slugifyTitle(title) {
  if (!title) return 'post';

  const base = title
    .normalize('NFD') // separa letra + acento (á -> a + ´)
    .replace(/[\u0300-\u036f]/g, '') // elimina los acentos ya separados
    .replace(/ñ/gi, (m) => (m === 'Ñ' ? 'N' : 'n')) // por si NFD no la separa en algún runtime
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // quita ¿ ? ¡ ! , . " ' etc.
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'post';
}

/**
 * Extrae el id hexadecimal único que Medium pone al final de la URL
 * (los caracteres tras el último guion del último segmento de la ruta).
 * Ej: .../un-post-cualquiera-a1b2c3d4e5f6 -> "a1b2c3d4e5f6"
 *
 * Si no lo encuentra en el link ni en el guid, genera un id corto y
 * determinístico a partir de un hash del link/guid, para que el slug
 * siga siendo estable entre refrescos del feed.
 */
function extractMediumId(link, guid) {
  const candidates = [link, guid].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const withoutQuery = candidate.split('?')[0].replace(/\/+$/, '');
      const lastSegment = withoutQuery.split('/').pop() || '';
      const match = lastSegment.match(/-([0-9a-f]{6,})$/i);
      if (match) return match[1].toLowerCase();
    } catch (_) {
      // ignorar y probar el siguiente candidato
    }
  }

  const seed = candidates[0] || String(Math.random());
  return crypto.createHash('md5').update(seed).digest('hex').slice(0, 8);
}

/**
 * Construye el slug final: "{titulo-en-ascii}-{id-unico}"
 */
function buildSlug(title, link, guid) {
  const base = slugifyTitle(title);
  const id = extractMediumId(link, guid);
  return `${base}-${id}`;
}

module.exports = { slugifyTitle, extractMediumId, buildSlug };
