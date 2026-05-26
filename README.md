# 3d-functions · functions-art

Sólidos de revolución (que morphean a extrusión en hover) de nueve funciones,
renderizados en vidrio iridiscente y migrando hacia una estética de **mapa de
densidad luminoso** sobre negro — ver [VISUAL_REFERENCE.md](./VISUAL_REFERENCE.md).

Cada celda de un grid 3×3 es una función: `sin x`, `cos x`, `x²`, `√x`, `1/x`,
`eˣ`, `sin x / x`, `e^{-x²}`, `|x|`. Una partícula recorre en espiral la
superficie, dejando una estela luminosa.

## Stack

Vite · TypeScript · React · react-three-fiber · drei · three · KaTeX.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## QA

```bash
node scripts/check.mjs    # headless: contextos WebGL, errores, screenshot
```

Roadmap visual en [PLAN.md](./PLAN.md).
