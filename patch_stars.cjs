const fs = require('fs');

// Patch home-tab.tsx
let homeCode = fs.readFileSync('src/components/home-tab.tsx', 'utf-8');
homeCode = homeCode.replace(
  "{state.rankedStars !== undefined && state.rankedStars > 0 && (",
  "{(state.trophies >= 5000 || (state.rankedStars !== undefined && state.rankedStars > 0)) && ("
);
fs.writeFileSync('src/components/home-tab.tsx', homeCode);

// Patch leaderboard.tsx
let lbCode = fs.readFileSync('src/components/leaderboard.tsx', 'utf-8');
lbCode = lbCode.replace(
  /\{player\.rankedStars !== undefined && player\.rankedStars > 0 && \(/g,
  "{(player.trophies >= 5000 || (player.rankedStars !== undefined && player.rankedStars > 0)) && ("
);
fs.writeFileSync('src/components/leaderboard.tsx', lbCode);

