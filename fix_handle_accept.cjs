const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const handleAcceptDuelStr = `  const handleAcceptDuel = async (duel: any) => {
    try {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const battleId = \`duel_\${duel.challenger}_\${user.username}_\${rand}\`;
      
      const oppRef = await getDoc(doc(db, "users", duel.challenger));
      const oppData = oppRef.exists() ? oppRef.data() : {};
      const p1Avatar = oppData?.avatar || getAvatarForName(duel.challenger);
      const p2Avatar = state.avatar || getAvatarForName(user.username);
      
      await setDoc(doc(db, "battles", battleId), {
        id: battleId,
        mode: "standard",
        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: oppData?.trophies ?? 1000,
           rankedStars: oppData?.rankedStars ?? 0,
           deck: oppData?.deck || ["mizrakli", "okcu", "dev", "kilicli"],
           wins: oppData?.wins ?? 0,
        },
        player2: { 
           username: user.username, 
           avatar: p2Avatar, 
           trophies: state.trophies,
           rankedStars: state.rankedStars ?? 0,
           deck: state.deck,
           wins: state.wins ?? 0,
        },
        player1Placements: [],
        player2Placements: [],
        player1Abilities: [],
        player2Abilities: [],
        status: "placing",
        createdAt: serverTimestamp(),
      });
      
      await acceptDuel(duel.id, battleId);
      
      setOpponent({
          name: duel.challenger,
          avatar: p1Avatar,
          trophies: oppData?.trophies ?? 1000,
          rankedStars: oppData?.rankedStars ?? 0,
          wins: oppData?.wins ?? 0,
          battleId,
          isPlayer1: false,
          mode: "standard"
      });
      setInBattle(true);
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  useEffect(() => {
    const accepted = outgoingDuels.find(d => d.status === "accepted" && d.battleId);
    if (accepted && !inBattle) {
       (async () => {
         const oppRef = await getDoc(doc(db, "users", accepted.challenged));
         const oppData = oppRef.exists() ? oppRef.data() : {};
         setOpponent({
            name: accepted.challenged,
            avatar: oppData?.avatar || getAvatarForName(accepted.challenged),
            trophies: oppData?.trophies ?? 1000,
            rankedStars: oppData?.rankedStars ?? 0,
            wins: oppData?.wins ?? 0,
            battleId: accepted.battleId,
            isPlayer1: true,
            mode: "standard"
         });
         setInBattle(true);
         cancelDuel(accepted.id); // clear it
       })();
    }
    
    const declined = outgoingDuels.find(d => d.status === "declined");
    if (declined) {
        alert(\`\${declined.challenged} davetini reddetti.\`);
        cancelDuel(declined.id);
    }
  }, [outgoingDuels, inBattle]);`;

const from = `  const { incomingDuels, outgoingDuels, sendDuelRequest, acceptDuel, declineDuel, cancelDuel } = useDuels(user.username);`;
const to = `  const { incomingDuels, outgoingDuels, sendDuelRequest, acceptDuel, declineDuel, cancelDuel } = useDuels(user.username);\n\n` + handleAcceptDuelStr;

text = text.replace(from, to);
fs.writeFileSync("src/components/home-tab.tsx", text);
