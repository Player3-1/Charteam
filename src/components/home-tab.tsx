import { useState, useEffect } from "react";
import { usePlayer } from "@/hooks/use-player";
import { UserData } from "@/types";
import {
  CARDS,
  CHESTS,
  RARITY_LABEL,
  pickCardByRarity,
  rollRarity,
  type CardDef,
  type Rarity,
} from "@/lib/cards";
import { ARENAS, arenaForTrophies, MAX_TROPHIES } from "@/lib/arenas";
import { GameCard } from "@/components/game-card";
import { BattleScreen } from "@/components/battle-screen";
import { LeaderboardTab } from "@/components/leaderboard";
import { MetaTab } from "@/components/meta-tab";
import { MatchmakingModal } from "@/components/matchmaking-modal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type Tab = "battle" | "cards" | "chests" | "leaderboard" | "meta";

export function Home({ user }: { user: UserData }) {
  const { state, hydrated, claimChestRewards, spendGold, setDeckSlot, applyMatchReward } = usePlayer(user.username);
  const [tab, setTab] = useState<Tab>("cards");
  const [openedRewards, setOpenedRewards] = useState<{ card: CardDef; isDuplicate: boolean; refundGold: number }[] | null>(null);
  const [openedChestName, setOpenedChestName] = useState("");
  const [inBattle, setInBattle] = useState(false);
  const [opponent, setOpponent] = useState<{name: string, trophies: number, battleId?: string, isPlayer1?: boolean} | null>(null);
  const [showMatchmaking, setShowMatchmaking] = useState(false);

  if (!hydrated || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-2xl font-display">
        Yükleniyor…
      </div>
    );
  }

  const arena = arenaForTrophies(state.trophies);

  const handleOpenChest = (chestId: string) => {
    const chest = CHESTS.find((c) => c.id === chestId)!;
    if (!spendGold(chest.cost)) return;
    const rolled: CardDef[] = [];
    // First card guarantees the minimum rarity (clamped to arena pool)
    const minOk = arena.pool.includes(chest.guaranteedMin)
      ? chest.guaranteedMin
      : arena.pool[arena.pool.length - 1];
    rolled.push(pickCardByRarity(minOk));
    for (let i = 1; i < chest.cards; i++) {
      const r: Rarity = rollRarity(arena.pool);
      rolled.push(pickCardByRarity(r));
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

    claimChestRewards(rewards);
    setOpenedChestName(chest.name);
    setOpenedRewards(rewards);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-950">
      <header className="sticky top-0 z-20 panel-3d px-3 pb-3 pt-8 flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-black/40 bg-gradient-to-br from-amber-300 to-amber-600 text-lg font-display text-amber-950 shadow-inner shrink-0">
            {state.username[0]}
          </div>
          <div>
            <div className="font-display text-lg leading-none text-stroke text-white">
              {state.username}
            </div>
            <div className="mt-0.5 text-xs text-amber-200/90">
              Arena {arena.id} · {arena.name}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
          <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
        </div>
      </header>

      <main className="flex-1 px-3 pb-28 pt-4">
        {tab === "battle" && (
          <BattleTab
            deck={state.deck}
            trophies={state.trophies}
            onStart={() => setShowMatchmaking(true)}
          />
        )}
        {tab === "cards" && (
          <CardsTab
            collection={state.collection}
            deck={state.deck}
            setDeckSlot={setDeckSlot}
          />
        )}
        {tab === "chests" && (
          <ChestsTab gold={state.gold} arenaPool={arena.pool} onOpen={handleOpenChest} />
        )}
        {tab === "leaderboard" && (
          <LeaderboardTab />
        )}
        {tab === "meta" && (
          <MetaTab />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[1000] mx-auto max-w-md panel-3d rounded-t-2xl rounded-b-none px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          <NavBtn active={tab === "meta"} onClick={() => setTab("meta")} icon="📊" label="Meta" />
          <NavBtn active={tab === "chests"} onClick={() => setTab("chests")} icon="🎁" label="Sandıklar" />
          <NavBtn active={tab === "battle"} onClick={() => setTab("battle")} icon="⚔️" label="Savaş" big />
          <NavBtn active={tab === "cards"} onClick={() => setTab("cards")} icon="🃏" label="Kartlar" />
          <NavBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} icon="🏆" label="Sıralama" />
        </div>
      </nav>

      {showMatchmaking && (
    <MatchmakingModal
      user={{...user, ...state}}
      onMatchFound={(opp) => {
        setOpponent(opp);
        setShowMatchmaking(false);
        setInBattle(true);
      }}
      onCancel={() => setShowMatchmaking(false)}
    />
      )}

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
          trophies={state.trophies}
          opponentName={opponent.name}
          opponentTrophies={opponent.trophies}
          battleId={opponent.battleId}
          isPlayer1={opponent.isPlayer1}
          onFinish={(gold, trophy, win) => {
            applyMatchReward(gold, trophy, win);
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
  setDeckSlot,
}: {
  collection: Record<string, number>;
  deck: [string, string, string, string];
  setDeckSlot: (slot: number, cardId: string) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const owned = CARDS.filter((c) => (collection[c.id] ?? 0) > 0);
  const locked = CARDS.filter((c) => (collection[c.id] ?? 0) === 0);

  // When a user clicks a slot in their deck (Destem)
  const handleSlotClick = (i: number, hasCard: boolean) => {
    if (hasCard) {
      // Empty the slot immediately
      setDeckSlot(i, "");
      // Set this slot as active/selected so they can fill it
      setActiveSlot(i);
    } else {
      // If clicked empty slot, toggle or set active slot
      setActiveSlot(activeSlot === i ? null : i);
    }
  };

  const handleCollectionCardClick = (cardId: string) => {
    const inDeckIndex = deck.indexOf(cardId);
    if (inDeckIndex >= 0) {
      // It is already in the deck! Remove it immediately.
      setDeckSlot(inDeckIndex, "");
      // Make that slot the active slot so they can easily replace / fill it.
      setActiveSlot(inDeckIndex);
    } else {
      // It is not in the deck.
      // 1. If there's an active slot, put it there.
      if (activeSlot !== null) {
        setDeckSlot(activeSlot, cardId);
        // Simulate new deck to find NEXT empty slot
        const simulatedDeck = [...deck];
        simulatedDeck[activeSlot] = cardId;
        const nextEmpty = simulatedDeck.findIndex((id) => id === "");
        if (nextEmpty >= 0) {
          setActiveSlot(nextEmpty);
        } else {
          setActiveSlot(null);
        }
      } else {
        // 2. If there's no active slot, check if there's any empty slot in the deck.
        const firstEmptySlot = deck.indexOf("");
        if (firstEmptySlot >= 0) {
          setDeckSlot(firstEmptySlot, cardId);
          // Simulate new deck to find NEXT empty slot
          const simulatedDeck = [...deck];
          simulatedDeck[firstEmptySlot] = cardId;
          const nextEmpty = simulatedDeck.findIndex((id) => id === "");
          if (nextEmpty >= 0) {
            setActiveSlot(nextEmpty);
          } else {
            setActiveSlot(null);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex flex-col justify-start">
          <h2 className="text-stroke text-2xl text-white">Destem</h2>
          <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium min-h-[16px] leading-tight">
            {activeSlot !== null 
              ? "👉 Doldurmak için alttaki karakterlerden birine bas!" 
              : "ℹ️ Savaşçıyı çıkartmak için üstüne dokun."}
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
                        SEÇİLİ
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
        <h2 className="mb-2 text-stroke text-2xl text-white font-display">
          Koleksiyon · {owned.length}/{CARDS.length}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[...owned, ...locked].map((card) => {
            const isOwned = (collection[card.id] ?? 0) > 0;
            const inDeck = deck.includes(card.id);
            return (
              <div key={card.id} className="flex justify-center">
                <GameCard
                  card={card}
                  owned={collection[card.id] ?? 0}
                  locked={!isOwned}
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
  onStart,
}: {
  deck: [string, string, string, string];
  trophies: number;
  onStart: () => void;
}) {
  const deckCards = deck.map((id) => CARDS.find((c) => c.id === id));
  const ready = deckCards.every(Boolean);
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

  // Visual features of biochem
  const getArenaVisuals = (biome: typeof arena.biome) => {
    switch (biome) {
      case "grass": return { emoji: "🌳🏡🏰", desc: "Bol çimenli savaş alanı" };
      case "desert": return { emoji: "🏜️🌵🦂", desc: "Zorlu çöl fırtınası" };
      case "snow": return { emoji: "❄️🏔️⛄", desc: "Dondurucu buz kalesi" };
      default: return { emoji: "🏛️👑💫", desc: "Büyük şampiyonlar geçidi" };
    }
  };

  const visuals = getArenaVisuals(arena.biome);

  return (
    <div className="space-y-4">
      {/* Redesigned Arena Photo with Progress Bar Underneath */}
      <div 
        className="rounded-2xl border-2 border-black/50 p-4 text-center text-white relative overflow-hidden shadow-xl"
        style={{ background: arena.bg }}
      >
        {/* Subtle decorative visual overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30 pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-block uppercase tracking-widest text-[9px] bg-black/50 border border-white/10 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
            Aktif Lig Derecesi · Arena {arena.id}
          </div>
          <h2 className="text-stroke text-3xl text-white font-display leading-none">{arena.name}</h2>
          <p className="text-stroke-sm text-xs text-white/90 italic font-medium leading-none">{visuals.desc}</p>

          <div className="py-4 flex justify-center scale-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            <span className="text-6xl animate-pulse duration-1000">{visuals.emoji}</span>
          </div>

          {/* Trophy progress slider bar underneath the Arena */}
          <div className="pt-2 space-y-1">
            <div className="flex justify-between items-center text-xs font-bold font-display px-0.5">
              <span className="text-amber-200">Kupa İlerlemesi</span>
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
                <span>Sonraki arena: <b className="text-white text-[11px] underline font-bold">{nextArena.name}</b> ({nextArena.min} 🏆)</span>
              ) : (
                <span className="text-amber-300 font-bold">🌟 Efsanevi Seviyenin Zirvesi!</span>
              )}
              <span>{nextArena ? nextArena.min : MAX_TROPHIES} 🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Savaş Hazırlığı Actions */}
      <div className="panel-3d rounded-2xl p-4 text-center">
        <button
          disabled={!ready}
          onClick={onStart}
          className={cn(
            "mx-auto block w-full rounded-2xl py-3.5 font-display text-2xl text-primary-foreground text-stroke",
            "btn-pop active:btn-pop-active shadow-lg",
            !ready && "opacity-50",
          )}
        >
          {ready ? "SAVAŞA GİR! ⚔️" : "Önce desteni kur"}
        </button>
      </div>

      {/* Savaşçılar Deste List */}
      <div>
        <h3 className="mb-2 text-stroke text-lg text-white font-display">Aktif Savaş Desten</h3>
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
        <h3 className="text-stroke text-base text-white mb-1 font-display">Savaş Ödülleri</h3>
        <ul className="space-y-1">
          <li>• Yakın kupalı rakibi yen: <b>1.000🪙 · +10🏆</b></li>
          <li>• Üst kupalı rakibi yen: <b>2.000🪙 · +15🏆</b></li>
          <li>• Düşük kupalı rakibi yen: <b>500🪙 · +7🏆</b></li>
          <li>• Savaş kaybedilirse: <b>−4 ile −7🏆</b> kupa düşer.</li>
        </ul>
      </div>
    </div>
  );
}

function ChestsTab({
  gold,
  arenaPool,
  onOpen,
}: {
  gold: number;
  arenaPool: Rarity[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-stroke text-2xl text-white">Sandıklar</h2>
      <p className="text-sm text-amber-200/85 bg-black/30 p-2 rounded-xl border border-dashed border-amber-400/20">
        Bu arenadan çıkabilen nadirlikler:{" "}
        <b className="text-white">{arenaPool.map((r) => RARITY_LABEL[r]).join(", ")}</b>
      </p>
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
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPhase("tapping");
      setTapCount(1);
    }, 450);
  };

  const handleTapNext = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      if (tapCount < rewards.length) {
        setTapCount((tc) => tc + 1);
      } else {
        setPhase("summary");
      }
    }, 450);
  };

  const activeReward = rewards[tapCount - 1];
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
            <p className="text-amber-200/90 text-sm font-medium animate-pulse">Açmak için sandığa dokun! 👇</p>
            
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
              Sandık İçeriği: {rewards.length} Adet Karakter Kartı
            </div>
            
            <button className="mx-auto block w-full py-3 font-display text-lg text-primary-foreground text-stroke btn-pop active:btn-pop-active mt-2">
              AÇMAYA BAŞLA! ⚔️
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
                {tapCount} / {rewards.length} KART AÇILDI
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
                {tapCount < rewards.length ? "Sandığa Tıkla! 👆" : "Özet İçin Tıkla! 👆"}
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
                    <span className="text-[11px] text-yellow-500 font-bold uppercase tracking-wider">Zaten Açılmış!</span>
                    <span className="font-display text-base font-black text-amber-400 flex items-center justify-center gap-1 text-stroke-sm">
                      Altın Dönüşümü: +{activeReward.refundGold} 🪙
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 inline-block rounded-full bg-emerald-500/30 border border-emerald-400/50 px-5 py-2 text-[11px] font-black text-emerald-300 animate-bounce tracking-widest shadow-md">
                    🎉 YENİ SAVAŞÇI AÇILDI!
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stat Box Details */}
            <div className="space-y-1.5 bg-black/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="text-xs text-slate-350 flex justify-between">
                <span>HP Gelişimi:</span>
                <span className="font-bold text-white">❤️ {activeCard.hp}</span>
              </div>
              <div className="text-xs text-slate-355 flex justify-between">
                <span>Maksimum Hasar:</span>
                <span className="font-bold text-white">⚔️ {activeCard.dmg}</span>
              </div>
              <div className="text-xs text-slate-356 flex justify-between">
                <span>Saldırı Tipi:</span>
                <span className="font-bold text-amber-300 capitalize">{activeCard.range}</span>
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
            <div className="text-stroke text-3xl text-yellow-400 font-display uppercase tracking-widest leading-none">TEBRİKLER! 🎉</div>
            <p className="text-xs text-slate-300 font-medium px-2 leading-relaxed">
              Sandıktan çıkan ödüller başarıyla hesabına yüklendi. Koleksiyonunda bulunan karakterler otomatik olarak altına dönüştürüldü!
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
                        YENİ!
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
