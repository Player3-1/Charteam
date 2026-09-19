const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

// I need to move `const [inBattle, setInBattle] = useState(false);` 
// up to right after `const [isSpectator, setIsSpectator] = useState(false);`

const from = `  const [inBattle, setInBattle] = useState(false);`;
const to = ``;
text = text.replace(from, to);

const from2 = `  const [isSpectator, setIsSpectator] = useState(false);`;
const to2 = `  const [isSpectator, setIsSpectator] = useState(false);\n  const [inBattle, setInBattle] = useState(false);`;
text = text.replace(from2, to2);

fs.writeFileSync("src/components/home-tab.tsx", text);
