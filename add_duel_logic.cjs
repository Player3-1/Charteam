const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

text = "import { useDuels } from \"@/hooks/use-duels\";\n" + text;

text = text.replace("import { doc, getDoc, setDoc, updateDoc } from \"firebase/firestore\";", "import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from \"firebase/firestore\";");

const hookDef = `  const { state, hydrated, claimChestRewards, spendGold, setDeckSlot, setActiveDeck, applyMatchReward, buyEmoji, setCharmSlot, setEmojiSlot, setTrophies, setGold, updateResources, resetRankedStars, claimProgressionReward, cheatUnlockAll, updateProfileCustomization, importDeck, upgradeCardLevel, claimRankedReward } = usePlayer(user.username);`;
const hookAdd = `  const { state, hydrated, claimChestRewards, spendGold, setDeckSlot, setActiveDeck, applyMatchReward, buyEmoji, setCharmSlot, setEmojiSlot, setTrophies, setGold, updateResources, resetRankedStars, claimProgressionReward, cheatUnlockAll, updateProfileCustomization, importDeck, upgradeCardLevel, claimRankedReward } = usePlayer(user.username);
  const { incomingDuels, outgoingDuels, sendDuelRequest, acceptDuel, declineDuel, cancelDuel } = useDuels(user.username);`;
text = text.replace(hookDef, hookAdd);

fs.writeFileSync("src/components/home-tab.tsx", text);
