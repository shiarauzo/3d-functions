import { type CSSProperties, useState } from "react";
import { FUNCTIONS } from "./functions";
import { FunctionCell } from "./FunctionCell";

export default function App() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <main className="app">
      <header className="masthead">
        <div className="masthead__rule" />
        <div className="masthead__row">
          <div className="masthead__title">
            <h1>FUNCTION DENSITY ATLAS</h1>
            <p>NINE SOLIDS OF REVOLUTION · LUMINOUS GLASS FIELD</p>
          </div>
          <div className="masthead__meta">
            <span>09 FIELDS</span>
            <span>REVOLUTION → EXTRUSION ON HOVER</span>
          </div>
        </div>
      </header>

      <div className="grid">
        {FUNCTIONS.map((fn, i) => (
          <FunctionCell
            key={fn.id}
            fn={fn}
            index={i}
            hovered={hovered === fn.id}
            dimmed={hovered !== null && hovered !== fn.id}
            onHover={setHovered}
          />
        ))}
      </div>

      <footer className="colorkey">
        {FUNCTIONS.map((fn) => (
          <button
            key={fn.id}
            type="button"
            className={`colorkey__item${hovered === fn.id ? " is-active" : ""}`}
            style={{ "--hue": fn.hue } as CSSProperties}
            onPointerEnter={() => setHovered(fn.id)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="colorkey__swatch" />
            {fn.label}
          </button>
        ))}
      </footer>
    </main>
  );
}
