import { useEffect, useState, useCallback } from "react";
import { CARDS } from "@/lib/cards";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { UserData } from "@/types";

const STARTER_DECK: UserData["deck"] = ["mizrakli", "kilicli", "okcu", "dev"];

function defaultState(username: string): UserData {
  const collection: Record<string, number> = {};
  for (const c of CARDS) {
    if (c.rarity === "common") collection[c.id] = 1;
  }
  return {
    username,
    gold: 1000,
    trophies: 0,
    collection,
    deck: STARTER_DECK,
    wins: 0,
    losses: 0,
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
        setState({ 
          ...data, 
          collection: data.collection ?? {},
          deck: data.deck ?? STARTER_DECK,
          wins: data.wins ?? 0,
          losses: data.losses ?? 0
        });
      } else {
        const initialState = defaultState(username);
        setState(initialState);
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
    await updateDoc(userRef, newState as any);
  }, [username]);

  const addCards = useCallback(async (cardIds: string[]) => {
    if (!state) return;
    const newState = { ...state, collection: { ...state.collection } };
    for (const id of cardIds) newState.collection[id] = (newState.collection[id] ?? 0) + 1;
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const claimChestRewards = useCallback(async (rewards: { card: any; isDuplicate: boolean; refundGold: number }[]) => {
    if (!state) return;
    const newState = { ...state, collection: { ...state.collection }, gold: state.gold };
    for (const reward of rewards) {
      if (reward.isDuplicate) {
        newState.gold += reward.refundGold;
      } else {
        newState.collection[reward.card.id] = 1;
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

  const applyMatchReward = useCallback(async (gold: number, trophy: number, win: boolean) => {
    if (!state) return;
    const newState = { 
      ...state, 
      gold: Math.max(0, state.gold + gold),
      trophies: Math.max(0, Math.min(750, state.trophies + trophy)),
      wins: win ? state.wins + 1 : state.wins,
      losses: !win ? state.losses + 1 : state.losses,
    };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  const setDeckSlot = useCallback(async (slot: number, cardId: string) => {
    if (!state) return;
    const deck = [...state.deck] as UserData["deck"];
    if (cardId === "") {
        deck[slot] = "";
    } else {
        const existingSlot = deck.indexOf(cardId);
        if (existingSlot >= 0) {
            deck[existingSlot] = deck[slot];
        }
        deck[slot] = cardId;
    }
    const newState = { ...state, deck };
    setState(newState);
    await updateFirestore(newState);
  }, [state, updateFirestore]);

  return { state, hydrated, addCards, claimChestRewards, spendGold, setDeckSlot, applyMatchReward };
}
