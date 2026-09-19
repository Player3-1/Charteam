import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

async function main() {
  const usernames = ["dgoa", "Dgoa", "DGOA"];
  
  for (const username of usernames) {
    const userRef = doc(db, "users", username);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log(`Updating trophies for ${username}...`);
      await updateDoc(userRef, {
        trophies: 5000,
        maxTrophies: 5000,
        gold: 365000,
        unlockedCharms: ["kuvvet", "saglik"],
        selectedCharms: ["kuvvet", "saglik"],
        rankedStars: 0,
        rankProgressTrophies: 0,
      });
      console.log(`Successfully updated ${username} trophies to 5000 in Firestore!`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating dgoa trophies:", err);
  process.exit(1);
});
