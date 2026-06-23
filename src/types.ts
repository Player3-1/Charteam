export interface UserData {
  username: string;
  gold: number;
  trophies: number;
  collection: Record<string, number>;
  deck: [string, string, string, string]; // Deprecated, use decks[activeDeckIndex]
  decks?: Record<string, [string, string, string, string]>; // NEW: Object of decks
  activeDeckIndex?: number; // NEW: Index of active deck
  wins: number;
  losses: number;
  unlockedEmojis?: string[];
  selectedEmojis?: string[]; // Max 4
  rankProgressTrophies?: number; // Cumulative rank progression kupa
}
