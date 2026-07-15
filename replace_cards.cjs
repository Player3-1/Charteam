const fs = require('fs');
let code = fs.readFileSync('src/lib/cards.ts', 'utf8');

const translations = [
  { id: "mizrakli", name: "Spearman", desc: "Fast melee unit." },
  { id: "kilicli", name: "Swordsman", desc: "Slow but hard-hitting swordsman." },
  { id: "dev", name: "Giant", desc: "High health, front line tank." },
  { id: "atli", name: "Cavalry", desc: "Deals 75 damage on fast charge, 25 when slow." },
  { id: "okcu", name: "Archer", desc: "Shoots fast arrows from long range." },
  { id: "tufekci", name: "Musketeer", desc: "Hard hitting, slow trigger." },
  { id: "sapanci", name: "Slinger", desc: "Deals splash damage from extremely long range." },
  { id: "topcu", name: "Cannoneer", desc: "Devastating large area damage cannon fire." },
  { id: "ejder", name: "Dragon", desc: "Deals area damage from air with fire breath." },
  { id: "kus-ordusu", name: "Bird Army", desc: "5 fast birds, hard to catch." },
  { id: "hayalet", name: "Ghost", desc: "Only visible in a 3x3 area. Flies. Ability: 5s invisibility, immune to damage and deals 2x damage.", ability: "5s invisibility, damage immunity and 2x damage" },
  { id: "madenci", name: "Miner", desc: "Digs to the desired location and emerges.", ability: "Choose location and emerge" },
  { id: "doktor", name: "Doctor", desc: "Heals allies for +90 HP, follows allies with low HP.", ability: "5x5 heal with 5s CD" },
  { id: "bira-varili", name: "Beer Barrel", desc: "Ally damage 2.0x. Lasts 30s.", ability: "10s 3.0x damage" },
  { id: "bombalama-ucagi", name: "Bomber Plane", desc: "Deals 30 damage to 4x4 area every 3.6s.", ability: "50 damage super bomb to 6x6 area" },
  { id: "zirhli", name: "Armored", desc: "Tank. 8s defensive stance absorbs 25% of damage.", ability: "8s defense" },
  { id: "buz-dolabi", name: "Ice Slinger", desc: "Deals area damage and freezes enemies." },
  { id: "kardan-adam", name: "Snowman", desc: "Snowball freezes enemy for 1.2s." },
  { id: "kurbaga", name: "Frog", desc: "Shoots tongue, poisons for 10s (3 damage per second).", ability: "Swallows nearest card, explodes after 2s." },
  { id: "dev-sinek", name: "Giant Fly", desc: "Airborne tank." },
  { id: "kopek-baligi", name: "Shark", desc: "Fast close range unit." },
  { id: "balik", name: "Fish", desc: "Attacks and retreats constantly." },
  { id: "mercan", name: "Coral", desc: "Heals the whole team 1 HP per second.", ability: "Heals whole team 30 HP every 3s." },
  { id: "lav-kopegi", name: "Lava Hound", desc: "Bite burns enemy (5 damage/sec for 7s). Offense: Breaths fire in 3x3 area.", ability: "Burns enemies in 3x3 area with 20 dmg/s for 3s." },
  { id: "volkan", name: "Volcano", desc: "Shoots fireball from ground, burns target with 5 dmg/s for 4s." },
  { id: "cehennem-ejderi", name: "Inferno Dragon", desc: "Breaths fire from air, burns targets with 5 dmg/s for 4s." },
  { id: "kabile", name: "Tribe", desc: "Unlocked in Arena 9, basic card with 25 hp and 15 damage. No ability." },
  { id: "golem", name: "Elephant", desc: "Durable elephant. Rare tank with 1000 hp, 40 damage." },
  { id: "cig", name: "Avalanche", desc: "Thrown to designated location, deals 100 damage to an area extending 5 blocks from drop point.", ability: "Deals 100 damage" },
  { id: "samuray", name: "Samurai", desc: "Legendary warrior unlocked in arena 11. Ability: his strike deals 2x damage.", ability: "Strike deals 2x damage (140 total)" }
];

for (const t of translations) {
  // Regex to match the whole line for this card to be safer
  // Just simple string replace on name and desc
  const regex = new RegExp(`{ id: "${t.id}", name: "[^"]+", emoji: "([^"]+)", rarity: "([^"]+)", hp: ([0-9]+), dmg: ([^,]+), cd: ([0-9.]+), range: "([^"]+)", description: "[^"]+"(?:, ability: "[^"]+")?, stoneCost: ([0-9]+) }`);
  
  let abilityPart = t.ability ? `, ability: "${t.ability}"` : "";
  code = code.replace(regex, (match, emoji, rarity, hp, dmg, cd, range, stoneCost) => {
    return `{ id: "${t.id}", name: "${t.name}", emoji: "${emoji}", rarity: "${rarity}", hp: ${hp}, dmg: ${dmg}, cd: ${cd}, range: "${range}", description: "${t.desc}"${abilityPart}, stoneCost: ${stoneCost} }`;
  });
}

// Update rarity labels
code = code.replace(/Basit/g, "Common")
           .replace(/Nadir Sandık/g, "Rare Chest")
           .replace(/Nadir/g, "Rare")
           .replace(/Epik Sandık/g, "Epic Chest")
           .replace(/Epik/g, "Epic")
           .replace(/Efsanevi Sandık/g, "Legendary Chest")
           .replace(/Efsanevi/g, "Legendary")
           .replace(/Basit Sandık/g, "Basic Chest");

fs.writeFileSync('src/lib/cards.ts', code);
