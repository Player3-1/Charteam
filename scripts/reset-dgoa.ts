import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

async function main() {
  const usernames = ["dgoa", "Dgoa", "DGOA"];
  
  for (const username of usernames) {
    const userRef = doc(db, "users", username);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log(`Found user document for ${username}:`, snap.data());
      await updateDoc(userRef, {
        gold: 365000,
        unlockedCharms: ["kuvvet", "saglik"],
        selectedCharms: ["kuvvet", "saglik"],
        rankedStars: 0,
        rankProgressTrophies: 0,
        claimedRankTiers: [],
        claimedRankedRewards: [],
        rankedMatchesPlayed: 0,
        trophies: 0,
        maxTrophies: 0,
      });
      console.log(`Successfully updated ${username} in Firestore!`);
    } else {
      console.log(`User document ${username} does not exist in Firestore yet.`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating dgoa:", err);
  process.exit(1);
});
