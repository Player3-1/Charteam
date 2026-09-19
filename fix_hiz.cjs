const fs = require("fs");
let text = fs.readFileSync("src/lib/battle.ts", "utf8");

text = text.replace("let speedFactor = speed(u.card);\\n      if (u.side === \"player\" && state.charmHizTimeLeft !== undefined && state.charmHizTimeLeft > 0) speedFactor *= 2;", "let speedFactor = speed(u.card);\n      if (u.side === \"player\" && state.charmHizTimeLeft !== undefined && state.charmHizTimeLeft > 0) speedFactor *= 2;");
fs.writeFileSync("src/lib/battle.ts", text);
