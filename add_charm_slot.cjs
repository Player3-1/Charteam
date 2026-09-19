const fs = require("fs");
let text = fs.readFileSync("src/hooks/use-player.ts", "utf8");

const from = `const setEmojiSlot = useCallback(async (slot: number, emoji: string) => {`;
const to = `const setCharmSlot = useCallback(async (slot: number, charmId: string) => {
    if (!state) return;
    const selectedCharms = [...(state.selectedCharms ?? ["", ""])];
    
    if (charmId === "") {
        selectedCharms[slot] = "";
    } else {
        const existingSlot = selectedCharms.indexOf(charmId);
        if (existingSlot >= 0) {
            selectedCharms[existingSlot] = selectedCharms[slot];
        }
        selectedCharms[slot] = charmId;
    }
    await updateFirestore({ selectedCharms });
  }, [state, updateFirestore]);

  const setEmojiSlot = useCallback(async (slot: number, emoji: string) => {`;

text = text.replace(from, to);

// Add to export
const from2 = `buyEmoji,
    setEmojiSlot,`;
const to2 = `buyEmoji,
    setCharmSlot,
    setEmojiSlot,`;
text = text.replace(from2, to2);

fs.writeFileSync("src/hooks/use-player.ts", text);
