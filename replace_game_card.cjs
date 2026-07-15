const fs = require('fs');
let code = fs.readFileSync('src/components/game-card.tsx', 'utf8');

code = code.replace(/"Arena \${lockedAtArena}'de açılır"/g, '"Unlocks at Arena ${lockedAtArena}"');
code = code.replace(/"SEÇİLİ"/g, '"SELECTED"');

fs.writeFileSync('src/components/game-card.tsx', code);
