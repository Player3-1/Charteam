const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

// Fix Header
const headerFrom = `              <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px]">
                <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
                {(state.rankedStars !== undefined && state.rankedStars > 0) && (
                  <Stat icon="⭐" value={state.rankedStars} color="from-cyan-300 to-blue-500 text-cyan-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.35)] border-cyan-400/40" />
                )}
                <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
                <Stat icon="⭐" value={state.levelCoins || 0} color="from-emerald-300 to-green-500" />
              </div>`;

const headerTo = `              <div className="flex flex-wrap justify-end gap-1.5 max-w-[240px]">
                <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
                {(state.rankedStars !== undefined && state.rankedStars > 0) && (
                  <Stat icon="⭐" value={state.rankedStars} color="from-cyan-300 to-blue-500 text-cyan-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.35)] border-cyan-400/40" />
                )}
                <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
                <Stat icon="✨" value={state.levelCoins || 0} color="from-emerald-300 to-green-500" />
              </div>`;
text = text.replace(headerFrom, headerTo);

// Fix charms in deck header
const deckHeaderFrom = `          <div className="flex items-center justify-between">
            <h2 className="text-stroke text-2xl text-white flex items-center gap-2">
              <span>Deste</span>
              <span className={cn(
                "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm transition-colors",
                deckStoneCost > 20 
                  ? "bg-red-950/80 text-red-400 border-red-500/40" 
                  : deckStoneCost === 20 
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40" 
                    : "bg-indigo-950/80 text-cyan-300 border-indigo-400/30"
              )}>
                💎 {deckStoneCost}/20
              </span>
            </h2>
            <div className="flex gap-1">
              {Object.keys(decks ?? { "0": deck }).map((key) => {
                const index = parseInt(key);
                return (
                  <button
                    key={index}
                    onClick={() => setActiveDeck(index)}
                    className={cn(
                      "text-xs font-bold w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      index === activeDeckIndex
                        ? "bg-amber-500 text-amber-950 shadow-md scale-105"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 mb-2">
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider whitespace-nowrap">TILSIMLAR</span>
              {[0, 1].map((slot) => {
                const charmId = selectedCharms[slot];
                const charm = CHARMS.find((c) => c.id === charmId);
                return (
                  <button
                    key={slot}
                    className={cn("flex-1 panel-3d flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors", charm ? "bg-slate-800/80 hover:bg-slate-700" : "bg-slate-900/50 border border-dashed border-slate-700 hover:bg-slate-800")}
                    onClick={() => {
                      const newCharm = prompt("Tılsım seç:\\n" + CHARMS.filter(c => unlockedCharms.includes(c.id)).map(c => c.id + " - " + c.name).join("\\n"));
                      if (newCharm && unlockedCharms.includes(newCharm)) {
                        setCharmSlot(slot, newCharm);
                      }
                    }}
                  >
                    {charm ? (
                      <>
                        <span className="text-sm leading-none">{charm.emoji}</span>
                        <span className="text-[10px] font-bold text-white leading-none truncate">{charm.name}</span>
                      </>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold uppercase w-full text-center">Boş</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>`;

const deckHeaderTo = `          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-stroke text-2xl text-white flex items-center gap-2">
                <span>Deste</span>
                <span className={cn(
                  "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm transition-colors",
                  deckStoneCost > 20 
                    ? "bg-red-950/80 text-red-400 border-red-500/40" 
                    : deckStoneCost === 20 
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40" 
                      : "bg-indigo-950/80 text-cyan-300 border-indigo-400/30"
                )}>
                  💎 {deckStoneCost}/20
                </span>
                
                {/* Charms inline */}
                <div className="flex gap-1 ml-1">
                  {[0, 1].map((slot) => {
                    const charmId = selectedCharms[slot];
                    const charm = CHARMS.find((c) => c.id === charmId);
                    return (
                      <button
                        key={slot}
                        className={cn("w-7 h-7 flex justify-center items-center rounded-md border border-slate-700/50 transition-colors shadow-inner", charm ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-900/40 border-dashed hover:bg-slate-800")}
                        onClick={() => {
                          const newCharm = prompt("Tılsım seç:\\n" + CHARMS.filter(c => unlockedCharms.includes(c.id)).map(c => c.id + " - " + c.name).join("\\n"));
                          if (newCharm && unlockedCharms.includes(newCharm)) {
                            setCharmSlot(slot, newCharm);
                          }
                        }}
                      >
                        {charm ? (
                          <span className="text-sm drop-shadow-md">{charm.emoji}</span>
                        ) : (
                          <span className="text-[8px] text-slate-500 font-bold uppercase">Boş</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </h2>
              
              <div className="flex gap-1">
                {Object.keys(decks ?? { "0": deck }).map((key) => {
                  const index = parseInt(key);
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveDeck(index)}
                      className={cn(
                        "text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                        index === activeDeckIndex
                          ? "bg-amber-500 text-amber-950 shadow-md scale-105"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>`;

text = text.replace(deckHeaderFrom, deckHeaderTo);
fs.writeFileSync("src/components/home-tab.tsx", text);
