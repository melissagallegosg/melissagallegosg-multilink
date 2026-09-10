# melissagallegosg — sitio + blog nativo sincronizado con Medium

Este proyecto es tu sitio original (HTML estático, sin build) **más** un
blog nativo en `/blog` que muestra tus artículos de Medium dentro de tu
propio dominio, con tu mismo diseño (header, footer, colores, tipografías).
No es un iframe de Medium (Medium lo bloquea con `X-Frame-Options`): se lee
tu **feed RSS público** y se renderiza como páginas propias del sitio.

## Cómo funciona (arquitectura)

Tu sitio original no tenía backend (puro HTML/CSS), pero como despliega en
**Vercel**, sí tiene acceso a **Vercel Functions** (Node.js serverless) sin
necesidad de adoptar Next.js ni ningún framework/bundler. Eso es justo lo
que se usó aquí:

```
├── index.html, faseX.html, resumen.html   ← tu sitio original, sin tocar (excepto el link "MI BLOG")
├── admin-revalidate.html                  ← página para forzar el refresco del blog
├── vercel.json                            ← rewrites: /blog y /blog/:slug -> las funciones de /api
├── api/
│   ├── blog.js                            ← función serverless: listado del blog (/blog)
│   ├── blog/[slug].js                     ← función serverless: un artículo (/blog/:slug)
│   └── revalidate.js                      ← función serverless: refresco protegido por clave
├── lib/
│   ├── medium.js                          ← descarga, parsea, limpia y cachea el feed RSS
│   ├── slugify.js                         ← genera los slugs ASCII de cada post
│   └── layout.js                          ← header/footer/estilos compartidos (mismo diseño del sitio)
├── dev-server.js                          ← servidor local sin dependencias, para probar sin la CLI de Vercel
├── test/                                  ← pruebas automatizadas con un feed simulado
└── package.json                           ← sin dependencias de npm (cero node_modules)
```

**Por qué no se leyó el feed desde el navegador (client-side):** Medium no
manda cabeceras CORS, así que un `fetch()` desde el navegador a
`medium.com/feed/...` falla. Por eso el fetch se hace **desde la función
serverless** (servidor a servidor), donde CORS no aplica.

**Por qué no se usaron librerías externas** (`rss-parser`, `sanitize-html`,
etc.): para que el proyecto siga sin `node_modules` ni paso de build, igual
que el resto del sitio. El parser de `lib/medium.js` es una implementación
simple basada en expresiones regulares — funciona bien porque el RSS de
Medium tiene una estructura muy estable, y queda documentado por si en el
futuro prefieres migrar a una librería más robusta.

## Cómo correrlo en local

No necesitas instalar nada (cero dependencias de npm):

```bash
cp .env.example .env
# edita .env: pon tu usuario de Medium y una clave secreta propia
npm run dev
# abre http://localhost:3000
```

Esto levanta `dev-server.js`, un servidor Node plano que imita las rewrites
de `vercel.json` (sin necesitar la CLI de Vercel). Sirve:
- `http://localhost:3000/` → tu sitio principal
- `http://localhost:3000/blog` → el listado del blog
- `http://localhost:3000/blog/<slug>` → un artículo
- `http://localhost:3000/admin-revalidate.html` → refresco manual

Si prefieres usar la CLI oficial de Vercel (más fiel a producción):

```bash
npm i -g vercel
vercel dev
```

### Correr las pruebas automatizadas

```bash
npm test
```

Esto corre `test/run-tests.js` contra un **feed simulado**
(`test/mock-feed.js`) que incluye a propósito los casos límite que pediste:
un título con tildes, ñ y signos de interrogación (`¿Qué es...?`), dos
títulos muy parecidos (para confirmar que no chocan los slugs), el píxel de
tracking de Medium, un párrafo "Originally published at... on...", y
párrafos vacíos. Las 25 pruebas verifican slugs 100% ASCII, limpieza de
contenido y las tres funciones serverless respondiendo con los códigos
HTTP correctos (200/404/401/500).

## Variables de entorno

Configúralas en **Vercel → Project Settings → Environment Variables** (y en
tu `.env` local para desarrollo):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MEDIUM_FEED_URL` | No (tiene default) | URL del feed RSS. Por defecto: `https://medium.com/feed/@melissagallegosg` |
| `BLOG_REVALIDATE_SECRET` | Sí, para poder refrescar manualmente | Clave que tú inventas. Sin ella, `/api/revalidate` responde 500 (por seguridad, nunca queda "abierto" sin clave). |

## Refresco del contenido (freshness)

- **Automático:** cada función guarda el feed en memoria durante ~12
  minutos (dentro del rango de 10–15 min que pediste). Pasado ese tiempo,
  la siguiente visita dispara un refetch a Medium en segundo plano.
- **Instantáneo, después de publicar algo nuevo:** abre
  `/admin-revalidate.html`, escribe tu `BLOG_REVALIDATE_SECRET` y presiona
  "Refrescar ahora". O bien, por línea de comandos:
  ```bash
  curl "https://tu-dominio.com/api/revalidate?secret=TU_CLAVE"
  ```
  Además, si visitas directamente la URL de un artículo nuevo que aún no
  está en caché, el sistema intenta un refresco automático antes de dar 404
  (por si publicaste hace segundos).

  **Limitación honesta:** el caché vive en la memoria de cada instancia de
  la función serverless. Vercel normalmente reutiliza la misma instancia
  "caliente" para la mayoría de las visitas, así que el refresco se nota
  casi al instante — pero en momentos de tráfico alto con varias instancias
  corriendo en paralelo, alguna podría tardar un poco más en enterarse del
  refresco. No afecta la corrección de los datos (nunca se muestra algo
  roto), solo la latencia de propagación en casos raros.

## Limitación del feed de Medium (avisado, como pediste)

El RSS público de Medium **solo trae tus últimos ~10 artículos**. Es una
limitación de Medium, no de este proyecto — no hay forma de traer el
historial completo solo con RSS. Si en algún momento quieres mostrar más
de 10, la alternativa sería usar la API oficial de Medium (requiere OAuth
y tiene sus propias limitaciones) o migrar el contenido fuera de Medium.

## Generación de slugs (por qué y cómo)

Cada artículo genera su URL así: `{titulo-en-ascii}-{id-unico-de-medium}`.

- El título se pasa por un slugify que quita tildes, la ñ se convierte en
  n, se eliminan símbolos como `¿ ? ¡ !`, y los espacios se vuelven
  guiones — el resultado es 100% ASCII, minúsculas.
- El "id único" son los caracteres hexadecimales que Medium pone al final
  de su propia URL (ej. `...-a1b2c3d4e5f6`). Esto garantiza que dos
  artículos con títulos parecidos (o el mismo título editado y republicado)
  nunca generen el mismo slug.
- Deliberadamente **no** se reutiliza el slug tal cual viene en la URL de
  Medium — se reconstruye desde cero para blindarte de cualquier caracter
  sin codificar que Medium pudiera generar.

## Limpieza aplicada al contenido de cada post

Al traer `content:encoded` del RSS, se elimina automáticamente:
- El píxel de tracking de Medium (`<img>` de 1×1 apuntando a
  `medium.com/_/stat`).
- El párrafo final tipo "Originally published at... on...".
- Párrafos vacíos.
- La imagen de portada duplicada dentro del cuerpo (cuando Medium repite la
  portada como primera imagen del artículo, ya que esa misma imagen se
  muestra arriba como "hero" del post).

## Desplegar a Vercel

1. Sube este proyecto a un repo de git (GitHub/GitLab/Bitbucket).
2. Impórtalo en Vercel (Framework Preset: "Other" — no hace falta build
   command, es HTML estático + funciones serverless).
3. Configura las variables de entorno (`MEDIUM_FEED_URL`,
   `BLOG_REVALIDATE_SECRET`) en el proyecto de Vercel.
4. Deploy. `/blog` y `/blog/:slug` funcionarán automáticamente gracias a
   los `rewrites` de `vercel.json`.

## Nota sobre `admin-revalidate.html`

Tiene `<meta name="robots" content="noindex, nofollow">` para no aparecer
en buscadores, pero **no está oculta por contraseña de acceso** — la
protección real está en que sin la clave correcta, `/api/revalidate`
siempre responde 401. Si prefieres que la página ni siquiera sea
accesible públicamente, puedes protegerla con "Vercel Password
Protection" (disponible en algunos planes) o eliminarla y usar solo el
`curl` del secreto.
