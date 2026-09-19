const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const from = `          <div className="mt-4 mb-2">
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

const to = `          <div className="mt-2 mb-2">
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

text = text.replace(from, to);

fs.writeFileSync("src/components/home-tab.tsx", text);
