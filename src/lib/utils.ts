import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarForName(name: string): string {
  const avatars = ["🦁", "🐯", "🦊", "🐼", "🐨", "🐰", "🐱", "🐶", "🦄", "🐉", "🤖", "🥷", "🧙", "👑", "⚡", "🔥", "💎", "⭐"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatars[Math.abs(hash) % avatars.length];
}

