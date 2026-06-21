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
}

export const CARDS: CardDef[] = [
  { id: "mizrakli", name: "Mızraklı", emoji: "🔱", rarity: "common", hp: 140, dmg: 35, cd: 0.7, range: "yakın", description: "Hızlı yakın menzil birliği." },
  { id: "kilicli", name: "Kılıçlı", emoji: "⚔️", rarity: "common", hp: 135, dmg: 40, cd: 1.0, range: "yakın", description: "Yavaş ama sert vuruşlu kılıç ustası." },
  { id: "dev", name: "Dev", emoji: "🗿", rarity: "common", hp: 350, dmg: 30, cd: 2.6, range: "yakın", description: "Tankı yüksek, ön cephe birliği." },
  { id: "atli", name: "Atlı", emoji: "🐎", rarity: "rare", hp: 135, dmg: "25 / 75", cd: 1.2, range: "yakın", description: "Hızla çarparsa 75 hasar, yavaşken 25." },
  { id: "okcu", name: "Okçu", emoji: "🏹", rarity: "common", hp: 65, dmg: 12, cd: 0.5, range: "uzak", description: "Uzak menzilden hızlı oklar atar." },
  { id: "tufekci", name: "Tüfekçi", emoji: "🔫", rarity: "rare", hp: 57, dmg: 45, cd: 2.4, range: "uzak", description: "Sert ateşli, yavaş tetik." },
  { id: "sapanci", name: "Sapancı", emoji: "🪨", rarity: "rare", hp: 70, dmg: 30, cd: 2.0, range: "uzak", description: "Aşırı uzun menzilden çarpan alan hasarı atar." },
  { id: "topcu", name: "Topçu", emoji: "💣", rarity: "rare", hp: 60, dmg: 60, cd: 5.0, range: "uzak", description: "Yıkıcı geniş alan hasarlı top ateşi." },
  { id: "ejder", name: "Ejder", emoji: "🐉", rarity: "epic", hp: 110, dmg: 45, cd: 1.4, range: "hava", description: "Havadan alev nefesi ile alan hasarı verir." },
  { id: "kus-ordusu", name: "Kuş Ordusu", emoji: "🐦", rarity: "epic", hp: 20, dmg: 10, cd: 1.0, range: "hava", description: "5 hızlı kuş, gözden kaçırma." },
  { id: "hayalet", name: "Hayalet", emoji: "👻", rarity: "legendary", hp: 110, dmg: 40, cd: 1.2, range: "yakın", description: "Sadece 3x3 alanda görünür. Özellik: 2.5sn görünmez ve hasarsız olur.", ability: "2.5 sn görünmezlik ve hasarsızlık" },
  { id: "madenci", name: "Madenci", emoji: "⛏️", rarity: "legendary", hp: 140, dmg: 25, cd: 0.9, range: "yakın", description: "İstenen yere kazıp çıkar.", ability: "Konum seç ve çık" },
  { id: "doktor", name: "Doktor", emoji: "⚕️", rarity: "legendary", hp: 25, dmg: 0, cd: 0, range: "yakın", description: "Müttefiklere +40 can. Hasar alınca kaçar.", ability: "3x3 iyileştirme" },
  { id: "bira-varili", name: "Bira Varili", emoji: "🍺", rarity: "legendary", hp: 1, dmg: 0, cd: 0, range: "yakın", description: "Müttefik hasarı 1.3x. 30sn dayanır.", ability: "10sn 1.7x hasar" },
  { id: "bombalama-ucagi", name: "Bombalama Uçağı", emoji: "✈️", rarity: "legendary", hp: 80, dmg: 30, cd: 3.6, range: "hava", description: "3.6sn'de bir 4x4 alana 30 hasar.", ability: "6x6 alana 50 hasar süper bomba" },
  { id: "zirhli", name: "Zırhlı", emoji: "🛡️", rarity: "epic", hp: 300, dmg: 40, cd: 1.5, range: "yakın", description: "Tank. 8sn savunma duruşu hasarın %40'ını emer.", ability: "8sn savunma" },
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
}

export const CHESTS: Chest[] = [
  { id: "wood", name: "Basit Sandık", cost: 500, cards: 1, guaranteedMin: "common", emoji: "📦" },
  { id: "silver", name: "Nadir Sandık", cost: 2000, cards: 2, guaranteedMin: "rare", emoji: "🎁" },
  { id: "gold", name: "Epik Sandık", cost: 5000, cards: 3, guaranteedMin: "epic", emoji: "🏆" },
  { id: "magic", name: "Efsanevi Sandık", cost: 12000, cards: 4, guaranteedMin: "legendary", emoji: "✨" },
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
