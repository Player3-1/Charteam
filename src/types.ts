export interface UserData {
  username: string;
  gold: number;
  trophies: number;
  collection: Record<string, number>;
  deck: [string, string, string, string];
  wins: number;
  losses: number;
  unlockedEmojis?: string[];
  selectedEmojis?: string[]; // Max 4
}
