const fs = require('fs');

const translations = {
  "Kabile Battleçısı": "Tribe Fighter",
  "Taş Maliyeti": "Stone Cost",
  "SEÇİLİ": "SELECTED",
  "Rakip hazır! Battle başlıyor...": "Opponent ready! Battle starting...",
  "Rakip yerleştiriyor... ⏳": "Opponent is placing... ⏳",
  "Bot yerleştiriyor...": "Bot is placing...",
  "Kart seç ve kendi alanına dokun": "Select card and tap your area",
  "AKTİF ÖZEL YETENEKLER \\(TIKLA\\)": "ACTIVE SPECIAL ABILITIES (CLICK)",
  "💎 Taş:": "💎 Stone:",
  "Gereken Taş:": "Required Stone:",
  "ZAFER! 🏆": "VICTORY! 🏆",
  "MAĞLUBİYET 💀": "DEFEAT 💀",
  "\\+1 Galibiyet": "+1 Win",
  "1 Mağlubiyet Aldın": "1 Defeat",
  "Liderlik tablosu verileri yüklenirken hata oluştu:": "Error loading leaderboard data:",
  "Dünya Top 3": "World Top 3",
  "Devamını Gör \\(İlk 100\\)": "See More (Top 100)",
  "KÜRESEL İLK 3! 🎉": "GLOBAL TOP 3! 🎉",
  "MÜCADELEYE DEVAM! ⚔️": "KEEP FIGHTING! ⚔️",
  "Mağaza": "Shop",
  "Doldurmak için alttaki karakterlerden birine bas!": "Tap a character below to equip!",
  "Battleçıyı çıkartmak için üstüne dokun.": "Tap on a fighter to unequip.",
  "Seçili Emojiler": "Selected Emojis",
  "Emojiyi değiştirmek için aşağıdaki koleksiyondan seç!": "Select from the collection below to change emoji!",
  "Battleta kullanacağın 4 emojiyi seç.": "Select 4 emojis to use in battle.",
  "Hiç emojin yok! Chests menüsünden satın alabilirsin.": "You have no emojis! Buy them from the Chests menu.",
  "Zorlu çöl fırtınası": "Harsh desert storm",
  "Büyük şampiyonlar geçidi": "Parade of grand champions",
  "Rakip hazır! 👍": "Opponent ready! 👍",
  "can iyileştirme": "hp healing",
  "yaptığı vuruş 2x hasar vurur": "strike deals 2x damage"
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

replaceInFile('src/lib/battle.ts');
replaceInFile('src/components/game-card.tsx');
replaceInFile('src/components/battle-screen.tsx');
replaceInFile('src/components/leaderboard.tsx');
replaceInFile('src/components/home-tab.tsx');

