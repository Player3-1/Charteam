const fs = require('fs');
let code = fs.readFileSync('src/components/battle-screen.tsx', 'utf8');

const strings = {
  "Readysınız! Rakip bekleniyor...": "You are ready! Waiting for opponent...",
  "Süre doldu, rakip bekleniyor...": "Time's up, waiting for opponent...",
  "Battle alanında aktif yetenekli canlı birliğiniz yok.": "No live unit with active ability on the battlefield.",
  "Deste bulunamadı, varsayılan deste kullanılıyor.": "Deck not found, using default deck."
};

for (const [tr, en] of Object.entries(strings)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/battle-screen.tsx', code);
