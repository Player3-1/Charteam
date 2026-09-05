export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface CardDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  hp: number;
  dmg: number | string;
  cd: number;
  range: "yakın" | "uzak" | "hava";
  description: string;
  ability?: string;
  stoneCost: number;
}

export const CARDS: CardDef[] = [
  { id: "mizrakli", name: "Mızraklı", emoji: "🔱", rarity: "common", hp: 160, dmg: 70, cd: 1.4, range: "uzak", description: "Orta menzilli, 70 hasar veren mızraklı bir savaşçı.", stoneCost: 5 },
  { id: "kilicli", name: "Kılıçlı Savaşçı", emoji: "⚔️", rarity: "common", hp: 225, dmg: 45, cd: 1.5, range: "yakın", description: "Yavaş ama sert vuran kılıçlı dövüşçü.", stoneCost: 3 },
  { id: "dev", name: "Dev", emoji: "🗿", rarity: "common", hp: 500, dmg: 30, cd: 1.8, range: "yakın", description: "Yüksek cana sahip ön saf tankı.", stoneCost: 5 },
  { id: "atli", name: "Süvari", emoji: "🐎", rarity: "rare", hp: 175, dmg: "50 / 120", cd: 1.4, range: "yakın", description: "Hızlı hücumda 120, yavaşken 50 hasar vurur.", stoneCost: 4 },
  { id: "okcu", name: "Okçu", emoji: "🏹", rarity: "common", hp: 65, dmg: 25, cd: 1.3, range: "uzak", description: "Uzun menzilden ok fırlatır.", stoneCost: 3 },
  { id: "tufekci", name: "Tüfekçi", emoji: "🔫", rarity: "rare", hp: 105, dmg: 50, cd: 1.6, range: "uzak", description: "Sert vuran fakat yavaş tetik çeken nişancı.", stoneCost: 4 },
  { id: "sapanci", name: "Sapancı", emoji: "🪨", rarity: "rare", hp: 70, dmg: 40, cd: 2.5, range: "uzak", description: "Çok uzak mesafeden alan hasarı fırlatır.", stoneCost: 4 },
  { id: "topcu", name: "Topçu", emoji: "💣", rarity: "rare", hp: 90, dmg: 75, cd: 2.5, range: "uzak", description: "Geniş bir alana yıkıcı top mermisi yağdırır.", stoneCost: 4 },
  { id: "ejder", name: "Ejderha", emoji: "🐉", rarity: "epic", hp: 110, dmg: 45, cd: 1.6, range: "hava", description: "Alev nefesiyle havadan alan hasarı verir.", stoneCost: 4 },
  { id: "kus-ordusu", name: "Kuş Ordusu", emoji: "🐦", rarity: "epic", hp: 20, dmg: 20, cd: 1.5, range: "hava", description: "Yakalanamayan 5 hızlı kuş birimi.", stoneCost: 5 },
  { id: "hayalet", name: "Hayalet", emoji: "👻", rarity: "legendary", hp: 100, dmg: 45, cd: 1.4, range: "yakın", description: "Yalnızca bir rakip 2 blok yakınındayken veya saldırırken görünür. Uçar. Yetenek: 5 saniye görünmezlik, hasar bağışıklığı ve 2 kat hasar.", ability: "5 saniye görünmezlik, hasar bağışıklığı ve 2 kat hasar", stoneCost: 4 },
  { id: "madenci", name: "Madenci", emoji: "⛏️", rarity: "epic", hp: 200, dmg: 40, cd: 1.0, range: "yakın", description: "Direkt koyulduğu anda ortaya çıkan Epik madenci birimi.", ability: "", stoneCost: 3 },
  { id: "doktor", name: "Doktor", emoji: "⚕️", rarity: "legendary", hp: 250, dmg: 30, cd: 1.4, range: "yakın", description: "Dost birimleri +250 Can iyileştirir (Maks 3 kullanım, bedava).", ability: "5x5 alanda +250 can (Bedava, maks 3 kullanım)", stoneCost: 3 },
  { id: "bira-varili", name: "Bira Varili", emoji: "🍺", rarity: "legendary", hp: 1, dmg: 0, cd: 0, range: "yakın", description: "Dost hasarını 1.75 katına çıkarır. 30 saniye sürer.", ability: "10 saniye boyunca 2.5 kat hasar", stoneCost: 4 },
  { id: "bombalama-ucagi", name: "Bombardıman Uçağı", emoji: "✈️", rarity: "legendary", hp: 100, dmg: 80, cd: 1.8, range: "hava", description: "Her 1.8 saniyede bir 4x4 alana 80 hasar bırakır.", ability: "6x6 alana 50 hasar veren süper bomba", stoneCost: 4 },
  { id: "zirhli", name: "Zırhlı Savaşçı", emoji: "🛡️", rarity: "epic", hp: 300, dmg: 40, cd: 1.5, range: "yakın", description: "8 saniyelik savunma duruşuyla alınan hasarın %25'ini engeller.", ability: "8 saniye savunma duruşu", stoneCost: 4 },
  { id: "buz-dolabi", name: "Buz Sapancısı", emoji: "🧊", rarity: "rare", hp: 85, dmg: 25, cd: 2.0, range: "uzak", description: "Alan hasarı verir ve düşmanları yavaşlatıp dondurur.", stoneCost: 3 },
  { id: "kardan-adam", name: "Kardan Adam", emoji: "⛄", rarity: "epic", hp: 100, dmg: 25, cd: 1.25, range: "uzak", description: "Attığı kar topuyla düşmanı 1.2 saniye dondurur.", stoneCost: 2 },
  { id: "kurbaga", name: "Kurbağa", emoji: "🐸", rarity: "legendary", hp: 90, dmg: 30, cd: 1.5, range: "uzak", description: "Diliyle saldırarak rakibi zehirler.", ability: "En yakın kartı yutar, 2 saniye sonra patlar.", stoneCost: 3 },
  { id: "dev-sinek", name: "Dev Sinek", emoji: "🪰", rarity: "common", hp: 600, dmg: 20, cd: 2.0, range: "hava", description: "Havada süzülen devasa can havuzuna sahip tank.", stoneCost: 6 },
  { id: "kopek-baligi", name: "Köpek Balığı", emoji: "🦈", rarity: "rare", hp: 200, dmg: 60, cd: 1.3, range: "yakın", description: "Çok hızlı yakın dövüş birimi.", stoneCost: 4 },
  { id: "balik", name: "Dev Balık", emoji: "🐟", rarity: "epic", hp: 600, dmg: 40, cd: 2.0, range: "yakın", description: "Her rakip kart elendiğinde kendi canını 50 HP yeniler.", stoneCost: 7 },
  { id: "mercan", name: "Mercan", emoji: "🪸", rarity: "epic", hp: 50, dmg: 0, cd: 2.0, range: "yakın", description: "Her 2 saniyede bir tüm ekibi 50 Can iyileştirir.", ability: "Tüm ekibe 75 Can verir.", stoneCost: 4 },
  { id: "lav-kopegi", name: "Lav Köpeği", emoji: "🐕", rarity: "legendary", hp: 400, dmg: 45, cd: 1.1, range: "yakın", description: "Isırığı yakar (7 saniye boyunca saniyede 5 hasar). Saldırıda 3x3 alana alev üfler.", ability: "3 saniye boyunca 3x3 alana saniyede 20 hasar verir.", stoneCost: 5 },
  { id: "volkan", name: "Volkan", emoji: "🌋", rarity: "common", hp: 80, dmg: 35, cd: 2.5, range: "uzak", description: "Yerden lav fırlatır, hedefi 4 saniye boyunca saniyede 5 hasarla yakar.", stoneCost: 4 },
  { id: "cehennem-ejderi", name: "Cehennem Ejderhası", emoji: "🐲", rarity: "rare", hp: 100, dmg: 30, cd: 1.3, range: "hava", description: "Havadan alev püskürterek hedefleri 4 saniye boyunca saniyede 5 hasarla yakar.", stoneCost: 5 },
  { id: "kabile", name: "Kabile", emoji: "👺", rarity: "common", hp: 150, dmg: 50, cd: 1.0, range: "yakın", description: "Arena 9'da açılan, 150 can ve 50 hasarlı kabile birimleri (Alan hasarından 6 vuruşta ölür).", stoneCost: 5 },
  { id: "golem", name: "Fil", emoji: "🦣", rarity: "rare", hp: 800, dmg: 30, cd: 2.0, range: "yakın", description: "Çok dayanıklı, 800 cana sahip devasa tank birimi.", stoneCost: 8 },
  { id: "cig", name: "Çığ", emoji: "🏔️", rarity: "epic", hp: 0, dmg: 60, cd: 5.0, range: "uzak", description: "Hedef alandaki birimlere 60 hasar veren kış felaketi.", ability: "60 hasar verir", stoneCost: 2 },
  { id: "samuray", name: "Samuray", emoji: "🥷", rarity: "legendary", hp: 200, dmg: 35, cd: 1.4, range: "yakın", description: "Hem yakın menzilde kılıçla hem uzak menzilde shuriken ile 35 hasar verir.", ability: "Yakın ve uzak saldırı", stoneCost: 4 },
  { id: "buz-ejderi", name: "Buz Ejderi", emoji: "❄️", rarity: "epic", hp: 96, dmg: 35, cd: 1.5, range: "hava", description: "Saldırıları düşmanı yavaşlatır.", ability: "Vuruşunda yavaşlatma etkisi", stoneCost: 3 },
  { id: "uc-basli-ejder", name: "Üç Başlı Ejder", emoji: "🦎", rarity: "rare", hp: 333, dmg: 148, cd: 1.6, range: "hava", description: "Üç ayrı başıyla hasarlar (%20 azaltılmış) ve dondurma/yakma efektleri uygular.", ability: "Normal, donduran ve yakıcı saldırılar (-20% hasar)", stoneCost: 7 },
  { id: "vampir", name: "Vampir", emoji: "🧛", rarity: "legendary", hp: 320, dmg: 30, cd: 1.5, range: "uzak", description: "Vurduğu hasar başına tüm kartların canı 30 dolar. Yetenek: 4 saniye görünmez olur.", ability: "4 saniye görünmezlik", stoneCost: 4 },
  { id: "zombi", name: "Mezarlık", emoji: "🪦", rarity: "common", hp: 100, dmg: 0, cd: 4.0, range: "yakın", description: "Olduğu yerde kalarak her 4 saniyede bir 150 can / 30 hasarlı zombi spawnlar.", ability: "4 saniyede bir zombi spawnlar", stoneCost: 4 },
  { id: "buyucu", name: "Büyücü", emoji: "🧙", rarity: "epic", hp: 105, dmg: "33 / 66", cd: 1.5, range: "uzak", description: "Saldırılarında 33-66 rastgele hasar verir ve rastgele yanma/yavaşlatma uygular. Hasar aldığında tek seferlik 3 saniye görünmez olur.", ability: "Normal (%33), yanma (%33), yavaşlatma (%33) efektleri ve rastgele 33-66 hasar", stoneCost: 4 },
  { id: "lanet", name: "Lanet", emoji: "🖤", rarity: "epic", hp: 1, dmg: 0, cd: 1.0, range: "uzak", description: "Yetenek: Bedava. Tek kullanımlıktır, kullanınca yok olur. Tüm rakipleri 3 saniyeliğine dondurur.", ability: "Tüm rakipleri 3 saniyeliğine dondurur (Bedava)", stoneCost: 3 }
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Sıradan",
  rare: "Ender",
  epic: "Destansı",
  legendary: "Efsanevi",
};

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

export interface Chest {
  id: string;
  name: string;
  cost: number;
  cards: number;
  guaranteedMin: Rarity;
  emoji: string;
  allowedRarities: Rarity[];
}

export const CHESTS: Chest[] = [
  { id: "wood", name: "Sıradan Sandık", cost: 500, cards: 1, guaranteedMin: "common", emoji: "📦", allowedRarities: ["common"] },
  { id: "silver", name: "Ender Sandık", cost: 2000, cards: 2, guaranteedMin: "rare", emoji: "🎁", allowedRarities: ["common", "rare"] },
  { id: "gold", name: "Destansı Sandık", cost: 5000, cards: 3, guaranteedMin: "epic", emoji: "🏆", allowedRarities: ["common", "rare", "epic"] },
  { id: "magic", name: "Efsanevi Sandık", cost: 12000, cards: 4, guaranteedMin: "legendary", emoji: "✨", allowedRarities: ["rare", "epic", "legendary"] },
];

/** Roll a rarity restricted to the given pool (arena unlocks). */
export function rollRarity(pool: Rarity[], min?: Rarity): Rarity {
  const order: Rarity[] = ["common", "rare", "epic", "legendary"];
  const startIdx = min ? order.indexOf(min) : 0;
  const allowed = pool.filter((r) => order.indexOf(r) >= startIdx);
  const final = allowed.length ? allowed : pool;

  // Let's implement the specific %5 legendary pull chance requested by the user:
  if (final.includes("legendary")) {
    if (min === "legendary") {
      return "legendary";
    }
    // 5% chance of rolling legendary
    if (Math.random() < 0.05) {
      return "legendary";
    }
  }

  // Filter out legendary from regular roll calculations to respect the custom 5% rate limit
  const basePool = final.filter((r) => r !== "legendary");
  const finalPool = basePool.length > 0 ? basePool : final;

  const total = finalPool.reduce((s, r) => s + RARITY_WEIGHT[r], 0);
  let n = Math.random() * total;
  for (const r of finalPool) {
    n -= RARITY_WEIGHT[r];
    if (n <= 0) return r;
  }
  return finalPool[0];
}

export function rollCardFromUnlocked(unlockedIds: string[], minRarity?: Rarity, allowedRarities?: Rarity[]): CardDef {
  let pool = CARDS.filter(c => unlockedIds.includes(c.id));
  const order: Rarity[] = ["common", "rare", "epic", "legendary"];
  
  if (allowedRarities) {
      pool = pool.filter(c => allowedRarities.includes(c.rarity));
  }
  
  const startIdx = minRarity ? order.indexOf(minRarity) : 0;
  
  const minRestricted = pool.filter(c => order.indexOf(c.rarity) >= startIdx);
  if (minRestricted.length > 0) {
    pool = minRestricted;
  }
  
  const availableRarities = Array.from(new Set(pool.map(c => c.rarity)));
  const targetRarity = rollRarity(availableRarities, minRarity);
  
  const rarityPool = pool.filter(c => c.rarity === targetRarity);
  const fallbackPool = rarityPool.length > 0 ? rarityPool : pool;
  
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
}

export function pickCardByRarity(rarity: Rarity): CardDef {
  const pool = CARDS.filter((c) => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Numeric dmg helper (handles "25 / 75" → 50 average). */
export function dmgValue(d: number | string): number {
  if (typeof d === "number") return d;
  const parts = String(d).split("/").map((p) => parseFloat(p.trim()));
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
