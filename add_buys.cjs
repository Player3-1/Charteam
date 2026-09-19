const fs = require("fs");
let text = fs.readFileSync("src/hooks/use-player.ts", "utf8");

const from = `  const buyEmoji = useCallback(async (emoji: string, cost: number) => {`;
const to = `  const buyCharm = useCallback(async (charmId: string, cost: number) => {
    if (!state) return false;
    if (state.gold < cost) {
      alert("Yetersiz altın!");
      return false;
    }
    const unlockedCharms = [...(state.unlockedCharms || ["kuvvet", "saglik"]), charmId];
    await updateFirestore({ gold: state.gold - cost, unlockedCharms });
    return true;
  }, [state, updateFirestore]);

  const buyLevelCoins = useCallback(async (cost: number, amount: number) => {
    if (!state) return false;
    if (state.gold < cost) {
      alert("Yetersiz altın!");
      return false;
    }
    await updateFirestore({ gold: state.gold - cost, levelCoins: (state.levelCoins || 0) + amount });
    return true;
  }, [state, updateFirestore]);

  const buyEmoji = useCallback(async (emoji: string, cost: number) => {`;

text = text.replace(from, to);

const fromExport = `buyEmoji,
    setCharmSlot,`;
const toExport = `buyEmoji,
    buyCharm,
    buyLevelCoins,
    setCharmSlot,`;

text = text.replace(fromExport, toExport);

fs.writeFileSync("src/hooks/use-player.ts", text);
