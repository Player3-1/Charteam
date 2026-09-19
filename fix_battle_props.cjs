const fs = require("fs");
let text = fs.readFileSync("src/components/battle-screen.tsx", "utf8");

const from = `  playerEmojis?: [string, string, string, string];`;
const to = `  playerEmojis?: [string, string, string, string];
  selectedCharms?: string[];`;
text = text.replace(from, to);

text = text.replace("const [showConfirmCancel, setShowConfirmCancel] = useState(false);\n  const [usedCharms, setUsedCharms] = useState<string[]>([]);\n  const [targetingCharm, setTargetingCharm] = useState<string | null>(null);", "const [showConfirmCancel, setShowConfirmCancel] = useState(false);\n  const [usedCharms, setUsedCharms] = useState<string[]>([]);\n  const [targetingCharm, setTargetingCharm] = useState<string | null>(null);");
fs.writeFileSync("src/components/battle-screen.tsx", text);
