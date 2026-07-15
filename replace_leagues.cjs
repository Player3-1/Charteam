const fs = require('fs');
let code = fs.readFileSync('src/components/home-tab.tsx', 'utf8');

const leagueNames = {
  "Bronz Lig": "Bronze League",
  "Gümüş Lig": "Silver League",
  "Altın Lig": "Gold League",
  "Platin Lig": "Platinum League",
  "Elmas Lig": "Diamond League",
  "Efsanevi Lig": "Legendary League",
  "Şampiyon": "Champion"
};

for (const [tr, en] of Object.entries(leagueNames)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/home-tab.tsx', code);
