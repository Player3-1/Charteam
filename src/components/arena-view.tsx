import { useMemo } from "react";
import type { Arena } from "@/lib/arenas";
import { COLS, ROWS, RIVER_ROW, BRIDGE_COLS, type BattleState, type Projectile } from "@/lib/battle";
import { cn } from "@/lib/utils";

interface Props {
  arena: Arena;
  state: BattleState;
  onPlace?: (col: number, row: number) => void;
  selectedCardId?: string;
}

function useProps(biome: Arena["biome"]) {
  return useMemo(() => {
    const rand = mulberry(biome.length * 37 + 1);
    const items: { x: number; y: number; kind: string; size: number }[] = [];
    for (let i = 0; i < 18; i++) {
      items.push({
        x: rand() * 100,
        y: rand() * 100,
        kind: pickProp(biome, rand()),
        size: 16 + rand() * 18,
      });
    }
    return items;
  }, [biome]);
}
function mulberry(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickProp(biome: Arena["biome"], r: number): string {
  if (biome === "grass") return r < 0.5 ? "tree" : r < 0.85 ? "flower" : "bush";
  if (biome === "desert") return r < 0.7 ? "cactus" : "rock-sand";
  if (biome === "snow") return r < 0.55 ? "snow-tree" : r < 0.85 ? "rock-snow" : "snow-pile";
  return r < 0.5 ? "skeleton" : r < 0.85 ? "rock-dark" : "skull";
}
function propEmoji(kind: string): string {
  switch (kind) {
    case "tree": return "🌳";
    case "flower": return "🌼";
    case "bush": return "🌿";
    case "cactus": return "🌵";
    case "rock-sand": return "🪨";
    case "snow-tree": return "🌲";
    case "rock-snow": return "🪨";
    case "snow-pile": return "❄️";
    case "skeleton": return "💀";
    case "rock-dark": return "🪨";
    case "skull": return "☠️";
    default: return "•";
  }
}
function projectileEmoji(p: Projectile): string {
  switch (p.kind) {
    case "arrow": return "➶";
    case "stone": return "🪨";
    case "bullet": return "•";
    case "bomb": return "💣";
    case "fire": return "🔥";
  }
}

export function ArenaView({ arena, state, onPlace, selectedCardId }: Props) {
  const props = useProps(arena.biome);
  const cx = (col: number) => ((col + 0.5) / COLS) * 100;
  const cy = (row: number) => ((row + 0.5) / ROWS) * 100;

  return (
    <div
      className="relative h-full w-full overflow-hidden border-y-4 border-black/40"
      style={{ background: arena.bg }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="none">
        {Array.from({ length: COLS + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i} x2={i} y1={0} y2={ROWS} stroke="#000" strokeWidth={0.02} />
        ))}
        {Array.from({ length: ROWS + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={0} x2={COLS} y1={i} y2={i} stroke="#000" strokeWidth={0.02} />
        ))}
      </svg>

      {props.map((p, i) => {
        if (p.y > (RIVER_ROW / ROWS) * 100 - 4 && p.y < (RIVER_ROW / ROWS) * 100 + 8) return null;
        return (
          <span
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow"
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size }}
          >
            {propEmoji(p.kind)}
          </span>
        );
      })}

      {/* river */}
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: `${(RIVER_ROW / ROWS) * 100}%`,
          height: `${(1 / ROWS) * 100}%`,
          background: arena.biome === "legendary"
            ? "linear-gradient(90deg,#2a2420,#403832,#2a2420)"
            : "linear-gradient(90deg,#5aa3d4,#76b8e3,#5aa3d4)",
          boxShadow: "inset 0 0 8px rgba(0,0,0,.3)",
        }}
      />
      {BRIDGE_COLS.map((c) => (
        <div
          key={c}
          className="pointer-events-none absolute"
          style={{
            left: `${(c / COLS) * 100}%`,
            width: `${(1 / COLS) * 100}%`,
            top: `${(RIVER_ROW / ROWS) * 100}%`,
            height: `${(1 / ROWS) * 100}%`,
            background: arena.biome === "legendary" ? "#7a6a5a" : "#8b6a3d",
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,.4)",
          }}
        />
      ))}

      {arena.biome === "legendary" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-stone-700/80 border-b-2 border-black/40" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-stone-700/80 border-t-2 border-black/40" />
        </>
      )}

      {/* placement grid */}
      {onPlace && (
        <div className="absolute inset-0">
          {(() => {
            const tiles: { col: number; row: number }[] = [];
            const isMiner = selectedCardId === "madenci";
            if (isMiner) {
              // Miner can be placed on either player side or enemy side, just excluding the river!
              for (let r = 0; r < ROWS; r++) {
                if (r === RIVER_ROW) continue; // skip river row
                for (let c = 0; c < COLS; c++) {
                  tiles.push({ col: c, row: r });
                }
              }
            } else {
              // Other cards restricted to player side
              for (let r = RIVER_ROW + 1; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                  tiles.push({ col: c, row: r });
                }
              }
            }
            return tiles.map(({ col, row }, i) => (
              <button
                key={i}
                onClick={() => onPlace(col, row)}
                className="absolute border border-amber-200/30 bg-amber-200/5 hover:bg-amber-200/25"
                style={{
                  left: `${(col / COLS) * 100}%`,
                  top: `${(row / ROWS) * 100}%`,
                  width: `${(1 / COLS) * 100}%`,
                  height: `${(1 / ROWS) * 100}%`,
                }}
              />
            ));
          })()}
        </div>
      )}

      {/* projectiles */}
      {state.projectiles.map((p) => {
        const col = p.fromCol + (p.toCol - p.fromCol) * p.t;
        const row = p.fromRow + (p.toRow - p.fromRow) * p.t;
        const ang = Math.atan2(p.toRow - p.fromRow, p.toCol - p.fromCol) * (180 / Math.PI);
        return (
          <span
            key={p.uid}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-lg drop-shadow"
            style={{ left: `${cx(col)}%`, top: `${cy(row)}%`, transform: `translate(-50%,-50%) rotate(${ang}deg)` }}
          >
            {projectileEmoji(p)}
          </span>
        );
      })}

      {/* units */}
      {state.units.map((u) => {
        // If miner is underground, hide it completely! "gözükmez direkt"
        if (u.underground) return null;

        const isEmerging = u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0;
        const isImmune = u.immuneTimeLeft !== undefined && u.immuneTimeLeft > 0;
        const isDefending = u.zirhliDefendingTimeLeft !== undefined && u.zirhliDefendingTimeLeft > 0;
        const isFleeing = u.fleeTimeLeft !== undefined && u.fleeTimeLeft > 0;
        const hasAura = u.card.id === "bira-varili" && u.barrelAuraBoostTimeLeft !== undefined && u.barrelAuraBoostTimeLeft > 0;

        const isBird = u.card.id.startsWith("kus-ordusu");

        return (
          <div
            key={u.uid}
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none",
              isEmerging && "opacity-40 scale-110 animate-pulse" // transparently visible and pulsing when emerging!
            )}
            style={{
              left: `${cx(u.col)}%`,
              top: `${cy(u.row)}%`,
              transition: "opacity 150ms ease, transform 150ms ease",
            }}
          >
            <div className="relative">
              {/* Status visual rings / badges */}
              {isImmune && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-yellow-300 animate-pulse bg-yellow-400/20" />
              )}
              {isDefending && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-indigo-400 animate-pulse bg-indigo-500/25" />
              )}
              {isFleeing && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] bg-red-600 text-white rounded px-1 scale-90 font-display font-medium leading-none whitespace-nowrap">KAÇIYOR! 💨</div>
              )}
              {hasAura && (
                <div className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-amber-400 animate-spin bg-amber-500/10 duration-1000" />
              )}

              <span className={cn(
                "grid place-items-center rounded-full border-2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]",
                isBird ? "h-6.5 w-6.5 text-[15px] border-amber-200" : "h-9 w-9 text-2xl",
                u.side === "player" ? "border-blue-300 bg-blue-500/30" : "border-red-300 bg-red-500/30"
              )}>
                {u.card.emoji}
              </span>
              {u.isCharging && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[10px] animate-pulse">💨</div>
              )}
            </div>
            
            {/* HP bar */}
            {!isEmerging && (
              <div className={cn("mx-auto mt-0.5 h-1 rounded-full bg-black/60", isBird ? "w-6.5" : "w-9")}>
                <div
                  className={cn("h-full rounded-full", u.side === "player" ? "bg-emerald-400" : "bg-red-400")}
                  style={{ width: `${(u.hp / u.maxHp) * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
