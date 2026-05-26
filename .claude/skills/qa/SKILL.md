---
name: qa
description: QA de functions-art (3d-functions). Compila, levanta Vite, abre la página en un navegador headless (SwiftShader) y verifica que las 9 celdas cargan sin errores de consola, que cada contexto WebGL es válido y no se pierde, y que la escena renderiza (no está en blanco). Guarda un screenshot. Úsalo tras tocar shaders, materiales, geometría, postprocessing o el build, o cuando se pida "qa", "verifica", "revisa que renderiza".
---

# QA — functions-art

Verifica end-to-end que la pieza corre en un navegador real, no solo que
compila. Stack: Vite + TS + React + react-three-fiber + drei, con 9 `<Canvas>`
de vidrio (transmission) + morph targets + bloom. Los fallos típicos son de
runtime WebGL que `tsc`/`vite build` no atrapan (morph influences, uniforms,
postprocessing).

## Procedimiento

1. **Build** (atrapa tipos y empaquetado):
   ```bash
   npm run build
   ```
   Si falla, reporta FAIL con la salida y detente.

2. **Dev server** en 5173 (reutiliza si ya corre):
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
   # si no responde 200:  npm run dev &   (espera al 200)
   ```

3. **Navegador headless** (Puppeteer, dependencia del proyecto):
   ```bash
   URL=http://localhost:5173/ node scripts/check.mjs
   ```

## Qué valida `scripts/check.mjs`

- **Errores de consola y excepciones de página** → cualquiera marca FAIL (exit 2).
- **9 `<canvas>`** presentes (exit 3 si no).
- **Contexto WebGL** por celda: existe, tamaño > 0, no perdido (`isContextLost()`).
- **Captions KaTeX** renderizadas (cuenta `.katex`).
- Guarda captura en `scripts/shot.png` para inspección visual (revísala: el
  veredicto "no está en blanco" lo confirma el ojo sobre ese screenshot).

## Salida

Imprime JSON: `canvasCount`, `captions`, `gl[]`, `blank`, `errors[]`. Reporta el
veredicto con esos datos y, si hay FAIL, los mensajes concretos. Abre
`scripts/shot.png` para juzgar la calidad visual.
