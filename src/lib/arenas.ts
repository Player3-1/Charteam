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
    name: "Kar Alanı",
    min: 250,
    max: 400,
    biome: "snow",
    unlocks: ["madenci"],
    bg: "linear-gradient(180deg, #e8f1f7 0%, #b9d0e0 100%)",
    ground: "#dde9f2",
  },
  {
    id: 4,
    name: "Efsanevi Arena",
    min: 400,
    max: 750,
    biome: "legendary",
    unlocks: ["hayalet", "doktor", "bira-varili", "bombalama-ucagi"],
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
  },
  {
    id: 7,
    name: "Deniz",
    min: 1500,
    max: 2000,
    biome: "sea",
    unlocks: ["kopek-baligi", "balik", "mercan"],
    bg: "linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)",
    ground: "#2563eb",
  },
  {
    id: 8,
    name: "Cehennem",
    min: 2000,
    max: 2500,
    biome: "hell",
    unlocks: ["lav-kopegi", "volkan", "cehennem-ejderi"],
    bg: "linear-gradient(180deg, #7f1d1d 0%, #450a0a 100%)",
    ground: "#b91c1c",
  },
  {
    id: 9,
    name: "Tapınak",
    min: 2500,
    max: 3000,
    biome: "legendary",
    unlocks: ["kabile", "golem"],
    bg: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
    ground: "#2d3748",
  },
  {
    id: 10,
    name: "Dağ",
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
  },
  {
    id: 12,
    name: "Ejder Vadisi",
    min: 3500,
    max: 4000,
    biome: "snow",
    unlocks: ["buz-ejderi", "uc-basli-ejder"],
    bg: "linear-gradient(180deg, #38bdf8 0%, #0369a1 100%)",
    ground: "#0284c7",
  },
  {
    id: 13,
    name: "Karanlık Şato",
    min: 4000,
    max: 4500,
    biome: "hell",
    unlocks: ["vampir", "zombi"],
    bg: "linear-gradient(180deg, #4b5563 0%, #111827 100%)",
    ground: "#1f2937",
  },
  {
    id: 14,
    name: "Sihirli Arena",
    min: 4500,
    max: 5000,
    biome: "legendary",
    unlocks: ["buyucu", "lanet"],
    bg: "linear-gradient(180deg, #8b5cf6 0%, #4c1d95 100%)",
    ground: "#5b21b6",
  },
  {
    id: 15,
    name: "Çürümüş Diyarlar",
    min: 5000,
    max: 5500,
    biome: "desert",
    unlocks: [],
    bg: "linear-gradient(180deg, #44403c 0%, #1c1917 100%)",
    ground: "#57534e",
  },
  {
    id: 16,
    name: "Radyoaktif Arena",
    min: 5500,
    max: 6000,
    biome: "hell",
    unlocks: [],
    bg: "linear-gradient(180deg, #15803d 0%, #052e16 100%)",
    ground: "#16a34a",
  },
  {
    id: 17,
    name: "Egzotik Arena",
    min: 6000,
    max: 7000,
    biome: "legendary",
    unlocks: [],
    bg: "linear-gradient(180deg, #831843 0%, #4c0519 100%)",
    ground: "#be185d",
  },
  {
    id: 18,
    name: "Mistik Arena",
    min: 7000,
    max: 8000,
    biome: "legendary",
    unlocks: [],
    bg: "linear-gradient(180deg, #3b0764 0%, #1e1b4b 100%)",
    ground: "#581c87",
  }
];

export const MAX_TROPHIES = 8000;

export function arenaForTrophies(trophies: number): Arena {
  const t = Math.max(0, Math.min(MAX_TROPHIES, trophies));
  return ARENAS.find((a) => t >= a.min && t < a.max) ?? ARENAS[ARENAS.length - 1];
}

export function getArenaForCard(cardId: string): Arena | undefined {
  return ARENAS.find(a => a.unlocks.includes(cardId));
}

export function getUnlockedCardsUpToTrophies(trophies: number): string[] {
  const unlocked: string[] = [];
  for (const a of ARENAS) {
    if (trophies >= a.min) {
      unlocked.push(...a.unlocks);
    }
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
  id: string;
  name: string;
  emoji: string;
  style: string;
  min: number;
  next: number;
}

export interface RankRewardDef {
  targetRankId: string;
  targetRankName: string;
  fromRankName: string;
  reqTrophies: number;
  reqStars?: number;
  gold: number;
  levelCoins: number;
  epicChests: number;
  legendaryChests: number;
  description: string;
}

export const RANK_TIERS: RankInfo[] = [
  { id: "bronz_1", name: "Bronz 1", emoji: "🥉", style: "from-amber-700 to-amber-900 border-amber-600 text-amber-400 shadow-amber-900/40", min: 0, next: 100 },
  { id: "bronz_2", name: "Bronz 2", emoji: "🥉", style: "from-amber-700 to-amber-900 border-amber-500 text-amber-200 shadow-amber-900/50", min: 100, next: 250 },
  { id: "bronz_3", name: "Bronz 3", emoji: "🥉", style: "from-amber-700 to-amber-900 border-amber-400 text-amber-100 shadow-amber-900/60 font-semibold", min: 350, next: 300 },
  { id: "gumus_1", name: "Gümüş 1", emoji: "🥈", style: "from-slate-400 to-slate-600 border-slate-350 text-slate-100 shadow-slate-700/40", min: 650, next: 400 },
  { id: "gumus_2", name: "Gümüş 2", emoji: "🥈", style: "from-slate-400 to-slate-600 border-slate-300 text-slate-50 shadow-slate-700/50", min: 1050, next: 400 },
  { id: "gumus_3", name: "Gümüş 3", emoji: "🥈", style: "from-slate-400 to-slate-600 border-slate-200 text-white shadow-slate-700/60 font-semibold", min: 1450, next: 400 },
  { id: "altin_1", name: "Altın 1", emoji: "🥇", style: "from-yellow-500 to-yellow-700 border-yellow-400 text-yellow-100 shadow-yellow-600/40 font-semibold", min: 1850, next: 500 },
  { id: "altin_2", name: "Altın 2", emoji: "🥇", style: "from-yellow-400 to-yellow-600 border-yellow-300 text-yellow-50 shadow-yellow-500/50 font-bold", min: 2350, next: 700 },
  { id: "altin_3", name: "Altın 3", emoji: "🥇", style: "from-yellow-300 to-yellow-500 border-yellow-200 text-white shadow-yellow-400/60 font-extrabold", min: 3050, next: 700 },
  { id: "elmas_1", name: "Elmas 1", emoji: "💎", style: "from-cyan-500 to-blue-600 border-cyan-400 text-cyan-50 shadow-cyan-500/50 font-bold", min: 3750, next: 800 },
  { id: "elmas_2", name: "Elmas 2", emoji: "💎", style: "from-cyan-400 to-blue-500 border-cyan-300 text-white shadow-cyan-400/60 font-extrabold", min: 4550, next: 1500 },
  { id: "elmas_3", name: "Elmas 3", emoji: "💎", style: "from-cyan-300 to-blue-400 border-cyan-200 text-white shadow-cyan-300/70 font-black", min: 6050, next: 950 },
  { id: "platin", name: "Platin", emoji: "👑", style: "from-purple-500 via-pink-500 to-red-500 border-pink-400 text-white shadow-pink-500/50 font-black animate-pulse", min: 7000, next: 1000 }
];

export const RANK_REWARDS: RankRewardDef[] = [
  {
    targetRankId: "bronz_2",
    targetRankName: "Bronz 2",
    fromRankName: "Bronz 1",
    reqTrophies: 100,
    gold: 10000,
    levelCoins: 1,
    epicChests: 0,
    legendaryChests: 0,
    description: "10.000 Para + 1 Level Coin",
  },
  {
    targetRankId: "bronz_3",
    targetRankName: "Bronz 3",
    fromRankName: "Bronz 2",
    reqTrophies: 350,
    gold: 15000,
    levelCoins: 0,
    epicChests: 3,
    legendaryChests: 0,
    description: "15.000 Para + 3 Epik Sandık",
  },
  {
    targetRankId: "gumus_1",
    targetRankName: "Gümüş 1",
    fromRankName: "Bronz 3",
    reqTrophies: 650,
    gold: 0,
    levelCoins: 0,
    epicChests: 0,
    legendaryChests: 3,
    description: "3 Efsanevi Sandık",
  },
  {
    targetRankId: "gumus_2",
    targetRankName: "Gümüş 2",
    fromRankName: "Gümüş 1",
    reqTrophies: 1050,
    gold: 30000,
    levelCoins: 2,
    epicChests: 0,
    legendaryChests: 2,
    description: "30.000 Para + 2 Efsanevi Sandık + 2 Level Coin",
  },
  {
    targetRankId: "gumus_3",
    targetRankName: "Gümüş 3",
    fromRankName: "Gümüş 2",
    reqTrophies: 1450,
    gold: 0,
    levelCoins: 0,
    epicChests: 0,
    legendaryChests: 5,
    description: "5 Efsanevi Sandık",
  },
  {
    targetRankId: "altin_1",
    targetRankName: "Altın 1",
    fromRankName: "Gümüş 3",
    reqTrophies: 1850,
    gold: 75000,
    levelCoins: 0,
    epicChests: 0,
    legendaryChests: 0,
    description: "75.000 Para",
  },
  {
    targetRankId: "altin_2",
    targetRankName: "Altın 2",
    fromRankName: "Altın 1",
    reqTrophies: 2350,
    gold: 25000,
    levelCoins: 5,
    epicChests: 0,
    legendaryChests: 0,
    description: "5 Level Coin + 25.000 Para",
  },
  {
    targetRankId: "altin_3",
    targetRankName: "Altın 3",
    fromRankName: "Altın 2",
    reqTrophies: 3050,
    gold: 33333,
    levelCoins: 3,
    epicChests: 0,
    legendaryChests: 3,
    description: "3 Level Coin + 3 Efsanevi Sandık + 33.333 Para",
  },
  {
    targetRankId: "elmas_1",
    targetRankName: "Elmas 1",
    fromRankName: "Altın 3",
    reqTrophies: 3750,
    gold: 40000,
    levelCoins: 5,
    epicChests: 0,
    legendaryChests: 0,
    description: "5 Level Coin + 40.000 Para",
  },
  {
    targetRankId: "elmas_2",
    targetRankName: "Elmas 2",
    fromRankName: "Elmas 1",
    reqTrophies: 4550,
    gold: 100000,
    levelCoins: 0,
    epicChests: 0,
    legendaryChests: 0,
    description: "100.000 Para",
  },
  {
    targetRankId: "elmas_3",
    targetRankName: "Elmas 3",
    fromRankName: "Elmas 2",
    reqTrophies: 6050,
    gold: 50000,
    levelCoins: 5,
    epicChests: 0,
    legendaryChests: 5,
    description: "50.000 Para + 5 Efsanevi Sandık + 5 Level Coin",
  },
  {
    targetRankId: "platin",
    targetRankName: "Platin",
    fromRankName: "Elmas 3",
    reqTrophies: 7000,
    reqStars: 140,
    gold: 140000,
    levelCoins: 14,
    epicChests: 14,
    legendaryChests: 5,
    description: "140.000 Para + 14 Epik Sandık + 5 Efsanevi Sandık + 14 Level Coin",
  },
];

export function getRankForRankProgress(progressTrophies: number, rankedStars: number = 0) {
  const p = Math.max(0, progressTrophies);
  const ranks: RankInfo[] = RANK_TIERS;

  let rank = ranks[0];
  for (let i = ranks.length - 1; i >= 0; i--) {
    const isPlatinByStars = ranks[i].id === "platin" && rankedStars >= 140;
    if (p >= ranks[i].min || isPlatinByStars) {
      rank = ranks[i];
      break;
    }
  }

  const rankIdx = ranks.indexOf(rank);
  const nextRank = rankIdx < ranks.length - 1 ? ranks[rankIdx + 1] : null;
  
  let progress = 100;
  let currentProgressVal = p - rank.min;
  let reqForNext = rank.next;

  if (nextRank) {
    if (nextRank.id === "platin" && rank.id === "elmas_3") {
      // Transition from Elmas 3 to Platin: 140 stars or 7000 kupa
      if (rankedStars > 0) {
        progress = Math.min(100, (rankedStars / 140) * 100);
        currentProgressVal = rankedStars;
        reqForNext = 140;
      } else {
        progress = Math.min(100, ((p - rank.min) / rank.next) * 100);
      }
    } else {
      progress = Math.min(100, ((p - rank.min) / rank.next) * 100);
    }
  }

  return {
    current: rank,
    next: nextRank,
    progress: Math.max(0, Math.min(100, progress)),
    currentProgressValue: currentProgressVal,
    requiredForNext: reqForNext,
  };
}

export function getRankForWins(wins: number) {
  return getRankForRankProgress(wins * 35);
}

export function getRankForTrophies(trophies: number) {
  return getRankForRankProgress(trophies);
}
