const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const from = `  const { incomingDuels, outgoingDuels, sendDuelRequest, acceptDuel, declineDuel, cancelDuel } = useDuels(user.username);`;
const to = `  const { incomingDuels, outgoingDuels, sendDuelRequest, acceptDuel, declineDuel, cancelDuel } = useDuels(user.username);
  const [isSpectator, setIsSpectator] = useState(false);

  const handleSpectate = async (targetUsername: string) => {
    try {
      const q1 = query(collection(db, "battles"), where("player1.username", "==", targetUsername), where("status", "in", ["placing", "fighting"]));
      const s1 = await getDocs(q1);
      if (!s1.empty) {
        const d = s1.docs[0].data();
        setIsSpectator(true);
        setOpponent({
           name: d.player2.username,
           avatar: d.player2.avatar,
           trophies: d.player2.trophies,
           rankedStars: d.player2.rankedStars,
           wins: d.player2.wins,
           battleId: d.id,
           isPlayer1: true, // We spectate from p1 perspective
           mode: d.mode
        });
        setInBattle(true);
        return;
      }
      
      const q2 = query(collection(db, "battles"), where("player2.username", "==", targetUsername), where("status", "in", ["placing", "fighting"]));
      const s2 = await getDocs(q2);
      if (!s2.empty) {
        const d = s2.docs[0].data();
        setIsSpectator(true);
        setOpponent({
           name: d.player1.username,
           avatar: d.player1.avatar,
           trophies: d.player1.trophies,
           rankedStars: d.player1.rankedStars,
           wins: d.player1.wins,
           battleId: d.id,
           isPlayer1: false, // We spectate from p2 perspective
           mode: d.mode
        });
        setInBattle(true);
        return;
      }
      
      alert("Oyuncu şu anda savaşta değil.");
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };
`;

text = text.replace(from, to);

// Add imports
text = text.replace(`import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";`, `import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";`);

// Pass handleSpectate
text = text.replace(`onSpectate={(target) => alert("İzleme sistemi henüz aktif değil.")}`, `onSpectate={handleSpectate}`);

// Add to BattleScreen props
const battleScreenFrom = `<BattleScreen
          deck={state.deck}
          playerCardLevels={state.cardLevels || {}}`;
const battleScreenTo = `<BattleScreen
          isSpectator={isSpectator}
          deck={state.deck}
          playerCardLevels={state.cardLevels || {}}`;
text = text.replace(battleScreenFrom, battleScreenTo);

// Reset isSpectator
const onExitFrom = `          onExit={() => {
            setInBattle(false);`;
const onExitTo = `          onExit={() => {
            setIsSpectator(false);
            setInBattle(false);`;
text = text.replace(onExitFrom, onExitTo);

fs.writeFileSync("src/components/home-tab.tsx", text);
