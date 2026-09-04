const fs = require('fs');
let code = fs.readFileSync('src/hooks/use-player.ts', 'utf-8');

code = code.replace(
  /      \/\/ Ranked stars logic \(\+10 for win, -10 for loss\)\n      const starsChange = trophy;\n      nextRankedStars = Math.max\(0, \(state.rankedStars \?\? 0\) \+ starsChange\);/g,
  "      // Ranked stars logic (+1 for win, -1 for loss)\n      const starsChange = win ? 1 : -1;\n      nextRankedStars = Math.max(0, (state.rankedStars ?? 0) + starsChange);"
);

fs.writeFileSync('src/hooks/use-player.ts', code);
