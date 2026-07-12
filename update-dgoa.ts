import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const userRef = doc(db, 'users', 'dgoa');
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, {
      trophies: 2500,
      gold: 15000
    });
    console.log("Updated dgoa successfully.");
  } else {
    console.log("User dgoa not found.");
  }
}
run().catch(console.error);
