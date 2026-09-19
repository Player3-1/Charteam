const fs = require("fs");
let text = fs.readFileSync("src/components/battle-screen.tsx", "utf8");

const from = `  const [phase, setPhase] = useState<Phase>("placing");`;
const to = `  const [phase, setPhase] = useState<Phase>("placing");
  const [usedCharms, setUsedCharms] = useState<string[]>([]);
  const [targetingCharm, setTargetingCharm] = useState<string | null>(null);`;
text = text.replace(from, to);

fs.writeFileSync("src/components/battle-screen.tsx", text);
