const fs = require('fs');
let code = fs.readFileSync('src/components/arena-view.tsx', 'utf8');

code = code.replace(/Hazır/g, "Ready").replace(/KAÇIYOR!/g, "FLEEING!");

fs.writeFileSync('src/components/arena-view.tsx', code);
