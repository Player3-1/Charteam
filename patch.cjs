const fs = require('fs');
let code = fs.readFileSync('src/lib/battle.ts', 'utf-8');

// 1. Sapancı target priority logic
code = code.replace(
  `    if (u.card.id === "sapanci") {
      const priorityTargets = enemies.filter((e) => e.card.id === "doktor" || e.card.id === "bira-varili");
      if (priorityTargets.length > 0) {
        targetPool = priorityTargets;
      }
    }`,
  `    if (u.card.id === "sapanci") {
      // Sapancı cannot directly target bira-varili anymore
      targetPool = enemies.filter((e) => e.card.id !== "bira-varili");
      const priorityTargets = targetPool.filter((e) => e.card.id === "doktor");
      if (priorityTargets.length > 0) {
        targetPool = priorityTargets;
      }
    }`
);

// 2. Dev Balık healing logic
code = code.replace(
  `  if (wasAlive && defender.hp <= 0) {
    // Defender died! Heal opposing Dev Balık units by 100 HP.
    state.units.forEach((u) => {
      if (u.side !== defender.side && u.hp > 0 && u.card.id === "balik") {
        u.hp = Math.min(u.maxHp, u.hp + 100);
      }
    });
  }`,
  `  if (wasAlive && defender.hp <= 0) {
    // Defender died! Heal opposing Dev Balık units by 50 HP.
    // DOES NOT work on Kuş Ordusu birds.
    if (!defender.card.id.startsWith("kus-ordusu")) {
      state.units.forEach((u) => {
        if (u.side !== defender.side && u.hp > 0 && u.card.id === "balik") {
          u.hp = Math.min(u.maxHp, u.hp + 50);
        }
      });
    }
  }`
);

fs.writeFileSync('src/lib/battle.ts', code);
