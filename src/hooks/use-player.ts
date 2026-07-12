import { useEffect, useState, useCallback } from "react";
import { CARDS } from "@/lib/cards";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { UserData } from "@/types";
import { MAX_TROPHIES, arenaForTrophies } from "@/lib/arenas";

const STARTER_DECK: UserData["deck"] = ["mizrakli", "kilicli", "okcu", "dev"];

function defaultState(username: string): UserData {
  const collection: Record<string, number> = {};
  for (const c of CARDS) {
    if (c.rarity === "common") {
      collection[c.id] = 1;
    }
  }
  return {
    username,
    gold: 1000,
    trophies: 0,
    collection,
    deck: STARTER_DECK,
    decks: Object.fromEntries(Array(5).fill(null).map((_, i) => [i.toString(), [...STARTER_DECK]])),
    activeDeckIndex: 0,
    wins: 0,
    losses: 0,
    rankProgressTrophies: 0,
    rankedStars: 0,
  };
}

export function usePlayer(username: string) {
  const [state, setState] = useState<UserData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!username) return;
    
    const userRef = doc(db, "users", username);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        
        const wins = Number(data.wins ?? 0);

        const nextState = { 
          ...data, 
          deck: data.deck ?? STARTER_DECK,
          decks: data.decks ?? Object.fromEntries(Array(5).fill(null).map((_, i) => [i.toString(), [...STARTER_DECK]])),
          activeDeckIndex: data.activeDeckIndex ?? 0,
          wins: wins,
          losses: data.losses ?? 0,
          rankProgressTrophies: data.rankProgressTrophies ?? 0,
          rankedStars: data.rankedStars ?? 0,
          unlockedEmojis: data.unlockedEmojis ?? [],
          selectedEmojis: data.selectedEmojis ?? ["", "", "", ""],
          claimedMilestones: data.claimedMilestones ?? [],
        };

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
      gold: state.gold - cost 
    };
    for (const reward of rewards) {
      const cardId = reward.card.id;
      newState.collection[cardId] = (newState.collection[cardId] ?? 0) + 1;
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
      // Ranked stars logic (+10 for win, -10 to -20 for loss)
      const starsChange = trophy;
      nextRankedStars = Math.max(0, (state.rankedStars ?? 0) + starsChange);
      // Trophies remain completely unchanged
      nextTrophies = state.trophies;
      nextMaxTrophies = state.maxTrophies ?? state.trophies;
    } else {
      // Standard trophies logic
      const progressTrophies = state.rankProgressTrophies ?? 0;
      nextProgressTrophies = Math.max(0, progressTrophies + trophy);
      
      const proposedTrophies = state.trophies + trophy;
      
      const currentArena = arenaForTrophies(state.trophies);
      const minArenaTrophies = currentArena.min;
      
      const finalTrophies = Math.max(minArenaTrophies, proposedTrophies);
      
      nextTrophies = Math.max(0, Math.min(MAX_TROPHIES, finalTrophies));
      nextMaxTrophies = Math.max(state.maxTrophies ?? 0, nextTrophies);
    }

    const newState: UserData = {
      ...state,
      gold: Math.max(0, state.gold + gold),
      trophies: nextTrophies,
      maxTrophies: nextMaxTrophies,
      wins: win ? state.wins + 1 : state.wins,
      losses: !win ? state.losses + 1 : state.losses,
      rankProgressTrophies: nextProgressTrophies,
      rankedStars: nextRankedStars,
    };
    
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const resetRankedStars = useCallback(async () => {
    if (!state) return;
    const newState = { ...state, rankedStars: 0 };
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

  return { state, hydrated, addCards, claimChestRewards, spendGold, setDeckSlot, setActiveDeck, applyMatchReward, setEmojiSlot, buyEmoji, setTrophies, setGold, updateResources, resetRankedStars };
}
