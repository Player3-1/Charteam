const fs = require("fs");
let text = fs.readFileSync("src/components/battle-screen.tsx", "utf8");

const handleAdd = `  const handleUseCharm = (charmId: string) => {
    if (usedCharms.includes(charmId)) return;
    if (charmId === "totem" || charmId === "gonullu-idam" || charmId === "hayalet") {
      setTargetingCharm(charmId === targetingCharm ? null : charmId);
      return;
    }
    setUsedCharms(prev => [...prev, charmId]);
    const s = stateRef.current;
    if (charmId === "kuvvet") s.charmKuvvetTimeLeft = 3.5;
    else if (charmId === "hiz") s.charmHizTimeLeft = 4.0;
    else if (charmId === "kan-banyosu") s.charmKanBanyosuTimeLeft = 7.0;
    else if (charmId === "saglik") {
      s.units.forEach(u => {
        if (u.side === "player" && u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + (u.maxHp * 0.5));
      });
    }
  };

  const handleReadyUp = async () => {`;

text = text.replace("  const handleReadyUp = async () => {", handleAdd);

fs.writeFileSync("src/components/battle-screen.tsx", text);
