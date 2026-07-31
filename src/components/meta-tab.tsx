import { useEffect, useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/firebase";
import { CARDS, Rarity } from "@/lib/cards";
import { UserData } from "@/types";

interface MetaTabProps {
  user: UserData;
  onImportDeck?: (cardIds: string[]) => Promise<void>;
}

export function MetaTab({ user, onImportDeck }: MetaTabProps) {
  const [loading, setLoading] = useState(true);
  const [topCards, setTopCards] = useState<{ id: string; count: number; percentage: number }[]>([]);
  const [topDecks, setTopDecks] = useState<{ cards: string[]; count: number; percentage: number }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [importedIndex, setImportedIndex] = useState<number | null>(null);
  const [pastedCode, setPastedCode] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Sub-tab state: 'stats' (Metalar ve İstatistikler) or 'cards' (Kart Bilgileri)
  const [activeSubTab, setActiveSubTab] = useState<"stats" | "cards">("stats");

  // Card list filters
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [rangeFilter, setRangeFilter] = useState<string>("all");

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
              const sortedDeck = [...deck].sort().join(",");
              // Skip default starter deck users from stats calculation
              if (sortedDeck === "dev,kilicli,mizrakli,okcu") {
                return;
              }

              totalUsers++;
              
              // Count cards
              for (const c of deck) {
                cardCounts[c] = (cardCounts[c] || 0) + 1;
              }
              
              // Count decks
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

  const handleCopyDeck = (cards: string[], index: number) => {
    const code = cards.join(",");
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleImportDeck = async (cards: string[], index: number) => {
    if (onImportDeck) {
      await onImportDeck(cards);
      setImportedIndex(index);
      setTimeout(() => setImportedIndex(null), 2000);
    }
  };

  const handlePasteImport = async () => {
    setPasteError("");
    setPasteSuccess(false);
    const cleaned = pastedCode.trim().toLowerCase();
    if (!cleaned) {
      setPasteError("Lütfen bir deste kodu girin.");
      return;
    }

    const parts = cleaned.split(",").map(p => p.trim());
    if (parts.length !== 4) {
      setPasteError("Deste kodu, virgülle ayrılmış tam olarak 4 kart kimliği içermelidir.");
      return;
    }

    // Verify all IDs exist in CARDS
    const invalidIds = parts.filter(id => !CARDS.some(c => c.id === id));
    if (invalidIds.length > 0) {
      setPasteError(`Geçersiz kart kimlikleri: ${invalidIds.join(", ")}`);
      return;
    }

    if (onImportDeck) {
      await onImportDeck(parts);
      setPasteSuccess(true);
      setPastedCode("");
      setTimeout(() => setPasteSuccess(false), 3000);
    }
  };

  // Filter CARDS for "Kart Bilgileri"
  const filteredCards = CARDS.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (card.ability && card.ability.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRarity = rarityFilter === "all" ? true : card.rarity === rarityFilter;
    const matchesRange = rangeFilter === "all" ? true : card.range === rangeFilter;
    return matchesSearch && matchesRarity && matchesRange;
  });

  const getRarityBadgeStyle = (rarity: Rarity) => {
    switch (rarity) {
      case "common":
        return "bg-slate-900/80 border-slate-700 text-slate-300";
      case "rare":
        return "bg-blue-950/80 border-blue-650 text-blue-300";
      case "epic":
        return "bg-purple-950/90 border-purple-650 text-purple-300";
      case "legendary":
        return "bg-amber-950/90 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10 animate-pulse";
      default:
        return "bg-slate-900/80 border-slate-700 text-slate-300";
    }
  };

  const getRarityName = (rarity: Rarity) => {
    switch (rarity) {
      case "common": return "Sıradan";
      case "rare": return "Ender";
      case "epic": return "Destansı";
      case "legendary": return "Efsanevi";
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-white font-body animate-pulse">Mevcut meta istatistikleri toplanıyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <h2 className="text-stroke text-2xl text-white font-display">Oyun Metası & Bilgiler</h2>
        
        {/* Modern Segment Control Switcher */}
        <div className="flex p-0.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden self-start">
          <button
            onClick={() => setActiveSubTab("stats")}
            className={`px-4 py-2 text-xs font-bold font-display rounded-lg transition-all ${
              activeSubTab === "stats"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📊 İstatistikler & Metalar
          </button>
          <button
            onClick={() => setActiveSubTab("cards")}
            className={`px-4 py-2 text-xs font-bold font-display rounded-lg transition-all ${
              activeSubTab === "cards"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🃏 Kart Bilgileri
          </button>
        </div>
      </div>

      {activeSubTab === "stats" ? (
        <>
          <div className="panel-3d bg-slate-800 p-4 rounded-xl">
            <h3 className="text-xl text-yellow-400 mb-3 font-display">En Çok Kullanılan Kartlar</h3>
            <div className="grid grid-cols-1 gap-3">
              {topCards.map((tc, i) => {
                const card = CARDS.find((c) => c.id === tc.id);
                if (!card) return null;
                return (
                  <div key={tc.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-display text-sm w-5">{i + 1}.</span>
                    <span className="text-3xl bg-slate-800 rounded p-1 shadow-sm">{card.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">{card.name}</div>
                      <div className="relative w-full h-1.5 bg-slate-700 rounded overflow-hidden mt-1">
                        <div className="absolute top-0 left-0 h-full bg-yellow-500" style={{ width: `${tc.percentage}%` }}></div>
                      </div>
                    </div>
                    <div className="text-slate-200 font-mono text-xs text-right font-bold min-w-[3rem]">
                      %{tc.percentage}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel-3d bg-slate-800 p-4 rounded-xl">
            <h3 className="text-xl text-amber-500 mb-3 font-display">En Popüler Desteler (Meta)</h3>
            <div className="space-y-4">
              {topDecks.map((td, i) => (
                <div key={i} className="flex flex-col gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-white font-bold text-xs gap-1">
                    <span className="font-display text-amber-400">🔥 Deste #{i + 1}</span>
                    <span className="font-mono text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 truncate">%{td.percentage} Kullanım</span>
                  </div>
                  
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex gap-1 flex-wrap">
                      {td.cards.map((id, idx) => {
                        const card = CARDS.find(c => c.id === id);
                        return (
                          <div key={`${id}_${idx}`} className="bg-slate-800 p-1 rounded text-xl border border-slate-700 shadow-sm relative group" title={card?.name}>
                            {card?.emoji}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleImportDeck(td.cards, i)}
                      className="px-3 py-1.5 text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 rounded-xl hover:brightness-110 active:scale-95 transition-all text-center shadow"
                    >
                      {importedIndex === i ? "Aktarıldı! ✨" : "Desteyi Kullan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Brand New Card Information Tab View */
        <div className="space-y-4 animate-fade-in">
          {/* Filter Bar */}
          <div className="panel-3d bg-slate-800 p-4 rounded-xl space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Savaşçı adı veya yetenek ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              {/* Rarity Selector */}
              <div className="flex-1 min-w-[150px] space-y-1">
                <span className="text-slate-400 font-bold">Nadirlik:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["all", "common", "rare", "epic", "legendary"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRarityFilter(r)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                        rarityFilter === r
                          ? "bg-amber-500 text-slate-950 border-amber-600 font-extrabold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {r === "all" ? "Hepsi" : getRarityName(r as Rarity)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Range Selector */}
              <div className="flex-1 min-w-[150px] space-y-1">
                <span className="text-slate-400 font-bold">Menzil Türü:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["all", "yakın", "uzak", "hava"].map((rng) => (
                    <button
                      key={rng}
                      onClick={() => setRangeFilter(rng)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                        rangeFilter === rng
                          ? "bg-amber-500 text-slate-950 border-amber-600 font-extrabold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {rng === "all" ? "Hepsi" : rng.charAt(0).toUpperCase() + rng.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cards Count */}
          <div className="text-slate-400 text-xs px-1 flex justify-between font-medium">
            <span>Toplam {filteredCards.length} savaşçı gösteriliyor</span>
            {filteredCards.length === 0 && <span className="text-rose-400">Aradığınız kriterde savaşçı bulunamadı!</span>}
          </div>

          {/* Card Detail Panels Grid */}
          <div className="grid grid-cols-1 gap-5">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`panel-3d flex flex-col justify-between rounded-2xl p-5 border transition-all hover:scale-[1.01] bg-slate-900/60 ${
                  card.rarity === "legendary" ? "border-amber-500/30" : "border-slate-800"
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl bg-slate-950/60 border border-slate-800 rounded-2xl p-3 shadow-inner select-none">
                        {card.emoji}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
                          {card.name}
                        </h4>
                        <div className="flex gap-1.5 items-center mt-1.5">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border leading-none ${getRarityBadgeStyle(card.rarity)}`}>
                            {getRarityName(card.rarity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Elmas Cost */}
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1.5">Maliyet</div>
                      <div className="bg-indigo-950/80 border border-indigo-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1 font-mono font-black text-cyan-300 shadow">
                        💎 {card.stoneCost}
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-950 shadow-inner mb-4">
                    {card.description}
                  </p>
                </div>

                {/* Technical Stats Block */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs font-bold font-mono">
                    <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800">
                      <span className="block text-[9px] text-slate-400 mb-1 font-sans leading-none tracking-wider uppercase">CAN</span>
                      <span className="text-rose-400 text-sm block">❤️ {card.hp}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800">
                      <span className="block text-[9px] text-slate-400 mb-1 font-sans leading-none tracking-wider uppercase">HASAR</span>
                      <span className="text-yellow-400 text-sm block">⚔️ {card.dmg}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800">
                      <span className="block text-[9px] text-slate-400 mb-1 font-sans leading-none tracking-wider uppercase">SÜRE</span>
                      <span className="text-cyan-400 text-sm block">⏱️ {card.cd}s</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800">
                      <span className="block text-[9px] text-slate-400 mb-1 font-sans leading-none tracking-wider uppercase">MENZİL</span>
                      <span className="text-emerald-400 capitalize font-sans text-sm block truncate">{card.range}</span>
                    </div>
                  </div>

                  {/* Special Ability Box if present */}
                  {card.ability && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200/90 rounded-lg p-2 flex items-start gap-2">
                      <span className="text-sm shrink-0">✨</span>
                      <div className="text-[11px] leading-snug">
                        <span className="font-extrabold text-amber-400 font-display block mb-0.5">ÖZEL YETENEK</span>
                        {card.ability}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

