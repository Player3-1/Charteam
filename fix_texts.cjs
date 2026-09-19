const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

text = text.replace("<li>• Savaşı kazanırsan: <b>1.000🪙 · +10⭐</b> kazanırsın.</li>", "<li>• Savaşı kazanırsan: <b>500🪙 · +30🏆</b> kazanırsın.</li>");
text = text.replace("<li>• Benzer kupaya sahip rakibi yen: <b>1.000🪙 · +10🏆</b></li>", "<li>• Normal maç kazanırsan: <b>500🪙 · +30🏆</b></li>");
text = text.replace("<li>• Daha yüksek kupaya sahip rakibi yen: <b>2.000🪙 · +15🏆</b></li>", "");
text = text.replace("<li>• Daha düşük kupaya sahip rakibi yen: <b>500🪙 · +7🏆</b></li>", "");

fs.writeFileSync("src/components/home-tab.tsx", text);
