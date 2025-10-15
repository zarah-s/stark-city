import { useMemo } from "react";
import { useGame } from "../game/state";

function TileCell({
  id,
  name,
  color,
}: {
  id: number;
  name: string;
  color?: string;
}) {
  const { players } = useGame();
  const occupants = players.filter((p) => p.position === id);
  return (
    <div
      className="relative flex items-end justify-center border border-white/10 bg-white/60 dark:bg-white/5 p-1 overflow-hidden"
      style={{
        backgroundImage: color
          ? `linear-gradient(180deg, ${color} 0 6px, transparent 6px)`
          : undefined,
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" />
      <div className="text-[10px] text-center leading-tight px-1 opacity-80 select-none">
        {name}
      </div>
      <div className="absolute top-0 right-0 left-0 mx-auto flex gap-0.5 justify-center p-0.5">
        {occupants.map((o) => (
          <span key={o.id} className="pill" title={o.name}>
            {tokenEmoji(o.token)}
          </span>
        ))}
      </div>
    </div>
  );
}

function tokenEmoji(token: string) {
  switch (token) {
    case "car":
      return "🚗";
    case "hat":
      return "🎩";
    case "dog":
      return "🐶";
    case "ship":
      return "🚢";
    case "shoe":
      return "👟";
    case "iron":
      return "🪙";
    case "thimble":
      return "🧵";
    case "wheelbarrow":
      return "🛒";
    default:
      return "⚪";
  }
}

export default function Board() {
  const { tiles } = useGame();

  const layout = useMemo(() => {
    const bottom = tiles.slice(0, 11);
    const left = tiles.slice(11, 20);
    const top = tiles.slice(20, 31).slice().reverse();
    const right = tiles.slice(31).slice().reverse();
    return { bottom, left, top, right };
  }, [tiles]);

  return (
    <div
      className="mx-auto grid gap-2 sm:gap-3 md:gap-4"
      style={{
        gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
        gridTemplateRows: "repeat(11, minmax(0, 1fr))",
      }}
    >
      {/* Top row */}
      {layout.top.map((t, _) => (
        <div key={t.id} className="col-span-1 row-span-1">
          <TileCell id={t.id} name={t.name} color={t.color} />
        </div>
      ))}
      {/* Right column */}
      {layout.right.map((t) => (
        <div key={t.id} className="col-start-11">
          <TileCell id={t.id} name={t.name} color={t.color} />
        </div>
      ))}
      {/* Center */}
      <div className="col-span-9 row-span-9 col-start-2 row-start-2 card flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-3xl font-black tracking-widest">MONOPOLY</div>
          <div className="opacity-70">A simplified, responsive edition</div>
        </div>
      </div>
      {/* Left column */}
      {layout.left.map((t, _) => (
        <div key={t.id} className="col-start-1">
          <TileCell id={t.id} name={t.name} color={t.color} />
        </div>
      ))}
      {/* Bottom row */}
      {layout.bottom.map((t) => (
        <div key={t.id}>
          <TileCell id={t.id} name={t.name} color={t.color} />
        </div>
      ))}
    </div>
  );
}
