import { useDuels } from "@/hooks/use-duels";
import { db } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import React, { useState, useEffect, useRef } from "react";
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
import { ARENAS, arenaForTrophies, getUnlockedCardsUpToTrophies, MAX_TROPHIES, getArenaForCard, getRankForTrophies, getRankForWins, getRankForRankProgress, RANK_REWARDS } from "@/lib/arenas";
import { CHARMS } from "@/lib/charms";
import { GameCard } from "@/components/game-card";
import { BattleScreen } from "@/components/battle-screen";
import { ArenasView } from "@/components/arenas-view";
import { MatchmakingModal } from "@/components/matchmaking-modal";
import { MetaTab } from "@/components/meta-tab";
import { LeaderboardTab } from "@/components/leaderboard";
import { RankedRoadModal } from "@/components/ranked-road-modal";
import { RankRewardsModal } from "@/components/rank-rewards-modal";
import { cn, getAvatarForName } from "@/lib/utils";
import { AnimatedEmoji } from "@/components/animated-emoji";
import { motion, AnimatePresence } from "motion/react";
import { SHOP_EMOJIS } from "@/lib/emojis";

export interface ChestRewardItem {
  card?: CardDef;
  isDuplicate?: boolean;
  refundGold?: number;
  type?: "card" | "charm" | "level_coin";
  charm?: { id: string; name: string; emoji: string; description: string };
  levelCoinsAmount?: number;
}

export function getRankedStarsDetails(points: number) {
  const totalStars = Math.floor(points / 10);
  const divisions = [
    { name: "Bronz Lig I", minStars: 0, icon: "🥉", style: "from-amber-700 to-amber-950 text-amber-300 border-amber-600 shadow-amber-900/40" },
    { name: "Bronz Lig II", minStars: 3, icon: "🥉", style: "from-amber-700 to-amber-950 text-amber-200 border-amber-500 shadow-amber-900/50" },
    { name: "Bronz Lig III", minStars: 6, icon: "🥉", style: "from-amber-700 to-amber-950 text-amber-100 border-amber-400 shadow-amber-900/60 font-semibold" },
    { name: "Gümüş Lig I", minStars: 9, icon: "🥈", style: "from-slate-600 to-slate-900 text-slate-200 border-slate-500 shadow-slate-700/40" },
    { name: "Gümüş Lig II", minStars: 12, icon: "🥈", style: "from-slate-600 to-slate-900 text-slate-100 border-slate-450 shadow-slate-700/50" },
    { name: "Gümüş Lig III", minStars: 15, icon: "🥈", style: "from-slate-600 to-slate-900 text-white border-slate-400 shadow-slate-700/60 font-semibold" },
    { name: "Altın Lig I", minStars: 18, icon: "🥇", style: "from-yellow-700 to-yellow-950 text-yellow-300 border-yellow-500 shadow-yellow-600/40 font-semibold" },
    { name: "Altın Lig II", minStars: 21, icon: "🥇", style: "from-yellow-700 to-yellow-950 text-yellow-200 border-yellow-400 shadow-yellow-600/50 font-bold" },
    { name: "Altın Lig III", minStars: 24, icon: "🥇", style: "from-yellow-700 to-yellow-950 text-amber-100 border-yellow-350 shadow-yellow-600/60 font-extrabold" },
    { name: "Elmas Savaşçı", minStars: 27, icon: "💎", style: "from-cyan-600 via-sky-900 to-blue-950 text-cyan-200 border-cyan-400 shadow-cyan-500/50 font-black animate-pulse" },
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



export { PROFILE_COLORS, PROFILE_FONTS, PROFILE_AVATARS } from "@/lib/profile-customization";
import { PROFILE_COLORS, PROFILE_FONTS, PROFILE_AVATARS } from "@/lib/profile-customization";

type Tab = "battle" | "cards" | "chests" | "meta" | "arenas" | "top3";

export function Home({ user }: { user: UserData }) {
  const { state, hydrated, claimChestRewards, spendGold, setDeckSlot, setActiveDeck, applyMatchReward, buyEmoji, buyCharm, buyLevelCoins, setCharmSlot, setEmojiSlot, setTrophies, setGold, updateResources, resetRankedStars, claimProgressionReward, cheatUnlockAll, updateProfileCustomization, importDeck, upgradeCardLevel, upgradeCardLevelWithGold, claimRankedReward, claimRankReward } = usePlayer(user.username);
  const { incomingDuels, outgoingDuels, sendDuelRequest, acceptDuel, declineDuel, cancelDuel } = useDuels(user.username);
  const [inBattle, setInBattle] = useState(false);


  const handleAcceptDuel = async (duel: any) => {
    try {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const battleId = `duel_${duel.challenger}_${user.username}_${rand}`;
      
      const oppRef = await getDoc(doc(db, "users", duel.challenger));
      const oppData = oppRef.exists() ? oppRef.data() : {};
      const p1Avatar = oppData?.avatar || getAvatarForName(duel.challenger);
      const p2Avatar = state.avatar || getAvatarForName(user.username);
      
      await setDoc(doc(db, "battles", battleId), {
        id: battleId,
        mode: "standard",
        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: oppData?.trophies ?? 1000,
           rankedStars: oppData?.rankedStars ?? 0,
           deck: oppData?.deck || ["mizrakli", "okcu", "dev", "kilicli"],
           wins: oppData?.wins ?? 0,
        },
        player2: { 
           username: user.username, 
           avatar: p2Avatar, 
           trophies: state.trophies,
           rankedStars: state.rankedStars ?? 0,
           deck: state.deck,
           wins: state.wins ?? 0,
        },
        player1Placements: [],
        player2Placements: [],
        player1Abilities: [],
        player2Abilities: [],
        player1Charms: [],
        player2Charms: [],
        status: "placing",
        createdAt: serverTimestamp(),
      });
      
      await acceptDuel(duel.id, battleId);
      
      setOpponent({
          name: duel.challenger,
          avatar: p1Avatar,
          trophies: oppData?.trophies ?? 1000,
          rankedStars: oppData?.rankedStars ?? 0,
          wins: oppData?.wins ?? 0,
          battleId,
          isPlayer1: false,
          mode: "standard"
      });
      setInBattle(true);
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  useEffect(() => {
    const accepted = outgoingDuels.find(d => d.status === "accepted" && d.battleId);
    if (accepted && !inBattle) {
       (async () => {
         const oppRef = await getDoc(doc(db, "users", accepted.challenged));
         const oppData = oppRef.exists() ? oppRef.data() : {};
         setOpponent({
            name: accepted.challenged,
            avatar: oppData?.avatar || getAvatarForName(accepted.challenged),
            trophies: oppData?.trophies ?? 1000,
            rankedStars: oppData?.rankedStars ?? 0,
            wins: oppData?.wins ?? 0,
            battleId: accepted.battleId,
            isPlayer1: true,
            mode: "standard"
         });
         setInBattle(true);
         cancelDuel(accepted.id); // clear it
       })();
    }
    
    const declined = outgoingDuels.find(d => d.status === "declined");
    if (declined) {
        alert(`${declined.challenged} davetini reddetti.`);
        cancelDuel(declined.id);
    }
  }, [outgoingDuels, inBattle]);
  const [tab, setTab] = useState<Tab>("cards");
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const [showProfileCustomizer, setShowProfileCustomizer] = useState(false);
  const [isRankedRoadOpen, setIsRankedRoadOpen] = useState(false);
  const [isRankRewardsOpen, setIsRankRewardsOpen] = useState(false);

  const unclaimedRankRewardsCount = (RANK_REWARDS || []).filter((reward) => {
    if (!state) return false;
    const isClaimed = state.claimedRankTiers?.includes(reward.targetRankId);
    if (isClaimed) return false;
    const currentProgress = state.rankProgressTrophies ?? 0;
    if (reward.targetRankId === "platin") {
      return currentProgress >= 7000 || (state.rankedStars ?? 0) >= (reward.reqStars || 140);
    }
    return currentProgress >= reward.reqTrophies;
  }).length;

  const handleClaimRankedReward = async (matchNum: number) => {
    if (!state) return;
    if (state.claimedRankedRewards?.includes(matchNum)) return;
    const currentMatches = state.rankedMatchesPlayed ?? 0;
    if (matchNum > currentMatches) return;

    let isGold = false;
    let isEpicChest = false;
    let isLegendaryChest = false;

    if (matchNum % 10 === 0) {
      isLegendaryChest = true;
    } else if (matchNum % 5 === 0) {
      isEpicChest = true;
    }

    if (matchNum % 2 === 0) {
      isGold = true;
    }

    let addedGold = 0;
    if (isGold) {
      if (matchNum >= 250) {
        addedGold = Math.floor(Math.random() * 5001) + 5000;
      } else if (matchNum >= 100) {
        addedGold = Math.floor(Math.random() * 4001) + 3000;
      } else {
        addedGold = Math.floor(Math.random() * 3001) + 2000;
      }
    }

    let rewardsList: { card: CardDef; isDuplicate: boolean; refundGold: number }[] = [];

    if (isEpicChest || isLegendaryChest) {
      const chestId = isEpicChest ? "gold" : "magic";
      const chest = CHESTS.find(c => c.id === chestId)!;
      
      const rolled: CardDef[] = [];
      const unlockedIds = getUnlockedCardsUpToTrophies(state.trophies);
      rolled.push(rollCardFromUnlocked(unlockedIds, chest.guaranteedMin, chest.allowedRarities));
      for (let i = 1; i < chest.cards; i++) {
        rolled.push(rollCardFromUnlocked(unlockedIds, undefined, chest.allowedRarities));
      }

      const tempCollection = { ...state.collection };
      const refundValues: Record<Rarity, number> = {
        common: 250,
        rare: 500,
        epic: 800,
        legendary: 6000,
      };

      for (const card of rolled) {
        const isDuplicate = (tempCollection[card.id] ?? 0) > 0;
        const refundGold = refundValues[card.rarity];
        rewardsList.push({
          card,
          isDuplicate,
          refundGold,
        });
        if (!isDuplicate) {
          tempCollection[card.id] = 1;
        }
      }

      setOpenedChestName(chest.name);
      setOpenedRewards(rewardsList);
    } else if (isGold) {
      alert(`🪙 Tebrikler! ${addedGold.toLocaleString("tr-TR")} Altın kazandınız!`);
    }

    await claimRankedReward(matchNum, addedGold, rewardsList);
  };

  const handleClaimTrophyRewardHome = async (threshold: number, rewardType: string) => {
    if (!state) return;
    
    // Generate rewards based on type
    let numCards = 3;
    let legendaryChance = 0;
    
    if (rewardType === "Mega Sandık") { numCards = 6; legendaryChance = 0.1; }
    if (rewardType === "Destansı Sandık") { numCards = 3; legendaryChance = 0.2; }
    if (rewardType === "Efsanevi Sandık") { numCards = 1; legendaryChance = 1.0; } // Guaranteed legendary
    
    const availableCards = CARDS;
    const rewards = [];
    
    for (let i = 0; i < numCards; i++) {
      let roll = Math.random();
      let rarity = "common";
      
      if (roll < legendaryChance) rarity = "legendary";
      else if (roll < 0.2) rarity = "epic";
      else if (roll < 0.5) rarity = "rare";
      
      const pool = availableCards.filter(c => c.rarity === rarity);
      const card = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : availableCards[0];
      
      const isDuplicate = !!state.collection[card.id];
      let refund = 0;
      if (isDuplicate) {
        if (rarity === "legendary") refund = 1000;
        else if (rarity === "epic") refund = 300;
        else if (rarity === "rare") refund = 100;
        else refund = 10;
      }
      
      rewards.push({ card, isDuplicate, refundGold: refund });
    }
    
    await claimProgressionReward("trophy", threshold, rewards);
    setOpenedRewards(rewards);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Check if swipe is horizontal and meets minimum threshold
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      const tabs: Tab[] = ["meta", "chests", "battle", "cards", "top3"];
      const currentIndex = tabs.indexOf(tab);
      if (diffX < 0) {
        if (currentIndex < tabs.length - 1) {
          setDirection("right");
          setTab(tabs[currentIndex + 1]);
        }
      } else {
        if (currentIndex > 0) {
          setDirection("left");
          setTab(tabs[currentIndex - 1]);
        }
      }
    }
  };

  const handleTabChange = (newTab: Tab) => {
    const tabs: Tab[] = ["meta", "chests", "battle", "cards", "top3"];
    const fromIndex = tabs.indexOf(tab);
    const toIndex = tabs.indexOf(newTab);
    setDirection(toIndex > fromIndex ? "right" : "left");
    setTab(newTab);
  };

  const [openedRewards, setOpenedRewards] = useState<ChestRewardItem[] | null>(null);
  const [openedChestName, setOpenedChestName] = useState("");

  const [opponent, setOpponent] = useState<{name: string, avatar?: string, trophies: number, rankedStars?: number, wins?: number, battleId?: string, isPlayer1?: boolean, mode?: "standard" | "tournament" | "ranked"} | null>(null);
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

    // 1. Charm Sandığı (50.000 Gold)
    if (chestId === "charm_chest") {
      const currentUnlocked = (state.unlockedCharms && state.unlockedCharms.length > 0)
        ? state.unlockedCharms
        : ["kuvvet", "saglik"];
      const unowned = CHARMS.filter((c) => !currentUnlocked.includes(c.id));

      if (unowned.length === 0) {
        alert("✨ Tüm Charmlara zaten sahipsin! Harcama yapılmadı.");
        return;
      }

      const wonCharm = unowned[Math.floor(Math.random() * unowned.length)];
      buyCharm(wonCharm.id, chest.cost);

      setOpenedChestName(chest.name);
      setOpenedRewards([{
        type: "charm",
        charm: wonCharm,
        isDuplicate: false,
        refundGold: 0,
      }]);
      return;
    }

    // 2. Efsanevi Sandık (10.000 Gold) - Special Drop Probability
    if (chestId === "magic") {
      const rand = Math.random();

      // %0.71 (0.0071) Charm düşme şansı
      if (rand < 0.0071) {
        const currentUnlocked = (state.unlockedCharms && state.unlockedCharms.length > 0)
          ? state.unlockedCharms
          : ["kuvvet", "saglik"];
        const unowned = CHARMS.filter((c) => !currentUnlocked.includes(c.id));

        if (unowned.length > 0) {
          const wonCharm = unowned[Math.floor(Math.random() * unowned.length)];
          buyCharm(wonCharm.id, chest.cost);

          setOpenedChestName(chest.name);
          setOpenedRewards([{
            type: "charm",
            charm: wonCharm,
            isDuplicate: false,
            refundGold: 0,
          }]);
          return;
        }
      }

      // %14.19 (0.1419) Level Coin düşme şansı (0.0071 + 0.1419 = 0.1490)
      if (rand < 0.1490) {
        buyLevelCoins(chest.cost, 1);

        setOpenedChestName(chest.name);
        setOpenedRewards([{
          type: "level_coin",
          levelCoinsAmount: 1,
          isDuplicate: false,
          refundGold: 0,
        }]);
        return;
      }

      // %84.01 (0.8401) Kart düşme şansı -> Standart sandık kartları açılır
    }

    // Standard card rolling logic for chests
    const rolled: CardDef[] = [];
    const unlockedIds = getUnlockedCardsUpToTrophies(state.trophies);
    rolled.push(rollCardFromUnlocked(unlockedIds, chest.guaranteedMin, chest.allowedRarities));

    for (let i = 1; i < chest.cards; i++) {
      rolled.push(rollCardFromUnlocked(unlockedIds, undefined, chest.allowedRarities));
    }

    const tempCollection = { ...state.collection };
    const rewards: ChestRewardItem[] = [];
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
        type: "card",
        card,
        isDuplicate,
        refundGold,
      });
      if (!isDuplicate) {
        tempCollection[card.id] = 1;
      }
    }

    claimChestRewards(
      rewards.map((r) => ({
        card: r.card!,
        isDuplicate: r.isDuplicate!,
        refundGold: r.refundGold!,
      })),
      chest.cost
    );
    setOpenedChestName(chest.name);
    setOpenedRewards(rewards);
  };

  const handleClaimStarReward = async (threshold: number, rewardType: "gold" | "chest", value: string | number) => {
    const goldAmount = value as number;
    await claimProgressionReward("star", threshold, []);
    await updateResources(state.trophies, state.gold + goldAmount, state.rankedStars);
    alert(`🪙 ${goldAmount.toLocaleString("tr-TR")} Altın başarıyla hesabına eklendi!`);
  };

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-slate-950 overflow-y-auto overflow-x-hidden relative scrollbar-none">
      {/* Duel Invites UI */}
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
      )}
      
      {!(inBattle && opponent) && (
        <>
          <header className="sticky top-0 z-20 panel-3d px-3 pb-2.5 pt-7 flex items-center justify-between gap-2 relative">
            <div className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 mr-2" onClick={() => setShowProfileCustomizer(true)}>
              <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-black/40 bg-gradient-to-br from-amber-300 to-amber-600 text-lg font-display text-amber-950 shadow-inner shrink-0 hover:brightness-110 active:scale-95 transition-all">
                {state.avatar || getAvatarForName(state.username)}
              </div>
              <div className="min-w-0">
                <div className={cn(
                  "font-display text-base leading-tight truncate",
                  PROFILE_COLORS.find(c => c.value === state.profileColor)?.class || "text-stroke text-white",
                  state.profileFont || "font-display"
                )}>
                  {state.username} {state.username.toLowerCase() === "dgoa" && "🛠️"}
                </div>
                <div 
                  className="mt-0.5 text-[11px] text-amber-200/90 underline decoration-amber-500/50 underline-offset-2 flex flex-col gap-0.5 hover:text-amber-100 truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowArenas(true);
                  }}
                >
                  <div className="truncate">Arena {arena.id} · {arena.name}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center justify-end gap-1">
                <Stat icon="🏆" value={state.trophies} color="from-amber-300 to-orange-500" />
                <Stat icon="🪙" value={state.gold} color="from-yellow-200 to-amber-500" />
              </div>
              <div className="flex items-center justify-end gap-1">
                {(state.rankedStars !== undefined && state.rankedStars > 0) && (
                  <Stat icon="⭐" value={state.rankedStars} color="from-cyan-300 to-blue-500 text-cyan-950 font-black shadow-[0_0_8px_rgba(6,182,212,0.35)] border-cyan-400/40" />
                )}
                <Stat
                  icon="✨"
                  value={state.levelCoins || 0}
                  color="from-amber-300 to-yellow-500"
                  label="Jeton"
                />
              </div>
            </div>
          </header>

          <main 
            className="flex-1 px-3 pb-28 pt-4 select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: direction === "right" ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === "right" ? -30 : 30 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="w-full h-full"
              >
                {tab === "battle" && (
                  <BattleTab
                    deck={state.deck}
                    selectedCharms={state.selectedCharms}
                    trophies={state.trophies}
                    rankProgressTrophies={state.rankProgressTrophies || 0}
                    rankedStars={state.rankedStars || 0}
                    battleMode={battleMode}
                    setBattleMode={setBattleMode}
                    onStart={() => setShowMatchmaking(true)}
                    claimedStarRewards={state.claimedStarRewards || []}
                    onClaimStarReward={handleClaimStarReward}
                    cardLevels={state.cardLevels || {}}
                    onOpenRankedRoad={() => setIsRankedRoadOpen(true)}
                    onOpenRankRewards={() => setIsRankRewardsOpen(true)}
                    unclaimedRankRewardsCount={unclaimedRankRewardsCount}
                  />
                )}
                {tab === "cards" && (
                  <CardsTab
                    unlockedCharms={state.unlockedCharms}
                    selectedCharms={state.selectedCharms}
                    setCharmSlot={setCharmSlot}
                    levelCoins={state.levelCoins}
                    collection={state.collection}
                    deck={state.deck}
                    decks={state.decks}
                    activeDeckIndex={state.activeDeckIndex}
                    selectedEmojis={state.selectedEmojis as [string, string, string, string] | undefined}
                    unlockedEmojis={state.unlockedEmojis ?? []}
                    gold={state.gold}
                    setDeckSlot={setDeckSlot}
                    setActiveDeck={setActiveDeck}
                    setEmojiSlot={setEmojiSlot}
                    cardLevels={state.cardLevels || {}}
                    cardProgress={state.cardProgress || {}}
                    onUpgradeCardLevel={upgradeCardLevel}
                    onUpgradeCardLevelWithGold={upgradeCardLevelWithGold}
                  />
                )}
                {tab === "chests" && (
                  <ChestsTab 
                     unlockedCharms={state.unlockedCharms}
                     levelCoins={state.levelCoins}
                     onBuyCharm={buyCharm}
                     onBuyLevelCoins={buyLevelCoins}
                    gold={state.gold} 
                    unlockedEmojis={state.unlockedEmojis ?? []} 
                    onOpen={handleOpenChest}
                    onBuyEmoji={buyEmoji} 
                  />
                )}
                {tab === "meta" && (
                  <MetaTab user={state} onImportDeck={importDeck} />
                )}
                {tab === "top3" && (
                  <LeaderboardTab currentUser={state} currentTrophies={state.trophies} onInviteDuel={async (target) => { await sendDuelRequest(target); alert("Davet gönderildi!"); }} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-[1000] mx-auto max-w-md panel-3d rounded-t-2xl rounded-b-none px-2 py-2">
            <div className="grid grid-cols-5 gap-1">
              <NavBtn active={tab === "meta"} onClick={() => handleTabChange("meta")} icon="📊" label="Meta" />
              <NavBtn active={tab === "chests"} onClick={() => handleTabChange("chests")} icon="🎭" label="Dükkan" />
              <NavBtn active={tab === "battle"} onClick={() => handleTabChange("battle")} icon="⚔️" label="Savaş" big />
              <NavBtn active={tab === "cards"} onClick={() => handleTabChange("cards")} icon="🃏" label="Kartlar" />
              <NavBtn active={tab === "top3"} onClick={() => handleTabChange("top3")} icon="🏆" label="Sıralama" />
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


        {showProfileCustomizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-3xl border-2 border-amber-500/80 bg-slate-900 p-6 text-white shadow-2xl shadow-amber-500/10 flex flex-col max-h-[85vh] overflow-y-auto scrollbar-none"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-pulse">👑</span>
                  <h3 className="font-display text-xl text-stroke font-extrabold text-amber-500">
                    PROFİL ÖZELLEŞTİRME
                  </h3>
                </div>
                <button
                  onClick={() => setShowProfileCustomizer(false)}
                  className="rounded-full bg-slate-800 p-1 hover:bg-slate-700 transition cursor-pointer text-slate-400 hover:text-white w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* LIVE PREVIEW CARD */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center gap-3 shrink-0 shadow-inner">
                <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-amber-500/50 bg-gradient-to-br from-slate-800 to-slate-950 text-3xl shadow-lg shrink-0">
                  {state.avatar || getAvatarForName(state.username)}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Canlı Önizleme</div>
                  <div className={cn(
                    "text-xl leading-none",
                    PROFILE_COLORS.find(c => c.value === state.profileColor)?.class || "text-stroke text-white",
                    state.profileFont || "font-display"
                  )}>
                    {state.username} {state.username.toLowerCase() === "dgoa" && "🛠️"}
                  </div>
                </div>
              </div>

              {/* AVATAR SELECTOR (ALWAYS FREE) */}
              <div className="space-y-2 mb-5 shrink-0">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">🎭 Profil Resmi Seç (Ücretsiz)</label>
                <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  {PROFILE_AVATARS.map((av) => (
                    <button
                      key={av.name}
                      onClick={async () => {
                        await updateProfileCustomization({ avatar: av.emoji });
                      }}
                      className={cn(
                        "text-2xl h-10 w-10 flex items-center justify-center rounded-lg border transition-all cursor-pointer hover:bg-slate-800",
                        state.avatar === av.emoji
                          ? "bg-amber-500/20 border-amber-500 scale-105 shadow-md shadow-amber-500/10"
                          : "border-slate-800/80 bg-slate-900/50"
                      )}
                      title={av.name}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* STYLE CUSTOMIZATION (COLORS & FONTS) */}
              <div className="border-t border-slate-800/80 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <span>✨</span> İsim Rengi ve Yazı Tipi (Ücretsiz)
                  </label>
                </div>

                <div className="space-y-4 animate-fade-in">
                  {/* Color Picker */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                      <span>İsim Rengi ve Efekti:</span>
                      <span className="text-[10px] text-slate-500 font-normal">Seçili: {PROFILE_COLORS.find(c => c.value === state.profileColor)?.name || "Parlak Beyaz"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PROFILE_COLORS.map((col) => {
                        const isSelected = state.profileColor === col.value;
                        return (
                          <button
                            key={col.value}
                            type="button"
                            onClick={async () => {
                              await updateProfileCustomization({ profileColor: col.value });
                            }}
                            className={cn(
                              "text-left px-2.5 py-2 rounded-xl border text-xs cursor-pointer transition-all hover:bg-slate-800/60 flex items-center gap-2",
                              isSelected
                                ? "bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40"
                                : "bg-slate-950/40 border-slate-800"
                            )}
                          >
                            <span className={cn("w-3.5 h-3.5 rounded-full shrink-0", col.dot)} />
                            <span className={cn("font-bold truncate text-[11px] sm:text-xs", col.class)}>{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Picker */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                      <span>Yazı Tipi (Font):</span>
                      <span className="text-[10px] text-slate-500 font-normal">Seçili: {PROFILE_FONTS.find(f => f.value === state.profileFont)?.name || "Oyun (Display)"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PROFILE_FONTS.map((font) => {
                        const isSelected = state.profileFont === font.value;
                        return (
                          <button
                            key={font.value}
                            type="button"
                            onClick={async () => {
                              await updateProfileCustomization({ profileFont: font.value });
                            }}
                            className={cn(
                              "text-left px-2.5 py-2 rounded-xl border text-xs cursor-pointer transition-all hover:bg-slate-800/60 flex items-center justify-between gap-1",
                              isSelected
                                ? "bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40"
                                : "bg-slate-950/40 border-slate-800"
                            )}
                          >
                            <span className="font-semibold text-slate-200 truncate text-[11px] sm:text-xs">{font.name}</span>
                            <span className={cn("text-xs font-bold text-amber-300/90 shrink-0 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800", font.value)}>
                              {font.sample}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {openedRewards && (
        <ChestReveal
          chestName={openedChestName}
          rewards={openedRewards}
          onClose={() => setOpenedRewards(null)}
        />
      )}

      <RankedRoadModal
        isOpen={isRankedRoadOpen}
        onClose={() => setIsRankedRoadOpen(false)}
        user={state}
        onClaim={handleClaimRankedReward}
      />

      <RankRewardsModal
        isOpen={isRankRewardsOpen}
        onClose={() => setIsRankRewardsOpen(false)}
        state={state}
        onClaimReward={claimRankReward}
        onShowChestRewards={(chestName, rewards) => {
          setOpenedChestName(chestName);
          setOpenedRewards(rewards);
        }}
      />

      {inBattle && opponent && (
        <BattleScreen
          deck={state.deck}
          playerCardLevels={state.cardLevels || {}}
          playerEmojis={(state.selectedEmojis as [string, string, string, string]) || ["", "", "", ""]}
          selectedCharms={state.selectedCharms || ["kuvvet", ""]}
          trophies={state.trophies}
          playerRankedStars={state.rankedStars ?? 0}
          playerAvatar={state.avatar || getAvatarForName(state.username)}
          playerColor={state.profileColor}
          playerFont={state.profileFont}
          opponentName={opponent.name}
          opponentAvatar={opponent.avatar || getAvatarForName(opponent.name)}
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

function Stat({ 
  icon, 
  value, 
  color, 
  label,
  onClick,
}: { 
  icon: string; 
  value: number | null | undefined; 
  color: string; 
  label?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-black/50 bg-gradient-to-r px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-black text-amber-950 shadow-md shrink-0 whitespace-nowrap",
        onClick && "cursor-pointer active:scale-95 transition-transform hover:brightness-110",
        color,
      )}
    >
      <span className="text-sm sm:text-base leading-none shrink-0 drop-shadow">{icon}</span>
      <span className="tabular-nums font-mono text-xs sm:text-sm font-black leading-none drop-shadow-sm">
        {value?.toLocaleString("tr-TR") ?? 0}
      </span>
      {label && <span className="text-[10px] font-sans font-black opacity-90 leading-none">{label}</span>}
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
  unlockedCharms = ["kuvvet", "saglik"],
  selectedCharms = ["kuvvet", ""],
  setCharmSlot,
  levelCoins,
  collection,
  deck,
  decks,
  activeDeckIndex = 0,
  selectedEmojis = ["", "", "", ""],
  unlockedEmojis = [],
  gold,
  setDeckSlot,
  setActiveDeck,
  setEmojiSlot,
  cardLevels,
  cardProgress,
  onUpgradeCardLevel,
  onUpgradeCardLevelWithGold,
}: {
  collection: Record<string, number>;
  unlockedCharms?: string[];
  selectedCharms?: string[];
  setCharmSlot: (slot: number, charmId: string) => void;
  levelCoins?: number;
  deck: [string, string, string, string];
  decks?: Record<string, [string, string, string, string]>;
  activeDeckIndex?: number;
  selectedEmojis?: [string, string, string, string];
  unlockedEmojis?: string[];
  gold: number;
  setDeckSlot: (slot: number, cardId: string) => void;
  setActiveDeck: (index: number) => void;
  setEmojiSlot: (slot: number, emoji: string) => void;
  cardLevels: Record<string, number>;
  cardProgress: Record<string, number>;
  onUpgradeCardLevel: (cardId: string) => void;
  onUpgradeCardLevelWithGold: (cardId: string) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeEmojiSlot, setActiveEmojiSlot] = useState<number | null>(null);
  const [activeCharmSlot, setActiveCharmSlot] = useState<number | null>(null);

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
    const inDeckIndex = selectedEmojis.indexOf(emoji);
    if (inDeckIndex >= 0) {
      setEmojiSlot(inDeckIndex, "");
      setActiveEmojiSlot(inDeckIndex);
    } else {
      if (activeEmojiSlot !== null) {
        setEmojiSlot(activeEmojiSlot, emoji);
        const next = [...selectedEmojis];
        next[activeEmojiSlot] = emoji;
        const nextEmpty = next.findIndex(e => e === "");
        setActiveEmojiSlot(nextEmpty >= 0 ? nextEmpty : null);
      } else {
        const firstEmpty = selectedEmojis.findIndex(e => e === "");
        if (firstEmpty >= 0) {
          setEmojiSlot(firstEmpty, emoji);
          const next = [...selectedEmojis];
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
          alert(`20 elmas sınırını aşamazsın! Bu kartı eklemek destenin maliyetini ${nextCost} elmas yapacaktır.`);
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
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Deste & Taş Maliyeti */}
              <div className="flex items-center gap-2">
                <h2 className="text-stroke text-2xl text-white font-display">Deste</h2>
                <span className={cn(
                  "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm transition-colors whitespace-nowrap",
                  deckStoneCost > 20 
                    ? "bg-red-950/80 text-red-400 border-red-500/40" 
                    : deckStoneCost === 20 
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40" 
                      : "bg-indigo-950/80 text-cyan-300 border-indigo-400/30"
                )}>
                  💎 {deckStoneCost}/20
                </span>
              </div>

              {/* Deste taş maliyeti ile desteler arasındaki boşlukta yer alan kompakt Charm Seçimi */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-xl shadow-xs">
                <span className="text-[10px] font-black text-amber-400 font-display uppercase tracking-wide flex items-center gap-1">
                  <span>✨</span>
                  <span className="hidden xs:inline">Charm:</span>
                </span>
                <div className="flex items-center gap-1">
                  {[0, 1].map((slot) => {
                    const charmId = selectedCharms[slot];
                    const charm = CHARMS.find((c) => c.id === charmId);
                    const isSelecting = activeCharmSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setActiveCharmSlot(activeCharmSlot === slot ? null : slot)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs transition-all cursor-pointer font-sans",
                          isSelecting
                            ? "bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/60 scale-105"
                            : charm
                              ? "bg-slate-800 border-slate-600 hover:border-amber-400 text-white hover:bg-slate-750"
                              : "bg-slate-950/70 border-dashed border-slate-700 text-slate-400 hover:border-slate-500"
                        )}
                        title={charm ? `${charm.name} (Değiştirmek için tıkla)` : `Charm ${slot + 1} Seç`}
                      >
                        <span className="text-sm leading-none">{charm ? charm.emoji : "+"}</span>
                        <span className="text-[10px] font-bold max-w-[60px] sm:max-w-[75px] truncate leading-tight">
                          {charm ? charm.name : `Charm ${slot + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desteler */}
              <div className="flex gap-1">
                {Object.keys(decks ?? { "0": deck }).map((key) => {
                  const index = parseInt(key);
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveDeck(index)}
                      className={cn(
                        "text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                        index === activeDeckIndex
                          ? "bg-amber-500 text-amber-950 shadow-md scale-105 font-black"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-amber-200/90 mt-1 font-medium min-h-[16px] leading-tight">
            {activeSlot !== null 
              ? "👉 Kuşanmak için aşağıdaki bir karaktere dokun!" 
              : "ℹ️ Çıkarmak için bir savaşçıya dokun."}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-2xl panel-3d p-3">
          {deck.map((cardId, i) => {
            const card = CARDS.find((c) => c.id === cardId);
            const isActive = activeSlot === i;
            return (
              <div key={i} className="flex flex-col items-center">
                {card ? (
                  <div className="relative flex flex-col items-center w-full">
                    <GameCard 
                      card={card} 
                      size="sm" 
                      onClick={() => handleSlotClick(i, true)} 
                      level={cardLevels[card.id] || 1}
                    />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl ring-4 ring-amber-400 ring-offset-2 pointer-events-none animate-pulse" />
                    )}
                    
                    {/* Active Deck Progress Bar & Upgrade Button */}
                    {(() => {
                      const lvl = cardLevels[card.id] || 1;
                      const prog = cardProgress[card.id] || 0;
                      const reqXp = lvl === 1 ? 50 : lvl === 2 ? 100 : lvl === 3 ? 150 : 250;
                      const reqCoins = lvl === 1 ? 1 : lvl === 2 ? 2 : lvl === 3 ? 3 : 5;
                      const percent = lvl >= 5 ? 100 : Math.min(100, (prog / reqXp) * 100);
                      const hasCoins = (levelCoins || 0) >= reqCoins;
                      return (
                        <div className="w-full mt-1.5 px-0.5 flex flex-col items-center">
                          <div className="relative w-full h-4 bg-slate-950 border border-slate-800 rounded-md overflow-hidden flex items-center justify-center">
                            <div 
                              className={cn(
                                "absolute top-0 left-0 h-full transition-all duration-300",
                                lvl >= 5 ? "bg-gradient-to-r from-amber-600 to-amber-400" : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                              )}
                              style={{ width: `${percent}%` }}
                            />
                            <span className="text-[8px] font-black text-stroke-sm text-white drop-shadow z-10 select-none">
                              {lvl >= 5 ? "MAX 👑" : `${prog}/${reqXp}`}
                            </span>
                          </div>
                          {lvl < 5 && (
                            <div className="mt-1 w-full flex flex-col gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpgradeCardLevelWithGold(card.id);
                                }}
                                className={cn(
                                  "w-full py-0.5 px-1 rounded text-[8px] font-black uppercase tracking-tight transition-all shadow active:scale-95 flex items-center justify-between cursor-pointer",
                                  prog >= reqXp && gold >= (lvl === 1 ? 500 : lvl === 2 ? 1500 : lvl === 3 ? 3500 : 7500)
                                    ? "bg-amber-500 hover:bg-amber-400 text-amber-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                    : "bg-slate-800/90 border border-slate-700/80 text-slate-400 opacity-85"
                                )}
                                title={prog < reqXp ? "Altın ile yükseltmek için kart XP'si tam dolmalı!" : "Altın ile Yükselt"}
                              >
                                <span className="font-black flex items-center gap-0.5">
                                  <span>▲</span>
                                  <span>{prog < reqXp ? "XP GEREKLİ" : "YÜKSELT"}</span>
                                </span>
                                <span className="font-mono text-[8px] font-black">
                                  🪙{(lvl === 1 ? 500 : lvl === 2 ? 1500 : lvl === 3 ? 3500 : 7500).toLocaleString("tr-TR")}
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpgradeCardLevel(card.id);
                                }}
                                className={cn(
                                  "w-full py-0.5 px-1 rounded text-[8px] font-black uppercase tracking-tight transition-all shadow active:scale-95 flex items-center justify-between cursor-pointer",
                                  hasCoins
                                    ? "bg-purple-600 hover:bg-purple-500 text-white font-black"
                                    : "bg-slate-800/80 border border-slate-700/80 text-purple-300/70"
                                )}
                                title="Jeton ile Yükselt"
                              >
                                <span className="font-black flex items-center gap-0.5">
                                  <span>✨</span>
                                  <span>JETON</span>
                                </span>
                                <span className="font-mono text-[8px] font-black">
                                  ✨{reqCoins}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                        SEÇİLDİ
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
          <h2 className="text-stroke text-xl text-white">Seçilen Emojiler</h2>
          <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium min-h-[16px] leading-tight">
            {activeEmojiSlot !== null 
              ? "👉 Emojiyi değiştirmek için aşağıdaki koleksiyondan seçin!" 
              : "ℹ️ Savaşta kullanmak için 4 emoji seçin."}
          </p>
        </div>
        <div className="flex gap-2.5 justify-center mb-4 panel-3d border border-slate-700 p-2.5 rounded-2xl bg-slate-900/60">
          {selectedEmojis.map((emoji, i) => {
            const isActive = activeEmojiSlot === i;
            return (
              <button
                key={i}
                onClick={() => handleEmojiSlotClick(i, !!emoji)}
                className={cn(
                  "w-14 h-14 flex items-center justify-center rounded-2xl border-2 relative shadow-inner transition-all",
                  isActive ? "border-amber-400 bg-amber-500/20 scale-110 shadow-[0_0_12px_rgba(245,158,11,0.5)] z-10" : "border-slate-600 bg-slate-800/90 hover:bg-slate-700 hover:border-slate-500",
                  !emoji && !isActive && "opacity-45"
                )}
              >
                {emoji ? (
                  <AnimatedEmoji emoji={emoji} size="xl" mode={isActive ? "action" : "ambient"} interactive={true} />
                ) : (
                  <span className="text-slate-500 font-mono text-lg">?</span>
                )}
                {isActive && (
                  <span className="absolute -bottom-2 bg-amber-500 text-amber-950 text-[7px] font-black tracking-wider px-1.5 py-0.5 rounded-full border border-black shadow">
                    SEÇİLDİ
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeEmojiSlot !== null && (
          <div className="grid grid-cols-4 gap-2.5 p-3 border-2 border-dashed border-amber-500/40 bg-amber-500/10 rounded-2xl mb-4 animate-emoji-bubble-pop">
            {unlockedEmojis.length === 0 ? (
              <div className="col-span-4 text-center text-sm text-amber-200/70 py-2">
                Hiç emojiniz yok! Onları Mağaza menüsünden satın alabilirsiniz.
              </div>
            ) : (
              Array.from(new Set(unlockedEmojis)).map((emoji, index) => (
                <button
                  key={`${emoji}_${index}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="h-14 flex items-center justify-center bg-slate-800/90 border-2 border-slate-600 rounded-xl hover:bg-slate-700 hover:border-amber-400 hover:scale-110 active:scale-95 transition-all shadow"
                >
                  <AnimatedEmoji emoji={emoji} size="xl" interactive={true} />
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
          {owned.map((card) => {
            const inDeck = deck.includes(card.id);
            const lvl = cardLevels[card.id] || 1;
            const prog = cardProgress[card.id] || 0;
            const reqXp = lvl === 1 ? 50 : lvl === 2 ? 100 : lvl === 3 ? 150 : 250;
            const reqCoins = lvl === 1 ? 1 : lvl === 2 ? 2 : lvl === 3 ? 3 : 5;
            const percent = lvl >= 5 ? 100 : Math.min(100, (prog / reqXp) * 100);
            const hasCoins = (levelCoins || 0) >= reqCoins;

            return (
              <div key={card.id} className="flex flex-col items-center gap-1.5 p-1 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <GameCard
                  card={card}
                  owned={collection[card.id] ?? 1}
                  locked={false}
                  selected={inDeck}
                  level={lvl}
                  onClick={() => handleCollectionCardClick(card.id)}
                />

                {/* Mastery Level and continuous progress bar */}
                <div className="w-full mt-1 px-1 flex flex-col gap-1 items-center">
                  <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400">
                    <span>Gelişim</span>
                    <span className="text-amber-400 font-mono font-black">Seviye {lvl}/5</span>
                  </div>
                  
                  {/* The continuous progress bar filled with XP */}
                  <div className="relative w-full h-5 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-between px-1">
                    {/* Background Progress fill */}
                    {lvl < 5 && (
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 border-r border-emerald-300/30 transition-all duration-300 z-0"
                        style={{ width: `${percent}%` }}
                      />
                    )}
                    {lvl >= 5 && (
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 border-r border-amber-300/30 z-0"
                        style={{ width: "100%" }}
                      />
                    )}

                    {/* Progress Text in the middle */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-[9px] font-black text-stroke-sm text-white drop-shadow">
                        {lvl === 5 ? "MAKS 👑" : `${prog}/${reqXp} XP`}
                      </span>
                    </div>
                  </div>

                  {/* Upgrade Buttons if level < 5 */}
                  {lvl < 5 && (
                    <div className="mt-1.5 w-full flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpgradeCardLevelWithGold(card.id);
                        }}
                        className={cn(
                          "w-full py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all shadow active:scale-95 flex items-center justify-between cursor-pointer",
                          prog >= reqXp && gold >= (lvl === 1 ? 500 : lvl === 2 ? 1500 : lvl === 3 ? 3500 : 7500)
                            ? "bg-amber-500 hover:bg-amber-400 text-amber-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : "bg-slate-800 border border-slate-700 text-slate-400 opacity-85"
                        )}
                        title={prog < reqXp ? "Altın ile yükseltmek için kart XP'si tam dolmalı!" : "Altın ile Yükselt"}
                      >
                        <span className="font-black flex items-center gap-1">
                          <span>▲</span>
                          <span>{prog < reqXp ? "XP GEREKLİ" : "ALTIN"}</span>
                        </span>
                        <span className="font-mono text-[9px] font-black">
                          🪙{(lvl === 1 ? 500 : lvl === 2 ? 1500 : lvl === 3 ? 3500 : 7500).toLocaleString("tr-TR")}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpgradeCardLevel(card.id);
                        }}
                        className={cn(
                          "w-full py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all shadow active:scale-95 flex items-center justify-between cursor-pointer",
                          hasCoins
                            ? "bg-purple-600 hover:bg-purple-500 text-white font-black"
                            : "bg-slate-800/80 border border-slate-700/80 text-purple-300/70"
                        )}
                        title="Jeton ile Yükselt"
                      >
                        <span className="font-black flex items-center gap-1">
                          <span>✨</span>
                          <span>JETON</span>
                        </span>
                        <span className="font-mono text-[9px] font-black">
                          ✨{reqCoins}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {locked.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-stroke text-2xl text-slate-400 font-display">
            Kilitli Kartlar · {locked.length}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {locked.map((card) => {
              const arenaObj = getArenaForCard(card.id);
              return (
                <div key={card.id} className="flex flex-col items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-900/60 opacity-65">
                  <GameCard
                    card={card}
                    owned={0}
                    locked={true}
                    lockedAtArena={arenaObj?.id}
                    selected={false}
                  />
                  <div className="w-full mt-1.5 px-1 text-center">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60">
                      {arenaObj ? `${arenaObj.name}` : "Gelecek Arena"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Charm Selection Modal */}
      {activeCharmSlot !== null && (
        <div 
          className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveCharmSlot(null)}
        >
          <div 
            className="panel-3d w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-4 shadow-2xl flex flex-col max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="font-display font-bold text-white text-base leading-none">
                    Charm Seçimi ({activeCharmSlot + 1}. Slot)
                  </h3>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Destene avantaj sağlayan Charm'ını kuşan
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveCharmSlot(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
              {/* Empty / Unequip Option */}
              <button
                type="button"
                onClick={() => {
                  setCharmSlot(activeCharmSlot, "");
                  setActiveCharmSlot(null);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer font-sans",
                  selectedCharms[activeCharmSlot] === "" 
                    ? "border-amber-400 bg-amber-500/20 shadow-md" 
                    : "border-slate-700/80 bg-slate-800/50 hover:bg-slate-800"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-slate-950 border border-slate-700">🚫</span>
                  <div className="text-left">
                    <div className="text-xs font-black text-white">Charm'ı Çıkar (Boş Bırak)</div>
                    <div className="text-[10px] text-slate-400">Bu slotta hiçbir charm aktif olmasın</div>
                  </div>
                </div>
                {selectedCharms[activeCharmSlot] === "" && (
                  <span className="text-xs text-amber-300 font-black px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40">✓ Seçili</span>
                )}
              </button>

              {/* Unlocked Charms list (2 PER ROW GRID) */}
              <div className="grid grid-cols-2 gap-2.5">
                {CHARMS.filter(c => (unlockedCharms || []).includes(c.id)).map(charm => {
                  const isCurrent = selectedCharms[activeCharmSlot] === charm.id;
                  const otherSlot = activeCharmSlot === 0 ? 1 : 0;
                  const isOther = selectedCharms[otherSlot] === charm.id;

                  return (
                    <div
                      key={charm.id}
                      onClick={() => {
                        setCharmSlot(activeCharmSlot, charm.id);
                        setActiveCharmSlot(null);
                      }}
                      className={cn(
                        "flex flex-col justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-md",
                        isCurrent 
                          ? "border-emerald-500 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]" 
                          : isOther
                            ? "border-slate-700/50 bg-slate-850/40 opacity-70"
                            : "border-slate-700/80 bg-slate-800/80 hover:border-amber-400/80 hover:bg-slate-800"
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="text-3xl shrink-0 p-2 rounded-xl bg-slate-950 border border-slate-700 shadow-inner">
                            {charm.emoji}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black uppercase">
                              Kuşanıldı
                            </span>
                          )}
                          {isOther && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold uppercase">
                              Slotta
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-black text-white font-display leading-tight">{charm.name}</div>
                        <p className="text-[10px] text-amber-200/80 leading-snug line-clamp-3 mt-1 min-h-[2.4rem]">
                          {charm.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={cn(
                          "mt-3 w-full py-2 rounded-xl font-display text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1",
                          isCurrent
                            ? "bg-emerald-600 text-white border border-emerald-400"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95"
                        )}
                      >
                        {isCurrent ? "✓ Seçili" : "✨ Kuşan"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Locked Charms hint */}
              {CHARMS.filter(c => !(unlockedCharms || []).includes(c.id)).length > 0 && (
                <div className="pt-2 text-center border-t border-slate-800/80 mt-2">
                  <p className="text-[11px] text-slate-400">
                    🔒 Kilitli diğer charmları açmak için <span className="text-amber-300 font-bold">Mağaza</span> sekmesine göz at!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BattleTab({
  deck,
  selectedCharms,
  trophies,
  rankProgressTrophies,
  rankedStars,
  battleMode,
  setBattleMode,
  onStart,
  claimedStarRewards,
  onClaimStarReward,
  cardLevels,
  onOpenRankedRoad,
  onOpenRankRewards,
  unclaimedRankRewardsCount = 0,
}: {
  deck: [string, string, string, string];
  selectedCharms?: string[];
  trophies: number;
  rankProgressTrophies: number;
  rankedStars: number;
  battleMode: "standard" | "ranked";
  setBattleMode: (mode: "standard" | "ranked") => void;
  onStart: () => void;
  claimedStarRewards: number[];
  onClaimStarReward: (threshold: number, rewardType: "gold" | "chest", value: string | number) => void;
  cardLevels: Record<string, number>;
  onOpenRankedRoad: () => void;
  onOpenRankRewards?: () => void;
  unclaimedRankRewardsCount?: number;
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
      case 1: return { emoji: "🌳🏡🏰", desc: "Bol çimli savaş alanı" };
      case 2: return { emoji: "🏜️🌵🦂", desc: "Sert çöl fırtınası" };
      case 3: return { emoji: "❄️🏔️⛄", desc: "Dondurucu karlar arası" };
      case 4: return { emoji: "🏛️👑💫", desc: "Büyük şampiyonların geçidi" };
      case 5: return { emoji: "❄️🧊🌨️", desc: "Soğuk buz krallığı" };
      case 6: return { emoji: "🐸🌿🌾", desc: "Tehlikeli yeşil bataklık" };
      case 7: return { emoji: "🌊🦈🐠", desc: "Derin okyanus dalgaları" };
      case 8: return { emoji: "🌋🔥👿", desc: "Lav püskürten cehennem" };
      case 9: return { emoji: "⛩️🏯🏮", desc: "Kadim ruhların uyandığı tapınak" };
      case 10: return { emoji: "🏔️🧗‍♂️🐐", desc: "Bulutlara uzanan dondurucu zirve" };
      case 11: return { emoji: "🌸🌸🍡", desc: "Dökülen pembe taç yapraklı bahçe" };
      case 12: return { emoji: "🐲❄️🏔️", desc: "Ejderhaların koruduğu dondurucu vadi" };
      case 13: return { emoji: "🏰🦇🧛", desc: "Karanlık şato ve zombilerin diyarı" };
      case 14: return { emoji: "🔮🧙‍♂️✨", desc: "Büyülü ve sihirli gizemli arena" };
      case 15: return { emoji: "🐭💀🪦", desc: "Çürümüş diyarlar ve dev fareler" };
      case 16: return { emoji: "☢️🐍☣️", desc: "Toksik zehirle kaplı radyoaktif arena" };
      case 17: return { emoji: "🕷️🍄🌺", desc: "Egzotik tarantulalar ve kan mantarları" };
      case 18: return { emoji: "🌌🔮✨", desc: "Mistik ve kozmik şampiyonlar arenası" };
      default: return { emoji: "⚔️🏆🌟", desc: "Efsanevi Savaş Alanı" };
    }
  };

  const visuals = getArenaVisuals(arena.id);
  const rank = getRankForRankProgress(rankProgressTrophies, rankedStars);

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
          <span>🏆</span> Kupa Modu
        </button>
        <button
          onClick={() => {
            if (trophies >= 7000) {
              setBattleMode("ranked");
            }
          }}
          className={cn(
            "rounded-xl py-2.5 font-display text-sm transition-all duration-300 flex items-center justify-center gap-1.5 relative overflow-hidden cursor-pointer",
            battleMode === "ranked"
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-md"
              : "text-slate-400 hover:text-white",
            trophies < 7000 && "opacity-45 cursor-not-allowed"
          )}
        >
          {trophies < 7000 ? (
            <span className="flex items-center gap-1 text-slate-400">
              <span>🔒</span> Dereceli Mod
            </span>
          ) : (
            <>
              <div className="absolute top-0 right-0 bg-red-500 text-[7px] font-mono font-bold px-1 rounded-bl-md uppercase animate-pulse leading-none py-0.5">Yeni</div>
              <span>⭐</span> Dereceli Mod
            </>
          )}
        </button>
      </div>

      {trophies < 7000 && (
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl px-3 py-2 text-center shadow-inner">
          <span className="text-[11px] text-slate-400 font-medium">
            🔒 Dereceli Mod <b>7000 Kupa</b> değerinde açılır. Dereceli moda girmek için {7000 - trophies} kupa daha kazanın!
          </span>
        </div>
      )}

      {/* Redesigned Arena Photo with Progress Bar Underneath */}
      <div 
        onClick={battleMode === "ranked" ? () => onOpenRankedRoad() : undefined}
        className={cn(
          "rounded-2xl border-2 p-4 text-center text-white relative overflow-hidden shadow-xl transition-all duration-500",
          battleMode === "ranked" ? "border-cyan-500 bg-cyan-950/45 shadow-[0_0_20px_rgba(6,182,212,0.25)] cursor-pointer hover:brightness-110 active:scale-[0.99]" : "border-black/50"
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
            {battleMode === "ranked" ? "DERECELİ LİG SİSTEMİ" : `Aktif Lig Seviyesi · Arena ${arena.id}`}
          </div>
          <h2 className="text-stroke text-3xl text-white font-display leading-none">
            {battleMode === "ranked" ? "Dereceli Arena" : arena.name}
          </h2>
          <p className="text-stroke-sm text-xs text-white/90 italic font-medium leading-none">
            {battleMode === "ranked" ? "Maç yapın, efsanevi ödülleri toplayın!" : ""}
          </p>

          <div className="py-4 flex justify-center scale-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            <span className="text-6xl animate-pulse duration-1000">
              {battleMode === "ranked" ? "🌟💎⚔️" : visuals.emoji}
            </span>
          </div>

          {battleMode === "standard" ? (
            /* Simple progress bar without milestones or chests */
            <div className="pt-2 space-y-1 relative">
              <div className="flex justify-between items-center text-xs font-bold font-display px-0.5">
                <span className="text-amber-200">Arena İlerlemesi</span>
                <span className="text-white bg-black/40 px-2 py-0.5 rounded font-mono">{label}</span>
              </div>
              <div className="h-4 w-full bg-slate-950 border border-slate-800 rounded-full p-0.5 shadow-inner relative flex items-center">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 border border-emerald-300/30 transition-all duration-500 relative flex items-center"
                  style={{ width: `${percent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-full" />
                </div>
              </div>
              <div className="text-[10px] text-amber-100/80 font-display flex items-center justify-between pt-1">
                <span>{arena.min} 🏆</span>
                {nextArena ? (
                  <span>Sonraki: <b className="text-white text-[11px] underline font-bold">{nextArena.name}</b></span>
                ) : (
                  <span className="text-amber-300 font-bold">🌟 Efsanevi Seviyenin Zirvesi!</span>
                )}
                <span>{nextArena ? nextArena.min : MAX_TROPHIES} 🏆</span>
              </div>
            </div>
          ) : (
            <div className="pt-2 space-y-2">
              <div className="text-center text-xs text-cyan-300 font-bold font-mono">
                Dereceli Seviye 🌟
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRankedRoad();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white font-display font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 border border-cyan-400/30 animate-pulse cursor-pointer"
              >
                <span>🏆</span> ÖDÜL YOLUNU GÖSTER <span>🎁</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Rank/League Tracking Card */}
      {battleMode === "standard" && (
        <div className="panel-3d rounded-2xl p-4 bg-slate-900 border border-slate-800/80 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl drop-shadow">{rank.current.emoji}</div>
              <div className="text-left font-display">
                <div className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Mevcut Rütbe</div>
                <div className={cn("text-lg font-black text-stroke-sm tracking-tight leading-tight mt-0.5", 
                  rank.current.name.includes("Bronz") ? "text-amber-600" : 
                  rank.current.name.includes("Gümüş") || rank.current.name.includes("Silver") ? "text-slate-300" : 
                  rank.current.name.includes("Altın") || rank.current.name.includes("Gold") ? "text-yellow-400" : "text-cyan-400"
                )}>{rank.current.name}</div>
              </div>
            </div>
            <div className="text-right font-display pl-4 flex-1 max-w-[150px]">
              <div className="flex justify-between items-center text-[9.5px] text-amber-200 font-bold mb-1">
                <span>Rütbe İlerlemesi</span>
                <span>{rank.next ? `${Math.floor(rank.currentProgressValue)}/${rank.requiredForNext}` : "MAKS"}</span>
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

          {/* Rütbe Ödülleri Butonu */}
          {onOpenRankRewards && (
            <button
              onClick={onOpenRankRewards}
              className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-950/80 via-yellow-950/70 to-amber-950/80 border border-amber-500/50 hover:border-amber-400 p-2.5 text-xs font-bold text-amber-300 shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🎁</span>
                <span>Rütbe Yolu Ödülleri</span>
              </div>
              <div className="flex items-center gap-1.5">
                {unclaimedRankRewardsCount > 0 ? (
                  <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-sm">
                    {unclaimedRankRewardsCount} ÖDÜL HAZIR!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Ödülleri Gör ➔</span>
                )}
              </div>
            </button>
          )}
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
          {!isDeckComplete ? "Önce destenizi kurun" : (!isCostValid ? "Deste Sınırı Aşıldı (Maks 20)" : (battleMode === "ranked" ? "DERECELİ SAVAŞA GİR! ⚔️" : "SAVAŞA GİR! ⚔️"))}
        </button>
      </div>

      {/* Fighters Deck List */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-stroke text-lg text-white font-display">Aktif Savaş Destesi</h3>
          <span className={cn(
            "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm border",
            isCostValid 
              ? "bg-indigo-950/80 text-cyan-300 border-indigo-400/30" 
              : "bg-red-950/80 text-red-300 border-red-500/50 animate-pulse"
          )}>
            💎 {deckStoneCost}/20 Elmas
          </span>
        </div>
        <div className="rounded-2xl panel-3d p-3 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {deckCards.map((card, i) =>
              card ? (
                <GameCard key={i} card={card} size="sm" level={cardLevels[card.id] || 1} />
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

          {/* Equipped Charms Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase text-amber-400 font-display flex items-center gap-1 shrink-0">
              <span>✨</span>
              <span>Charmlar:</span>
            </span>
            <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
              {[0, 1].map((slot) => {
                const charmId = (selectedCharms || [])[slot];
                const charm = CHARMS.find((c) => c.id === charmId);
                return (
                  <div
                    key={slot}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-sans truncate"
                  >
                    <span className="text-sm shrink-0">{charm ? charm.emoji : "❓"}</span>
                    <span className="text-[10px] font-bold text-slate-200 truncate">
                      {charm ? charm.name : "Boş Slot"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl panel-3d p-3.5 text-xs text-amber-100/90 leading-relaxed">
        <h3 className="text-stroke text-base text-white mb-1 font-display">Savaş Ödülleri</h3>
        {battleMode === "ranked" ? (
          <ul className="space-y-1">
            <li>• Savaşı kazanırsan: <b>500🪙 · +30🏆</b> kazanırsın.</li>
            <li>• Savaşı kaybedersen: <b>-10 ila -20⭐</b> kaybedersin.</li>
            <li>• Her kümede gerekli ⭐ biriktir ve efsanevi rütbelere ulaş!</li>
          </ul>
        ) : (
          <ul className="space-y-1">
            <li>• Normal maç kazanırsan: <b>500🪙 · +30🏆</b></li>
            
            
            <li>• Savaş kaybedilirse: Seviyenize göre kazanacağınız miktar kadar kupa kaybedersiniz.</li>
          </ul>
        )}
      </div>
    </div>
  );
}

function ChestsTab({
  unlockedCharms = ["kuvvet", "saglik"],
  levelCoins = 0,
  onBuyCharm,
  onBuyLevelCoins,
  gold,
  unlockedEmojis,
  onOpen,
  onBuyEmoji,
}: {
  gold: number;
  unlockedCharms?: string[];
  levelCoins?: number;
  onBuyCharm: (charmId: string, cost: number) => void;
  onBuyLevelCoins: (cost: number, amount: number) => void;
  unlockedEmojis: string[];
  onOpen: (id: string) => void;
  onBuyEmoji: (emoji: string, cost: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-stroke text-2xl text-white font-display">Sandık Mağazası</h2>
        <p className="text-xs text-amber-200/80">Yeni savaşçı kartları açmak ve koleksiyonunu genişletmek için altın karşılığı sandık açabilirsin.</p>
        
        <div className="grid grid-cols-1 gap-3">
          {CHESTS.map((chest) => {
            const can = gold >= chest.cost;
            return (
              <div
                key={chest.id}
                className="panel-3d flex items-center gap-3.5 rounded-2xl p-3.5 bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950/20 border-2 border-amber-500/30 shadow-lg hover:border-amber-400/60 transition-colors"
              >
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-5xl shadow-inner border border-amber-500/30">
                  {chest.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg sm:text-xl text-white font-bold">{chest.name}</div>
                  <div className="text-xs text-amber-200/90 mt-0.5">
                    {chest.id === "charm_chest" ? (
                      <>
                        <span className="font-bold text-amber-300">1 Charm</span> · Garanti:{" "}
                        <span className="font-bold text-stroke-sm text-yellow-300">Yeni Charm ✨</span>
                      </>
                    ) : (
                      <>
                        {chest.cards} kart · Garanti min:{" "}
                        <span className="font-bold text-stroke-sm text-white">
                          {RARITY_LABEL[chest.guaranteedMin]}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => onOpen(chest.id)}
                    disabled={!can}
                    className={cn(
                      "mt-2.5 rounded-xl px-4 py-2 text-sm sm:text-base font-display text-primary-foreground text-stroke font-black shadow-md flex items-center gap-1.5",
                      "btn-pop active:btn-pop-active",
                      !can && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span>🪙</span>
                    <span className="font-mono font-black">{chest.cost.toLocaleString("tr-TR")}</span>
                    <span className="text-xs uppercase font-sans font-bold opacity-90">Altın</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-stroke text-2xl text-white font-display">Charm Mağazası</h2>
            <p className="text-xs text-amber-200/80">Charmlar doğrudan satın alınamaz. Charm Sandığı (50.000 Altın) açarak yeni bir Charm kazanabilirsin!</p>
          </div>
          <span className="text-xs sm:text-sm font-mono font-black text-amber-300 bg-amber-500/15 border-2 border-amber-500/40 px-3 py-1 rounded-full shadow-inner flex items-center gap-1">
            <span>🪙</span>
            <span>{gold.toLocaleString("tr-TR")}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {CHARMS.map((charm) => {
            const hasCharm = (unlockedCharms || []).includes(charm.id);
            return (
              <div 
                key={charm.id} 
                className={cn(
                  "panel-3d flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl transition-all border-2 shadow-lg text-left",
                  hasCharm 
                    ? "bg-slate-900/60 border-slate-800/80" 
                    : "bg-gradient-to-br from-slate-850 via-slate-900 to-indigo-950/50 border-indigo-500/30"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-2xl sm:text-3xl rounded-xl bg-slate-950 border-2 border-indigo-500/40 shadow-inner shrink-0">
                      {charm.emoji}
                    </div>
                    {hasCharm ? (
                      <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                        Sahipsin ✓
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                        Sandıkta 🔮
                      </span>
                    )}
                  </div>
                  <div className="text-sm sm:text-base font-black text-white mt-2 font-display leading-tight">{charm.name}</div>
                  <p className="text-[11px] sm:text-xs text-slate-300/90 mt-1 leading-snug line-clamp-3 min-h-[2.5rem]">
                    {charm.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <button
                    disabled={true}
                    className={cn(
                      "w-full rounded-xl px-2.5 py-2.5 text-xs font-display whitespace-nowrap transition-all shadow-md flex items-center justify-center gap-1 font-black cursor-default",
                      hasCharm 
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40" 
                        : "bg-slate-800/80 text-amber-300 border border-slate-700"
                    )}
                  >
                    {hasCharm ? "Açıldı ✓" : "🔮 Sandıktan Çıkar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="space-y-3 pt-6 border-t border-slate-800">
        <div className="panel-3d flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl p-4 bg-gradient-to-br from-indigo-900/90 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 shadow-lg">
           <div className="flex items-center gap-3.5">
             <div className="grid h-14 w-14 sm:h-16 sm:w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-800 to-indigo-950 text-3xl sm:text-4xl shadow-inner border border-indigo-400/50">
               ✨
             </div>
             <div className="min-w-0">
               <div className="font-display text-base sm:text-lg text-white font-bold flex items-center gap-1.5">
                 Level Jetonu Al <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-sans font-medium">1 Jeton = 5.000 🪙</span>
               </div>
               <div className="text-xs text-indigo-200/90 leading-tight">
                 Kartların seviyesini yükseltmek için kullanılır. Sahip olunan: <span className="font-mono font-bold text-amber-300 text-sm">{levelCoins} ✨</span>
               </div>
             </div>
           </div>
           <div className="flex items-center gap-2 w-full sm:w-auto">
             <button
               onClick={() => onBuyLevelCoins(5000, 1)}
               disabled={gold < 5000}
               className={cn(
                 "w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs sm:text-sm font-display text-primary-foreground text-stroke font-black flex items-center justify-center gap-1.5",
                 "btn-pop active:btn-pop-active",
                 gold < 5000 && "opacity-50 cursor-not-allowed",
               )}
             >
               <span>🪙</span>
               <span className="font-mono text-sm">5.000</span>
               <span className="text-white ml-0.5">➔ 1 Jeton</span>
             </button>
           </div>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-800">
        <h2 className="text-stroke text-2xl text-white font-display">Emoji Mağazası</h2>
        <p className="text-xs text-amber-200/80">Savaşlarda rakiplerine gönderebileceğin özel emojileri buradan altın karşılığında satın alabilirsin.</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHOP_EMOJIS.map(({ emoji, cost }) => {
            const hasEmoji = unlockedEmojis.includes(emoji);
            const can = !hasEmoji && gold >= cost;
            return (
              <div key={emoji} className="panel-3d flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-center hover:border-slate-500 transition-all">
                <div className="py-2 flex items-center justify-center">
                  <AnimatedEmoji emoji={emoji} size="2xl" mode="ambient" interactive={true} />
                </div>
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
  rewards: ChestRewardItem[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "tapping" | "summary">("intro");
  const [tapCount, setTapCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const getChestEmoji = (isOpen = false) => {
    if (chestName.includes("Charm")) return isOpen ? "🔮" : "🔮";
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
  const activeCharm = activeReward?.charm;
  const isCharm = activeReward?.type === "charm";
  const isLevelCoin = activeReward?.type === "level_coin";

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
              Sandık İçeriği: {chestName.includes("Charm") ? "1 Charm ✨" : `${rewards.length} Ödül`}
            </div>
            
            <button className="mx-auto block w-full py-3 font-display text-lg text-primary-foreground text-stroke btn-pop active:btn-pop-active mt-2">
              AÇMAYA BAŞLA! ⚔️
            </button>
          </motion.div>
        )}

        {phase === "tapping" && activeReward && (
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
              className="relative transition-transform hover:scale-105 bg-black/40 p-3 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-1"
            >
              <div className="absolute -top-2.5 bg-yellow-500 text-amber-950 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-black shadow">
                {tapCount} / {rewards.length} ÖDÜL AÇILDI
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
                {tapCount < rewards.length ? "Sandığa Dokun! 👆" : "Özet için Dokun! 👆"}
              </div>
            </div>

            {/* Revealed Item popping out of the chest */}
            <AnimatePresence mode="wait">
              {isCharm && activeCharm ? (
                <motion.div 
                  key={tapCount}
                  initial={{ scale: 0.3, y: -40, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1.05, y: 0, opacity: 1, rotate: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                  className="py-4 flex flex-col items-center justify-center"
                >
                  <div className="px-6 py-5 rounded-[20px] border-2 border-yellow-500 bg-gradient-to-b from-indigo-900/90 to-yellow-950/80 shadow-[0_0_45px_#eab308] flex flex-col items-center justify-center w-56 text-center relative">
                    <span className="text-7xl mb-3 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] select-none animate-bounce duration-1000">{activeCharm.emoji}</span>
                    <div className="font-display text-2xl text-white text-stroke leading-tight tracking-wide">{activeCharm.name}</div>
                    <div className="text-xs font-black tracking-wider font-display uppercase mt-1 px-3 py-0.5 rounded-full border text-stroke-sm bg-yellow-600/30 border-yellow-500/50 text-yellow-300 animate-pulse">
                      ✨ EFSANEVİ CHARM
                    </div>
                    <p className="text-xs text-amber-100/90 mt-2 leading-tight">{activeCharm.description}</p>
                  </div>

                  <div className="mt-4 flex flex-col items-center gap-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 px-5 py-2 text-[11px] font-black text-amber-300 animate-bounce tracking-widest shadow-md">
                    <span>🎉 YENİ CHARM KAZANILDI!</span>
                  </div>
                </motion.div>
              ) : isLevelCoin ? (
                <motion.div 
                  key={tapCount}
                  initial={{ scale: 0.3, y: -40, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1.05, y: 0, opacity: 1, rotate: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                  className="py-4 flex flex-col items-center justify-center"
                >
                  <div className="px-6 py-5 rounded-[20px] border-2 border-cyan-400 bg-cyan-950/80 shadow-[0_0_35px_#22d3ee] flex flex-col items-center justify-center w-56 text-center relative">
                    <span className="text-7xl mb-3 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] select-none animate-bounce duration-1000">✨</span>
                    <div className="font-display text-2xl text-white text-stroke leading-tight tracking-wide">1 Level Jetonu</div>
                    <div className="text-xs font-black tracking-wider font-display uppercase mt-1 px-3 py-0.5 rounded-full border text-stroke-sm bg-cyan-600/30 border-cyan-500/50 text-cyan-300">
                      💎 SEVİYE JETONU
                    </div>
                    <p className="text-xs text-cyan-100/90 mt-2 leading-tight">Kartlarının seviyesini anında yükseltmek için kullanılır.</p>
                  </div>

                  <div className="mt-4 flex flex-col items-center gap-0.5 rounded-full bg-cyan-500/30 border border-cyan-400/50 px-5 py-2 text-[11px] font-black text-cyan-300 animate-bounce tracking-widest shadow-md">
                    <span>🎉 LEVEL JETONU KAZANILDI!</span>
                  </div>
                </motion.div>
              ) : activeCard ? (
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

                  {activeReward.isDuplicate ? (
                    <div className="mt-4 flex flex-col items-center justify-center gap-1 rounded-2xl bg-amber-500/15 border border-amber-500/40 px-5 py-2 text-center animate-pulse shadow-md w-full max-w-[240px]">
                      <span className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">Zaten Sahipsin!</span>
                      <span className="font-display text-base font-black text-emerald-400 flex items-center justify-center gap-1 text-stroke-sm">
                        +20 XP Kazanıldı! 🌟
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center gap-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 px-5 py-2 text-[11px] font-black text-emerald-300 animate-bounce tracking-widest shadow-md">
                      <span>🎉 YENİ SAVAŞÇI AÇILDI!</span>
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">+20 XP 🌟</span>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Stat Box Details (for cards) */}
            {activeCard && (
              <div className="space-y-1.5 bg-black/60 p-3 rounded-2xl border border-slate-800/80">
                <div className="text-xs text-slate-355 flex justify-between">
                  <span>Can Değeri:</span>
                  <span className="font-bold text-white">❤️ {activeCard.hp}</span>
                </div>
                <div className="text-xs text-slate-355 flex justify-between">
                  <span>Maksimum Hasar:</span>
                  <span className="font-bold text-white">⚔️ {activeCard.dmg}</span>
                </div>
                <div className="text-xs text-slate-356 flex justify-between">
                  <span>Saldırı Tipi:</span>
                  <span className="font-bold text-amber-300 capitalize">{activeCard.range === "yakın" ? "Yakın" : activeCard.range === "uzak" ? "Uzak" : "Hava"}</span>
                </div>
              </div>
            )}
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
              Sandıktan çıkan ödüller hesabınıza başarıyla eklendi.
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-h-[30vh] overflow-y-auto p-1.5 bg-black/40 border border-slate-950 rounded-2xl my-4">
              {rewards.map((reward, i) => {
                if (reward.type === "charm" && reward.charm) {
                  return (
                    <div key={i} className="relative flex flex-col items-center p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/60 shadow-md">
                      <span className="text-4xl mb-1 select-none">{reward.charm.emoji}</span>
                      <span className="text-[10px] text-white font-bold font-display truncate w-full px-1">{reward.charm.name}</span>
                      <span className="text-[8px] font-bold uppercase tracking-tight text-amber-300">Charm</span>
                      <span className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded-full border border-black shadow">
                        YENİ CHARM! ✨
                      </span>
                    </div>
                  );
                }
                if (reward.type === "level_coin") {
                  return (
                    <div key={i} className="relative flex flex-col items-center p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/60 shadow-md">
                      <span className="text-4xl mb-1 select-none">✨</span>
                      <span className="text-[10px] text-white font-bold font-display truncate w-full px-1">1 Level Jetonu</span>
                      <span className="text-[8px] font-bold uppercase tracking-tight text-cyan-300">Jeton</span>
                      <span className="absolute -top-1.5 -right-1 bg-cyan-400 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded-full border border-black shadow">
                        +1 JETON ✨
                      </span>
                    </div>
                  );
                }
                if (reward.card) {
                  const c = reward.card;
                  return (
                    <div key={i} className="relative flex flex-col items-center p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 shadow-md">
                      <span className="text-4xl mb-1 select-none">{c.emoji}</span>
                      <span className="text-[10px] text-white font-bold font-display truncate w-full px-1">{c.name}</span>
                      <span className={cn("text-[8px] font-bold uppercase tracking-tight", getRarityTextClass(c.rarity))}>
                        {RARITY_LABEL[c.rarity]}
                      </span>
                      
                      {reward.isDuplicate ? (
                        <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full border border-black shadow">
                          +20 XP 🌟
                        </span>
                      ) : (
                        <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full border border-black shadow animate-pulse">
                          YENİ! +20 XP
                        </span>
                      )}
                    </div>
                  );
                }
                return null;
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
            <h2 className="text-2xl text-stroke text-white font-black tracking-tight">Arena Yolu</h2>
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
              <div className="text-[10px] text-slate-400 font-sans uppercase font-black tracking-wider">Mevcut Kupa</div>
              <div className="text-lg font-black text-amber-400 leading-none mt-0.5">{currentTrophies} Kupa</div>
            </div>
          </div>
          <div className="text-right font-sans">
            {nextArena ? (
              <>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sonraki Arenaya</div>
                <div className="text-xs font-black text-cyan-400 mt-0.5">{trophiesToNext} 🏆 Kaldı</div>
              </>
            ) : (
              <>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">Efsane</div>
                <div className="text-xs font-black text-amber-300 mt-0.5">Maksimum Sınıra Ulaşıldı!</div>
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
                            Mevcut Arena
                          </span>
                        ) : isUnlocked ? (
                          <span className="px-2 py-0.5 text-[8px] font-bold rounded bg-slate-800 text-slate-400 font-sans">
                            Açık
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-bold rounded bg-slate-900 text-slate-500 font-sans flex items-center gap-1">
                            🔒 Kilitli
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cards Unlock Area */}
                  <div>
                    <div className="text-[10px] text-slate-400 mb-2 font-sans font-bold uppercase tracking-wider">
                      Açılan Kartlar
                    </div>
                    {unlocksCards.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {unlocksCards.map((c) => (
                          <GameCard key={c.id} card={c} size="sm" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic font-sans py-1">
                        Bu arenada yeni kart yok.
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
