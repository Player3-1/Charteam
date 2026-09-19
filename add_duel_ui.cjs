const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const from = `return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden relative">`;

const to = `
  const handleAcceptDuel = async (duel) => {
    try {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const battleId = \`duel_\${duel.challenger}_\${user.username}_\${rand}\`;
      
      const p1Avatar = getAvatarForName(duel.challenger);
      const p2Avatar = state.avatar || getAvatarForName(user.username);
      
      await setDoc(doc(db, "battles", battleId), {
        id: battleId,
        mode: "standard",
        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: 1000, 
           deck: ["mizrakli", "okcu", "dev", "kilicli"]
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
          trophies: 1000,
          rankedStars: 0,
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
    // Check if an outgoing duel was accepted
    const accepted = outgoingDuels.find(d => d.status === "accepted" && d.battleId);
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
    }
    
    const declined = outgoingDuels.find(d => d.status === "declined");
    if (declined) {
        alert(\`\${declined.challenged} davetini reddetti.\`);
        cancelDuel(declined.id);
    }
  }, [outgoingDuels, inBattle]);

return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      {/* Duel Invites UI */}
      {incomingDuels.length > 0 && !inBattle && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4">
          {incomingDuels.map(duel => (
            <div key={duel.id} className="bg-indigo-950/90 border border-indigo-500/50 rounded-xl p-4 shadow-2xl mb-2 backdrop-blur-md">
              <div className="text-center mb-3">
                <span className="font-bold text-white text-lg">{duel.challenger}</span>
                <span className="text-slate-300 ml-1">seni 1v1 Düelloya davet ediyor!</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => declineDuel(duel.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold">Reddet</button>
                <button onClick={() => handleAcceptDuel(duel)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20">Kabul Et</button>
              </div>
            </div>
          ))}
        </div>
      )}
`;

text = text.replace(from, to);
fs.writeFileSync("src/components/home-tab.tsx", text);
