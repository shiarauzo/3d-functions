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
- `/qa`: live WebGL contexts, **0 console errors**, not blank, screenshot saved.
- Visible improvement toward the reference, reviewed on the screenshot.
- Branch + draft PR (stacked on previous), no Claude co-author/attribution.

---

# Plan V2 — iterations 11–25 (+ README pass)

Second wave. Each iteration: develop → **separate code-review agent verifies & I
fix** → `/qa` → branch + draft PR (stacked), no Claude attribution.

## Function expansion (decision)

Grid grows **9 → 16 (4×4)**. Seven curves added, chosen to broaden the shape
vocabulary (asymptotes, inflections, decay, growth):

| fn | latex | hue | domain | note |
|---|---|---|---|---|
| tan | `\tan x` | `#FF4D6D` | [-1.2, 1.2] | asymptotic flare (safely inside ±π/2) |
| ln | `\ln x` | `#36C5F0` | [1.0, 6] | clean growth branch (no fold-through) |
| cube | `x^3` | `#C0FF3E` | [-1.3, 1.3] | odd, inflection at 0 |
| cbrt | `\sqrt[3]{x}` | `#FF9F1C` | [-2, 2] | steep near 0 (fold is aesthetic) |
| logistic | `\dfrac{1}{1+e^{-x}}` | `#9B5DE5` | [-6, 6] | sigmoid S, always (0,1) |
| damped | `e^{-x/4}\cos 3x` | `#00F5D4` | [0, 4π] | decaying oscillation (non-neg input to exp) |
| rose | `|\sin 2x|` | `#F15BB5` | [0, π] | one petal cycle, always ≥0 |

Domains validated by plan QA (avoid unbounded radius / NaN).

## Iterations

11. **Grid 4×4 + 7 funciones + lazy-mount.** Add the curves above; relayout to 4
    columns; extend the palette/color-key; update masthead copy (16 fields).
    **Correctness prerequisite (per plan QA):** lazy-mount each cell's `<Canvas>`
    via IntersectionObserver (mount on approach, unmount when far offscreen) so we
    never exceed the browser's ~16 WebGL-context limit and silently blank cells.
    Also drop transmission `samples` 4→2 for non-hovered cells.
12. **Heat blooms.** Diffuse low-frequency glow behind dense regions (a soft
    additive backing) so clusters read as heat, like the reference halos.
13. **Quantity dots.** Crisp signal-yellow proportional dots overlaid on the
    field (second encoding), sized by local curvature/height.
14. **Sweep pulse.** A travelling luminance sweep along the solid that briefly
    brightens the points it passes — sampling/scan motion.
15. **Map chrome.** Per-cell north-arrow + scale-bar + tick marks, the reference's
    instrument annotations.
16. **Thermal vertex color.** Points coloured by radius/height through a
    black→hue→white ramp so each solid has a hot core and cool rim.
17. **Camera drift / parallax.** Subtle per-cell camera sway for life and depth.
18. **Particle swarm.** 3–4 particles per cell spiralling at offsets, each with a
    trail — a constellation, not a lone dot.
19. **Depth cueing.** Atmospheric fog/fade so far surface dims, reinforcing 3D.
20. **Sticky focus + keyboard.** Click/key to pin a field (sticky select), arrow
    navigation, focus-visible styles.
21. **Intro choreography.** Staggered fade/scale-in of cells on load; smooth state
    transitions.
22. **Analog grain.** Fine film grain + faint scanlines overlay for instrument feel
    (respecting contrast).
23. **Responsive.** Fluid type, 4→2→1 columns, sensible touch behaviour.
24. **A11y + reduced motion.** `prefers-reduced-motion` calms rotation/particles;
    aria labels; key-only operability.
25. **Perf hardening.** Shared env/PMREM, bloom resolution + dpr tuning,
    draw-call audit, geometry/segment tuning. (Lazy-mount already landed in 11.)

## Extra — README pass (separate iteration)

Rewrite `README.md` into a polished landing doc: **no references to `PLAN.md` or
`VISUAL_REFERENCE.md`**, include visuals (committed cover/hero image, a per-field
palette table with color swatches, feature highlights, run/QA instructions).

## Definition of done (V2)

Same as above, plus: a **separate code-review agent** inspects each iteration's
diff and its findings are resolved before the PR.
