// lib/layout.js
// Header/footer/paleta compartidos para /blog y /blog/:slug, tomados
// directamente de index.html y resumen.html para que se vean como una
// sección más del sitio, no como un módulo pegado.

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(pubDate) {
  try {
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (_) {
    return '';
  }
}

const SHARED_STYLES = `
  :root {
    --void: #050505;
    --deep: #1A0B3D;
    --violet: #5B1EFF;
    --magenta: #D946EF;
    --cyan: #00E5FF;
    --gold: #F6C453;
    --lavender: #B69CFF;
    --white: #ffffff;
    --silver: #c9c3e0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    min-height: 100vh;
    background: var(--void);
    font-family: 'Poppins', sans-serif;
    color: var(--white);
  }
  a { color: inherit; }
  .aura-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(91,30,255,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 80% 80%, rgba(217,70,239,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 20% 60%, rgba(0,229,255,0.08) 0%, transparent 60%);
  }
  .container { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; padding: 28px 20px 90px; }

  .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 6px 0 34px; }
  .top-nav a { color: var(--cyan); text-decoration: none; font-size: 0.85em; letter-spacing: 1px; opacity: 0.85; font-family: 'DM Mono', monospace; }
  .top-nav a:hover { opacity: 1; }

  h1.page-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.6em, 6vw, 2.3em);
    text-align: center;
    letter-spacing: 3px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--lavender) 0%, var(--cyan) 50%, var(--violet) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  p.page-subtitle {
    text-align: center;
    color: var(--silver);
    font-size: 0.92em;
    margin-bottom: 40px;
    font-family: 'Poppins', sans-serif;
    font-weight: 300;
  }

  /* === TARJETAS DEL LISTADO === */
  .post-grid { display: flex; flex-direction: column; gap: 22px; }
  .post-card {
    display: block;
    text-decoration: none;
    border: 1px solid rgba(182,156,255,0.18);
    border-radius: 18px;
    overflow: hidden;
    background: rgba(91,30,255,0.05);
    transition: all 0.3s ease;
  }
  .post-card:hover {
    border-color: rgba(0,229,255,0.45);
    box-shadow: 0 0 30px rgba(0,229,255,0.15);
    transform: translateY(-2px);
  }
  .post-card-cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; background: var(--deep); }
  .post-card-body { padding: 18px 20px 22px; }
  .post-card-date {
    font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(0,229,255,0.65); margin-bottom: 8px; display: block;
  }
  .post-card-title {
    font-family: 'Cinzel', serif; font-weight: 600; font-size: 1.15em;
    color: var(--white); margin-bottom: 10px; line-height: 1.35;
  }
  .post-card-excerpt { color: var(--silver); font-size: 0.92em; line-height: 1.55; font-weight: 300; }

  .empty-state, .error-state {
    text-align: center; color: var(--silver); padding: 60px 20px;
    font-family: 'Poppins', sans-serif; font-weight: 300; line-height: 1.6;
  }
  .error-state { color: var(--lavender); }

  .feed-note {
    text-align: center; margin-top: 36px; font-family: 'DM Mono', monospace;
    font-size: 10.5px; letter-spacing: 0.05em; color: rgba(182,156,255,0.45);
  }

  /* === ARTÍCULO === */
  .post-hero { width: 100%; border-radius: 18px; overflow: hidden; margin-bottom: 28px; border: 1px solid rgba(182,156,255,0.18); }
  .post-hero img { width: 100%; display: block; }
  .post-meta {
    font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(0,229,255,0.65); text-align: center; margin-bottom: 14px;
  }
  h1.post-title {
    font-family: 'Cinzel', serif; font-weight: 600; letter-spacing: 1px;
    font-size: clamp(1.5em, 6vw, 2.1em); text-align: center; line-height: 1.3; margin-bottom: 34px;
    background: linear-gradient(135deg, var(--lavender) 0%, var(--cyan) 50%, var(--violet) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .post-content { font-weight: 300; line-height: 1.8; font-size: 1.02em; color: var(--white); }
  .post-content p { margin-bottom: 22px; }
  .post-content h1, .post-content h2, .post-content h3 {
    font-family: 'Cinzel', serif; font-weight: 600; letter-spacing: 0.5px;
    color: var(--lavender); margin: 38px 0 16px; line-height: 1.4;
  }
  .post-content h3 { font-size: 1.15em; }
  .post-content img, .post-content figure img { max-width: 100%; border-radius: 14px; display: block; margin: 0 auto; }
  .post-content figure { margin: 28px 0; }
  .post-content figcaption {
    text-align: center; font-family: 'DM Mono', monospace; font-size: 11px;
    color: rgba(201,195,224,0.6); margin-top: 10px;
  }
  .post-content a { color: var(--cyan); text-decoration: underline; text-decoration-color: rgba(0,229,255,0.35); }
  .post-content a:hover { text-decoration-color: rgba(0,229,255,0.9); }
  .post-content blockquote {
    border-left: 2px solid var(--cyan); padding: 4px 0 4px 20px; margin: 26px 0;
    font-style: italic; color: var(--silver);
  }
  .post-content ul, .post-content ol { margin: 0 0 22px 22px; }
  .post-content li { margin-bottom: 8px; }
  .post-content pre, .post-content code {
    font-family: 'DM Mono', monospace; background: rgba(255,255,255,0.05);
    border-radius: 8px; font-size: 0.88em;
  }
  .post-content pre { padding: 16px; overflow-x: auto; margin-bottom: 22px; }
  .post-content code { padding: 2px 6px; }
  .post-content hr { border: none; border-top: 1px solid rgba(182,156,255,0.2); margin: 34px 0; }

  .post-footer-nav { margin-top: 56px; text-align: center; }
  .post-footer-nav a {
    display: inline-block; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--void); background: linear-gradient(90deg, var(--cyan), var(--violet));
    text-decoration: none; padding: 12px 26px; border-radius: 20px;
  }

  /* === FOOTER DEL SITIO (igual que index.html) === */
  .footer { margin-top: 60px; text-align: center; }
  .footer-symbol {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.3em;
    color: rgba(0,229,255,0.35); text-transform: uppercase;
  }
`;

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,500;1,500&family=Poppins:wght@300;400;500;600&family=DM+Mono:wght@300&display=swap" rel="stylesheet">`;

function renderHeader({ activeIsBlog }) {
  return `
  <div class="top-nav">
    <a href="/">← Inicio</a>
    ${activeIsBlog ? '<span></span>' : '<a href="/blog">Blog →</a>'}
  </div>`;
}

function renderFooter() {
  return `
  <div class="footer">
    <p class="footer-symbol">✦ &nbsp; @melissagallegosg &nbsp; ✦</p>
    <p class="footer-symbol" style="margin-top: 10px;">
      <a href="https://mx.pinterest.com/melissagallegosg/_created/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Pinterest · @melissagallegosg</a>
    </p>
  </div>`;
}

/**
 * Envuelve el contenido de una página en el documento HTML completo,
 * con el mismo head/paleta/tipografías/fondo que el resto del sitio.
 */
function renderShell({ title, description, bodyHtml, activeIsBlog = false, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
${FONTS_LINK}
<style>${SHARED_STYLES}</style>
${extraHead}
</head>
<body>
<div class="aura-bg"></div>
<div class="container">
${renderHeader({ activeIsBlog })}
${bodyHtml}
${renderFooter()}
</div>
</body>
</html>`;
}

module.exports = { renderShell, escapeHtml, formatDate };
