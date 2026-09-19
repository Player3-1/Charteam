const fs = require("fs");
let text = fs.readFileSync("src/hooks/use-player.ts", "utf8");

const from = `    const reqXp = lvl === 1 ? 50 : lvl === 2 ? 100 : lvl === 3 ? 150 : lvl === 4 ? 250 : 250;
    if (prog < reqXp) {
      alert(\`Bu kartı yükseltmek için yeterli XP'ye sahip değilsin! (\${prog}/\${reqXp} XP gerekiyor)\`);
      return false;
    }`;

const to = `    const reqXp = lvl === 1 ? 50 : lvl === 2 ? 100 : lvl === 3 ? 150 : lvl === 4 ? 250 : 250;
    if (prog < reqXp) {
      alert(\`Bu kartı yükseltmek için yeterli XP'ye sahip değilsin! (\${prog}/\${reqXp} XP gerekiyor)\`);
      return false;
    }
    const reqCoins = lvl === 1 ? 50 : lvl === 2 ? 150 : lvl === 3 ? 400 : lvl === 4 ? 1000 : 1000;
    const currentCoins = state.levelCoins || 0;
    if (currentCoins < reqCoins) {
      alert(\`Yetersiz Level Coin! (\${currentCoins}/\${reqCoins} Coin gerekli. Dükkandan satın alabilirsiniz.)\`);
      return false;
    }`;

text = text.replace(from, to);

const from2 = `      cardProgress: {
        ...cardProgress,
        [cardId]: prog - reqXp
      }
    };`;

const to2 = `      cardProgress: {
        ...cardProgress,
        [cardId]: prog - reqXp
      },
      levelCoins: currentCoins - reqCoins
    };`;

text = text.replace(from2, to2);
fs.writeFileSync("src/hooks/use-player.ts", text);
