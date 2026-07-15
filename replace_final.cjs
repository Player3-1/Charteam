const fs = require('fs');
let code = fs.readFileSync('src/components/home-tab.tsx', 'utf8');

const t = {
  "Maksimum 20 taş sınırını aşamazsın! Bu kartı eklersen desten \\$\\{nextCost\\} taş olacaktır.": "You can't exceed the 20 stone limit! Adding this card will make your deck cost ${nextCost} stones.",
  "Bol çimenli savaş alanı": "Battlefield with lots of grass",
  "Çöl kumları ve sıcak güneş": "Desert sands and hot sun",
  "Karlarla kaplı soğuk diyar": "Cold land covered in snow",
  "Efsanevi dövüşlerin merkezi": "Center of legendary fights",
  "Buzul krallığın kalbi": "Heart of the ice kingdom",
  "Zehirli bataklıklar ve sis": "Toxic swamps and fog",
  "Okyanusun derinlikleri": "Depths of the ocean",
  "Ateş ve lav dolu diyarlar": "Lands full of fire and lava",
  "Eski tapınak kalıntıları": "Ancient temple ruins",
  "Yüksek tepeler ve fırtınalar": "High peaks and storms",
  "Kiraz çiçekleri altında savaş": "Battle under cherry blossoms",
  "Battle kaybedilirse: <b>−4 ile −7🏆</b> kupa düşer.": "If battle is lost: <b>-4 to -7🏆</b> trophies dropped.",
  "YENİ SAVAŞÇI AÇILDI!": "NEW FIGHTER UNLOCKED!",
  "Şampiyon liglerine giden yol": "Path to champion leagues"
};

for (const [tr, en] of Object.entries(t)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/home-tab.tsx', code);
