const fs = require('fs');

const translations = {
  "Trophy İlerlemesi": "Trophy Progress",
  "Trophy Modu": "Trophy Mode",
  "Trophy mode": "Trophy Mode",
  "Emojiler": "Emojis",
  "Emojies": "Emojis",
  "TEBRİKLER! 🎉": "CONGRATULATIONS! 🎉",
  "YENİ!": "NEW!",
  "PROFİL": "PROFILE",
  "\\(SİZ\\)": "(YOU)"
};

const cards = {
  "name: \"Kılıçlı\"": "name: \"Swordsman\"",
  "name: \"Okçu\"": "name: \"Archer\"",
  "name: \"Tüfekçi\"": "name: \"Musketeer\"",
  "name: \"Topçu\"": "name: \"Cannoneer\"",
  "name: \"Kuş Ordusu\"": "name: \"Bird Army\"",
  "name: \"Bombalama Uçağı\"": "name: \"Bomber Plane\"",
  "name: \"Kurbağa\"": "name: \"Frog\"",
  "name: \"Köpek Balığı\"": "name: \"Shark\"",
  "name: \"Lav Köpeği\"": "name: \"Lava Hound\"",
  "name: \"Çığ\"": "name: \"Avalanche\"",
  "name: \"Mızraklı\"": "name: \"Spearman\"",
  "name: \"Dev\"": "name: \"Giant\"",
  "name: \"Atlı\"": "name: \"Cavalry\"",
  "name: \"Sapancı\"": "name: \"Slinger\"",
  "name: \"Ejder\"": "name: \"Dragon\"",
  "name: \"Hayalet\"": "name: \"Ghost\"",
  "name: \"Madenci\"": "name: \"Miner\"",
  "name: \"Doktor\"": "name: \"Doctor\"",
  "name: \"Bira Varili\"": "name: \"Beer Barrel\"",
  "name: \"Zırhlı\"": "name: \"Armored\"",
  "name: \"Buz Sapanı\"": "name: \"Ice Slinger\"",
  "name: \"Kardan Adam\"": "name: \"Snowman\"",
  "name: \"Dev Sinek\"": "name: \"Giant Fly\"",
  "name: \"Balık\"": "name: \"Fish\"",
  "name: \"Mercan\"": "name: \"Coral\"",
  "name: \"Volkan\"": "name: \"Volcano\"",
  "name: \"Cehennem Ejderi\"": "name: \"Inferno Dragon\"",
  "name: \"Kabile\"": "name: \"Tribe\"",
  "name: \"Fil\"": "name: \"Elephant\"",
  "name: \"Samuray\"": "name: \"Samurai\""
};

function replaceInFile(file, dict) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [tr, en] of Object.entries(dict)) {
      content = content.replace(new RegExp(tr, 'g'), en);
    }
    fs.writeFileSync(file, content);
  }
}

replaceInFile('src/components/home-tab.tsx', translations);
replaceInFile('src/components/leaderboard.tsx', translations);
replaceInFile('src/lib/cards.ts', cards);

