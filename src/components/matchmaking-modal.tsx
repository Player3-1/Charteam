import { useState, useEffect } from "react";
import { UserData } from "@/types";
import { findOrCreateMatch, cancelMatchmaking } from "@/lib/matchmaking";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { makeOpponentTrophies } from "@/lib/arenas";

export const MatchmakingModal = ({ 
  user,
  mode = "standard",
  onMatchFound, 
  onCancel 
}: { 
  user: UserData,
  mode?: "standard" | "tournament" | "ranked",
  onMatchFound: (opponent: {name: string, trophies: number, rankedStars?: number, wins?: number, tournamentWins?: number, battleId?: string, isPlayer1?: boolean, mode?: "standard" | "tournament" | "ranked"}) => void, 
  onCancel: () => void 
}) => {
  const [status, setStatus] = useState(
    mode === "tournament" 
      ? "Turnuva için rakip aranıyor..." 
      : (mode === "ranked" ? "Aşamalı Mod için rakip aranıyor..." : "Çevrimiçi rakip aranıyor...")
  );
  const [showBotButton, setShowBotButton] = useState(false);
  const [battleIdState, setBattleIdState] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const doMatchmaking = async () => {
      try {
        const battleId = await findOrCreateMatch(user, mode);
        if (!active) return;
        setBattleIdState(battleId);
        setStatus("Rakip bulundu, savaşa bağlanılıyor...");
        
        // Listen to battle doc to get opponent data
        const unsub = onSnapshot(doc(db, "battles", battleId), (d) => {
          if (d.exists() && active) {
            const data = d.data();
            const isP1 = data.player1.username === user.username;
            const opp = isP1 ? data.player2 : data.player1;
            unsub();
            onMatchFound({
              name: opp.username,
              trophies: opp.trophies,
              rankedStars: opp.rankedStars ?? 0,
              wins: opp.wins ?? 0,
              tournamentWins: opp.tournamentWins ?? 0,
              battleId,
              isPlayer1: isP1,
              mode: mode
            });
          }
        });
      } catch (e) {
        console.error(e);
      }
    };
    
    doMatchmaking();

    const timer = setTimeout(() => {
      if (active) {
        setShowBotButton(true);
        setStatus(
          mode === "tournament" 
            ? "Turnuva için rakip aranıyor... (Rakip bulunamazsa botla oynayabilirsiniz)" 
            : (mode === "ranked" ? "Aşamalı Mod için rakip aranıyor... (Gerçek rakip bulunamazsa botla oynayabilirsiniz)" : "Rakip aranıyor... (Gerçek rakip bulunamazsa botla oynayabilirsiniz)")
        );
      }
    }, 5000);

    return () => {
      active = false;
      clearTimeout(timer);
      cancelMatchmaking(user.username);
    };
  }, [user, mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="rounded-xl bg-slate-900 p-6 text-center shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold text-white mb-4">{status}</h2>
        {showBotButton && (
          <button 
            onClick={() => {
              cancelMatchmaking(user.username);
              const oppTrophies = makeOpponentTrophies(user.trophies);
              const oppRankedStars = Math.max(0, oppTrophies > 1000 ? Math.floor(Math.random() * 50) : 0);
              onMatchFound({name: "Bot", trophies: oppTrophies, rankedStars: oppRankedStars, mode});
            }}
            className="mt-4 rounded bg-emerald-600 px-4 py-3 font-bold text-white block w-full"
          >
            Bot ile Savaş
          </button>
        )}
        <button onClick={onCancel} className="mt-4 text-sm text-slate-400 p-2 w-full">İptal</button>
      </div>
    </div>
  );
};
