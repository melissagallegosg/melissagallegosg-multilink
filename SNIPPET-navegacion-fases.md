# Navegación entre fases — snippet para pegar en cada app externa

Estas 4 fases viven en proyectos/dominios separados (Ritmo Alfa, Método 369, Ikigai, Ritmo Beta),
así que no pude editarlas desde aquí — no venían en este ZIP. Pega este bloque justo antes del
`</body>` de cada una, cambiando el texto en mayúsculas por los valores de la tabla de abajo.

```html
<div style="max-width:480px;margin:48px auto 0;padding-top:26px;border-top:1px solid rgba(182,156,255,0.15);text-align:center;font-family:'Poppins',sans-serif;">
  <p style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:0.2em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:8px;">
    FASE_ACTUAL DE 5
  </p>
  <p style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;color:#B69CFF;margin-bottom:20px;">
    MENSAJE_DE_CIERRE
  </p>
  <a href="URL_SIGUIENTE_FASE" style="display:inline-flex;align-items:center;gap:8px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#050505;background:linear-gradient(90deg,#00E5FF,#5B1EFF);text-decoration:none;padding:12px 26px;border-radius:20px;">
    TEXTO_BOTON_SIGUIENTE
  </a>
  <a href="https://[TU-DOMINIO-DE-LA-LANDING]/" style="display:block;margin-top:18px;font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:0.05em;color:rgba(182,156,255,0.5);text-decoration:none;">
    Volver al mapa de la metodología
  </a>
</div>
```

Nota: reemplaza `https://[TU-DOMINIO-DE-LA-LANDING]/` por la URL real donde publiques el `index.html`
de este proyecto (el mapa central). Si esas apps ya usan las mismas fuentes de Google Fonts
(Cinzel, Playfair Display, DM Mono, Poppins), el snippet se verá igual que en el mapa; si no,
puedes quitar los `font-family` y usar la tipografía que ya tengan.

## Valores por app

| App | FASE_ACTUAL | MENSAJE_DE_CIERRE | URL_SIGUIENTE_FASE | TEXTO_BOTON_SIGUIENTE |
|---|---|---|---|---|
| ritmoalfa.vercel.app | FASE 1 | Ya identificaste tu patrón. | https://metodo369.vercel.app/ | Siguiente: Fase 2 — Alinea → |
| metodo369.vercel.app | FASE 2 | Ya alineaste tu propósito. | https://ikigaitest-mg.vercel.app/ | Siguiente: Fase 3 — Conecta → |
| ikigaitest-mg.vercel.app | FASE 3 | Ya conectaste tus pasiones. | fase4-recupera.html de la landing (o su URL pública) | Siguiente: Fase 4 — Recupera → |
| ritmobeta.vercel.app | FASE 5 | Has llegado a la fase de ejecución. | (sin botón "siguiente" — es la última fase) | — |

Para Ritmo Beta (Fase 5), quita el botón "siguiente" y deja solo el enlace "Volver al mapa".

Si me compartes el ZIP de cada una de estas 4 apps, te dejo la navegación ya integrada
directamente en el código, con el mismo cuidado que tuve con la Fase 4.
