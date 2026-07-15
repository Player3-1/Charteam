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
  { id: "mizrakli", name: "Spearman", emoji: "🔱", rarity: "common", hp: 160, dmg: 80, cd: 0.7, range: "yakın", description: "Fast melee unit.", stoneCost: 3 },
  { id: "kilicli", name: "Swordsman", emoji: "⚔️", rarity: "common", hp: 225, dmg: 45, cd: 1.5, range: "yakın", description: "Slow but hard-hitting swordsman.", stoneCost: 3 },
  { id: "dev", name: "Giant", emoji: "🗿", rarity: "common", hp: 500, dmg: 30, cd: 1.8, range: "yakın", description: "High health, front line tank.", stoneCost: 6 },
  { id: "atli", name: "Cavalry", emoji: "🐎", rarity: "rare", hp: 175, dmg: "25 / 75", cd: 1.2, range: "yakın", description: "Deals 75 damage on fast charge, 25 when slow.", stoneCost: 4 },
  { id: "okcu", name: "Archer", emoji: "🏹", rarity: "common", hp: 65, dmg: 25, cd: 0.5, range: "uzak", description: "Shoots fast arrows from long range.", stoneCost: 3 },
  { id: "tufekci", name: "Musketeer", emoji: "🔫", rarity: "rare", hp: 105, dmg: 50, cd: 1.3, range: "uzak", description: "Hard hitting, slow trigger.", stoneCost: 4 },
  { id: "sapanci", name: "Slinger", emoji: "🪨", rarity: "rare", hp: 70, dmg: 40, cd: 2.5, range: "uzak", description: "Deals splash damage from extremely long range.", stoneCost: 4 },
  { id: "topcu", name: "Cannoneer", emoji: "💣", rarity: "rare", hp: 90, dmg: 75, cd: 2.5, range: "uzak", description: "Devastating large area damage cannon fire.", stoneCost: 5 },
  { id: "ejder", name: "Dragon", emoji: "🐉", rarity: "epic", hp: 110, dmg: 35, cd: 1.4, range: "hava", description: "Deals area damage from air with fire breath.", stoneCost: 5 },
  { id: "kus-ordusu", name: "Bird Army", emoji: "🐦", rarity: "epic", hp: 20, dmg: 4.5, cd: 1.0, range: "hava", description: "5 fast birds, hard to catch.", stoneCost: 5 },
  { id: "hayalet", name: "Ghost", emoji: "👻", rarity: "legendary", hp: 150, dmg: 45, cd: 1.0, range: "yakın", description: "Only visible in a 3x3 area. Flies. Ability: 5s invisibility, immune to damage and deals 2x damage.", ability: "5s invisibility, damage immunity and 2x damage", stoneCost: 4 },
  { id: "madenci", name: "Miner", emoji: "⛏️", rarity: "legendary", hp: 120, dmg: 30, cd: 0.9, range: "yakın", description: "Digs to the desired location and emerges.", ability: "Choose location and emerge", stoneCost: 3 },
  { id: "doktor", name: "Doctor", emoji: "⚕️", rarity: "legendary", hp: 90, dmg: 0, cd: 0, range: "yakın", description: "Heals allies for +90 HP, follows allies with low HP.", ability: "5x5 heal with 5s CD", stoneCost: 3 },
  { id: "bira-varili", name: "Beer Barrel", emoji: "🍺", rarity: "legendary", hp: 1, dmg: 0, cd: 0, range: "yakın", description: "Ally damage 2.0x. Lasts 30s.", ability: "10s 3.0x damage", stoneCost: 4 },
  { id: "bombalama-ucagi", name: "Bomber Plane", emoji: "✈️", rarity: "legendary", hp: 80, dmg: 45, cd: 3.6, range: "hava", description: "Deals 30 damage to 4x4 area every 3.6s.", ability: "50 damage super bomb to 6x6 area", stoneCost: 6 },
  { id: "zirhli", name: "Armored", emoji: "🛡️", rarity: "epic", hp: 300, dmg: 40, cd: 1.5, range: "yakın", description: "Tank. 8s defensive stance absorbs 25% of damage.", ability: "8s defense", stoneCost: 5 },
  { id: "buz-dolabi", name: "Ice Slinger", emoji: "🧊", rarity: "rare", hp: 85, dmg: 25, cd: 2.0, range: "uzak", description: "Deals area damage and freezes enemies.", stoneCost: 3 },
  { id: "kardan-adam", name: "Snowman", emoji: "⛄", rarity: "epic", hp: 100, dmg: 25, cd: 1.25, range: "uzak", description: "Snowball freezes enemy for 1.2s.", stoneCost: 2 },
  { id: "kurbaga", name: "Frog", emoji: "🐸", rarity: "legendary", hp: 90, dmg: 25, cd: 2.0, range: "uzak", description: "Shoots tongue, poisons for 10s (3 damage per second).", ability: "Swallows nearest card, explodes after 2s.", stoneCost: 3 },
  { id: "dev-sinek", name: "Giant Fly", emoji: "🪰", rarity: "common", hp: 400, dmg: 20, cd: 2.0, range: "hava", description: "Airborne tank.", stoneCost: 6 },
  { id: "kopek-baligi", name: "Shark", emoji: "🦈", rarity: "rare", hp: 200, dmg: 90, cd: 1.3, range: "yakın", description: "Fast close range unit.", stoneCost: 4 },
  { id: "balik", name: "Fish", emoji: "🐟", rarity: "epic", hp: 125, dmg: 30, cd: 2.0, range: "yakın", description: "Attacks and retreats constantly.", stoneCost: 1 },
  { id: "mercan", name: "Coral", emoji: "🪸", rarity: "epic", hp: 50, dmg: 0, cd: 3.0, range: "yakın", description: "Heals the whole team 1 HP per second.", ability: "Heals whole team 30 HP every 3s.", stoneCost: 3 },
  { id: "lav-kopegi", name: "Lava Hound", emoji: "🐕", rarity: "legendary", hp: 400, dmg: 30, cd: 1.5, range: "yakın", description: "Bite burns enemy (5 damage/sec for 7s). Offense: Breaths fire in 3x3 area.", ability: "Burns enemies in 3x3 area with 20 dmg/s for 3s.", stoneCost: 5 },
  { id: "volkan", name: "Volcano", emoji: "🌋", rarity: "common", hp: 80, dmg: 30, cd: 2.5, range: "uzak", description: "Shoots fireball from ground, burns target with 5 dmg/s for 4s.", stoneCost: 4 },
  { id: "cehennem-ejderi", name: "Inferno Dragon", emoji: "🐲", rarity: "rare", hp: 100, dmg: 30, cd: 1.3, range: "hava", description: "Breaths fire from air, burns targets with 5 dmg/s for 4s.", stoneCost: 5 },
  { id: "kabile", name: "Tribe", emoji: "👺", rarity: "common", hp: 25, dmg: 15, cd: 1.0, range: "yakın", description: "Unlocked in Arena 9, basic card with 25 hp and 15 damage. No ability.", stoneCost: 3 },
  { id: "golem", name: "Elephant", emoji: "🦣", rarity: "rare", hp: 1000, dmg: 40, cd: 2.0, range: "yakın", description: "Durable elephant. Rare tank with 1000 hp, 40 damage.", stoneCost: 8 },
  { id: "cig", name: "Avalanche", emoji: "🏔️", rarity: "epic", hp: 0, dmg: 100, cd: 5.0, range: "uzak", description: "Thrown to designated location, deals 100 damage to an area extending 5 blocks from drop point.", ability: "Deals 100 damage", stoneCost: 3 },
  { id: "samuray", name: "Samurai", emoji: "🥷", rarity: "legendary", hp: 200, dmg: 70, cd: 0.9, range: "yakın", description: "Legendary warrior unlocked in arena 11. Ability: his strike deals 2x damage.", ability: "Strike deals 2x damage (140 total)", stoneCost: 5 },
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
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
  { id: "wood", name: "Basic Chest", cost: 500, cards: 1, guaranteedMin: "common", emoji: "📦", allowedRarities: ["common"] },
  { id: "silver", name: "Rare Chest", cost: 2000, cards: 2, guaranteedMin: "rare", emoji: "🎁", allowedRarities: ["common", "rare"] },
  { id: "gold", name: "Epic Chest", cost: 5000, cards: 3, guaranteedMin: "epic", emoji: "🏆", allowedRarities: ["common", "rare", "epic"] },
  { id: "magic", name: "Legendary Chest", cost: 12000, cards: 4, guaranteedMin: "legendary", emoji: "✨", allowedRarities: ["rare", "epic", "legendary"] },
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
