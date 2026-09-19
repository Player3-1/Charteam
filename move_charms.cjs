const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

// I need to cut the Charms section:
const charmsStart = `      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-stroke text-2xl text-white">Tılsımlar (Charms)</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[0, 1].map((slot) => {
            const charmId = selectedCharms[slot];
            const charm = CHARMS.find((c) => c.id === charmId);
            return (
              <button
                key={slot}
                className={cn("panel-3d flex items-center justify-center p-3 rounded-xl", charm ? "bg-slate-800" : "bg-slate-900 border-dashed border-2 border-slate-700 opacity-50")}
                onClick={() => {
                  const newCharm = prompt("Tılsım seç:\\n" + CHARMS.filter(c => unlockedCharms.includes(c.id)).map(c => c.id + " - " + c.name).join("\\n"));
                  if (newCharm && unlockedCharms.includes(newCharm)) {
                    setCharmSlot(slot, newCharm);
                  }
                }}
              >
                {charm ? (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">{charm.emoji}</span>
                    <span className="text-xs font-bold text-white mt-1">{charm.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Tılsım Seç</span>
                )}
              </button>
            );
          })}
        </div>
      </section>`;

// Target location: right below <div className="flex gap-1"> {deck number map} ... </div> and before the paragraph

const targetLocationStr = `            <div className="flex gap-1">
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
          </div>`;

const newTargetStr = targetLocationStr + `\n\n          <div className="mt-4 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-amber-200/80 font-bold uppercase tracking-wider">TILSIMLAR</span>
              <div className="h-px bg-slate-700 flex-1"></div>
            </div>
            <div className="flex gap-2">
              {[0, 1].map((slot) => {
                const charmId = selectedCharms[slot];
                const charm = CHARMS.find((c) => c.id === charmId);
                return (
                  <button
                    key={slot}
                    className={cn("flex-1 panel-3d flex items-center gap-2 px-3 py-2 rounded-lg transition-colors", charm ? "bg-slate-800/80 hover:bg-slate-700" : "bg-slate-900/50 border border-dashed border-slate-700 hover:bg-slate-800")}
                    onClick={() => {
                      const newCharm = prompt("Tılsım seç:\\n" + CHARMS.filter(c => unlockedCharms.includes(c.id)).map(c => c.id + " - " + c.name).join("\\n"));
                      if (newCharm && unlockedCharms.includes(newCharm)) {
                        setCharmSlot(slot, newCharm);
                      }
                    }}
                  >
                    {charm ? (
                      <>
                        <span className="text-xl leading-none">{charm.emoji}</span>
                        <span className="text-xs font-bold text-white leading-none whitespace-nowrap">{charm.name}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase w-full text-center">Boş Yuva</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>`;

text = text.replace(charmsStart + "\n", "");
text = text.replace(charmsStart, "");
text = text.replace(targetLocationStr, newTargetStr);

fs.writeFileSync("src/components/home-tab.tsx", text);
