const fs = require('fs');
let code = fs.readFileSync('src/hooks/use-player.ts', 'utf8');

code = code.replace(
  'unlockedEmojis: data.unlockedEmojis ?? [],',
  'unlockedEmojis: (data.unlockedEmojis && data.unlockedEmojis.length > 0) ? data.unlockedEmojis : ["👍", "😂", "😡", "😱"],'
);

code = code.replace(
  'selectedEmojis: data.selectedEmojis ?? ["", "", "", ""],',
  'selectedEmojis: (data.selectedEmojis && data.selectedEmojis.length > 0) ? data.selectedEmojis : ["👍", "😂", "😡", "😱"],'
);

fs.writeFileSync('src/hooks/use-player.ts', code);
