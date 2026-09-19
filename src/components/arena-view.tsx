import { useMemo, useState, type ReactNode } from "react";
import type { Arena } from "@/lib/arenas";
import { COLS, ROWS, RIVER_ROW, BRIDGE_COLS, type BattleState, type Projectile } from "@/lib/battle";
import { cn } from "@/lib/utils";

interface Props {
  arena: Arena;
  state: BattleState;
  onPlace?: (col: number, row: number) => void;
  selectedCardId?: string;
  mode?: "standard" | "tournament" | "ranked";
  targetingCharm?: string | null;
  onTargetCharmTile?: (col: number, row: number) => void;
  onTargetCharmUnit?: (unitUid: number) => void;
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
function projectileEmoji(p: Projectile): ReactNode {
  if (p.buyucuEffect === "burn") return "🔥";
  if (p.buyucuEffect === "slow") return "🧊";
  if (p.buyucuEffect === "normal") return "✨";
  switch (p.kind) {
    case "arrow": return "➶";
    case "stone": return "🪨";
    case "bullet":
      return (
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 border border-yellow-100 shadow-[0_0_8px_rgba(250,204,21,1)]" />
      );
    case "bomb": return "💣";
    case "fire": return "🔥";
    case "snowball": return "❄️";
    case "ice": return "🧊";
    case "tongue": return "👅";
    case "shuriken":
      return (
        <span className="inline-flex items-center justify-center animate-spin">
          <svg className="w-5 h-5 fill-slate-200 stroke-slate-800 stroke-[1.5] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" viewBox="0 0 24 24">
            <path d="M12 2 L13.8 8.5 L20 6 L15.5 10.2 L22 12 L15.5 13.8 L20 18 L13.8 15.5 L12 22 L10.2 15.5 L4 18 L8.5 13.8 L2 12 L8.5 10.2 L4 6 L10.2 8.5 Z" />
            <circle cx="12" cy="12" r="2.5" className="fill-slate-900" />
          </svg>
        </span>
      );
    case "blood":
      return (
        <span className="inline-block text-xl filter drop-shadow-[0_2px_6px_rgba(220,38,38,0.85)] animate-pulse">
          🩸
        </span>
      );
    case "bat":
      return "🦇";
    default:
      return "•";
  }
}

export function ArenaView({ 
  arena, 
  state, 
  onPlace, 
  selectedCardId, 
  mode,
  targetingCharm,
  onTargetCharmTile,
  onTargetCharmUnit,
}: Props) {
  const [hoveredTile, setHoveredTile] = useState<{col: number, row: number} | null>(null);
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
            const isCig = selectedCardId === "cig";
            if (isMiner || isCig) {
              // Miner can be placed on either player side or enemy side, just excluding the river
              // Cig can be placed literally anywhere
              for (let r = 0; r < ROWS; r++) {
                if (r === RIVER_ROW && !isCig) continue; // skip river row for miner
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
            return (
              <>
                {tiles.map(({ col, row }) => (
                  <button
                    key={`${col}_${row}`}
                    onClick={() => onPlace(col, row)}
                    onMouseEnter={() => setHoveredTile({ col, row })}
                    onMouseLeave={() => setHoveredTile(null)}
                    className="absolute border border-amber-200/30 bg-amber-200/5 hover:bg-amber-200/25 z-10"
                    style={{
                      left: `${(col / COLS) * 100}%`,
                      top: `${(row / ROWS) * 100}%`,
                      width: `${(1 / COLS) * 100}%`,
                      height: `${(1 / ROWS) * 100}%`,
                    }}
                  />
                ))}
                {isCig && hoveredTile && (
                  <div
                    className="absolute border-2 border-dashed border-blue-400 bg-blue-400/20 pointer-events-none z-0"
                    style={{
                      left: `${((hoveredTile.col - 2) / COLS) * 100}%`,
                      top: `${((hoveredTile.row - 2) / ROWS) * 100}%`,
                      width: `${(5 / COLS) * 100}%`,
                      height: `${(5 / ROWS) * 100}%`,
                    }}
                  />
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Bomba Charm: 4x4 Bomb targeting grid overlay */}
      {targetingCharm === "bomba" && onTargetCharmTile && (
        <div className="absolute inset-0 z-40">
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => (
              <button
                key={`bomb_tile_${c}_${r}`}
                onClick={() => onTargetCharmTile(c, r)}
                onMouseEnter={() => setHoveredTile({ col: c, row: r })}
                onMouseLeave={() => setHoveredTile(null)}
                className="absolute border border-red-500/20 bg-red-950/10 hover:bg-red-500/30 cursor-crosshair transition-colors"
                style={{
                  left: `${(c / COLS) * 100}%`,
                  top: `${(r / ROWS) * 100}%`,
                  width: `${(1 / COLS) * 100}%`,
                  height: `${(1 / ROWS) * 100}%`,
                }}
              />
            ))
          )}
          {hoveredTile && (
            <div
              className="absolute border-2 border-dashed border-red-500 bg-red-500/25 pointer-events-none z-40 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse"
              style={{
                left: `${((hoveredTile.col - 1.5) / COLS) * 100}%`,
                top: `${((hoveredTile.row - 1.5) / ROWS) * 100}%`,
                width: `${(4 / COLS) * 100}%`,
                height: `${(4 / ROWS) * 100}%`,
              }}
            >
              <div className="text-white font-mono font-bold text-[10px] bg-red-950/95 border border-red-500 px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                <span>💣</span> 4x4 (100 Hasar)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bomb active explosions on the arena */}
      {state.bombExplosions?.map((exp) => (
        <div
          key={exp.uid}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center"
          style={{
            left: `${cx(exp.col)}%`,
            top: `${cy(exp.row)}%`,
            width: `${(4 / COLS) * 100}%`,
            height: `${(4 / ROWS) * 100}%`,
          }}
        >
          <div className="w-full h-full rounded-full bg-orange-500/40 border-4 border-red-500 animate-ping" />
          <div className="absolute text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,1)] animate-bounce">💥</div>
        </div>
      ))}

      {/* Floating combat damage numbers (Hasar Göstergesi - Kompakt & Şık) */}
      {state.damagePopups?.map((pop) => {
        const prog = Math.min(1, Math.max(0, (state.time - pop.createdAt) / pop.duration));
        const fade = prog > 0.65 ? (1 - prog) / 0.35 : 1;
        const scale = 0.85 + 0.2 * Math.sin(prog * Math.PI);
        return (
          <div
            key={pop.id}
            className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 flex items-center font-display font-black leading-none select-none"
            style={{
              left: `${cx(pop.col + pop.xOffset)}%`,
              top: `${cy(pop.row + pop.yOffset - prog * 0.8)}%`,
              opacity: fade,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            <div className="flex items-center gap-0.5 bg-slate-950/80 border border-red-500/50 px-1 py-0.5 rounded shadow-sm">
              <span className="text-[9px] font-black text-red-400 leading-none">-</span>
              <span className="text-[9px] font-mono font-black text-rose-200 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-none">
                {pop.damage}
              </span>
            </div>
          </div>
        );
      })}

      {/* Active placed avalanches 5x5 indicators */}
      {state.units.map((u) => {
        if (u.hp <= 0) return null;
        if (u.card.id === "cig" && !u.cigTriggered) {
          return (
            <div
              key={`cig_range_${u.uid}`}
              className="absolute border-2 border-dashed border-sky-400 bg-sky-500/10 pointer-events-none z-0 rounded-full animate-pulse"
              style={{
                left: `${((u.col - 2) / COLS) * 100}%`,
                top: `${((u.row - 2) / ROWS) * 100}%`,
                width: `${(5 / COLS) * 100}%`,
                height: `${(5 / ROWS) * 100}%`,
              }}
            />
          );
        }
        return null;
      })}

      {/* projectiles */}
      {state.projectiles.map((p) => {
        const col = p.fromCol + (p.toCol - p.fromCol) * p.t;
        const row = p.fromRow + (p.toRow - p.fromRow) * p.t;
        const ang = Math.atan2(p.toRow - p.fromRow, p.toCol - p.fromCol) * (180 / Math.PI);
        return (
          <span
            key={p.uid}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-lg drop-shadow flex items-center justify-center"
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
        const isLanetli = state.lanetTimeLeft !== undefined && state.lanetTimeLeft > 0 && u.side !== state.lanetSide;
        
        const isBuffedByBarrel = state.units.some(
          (o) => o.side === u.side && o.hp > 0 && o.card.id === "bira-varili"
        );
        const hasBarrelAuraSuperBoost = state.units.some(
          (o) => o.side === u.side && o.hp > 0 && o.card.id === "bira-varili" && o.barrelAuraBoostTimeLeft !== undefined && o.barrelAuraBoostTimeLeft > 0
        );

        const hasKanMantariShield = state.units.some(
          (o) => o.side === u.side && o.hp > 0 && o.card.id === "kan-mantari"
        );
        const isWebbed = u.webbedByUid !== undefined;
        const isTarantulaAttached = u.card.id === "tarantula" && u.webbedTargetUid !== undefined;
        const isPoisoned = u.poisonTicksLeft !== undefined && u.poisonTicksLeft > 0;

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
        
        const isBuyucuInvis = u.card.id === "buyucu" && u.buyucuInvisTimeLeft !== undefined && u.buyucuInvisTimeLeft > 0;
        const isVampirInvis = u.card.id === "vampir" && u.vampirInvisTimeLeft !== undefined && u.vampirInvisTimeLeft > 0;
        const isInvisibleUnit = isInvisibleHayalet || isBuyucuInvis || isVampirInvis;
        const isKutsanmisSelectable = targetingCharm === "kutsanmislik" && u.side === "player" && u.hp > 0;

        return (
          <div
            key={u.uid}
            onClick={isKutsanmisSelectable ? () => onTargetCharmUnit?.(u.uid) : undefined}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 select-none transition-opacity duration-150",
              isKutsanmisSelectable ? "pointer-events-auto cursor-pointer z-50 hover:scale-110" : "pointer-events-none",
              isEmerging && "opacity-40 scale-110 animate-pulse", // transparently visible and pulsing when emerging!
              isInvisibleUnit && u.side !== "player" && "opacity-0 pointer-events-none",
              isInvisibleUnit && u.side === "player" && "opacity-30 grayscale blur-[0.3px]"
            )}
            style={{
              left: `${cx(u.col)}%`,
              top: `${cy(u.row)}%`,
              transition: "opacity 150ms ease, transform 150ms ease",
            }}
          >
            <div className="relative">
              {/* Kutsanmışlık: Sarı halkalar çıkar */}
              {u.kutsanmis && (
                <>
                  <div className="absolute inset-0 -m-3 rounded-full border-2 border-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.9)] animate-pulse pointer-events-none z-20" />
                  <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-spin pointer-events-none border-dashed z-20" style={{ animationDuration: "5s" }} />
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-300 bg-slate-950/95 border border-amber-400/90 px-1 py-0.2 rounded shadow whitespace-nowrap z-20">
                    ✨ Kutsanmış (2.5x)
                  </div>
                </>
              )}

              {/* Kutsanmışlık targeting selector indicator */}
              {isKutsanmisSelectable && !u.kutsanmis && (
                <div className="absolute inset-0 -m-2.5 rounded-full border-2 border-yellow-400 bg-yellow-400/30 animate-bounce pointer-events-none z-30" />
              )}

              {/* Status visual rings / badges */}
              {isVampirInvis && u.side === "player" && (
                <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-purple-500 bg-purple-950/40 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.7)] flex items-center justify-center pointer-events-none z-20">
                  <div className="absolute -top-3.5 text-[9px] font-black text-purple-300 bg-slate-950/90 border border-purple-500/60 px-1 py-0.2 rounded shadow whitespace-nowrap">
                    🦇 {u.vampirInvisTimeLeft?.toFixed(1)}s
                  </div>
                </div>
              )}
              {u.card.id === "golem" && (
                <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-slate-500 bg-gradient-to-br from-slate-600 to-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_2px_6px_rgba(0,0,0,0.6)] animate-pulse" />
              )}
              {u.card.id === "cig" && !u.cigTriggered && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <div className="text-white font-mono font-bold text-[10px] bg-slate-900/95 border border-slate-700 px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-bounce flex items-center gap-1">
                    <span>🏔️</span> Hazır
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
              {isLanetli && (
                <div className="absolute inset-0 -m-1.5 rounded-full border-4 border-black bg-black/15 shadow-[0_0_12px_4px_rgba(0,0,0,0.95)] animate-pulse z-10" />
              )}

              {/* Kan Mantarı timer on mushroom itself */}
              {u.card.id === "kan-mantari" && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20">
                  <div className="text-rose-200 font-mono font-black text-[9px] bg-rose-950/90 border border-rose-500/70 px-1.5 py-0.2 rounded shadow whitespace-nowrap animate-pulse">
                    🍄 {u.kanMantariLifeLeft?.toFixed(1) ?? "15.0"}s
                  </div>
                </div>
              )}

              {/* Bira Varili remaining duration timer */}
              {u.card.id === "bira-varili" && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20">
                  <div className="text-amber-200 font-mono font-black text-[9px] bg-amber-950/90 border border-amber-500/70 px-1.5 py-0.2 rounded shadow whitespace-nowrap animate-pulse">
                    🍺 {Math.max(0, 30 - (u.barrelAge || 0)).toFixed(1)}s
                  </div>
                </div>
              )}

              {/* Kan Mantarı 50% damage reduction aura on friendly team */}
              {hasKanMantariShield && u.card.id !== "kan-mantari" && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-rose-400 bg-rose-500/10 shadow-[0_0_10px_2px_rgba(244,63,94,0.5)] animate-pulse" />
              )}

              {/* Tarantula stuck to target effect */}
              {isTarantulaAttached && (
                <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-emerald-400 bg-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-300 bg-slate-950/90 border border-emerald-500/60 px-1 py-0.2 rounded shadow whitespace-nowrap">
                    🕷️ %70 Zırh
                  </div>
                </div>
              )}

              {/* Unit Webbed by Tarantula */}
              {isWebbed && (
                <div className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-white bg-slate-100/25 flex items-center justify-center pointer-events-none z-20 animate-spin-slow">
                  <span className="text-xl animate-pulse">🕸️</span>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-white bg-slate-950/90 border border-white/60 px-1 py-0.2 rounded shadow whitespace-nowrap">
                    🕸️ AĞDA (+50%)
                  </div>
                </div>
              )}

              {/* Poison effect with top label */}
              {isPoisoned && (
                <div className="absolute inset-0 -m-1 rounded-full border-2 border-lime-400 bg-lime-500/15 shadow-[0_0_8px_rgba(163,230,53,0.7)] animate-pulse pointer-events-none z-20">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-lime-300 bg-slate-950/95 border border-lime-500/80 px-1.5 py-0.2 rounded shadow whitespace-nowrap">
                    🧪 Zehir
                  </div>
                </div>
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
            
            {/* HP bar with live remaining HP number clearly visible (Kompakt ve Dengeli) */}
            {!isEmerging && (
              <div className={cn(
                "relative mx-auto mt-0.5 rounded-xs border border-black/80 bg-slate-950/90 overflow-hidden shadow-xs flex items-center justify-center",
                isSmall ? "w-5.5 h-1.5" : "w-7 h-2"
              )}>
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 rounded-xs transition-all duration-75",
                    u.side === "player" ? "bg-gradient-to-r from-emerald-500 to-green-400" : "bg-gradient-to-r from-red-600 to-rose-400"
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100))}%` }}
                />
                <span className="relative z-10 font-mono text-[6px] sm:text-[6.5px] font-black text-white leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,1)] tracking-tighter whitespace-nowrap pointer-events-none">
                  {Math.round(u.hp)}
                </span>
              </div>
            )}

            {/* Attack cooldown / Slingshot Setup timer (Kurulma Süresi Rozeti ve Çubuğu) */}
            {!isEmerging && u.setupTimeLeft !== undefined && u.setupTimeLeft > 0 ? (
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none z-30 whitespace-nowrap">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[6.5px] font-mono font-black leading-none shadow-md border bg-amber-950/95 text-amber-300 border-amber-400 animate-pulse">
                  <span className="text-[7px]">🔧</span>
                  <span>KURULUYOR: {u.setupTimeLeft.toFixed(1)}s</span>
                </div>
                <div className="w-9 h-1 bg-slate-950 rounded-full border border-amber-400/80 overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-75"
                    style={{
                      width: `${Math.max(0, Math.min(100, (1 - u.setupTimeLeft / (u.setupDuration || 4)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            ) : (
              !isEmerging && u.card.cd > 0 && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20 whitespace-nowrap">
                  <div className={cn(
                    "flex items-center gap-0.5 px-1 py-0.1 rounded-full text-[6.5px] font-mono font-bold leading-none shadow-xs border",
                    u.cdLeft > 0.05 
                      ? "bg-slate-950/85 text-amber-300 border-amber-500/40" 
                      : "bg-emerald-950/85 text-emerald-300 border-emerald-500/50 animate-pulse"
                  )}>
                    <span className="text-[6px]">⚔️</span>
                    <span>{u.cdLeft > 0.05 ? `${u.cdLeft.toFixed(1)}s` : "OK"}</span>
                  </div>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
