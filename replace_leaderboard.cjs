const fs = require('fs');
let code = fs.readFileSync('src/components/leaderboard.tsx', 'utf8');

const t = {
  "Toplam Trophies:": "Total Trophies:",
  "Galibiyet / Mağlubiyet:": "Wins / Losses:",
  "Kazanma Oranı:": "Win Rate:",
  "İlk 100 oyuncu yüklenirken hata oluştu:": "Error loading top 100 players:",
  "Küresel İlk 100": "Global Top 100",
  "Oyuncu ara...": "Search player...",
  "Liderler Loading...": "Loading Leaderboard...",
  "Siz": "You",
  "Oyuncu": "Player",
  " G / ": " W / ",
  " M<": " L<",
  "} G<": "} W<",
  "Eşleşen oyuncu bulunamadı.": "No matching player found.",
  "Aktif Deck": "Active Deck"
};

for (const [tr, en] of Object.entries(t)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/leaderboard.tsx', code);
