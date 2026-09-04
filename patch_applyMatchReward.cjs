const fs = require('fs');
let code = fs.readFileSync('src/hooks/use-player.ts', 'utf-8');

code = code.replace(
  /const newState = \{\n\s+\.\.\.state,\n\s+trophies: nextTrophies,/g,
  "const newState = {\n      ...state,\n      gold: state.gold + gold,\n      trophies: nextTrophies,"
);

fs.writeFileSync('src/hooks/use-player.ts', code);
