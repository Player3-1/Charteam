import { useState, useEffect } from "react";
import { UserData } from "@/types";
import { findOrCreateMatch, cancelMatchmaking } from "@/lib/matchmaking";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { makeOpponentTrophies } from "@/lib/arenas";

export const MatchmakingModal = ({ 
  user,
  onMatchFound, 
  onCancel 
}: { 
  user: UserData,
  onMatchFound: (opponent: {name: string, trophies: number, battleId?: string, isPlayer1?: boolean}) => void, 
  onCancel: () => void 
}) => {
  const [status, setStatus] = useState("Çevrimiçi rakip aranıyor...");
  const [showBotButton, setShowBotButton] = useState(false);
  const [battleIdState, setBattleIdState] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const doMatchmaking = async () => {
      try {
        const battleId = await findOrCreateMatch(user);
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
              battleId,
              isPlayer1: isP1
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
        setStatus("Rakip aranıyor... (Gerçek rakip bulunamazsa botla oynayabilirsiniz)");
      }
    }, 5000);

    return () => {
      active = false;
      clearTimeout(timer);
      cancelMatchmaking(user.username);
    };
  }, [user]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="rounded-xl bg-slate-900 p-6 text-center shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold text-white mb-4">{status}</h2>
        {showBotButton && (
          <button 
            onClick={() => {
              cancelMatchmaking(user.username);
              onMatchFound({name: "Bot", trophies: makeOpponentTrophies(user.trophies)});
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
