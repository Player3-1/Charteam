import { useState, useEffect } from "react";
import { usePlayer } from "@/hooks/use-player";
import { UserData } from "@/types";
import {
  CARDS,
  CHESTS,
  RARITY_LABEL,
  pickCardByRarity,
  rollRarity,
  rollCardFromUnlocked,
  type CardDef,
  type Rarity,
} from "@/lib/cards";
import { ARENAS, arenaForTrophies, getUnlockedCardsUpToTrophies, MAX_TROPHIES, getArenaForCard, getRankForTrophies, getRankForWins, getRankForRankProgress } from "@/lib/arenas";
import { GameCard } from "@/components/game-card";
import { BattleScreen } from "@/components/battle-screen";
import { ArenasView } from "@/components/arenas-view";
import { MatchmakingModal } from "@/components/matchmaking-modal";
import { MetaTab } from "@/components/meta-tab";
import { LeaderboardTab } from "@/components/leaderboard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { SHOP_EMOJIS } from "@/lib/emojis";

export function getRankedStarsDetails(points: number) {
  const totalStars = Math.floor(points / 10);
  const divisions = [
    { name: "Bronze League I", minStars: 0, icon: "🥉", style: "from-amber-700 to-amber-950 text-amber-300 border-amber-600 shadow-amber-900/40" },
    { name: "Bronze League II", minStars: 3, icon: "🥉", style: "from-amber-700 to-amber-950 text-amber-200 border-amber-500 shadow-amber-900/50" },
    { name: "Bronze League III", minStars: 6, icon: "🥉", style: "from-amber-700 to-amber-950 text-amber-100 border-amber-400 shadow-amber-900/60 font-semibold" },
    { name: "Silver League I", minStars: 9, icon: "🥈", style: "from-slate-600 to-slate-900 text-slate-200 border-slate-500 shadow-slate-700/40" },
    { name: "Silver League II", minStars: 12, icon: "🥈", style: "from-slate-600 to-slate-900 text-slate-100 border-slate-450 shadow-slate-700/50" },
    { name: "Silver League III", minStars: 15, icon: "🥈", style: "from-slate-600 to-slate-900 text-white border-slate-400 shadow-slate-700/60 font-semibold" },
    { name: "Gold League I", minStars: 18, icon: "🥇", style: "from-yellow-700 to-yellow-950 text-yellow-300 border-yellow-500 shadow-yellow-600/40 font-semibold" },
    { name: "Gold League II", minStars: 21, icon: "🥇", style: "from-yellow-700 to-yellow-950 text-yellow-200 border-yellow-400 shadow-yellow-600/50 font-bold" },
    { name: "Gold League III", minStars: 24, icon: "🥇", style: "from-yellow-700 to-yellow-950 text-amber-100 border-yellow-350 shadow-yellow-600/60 font-extrabold" },
    { name: "Diamond Fighter", minStars: 27, icon: "💎", style: "from-cyan-600 via-sky-900 to-blue-950 text-cyan-200 border-cyan-400 shadow-cyan-500/50 font-black animate-pulse" },
  ];

  let currentDiv = divisions[0];
  for (let i = divisions.length - 1; i >= 0; i--) {
    if (totalStars >= divisions[i].minStars) {
      currentDiv = divisions[i];
      break;
    }
  }

  const index = divisions.indexOf(currentDiv);
  const nextDiv = index < divisions.length - 1 ? divisions[index + 1] : null;
  const starsInThisDiv = totalStars - currentDiv.minStars;
  const totalStarsRequired = nextDiv ? (nextDiv.minStars - currentDiv.minStars) : 3;

  return {
    name: currentDiv.name,
    icon: currentDiv.icon,
    style: currentDiv.style,
    starsInThisDiv: Math.max(0, starsInThisDiv),
    totalStarsRequired,
    points,
    totalStars,
  };
}

type Tab = "battle" | "cards" | "chests" | "meta" | "arenas" | "top3";

export function Home({ user }: { user: UserData }) {
  const { state, hydrated, claimChestRewards, spendGold, setDeckSlot, setActiveDeck, applyMatchReward, buyEmoji, setEmojiSlot, setTrophies, setGold, updateResources, resetRankedStars } = usePlayer(user.username);
  const [tab, setTab] = useState<Tab>("cards");
  const [openedRewards, setOpenedRewards] = useState<{ card: CardDef; isDuplicate: boolean; refundGold: number }[] | null>(null);
  const [openedChestName, setOpenedChestName] = useState("");
  const [inBattle, setInBattle] = useState(false);
  const [opponent, setOpponent] = useState<{name: string, trophies: number, rankedStars?: number, wins?: number, battleId?: string, isPlayer1?: boolean, mode?: "standard" | "tournament" | "ranked"} | null>(null);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [showArenas, setShowArenas] = useState(false);
  const [battleMode, setBattleMode] = useState<"standard" | "ranked">("standard");

  if (!hydrated || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-2xl font-display">
        Loading…
      </div>
    );
  }

  const arena = arenaForTrophies(state.trophies);
  const hasStar = (state.wins ?? 0) >= 10;

  const handleOpenChest = (chestId: string) => {
    const chest = CHESTS.find((c) => c.id === chestId)!;
    if (state.gold < chest.cost) return;
    const rolled: CardDef[] = [];
    
    const unlockedIds = getUnlockedCardsUpToTrophies(state.trophies);
    rolled.push(rollCardFromUnlocked(unlockedIds, chest.guaranteedMin, chest.allowedRarities));
    
    for (let i = 1; i < chest.cards; i++) {
        rolled.push(rollCardFromUnlocked(unlockedIds, undefined, chest.allowedRarities));
    }

    const tempCollection = { ...state.collection };
    const rewards: { card: CardDef; isDuplicate: boolean; refundGold: number }[] = [];
    const refundValues: Record<Rarity, number> = {
      common: 250,
      rare: 500,
      epic: 800,
      legendary: 6000,
    };

    for (const card of rolled) {
      const isDuplicate = (tempCollection[card.id] ?? 0) > 0;
      const refundGold = refundValues[card.rarity];
      rewards.push({
        card,
        isDuplicate,
        refundGold,
      });
      if (!isDuplicate) {
        tempCollection[card.id] = 1;
      }
    }

    claimChestRewards(rewards, chest.cost);
    setOpenedChestName(chest.name);
    setOpenedRewards(rewards);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-950">
      {!(inBattle && opponent) && (
        <>
          <header className="sticky top-0 z-20 panel-3d px-3 pb-3 pt-8 flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowArenas(true)}>
              <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-black/40 bg-gradient-to-br from-amber-300 to-amber-600 text-lg font-display text-amber-950 shadow-inner shrink-0">
                {state.username[0]}
              </div>
              <div>
                <div className="font-display text-lg leading-none text-stroke text-white">
                  {state.username} {state.username.toLowerCase() === "dgoa" && "🛠️"}
                </div>
                <div className="mt-0.5 text-[11px] text-amber-200/90 underline decoration-amber-500/50 underline-offset-2 flex flex-col gap-0.5">
                  <div>Arena {arena.id} · {arena.name}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-1.5">
              <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
              {state.rankedStars !== undefined && state.rankedStars > 0 && (
                <Stat icon="⭐" value={state.rankedStars} color="from-cyan-300 to-blue-500 text-cyan-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.35)] border-cyan-400/40" />
              )}
              <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
            </div>
          </header>

          <main className="flex-1 px-3 pb-28 pt-4">
            {tab === "battle" && (
              <BattleTab
                deck={state.deck}
                trophies={state.trophies}
                rankProgressTrophies={state.rankProgressTrophies || 0}
                rankedStars={state.rankedStars || 0}
                battleMode={battleMode}
                setBattleMode={setBattleMode}
                onStart={() => setShowMatchmaking(true)}
              />
            )}
            {tab === "cards" && (
              <CardsTab
                collection={state.collection}
                deck={state.deck}
                decks={state.decks}
                activeDeckIndex={state.activeDeckIndex}
                selectedEmojies={state.selectedEmojies as [string, string, string, string] | undefined}
                unlockedEmojies={state.unlockedEmojies ?? []}
                gold={state.gold}
                setDeckSlot={setDeckSlot}
                setActiveDeck={setActiveDeck}
                setEmojiSlot={setEmojiSlot}
              />
            )}
            {tab === "chests" && (
              <ChestsTab 
                gold={state.gold} 
                unlockedEmojies={state.unlockedEmojies ?? []} 
                wins={state.wins}
                tournamentWins={state.tournamentWins || 0}
                onOpen={handleOpenChest} 
                onBuyEmoji={buyEmoji} 
                trophies={state.trophies}
                rankedStars={state.rankedStars || 0}
                onUpdateResources={updateResources}
                onResetRankedStars={resetRankedStars}
              />
            )}
            {tab === "meta" && (
              <MetaTab user={user} />
            )}
            {tab === "top3" && (
              <LeaderboardTab currentUser={user} currentTrophies={state.trophies} />
            )}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-[1000] mx-auto max-w-md panel-3d rounded-t-2xl rounded-b-none px-2 py-2">
            <div className="grid grid-cols-5 gap-1">
              <NavBtn active={tab === "meta"} onClick={() => setTab("meta")} icon="📊" label="Meta" />
              <NavBtn active={tab === "chests"} onClick={() => setTab("chests")} icon="🎁" label="Shop" />
              <NavBtn active={tab === "battle"} onClick={() => setTab("battle")} icon="⚔️" label="Battle" big />
              <NavBtn active={tab === "cards"} onClick={() => setTab("cards")} icon="🃏" label="Cards" />
              <NavBtn active={tab === "top3"} onClick={() => setTab("top3")} icon="🏆" label="Top 3" />
            </div>
          </nav>
        </>
      )}

      {showMatchmaking && (
        <MatchmakingModal
          user={{...user, ...state}}
          mode={battleMode}
          onMatchFound={(opp) => {
            setOpponent(opp as any);
            setShowMatchmaking(false);
            setInBattle(true);
          }}
          onCancel={() => setShowMatchmaking(false)}
        />
      )}

      <AnimatePresence>
        {showArenas && (
          <ArenasModal currentTrophies={state.trophies} onClose={() => setShowArenas(false)} />
        )}
      </AnimatePresence>

      {openedRewards && (
        <ChestReveal
          chestName={openedChestName}
          rewards={openedRewards}
          onClose={() => setOpenedRewards(null)}
        />
      )}

      {inBattle && opponent && (
        <BattleScreen
          deck={state.deck}
          playerEmojis={(state.selectedEmojies as [string, string, string, string]) || ["", "", "", ""]}
          trophies={state.trophies}
          opponentName={opponent.name}
          opponentTrophies={opponent.trophies}
          opponentRankedStars={opponent.rankedStars}
          opponentWins={opponent.wins}
          battleId={opponent.battleId}
          isPlayer1={opponent.isPlayer1}
          mode={opponent.mode || "standard"}
          username={user.username}
          onFinish={(gold, trophy, win) => {
            applyMatchReward(gold, trophy, win, opponent.mode || "standard");
            setInBattle(false);
            setOpponent(null);
          }}
          onExit={() => {
            setInBattle(false);
            setOpponent(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({ icon, value, color }: { icon: string; value: number | null | undefined; color: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border-2 border-black/40 bg-gradient-to-r px-2.5 py-0.5 text-sm font-bold text-amber-950 shadow",
        color,
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="tabular-nums">{value?.toLocaleString("tr-TR") ?? 0}</span>
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
  big,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl px-2 py-2 font-display transition-all",
        big && "btn-pop -mt-6 py-3 text-primary-foreground active:btn-pop-active",
        !big && active && "bg-secondary text-white",
        !big && !active && "text-muted-foreground",
      )}
    >
      <span className={cn("leading-none", big ? "text-3xl" : "text-2xl")}>{icon}</span>
      <span className={cn("mt-0.5", big ? "text-sm text-stroke" : "text-[10px]")}>{label}</span>
    </button>
  );
}

function CardsTab({
  collection,
  deck,
  decks,
  activeDeckIndex = 0,
  selectedEmojies = ["", "", "", ""],
  unlockedEmojies = [],
  gold,
  setDeckSlot,
  setActiveDeck,
  setEmojiSlot,
}: {
  collection: Record<string, number>;
  deck: [string, string, string, string];
  decks?: Record<string, [string, string, string, string]>;
  activeDeckIndex?: number;
  selectedEmojies?: [string, string, string, string];
  unlockedEmojies?: string[];
  gold: number;
  setDeckSlot: (slot: number, cardId: string) => void;
  setActiveDeck: (index: number) => void;
  setEmojiSlot: (slot: number, emoji: string) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeEmojiSlot, setActiveEmojiSlot] = useState<number | null>(null);

  const owned = CARDS.filter((c) => (collection[c.id] ?? 0) > 0);
  const locked = CARDS.filter((c) => (collection[c.id] ?? 0) === 0);

  // When a user clicks a slot in their deck (Deck)
  const handleSlotClick = (i: number, hasCard: boolean) => {
    setActiveEmojiSlot(null);
    if (hasCard) {
      setDeckSlot(i, "");
      setActiveSlot(i);
    } else {
      setActiveSlot(activeSlot === i ? null : i);
    }
  };

  const handleEmojiSlotClick = (i: number, hasEmoji: boolean) => {
    setActiveSlot(null);
    if (hasEmoji) {
      setEmojiSlot(i, "");
      setActiveEmojiSlot(i);
    } else {
      setActiveEmojiSlot(activeEmojiSlot === i ? null : i);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const inDeckIndex = selectedEmojies.indexOf(emoji);
    if (inDeckIndex >= 0) {
      setEmojiSlot(inDeckIndex, "");
      setActiveEmojiSlot(inDeckIndex);
    } else {
      if (activeEmojiSlot !== null) {
        setEmojiSlot(activeEmojiSlot, emoji);
        const next = [...selectedEmojies];
        next[activeEmojiSlot] = emoji;
        const nextEmpty = next.findIndex(e => e === "");
        setActiveEmojiSlot(nextEmpty >= 0 ? nextEmpty : null);
      } else {
        const firstEmpty = selectedEmojies.findIndex(e => e === "");
        if (firstEmpty >= 0) {
          setEmojiSlot(firstEmpty, emoji);
          const next = [...selectedEmojies];
          next[firstEmpty] = emoji;
          const nextEmpty = next.findIndex(e => e === "");
          setActiveEmojiSlot(nextEmpty >= 0 ? nextEmpty : null);
        }
      }
    }
  };

  const handleCollectionCardClick = (cardId: string) => {
    const card = CARDS.find((c) => c.id === cardId);
    if (!card) return;
    
    // Check if adding this will exceed legendary limit
    if (card.rarity === "legendary") {
       const legendaryCount = deck.filter(id => {
         const c = CARDS.find(card => card.id === id);
         return c && c.rarity === "legendary";
       }).length;
       if (legendaryCount >= 2 && !deck.includes(cardId)) {
         // Prevent adding
         alert("Maksimum 2 efsanevi kart koyabilirsin!");
         return;
       }
    }

    const inDeckIndex = deck.indexOf(cardId);
    if (inDeckIndex >= 0) {
      // It is already in the deck! Remove it immediately.
      setDeckSlot(inDeckIndex, "");
      // Make that slot the active slot so they can easily replace / fill it.
      setActiveSlot(inDeckIndex);
    } else {
      // Find where we are inserting
      let targetSlot = activeSlot;
      if (targetSlot === null) {
        targetSlot = deck.indexOf("");
      }

      if (targetSlot >= 0) {
        // Simulate cost
        const simulatedDeck = [...deck];
        simulatedDeck[targetSlot] = cardId;
        const nextCost = simulatedDeck.reduce((sum, id) => {
          const c = CARDS.find(x => x.id === id);
          return sum + (c ? c.stoneCost : 0);
        }, 0);

        if (nextCost > 20) {
          alert(`You can't exceed the 20 stone limit! Adding this card will make your dect cost ${nextCost} stones.`);
          return;
        }

        setDeckSlot(targetSlot, cardId);
        // Simulate new deck to find NEXT empty slot
        const nextEmpty = simulatedDeck.findIndex((id) => id === "");
        if (nextEmpty >= 0) {
          setActiveSlot(nextEmpty);
        } else {
          setActiveSlot(null);
        }
      }
    }
  };

  const deckStoneCost = deck.reduce((sum, id) => {
    const c = CARDS.find(x => x.id === id);
    return sum + (c ? c.stoneCost : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex flex-col justify-start">
          <div className="flex items-center justify-between">
            <h2 className="text-stroke text-2xl text-white flex items-center gap-2">
              <span>dect</span>
              <span className={cn(
                "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm transition-colors",
                deckStoneCost > 20 
                  ? "bg-red-950/80 text-red-400 border-red-500/40" 
                  : deckStoneCost === 20 
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40" 
                    : "bg-indigo-950/80 text-cyan-300 border-indigo-400/40"
              )}>
                💎 {deckStoneCost}/20
              </span>
            </h2>
            <div className="flex gap-1">
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
          </div>
          <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium min-h-[16px] leading-tight">
            {activeSlot !== null 
              ? "👉 Tap a character below to equip!" 
              : "ℹ️ Tap on a fighter to unequip."}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-2xl panel-3d p-3">
          {deck.map((cardId, i) => {
            const card = CARDS.find((c) => c.id === cardId);
            const isActive = activeSlot === i;
            return (
              <div key={i} className="flex flex-col items-center">
                {card ? (
                  <div className="relative">
                    <GameCard 
                      card={card} 
                      size="sm" 
                      onClick={() => handleSlotClick(i, true)} 
                    />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl ring-4 ring-amber-400 ring-offset-2 pointer-events-none animate-pulse" />
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSlotClick(i, false)}
                    className={cn(
                      "grid aspect-[3/4] w-20 place-items-center rounded-xl border-2 border-dashed transition-all relative",
                      isActive
                        ? "border-amber-400 bg-amber-500/20 text-amber-300 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"
                        : "border-amber-300/40 bg-black/20 text-amber-300/70 hover:bg-black/35"
                    )}
                  >
                    <span className="text-3xl font-display leading-none">+</span>
                    {isActive && (
                      <span className="absolute -bottom-2 bg-amber-500 text-amber-950 text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-full border border-black shadow">
                        SELECTED
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-col justify-start">
          <h2 className="text-stroke text-xl text-white">Selected Emojies</h2>
          <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium min-h-[16px] leading-tight">
            {activeEmojiSlot !== null 
              ? "👉 Select from the collection below to change emoji!" 
              : "ℹ️ Select 4 emojis to use in battle."}
          </p>
        </div>
        <div className="flex gap-2 justify-center mb-4 panel-3d border border-slate-700 p-2 rounded-xl bg-slate-900/60">
          {selectedEmojies.map((emoji, i) => {
            const isActive = activeEmojiSlot === i;
            return (
              <button
                key={i}
                onClick={() => handleEmojiSlotClick(i, !!emoji)}
                className={cn(
                  "w-12 h-12 flex items-center justify-center text-3xl rounded-xl border relative shadow-inner",
                  isActive ? "border-amber-400 bg-amber-500/20 text-amber-300 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse z-10" : "border-slate-600 bg-slate-800 text-slate-300",
                  !emoji && !isActive && "opacity-50"
                )}
              >
                {emoji || "?"}
                {isActive && (
                  <span className="absolute -bottom-1.5 bg-amber-500 text-amber-950 text-[6px] font-black tracking-wider px-1 py-0 rounded border border-black shadow">
                    SELECTED
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeEmojiSlot !== null && (
          <div className="grid grid-cols-4 gap-2 p-2 border border-dashed border-amber-500/30 bg-amber-500/10 rounded-xl mb-4">
            {unlockedEmojies.length === 0 ? (
              <div className="col-span-4 text-center text-sm text-amber-200/70 py-2">
                You have no emojis! Buy them from the Chests menu.
              </div>
            ) : (
              Array.from(new Set(unlockedEmojies)).map((emoji, index) => (
                <button
                  key={`${emoji}_${index}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-3xl bg-slate-800 border border-slate-600 rounded-lg py-1 hover:bg-slate-700 focus:outline-none"
                >
                  {emoji}
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-stroke text-2xl text-white font-display">
          Koleksiyon · {owned.length}/{CARDS.length}
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {[...owned, ...locked].map((card) => {
            const isOwned = (collection[card.id] ?? 0) > 0;
            const inDeck = deck.includes(card.id);
            const ownedVal = isOwned ? Math.max(1, collection[card.id] ?? 0) : 0;

            return (
              <div key={card.id} className="flex flex-col items-center gap-1.5 p-1 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <GameCard
                  card={card}
                  owned={ownedVal}
                  locked={!isOwned}
                  lockedAtArena={!isOwned ? getArenaForCard(card.id)?.id : undefined}
                  selected={inDeck}
                  onClick={
                    isOwned ? () => handleCollectionCardClick(card.id) : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BattleTab({
  deck,
  trophies,
  rankProgressTrophies,
  rankedStars,
  battleMode,
  setBattleMode,
  onStart,
}: {
  deck: [string, string, string, string];
  trophies: number;
  rankProgressTrophies: number;
  rankedStars: number;
  battleMode: "standard" | "ranked";
  setBattleMode: (mode: "standard" | "ranked") => void;
  onStart: () => void;
}) {
  const deckCards = deck.map((id) => CARDS.find((c) => c.id === id));
  const deckStoneCost = deckCards.reduce((sum, c) => sum + (c ? c.stoneCost : 0), 0);
  const isDeckComplete = deckCards.every(Boolean);
  const isCostValid = deckStoneCost <= 20;
  const ready = isDeckComplete && isCostValid;
  const arena = arenaForTrophies(trophies);

  const arenaIndex = ARENAS.findIndex((a) => a.id === arena.id);
  const isLastArena = arenaIndex === ARENAS.length - 1;
  const nextArena = !isLastArena ? ARENAS[arenaIndex + 1] : null;

  // Let's compute progress towards the next arena unlock
  let percent = 100;
  let label = `${trophies} / ${arena.max} 🏆`;
  if (nextArena) {
    const minTrophies = arena.min;
    const maxTrophies = arena.max; // This is where the next arena starts
    const progress = trophies - minTrophies;
    const range = maxTrophies - minTrophies;
    percent = Math.min(100, Math.max(0, (progress / range) * 100));
    label = `${trophies} / ${maxTrophies} 🏆`;
  } else {
    // If we've reached Efsanevi Arena (the maximum category)
    const progress = trophies - arena.min;
    const range = MAX_TROPHIES - arena.min;
    percent = Math.min(100, Math.max(0, (progress / range) * 100));
    label = `${trophies} / ${MAX_TROPHIES} 🏆`;
  }

  const getArenaVisuals = (arenaId: number) => {
    switch (arenaId) {
      case 1: return { emoji: "🌳🏡🏰", desc: "Battlefield with lots of grass" };
      case 2: return { emoji: "🏜️🌵🦂", desc: "Harsh desert storm" };
      case 3: return { emoji: "❄️🏔️⛄", desc: "Dondurucu karlar arası" };
      case 4: return { emoji: "🏛️👑💫", desc: "Parade of grand champions" };
      case 5: return { emoji: "❄️🧊🌨️", desc: "Cold ice kingdom" };
      case 6: return { emoji: "🐸🌿🌾", desc: "Dangerous green swamp" };
      case 7: return { emoji: "🌊🦈🐠", desc: "Derin okyanus dalgaları" };
      case 8: return { emoji: "🌋🔥👿", desc: "Hell erupting with lava" };
      case 9: return { emoji: "⛩️🏯🏮", desc: "Temple where ancient spirits awaken" };
      case 10: return { emoji: "🏔️🧗‍♂️🐐", desc: "Bulutlara uzanan dondurucu zirve" };
      case 11: return { emoji: "🌸🌸🍡", desc: "Garden with falling pink petals" };
      default: return { emoji: "⚔️🏆🌟", desc: "Efsanevi Battle Alanı" };
    }
  };

  const visuals = getArenaVisuals(arena.id);
  const rank = getRankForRankProgress(rankProgressTrophies);

  return (
    <div className="space-y-4">
      {/* Mode Switcher Segment Control */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-md">
        <button
          onClick={() => setBattleMode("standard")}
          className={cn(
            "rounded-xl py-2.5 font-display text-sm transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer",
            battleMode === "standard"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md"
              : "text-slate-400 hover:text-white"
          )}
        >
          <span>🏆</span> Trophy Mode
        </button>
        <button
          onClick={() => {
            if (trophies >= 3500) {
              setBattleMode("ranked");
            }
          }}
          className={cn(
            "rounded-xl py-2.5 font-display text-sm transition-all duration-300 flex items-center justify-center gap-1.5 relative overflow-hidden cursor-pointer",
            battleMode === "ranked"
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-md"
              : "text-slate-400 hover:text-white",
            trophies < 3500 && "opacity-45 cursor-not-allowed"
          )}
        >
          {trophies < 3500 ? (
            <span className="flex items-center gap-1 text-slate-400">
              <span>🔒</span> Ranked Mode
            </span>
          ) : (
            <>
              <div className="absolute top-0 right-0 bg-red-500 text-[7px] font-mono font-bold px-1 rounded-bl-md uppercase animate-pulse leading-none py-0.5">Yeni</div>
              <span>⭐</span> Ranked Mode
            </>
          )}
        </button>
      </div>

      {trophies < 3500 && (
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl px-3 py-2 text-center shadow-inner">
          <span className="text-[11px] text-slate-400 font-medium">
            🔒 Ranked Mode unlocks at <b>3500 Trophies (Legendary Arena)</b>. Win {3500 - trophies} more trophies to enter the Champions League!
          </span>
        </div>
      )}

      {/* Redesigned Arena Photo with Progress Bar Underneath */}
      <div 
        className={cn(
          "rounded-2xl border-2 p-4 text-center text-white relative overflow-hidden shadow-xl transition-all duration-500",
          battleMode === "ranked" ? "border-cyan-500 bg-cyan-950/45 shadow-[0_0_20px_rgba(6,182,212,0.25)]" : "border-black/50"
        )}
        style={{ background: battleMode === "ranked" ? "radial-gradient(circle at center, #0e2942 0%, #030712 100%)" : arena.bg }}
      >
        {/* Subtle decorative visual overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30 pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className={cn(
            "inline-block uppercase tracking-widest text-[9px] border px-2 py-0.5 rounded-full font-mono font-bold",
            battleMode === "ranked" 
              ? "bg-cyan-950/80 border-cyan-500/40 text-cyan-300" 
              : "bg-black/50 border-white/10 text-amber-200"
          )}>
            {battleMode === "ranked" ? "RANKED LEAGUE SYSTEM" : `Active League Rank · Arena ${arena.id}`}
          </div>
          <h2 className="text-stroke text-3xl text-white font-display leading-none">
            {battleMode === "ranked" ? "Ranked Arena" : arena.name}
          </h2>
          <p className="text-stroke-sm text-xs text-white/90 italic font-medium leading-none">
            {battleMode === "ranked" ? "Collect stars, reach legendary ranks!" : ""}
          </p>

          <div className="py-4 flex justify-center scale-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            <span className="text-6xl animate-pulse duration-1000">
              {battleMode === "ranked" ? "🌟💎⚔️" : visuals.emoji}
            </span>
          </div>

          {battleMode === "standard" ? (
            /* Trophy progress slider bar underneath the Arena */
            <div className="pt-2 space-y-1">
              <div className="flex justify-between items-center text-xs font-bold font-display px-0.5">
                <span className="text-amber-200">Trophy Progress</span>
                <span className="text-white bg-black/40 px-2 py-0.5 rounded font-mono">{label}</span>
              </div>
              
              {/* The beautiful fluid progress bar */}
              <div className="h-5 w-full bg-slate-950 border border-slate-800 rounded-full p-0.5 shadow-inner overflow-hidden relative flex items-center">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 border border-emerald-300/30 transition-all duration-500 relative flex items-center"
                  style={{ width: `${percent}%` }}
                >
                  {/* Shiny gloss effect on the progress fill */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-full" />
                </div>
              </div>

              {/* Next arena hint detail overlay */}
              <div className="text-[10px] text-amber-100/80 font-display flex items-center justify-between pt-0.5">
                <span>{arena.min} 🏆</span>
                {nextArena ? (
                  <span>Next arena: <b className="text-white text-[11px] underline font-bold">{nextArena.name}</b> ({nextArena.min} 🏆)</span>
                ) : (
                  <span className="text-amber-300 font-bold">🌟 Efsanevi Seviyenin Zirvesi!</span>
                )}
                <span>{nextArena ? nextArena.min : MAX_TROPHIES} 🏆</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modern Rank/League Tracking Card */}
      {battleMode === "standard" && (
        <div className="panel-3d rounded-2xl p-4 bg-slate-900 border border-slate-800/80 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-4xl drop-shadow">{rank.current.emoji}</div>
            <div className="text-left font-display">
              <div className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Mevcut Rank</div>
              <div className={cn("text-lg font-black text-stroke-sm tracking-tight leading-tight mt-0.5", 
                rank.current.name.includes("Bronz") ? "text-amber-600" : 
                rank.current.name.includes("Silver") ? "text-slate-300" : 
                rank.current.name.includes("Gold") ? "text-yellow-400" : "text-cyan-400"
              )}>{rank.current.name}</div>
            </div>
          </div>
          <div className="text-right font-display pl-4 flex-1 max-w-[150px]">
            <div className="flex justify-between items-center text-[9.5px] text-amber-200 font-bold mb-1">
              <span>Rank Progression</span>
              <span>{rank.next ? `${Math.floor(rank.currentProgressValue)}/${rank.requiredForNext}` : "MAX"}</span>
            </div>
            <div className="h-2 w-full bg-slate-950 border border-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                style={{ width: `${rank.progress}%` }}
              />
            </div>
            {rank.next && (
              <div className="text-[10px] text-slate-400 mt-1 leading-none font-medium">
                Sonraki: <span className="text-white font-bold">{rank.next.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Battle Readylığı Actions */}
      <div className={cn(
        "panel-3d rounded-2xl p-4 text-center transition-all duration-500",
        battleMode === "ranked" ? "border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-gradient-to-b from-slate-900 to-cyan-950/20" : ""
      )}>
        <button
          disabled={!ready}
          onClick={onStart}
          className={cn(
            "mx-auto block w-full rounded-2xl py-3.5 font-display text-2xl text-primary-foreground text-stroke transition-all duration-300",
            battleMode === "ranked" 
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-b-4 border-blue-700 active:border-b-0 shadow-lg hover:shadow-cyan-500/20" 
              : "btn-pop active:btn-pop-active shadow-lg",
            !ready && "opacity-50",
          )}
        >
          {!isDeckComplete ? "Build your dect first" : (!isCostValid ? "dect Limit Exceeded (Max 20)" : (battleMode === "ranked" ? "RANKED ENTER BATTLE! ⚔️" : "ENTER BATTLE! ⚔️"))}
        </button>
      </div>

      {/* Fighters Deck List */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-stroke text-lg text-white font-display">Active Battle dect</h3>
          <span className={cn(
            "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm border",
            isCostValid 
              ? "bg-indigo-950/80 text-cyan-300 border-indigo-400/30" 
              : "bg-red-950/80 text-red-300 border-red-500/50 animate-pulse"
          )}>
            💎 {deckStoneCost}/20 Stone
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-2xl panel-3d p-3">
          {deckCards.map((card, i) =>
            card ? (
              <GameCard key={i} card={card} size="sm" />
            ) : (
              <div
                key={i}
                className="grid aspect-[3/4] w-20 place-items-center rounded-xl border-2 border-dashed border-amber-300/40 text-amber-300/40 text-3xl font-bold"
              >
                ?
              </div>
            ),
          )}
        </div>
      </div>

      <div className="rounded-2xl panel-3d p-3.5 text-xs text-amber-100/90 leading-relaxed">
        <h3 className="text-stroke text-base text-white mb-1 font-display">Battle Rewardsi</h3>
        {battleMode === "ranked" ? (
          <ul className="space-y-1">
            <li>• Battleı kazanırsan: <b>1.000🪙 · +10⭐</b> kazanırsın.</li>
            <li>• If you lose the battle: you drop <b>-10 to -20⭐</b>.</li>
            <li>• Collect required ⭐ in each division and reach legendary ranks!</li>
          </ul>
        ) : (
          <ul className="space-y-1">
            <li>• Defeat opponent with similar trophies: <b>1.000🪙 · +10🏆</b></li>
            <li>• Defeat opponent with higher trophies: <b>2.000🪙 · +15🏆</b></li>
            <li>• Defeat opponent with lower trophies: <b>500🪙 · +7🏆</b></li>
            <li>• If battle is lost: <b>-4 to -7🏆</b> trophies dropped.</li>
          </ul>
        )}
      </div>
    </div>
  );
}

function ChestsTab({
  gold,
  unlockedEmojies,
  wins,
  tournamentWins,
  onOpen,
  onBuyEmoji,
  trophies,
  rankedStars,
  onUpdateResources,
  onResetRankedStars,
}: {
  gold: number;
  unlockedEmojies: string[];
  wins: number;
  tournamentWins: number;
  onOpen: (id: string) => void;
  onBuyEmoji: (emoji: string, cost: number) => void;
  trophies: number;
  rankedStars: number;
  onUpdateResources: (trophies: number, gold: number, rankedStars?: number) => void;
  onResetRankedStars: () => void;
}) {
  const maxWins = Math.max(wins, tournamentWins);

  return (
    <div className="space-y-6">

      <div className="space-y-3">
        <h2 className="text-stroke text-2xl text-white">Shop</h2>
        
        <div className="grid grid-cols-1 gap-3">
          {CHESTS.map((chest) => {
            const can = gold >= chest.cost;
            return (
              <div
                key={chest.id}
                className="panel-3d flex items-center gap-3 rounded-2xl p-3 bg-gradient-to-br from-slate-900/90 to-slate-950/90"
              >
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-5xl shadow-inner border border-slate-800/80">
                  {chest.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg text-white font-bold">{chest.name}</div>
                  <div className="text-xs text-amber-200/80">
                    {chest.cards} kart · Garanti min:{" "}
                    <span className="font-semibold text-stroke-sm text-white">
                      {RARITY_LABEL[chest.guaranteedMin]}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpen(chest.id)}
                    disabled={!can}
                    className={cn(
                      "mt-2 rounded-xl px-4 py-1.5 text-sm font-display text-primary-foreground text-stroke",
                      "btn-pop active:btn-pop-active",
                      !can && "opacity-50",
                    )}
                  >
                    🪙 {chest.cost.toLocaleString("tr-TR")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-800">
        <h2 className="text-stroke text-2xl text-white">Emojies</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHOP_EMOJIS.map(({ emoji, cost }) => {
            const hasEmoji = unlockedEmojies.includes(emoji);
            const can = !hasEmoji && gold >= cost;
            return (
              <div key={emoji} className="panel-3d flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-center">
                <div className="text-4xl">{emoji}</div>
                <button
                  onClick={() => onBuyEmoji(emoji, cost)}
                  disabled={hasEmoji || !can}
                  className={cn(
                    "mt-1 w-full rounded-xl px-2 py-1.5 text-xs font-display text-primary-foreground text-stroke whitespace-nowrap",
                    hasEmoji ? "bg-slate-700 text-slate-300" : "btn-pop active:btn-pop-active",
                    !hasEmoji && !can && "opacity-50"
                  )}
                >
                  {hasEmoji ? "Sahipsin" : `🪙 ${cost.toLocaleString("tr-TR")}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChestReveal({
  chestName,
  rewards,
  onClose,
}: {
  chestName: string;
  rewards: { card: CardDef; isDuplicate: boolean; refundGold: number }[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "tapping" | "summary">("intro");
  const [tapCount, setTapCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const getChestEmoji = (isOpen = false) => {
    if (chestName.includes("Efsanevi")) return isOpen ? "💫" : "✨";
    if (chestName.includes("Epik")) return isOpen ? "👑" : "🏆";
    if (chestName.includes("Nadir")) return isOpen ? "🎉" : "🎁";
    return isOpen ? "🔓" : "📦";
  };

  const startTapping = () => {
    if (isShaking || phase !== "intro") return;
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPhase("tapping");
      setTapCount(1);
    }, 450);
  };

  const handleTapNext = () => {
    if (isShaking || phase !== "tapping") return;
    if (tapCount >= rewards.length) {
      setPhase("summary");
      return;
    }
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setTapCount((tc) => {
        const nextVal = tc + 1;
        if (nextVal > rewards.length) {
          setPhase("summary");
          return rewards.length;
        }
        return nextVal;
      });
    }, 450);
  };

  const activeReward = rewards[Math.max(0, Math.min(tapCount, rewards.length) - 1)];
  const activeCard = activeReward?.card;

  const getRarityGlowClass = (rarity: Rarity) => {
    switch (rarity) {
      case "rare": return "shadow-[0_0_25px_#3b82f6] border-blue-500 bg-blue-950/60";
      case "epic": return "shadow-[0_0_30px_#a855f7] border-purple-500 bg-purple-950/60";
      case "legendary": return "shadow-[0_0_45px_#eab308] border-yellow-500 bg-yellow-950/70";
      default: return "shadow-[0_0_15px_rgba(255,255,255,0.15)] border-slate-600 bg-slate-900/60";
    }
  };

  const getRarityTextClass = (rarity: Rarity) => {
    switch (rarity) {
      case "rare": return "text-blue-300 font-bold";
      case "epic": return "text-purple-300 font-bold";
      case "legendary": return "text-yellow-300 font-black animate-pulse";
      default: return "text-slate-350";
    }
  };

  const getRarityBgClass = (rarity: Rarity) => {
    switch (rarity) {
      case "rare": return "bg-blue-600/30 border-blue-500/50";
      case "epic": return "bg-purple-600/30 border-purple-500/50";
      case "legendary": return "bg-yellow-600/30 border-yellow-500/50";
      default: return "bg-slate-700/30 border-slate-605/50";
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm select-none">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div 
            key="intro"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={startTapping}
            className="w-full max-w-sm rounded-[24px] panel-3d p-6 text-center cursor-pointer transition-all active:scale-95 space-y-5 bg-gradient-to-b from-slate-900/90 to-black/95 border border-slate-800/60"
          >
            <div className="text-stroke text-3xl text-yellow-400 font-display uppercase tracking-widest">{chestName}</div>
            <p className="text-amber-200/90 text-sm font-medium animate-pulse">Tap the chest to open! 👇</p>
            
            <div className="relative py-6 flex justify-center">
              <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full scale-75 animate-pulse" />
              <motion.span 
                animate={{ 
                  y: isShaking ? [0, -15, 15, -10, 10, -5, 5, 0] : [0, -10, 0],
                  rotate: isShaking ? [0, -15, 12, -10, 8, -5, 3, 0] : 0
                }}
                transition={{ 
                  y: isShaking ? { duration: 0.45 } : { repeat: Infinity, duration: 2, ease: "easeInOut" },
                  rotate: { duration: 0.45 }
                }}
                className="text-9xl filter drop-shadow-[0_10px_25px_rgba(234,179,8,0.55)] select-none block"
              >
                {getChestEmoji(false)}
              </motion.span>
            </div>

            <div className="text-slate-400 text-xs font-mono bg-black/50 py-2.5 rounded-xl border border-slate-900">
              Chest Content: {rewards.length} Character Cards
            </div>
            
            <button className="mx-auto block w-full py-3 font-display text-lg text-primary-foreground text-stroke btn-pop active:btn-pop-active mt-2">
              START OPENING! ⚔️
            </button>
          </motion.div>
        )}

        {phase === "tapping" && activeCard && (
          <motion.div 
            key="tapping"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handleTapNext}
            className="w-full max-w-sm rounded-[24px] panel-3d p-5 text-center space-y-4 bg-gradient-to-b from-slate-900/95 to-black/95 border border-slate-800/80 cursor-pointer select-none active:scale-[0.99] transition-transform"
          >
            {/* Interactive Chest Emoji at the Top */}
            <div 
              className="relative transition-transform hover:scale-105 bg-black/40 p-3 rounded-2xl border border-slate-850 flex flex-col items-center justify-center gap-1"
            >
              <div className="absolute -top-2.5 bg-yellow-500 text-amber-950 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-black shadow">
                {tapCount} / {rewards.length} CARD OPENED
              </div>
              
              <div className="relative pt-1 flex justify-center">
                <div className="absolute inset-x-0 bottom-0 h-4 w-12 bg-yellow-500/20 blur-md rounded-full" />
                <motion.span 
                  animate={{ 
                    y: isShaking ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
                    rotate: isShaking ? [0, -12, 10, -8, 6, -4, 2, 0] : 0,
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{ 
                    y: { duration: 0.45 },
                    rotate: { duration: 0.45 },
                    scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                  }}
                  className="text-7xl filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.4)] select-none block"
                >
                  {getChestEmoji(true)}
                </motion.span>
              </div>
              <div className="text-[10px] text-amber-300 font-bold font-display tracking-wider animate-pulse uppercase">
                {tapCount < rewards.length ? "Tap the Chest! 👆" : "Tap for Summary! 👆"}
              </div>
            </div>

            {/* Revealed Card popping out of the chest */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={tapCount}
                initial={{ scale: 0.3, y: -40, opacity: 0, rotate: -8 }}
                animate={{ scale: 1.05, y: 0, opacity: 1, rotate: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                className="py-4 flex flex-col items-center justify-center"
              >
                <div className={cn("px-6 py-5 rounded-[20px] border-2 transition-all flex flex-col items-center justify-center transform w-52 shadow-2xl relative", getRarityGlowClass(activeCard.rarity))}>
                  <span className="text-7xl mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] select-none animate-bounce duration-1000">{activeCard.emoji}</span>
                  <div className="font-display text-2xl text-white text-stroke leading-tight tracking-wide">{activeCard.name}</div>
                  <div className={cn("text-xs font-black tracking-wider font-display uppercase mt-1 px-3 py-0.5 rounded-full border text-stroke-sm", getRarityTextClass(activeCard.rarity), getRarityBgClass(activeCard.rarity))}>
                    {RARITY_LABEL[activeCard.rarity]}
                  </div>
                </div>

                {/* Duplicate gold conversion or shiny new badge */}
                {activeReward.isDuplicate ? (
                  <div className="mt-4 flex flex-col items-center justify-center gap-1 rounded-2xl bg-yellow-500/15 border border-yellow-500/40 px-5 py-2 text-center animate-pulse shadow-md w-full max-w-[240px]">
                    <span className="text-[11px] text-yellow-500 font-bold uppercase tracking-wider">Already Unlocked!</span>
                    <span className="font-display text-base font-black text-amber-400 flex items-center justify-center gap-1 text-stroke-sm">
                      Gold Conversion: +{activeReward.refundGold} 🪙
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 inline-block rounded-full bg-emerald-500/30 border border-emerald-400/50 px-5 py-2 text-[11px] font-black text-emerald-300 animate-bounce tracking-widest shadow-md">
                    🎉 NEW FIGHTER UNLOCKED!
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stat Box Details */}
            <div className="space-y-1.5 bg-black/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="text-xs text-slate-350 flex justify-between">
                <span>HP Progression:</span>
                <span className="font-bold text-white">❤️ {activeCard.hp}</span>
              </div>
              <div className="text-xs text-slate-355 flex justify-between">
                <span>Maksimum Damage:</span>
                <span className="font-bold text-white">⚔️ {activeCard.dmg}</span>
              </div>
              <div className="text-xs text-slate-356 flex justify-between">
                <span>Saldırı Tipi:</span>
                <span className="font-bold text-amber-300 capitalize">{activeCard.range === "yakın" ? "Melee" : activeCard.range === "uzak" ? "Ranged" : "Air"}</span>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "summary" && (
          <motion.div 
            key="summary"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-[24px] panel-3d p-5 text-center space-y-4 bg-gradient-to-b from-slate-900/95 to-black/95 border border-slate-800/80 shadow-2xl"
          >
            <div className="text-stroke text-3xl text-yellow-400 font-display uppercase tracking-widest leading-none">CONGRATULATIONS! 🎉</div>
            <p className="text-xs text-slate-300 font-medium px-2 leading-relaxed">
              Rewards from chest successfully added to your account. Duplicate characters were automatically converted to Gold!
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-h-[30vh] overflow-y-auto p-1.5 bg-black/40 border border-slate-950 rounded-2xl my-4">
              {rewards.map((reward, i) => {
                const c = reward.card;
                return (
                  <div key={i} className="relative flex flex-col items-center p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 shadow-md">
                    <span className="text-4xl mb-1 select-none">{c.emoji}</span>
                    <span className="text-[10px] text-white font-bold font-display truncate w-full px-1">{c.name}</span>
                    <span className={cn("text-[8px] font-bold uppercase tracking-tight", getRarityTextClass(c.rarity))}>
                      {RARITY_LABEL[c.rarity]}
                    </span>
                    
                    {reward.isDuplicate ? (
                      <span className="absolute -top-1.5 -right-1 bg-yellow-500 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-full border border-black shadow">
                        +{reward.refundGold}🪙
                      </span>
                    ) : (
                      <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full border border-black shadow animate-pulse">
                        NEW!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="w-full text-center block rounded-2xl py-3.5 font-display text-xl text-primary-foreground text-stroke btn-pop active:btn-pop-active cursor-pointer shadow-lg animate-bounce"
            >
              TAMAM ✅
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArenasModal({ currentTrophies, onClose }: { currentTrophies: number; onClose: () => void }) {
  const nextArena = ARENAS.find((a) => a.min > currentTrophies);
  const trophiesToNext = nextArena ? nextArena.min - currentTrophies : 0;

  return (
    <div className="fixed inset-0 z-[1999] flex items-end justify-center bg-black/85 backdrop-blur-sm p-0">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full max-w-md h-[92vh] flex flex-col bg-slate-950 rounded-t-[32px] border-t border-slate-800/80 p-5 font-display overflow-hidden shadow-[0_-12px_30px_rgba(0,0,0,0.7)]"
      >
        {/* Pull Handle to swipe/tap down */}
        <div 
          className="w-12 h-1.5 bg-slate-800 hover:bg-slate-700 rounded-full mx-auto mb-4 cursor-pointer transition-colors shrink-0" 
          onClick={onClose} 
        />

        {/* Title Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <h2 className="text-2xl text-stroke text-white font-black tracking-tight">Arena Path</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-full w-9 h-9 flex items-center justify-center transition-all cursor-pointer shadow-md"
          >
            ✕
          </button>
        </div>

        {/* Current Trophy Progress Info Card */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 mb-5 shadow-inner shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-3.5xl drop-shadow">🏆</div>
            <div>
              <div className="text-[10px] text-slate-400 font-sans uppercase font-black tracking-wider">Current Trophies</div>
              <div className="text-lg font-black text-amber-400 leading-none mt-0.5">{currentTrophies} Trophy</div>
            </div>
          </div>
          <div className="text-right font-sans">
            {nextArena ? (
              <>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">To Next Arena</div>
                <div className="text-xs font-black text-cyan-400 mt-0.5">{trophiesToNext} 🏆 Left</div>
              </>
            ) : (
              <>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">Efsane</div>
                <div className="text-xs font-black text-amber-300 mt-0.5">Max Limit Reached!</div>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Arenas List */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 scrollbar-none overscroll-behavior-y-contain">
          {ARENAS.map((arena) => {
            const isUnlocked = currentTrophies >= arena.min;
            const isCurrent = currentTrophies >= arena.min && currentTrophies < arena.max;
            const unlocksCards = CARDS.filter((c) => arena.unlocks.includes(c.id));

            return (
              <div
                key={arena.id}
                className={cn(
                  "p-4 rounded-2xl border relative overflow-hidden transition-all duration-300",
                  isCurrent 
                    ? "border-emerald-500 bg-slate-900/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20" 
                    : isUnlocked 
                      ? "border-slate-800/80 bg-slate-900/30" 
                      : "border-slate-900/50 bg-slate-950/40 opacity-55 grayscale-[25%]"
                )}
              >
                {/* Arena Biome Background Overlay */}
                <div 
                  className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none transition-opacity group-hover:opacity-30" 
                  style={{ background: arena.bg }} 
                />

                <div className="relative z-10 space-y-3">
                  {/* Title Bar inside the Arena Card */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="text-lg text-white font-black text-stroke drop-shadow-md leading-none">
                          {arena.name}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-1">Arena {arena.id}</div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="text-xs font-black text-amber-400 font-sans">
                        {arena.min}+ 🏆
                      </div>
                      <div className="mt-1">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 text-[8px] font-black tracking-wider rounded bg-emerald-500 text-slate-950 font-sans shadow shadow-emerald-500/20 uppercase">
                            Current Arena
                          </span>
                        ) : isUnlocked ? (
                          <span className="px-2 py-0.5 text-[8px] font-bold rounded bg-slate-800 text-slate-400 font-sans">
                            Unlocked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-bold rounded bg-slate-900 text-slate-500 font-sans flex items-center gap-1">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cards Unlock Area */}
                  <div>
                    <div className="text-[10px] text-slate-400 mb-2 font-sans font-bold uppercase tracking-wider">
                      Unlocked Cards
                    </div>
                    {unlocksCards.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                        {unlocksCards.map((c) => (
                          <div key={c.id} className="flex-none snap-start relative w-14">
                            <div className={cn(
                              "w-14 h-16 rounded-xl border shadow-md bg-gradient-to-br flex items-center justify-center text-3.5xl transition-transform active:scale-95 relative overflow-hidden",
                              c.rarity === "legendary" ? "from-purple-950 to-indigo-950 border-purple-500/80 shadow-purple-500/10" :
                              c.rarity === "epic" ? "from-pink-950 to-rose-950 border-pink-500/80 shadow-pink-500/10" :
                              c.rarity === "rare" ? "from-amber-950 to-orange-950 border-amber-500/80 shadow-amber-500/10" :
                              "from-slate-800 to-slate-900 border-slate-700/80"
                            )}>
                              {c.emoji}
                              <div className={cn(
                                "absolute bottom-0 inset-x-0 text-[6.5px] font-black text-center py-0.5 uppercase tracking-wide leading-none",
                                c.rarity === "legendary" ? "bg-purple-500/30 text-purple-300" :
                                c.rarity === "epic" ? "bg-pink-500/30 text-pink-300" :
                                c.rarity === "rare" ? "bg-amber-500/30 text-amber-300" :
                                "bg-slate-700/30 text-slate-400"
                              )}>
                                {c.rarity === "legendary" ? "LEG" : c.rarity === "epic" ? "EPIC" : c.rarity === "rare" ? "RARE" : "COM"}
                              </div>
                            </div>
                            <div className="text-[9px] text-center text-slate-300 font-sans mt-1 truncate font-semibold leading-none px-0.5">
                              {c.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic font-sans py-1">
                        No new cards in this arena.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
