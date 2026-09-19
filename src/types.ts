export interface UserData {
  id?: string;
  username: string;
  gold: number;
  trophies: number;
  collection: Record<string, number>;
  deck: [string, string, string, string]; // Deprecated, use decks[activeDeckIndex]
  decks?: Record<string, [string, string, string, string]>; // NEW: Object of decks
  activeDeckIndex?: number; // NEW: Index of active deck
  wins: number;
  losses: number;
  tournamentWins?: number;
  tournamentLosses?: number;
  unlockedEmojis?: string[];
  selectedEmojis?: string[]; // Max 4
  unlockedCharms?: string[]; // Array of charm IDs unlocked by user
  selectedCharms?: string[]; // Up to 2 charms selected
  levelCoins?: number; // Currency used to level up cards
  rankProgressTrophies?: number; // Cumulative rank progression kupa
  claimedMilestones?: string[]; // Track claimed milestone emojis (🥇, 🥈, 🥉)
  maxTrophies?: number; // Lifetime highest trophy record achieved
  rankedStars?: number; // Rank star system for max trophy players
  claimedTrophyRewards?: number[];
  claimedStarRewards?: number[];
  cardLevels?: Record<string, number>; // cardId -> level (1-5)
  cardProgress?: Record<string, number>; // cardId -> progress (0-5)
  avatar?: string;
  profileStyleUnlocked?: boolean;
  profileColor?: string;
  profileFont?: string;
  rankedMatchesPlayed?: number;
  claimedRankedRewards?: number[];
  claimedRankTiers?: string[];
  rankSeason?: number;
}
