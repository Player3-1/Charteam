import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { UserData } from "@/types";
import { cn } from "@/lib/utils";
import { GameCard } from "@/components/game-card";
import { CARDS } from "@/lib/cards";

export function LeaderboardTab() {
  const [topPlayers, setTopPlayers] = useState<UserData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      const q = query(collection(db, "users"), orderBy("trophies", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const players: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        players.push({
          username: data.username || "Oyuncu",
          gold: data.gold ?? 0,
          trophies: data.trophies ?? 0,
          collection: data.collection ?? {},
          deck: data.deck ?? ["mizrakli", "kilicli", "okcu", "dev"],
          wins: data.wins ?? 0,
          losses: data.losses ?? 0,
        });
      });
      setTopPlayers(players);
    };
    fetchTopPlayers();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-stroke text-2xl text-white">Dünya İlk 10</h2>
      {topPlayers.map((player, i) => (
        <div key={player.username} className="panel-3d flex items-center justify-between rounded-xl p-4 bg-slate-800">
          <div className="flex items-center gap-3">
             <div className="text-2xl font-black text-amber-400">#{i + 1}</div>
             <div>
                <div className="font-display text-lg text-white">{player.username}</div>
                <div className="text-sm text-amber-200">{player.trophies} 🏆</div>
             </div>
          </div>
          <button 
            onClick={() => setSelectedPlayer(player)}
            className="bg-emerald-600 px-3 py-1 rounded text-white text-sm font-bold"
          >
            Profil
          </button>
        </div>
      ))}
      
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="rounded-xl bg-slate-900 p-6 shadow-xl w-full max-w-sm">
             <h2 className="text-2xl font-bold text-white text-center mb-4">{selectedPlayer.username}</h2>
             <div className="text-center text-amber-300 font-bold mb-2">{selectedPlayer.trophies} 🏆 · {selectedPlayer.gold} 🪙</div>
             <div className="text-center text-slate-300 font-bold mb-4">{selectedPlayer.wins} Galibiyet / {selectedPlayer.losses} Mağlubiyet ({selectedPlayer.wins + selectedPlayer.losses > 0 ? Math.round((selectedPlayer.wins / (selectedPlayer.wins + selectedPlayer.losses)) * 100) : 0}% Win Rate)</div>
             <div className="grid grid-cols-4 gap-2">
                {selectedPlayer.deck.map((cardId, index) => {
                  const card = CARDS.find((c) => c.id === cardId);
                  return card ? <GameCard key={`${cardId}_${index}`} card={card} size="sm" /> : null
                })}
             </div>
             <button onClick={() => setSelectedPlayer(null)} className="mt-4 w-full rounded bg-slate-700 p-2 text-white font-bold">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
