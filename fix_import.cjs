const fs = require("fs");
let text = fs.readFileSync("src/components/battle-screen.tsx", "utf8");

text = text.replace("import { CARDS }\nimport { CHARMS } from \"@/lib/charms\"; from \"@/lib/cards\";", "import { CARDS } from \"@/lib/cards\";\nimport { CHARMS } from \"@/lib/charms\";");
fs.writeFileSync("src/components/battle-screen.tsx", text);
