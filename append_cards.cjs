const fs = require('fs');
let code = fs.readFileSync('src/lib/cards.ts', 'utf8');

const newCards = `
  { id: "dinamitor", name: "Dinamitör", emoji: "🧨", rarity: "rare", hp: 100, dmg: 75, cd: 0, range: "yakın", description: "Explodes on touch, 2 block radius. Expires in 8s.", stoneCost: 3 },
  { id: "deniz-anasi", name: "Denizanası", emoji: "🪼", rarity: "epic", hp: 90, dmg: 5, cd: 0.5, range: "uzak", description: "Damage increases with every hit up to 90.", stoneCost: 3 },
  { id: "ugur-bocegi", name: "Uğur Böceği", emoji: "🐞", rarity: "legendary", hp: 1, dmg: 0, cd: 0, range: "yakın", description: "Wanders randomly. Ability: Sacrifices itself to heal all allies +100 HP.", ability: "Heals allies 100 HP", stoneCost: 1 },
  { id: "orumcek", name: "Örümcek", emoji: "🕷️", rarity: "legendary", hp: 155, dmg: 30, cd: 1.0, range: "uzak", description: "Ranged attacker. Ability: Webs nearest target for 9s.", ability: "Web freezes target for 9s", stoneCost: 4 },
  { id: "muhafiz", name: "Muhafız", emoji: "🤺", rarity: "common", hp: 666, dmg: 55, cd: 1.0, range: "yakın", description: "Melee guard.", stoneCost: 7 },
  { id: "mayin", name: "Mayın", emoji: "✹", rarity: "common", hp: 1, dmg: 80, cd: 0, range: "yakın", description: "Explodes on touch (2 block radius).", stoneCost: 3 }
`;

code = code.replace(/];/, newCards + '];');
fs.writeFileSync('src/lib/cards.ts', code);
