# Visual Style Reference — "Event Density" heatmap maps

Derived from the reference image: small-multiples of NYC / LA maps showing
cultural-event density as glowing colored dots on black.

## 1. Core Aesthetic

- **Style name: Nocturnal Heatmap Cartography** (data-viz / "glow-dot density").
- **Philosophy:** vivid, self-luminous data points float on near-black space; the
  information *emits light* rather than being drawn on a surface.
- **Influences:** thermal/heatmap imaging, observatory star-charts, Stamen-style
  dark cartography, small-multiples (Tufte), nightlife/club poster palettes.

## 2. Color Palette

Black-first. One saturated hue per category, each dot a radial gradient from a
hot near-white core → saturated mid → dark falloff, with a soft bloom halo.

| Role | Name | Hex | Usage |
|---|---|---|---|
| Ground | True black | `#000000` | Canvas background |
| Ground | Ink black | `#0A0A0A` | Panel fill, slightly lifted |
| Grid | Street gray | `#4A4A4A` | Thin map/street lines |
| Grid | Faint gray | `#6B6B6B` | Secondary lines, ticks |
| Category | Amber | `#F5A623` | "Music" warm density |
| Category | Magenta | `#E4007C` | "Art / Magnet" density |
| Category | Hot pink | `#FF2D9B` | Magenta highlight |
| Category | Lime | `#7ED321` | "Music LA" density |
| Category | Scarlet | `#E2231A` | "Fashion" density |
| Accent | Signal yellow | `#F8E71C` | Quantity dots, hot cores |
| Core | White-hot | `#FFFFFF` | Dot centers / cluster peaks |
| Core | Cream | `#FBE8C8` | Warm core falloff |
| Text | White | `#FFFFFF` | Labels |

Total: ~13 swatches, but conceptually **black + 4–5 category hues + a white/yellow
hot-core gradient**.

## 3. Typography System

- **Headline:** uppercase, wide tracking, light-to-regular weight neo-grotesque
  (Helvetica / Inter-ish). E.g. `NEW YORK CITY`. Large but airy.
- **Sub-label:** smaller uppercase, regular weight, descriptor stacked below the
  headline: `MUSIC EVENT DENSITY`.
- **Legend / fine print:** tiny, gray, often monospace-feeling numerals with
  gradient scale bars and graduated-symbol legends.
- **Hierarchy:** CITY (big) → CATEGORY (medium) → legend (tiny gray). All caps,
  left-aligned, generous negative space.
- **Bilingual/mono note:** numerals read as tabular/monospace; good fit for KaTeX
  formula captions rendered in white.

## 4. Key Design Elements

- **Glow dots:** every datum is a radial-gradient sprite — white/yellow core,
  saturated body, transparent edge — plus an additive bloom halo. Clusters blur
  into heat blooms.
- **Proportional symbols:** crisp yellow dots sized by quantity layered over the
  diffuse heat — two encodings (density glow + sized dots) at once.
- **Map scaffold:** thin gray street/grid lines define the silhouette; the data
  glow sits *inside* the boundary, never the lines themselves glowing.
- **Layout:** strict small-multiples grid; each panel = one place × one category,
  identically framed with title block top-left and legend block lower-left.
- **Annotations:** scale bar, north arrow, gradient legend, graduated-dot legend —
  the "instrument panel" framing that makes it read as data, not decoration.
- **Treatment:** pure additive light on black; saturation high, value range wide
  (black → white-hot); zero skeuomorphism.

## 5. Visual Concept

The design's bridge: **turn a dataset into a night sky** — each event is a light,
density becomes glow, category becomes color. Information is luminous and additive,
so dense regions literally burn brighter.

For **functions-art** this maps cleanly: each function panel becomes a "city",
each gets a category hue, the solid is described by **glowing points/edges** with a
hot white core and bloom, the spiral particle is the brightest "signal", and white
uppercase labels + a small legend frame each cell as an instrument readout.

**Ideal use cases:** data dashboards, generative art, music/nightlife branding,
observatory/scientific viz, anything that wants "data as light on black".
