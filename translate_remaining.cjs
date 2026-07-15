const fs = require('fs');

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [tr, en] of Object.entries(replacements)) {
    content = content.replace(new RegExp(tr, 'g'), en);
  }
  fs.writeFileSync(file, content);
}

replaceInFile('src/components/auth-modal.tsx', {
  "Hesabın yok mu\\? Kayıt ol": "Don't have an account? Sign up",
  "Zaten hesabın var mı\\? Giriş yap": "Already have an account? Log in"
});

replaceInFile('src/components/home-tab.tsx', {
  "Aşamalı Meydan": "Ranked Arena"
});

