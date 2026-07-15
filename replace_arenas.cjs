const fs = require('fs');
let code = fs.readFileSync('src/lib/arenas.ts', 'utf8');

const arenaNames = {
  "Bahçe": "Garden",
  "Çöl": "Desert",
  "Karlar": "Snow",
  "Efsanevi Arena": "Legendary Arena",
  "Buz Krallığı": "Ice Kingdom",
  "Bataklık": "Swamp",
  "Deniz": "Sea",
  "Cehennem": "Hell",
  "Tapınak": "Temple",
  "Dağ": "Mountain",
  "Sakura": "Sakura"
};

for (const [tr, en] of Object.entries(arenaNames)) {
  code = code.replace(new RegExp(`name: "${tr}"`, 'g'), `name: "${en}"`);
}

const rankNames = {
  "Bronz": "Bronze",
  "Gümüş": "Silver",
  "Altın": "Gold"
};

for (const [tr, en] of Object.entries(rankNames)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/lib/arenas.ts', code);
