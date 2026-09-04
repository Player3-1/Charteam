const fs = require('fs');
let code = fs.readFileSync('src/components/leaderboard.tsx', 'utf-8');

code = code.replace(
  /          if \(data\.rankedStars && data\.rankedStars > 0\) \{\n            setDoc\(doc\(db, "users", docSnap\.id\), \{ rankedStars: 0 \}, \{ merge: true \}\)\.catch\(\(\) => \{\}\);\n          \}\n/g,
  ""
);

code = code.replace(
  /            rankProgressTrophies: data\.rankProgressTrophies \?\? 0,\n            rankedStars: 0,/g,
  "            rankProgressTrophies: data.rankProgressTrophies ?? 0,\n            rankedStars: data.rankedStars ?? 0,"
);

fs.writeFileSync('src/components/leaderboard.tsx', code);

let playerCode = fs.readFileSync('src/hooks/use-player.ts', 'utf-8');
playerCode = playerCode.replace(
  "rankProgressTrophies: data.rankProgressTrophies ?? 0,\n          rankedStars: 0,",
  "rankProgressTrophies: data.rankProgressTrophies ?? 0,\n          rankedStars: data.rankedStars ?? 0,"
);
fs.writeFileSync('src/hooks/use-player.ts', playerCode);
