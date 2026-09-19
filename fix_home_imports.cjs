const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const newImports = `
import { db } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
`;

text = text.replace('import { useDuels } from "@/hooks/use-duels";', 'import { useDuels } from "@/hooks/use-duels";' + newImports);

fs.writeFileSync("src/components/home-tab.tsx", text);
