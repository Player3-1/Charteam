import { useMemo } from "react";
import type { Arena } from "@/lib/arenas";
import { COLS, ROWS, RIVER_ROW, BRIDGE_COLS, type BattleState, type Projectile } from "@/lib/battle";
import { cn } from "@/lib/utils";

interface Props {
  arena: Arena;
  state: BattleState;
  onPlace?: (col: number, row: number) => void;
  selectedCardId?: string;
  mode?: "standard" | "tournament" | "ranked";
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
  if (biome === "snow") return r < 0.4 ? "snow-tree" : r < 0.65 ? "rock-snow" : r < 0.85 ? "snow-pile" : "icicle";
  if (biome === "sea") return r < 0.4 ? "coral" : r < 0.65 ? "shell" : r < 0.85 ? "seaweed" : "starfish";
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
    case "icicle": return "🧊";
    case "coral": return "🪸";
    case "shell": return "🐚";
    case "seaweed": return "🌿";
    case "starfish": return "⭐";
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
    case "snowball": return "❄️";
    case "ice": return "🧊";
    case "tongue": return "👅";
  }
}

export function ArenaView({ arena, state, onPlace, selectedCardId, mode }: Props) {
  const props = useProps(arena.biome);
  const cx = (col: number) => ((col + 0.5) / COLS) * 100;
  const cy = (row: number) => ((row + 0.5) / ROWS) * 100;

  const isRanked = mode === "ranked";

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden border-y-4 transition-all duration-500",
        isRanked ? "border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.4)]" : "border-black/40"
      )}
      style={{ 
        background: isRanked 
          ? "radial-gradient(circle at center, #07162c 0%, #020617 100%)" 
          : arena.bg 
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="none">
        {Array.from({ length: COLS + 1 }).map((_, i) => (
          <line 
            key={`v${i}`} 
            x1={i} 
            x2={i} 
            y1={0} 
            y2={ROWS} 
            stroke={isRanked ? "#06b6d4" : "#000"} 
            strokeWidth={0.02} 
          />
        ))}
        {Array.from({ length: ROWS + 1 }).map((_, i) => (
          <line 
            key={`h${i}`} 
            x1={0} 
            x2={COLS} 
            y1={i} 
            y2={i} 
            stroke={isRanked ? "#06b6d4" : "#000"} 
            strokeWidth={0.02} 
          />
        ))}
      </svg>

      {/* Decorative elements for Ranked Mode removed */}

      {!isRanked && props.map((p, i) => {
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
        className="pointer-events-none absolute left-0 right-0 transition-all duration-500"
        style={{
          top: `${(RIVER_ROW / ROWS) * 100}%`,
          height: `${(1 / ROWS) * 100}%`,
          background: isRanked
            ? "linear-gradient(90deg, #0284c7, #06b6d4, #0284c7)"
            : (arena.biome === "legendary"
              ? "linear-gradient(90deg,#2a2420,#403832,#2a2420)"
              : "linear-gradient(90deg,#5aa3d4,#76b8e3,#5aa3d4)"),
          boxShadow: isRanked 
            ? "0 0 15px rgba(6,182,212,0.6), inset 0 0 10px rgba(255,255,255,0.4)" 
            : "inset 0 0 8px rgba(0,0,0,.3)",
        }}
      />
      {BRIDGE_COLS.map((c) => (
        <div
          key={c}
          className="pointer-events-none absolute border-x transition-all duration-500"
          style={{
            left: `${(c / COLS) * 100}%`,
            width: `${(1 / COLS) * 100}%`,
            top: `${(RIVER_ROW / ROWS) * 100}%`,
            height: `${(1 / ROWS) * 100}%`,
            background: isRanked 
              ? "linear-gradient(180deg, #0f172a, #1e293b)" 
              : (arena.biome === "legendary" ? "#7a6a5a" : "#8b6a3d"),
            borderColor: isRanked ? "#eab308" : "transparent",
            boxShadow: isRanked 
              ? "0 0 10px rgba(234, 179, 8, 0.5), inset 0 -2px 0 rgba(0,0,0,.4)" 
              : "inset 0 -2px 0 rgba(0,0,0,.4)",
          }}
        />
      ))}

      {arena.biome === "legendary" && !isRanked && (
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
            return tiles.map(({ col, row }) => (
              <button
                key={`${col}_${row}`}
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

      {/* Lasers and Tongues (Global Layer) */}
      {state.units.map((u) => {
        if (u.hp <= 0) return null;

        // Frog Tongue
        const isTonguing = u.tongueTimeLeft !== undefined && u.tongueTimeLeft > 0;
        if (isTonguing && u.swallowingTargetUid) {
          const target = state.units.find(e => e.uid === u.swallowingTargetUid);
          if (target) {
            const startX = cx(u.col);
            const startY = cy(u.row);
            const endX = cx(target.col);
            const endY = cy(target.row);
            const dx = endX - startX;
            const dy = endY - startY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ang = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <div
                key={`tongue-${u.uid}`}
                className="pointer-events-none absolute bg-pink-500 rounded-full"
                style={{
                  left: `${startX}%`,
                  top: `${startY}%`,
                  width: `${len}%`,
                  height: "4px",
                  transform: `rotate(${ang}deg)`,
                  transformOrigin: "0 50%",
                  zIndex: 9,
                }}
              />
            );
          }
        }

        return null;
      })}

      {/* units */}
      {state.units.map((u) => {
        // If miner is underground or still emerging, hide it completely!
        if (u.underground || (u.card.id === "madenci" && u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0)) {
          return null;
        }

        const isEmerging = u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0;
        const isTonguing = u.tongueTimeLeft !== undefined && u.tongueTimeLeft > 0;
        const isImmune = u.immuneTimeLeft !== undefined && u.immuneTimeLeft > 0;
        const isFrozen = u.frozenTimeLeft !== undefined && u.frozenTimeLeft > 0;
        const isDefending = u.zirhliDefendingTimeLeft !== undefined && u.zirhliDefendingTimeLeft > 0;
        const isFleeing = u.fleeTimeLeft !== undefined && u.fleeTimeLeft > 0;
        const isBurning = u.burningTicksLeft !== undefined && u.burningTicksLeft > 0;
        const hasAura = u.card.id === "bira-varili" && u.barrelAuraBoostTimeLeft !== undefined && u.barrelAuraBoostTimeLeft > 0;

        const isSmall = u.card.id.startsWith("kus-ordusu") || u.card.id.startsWith("karinca") || u.card.id.startsWith("kabile");
        
        const isBuffedByBarrel = state.units.some(
          (o) => o.side === u.side && o.hp > 0 && o.card.id === "bira-varili"
        );
        const hasBarrelAuraSuperBoost = state.units.some(
          (o) => o.side === u.side && o.hp > 0 && o.card.id === "bira-varili" && o.barrelAuraBoostTimeLeft !== undefined && o.barrelAuraBoostTimeLeft > 0
        );

        let isInvisibleHayalet = false;
        if (u.card.id === "hayalet") {
          const aliveUnits = state.units.filter(e => e.hp > 0);
          const isOnlyHayaletLeft = aliveUnits.length === 1 && aliveUnits[0].uid === u.uid;
          if (isOnlyHayaletLeft) {
            isInvisibleHayalet = false; // Always visible if it's the only one left
          } else if (isImmune) {
            // invisible when ability is active
            isInvisibleHayalet = true;
          } else {
            if (u.hayaletRevealedByUid === undefined) {
              isInvisibleHayalet = true;
            }
          }
        }

        return (
          <div
            key={u.uid}
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none transition-opacity duration-150",
              isEmerging && "opacity-40 scale-110 animate-pulse", // transparently visible and pulsing when emerging!
              isInvisibleHayalet && u.side !== "player" && "opacity-0",
              isInvisibleHayalet && u.side === "player" && "opacity-40 grayscale"
            )}
            style={{
              left: `${cx(u.col)}%`,
              top: `${cy(u.row)}%`,
              transition: "opacity 150ms ease, transform 150ms ease",
            }}
          >
            <div className="relative">
              {/* Status visual rings / badges */}
              {u.card.id === "golem" && (
                <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-slate-500 bg-gradient-to-br from-slate-600 to-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_2px_6px_rgba(0,0,0,0.6)] animate-pulse" />
              )}
              {u.card.id === "cig" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border-2 border-dashed border-sky-400 bg-sky-500/10 flex items-center justify-center animate-pulse">
                  <div className="text-white font-mono font-bold text-[10px] bg-slate-900/95 border border-slate-700 px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-bounce flex items-center gap-1">
                    <span>🏔️</span> {Math.max(0, 5 - Math.floor(state.time))}s
                  </div>
                </div>
              )}
              {isImmune && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-yellow-300 animate-pulse bg-yellow-400/20" />
              )}
              {isFrozen && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-cyan-400 animate-pulse bg-cyan-500/20" />
              )}
              {isDefending && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-indigo-400 animate-pulse bg-indigo-500/25" />
              )}
              {isBuffedByBarrel && u.card.id !== "bira-varili" && (
                <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-yellow-400 bg-yellow-400/15 shadow-[0_0_10px_2px_rgba(234,179,8,0.65)] animate-pulse" />
              )}
              {isBurning && (
                <>
                  <div className="absolute -top-2.5 -left-2.5 text-xs animate-bounce" style={{ animationDelay: "0ms" }}>🔥</div>
                  <div className="absolute -top-2.5 -right-2.5 text-xs animate-bounce" style={{ animationDelay: "150ms" }}>🔥</div>
                  <div className="absolute -bottom-2.5 -left-2.5 text-xs animate-bounce" style={{ animationDelay: "300ms" }}>🔥</div>
                  <div className="absolute -bottom-2.5 -right-2.5 text-xs animate-bounce" style={{ animationDelay: "450ms" }}>🔥</div>
                  <div className="absolute inset-0 -m-1 rounded-full border-2 border-orange-500 bg-orange-600/10 animate-pulse shadow-[0_0_10px_1px_rgba(249,115,22,0.6)]" />
                </>
              )}
              {isFleeing && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] bg-red-600 text-white rounded px-1 scale-90 font-display font-medium leading-none whitespace-nowrap">KAÇIYOR! 💨</div>
              )}
              {isTonguing && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-pulse">👅</div>
              )}
              {hasAura && (
                <div className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-amber-400 animate-spin bg-amber-500/10 duration-1000" />
              )}

              <span className={cn(
                "grid place-items-center rounded-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]",
                isSmall ? "h-6.5 w-6.5 text-[15px]" : "h-9 w-9 text-2xl",
                isBuffedByBarrel && "ring-2 ring-yellow-400 bg-yellow-500/20"
              )}>
                {u.card.emoji}
              </span>
              {u.isCharging && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[10px] animate-pulse">💨</div>
              )}
            </div>
            
            {/* HP bar */}
            {!isEmerging && (
              <div className={cn("mx-auto mt-0.5 h-1 rounded-full bg-black/60", isSmall ? "w-6.5" : "w-9")}>
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
