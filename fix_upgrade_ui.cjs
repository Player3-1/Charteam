const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

text = text.replace(/<span>YÜKSELT<\/span>(\s*<span[^>]*>🌟<\/span>)/g, "<span>YÜKSELT</span>$1<span className=\"ml-1 text-[8px] bg-black/30 px-1 rounded text-white\">🪙 {lvl === 1 ? 50 : lvl === 2 ? 150 : lvl === 3 ? 400 : 1000}</span>");

fs.writeFileSync("src/components/home-tab.tsx", text);
