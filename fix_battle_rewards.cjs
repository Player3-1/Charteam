const fs = require('fs');
let code = fs.readFileSync('src/components/battle-screen.tsx', 'utf-8');

code = code.replace(
  /\{rewards\.trophy >= 0 \? "\+" : ""\}\{mode === "ranked" \? \(rewards\.trophy > 0 \? 1 : -1\) : rewards\.trophy\} \{mode === "ranked" \? "⭐" : "🏆"\}/g,
  "{rewards.trophy >= 0 ? \"+\" : \"\"}{rewards.trophy} 🏆"
);

code = code.replace(
  /\{rewards\.trophy >= 0 \? "\+" : ""\}\{rewards\.trophy\} ⭐/g,
  "{rewards.trophy >= 0 ? \"+\" : \"\"}{rewards.trophy > 0 ? 1 : -1} ⭐"
);

fs.writeFileSync('src/components/battle-screen.tsx', code);
