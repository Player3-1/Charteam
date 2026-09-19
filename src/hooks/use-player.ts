import { useEffect, useState, useCallback } from "react";
import { CARDS } from "@/lib/cards";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { UserData } from "@/types";
import { MAX_TROPHIES, arenaForTrophies } from "@/lib/arenas";

const STARTER_DECK: UserData["deck"] = ["mizrakli", "kilicli", "okcu", "dev"];
const CURRENT_RANK_SEASON = 3;

function defaultState(username: string): UserData {
  const isDgoa = username.toLowerCase() === "dgoa";
  const collection: Record<string, number> = {};
  for (const cardId of STARTER_DECK) {
    collection[cardId] = 1;
  }
  return {
    username,
    gold: isDgoa ? 365000 : 1000,
    trophies: 0,
    collection,
    deck: STARTER_DECK,
    decks: Object.fromEntries(Array(5).fill(null).map((_, i) => [i.toString(), [...STARTER_DECK]])),
    activeDeckIndex: 0,
    wins: 0,
    losses: 0,
    rankProgressTrophies: 0,
    rankedStars: 0,
    rankSeason: CURRENT_RANK_SEASON,
    unlockedEmojis: ["👍", "😂", "😡", "😱"],
    selectedEmojis: ["👍", "😂", "😡", "😱"],
    unlockedCharms: ["kuvvet", "saglik"],
    selectedCharms: ["kuvvet", "saglik"],
    avatar: "",
    profileStyleUnlocked: false,
    profileColor: "white",
    profileFont: "font-display",
    rankedMatchesPlayed: 0,
    claimedRankedRewards: [],
    claimedRankTiers: [],
  };
}

export function usePlayer(username: string) {
  const [state, setState] = useState<UserData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!username) return;
    
    const userRef = doc(db, "users", username);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        
        let cardLevels = { ...(data.cardLevels || {}) };
        let cardProgress = { ...(data.cardProgress || {}) };
        
        const wins = Number(data.wins ?? 0);

        const collection = { ...(data.collection ?? {}) };
        if (Object.keys(collection).length === 0) {
          for (const cardId of STARTER_DECK) {
            collection[cardId] = 1;
          }
        }

        const isDgoa = username.toLowerCase() === "dgoa";
        const isOldSeason = (data.rankSeason ?? 1) < CURRENT_RANK_SEASON;
        const currentRankedStars = isOldSeason ? 0 : (data.rankedStars ?? 0);
        const currentRankProgressTrophies = isOldSeason
          ? 0
          : (data.rankProgressTrophies !== undefined ? data.rankProgressTrophies : 0);

        const currentRankedMatchesPlayed = isOldSeason ? 0 : (data.rankedMatchesPlayed ?? 0);
        const currentClaimedTiers = isOldSeason ? [] : (data.claimedRankTiers ?? []);

        const nextState: UserData = { 
          ...data, 
          collection,
          cardLevels: (data.cardLevels ?? {}),
          cardProgress: (data.cardProgress ?? {}),
          deck: data.deck ?? STARTER_DECK,
          decks: data.decks ?? Object.fromEntries(Array(5).fill(null).map((_, i) => [i.toString(), [...STARTER_DECK]])),
          activeDeckIndex: data.activeDeckIndex ?? 0,
          wins: wins,
          losses: data.losses ?? 0,
          rankProgressTrophies: currentRankProgressTrophies,
          rankedStars: currentRankedStars,
          rankSeason: CURRENT_RANK_SEASON,
          unlockedEmojis: (data.unlockedEmojis && data.unlockedEmojis.length > 0) ? data.unlockedEmojis : ["👍", "😂", "😡", "😱"],
          selectedEmojis: (data.selectedEmojis && data.selectedEmojis.length > 0) ? data.selectedEmojis : ["👍", "😂", "😡", "😱"],
          claimedMilestones: data.claimedMilestones ?? [],
          avatar: data.avatar ?? "",
          profileStyleUnlocked: data.profileStyleUnlocked ?? false,
          profileColor: data.profileColor ?? "white",
          profileFont: data.profileFont ?? "font-display",
          rankedMatchesPlayed: currentRankedMatchesPlayed,
          claimedRankedRewards: isOldSeason ? [] : (data.claimedRankedRewards ?? []),
          claimedRankTiers: currentClaimedTiers,
        };

        if (isOldSeason) {
          updateDoc(userRef, {
            rankedStars: 0,
            rankProgressTrophies: isDgoa ? 100 : 0,
            rankedMatchesPlayed: 0,
            claimedRankedRewards: [],
            claimedRankTiers: isDgoa ? ["bronz_1"] : [],
            rankSeason: CURRENT_RANK_SEASON,
          }).catch(() => {});
        }

        setState(nextState);
      } else {
        setState(defaultState(username));
      }
      setHydrated(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${username}`);
    });
    
    return unsubscribe;
  }, [username]);

  const updateFirestore = useCallback(async (newState: UserData) => {
    if (!username) return;
    const userRef = doc(db, "users", username);
    try {
      const cleanState = JSON.parse(JSON.stringify(newState));
      await setDoc(userRef, cleanState, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${username}`);
    }
  }, [username]);

  const addCards = useCallback(async (cardIds: string[]) => {
    if (!state) return;
    const newState = { 
      ...state, 
      collection: { ...state.collection },
    };
    for (const id of cardIds) {
      newState.collection[id] = (newState.collection[id] ?? 0) + 1;
    }
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const claimChestRewards = useCallback(async (rewards: { card: any; isDuplicate: boolean; refundGold: number }[], cost: number = 0) => {
    if (!state) return;
    const newState = { 
      ...state, 
      collection: { ...state.collection }, 
      cardProgress: { ...(state.cardProgress || {}) },
      gold: Math.max(0, state.gold - cost) 
    };

    // Give +20 XP only to cards pulled from the chest
    for (const reward of rewards) {
      const cardId = reward.card.id;
      newState.collection[cardId] = (newState.collection[cardId] ?? 0) + 1;
      
      const currentLvl = (newState.cardLevels?.[cardId]) || 1;
      if (currentLvl < 5) {
        newState.cardProgress[cardId] = (newState.cardProgress[cardId] ?? 0) + 20;
      }
    }

    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const spendGold = useCallback(async (amount: number) => {
    if (!state || state.gold < amount) return false;
    const newState = { ...state, gold: state.gold - amount };
    setState(newState);
    await updateFirestore(newState);
    return true;
  }, [state, updateFirestore]);

  const applyMatchReward = useCallback(async (gold: number, trophy: number, win: boolean, matchMode: "standard" | "tournament" | "ranked" = "standard") => {
    if (!state) return;
    
    let nextTrophies = state.trophies;
    let nextMaxTrophies = state.maxTrophies ?? state.trophies;
    let nextProgressTrophies = state.rankProgressTrophies ?? 0;
    let nextRankedStars = state.rankedStars ?? 0;

    if (matchMode === "ranked") {
      // Ranked stars logic (+1 for win, -1 for loss)
      const starsChange = win ? 1 : -1;
      nextRankedStars = Math.max(0, (state.rankedStars ?? 0) + starsChange);
      // Trophies remain completely unchanged
      nextTrophies = state.trophies;
      nextMaxTrophies = state.maxTrophies ?? state.trophies;
    } else {
      // Standard trophies logic (wins grant trophies with level scaling, defeats lose that same amount)
      const proposedTrophies = state.trophies + trophy;
      nextTrophies = Math.max(0, Math.min(MAX_TROPHIES, proposedTrophies));
      nextMaxTrophies = Math.max(state.maxTrophies ?? 0, nextTrophies);

      // Rank progress is NOT tied to fluctuating current trophies.
      // It accumulates as you grind and gain trophies on victory (kastıkça artar) and does not drop on loss.
      const progressTrophies = state.rankProgressTrophies ?? 0;
      const gainOnWin = win ? Math.max(0, trophy) : 0;
      nextProgressTrophies = progressTrophies + gainOnWin;
    }

    // Accumulate card XP based on match result (+10 XP per win, +5 XP per loss for cards in active deck)
    const nextCardProgress = { ...(state.cardProgress || {}) };
    const cardLevels = state.cardLevels || {};
    const earnedXp = win ? 10 : 5;
    const activeDeckIndex = state.activeDeckIndex ?? 0;
    const activeDeck = state.decks?.[activeDeckIndex.toString()] || state.deck || [];
    
    activeDeck.forEach((cardId) => {
      if (cardId) {
        const lvl = cardLevels[cardId] || 1;
        if (lvl < 5) {
          const currentProg = nextCardProgress[cardId] || 0;
          nextCardProgress[cardId] = currentProg + earnedXp;
        }
      }
    });

    const nextRankedMatchesPlayed = (state.rankedMatchesPlayed ?? 0) + (matchMode === "ranked" ? 1 : 0);

    const newState: UserData = {
      ...state,
      gold: Math.max(0, state.gold + gold),
      trophies: nextTrophies,
      maxTrophies: nextMaxTrophies,
      wins: win ? state.wins + 1 : state.wins,
      losses: !win ? state.losses + 1 : state.losses,
      rankProgressTrophies: nextProgressTrophies,
      rankedStars: nextRankedStars,
      cardProgress: nextCardProgress,
      rankedMatchesPlayed: nextRankedMatchesPlayed,
    };
    
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const upgradeCardLevelWithGold = useCallback(async (cardId: string) => {
    if (!state) return false;
    const cardLevels = { ...(state.cardLevels || {}) };
    const cardProgress = { ...(state.cardProgress || {}) };
    
    const lvl = cardLevels[cardId] || 1;
    if (lvl >= 5) {
      alert("Bu kart zaten maksimum seviyede (Level 5)!");
      return false;
    }
    
    // Altın ile yükseltme yapmak için Kart XP'sinin dolu olması gerekir
    const reqXp = lvl === 1 ? 50 : lvl === 2 ? 100 : lvl === 3 ? 150 : 250;
    const currentProgress = cardProgress[cardId] || 0;
    if (currentProgress < reqXp) {
      alert(`⚠️ Kart XP'si Yetersiz!\n\nBu kartı Altın ile Seviye ${lvl + 1}'e yükseltmek için önce kart XP'sinin tamamen dolması gerekmektedir (${currentProgress}/${reqXp} XP).\n\nSavaş kazanarak XP biriktirebilir veya Dükkandan Level Jetonu alarak XP doldurmadan yükseltebilirsin!`);
      return false;
    }
    
    // Normal yükseltme maliyetleri (Altın)
    const reqGold = lvl === 1 ? 500 : lvl === 2 ? 1500 : lvl === 3 ? 3500 : 7500;
    const currentGold = state.gold || 0;
    if (currentGold < reqGold) {
      alert(`Yetersiz Altın!\n\nBu kartı Seviye ${lvl + 1}'e yükseltmek için ${reqGold.toLocaleString("tr-TR")} Altın gerekiyor.\nŞu an sahip olduğun Altın: ${currentGold.toLocaleString("tr-TR")}`);
      return false;
    }
    
    const newState: UserData = {
      ...state,
      gold: currentGold - reqGold,
      cardLevels: {
        ...cardLevels,
        [cardId]: lvl + 1
      },
      cardProgress: {
        ...cardProgress,
        [cardId]: Math.max(0, currentProgress - reqXp)
      }
    };
    
    setState(newState);
    await updateFirestore(newState);
    alert(`🎉 Tebrikler! Kart Seviye ${lvl + 1}'e yükseltildi!`);
    return true;
  }, [state, updateFirestore]);

  const upgradeCardLevel = useCallback(async (cardId: string) => {
    if (!state) return false;
    const cardLevels = { ...(state.cardLevels || {}) };
    const cardProgress = { ...(state.cardProgress || {}) };
    
    const lvl = cardLevels[cardId] || 1;
    
    if (lvl >= 5) {
      alert("Bu kart zaten maksimum seviyede (Level 5)!");
      return false;
    }
    
    const reqCoins = lvl === 1 ? 1 : lvl === 2 ? 2 : lvl === 3 ? 3 : 5;
    const currentCoins = state.levelCoins || 0;
    if (currentCoins < reqCoins) {
      alert(`Yetersiz Level Jetonu!\n\nBu kartı Jeton ile Seviye ${lvl + 1}'e yükseltmek için ${reqCoins} Level Jetonu gerekiyor.\nŞu an sahip olduğun Jeton: ${currentCoins}\n\nDükkan sekmesinden 1 Level Jetonunu 5.000 Altın karşılığında alabilirsin.`);
      return false;
    }

    const reqXp = lvl === 1 ? 50 : lvl === 2 ? 100 : lvl === 3 ? 150 : 250;
    
    const newState: UserData = {
      ...state,
      cardLevels: {
        ...cardLevels,
        [cardId]: lvl + 1
      },
      cardProgress: {
        ...cardProgress,
        [cardId]: Math.max(0, (cardProgress[cardId] || 0) - reqXp)
      },
      levelCoins: currentCoins - reqCoins
    };
    
    setState(newState);
    await updateFirestore(newState);
    alert(`🎉 Tebrikler! Level Jetonu ile kart Seviye ${lvl + 1}'e yükseltildi!`);
    return true;
  }, [state, updateFirestore]);

  const resetRankedStars = useCallback(async () => {
    if (!state) return;
    const newState = { ...state, rankedStars: 0 };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const claimProgressionReward = useCallback(async (type: "trophy" | "star", threshold: number, rewards: { card: any; isDuplicate: boolean; refundGold: number }[]) => {
    if (!state) return;
    const newState = { 
      ...state,
      collection: { ...state.collection },
      cardProgress: { ...(state.cardProgress || {}) }
    };
    
    if (type === "trophy") {
      newState.claimedTrophyRewards = [...(newState.claimedTrophyRewards || []), threshold];
    } else {
      newState.claimedStarRewards = [...(newState.claimedStarRewards || []), threshold];
    }

    rewards.forEach(reward => {
      const cardId = reward.card.id;
      newState.collection[cardId] = (newState.collection[cardId] || 0) + 1;
      
      const currentLvl = (newState.cardLevels?.[cardId]) || 1;
      if (currentLvl < 5) {
        newState.cardProgress[cardId] = (newState.cardProgress[cardId] ?? 0) + 10;
      }
    });

    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const setDeckSlot = useCallback(async (slot: number, cardId: string) => {
    if (!state) return;
    const activeDeckIndex = state.activeDeckIndex ?? 0;
    const decks = { ...(state.decks ?? { "0": state.deck }) };
    const deck = [...(decks[activeDeckIndex.toString()] || state.deck)] as UserData["deck"];
    
    if (cardId === "") {
        deck[slot] = "";
    } else {
        const existingSlot = deck.indexOf(cardId);
        if (existingSlot >= 0) {
            deck[existingSlot] = deck[slot];
        }
        deck[slot] = cardId;
    }
    decks[activeDeckIndex.toString()] = deck;

    const newState = { ...state, decks, deck }; // Keep deck for backward compatibility
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const setActiveDeck = useCallback(async (index: number) => {
    if (!state) return;
    const newState = { ...state, activeDeckIndex: index, deck: state.decks![index.toString()] };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const setCharmSlot = useCallback(async (slot: number, charmId: string) => {
    if (!state) return;
    const selectedCharms = [...(state.selectedCharms ?? ["", ""])];
    
    if (charmId === "") {
        selectedCharms[slot] = "";
    } else {
        const existingSlot = selectedCharms.indexOf(charmId);
        if (existingSlot >= 0) {
            selectedCharms[existingSlot] = selectedCharms[slot];
        }
        selectedCharms[slot] = charmId;
    }
    const newState = { ...state, selectedCharms };
    setState(newState);
    await updateFirestore({ selectedCharms });
  }, [state, updateFirestore]);

  const setEmojiSlot = useCallback(async (slot: number, emoji: string) => {
    if (!state) return;
    const selectedEmojis = [...(state.selectedEmojis ?? ["", "", "", ""])] as string[];
    
    if (emoji === "") {
        selectedEmojis[slot] = "";
    } else {
        const existingSlot = selectedEmojis.indexOf(emoji);
        if (existingSlot >= 0) {
            selectedEmojis[existingSlot] = selectedEmojis[slot];
        }
        selectedEmojis[slot] = emoji;
    }
    const newState = { ...state, selectedEmojis };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const buyCharm = useCallback(async (charmId: string, cost: number) => {
    if (!state) return false;
    if (state.gold < cost) {
      return false;
    }
    const currentUnlocked = (state.unlockedCharms && state.unlockedCharms.length > 0)
      ? state.unlockedCharms
      : ["kuvvet", "saglik"];
    if (currentUnlocked.includes(charmId)) return true;
    const unlockedCharms = [...currentUnlocked, charmId];
    const newState = { ...state, gold: state.gold - cost, unlockedCharms };
    setState(newState);
    await updateFirestore({ gold: state.gold - cost, unlockedCharms });
    return true;
  }, [state, updateFirestore]);

  const buyLevelCoins = useCallback(async (cost: number, amount: number) => {
    if (!state) return false;
    if (state.gold < cost) {
      return false;
    }
    const newState = { ...state, gold: state.gold - cost, levelCoins: (state.levelCoins || 0) + amount };
    setState(newState);
    await updateFirestore({ gold: state.gold - cost, levelCoins: (state.levelCoins || 0) + amount });
    return true;
  }, [state, updateFirestore]);

  const buyEmoji = useCallback(async (emoji: string, cost: number) => {
    if (!state || state.gold < cost || state.unlockedEmojis?.includes(emoji)) return false;
    const newState = { 
      ...state, 
      gold: state.gold - cost,
      unlockedEmojis: [...(state.unlockedEmojis ?? []), emoji] 
    };
    setState(newState);
    await updateFirestore(newState);
    return true;
  }, [state, updateFirestore]);

  const setTrophies = useCallback(async (trophies: number) => {
    if (!state) return;
    const newState = {
      ...state,
      trophies: Math.max(0, Math.min(MAX_TROPHIES, trophies)),
      maxTrophies: Math.max(state.maxTrophies ?? 0, trophies)
    };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const setGold = useCallback(async (gold: number) => {
    if (!state) return;
    const newState = {
      ...state,
      gold: Math.max(0, gold)
    };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const updateResources = useCallback(async (trophies: number, gold: number, rankedStars?: number) => {
    if (!state) return;
    const newState = {
      ...state,
      trophies: Math.max(0, Math.min(MAX_TROPHIES, trophies)),
      maxTrophies: Math.max(state.maxTrophies ?? 0, trophies),
      gold: Math.max(0, gold),
      rankedStars: rankedStars !== undefined ? Math.max(0, rankedStars) : (state.rankedStars ?? 0)
    };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const cheatUnlockAll = useCallback(async () => {
    alert("Hile sistemi kapatılmıştır.");
  }, []);

  const updateProfileCustomization = useCallback(async (customization: { avatar?: string, profileStyleUnlocked?: boolean, profileColor?: string, profileFont?: string }) => {
    if (!state) return;
    const newState = {
      ...state,
      ...customization
    };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const importDeck = useCallback(async (cardIds: string[]) => {
    if (!state || cardIds.length !== 4) return;
    const activeDeckIndex = state.activeDeckIndex ?? 0;
    const decks = { ...(state.decks ?? { "0": state.deck }) };
    const deck = [...cardIds] as UserData["deck"];
    decks[activeDeckIndex.toString()] = deck;

    const newState = { ...state, decks, deck };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const claimRankedReward = useCallback(async (matchNum: number, goldReward: number | null, rewards: { card: any; isDuplicate: boolean; refundGold: number }[]) => {
    if (!state) return;
    const newState = {
      ...state,
      collection: { ...state.collection },
      cardProgress: { ...(state.cardProgress || {}) },
      gold: state.gold + (goldReward || 0),
      claimedRankedRewards: [...(state.claimedRankedRewards || []), matchNum]
    };

    rewards.forEach(reward => {
      const cardId = reward.card.id;
      newState.collection[cardId] = (newState.collection[cardId] || 0) + 1;
      const currentLvl = (state.cardLevels?.[cardId]) || 1;
      if (currentLvl < 5) {
        newState.cardProgress[cardId] = (newState.cardProgress[cardId] ?? 0) + 10;
      }
    });

    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const claimRankReward = useCallback(async (
    targetRankId: string,
    goldReward: number,
    levelCoinsReward: number,
    rewards: { card: any; isDuplicate: boolean; refundGold: number }[]
  ) => {
    if (!state) return;
    const totalRefund = rewards.reduce((sum, r) => sum + (r.isDuplicate ? r.refundGold : 0), 0);
    const newState = {
      ...state,
      gold: state.gold + goldReward + totalRefund,
      levelCoins: (state.levelCoins || 0) + levelCoinsReward,
      collection: { ...state.collection },
      cardProgress: { ...(state.cardProgress || {}) },
      claimedRankTiers: [...(state.claimedRankTiers || []), targetRankId],
    };

    rewards.forEach(reward => {
      const cardId = reward.card.id;
      newState.collection[cardId] = (newState.collection[cardId] || 0) + 1;
      const currentLvl = (state.cardLevels?.[cardId]) || 1;
      if (currentLvl < 5) {
        newState.cardProgress[cardId] = (newState.cardProgress[cardId] ?? 0) + 10;
      }
    });

    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  return { state, hydrated, addCards, claimChestRewards, spendGold, setDeckSlot, setActiveDeck, applyMatchReward, setEmojiSlot, setCharmSlot, buyEmoji, buyCharm, buyLevelCoins, setTrophies, setGold, updateResources, resetRankedStars, claimProgressionReward, cheatUnlockAll, updateProfileCustomization, importDeck, upgradeCardLevel, upgradeCardLevelWithGold, claimRankedReward, claimRankReward };
}
