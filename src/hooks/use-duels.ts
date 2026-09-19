import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

export interface DuelRequest {
  id: string;
  challenger: string;
  challenged: string;
  status: "pending" | "accepted" | "declined";
  battleId?: string;
  timestamp: any;
}

export function useDuels(username: string) {
  const [incomingDuels, setIncomingDuels] = useState<DuelRequest[]>([]);
  const [outgoingDuels, setOutgoingDuels] = useState<DuelRequest[]>([]);

  useEffect(() => {
    if (!username) return;

    const incomingQ = query(collection(db, "duels"), where("challenged", "==", username), where("status", "==", "pending"));
    const unsubIncoming = onSnapshot(incomingQ, (snapshot) => {
      const duels: DuelRequest[] = [];
      snapshot.forEach(doc => duels.push({ id: doc.id, ...doc.data() } as DuelRequest));
      setIncomingDuels(duels);
    });

    const outgoingQ = query(collection(db, "duels"), where("challenger", "==", username));
    const unsubOutgoing = onSnapshot(outgoingQ, (snapshot) => {
      const duels: DuelRequest[] = [];
      snapshot.forEach(doc => duels.push({ id: doc.id, ...doc.data() } as DuelRequest));
      setOutgoingDuels(duels);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [username]);

  const sendDuelRequest = async (targetUsername: string) => {
    const duelId = `${username}_${targetUsername}_${Date.now()}`;
    await setDoc(doc(db, "duels", duelId), {
      challenger: username,
      challenged: targetUsername,
      status: "pending",
      timestamp: serverTimestamp()
    });
    return duelId;
  };

  const acceptDuel = async (duelId: string, battleId: string) => {
    await updateDoc(doc(db, "duels", duelId), {
      status: "accepted",
      battleId
    });
  };

  const declineDuel = async (duelId: string) => {
    await updateDoc(doc(db, "duels", duelId), {
      status: "declined"
    });
  };

  const cancelDuel = async (duelId: string) => {
    await deleteDoc(doc(db, "duels", duelId));
  };

  return {
    incomingDuels,
    outgoingDuels,
    sendDuelRequest,
    acceptDuel,
    declineDuel,
    cancelDuel
  };
}
