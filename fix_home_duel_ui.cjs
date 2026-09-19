const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const from = `  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-slate-950 overflow-y-auto overflow-x-hidden relative scrollbar-none">
      {!(inBattle && opponent) && (`;

const to = `  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-slate-950 overflow-y-auto overflow-x-hidden relative scrollbar-none">
      {/* Duel Invites UI */}
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
      )}
      
      {!(inBattle && opponent) && (`;

text = text.replace(from, to);

// also I need to verify that handleAcceptDuel is in the file.
fs.writeFileSync("src/components/home-tab.tsx", text);
