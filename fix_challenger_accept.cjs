const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const from = `    const accepted = outgoingDuels.find(d => d.status === "accepted" && d.battleId);
    if (accepted && !inBattle) {
       setOpponent({
          name: accepted.challenged,
          avatar: getAvatarForName(accepted.challenged),
          trophies: 1000,
          rankedStars: 0,
          battleId: accepted.battleId,
          isPlayer1: true,
          mode: "standard"
       });
       setInBattle(true);
       cancelDuel(accepted.id); // clear it
    }`;

const to = `    const accepted = outgoingDuels.find(d => d.status === "accepted" && d.battleId);
    if (accepted && !inBattle) {
       (async () => {
         const oppRef = await getDoc(doc(db, "users", accepted.challenged));
         const oppData = oppRef.exists() ? oppRef.data() : {};
         setOpponent({
            name: accepted.challenged,
            avatar: oppData.avatar || getAvatarForName(accepted.challenged),
            trophies: oppData.trophies ?? 1000,
            rankedStars: oppData.rankedStars ?? 0,
            wins: oppData.wins ?? 0,
            battleId: accepted.battleId,
            isPlayer1: true,
            mode: "standard"
         });
         setInBattle(true);
         cancelDuel(accepted.id); // clear it
       })();
    }`;
text = text.replace(from, to);
fs.writeFileSync("src/components/home-tab.tsx", text);
