import type { Rarity } from "./cards";

export interface Arena {
  id: number;
  name: string;
  min: number;
  max: number;
  biome: "grass" | "desert" | "snow" | "legendary";
  /** rarities that can drop from chests in this arena */
  pool: Rarity[];
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
    pool: ["common", "rare"],
    bg: "linear-gradient(180deg, #6ec24a 0%, #4a9b32 100%)",
    ground: "#5cb13b",
  },
  {
    id: 2,
    name: "Çöl",
    min: 120,
    max: 250,
    biome: "desert",
    pool: ["common", "rare", "epic"],
    bg: "linear-gradient(180deg, #e6c373 0%, #c79a3f 100%)",
    ground: "#d7af55",
  },
  {
    id: 3,
    name: "Karlar",
    min: 250,
    max: 400,
    biome: "snow",
    pool: ["common", "rare", "epic"],
    bg: "linear-gradient(180deg, #e8f1f7 0%, #b9d0e0 100%)",
    ground: "#dde9f2",
  },
  {
    id: 4,
    name: "Efsanevi Arena",
    min: 400,
    max: 750,
    biome: "legendary",
    pool: ["common", "rare", "epic", "legendary"],
    bg: "linear-gradient(180deg, #6a5e55 0%, #3d342e 100%)",
    ground: "#544840",
  },
];

export const MAX_TROPHIES = 750;

export function arenaForTrophies(trophies: number): Arena {
  const t = Math.max(0, Math.min(MAX_TROPHIES, trophies));
  return ARENAS.find((a) => t >= a.min && t < a.max) ?? ARENAS[ARENAS.length - 1];
}
