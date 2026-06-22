import { db } from "@/firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, deleteDoc, onSnapshot, serverTimestamp, where, orderBy, limit, updateDoc, arrayUnion } from "firebase/firestore";
import { UserData } from "@/types";

export interface BattlePlacement {
  cardId: string;
  col: number;
  row: number;
}

export interface BattleAbilityTrigger {
  cardId: string;
  simTime: number;
}

export interface BattleDoc {
  id: string;
  player1: { username: string; trophies: number; deck: string[] };
  player2: { username: string; trophies: number; deck: string[] };
  player1Placements: BattlePlacement[];
  player2Placements: BattlePlacement[];
  player1Abilities?: BattleAbilityTrigger[];
  player2Abilities?: BattleAbilityTrigger[];
  status: "placing" | "fighting" | "finished";
  createdAt: any;
}

export async function findOrCreateMatch(user: UserData): Promise<string> {
  const q = query(
    collection(db, "matchmaking"),
    where("status", "==", "searching"),
    limit(10)
  );

  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    // try to find someone other than myself
    const oppDoc = snapshot.docs.find(doc => doc.id !== user.username);
    if (oppDoc) {
      const oppData = oppDoc.data();
      const rand = Math.floor(100000 + Math.random() * 900000);
      const battleId = `${oppDoc.id}_${user.username}_${rand}`;
      
      // Create battle doc
      await setDoc(doc(db, "battles", battleId), {
        id: battleId,
        player1: { username: oppData.username, trophies: oppData.trophies, deck: oppData.deck },
        player2: { username: user.username, trophies: user.trophies, deck: user.deck },
        player1Placements: [],
        player2Placements: [],
        player1Abilities: [],
        player2Abilities: [],
        status: "placing",
        createdAt: serverTimestamp(),
      });
      
      // Update opponent's matchmaking doc
      await setDoc(doc(db, "matchmaking", oppDoc.id), {
        ...oppData,
        status: "matched",
        battleId: battleId
      });
      
      return battleId;
    }
  }

  // Join queue
  await setDoc(doc(db, "matchmaking", user.username), {
    username: user.username,
    trophies: user.trophies,
    deck: user.deck,
    status: "searching",
    battleId: null,
    createdAt: serverTimestamp(),
  });

  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(doc(db, "matchmaking", user.username), (d) => {
      const data = d.data();
      if (data && data.status === "matched" && data.battleId) {
        unsubscribe();
        deleteDoc(doc(db, "matchmaking", user.username));
        resolve(data.battleId);
      }
    });
  });
}

export async function cancelMatchmaking(username: string) {
  try {
    await deleteDoc(doc(db, "matchmaking", username));
  } catch (err) {
    // ignore
  }
}

export async function submitPlacements(battleId: string, isPlayer1: boolean, placements: BattlePlacement[]) {
  const bRef = doc(db, "battles", battleId);
  if (isPlayer1) {
    await updateDoc(bRef, { player1Placements: placements });
  } else {
    await updateDoc(bRef, { player2Placements: placements });
  }
}

export async function submitAbilityTrigger(battleId: string, isPlayer1: boolean, cardId: string, simTime: number) {
  const bRef = doc(db, "battles", battleId);
  const abilityField = isPlayer1 ? "player1Abilities" : "player2Abilities";
  await updateDoc(bRef, {
    [abilityField]: arrayUnion({ cardId, simTime })
  });
}

export async function submitEmoji(battleId: string, isPlayer1: boolean, emoji: string, simTime: number) {
  const bRef = doc(db, "battles", battleId);
  const emojiField = isPlayer1 ? "player1Emojis" : "player2Emojis";
  await updateDoc(bRef, {
    [emojiField]: arrayUnion({ emoji, simTime })
  });
}
