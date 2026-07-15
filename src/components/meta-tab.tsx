import { useEffect, useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/firebase";
import { CARDS } from "@/lib/cards";
import { UserData } from "@/types";

export function MetaTab({ user }: { user: UserData }) {
  const [loading, setLoading] = useState(true);
  const [topCards, setTopCards] = useState<{ id: string; count: number; percentage: number }[]>([]);
  const [topDecks, setTopDecks] = useState<{ cards: string[]; count: number; percentage: number }[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const q = query(collection(db, "users"), limit(100)); // Get top 100 users for meta
        const snapshot = await getDocs(q);
        
        const cardCounts: Record<string, number> = {};
        const deckCounts: Record<string, number> = {};
        
        let totalUsers = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.deck && Array.isArray(data.deck)) {
            const deck = (data.deck as string[]).filter(c => c && typeof c === "string" && c.trim() !== "");
            if (deck.length === 4) {
              totalUsers++;
              
              // Count cards
              for (const c of deck) {
                cardCounts[c] = (cardCounts[c] || 0) + 1;
              }
              
              // Count decks (sorted so order doesn't matter)
              const sortedDeck = [...deck].sort().join(",");
              deckCounts[sortedDeck] = (deckCounts[sortedDeck] || 0) + 1;
            }
          }
        });

        if (totalUsers === 0) {
          setLoading(false);
          return;
        }

        const sortedCards = Object.entries(cardCounts)
          .map(([id, count]) => ({ id, count, percentage: Math.round((count / totalUsers) * 100) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
          
        const sortedDecks = Object.entries(deckCounts)
          .map(([deckStr, count]) => ({ cards: deckStr.split(","), count, percentage: Math.round((count / totalUsers) * 100) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopCards(sortedCards);
        setTopDecks(sortedDecks);
      } catch (err) {
        console.error("Meta meta error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeta();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-stroke text-2xl text-white">Game Meta</h2>
      
      <div className="panel-3d bg-slate-800 p-4 rounded-xl">
        <h3 className="text-xl text-yellow-400 mb-3 font-display">Most Used Cards</h3>
        <div className="space-y-3">
          {topCards.map((tc, i) => {
            const card = CARDS.find((c) => c.id === tc.id);
            if (!card) return null;
            return (
              <div key={tc.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg">
                <span className="text-white font-bold w-6">{i + 1}.</span>
                <span className="text-3xl bg-slate-800 rounded p-1">{card.emoji}</span>
                <div className="flex-1">
                  <div className="text-white font-bold">{card.name}</div>
                  <div className="relative w-full h-2 bg-slate-700 rounded overflow-hidden mt-1">
                    <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: `${tc.percentage}%` }}></div>
                  </div>
                </div>
                <div className="text-white font-medium text-right min-w-[3rem]">
                  %{tc.percentage}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-3d bg-slate-800 p-4 rounded-xl">
        <h3 className="text-xl text-amber-500 mb-3 font-display">Most Popular Decks</h3>
        <div className="space-y-4">
          {topDecks.map((td, i) => (
            <div key={i} className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-lg flex-wrap">
              <div className="flex justify-between items-center text-white font-bold">
                <span>Deck #{i + 1}</span>
                <span>%{td.percentage}</span>
              </div>
              <div className="flex gap-2">
                {td.cards.map((id, idx) => {
                  const card = CARDS.find(c => c.id === id);
                  return (
                    <div key={`${id}_${idx}`} className="bg-slate-800 p-1.5 rounded text-2xl border border-slate-700" title={card?.name}>
                      {card?.emoji}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
