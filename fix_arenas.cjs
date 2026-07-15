const fs = require('fs');
let code = fs.readFileSync('src/components/home-tab.tsx', 'utf8');

// The rendering of the description is here:
// <p className="text-stroke-sm text-xs text-white/90 italic font-medium leading-none">
//   {battleMode === "ranked" ? "Collect stars, reach legendary ranks!" : visuals.desc}
// </p>

code = code.replace(
  '{battleMode === "ranked" ? "Collect stars, reach legendary ranks!" : visuals.desc}',
  '{battleMode === "ranked" ? "Collect stars, reach legendary ranks!" : ""}'
);

fs.writeFileSync('src/components/home-tab.tsx', code);
