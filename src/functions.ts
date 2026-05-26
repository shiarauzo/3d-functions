export type Fn = {
  id: string;
  /** KaTeX source for the caption. */
  latex: string;
  /** The function itself. */
  f: (x: number) => number;
  /** Domain [a, b] sampled along the x-axis. */
  domain: [number, number];
  /** How many turns the spiral particle makes along the solid. */
  turns: number;
  /** Category hue (heatmap palette) — drives glass tint, particle, trail, glow. */
  hue: string;
  /** Short uppercase descriptor for the instrument-style label. */
  label: string;
};

const sinc = (x: number) => (Math.abs(x) < 1e-4 ? 1 : Math.sin(x) / x);

/** The nine curves, chosen for how they look once revolved. */
export const FUNCTIONS: Fn[] = [
  { id: "sin", latex: "y = \\sin x", f: Math.sin, domain: [0, Math.PI * 2], turns: 6, hue: "#F5A623", label: "SINE FIELD" },
  { id: "cos", latex: "y = \\cos x", f: Math.cos, domain: [0, Math.PI * 2], turns: 6, hue: "#F8E71C", label: "COSINE FIELD" },
  { id: "sq", latex: "y = x^{2}", f: (x) => x * x, domain: [-1.4, 1.4], turns: 5, hue: "#FF2D9B", label: "QUADRATIC FIELD" },
  { id: "sqrt", latex: "y = \\sqrt{x}", f: Math.sqrt, domain: [0, 3], turns: 5, hue: "#E4007C", label: "ROOT FIELD" },
  { id: "inv", latex: "y = \\dfrac{1}{x}", f: (x) => 1 / x, domain: [0.42, 3], turns: 6, hue: "#E2231A", label: "INVERSE FIELD" },
  { id: "exp", latex: "y = e^{x}", f: Math.exp, domain: [-2, 1.25], turns: 5, hue: "#FF6B2C", label: "EXPONENTIAL FIELD" },
  { id: "sinc", latex: "y = \\dfrac{\\sin x}{x}", f: sinc, domain: [-3 * Math.PI, 3 * Math.PI], turns: 7, hue: "#7ED321", label: "SINC FIELD" },
  { id: "gauss", latex: "y = e^{-x^{2}}", f: (x) => Math.exp(-x * x), domain: [-2.5, 2.5], turns: 6, hue: "#2EE6C8", label: "GAUSSIAN FIELD" },
  { id: "abs", latex: "y = |x|", f: Math.abs, domain: [-1.5, 1.5], turns: 5, hue: "#B26BFF", label: "ABSOLUTE FIELD" },
];
