const fs = require("fs");
let cardsCode = fs.readFileSync("src/lib/cards.ts", "utf-8");

cardsCode = cardsCode.replace(
  /\{ id: "madenci",[\s\S]*?\}/,
  `{ id: "madenci", name: "Madenci", emoji: "⛏️", rarity: "epic", hp: 200, dmg: 40, cd: 1.0, range: "yakın", description: "Direkt koyulduğu anda ortaya çıkan Epik madenci birimi.", ability: "", stoneCost: 3 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "doktor",[\s\S]*?\}/,
  `{ id: "doktor", name: "Doktor", emoji: "⚕️", rarity: "legendary", hp: 250, dmg: 30, cd: 1.4, range: "yakın", description: "Dost birimleri +250 Can iyileştirir (Maks 3 kullanım, bedava).", ability: "5x5 alan iyileştirmesi (Maks 3 kullanım)", stoneCost: 0 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "kus-ordusu",[\s\S]*?\}/,
  `{ id: "kus-ordusu", name: "Kuş Ordusu", emoji: "🐦", rarity: "epic", hp: 20, dmg: 20, cd: 1.5, range: "hava", description: "Yakalanamayan 5 hızlı kuş birimi.", stoneCost: 5 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "mercan",[\s\S]*?\}/,
  `{ id: "mercan", name: "Mercan", emoji: "🪸", rarity: "epic", hp: 50, dmg: 0, cd: 2.0, range: "yakın", description: "Her 2 saniyede bir tüm ekibi 50 Can iyileştirir.", ability: "Tüm ekibe 75 Can verir.", stoneCost: 4 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "lav-kopegi",[\s\S]*?\}/,
  `{ id: "lav-kopegi", name: "Lav Köpeği", emoji: "🐕", rarity: "legendary", hp: 400, dmg: 45, cd: 1.1, range: "yakın", description: "Isırığı yakar (7 saniye boyunca saniyede 5 hasar). Saldırıda 3x3 alana alev üfler.", ability: "3 saniye boyunca 3x3 alana saniyede 20 hasar verir.", stoneCost: 5 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "kurbaga",[\s\S]*?\}/,
  `{ id: "kurbaga", name: "Kurbağa", emoji: "🐸", rarity: "legendary", hp: 90, dmg: 30, cd: 1.5, range: "uzak", description: "Diliyle saldırarak rakibi zehirler.", ability: "En yakın kartı yutar, 2 saniye sonra patlar.", stoneCost: 3 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "kabile",[\s\S]*?\}/,
  `{ id: "kabile", name: "Kabile", emoji: "👺", rarity: "common", hp: 150, dmg: 50, cd: 1.0, range: "yakın", description: "Arena 9'da açılan, 150 can ve 50 hasarlı kabile birimleri (Sağlı sollu dizilim).", stoneCost: 7 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "samuray",[\s\S]*?\}/,
  `{ id: "samuray", name: "Samuray", emoji: "🥷", rarity: "legendary", hp: 200, dmg: 35, cd: 1.4, range: "yakın", description: "Hem yakın menzilde kılıçla hem uzak menzilde shuriken ile 35 hasar verir.", ability: "Yakın ve uzak saldırı", stoneCost: 4 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "uc-basli-ejder",[\s\S]*?\}/,
  `{ id: "uc-basli-ejder", name: "Üç Başlı Ejder", emoji: "🦎", rarity: "rare", hp: 333, dmg: 185, cd: 1.6, range: "hava", description: "Üç ayrı başıyla hasarlar (%20 azaltılmış) ve dondurma/yakma efektleri uygular.", ability: "Normal, donduran ve yakıcı saldırılar (-20% hasar)", stoneCost: 7 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "vampir",[\s\S]*?\}/,
  `{ id: "vampir", name: "Vampir", emoji: "🧛", rarity: "legendary", hp: 320, dmg: 30, cd: 1.5, range: "uzak", description: "Vurduğu hasar başına tüm kartların canı 30 dolar. Yetenek: 4 saniye görünmez olur.", ability: "4 saniye görünmezlik", stoneCost: 4 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "zombi",[\s\S]*?\}/,
  `{ id: "zombi", name: "Mezarlık", emoji: "🪦", rarity: "common", hp: 100, dmg: 0, cd: 4.0, range: "yakın", description: "Olduğu yerde kalarak her 4 saniyede bir 300 can / 30 hasarlı zombi spawnlar.", ability: "4 saniyede bir zombi spawnlar", stoneCost: 4 }`
);

cardsCode = cardsCode.replace(
  /\{ id: "lanet",[\s\S]*?\}/,
  `{ id: "lanet", name: "Lanet", emoji: "🖤", rarity: "epic", hp: 1, dmg: 0, cd: 1.0, range: "uzak", description: "Yetenek: Bedava. Tek kullanımlıktır, kullanınca yok olur. Tüm rakipleri 3 saniyeliğine dondurur.", ability: "Tüm rakipleri 3 saniyeliğine dondurur (Bedava)", stoneCost: 3 }`
);

fs.writeFileSync("src/lib/cards.ts", cardsCode);
console.log("cards.ts updated successfully!");
