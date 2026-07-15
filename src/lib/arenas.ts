import type { Rarity } from "./cards";

export interface Arena {
  id: number;
  name: string;
  min: number;
  max: number;
  biome: "grass" | "desert" | "snow" | "legendary" | "sea" | "hell";
  /** cards that unlock in this arena */
  unlocks: string[];
  /** css gradient background */
  bg: string;
  ground: string;
}

export const ARENAS: Arena[] = [
  {
    id: 1,
    name: "Garden",
    min: 0,
    max: 120,
    biome: "grass",
    unlocks: ["mizrakli", "kilicli", "dev", "okcu", "atli", "tufekci", "sapanci", "topcu"],
    bg: "linear-gradient(180deg, #6ec24a 0%, #4a9b32 100%)",
    ground: "#5cb13b",
  },
  {
    id: 2,
    name: "Desert",
    min: 120,
    max: 250,
    biome: "desert",
    unlocks: ["ejder", "kus-ordusu", "zirhli"],
    bg: "linear-gradient(180deg, #e6c373 0%, #c79a3f 100%)",
    ground: "#d7af55",
  },
  {
    id: 3,
    name: "Snow",
    min: 250,
    max: 400,
    biome: "snow",
    unlocks: [],
    bg: "linear-gradient(180deg, #e8f1f7 0%, #b9d0e0 100%)",
    ground: "#dde9f2",
  },
  {
    id: 4,
    name: "Legendary Arena",
    min: 400,
    max: 750,
    biome: "legendary",
    unlocks: ["hayalet", "madenci", "doktor", "bira-varili", "bombalama-ucagi"],
    bg: "linear-gradient(180deg, #6a5e55 0%, #3d342e 100%)",
    ground: "#544840",
  },
  {
    id: 5,
    name: "Ice Kingdom",
    min: 750,
    max: 1000,
    biome: "snow",
    unlocks: ["buz-dolabi", "kardan-adam"],
    bg: "linear-gradient(180deg, #1e90ff 0%, #00008b 100%)",
    ground: "#70a1ff",
  },
  {
    id: 6,
    name: "Swamp",
    min: 1000,
    max: 1500,
    biome: "grass",
    unlocks: ["kurbaga", "dev-sinek"],
    bg: "linear-gradient(180deg, #5c6239 0%, #484c2f 100%)",
    ground: "#353823",
  },
  {
    id: 7,
    name: "Sea",
    min: 1500,
    max: 2000,
    biome: "sea",
    unlocks: ["kopek-baligi", "balik", "mercan"],
    bg: "linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)",
    ground: "#2563eb",
  },
  {
    id: 8,
    name: "Hell",
    min: 2000,
    max: 2500,
    biome: "hell",
    unlocks: ["lav-kopegi", "volkan", "cehennem-ejderi"],
    bg: "linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)",
    ground: "#b91c1c",
  },
  {
    id: 9,
    name: "Temple",
    min: 2500,
    max: 3000,
    biome: "legendary",
    unlocks: ["kabile", "golem"],
    bg: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
    ground: "#2d3748",
  },
  {
    id: 10,
    name: "Mountain",
    min: 3000,
    max: 3250,
    biome: "desert",
    unlocks: ["cig"],
    bg: "linear-gradient(180deg, #9ca3af 0%, #4b5563 100%)",
    ground: "#6b7280",
  },
  {
    id: 11,
    name: "Sakura",
    min: 3250,
    max: 3500,
    biome: "grass",
    unlocks: ["samuray"],
    bg: "linear-gradient(180deg, #fbcfe8 0%, #f472b6 100%)",
    ground: "#fce7f3",
  }
];

export const MAX_TROPHIES = 3500;

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

export interface RankInfo {
  name: string;
  emoji: string;
  style: string;
  min: number;
  next: number;
}

export function getRankForRankProgress(progressTrophies: number) {
  const p = Math.max(0, progressTrophies);
  const ranks: RankInfo[] = [
    { name: "Bronze 1", emoji: "🥉", style: "from-amber-700 to-amber-900 border-amber-600 text-amber-400 shadow-amber-900/40", min: 0, next: 100 },
    { name: "Bronze 2", emoji: "🥉", style: "from-amber-700 to-amber-900 border-amber-500 text-amber-200 shadow-amber-900/50", min: 100, next: 200 },
    { name: "Bronze 3", emoji: "🥉", style: "from-amber-700 to-amber-900 border-amber-400 text-amber-100 shadow-amber-900/60 font-semibold", min: 300, next: 300 },
    { name: "Silver 1", emoji: "🥈", style: "from-slate-400 to-slate-600 border-slate-350 text-slate-100 shadow-slate-700/40", min: 600, next: 350 },
    { name: "Silver 2", emoji: "🥈", style: "from-slate-400 to-slate-600 border-slate-300 text-slate-50 shadow-slate-700/50", min: 950, next: 400 },
    { name: "Silver 3", emoji: "🥈", style: "from-slate-400 to-slate-600 border-slate-200 text-white shadow-slate-700/60 font-semibold", min: 1350, next: 500 },
    { name: "Gold 1", emoji: "🥇", style: "from-amber-400 to-yellow-600 border-amber-300 text-yellow-105 shadow-yellow-600/40 font-semibold", min: 1850, next: 400 },
    { name: "Gold 2", emoji: "🥇", style: "from-amber-400 to-yellow-600 border-amber-200 text-yellow-50 shadow-yellow-600/50 font-bold", min: 2250, next: 400 },
    { name: "Gold 3", emoji: "🥇", style: "from-amber-400 to-yellow-600 border-amber-100 text-amber-100 shadow-yellow-600/60 font-extrabold", min: 2650, next: 500 },
    { name: "Gold 4", emoji: "👑", style: "from-purple-500 via-pink-500 to-red-500 border-pink-400 text-white shadow-pink-500/50 font-black animate-pulse", min: 3150, next: 999999 }
  ];

  let rank = ranks[0];
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (p >= ranks[i].min) {
      rank = ranks[i];
      break;
    }
  }

  const rankIdx = ranks.indexOf(rank);
  const nextRank = rankIdx < ranks.length - 1 ? ranks[rankIdx + 1] : null;
  const progress = nextRank 
    ? Math.min(100, ((p - rank.min) / rank.next) * 100)
    : 100;

  return {
    current: rank,
    next: nextRank,
    progress: Math.max(0, Math.min(100, progress)),
    currentProgressValue: p - rank.min,
    requiredForNext: rank.next,
  };
}

export function getRankForWins(wins: number) {
  return getRankForRankProgress(wins * 35);
}

export function getRankForTrophies(trophies: number) {
  return getRankForRankProgress(trophies);
}
