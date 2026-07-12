import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const userRef = doc(db, 'users', 'dgoa');
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    console.log("Current dgoa:", snap.data());
    await updateDoc(userRef, { trophies: 2383 });
    console.log("Reset trophies to 2383");
  } else {
    console.log("User dgoa not found.");
  }
}
run().catch(console.error);
