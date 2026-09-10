// test/mock-feed.js
// Feed RSS simulado con casos límite:
// - título con tildes, ñ y signos ¿?
// - dos posts con títulos muy parecidos (deben generar slugs distintos
//   gracias al id único de Medium)
// - píxel de tracking, párrafo "Originally published", párrafo vacío

module.exports = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Melissa Gallegos - Medium</title>
<item>
  <title><![CDATA[¿Qué es la autocompasión y por qué la necesitas?]]></title>
  <link>https://medium.com/@melissagallegosg/que-es-la-autocompasion-y-por-que-la-necesitas-a1b2c3d4e5f6</link>
  <guid isPermaLink="false">https://medium.com/p/a1b2c3d4e5f6</guid>
  <pubDate>Mon, 01 Sep 2026 14:00:00 GMT</pubDate>
  <dc:creator><![CDATA[Melissa Gallegos]]></dc:creator>
  <category>autocompasion</category>
  <category>bienestar</category>
  <content:encoded><![CDATA[
    <figure><img alt="portada" src="https://miro.medium.com/v2/resize:fit:1400/portada1.jpg" /><figcaption>Una portada cualquiera</figcaption></figure>
    <p>La autocompasión es una práctica poco entendida en años recientes. Aquí exploramos qué significa y por qué importa.</p>
    <p>&nbsp;</p>
    <h3>Un pequeño mapa</h3>
    <p>Primero, algo de contexto: la palabra "compasión" viene del latín <em>cum patior</em>.</p>
    <blockquote>No puedes odiarte hacia una mejor versión de ti misma.</blockquote>
    <p><br></p>
    <img alt="" src="https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=a1b2c3d4e5f6" width="1" height="1">
    <p>Originally published at <a href="https://melissagallegosg.com">melissagallegosg.com</a> on September 1, 2026.</p>
  ]]></content:encoded>
</item>
<item>
  <title><![CDATA[¿Qué es la autocompasión? (segunda parte)]]></title>
  <link>https://medium.com/@melissagallegosg/que-es-la-autocompasion-segunda-parte-f6e5d4c3b2a1</link>
  <guid isPermaLink="false">https://medium.com/p/f6e5d4c3b2a1</guid>
  <pubDate>Wed, 03 Sep 2026 09:30:00 GMT</pubDate>
  <dc:creator><![CDATA[Melissa Gallegos]]></dc:creator>
  <category>autocompasion</category>
  <content:encoded><![CDATA[
    <p>Segunda parte de la reflexión sobre la autocompasión, con ejemplos y ejercicios prácticos para el día a día. Aquí van algunas ideas útiles y aplicables desde hoy mismo, sin necesidad de mucho tiempo libre ni preparación previa alguna.</p>
    <p>Ideas clave:</p>
    <ul><li>Nombrar la emoción sin juzgarla</li><li>Hablarte como le hablarías a una amiga</li></ul>
  ]]></content:encoded>
</item>
<item>
  <title><![CDATA[Diseño de rutinas con mañanas más ligeras]]></title>
  <link>https://medium.com/@melissagallegosg/diseno-de-rutinas-con-mananas-mas-ligeras-123abc456def</link>
  <guid isPermaLink="false">https://medium.com/p/123abc456def</guid>
  <pubDate>Fri, 05 Sep 2026 08:00:00 GMT</pubDate>
  <dc:creator><![CDATA[Melissa Gallegos]]></dc:creator>
  <content:encoded><![CDATA[
    <p>Diseñar una mañana más ligera no requiere despertar a las 5am. Aquí algunas ideas pequeñas y sostenibles.</p>
  ]]></content:encoded>
</item>
</channel>
</rss>`;
