const fs = require("fs");
let text = fs.readFileSync("src/components/battle-screen.tsx", "utf8");

text = text.replace("  isPlayer1?: boolean;", "  isPlayer1?: boolean;\n  isSpectator?: boolean;");
text = text.replace("  isPlayer1,\n  mode = \"standard\",", "  isPlayer1,\n  isSpectator,\n  mode = \"standard\",");

const disableClicksFrom = `const placeAt = (col: number, row: number) => {`;
const disableClicksTo = `const placeAt = (col: number, row: number) => {
    if (isSpectator) return;`;
text = text.replace(disableClicksFrom, disableClicksTo);

text = text.replace("const handleReadyUp = async () => {", "const handleReadyUp = async () => {\n    if (isSpectator) return;");
text = text.replace("const handleUseCharm = (charmId: string) => {", "const handleUseCharm = (charmId: string) => {\n    if (isSpectator) return;");

fs.writeFileSync("src/components/battle-screen.tsx", text);
