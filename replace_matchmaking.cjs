const fs = require('fs');
let code = fs.readFileSync('src/components/matchmaking-modal.tsx', 'utf8');

const t = {
  "Turnuva için rakip aranıyor... \\(Rakip bulunamazsa botla oynayabilirsiniz\\)": "Searching for tournament opponent... (You can play with a bot if no opponent is found)",
  "Aşamalı Mod için rakip aranıyor... \\(Gerçek rakip bulunamazsa botla oynayabilirsiniz\\)": "Searching for ranked opponent... (You can play with a bot if no opponent is found)",
  "Rakip aranıyor... \\(Gerçek rakip bulunamazsa botla oynayabilirsiniz\\)": "Searching for opponent... (You can play with a bot if no opponent is found)",
  "Turnuva için rakip aranıyor...": "Searching for tournament opponent...",
  "Aşamalı Mod için rakip aranıyor...": "Searching for ranked opponent...",
  "Çevrimiçi rakip aranıyor...": "Searching for online opponent...",
  "Rakip bulundu, savaşa bağlanılıyor...": "Opponent found, connecting to battle...",
  "Bot ile Battle": "Battle with Bot"
};

for (const [tr, en] of Object.entries(t)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/matchmaking-modal.tsx', code);
