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
    description: "Basıldığı an tüm kartların gücü 5 saniyeliğine 2 katına çıkar.",
    cost: 0,
  },
  {
    id: "saglik",
    name: "Sağlık",
    emoji: "❤️",
    description: "Basıldığı an tüm kartların canı %50 dolar.",
    cost: 0,
  },
  {
    id: "hiz",
    name: "Hız",
    emoji: "⚡",
    description: "Basıldığı an tüm kartlar 4 saniyeliğine 2x hızlanır.",
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
    description: "Basıldığında tüm kartların gücü 5 saniyeliğine 2.5x artar, vurma süreleri %25 kısalır, ancak canlarının da %25'ini kaybederler.",
    cost: 88000,
  },
  {
    id: "kutsanmislik",
    name: "Kutsanmışlık",
    emoji: "✨",
    description: "İstediğin bir karta 2.5x dayanıklılık (can) basarsın. Onun etrafında sarı halkalar çıkar.",
    cost: 125000,
  },
  {
    id: "bomba",
    name: "Bomba",
    emoji: "💣",
    description: "İstediğin yere bomba bırakırsın ve o bombanın 4x4 alanındaki herşey 100 hasar alır.",
    cost: 50000,
  }
];
