const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

text = text.replace(`      setOpponent({
          name: duel.challenger,
          avatar: p1Avatar,
          trophies: 1000,
          rankedStars: 0,
          battleId,
          isPlayer1: false,
          mode: "standard"
      });`, `      setOpponent({
          name: duel.challenger,
          avatar: p1Avatar,
          trophies: oppData.trophies ?? 1000,
          rankedStars: oppData.rankedStars ?? 0,
          wins: oppData.wins ?? 0,
          battleId,
          isPlayer1: false,
          mode: "standard"
      });`);
fs.writeFileSync("src/components/home-tab.tsx", text);
