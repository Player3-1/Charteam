const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

// Change header stats to fit 4 items better if ranked stars is active
const headerFrom = `              <div className="flex gap-2">
                <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
                {(state.rankedStars !== undefined && state.rankedStars > 0) && (
                  <Stat icon="⭐" value={state.rankedStars} color="from-cyan-300 to-blue-500 text-cyan-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.35)] border-cyan-400/40" />
                )}
                <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
                <Stat icon="🪙" value={state.levelCoins || 0} color="from-emerald-300 to-green-500" />
              </div>`;

const headerTo = `              <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px]">
                <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
                {(state.rankedStars !== undefined && state.rankedStars > 0) && (
                  <Stat icon="⭐" value={state.rankedStars} color="from-cyan-300 to-blue-500 text-cyan-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.35)] border-cyan-400/40" />
                )}
                <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
                <Stat icon="⭐" value={state.levelCoins || 0} color="from-emerald-300 to-green-500" />
              </div>`;

text = text.replace(headerFrom, headerTo);

// Also change Stat component to not break line if it wraps
const statFrom = `function Stat({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-slate-900 bg-gradient-to-br shadow-inner", color)}>
      <span className="text-sm drop-shadow-md">{icon}</span>
      <span className="font-mono">{value.toLocaleString("tr-TR")}</span>
    </div>
  );
}`;

const statTo = `function Stat({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-slate-900 bg-gradient-to-br shadow-inner whitespace-nowrap shrink-0", color)}>
      <span className="text-xs drop-shadow-md">{icon}</span>
      <span className="font-mono tracking-tight">{value.toLocaleString("tr-TR")}</span>
    </div>
  );
}`;

text = text.replace(statFrom, statTo);

fs.writeFileSync("src/components/home-tab.tsx", text);
