const fs = require('fs');
let code = fs.readFileSync('src/components/home-tab.tsx', 'utf8');

code = code.replace(
  '<span className="font-bold text-amber-300 capitalize">{activeCard.range}</span>',
  '<span className="font-bold text-amber-300 capitalize">{activeCard.range === "yakın" ? "Melee" : activeCard.range === "uzak" ? "Ranged" : "Air"}</span>'
);

code = code.replace("Melee kupalı rakibi yen", "Defeat opponent with similar trophies");
code = code.replace("Üst kupalı rakibi yen", "Defeat opponent with higher trophies");
code = code.replace("Düşük kupalı rakibi yen", "Defeat opponent with lower trophies");
code = code.replace("RANKED LİG DERECE SİSTEMİ", "RANKED LEAGUE SYSTEM");
code = code.replace("Aktif Lig Derecesi", "Active League Rank");

fs.writeFileSync('src/components/home-tab.tsx', code);
