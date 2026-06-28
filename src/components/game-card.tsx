import type { CardDef, Rarity } from "@/lib/cards";
import { RARITY_LABEL } from "@/lib/cards";
import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<Rarity, { ring: string; banner: string; glow: string }> = {
  common: {
    ring: "ring-rarity-common/70",
    banner: "bg-rarity-common text-slate-900",
    glow: "shadow-[0_0_24px_-6px_oklch(0.70_0.04_250)]",
  },
  rare: {
    ring: "ring-rarity-rare",
    banner: "bg-rarity-rare text-amber-950",
    glow: "shadow-[0_0_32px_-6px_oklch(0.70_0.18_50)]",
  },
  epic: {
    ring: "ring-rarity-epic",
    banner: "bg-rarity-epic text-white",
    glow: "shadow-[0_0_36px_-4px_oklch(0.62_0.22_310)]",
  },
  legendary: {
    ring: "ring-rarity-legendary",
    banner:
      "bg-gradient-to-r from-rarity-legendary via-orange-300 to-rarity-legendary text-amber-950",
    glow: "shadow-[0_0_44px_-2px_oklch(0.78_0.18_90)]",
  },
};

interface Props {
  card: CardDef;
  size?: "sm" | "md" | "lg";
  owned?: number;
  locked?: boolean;
  lockedAtArena?: number;
  selected?: boolean;
  onClick?: () => void;
  key?: any;
  level?: number;
}

export function GameCard({ card, size = "md", owned, locked, lockedAtArena, selected, onClick, level }: Props) {
  const s = RARITY_STYLES[card.rarity];
  const dims = size === "sm" ? "w-20" : size === "lg" ? "w-44" : "w-28";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative shrink-0 rounded-xl text-left transition-transform",
        "ring-4 ring-offset-2 ring-offset-background",
        s.ring,
        s.glow,
        dims,
        locked && "opacity-50 grayscale",
        selected && "opacity-60 grayscale scale-95",
        onClick && "hover:-translate-y-1 active:translate-y-0",
      )}
    >
      {level !== undefined && (
        <div className="absolute left-1 top-1 rounded bg-slate-900/90 border border-slate-700/50 px-1 py-0.5 text-[8px] font-black text-amber-400 shadow z-10 font-mono">
          LV.{level}
        </div>
      )}
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
          <span className="text-white text-xs font-bold font-display text-center p-2">
            {lockedAtArena ? `Arena ${lockedAtArena}'de açılır` : "Kilitli"}
          </span>
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[1px]">
          <span className="bg-amber-500 text-amber-950 font-display font-black text-[11px] px-2 py-0.5 rounded-full border border-black shadow-lg uppercase tracking-wider scale-105">
            SEÇİLİ
          </span>
        </div>
      )}
      <div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-t-xl",
          "bg-gradient-to-b from-secondary to-card",
          "flex items-end justify-center",
        )}
      >
        <span className={cn(
          "absolute inset-0 flex items-center justify-center drop-shadow-[0_4px_6px_oklch(0_0_0_/_0.5)]",
          size === "sm" ? "text-4xl" : size === "lg" ? "text-7xl" : "text-5xl",
        )}>
          {card.emoji}
        </span>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />
        <div className="absolute inset-x-1 bottom-1 flex justify-between text-[10px] font-bold">
          <span className="rounded bg-red-600/90 px-1.5 py-0.5 text-white shadow">
            ♥ {card.hp}
          </span>
          <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-amber-950 shadow">
            ⚔ {card.dmg}
          </span>
        </div>
        {owned !== undefined && size !== "sm" && (
          <div className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            x{owned}
          </div>
        )}
      </div>
      <div
        className={cn(
          "rounded-b-xl border-t border-black/30 px-2 py-1 text-center font-display",
          s.banner,
          size === "sm" ? "text-[10px]" : "text-xs",
        )}
      >
        <div className="truncate">{card.name}</div>
        {size !== "sm" && (
          <div className="text-[9px] uppercase tracking-wider opacity-80">
            {RARITY_LABEL[card.rarity]}
          </div>
        )}
      </div>
    </button>
  );
}
