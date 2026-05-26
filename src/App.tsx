import { type CSSProperties, useEffect, useState } from "react";
import { FUNCTIONS } from "./functions";
import { FunctionCell } from "./FunctionCell";

const COLS = 4;

export default function App() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  // a pinned field stays focused without hover; hover still wins while active
  const active = hovered ?? pinned;

  const togglePin = (id: string) =>
    setPinned((p) => (p === id ? null : id));

  // arrow-key navigation over the pinned selection; Escape clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(null);
        return;
      }
      const delta =
        e.key === "ArrowRight" ? 1
        : e.key === "ArrowLeft" ? -1
        : e.key === "ArrowDown" ? COLS
        : e.key === "ArrowUp" ? -COLS
        : 0;
      if (!delta) return;
      e.preventDefault();
      setPinned((p) => {
        const cur = p ? FUNCTIONS.findIndex((f) => f.id === p) : -1;
        const next = Math.min(
          FUNCTIONS.length - 1,
          Math.max(0, (cur < 0 ? 0 : cur) + delta),
        );
        return FUNCTIONS[next].id;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="app">
      <header className="masthead">
        <div className="masthead__rule" />
        <div className="masthead__row">
          <div className="masthead__title">
            <h1>FUNCTION DENSITY ATLAS</h1>
            <p>TWELVE SOLIDS OF REVOLUTION · LUMINOUS GLASS FIELD</p>
          </div>
          <div className="masthead__meta">
            <span>{String(FUNCTIONS.length).padStart(2, "0")} FIELDS</span>
            <span>HOVER · CLICK TO PIN · ARROWS</span>
          </div>
        </div>
      </header>

      <div className="grid">
        {FUNCTIONS.map((fn, i) => (
          <FunctionCell
            key={fn.id}
            fn={fn}
            index={i}
            hovered={active === fn.id}
            pinned={pinned === fn.id}
            dimmed={active !== null && active !== fn.id}
            onHover={setHovered}
            onSelect={togglePin}
          />
        ))}
      </div>

      <footer className="colorkey">
        {FUNCTIONS.map((fn) => (
          <button
            key={fn.id}
            type="button"
            className={`colorkey__item${active === fn.id ? " is-active" : ""}`}
            style={{ "--hue": fn.hue } as CSSProperties}
            onPointerEnter={() => setHovered(fn.id)}
            onPointerLeave={() => setHovered(null)}
            onClick={() => togglePin(fn.id)}
          >
            <span className="colorkey__swatch" />
            {fn.label}
          </button>
        ))}
      </footer>

      {/* analog overlay: faint film grain + scanlines */}
      <div className="grain" aria-hidden />
    </main>
  );
}
