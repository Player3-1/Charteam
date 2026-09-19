const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

// Fix Duel UI
const duelFrom = `{/* Duel Invites UI */}
      {incomingDuels.length > 0 && !inBattle && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4">
          {incomingDuels.map(duel => (
            <div key={duel.id} className="bg-indigo-950/90 border border-indigo-500/50 rounded-xl p-4 shadow-2xl mb-2 backdrop-blur-md">
              <div className="text-center mb-3">
                <span className="font-bold text-white text-lg">{duel.challenger}</span>
                <span className="text-slate-300 ml-1">seni 1v1 Düelloya davet ediyor!</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => declineDuel(duel.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold">Reddet</button>
                <button onClick={() => handleAcceptDuel(duel)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20">Kabul Et</button>
              </div>
            </div>
          ))}
        </div>
      )}`;

const duelTo = `{/* Duel Invites UI */}
      {incomingDuels.length > 0 && !inBattle && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-xs px-2">
          {incomingDuels.map(duel => (
            <div key={duel.id} className="bg-indigo-950/95 border border-indigo-500/50 rounded-xl p-2.5 shadow-2xl mb-2 backdrop-blur-md flex flex-col gap-2">
              <div className="text-center flex-1">
                <span className="font-bold text-white text-sm">{duel.challenger}</span>
                <span className="text-indigo-200 text-xs ml-1 block leading-tight">1v1 davet etti!</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => declineDuel(duel.id)} className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-xs font-bold transition-colors">Reddet</button>
                <button onClick={() => handleAcceptDuel(duel)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all">Kabul Et</button>
              </div>
            </div>
          ))}
        </div>
      )}`;

text = text.replace(duelFrom, duelTo);

// Add charms and coins to ChestsTab
const charmsShop = `
      <div className="space-y-3 pt-6 border-t border-slate-800">
        <h2 className="text-stroke text-2xl text-white font-display">Tılsım Mağazası</h2>
        <p className="text-xs text-amber-200/80">Savaşta avantaj sağlayan Tılsımları satın alabilirsiniz.</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {CHARMS.filter(c => c.id !== "kuvvet" && c.id !== "saglik").map((charm) => {
            const hasCharm = (unlockedCharms || []).includes(charm.id);
            const can = !hasCharm && gold >= 5000;
            return (
              <div key={charm.id} className="panel-3d flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-center hover:border-slate-500 transition-all">
                <div className="py-2 flex items-center justify-center text-4xl">
                  {charm.emoji}
                </div>
                <div className="text-sm font-bold text-white">{charm.name}</div>
                <button
                  onClick={() => onBuyCharm(charm.id, 5000)}
                  disabled={hasCharm || !can}
                  className={cn(
                    "mt-1 w-full rounded-xl px-2 py-1.5 text-xs font-display text-primary-foreground text-stroke whitespace-nowrap",
                    hasCharm ? "bg-slate-700 text-slate-300" : "btn-pop active:btn-pop-active",
                    !hasCharm && !can && "opacity-50"
                  )}
                >
                  {hasCharm ? "Sahipsin" : \`🪙 5.000\`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="space-y-3 pt-6 border-t border-slate-800">
        <div className="panel-3d flex items-center gap-3 rounded-2xl p-3 bg-gradient-to-br from-indigo-900/90 to-indigo-950/90">
           <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-800 to-indigo-950 text-4xl shadow-inner border border-indigo-500/50">
             ⭐
           </div>
           <div className="flex-1 min-w-0">
             <div className="font-display text-base text-white font-bold">Level Jetonu Al</div>
             <div className="text-[10px] text-indigo-200/80 mb-1 leading-tight">
               Kartlarının levelini yükseltmek için kullanılan nadir jeton. Sahip: {levelCoins}
             </div>
             <button
               onClick={() => onBuyLevelCoins(1000, 10)}
               disabled={gold < 1000}
               className={cn(
                 "mt-1 rounded-xl px-4 py-1.5 text-xs font-display text-primary-foreground text-stroke",
                 "btn-pop active:btn-pop-active",
                 gold < 1000 && "opacity-50",
               )}
             >
               🪙 1.000 <span className="text-white ml-1">➔ 10 Jeton</span>
             </button>
           </div>
        </div>
      </div>
`;

text = text.replace('</p>\n        \n        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">', '</p>\n        \n        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">'); // Do nothing
const shopSearch = `      <div className="space-y-3 pt-6 border-t border-slate-800">
        <h2 className="text-stroke text-2xl text-white font-display">Emoji Mağazası</h2>`;

text = text.replace(shopSearch, charmsShop + "\n" + shopSearch);

fs.writeFileSync("src/components/home-tab.tsx", text);
