const fs = require('fs');
let code = fs.readFileSync('src/lib/battle.ts', 'utf-8');

code = code.replace(
  `    if (u.card.id === "sapanci") {
      // Sapancı cannot directly target bira-varili anymore
      targetPool = enemies.filter((e) => e.card.id !== "bira-varili");
      const priorityTargets = targetPool.filter((e) => e.card.id === "doktor");
      if (priorityTargets.length > 0) {
        targetPool = priorityTargets;
      }
    }`,
  `    if (u.card.id === "sapanci") {
      // Sapancı cannot directly target bira-varili anymore
      const filtered = enemies.filter((e) => e.card.id !== "bira-varili");
      if (filtered.length === 0) continue;
      targetPool = filtered;
      const priorityTargets = targetPool.filter((e) => e.card.id === "doktor");
      if (priorityTargets.length > 0) {
        targetPool = priorityTargets;
      }
    }`
);

fs.writeFileSync('src/lib/battle.ts', code);
