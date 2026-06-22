import type { Rarity } from "./cards";

export interface Arena {
  id: number;
  name: string;
  min: number;
  max: number;
  biome: "grass" | "desert" | "snow" | "legendary";
  /** cards that unlock in this arena */
  unlocks: string[];
  /** css gradient background */
  bg: string;
  ground: string;
}

export const ARENAS: Arena[] = [
  {
    id: 1,
    name: "Bahçe",
    min: 0,
    max: 120,
    biome: "grass",
    unlocks: ["mizrakli", "kilicli", "dev", "okcu", "atli", "tufekci", "sapanci", "topcu"],
    bg: "linear-gradient(180deg, #6ec24a 0%, #4a9b32 100%)",
    ground: "#5cb13b",
  },
  {
    id: 2,
    name: "Çöl",
    min: 120,
    max: 250,
    biome: "desert",
    unlocks: ["ejder", "kus-ordusu", "zirhli"],
    bg: "linear-gradient(180deg, #e6c373 0%, #c79a3f 100%)",
    ground: "#d7af55",
  },
  {
    id: 3,
    name: "Karlar",
    min: 250,
    max: 400,
    biome: "snow",
    unlocks: [],
    bg: "linear-gradient(180deg, #e8f1f7 0%, #b9d0e0 100%)",
    ground: "#dde9f2",
  },
  {
    id: 4,
    name: "Efsanevi Arena",
    min: 400,
    max: 750,
    biome: "legendary",
    unlocks: ["hayalet", "madenci", "doktor", "bira-varili", "bombalama-ucagi"],
    bg: "linear-gradient(180deg, #6a5e55 0%, #3d342e 100%)",
    ground: "#544840",
  },
  {
    id: 5,
    name: "Buz Krallığı",
    min: 750,
    max: 1000,
    biome: "snow",
    unlocks: ["buz-dolabi", "kardan-adam"],
    bg: "linear-gradient(180deg, #1e90ff 0%, #00008b 100%)",
    ground: "#70a1ff",
  },
  {
    id: 6,
    name: "Bataklık",
    min: 1000,
    max: 1500,
    biome: "grass",
    unlocks: ["kurbaga", "dev-sinek"],
    bg: "linear-gradient(180deg, #5c6239 0%, #484c2f 100%)",
    ground: "#353823",
  }
];

export const MAX_TROPHIES = 1500;

export function arenaForTrophies(trophies: number): Arena {
  const t = Math.max(0, Math.min(MAX_TROPHIES, trophies));
  return ARENAS.find((a) => t >= a.min && t < a.max) ?? ARENAS[ARENAS.length - 1];
}

export function getArenaForCard(cardId: string): Arena | undefined {
  return ARENAS.find(a => a.unlocks.includes(cardId));
}

export function getUnlockedCardsUpToTrophies(trophies: number): string[] {
  const arena = arenaForTrophies(trophies);
  const unlocked: string[] = [];
  for (const a of ARENAS) {
    unlocked.push(...a.unlocks);
    if (a.id === arena.id) break;
  }
  return unlocked;
}

export function makeOpponentTrophies(playerTrophies: number): number {
  const arena = ARENAS.find((a) => playerTrophies >= a.min && playerTrophies < a.max) ?? ARENAS[ARENAS.length - 1];
  
  // Drift randomly inside the same arena range (+- up to half the arena span, but clamped to arena bounds)
  const span = arena.max - arena.min;
  const drift = (Math.random() - 0.5) * (span * 0.4); 
  let botTrophies = Math.floor(playerTrophies + drift);

  if (botTrophies < arena.min) botTrophies = arena.min;
  if (botTrophies > arena.max - 1) botTrophies = arena.max - 1;

  return botTrophies;
}
