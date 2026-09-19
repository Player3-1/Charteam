const fs = require("fs");
let text = fs.readFileSync("src/components/battle-screen.tsx", "utf8");

text = text.replace("  isPlayer1, \n  mode = \"standard\",", "  isPlayer1, \n  isSpectator, \n  mode = \"standard\",");

fs.writeFileSync("src/components/battle-screen.tsx", text);
