const fs = require('fs');

const translations = {
  "Soğuk buz krallığı": "Cold ice kingdom",
  "Tehlikeli yeşil bataklık": "Dangerous green swamp",
  "Lavların fışkırdığı cehennem": "Hell erupting with lava",
  "Antik ruhların uyandığı tapınak": "Temple where ancient spirits awaken",
  "Pembe yaprakların döküldüğü bahçe": "Garden with falling pink petals",
  "Yıldızları topla, efsanevi rütbelere ulaş!": "Collect stars, reach legendary ranks!",
  'includes\\("Gümüş"\\)': 'includes("Silver")',
  "Rütbe Gelişimi": "Rank Progression",
  "Deck Sınırı Aşıldı \\(Max 20\\)": "Deck Limit Exceeded (Max 20)",
  " Taş": " Stone",
  "Battleı kaybedersen: <b>−10 ile −20⭐</b> düşersin.": "If you lose the battle: you drop <b>-10 to -20⭐</b>.",
  "Her kümede gereken ⭐'yı toplayıp efsanevi rütbelere ulaş!": "Collect required ⭐ in each division and reach legendary ranks!",
  "Openmak için sandığa dokun! 👇": "Tap the chest to open! 👇",
  "AÇMAYA BAŞLA! ⚔️": "START OPENING! ⚔️",
  " KART AÇILDI": " CARD OPENED",
  "Sandığa Tıkla! 👆": "Tap the Chest! 👆",
  "Özet İçin Tıkla! 👆": "Tap for Summary! 👆",
  "Zaten Openılmış!": "Already Unlocked!",
  "Gold Dönüşümü:": "Gold Conversion:",
  "HP Gelişimi:": "HP Progression:"
};

function replaceInFile(file) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [tr, en] of Object.entries(translations)) {
      content = content.replace(new RegExp(tr, 'g'), en);
    }
    fs.writeFileSync(file, content);
  }
}

replaceInFile('src/components/home-tab.tsx');

