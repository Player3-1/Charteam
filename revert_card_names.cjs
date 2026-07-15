const fs = require('fs');
let code = fs.readFileSync('src/lib/cards.ts', 'utf8');

const revertNames = {
  "Spearman": "Mızraklı",
  "Swordsman": "Kılıçlı",
  "Giant": "Dev",
  "Cavalry": "Atlı",
  "Archer": "Okçu",
  "Musketeer": "Tüfekçi",
  "Slinger": "Sapancı",
  "Cannoneer": "Topçu",
  "Dragon": "Ejder",
  "Bird Army": "Kuş Ordusu",
  "Ghost": "Hayalet",
  "Miner": "Madenci",
  "Doctor": "Doktor",
  "Beer Barrel": "Bira Varili",
  "Bomber Plane": "Bombalama Uçağı",
  "Armored": "Zırhlı",
  "Ice Slinger": "Buz Sapanı",
  "Snowman": "Kardan Adam",
  "Frog": "Kurbağa",
  "Giant Fly": "Dev Sinek",
  "Shark": "Köpek Balığı",
  "Fish": "Balık",
  "Coral": "Mercan",
  "Lava Hound": "Lav Köpeği",
  "Volcano": "Volkan",
  "Inferno Dragon": "Cehennem Ejderi",
  "Tribe": "Kabile",
  "Elephant": "Fil",
  "Avalanche": "Çığ",
  "Samurai": "Samuray"
};

for (const [en, tr] of Object.entries(revertNames)) {
  code = code.replace(new RegExp(`name: "${en}"`, 'g'), `name: "${tr}"`);
}

fs.writeFileSync('src/lib/cards.ts', code);
