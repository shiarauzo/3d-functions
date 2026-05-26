# Plan — towards "Nocturnal Heatmap Cartography"

Target look defined in [VISUAL_REFERENCE.md](./VISUAL_REFERENCE.md): glowing
colored data on true black, hot white cores, bloom, white uppercase labels and a
small legend per cell. We migrate the glass grid toward that aesthetic over 10
incremental iterations — each its own branch + draft PR, each verified with `/qa`.

Per-function category hues (from the palette):

| fn | hue | name |
|---|---|---|
| sin | `#F5A623` | amber |
| cos | `#F8E71C` | signal yellow |
| x² | `#FF2D9B` | hot pink |
| √x | `#E4007C` | magenta |
| 1/x | `#E2231A` | scarlet |
| eˣ | `#FF6B2C` | ember orange |
| sinc | `#7ED321` | lime |
| gauss | `#2EE6C8` | cyan-mint |
| \|x\| | `#B26BFF` | violet |

## Iterations

1. **Palette + true black.** Per-fn category hue; recolor glass tint, particle,
   trail; background → true/ink black with radial vignette. Captions white.
2. **Bloom.** Add postprocessing bloom (additive glow) so cores and the particle
   burn white-hot like the reference clusters.
3. **Glow-dot surface.** Render the solid as a field of additive glowing points
   sampled on the surface (the density-dot motif), layered with/over the glass.
4. **Hot-core particle.** Replace the flat sphere with a layered radial-glow
   sprite (white core → hue → transparent) + denser, brighter trail.
5. **Map-grid backdrop.** Thin gray grid lines behind/under each cell evoking the
   street scaffold; data glow sits inside a framed boundary.
6. **Instrument typography.** Title block (uppercase, tracked) + descriptor +
   tiny gray legend per cell, like "NEW YORK CITY / MUSIC EVENT DENSITY".
7. **Density legend.** Per-cell gradient scale bar + graduated-dot legend driven
   by the function (mock "events per unit"), reinforcing the data-readout frame.
8. **Cinematic hover.** Hovered cell blooms/saturates and rises; others desaturate
   and dim harder; smooth focus transition.
9. **Layout + masthead.** Grid spacing, framing, responsive behavior, and a
   masthead styled as the reference's title system.
10. **Grade + perf.** Tone mapping, color grading, vignette, additive balance,
    and a performance pass (bloom resolution, dpr, point counts).

## Definition of done per iteration

- `npm run build` clean.
- `/qa`: 9 live WebGL contexts, **0 console errors**, not blank, screenshot saved.
- Visible improvement toward the reference, reviewed on the screenshot.
- Branch + draft PR (stacked on previous), no Claude co-author/attribution.
