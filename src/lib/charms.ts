export interface CharmDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
}

export const CHARMS: CharmDef[] = [
  {
    id: "kuvvet",
    name: "Kuvvet",
    emoji: "💪",
    description: "Basıldığı an tüm kartların gücü 8 saniyeliğine 2 katına çıkar. (Saf Kuvvet ile aynı anda kullanılamaz)",
    cost: 0,
  },
  {
    id: "saglik",
    name: "Sağlık",
    emoji: "❤️",
    description: "Basıldığı an tüm kartların canı %30 dolar.",
    cost: 0,
  },
  {
    id: "hiz",
    name: "Hız",
    emoji: "⚡",
    description: "Basıldığı an tüm kartlar 7 saniyeliğine 2x hızlanır.",
    cost: 35000,
  },
  {
    id: "kan-banyosu",
    name: "Kan Banyosu",
    emoji: "🩸",
    description: "Basıldığı an tüm kartlar 7 saniye boyunca vurduğu hasar kadar can çalar.",
    cost: 120000,
  },
  {
    id: "mutlak-guc",
    name: "Saf Kuvvet",
    emoji: "⚡",
    description: "Basıldığında tüm kartların gücü 3 saniyeliğine 3x artar, vurma süreleri %25 kısalır, ancak canlarının da %25'ini kaybederler. (Kuvvet ile aynı anda kullanılamaz)",
    cost: 88000,
  },
  {
    id: "kutsanmislik",
    name: "Kutsanmışlık",
    emoji: "✨",
    description: "İstediğin bir karta 1.5x dayanıklılık (can) basarsın. Onun etrafında sarı halkalar çıkar.",
    cost: 125000,
  },
  {
    id: "bomba",
    name: "Bomba",
    emoji: "💣",
    description: "İstediğin yere bomba bırakırsın ve o bombanın 4x4 alanındaki herşey 150 hasar alır.",
    cost: 50000,
  },
  {
    id: "yavaslik",
    name: "Yavaşlık",
    emoji: "⏳",
    description: "Rakibin kartları 6 saniyeliğine hem vurma süresi hem hareket bakımından %50 yavaşlar.",
    cost: 65000,
  },
  {
    id: "ates",
    name: "Ateş",
    emoji: "🔥",
    description: "8 saniyeliğine kartların 3x daha fazla hasar vurur ama karşılığında 1.5x daha fazla hasar yer. (Su charmı ile birlikte kullanılamaz)",
    cost: 85000,
  },
  {
    id: "su",
    name: "Su",
    emoji: "💧",
    description: "8 saniyeliğine kartların 3x daha az hasar yer (%67 hasar azaltma) ama karşılığında 1.5x daha az hasar vurur. (Ateş charmı ile birlikte kullanılamaz)",
    cost: 85000,
  }
];
