const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

// Fix ChestsTab
text = text.replace(
`  gold: number;
  unlockedEmojis: string[];
  onOpen: (id: string) => void;
  onBuyEmoji: (emoji: string, cost: number) => void;
}) {
  return (`, 
`  gold: number;
  unlockedCharms?: string[];
  levelCoins?: number;
  onBuyCharm: (charmId: string, cost: number) => void;
  onBuyLevelCoins: (cost: number, amount: number) => void;
  unlockedEmojis: string[];
  onOpen: (id: string) => void;
  onBuyEmoji: (emoji: string, cost: number) => void;
}) {
  return (`
);

// Fix CardsTab
text = text.replace(
`  gold: number;
  unlockedCharms?: string[];
  levelCoins?: number;
  onBuyCharm: (charmId: string, cost: number) => void;
  onBuyLevelCoins: (cost: number, amount: number) => void;
  setDeckSlot: (slot: number, cardId: string) => void;`,
`  gold: number;
  setDeckSlot: (slot: number, cardId: string) => void;`
);

fs.writeFileSync("src/components/home-tab.tsx", text);
