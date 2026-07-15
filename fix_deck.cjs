const fs = require('fs');
let code = fs.readFileSync('src/components/home-tab.tsx', 'utf8');

code = code.replace(/>Active Battle Deck</g, '>Active Battle dect<');
code = code.replace(/"Build your deck first"/g, '"Build your dect first"');
code = code.replace(/"Deck Limit Exceeded \(Max 20\)"/g, '"dect Limit Exceeded (Max 20)"');
code = code.replace(/make your deck cost/g, 'make your dect cost');

fs.writeFileSync('src/components/home-tab.tsx', code);
