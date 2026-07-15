const fs = require('fs');
let code = fs.readFileSync('src/components/home-tab.tsx', 'utf8');

const translations = {
  "Elmas Battleçı": "Diamond Fighter",
  "ilk3": "top3",
  "Sandıklar": "Chests",
  "Kupa Kazandı": "Trophies Earned",
  "Toplam Kupa:": "Total Trophies:",
  "Sandık Açılımı!": "Chest Opening!",
  "Aç": "Open",
  "Yetersiz Gold": "Not Enough Gold",
  "Altın": "Gold",
  "Çıkış Yap": "Sign Out",
  "Oyna": "Play",
  "Savaşlar": "Battles",
  "Sezon Ödülü": "Season Reward",
  "Yetenek:": "Ability:",
  "Yakın": "Melee",
  "Uzak": "Ranged",
  "Hava": "Air",
  "Yeni Kart!": "New Card!",
  "Satın Al": "Buy",
  "Ücretsiz": "Free",
  "Ödül:": "Reward:",
  "Ödüller": "Rewards",
  "Günlük": "Daily",
  "Haftalık": "Weekly",
  "Görevler": "Quests",
  "Liderler": "Leaderboard"
};

for (const [tr, en] of Object.entries(translations)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/home-tab.tsx', code);
