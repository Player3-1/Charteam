const fs = require('fs');
const path = require('path');

const translations = {
  "Mevcut Kupaların": "Current Trophies",
  "Sonraki Arena'ya": "To Next Arena",
  "Kaldı": "Left",
  "Son Sınıra Ulaştın!": "Max Limit Reached!",
  "Arenalar Yolu": "Arena Path",
  "Mevcut Arenan": "Current Arena",
  "Açık": "Unlocked",
  "Kilitli": "Locked",
  "Açılan Kartlar": "Unlocked Cards",
  "Bu arenada yeni kart bulunmuyor.": "No new cards in this arena.",
  "EFSO": "LEG",
  "DESTAN": "EPIC",
  "ENDER": "RARE",
  "SIRA": "COM",
  "AŞAMALI": "RANKED",
  "EĞLENCE": "CASUAL",
  "Kart Koleksiyonu": "Card Collection",
  "Mağaza / Sandıklar": "Shop / Chests",
  "Satın Al": "Buy",
  "SAVAŞA GİR! ⚔️": "ENTER BATTLE! ⚔️",
  "AŞAMALI SAVAŞA GİR! ⚔️": "ENTER RANKED BATTLE! ⚔️",
  "Deste Sınırı Aşıldı (Max 20)": "Deck Limit Exceeded (Max 20)",
  "Önce desteni kur": "Build your deck first",
  "Hoş geldin,": "Welcome,",
  "Tüm Arenaları Gör": "View All Arenas",
  "Kupa:": "Trophies:",
  "Altın:": "Gold:",
  "Hasar:": "Damage:",
  "Can:": "HP:",
  "Bekleme:": "Cooldown:",
  "Menzil:": "Range:",
  "Maliyet:": "Cost:",
  "Kullan": "Use",
  "Destede": "In Deck",
  "Özellik:": "Ability:",
  "Savaşçılar": "Fighters",
  "Aktif Savaş Desten": "Active Battle Deck",
  "En Popüler Desteler": "Most Popular Decks",
  "Oyun Metası": "Game Meta",
  "En Çok Kullanılan Kartlar": "Most Used Cards",
  "Deste": "Deck",
  "Liderlik Tablosu": "Leaderboard",
  "Kupa": "Trophy",
  "Profil detayı bulunamadı.": "Profile details not found.",
  "Aktif Deste": "Active Deck",
  "Kupalar": "Trophies",
  "Kapat": "Close",
  "Oyun aratılıyor": "Searching for game",
  "Sıra Aranıyor": "Searching for match",
  "Aşamalı Maç": "Ranked Match",
  "Eğlence Maçı": "Casual Match",
  "Eşleşme Bulundu!": "Match Found!",
  "Karşınızda": "Versus",
  "Rakip Bekleniyor": "Waiting for Opponent",
  "Savaş Alanına Geçiliyor": "Moving to Battlefield",
  "Hemen Savaş": "Battle Now",
  "İptal": "Cancel",
  "Yükleniyor": "Loading",
  "Hazır": "Ready",
  "Hasar": "Damage",
  "Tebrikler, Kazandın!": "Congratulations, You Won!",
  "Maalesef Kaybettin...": "Sorry, You Lost...",
  "Berabere!": "Draw!",
  "Kazanan": "Winner",
  "Toplam Hasar:": "Total Damage:",
  "Düşman Devrildi:": "Enemies Defeated:",
  "Elde Edilen Altın:": "Gold Earned:",
  "Kupa Kazanımı:": "Trophies Gained:",
  "Altın Kazancı:": "Gold Earned:",
  "Kupa Kaybı:": "Trophies Lost:",
  "Kazanım / Kayıp Yok": "No Gain / Loss",
  "Ödülleri Topla": "Collect Rewards",
  "Ana Menüye Dön": "Return to Main Menu",
  "Rakip Bekleniyor...": "Waiting for Opponent...",
  "Bağlantı Bekleniyor...": "Waiting for Connection...",
  "Savaş Başlıyor!": "Battle Starting!",
  "Süreyi Uzat!": "Extend Time!",
  "Taş bitti!": "Out of stones!",
  "Savaş!": "Battle!",
  "Taş Maaliyeti": "Stone Cost",
  "İlk 3": "Top 3",
  "Arenalar": "Arenas",
  "Meta": "Meta",
  "Sandıklar": "Chests",
  "Kartlar": "Cards",
  "Savaş": "Battle"
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [tr, en] of Object.entries(translations)) {
        // Need to be careful with short strings like "Kupa"
        const regex = new RegExp(`\\b${tr}\\b|${tr}`, 'g');
        const newContent = content.replace(regex, en);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory('src');
