import { useState } from "react";
import { FUNCTIONS } from "./functions";
import { FunctionCell } from "./FunctionCell";

export default function App() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <main className="app">
      <header className="masthead">
        <h1>functions · art</h1>
        <p>sólidos de revolución y extrusión, en vidrio · pasa el cursor</p>
      </header>

      <div className="grid">
        {FUNCTIONS.map((fn) => (
          <FunctionCell
            key={fn.id}
            fn={fn}
            hovered={hovered === fn.id}
            dimmed={hovered !== null && hovered !== fn.id}
            onHover={setHovered}
          />
        ))}
      </div>
    </main>
  );
}
