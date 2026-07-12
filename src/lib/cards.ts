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
  { id: "mizrakli", name: "Mızraklı", emoji: "🔱", rarity: "common", hp: 160, dmg: 80, cd: 0.7, range: "yakın", description: "Hızlı yakın menzil birliği.", stoneCost: 3 },
  { id: "kilicli", name: "Kılıçlı", emoji: "⚔️", rarity: "common", hp: 225, dmg: 45, cd: 1.5, range: "yakın", description: "Yavaş ama sert vuruşlu kılıç ustası.", stoneCost: 3 },
  { id: "dev", name: "Dev", emoji: "🗿", rarity: "common", hp: 450, dmg: 30, cd: 1.8, range: "yakın", description: "Tankı yüksek, ön cephe birliği.", stoneCost: 6 },
  { id: "atli", name: "Atlı", emoji: "🐎", rarity: "rare", hp: 130, dmg: "25 / 75", cd: 1.2, range: "yakın", description: "Hızla çarparsa 75 hasar, yavaşken 25.", stoneCost: 4 },
  { id: "okcu", name: "Okçu", emoji: "🏹", rarity: "common", hp: 65, dmg: 20, cd: 0.5, range: "uzak", description: "Uzak menzilden hızlı oklar atar.", stoneCost: 3 },
  { id: "tufekci", name: "Tüfekçi", emoji: "🔫", rarity: "rare", hp: 105, dmg: 50, cd: 1.3, range: "uzak", description: "Sert ateşli, yavaş tetik.", stoneCost: 4 },
  { id: "sapanci", name: "Sapancı", emoji: "🪨", rarity: "rare", hp: 70, dmg: 30, cd: 3.0, range: "uzak", description: "Aşırı uzun menzilden çarpan alan hasarı atar.", stoneCost: 3 },
  { id: "topcu", name: "Topçu", emoji: "💣", rarity: "rare", hp: 90, dmg: 60, cd: 2.5, range: "uzak", description: "Yıkıcı geniş alan hasarlı top ateşi.", stoneCost: 5 },
  { id: "ejder", name: "Ejder", emoji: "🐉", rarity: "epic", hp: 110, dmg: 35, cd: 1.4, range: "hava", description: "Havadan alev nefesi ile alan hasarı verir.", stoneCost: 5 },
  { id: "kus-ordusu", name: "Kuş Ordusu", emoji: "🐦", rarity: "epic", hp: 20, dmg: 2.5, cd: 1.0, range: "hava", description: "5 hızlı kuş, gözden kaçırma.", stoneCost: 5 },
  { id: "hayalet", name: "Hayalet", emoji: "👻", rarity: "legendary", hp: 150, dmg: 45, cd: 1.0, range: "yakın", description: "Sadece 3x3 alanda görünür. Havadan uçar. Özellik: 5sn görünmez, hasarsız ve 2x hasar verir.", ability: "5 sn görünmezlik, hasarsızlık ve 2x hasar", stoneCost: 4 },
  { id: "madenci", name: "Madenci", emoji: "⛏️", rarity: "legendary", hp: 120, dmg: 30, cd: 0.9, range: "yakın", description: "İstenen yere kazıp çıkar.", ability: "Konum seç ve çık", stoneCost: 4 },
  { id: "doktor", name: "Doktor", emoji: "⚕️", rarity: "legendary", hp: 90, dmg: 0, cd: 0, range: "yakın", description: "Müttefiklere +90 can verir, canı azalan müttefikleri takip eder.", ability: "5 saniye CD ile 5x5 iyileştirme", stoneCost: 4 },
  { id: "bira-varili", name: "Bira Varili", emoji: "🍺", rarity: "legendary", hp: 1, dmg: 0, cd: 0, range: "yakın", description: "Müttefik hasarı 2.0x. 30sn dayanır.", ability: "10sn 3.0x hasar", stoneCost: 5 },
  { id: "bombalama-ucagi", name: "Bombalama Uçağı", emoji: "✈️", rarity: "legendary", hp: 80, dmg: 30, cd: 3.6, range: "hava", description: "3.6sn'de bir 4x4 alana 30 hasar.", ability: "6x6 alana 50 hasar süper bomba", stoneCost: 6 },
  { id: "zirhli", name: "Zırhlı", emoji: "🛡️", rarity: "epic", hp: 300, dmg: 40, cd: 1.5, range: "yakın", description: "Tank. 8sn savunma duruşu hasarın %25'ini emer.", ability: "8sn savunma", stoneCost: 6 },
  { id: "buz-dolabi", name: "Buz Sapanı", emoji: "🧊", rarity: "rare", hp: 85, dmg: 25, cd: 2.0, range: "uzak", description: "Buz sapanı ile alan hasarı verir ve rakipleri dondurur.", stoneCost: 3 },
  { id: "kardan-adam", name: "Kardan Adam", emoji: "⛄", rarity: "epic", hp: 100, dmg: 25, cd: 1.25, range: "uzak", description: "Kartopu rakibi 1.2sn dondurur.", stoneCost: 2 },
  { id: "kurbaga", name: "Kurbağa", emoji: "🐸", rarity: "legendary", hp: 90, dmg: 25, cd: 2.0, range: "uzak", description: "Dil atar, 10sn süren zehirler (saniyede 3 hasar).", ability: "En yakın kartı yutar, 2sn sonra patlar.", stoneCost: 3 },
  { id: "dev-sinek", name: "Dev Sinek", emoji: "🪰", rarity: "common", hp: 400, dmg: 20, cd: 2.0, range: "hava", description: "Havadan giden tank.", stoneCost: 6 },
  { id: "kopek-baligi", name: "Köpek Balığı", emoji: "🦈", rarity: "rare", hp: 200, dmg: 90, cd: 1.3, range: "yakın", description: "Hızlı yakın menzil birliği.", stoneCost: 4 },
  { id: "balik", name: "Balık", emoji: "🐟", rarity: "epic", hp: 125, dmg: 35, cd: 2.0, range: "yakın", description: "Saldırıp geri kaçar sürekli.", stoneCost: 2 },
  { id: "mercan", name: "Mercan", emoji: "🪸", rarity: "epic", hp: 50, dmg: 0, cd: 3.0, range: "yakın", description: "Tüm takıma saniyede bir can yükler.", ability: "Her 3 saniyede bir tüm takıma 30 can verir.", stoneCost: 3 },
  { id: "lav-kopegi", name: "Lav Köpeği", emoji: "🐕", rarity: "legendary", hp: 400, dmg: 30, cd: 1.5, range: "yakın", description: "Isırdığında düşmanı yakar (7sn boyunca her saniye 5 hasar). Offense: 3x3 alana alev püskürtür.", ability: "3x3 alandaki düşmanları 3sn boyunca saniyede 20 hasarla yakar.", stoneCost: 5 },
  { id: "volkan", name: "Volkan", emoji: "🌋", rarity: "common", hp: 80, dmg: 30, cd: 2.5, range: "uzak", description: "Yerden alev topu fırlatır, hedefi her saniye 5 hasarla 4sn yakar.", stoneCost: 4 },
  { id: "cehennem-ejderi", name: "Cehennem Ejderi", emoji: "🐲", rarity: "rare", hp: 100, dmg: 30, cd: 1.3, range: "hava", description: "Havadan ateş püskürterek hedefleri her saniye 5 hasarla 4sn yakar.", stoneCost: 5 },
  { id: "kabile", name: "Kabile", emoji: "👺", rarity: "common", hp: 25, dmg: 15, cd: 1.0, range: "yakın", description: "9. arenada açılan canı 25 hasarı 15 olan basit bir kart. Özellik yok.", stoneCost: 3 },
  { id: "golem", name: "Fil", emoji: "🦣", rarity: "rare", hp: 1000, dmg: 40, cd: 2.0, range: "yakın", description: "Dayanıklı bir fil. Canı 1000, hasarı 40 olan nadir bir tank.", stoneCost: 8 },
  { id: "cig", name: "Çığ", emoji: "🏔️", rarity: "epic", hp: 0, dmg: 100, cd: 5.0, range: "uzak", description: "Belirlenen yere maç başladıktan 5 saniye sonra düşer ve düştüğü yerin 5 blok ötesine kadar uzanan bir alana 100 hasar verir.", stoneCost: 2 },
  { id: "samuray", name: "Samuray", emoji: "🥷", rarity: "legendary", hp: 200, dmg: 70, cd: 0.9, range: "yakın", description: "11. arenada açılan efsanevi bir savaşçı. Özellik: yaptığı vuruş 2x hasar vurur.", ability: "Yaptığı vuruş 2x hasar vurur (yani 140 vurur)", stoneCost: 5 },
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Basit",
  rare: "Nadir",
  epic: "Epik",
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
  { id: "wood", name: "Basit Sandık", cost: 500, cards: 1, guaranteedMin: "common", emoji: "📦", allowedRarities: ["common"] },
  { id: "silver", name: "Nadir Sandık", cost: 2000, cards: 2, guaranteedMin: "rare", emoji: "🎁", allowedRarities: ["common", "rare"] },
  { id: "gold", name: "Epik Sandık", cost: 5000, cards: 3, guaranteedMin: "epic", emoji: "🏆", allowedRarities: ["common", "rare", "epic"] },
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
