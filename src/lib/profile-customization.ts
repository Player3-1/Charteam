export interface ProfileColorOption {
  name: string;
  value: string;
  dot: string;
  class: string;
}

export interface ProfileFontOption {
  name: string;
  value: string;
  sample: string;
}

export interface ProfileAvatarOption {
  emoji: string;
  name: string;
}

export const PROFILE_COLORS: ProfileColorOption[] = [
  { name: "Parlak Beyaz", value: "white", dot: "bg-white border border-slate-300", class: "text-white text-stroke" },
  { name: "Altın Sarısı", value: "gold", dot: "bg-amber-400 shadow-sm shadow-amber-400/50", class: "text-yellow-400 font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent animate-pulse" },
  { name: "Alev Kırmızısı", value: "red", dot: "bg-rose-500 shadow-sm shadow-rose-500/50", class: "text-rose-500 font-bold bg-gradient-to-r from-red-600 to-rose-400 bg-clip-text text-transparent" },
  { name: "Buz Mavisi", value: "blue", dot: "bg-cyan-400 shadow-sm shadow-cyan-400/50", class: "text-cyan-400 font-bold bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent" },
  { name: "Zümrüt Yeşili", value: "green", dot: "bg-emerald-400 shadow-sm shadow-emerald-400/50", class: "text-emerald-400 font-bold bg-gradient-to-r from-emerald-500 to-green-300 bg-clip-text text-transparent" },
  { name: "Kraliyet Moru", value: "purple", dot: "bg-purple-500 shadow-sm shadow-purple-500/50", class: "text-purple-400 font-bold bg-gradient-to-r from-indigo-500 to-purple-400 bg-clip-text text-transparent" },
  { name: "Neon Pembe", value: "pink", dot: "bg-pink-500 shadow-sm shadow-pink-500/50", class: "text-fuchsia-400 font-bold bg-gradient-to-r from-pink-500 to-fuchsia-300 bg-clip-text text-transparent" },
  { name: "Gökkuşağı", value: "rainbow", dot: "bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-indigo-500", class: "font-black bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-flow" }
];

export const PROFILE_FONTS: ProfileFontOption[] = [
  { name: "Oyun (Display)", value: "font-display", sample: "Aa" },
  { name: "Modern (Sans)", value: "font-sans font-bold", sample: "Aa" },
  { name: "Retro (Mono)", value: "font-mono font-bold", sample: "Aa" },
  { name: "Soylu (Serif)", value: "font-serif font-bold", sample: "Aa" },
  { name: "Vurucu (Black)", value: "font-sans font-black tracking-wide", sample: "Aa" },
  { name: "Dinamik (İtalik)", value: "font-display italic", sample: "Aa" }
];

export const PROFILE_AVATARS: ProfileAvatarOption[] = [
  { emoji: "🥷", name: "Ninja" },
  { emoji: "🧙", name: "Wizard" },
  { emoji: "🐉", name: "Dragon" },
  { emoji: "🦁", name: "Lion" },
  { emoji: "🦈", name: "Shark" },
  { emoji: "👻", name: "Ghost" },
  { emoji: "👑", name: "King" },
  { emoji: "🤖", name: "Robot" },
  { emoji: "💀", name: "Skull" },
  { emoji: "🦄", name: "Unicorn" },
  { emoji: "👽", name: "Alien" },
  { emoji: "🦊", name: "Fox" },
  { emoji: "🐰", name: "Tavşan" },
  { emoji: "😺", name: "Kedi" },
  { emoji: "🙉", name: "Maymun" },
  { emoji: "🍌", name: "Muz" },
  { emoji: "😎", name: "Gözlüklü" },
  { emoji: "🫠", name: "Eriyen" },
  { emoji: "😧", name: "Endişeli" },
  { emoji: "😈", name: "Şeytan" },
  { emoji: "💩", name: "Kaka" },
  { emoji: "🐻", name: "Ayı" },
  { emoji: "🐻‍❄️", name: "Kutup Ayısı" },
  { emoji: "🐼", name: "Panda" },
  { emoji: "🐨", name: "Koala" },
  { emoji: "🐹", name: "Hamster" },
  { emoji: "🐭", name: "Fare" },
  { emoji: "👁️", name: "Göz" },
  { emoji: "💵", name: "Dolar" },
  { emoji: "💸", name: "Uçan Para" },
  { emoji: "📌", name: "Raptiye" },
  { emoji: "🍔", name: "Burger" },
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🍟", name: "Patates" },
  { emoji: "🍪", name: "Kurabiye" },
  { emoji: "🍭", name: "Lolipop" },
  { emoji: "🍫", name: "Çikolata" },
  { emoji: "🚀", name: "Roket" },
  { emoji: "🛸", name: "UFO" },
  { emoji: "🌏", name: "Dünya" },
  { emoji: "🌗", name: "Ay" },
  { emoji: "🌚", name: "Yeni Ay" },
  { emoji: "⭐", name: "Yıldız" },
  { emoji: "🌟", name: "Parlayan Yıldız" },
  { emoji: "☃️", name: "Kardan Adam" },
  { emoji: "⚡", name: "Şimşek" },
  { emoji: "❄️", name: "Kar Tanesi" },
  { emoji: "🔥", name: "Alev" },
  { emoji: "💧", name: "Su Damlası" },
  { emoji: "❤️", name: "Kırmızı Kalp" },
  { emoji: "🩷", name: "Pembe Kalp" },
  { emoji: "🧡", name: "Turuncu Kalp" },
  { emoji: "💛", name: "Sarı Kalp" },
  { emoji: "💚", name: "Yeşil Kalp" },
  { emoji: "💙", name: "Mavi Kalp" },
  { emoji: "🩵", name: "Açık Mavi Kalp" },
  { emoji: "💜", name: "Mor Kalp" },
  { emoji: "🤎", name: "Kahverengi Kalp" },
  { emoji: "🖤", name: "Siyah Kalp" },
  { emoji: "🩶", name: "Gri Kalp" },
  { emoji: "🤍", name: "Beyaz Kalp" },
  { emoji: "💔", name: "Kırık Kalp" },
  { emoji: "💫", name: "Kayan Yıldız" }
];

export function getPlayerStyle(player?: { profileColor?: string; profileFont?: string } | null) {
  const colorClass = PROFILE_COLORS.find(c => c.value === player?.profileColor)?.class || "text-white text-stroke";
  const fontClass = player?.profileFont || "font-display";
  return { colorClass, fontClass };
}
