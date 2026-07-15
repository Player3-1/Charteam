const fs = require('fs');

const files = ['src/components/home-tab.tsx', 'src/components/game-card.tsx'];

const translations = {
  "Arena \\$\\{lockedAtArena\\}'de açılır": "Unlocks at Arena ${lockedAtArena}",
  "Aşamalı Mod sadece <b>3500 Trophyda \\(Efsanevi Arena\\)</b> açılır. Championlar ligine girmek için \\{3500 - trophies\\} kupa daha kazan!": "Ranked Mode unlocks at <b>3500 Trophies (Legendary Arena)</b>. Win {3500 - trophies} more trophies to enter the Champions League!",
  "Aktif Lig Derecesi · Arena": "Active League Rank · Arena",
  "Sonraki arena:": "Next arena:",
  "Sandık İçeriği: \\{rewards.length\\} Adet Karakter Kartı": "Chest Content: {rewards.length} Character Cards",
  "Sandıktan çıkan ödüller başarıyla hesabına yüklendi. Koleksiyonunda bulunan karakterler otomatik olarak altına dönüştürüldü!": "Rewards from chest successfully added to your account. Duplicate characters were automatically converted to Gold!",
  "yakın": "melee",
  "uzak": "ranged",
  "hava": "air"
};

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    for (const [tr, en] of Object.entries(translations)) {
      code = code.replace(new RegExp(tr, 'g'), en);
    }
    fs.writeFileSync(file, code);
  }
}

