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
};

const sinc = (x: number) => (Math.abs(x) < 1e-4 ? 1 : Math.sin(x) / x);

/** The nine curves, chosen for how they look once revolved. */
export const FUNCTIONS: Fn[] = [
  { id: "sin", latex: "y = \\sin x", f: Math.sin, domain: [0, Math.PI * 2], turns: 6 },
  { id: "cos", latex: "y = \\cos x", f: Math.cos, domain: [0, Math.PI * 2], turns: 6 },
  { id: "sq", latex: "y = x^{2}", f: (x) => x * x, domain: [-1.4, 1.4], turns: 5 },
  { id: "sqrt", latex: "y = \\sqrt{x}", f: Math.sqrt, domain: [0, 3], turns: 5 },
  { id: "inv", latex: "y = \\dfrac{1}{x}", f: (x) => 1 / x, domain: [0.42, 3], turns: 6 },
  { id: "exp", latex: "y = e^{x}", f: Math.exp, domain: [-2, 1.25], turns: 5 },
  { id: "sinc", latex: "y = \\dfrac{\\sin x}{x}", f: sinc, domain: [-3 * Math.PI, 3 * Math.PI], turns: 7 },
  { id: "gauss", latex: "y = e^{-x^{2}}", f: (x) => Math.exp(-x * x), domain: [-2.5, 2.5], turns: 6 },
  { id: "abs", latex: "y = |x|", f: Math.abs, domain: [-1.5, 1.5], turns: 5 },
];
