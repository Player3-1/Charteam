import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from "firebase/firestore";
import { UserData } from "@/types";
import { GameCard } from "@/components/game-card";
import { CARDS } from "@/lib/cards";
import { getRankForRankProgress } from "@/lib/arenas";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function LeaderboardTab({ currentUser, currentTrophies }: { currentUser: UserData; currentTrophies: number }) {
  const [topPlayers, setTopPlayers] = useState<UserData[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTop100, setShowTop100] = useState(false);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch top 3 players
        const qTop = query(collection(db, "users"), orderBy("trophies", "desc"), limit(3));
        const querySnapshot = await getDocs(qTop);
        const players: UserData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          players.push({
            id: doc.id,
            username: data.username || "Oyuncu",
            gold: data.gold ?? 0,
            trophies: data.trophies ?? 0,
            collection: data.collection ?? {},
            deck: data.deck ?? ["mizrakli", "kilicli", "okcu", "dev"],
            wins: data.wins ?? 0,
            losses: data.losses ?? 0,
            rankProgressTrophies: data.rankProgressTrophies ?? 0,
          });
        });
        setTopPlayers(players);

        // 2. Fetch the rank of the current user
        const qCount = query(collection(db, "users"), where("trophies", ">", currentTrophies));
        const countSnapshot = await getCountFromServer(qCount);
        const rank = countSnapshot.data().count + 1;
        setUserRank(rank);
      } catch (error) {
        console.error("Liderlik tablosu verileri yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [currentUser.username, currentTrophies]);

  const podiumEmojis = ["🥇", "🥈", "🥉"];
  const podiumColors = ["from-amber-400/20 to-yellow-500/10 border-yellow-400/50", "from-slate-300/20 to-slate-400/10 border-slate-300/50", "from-amber-600/20 to-amber-700/10 border-amber-600/50"];

  return (
    <div className="space-y-4 pb-4">
      <div className="text-center py-2">
        <h2 className="text-stroke text-3xl text-white font-black tracking-tight flex items-center justify-center gap-2">
          <span>🏆</span> Dünya İlk 3 <span>🏆</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Küresel düzeyde en yüksek kupaya sahip şampiyonlar</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {topPlayers.map((player, i) => (
            <div 
              key={player.id || i} 
              className={`panel-3d flex items-center justify-between rounded-2xl p-4 bg-gradient-to-br ${podiumColors[i] || "from-slate-800 to-slate-900 border-slate-700"} border relative overflow-hidden`}
            >
              <div className="flex items-center gap-3.5 z-10">
                 <div className="text-4xl filter drop-shadow">{podiumEmojis[i] || ` #${i + 1}`}</div>
                 <div>
                    <div className="font-display text-lg text-white font-black tracking-wide flex items-center gap-1.5">
                      {player.username} {player.username.toLowerCase() === "dgoa" && <span className="text-sm">🛠️</span>}
                    </div>
                    <div className="text-sm font-bold text-amber-300 flex items-center gap-1">
                      <span>{player.trophies}</span>
                      <span className="text-xs opacity-85">Kupa 🏆</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setSelectedPlayer(player)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:scale-105 active:scale-95 transition-all px-4 py-1.5 rounded-xl text-white text-xs font-black tracking-wider cursor-pointer z-10"
              >
                PROFİL
              </button>
            </div>
          ))}

          {/* Devamını Gör Button */}
          <div className="flex justify-center pt-1">
            <button
              onClick={() => setShowTop100(true)}
              className="w-full bg-gradient-to-r from-slate-900/95 to-slate-800/95 hover:from-slate-800 hover:to-slate-700 border border-slate-800/80 hover:border-slate-700 text-white font-black text-xs tracking-wider py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
            >
              <span>📜</span>
              <span>Devamını Gör (İlk 100)</span>
            </button>
          </div>

          {/* Current User Rank Position Sticky Card at the bottom of the tab content */}
          <div className="panel-3d mt-4 rounded-2xl p-4 bg-gradient-to-r from-indigo-950/90 to-slate-900/90 border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">SIRA</span>
                  <span className="text-lg font-black text-white">#{userRank !== null ? userRank : "?"}</span>
                </div>
                <div>
                  <div className="font-display font-black text-white text-base tracking-wide flex items-center gap-1">
                    <span>{currentUser.username}</span>
                    {currentUser.username.toLowerCase() === "dgoa" && <span>🛠️</span>}
                    <span className="text-xs text-indigo-300 font-bold uppercase">(SİZ)</span>
                  </div>
                  <div className="text-xs text-indigo-200 font-bold flex items-center gap-1 mt-0.5">
                    <span>{currentTrophies} 🏆</span>
                    <span>·</span>
                    <span>{currentUser.wins ?? 0} Galibiyet</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold">SIRALAMANIZ</div>
                <div className="text-xs font-black text-indigo-400 uppercase mt-0.5">
                  {userRank !== null && userRank <= 3 ? "KÜRESEL İLK 3! 🎉" : "MÜCADELEYE DEVAM! ⚔️"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedPlayer && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl w-full max-w-sm panel-3d relative">
             <h2 className="text-2xl font-black text-white text-center mb-1 flex items-center justify-center gap-1.5">
               {selectedPlayer.username} {selectedPlayer.username.toLowerCase() === "dgoa" && "🛠️"}
             </h2>
             {(() => {
               const r = getRankForRankProgress(selectedPlayer.rankProgressTrophies || 0);
               return (
                 <div className="text-center text-cyan-400 font-bold mb-4 flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase bg-cyan-950/40 py-1 px-3 rounded-full border border-cyan-800/40 w-fit mx-auto">
                   <span>{r.current.emoji}</span>
                   <span>{r.current.name}</span>
                 </div>
               );
             })()}
             <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 mb-5 space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium">Toplam Kupa:</span>
                 <span className="text-amber-300 font-black">{selectedPlayer.trophies} 🏆</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium">Altın:</span>
                 <span className="text-yellow-400 font-black">{selectedPlayer.gold} 🪙</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium">Galibiyet / Mağlubiyet:</span>
                 <span className="text-white font-black">{selectedPlayer.wins} G / {selectedPlayer.losses} M</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium">Kazanma Oranı:</span>
                 <span className="text-indigo-400 font-black">
                   {selectedPlayer.wins + selectedPlayer.losses > 0 ? Math.round((selectedPlayer.wins / (selectedPlayer.wins + selectedPlayer.losses)) * 100) : 0}%
                 </span>
               </div>
             </div>
             
             <div className="mb-5">
               <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5 text-center">Aktif Deste</h3>
               <div className="grid grid-cols-4 gap-2">
                  {selectedPlayer.deck.map((cardId, index) => {
                    const card = CARDS.find((c) => c.id === cardId);
                    return card ? <GameCard key={`${cardId}_${index}`} card={card} size="sm" /> : null
                  })}
               </div>
             </div>
             
             <button onClick={() => setSelectedPlayer(null)} className="w-full rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-3 text-white text-sm font-black tracking-wider hover:from-slate-700 hover:to-slate-800 active:scale-95 transition-all cursor-pointer">
               KAPAT
             </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTop100 && (
          <Top100Modal
            currentUser={currentUser}
            currentTrophies={currentTrophies}
            onClose={() => setShowTop100(false)}
            onSelectPlayer={(p) => {
              setSelectedPlayer(p);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface Top100ModalProps {
  currentUser: UserData;
  currentTrophies: number;
  onClose: () => void;
  onSelectPlayer: (player: UserData) => void;
}

function Top100Modal({ currentUser, currentTrophies, onClose, onSelectPlayer }: Top100ModalProps) {
  const [players, setPlayers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTop100 = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "users"), orderBy("trophies", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const fetchedPlayers: UserData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPlayers.push({
            id: doc.id,
            username: data.username || "Oyuncu",
            gold: data.gold ?? 0,
            trophies: data.trophies ?? 0,
            collection: data.collection ?? {},
            deck: data.deck ?? ["mizrakli", "kilicli", "okcu", "dev"],
            wins: data.wins ?? 0,
            losses: data.losses ?? 0,
            rankProgressTrophies: data.rankProgressTrophies ?? 0,
          });
        });
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error("İlk 100 oyuncu yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTop100();
  }, []);

  const filteredPlayers = players.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1999] flex items-end justify-center bg-black/85 backdrop-blur-sm p-0">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full max-w-md h-[92vh] flex flex-col bg-slate-950 rounded-t-[32px] border-t border-slate-800/80 p-5 font-display overflow-hidden shadow-[0_-12px_30px_rgba(0,0,0,0.7)] text-left"
      >
        {/* Pull Handle to swipe/tap down */}
        <div 
          className="w-12 h-1.5 bg-slate-800 hover:bg-slate-700 rounded-full mx-auto mb-4 cursor-pointer transition-colors shrink-0" 
          onClick={onClose} 
        />

        {/* Title Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h2 className="text-2xl text-stroke text-white font-black tracking-tight">Küresel İlk 100</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-full w-9 h-9 flex items-center justify-center transition-all cursor-pointer shadow-md text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Oyuncu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-500 text-sm focus:outline-none transition-all font-sans"
            />
            <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
          </div>
        </div>

        {/* Leaderboard Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-12 scrollbar-none overscroll-behavior-y-contain">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              <span className="text-xs text-slate-400 font-sans">Liderler Yükleniyor...</span>
            </div>
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map((player, index) => {
              const rank = players.findIndex((p) => p.id === player.id) + 1;
              const isMe = player.username === currentUser.username;

              return (
                <div
                  key={player.id || index}
                  className={cn(
                    "p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all",
                    isMe 
                      ? "border-indigo-500 bg-indigo-950/20 shadow shadow-indigo-500/5" 
                      : "border-slate-900 bg-slate-900/20 hover:bg-slate-900/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-sans font-black text-xs shrink-0",
                      rank === 1 ? "bg-amber-400 text-slate-950 text-sm" :
                      rank === 2 ? "bg-slate-300 text-slate-950 text-sm" :
                      rank === 3 ? "bg-amber-700 text-white text-sm" :
                      "bg-slate-900 border border-slate-800 text-slate-400"
                    )}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate flex items-center gap-1">
                        <span>{player.username}</span>
                        {player.username.toLowerCase() === "dgoa" && <span className="text-xs">🛠️</span>}
                        {isMe && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-sans px-1.5 py-0.5 rounded uppercase font-black tracking-wider ml-1">Siz</span>}
                      </div>
                      <div className="text-[11px] text-amber-400/90 font-bold flex items-center gap-1.5 mt-0.5">
                        <span>{player.trophies} 🏆</span>
                        <span className="text-slate-600 font-normal">·</span>
                        <span className="text-slate-400 font-sans font-medium">{player.wins} G</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPlayer(player)}
                    className="flex-none bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all px-3 py-1.5 rounded-xl text-white text-[10px] font-black tracking-wider cursor-pointer"
                  >
                    PROFİL
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <span className="text-3xl block mb-2">👁️‍🗨️</span>
              <div className="text-sm text-slate-400 font-sans">Eşleşen oyuncu bulunamadı.</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
