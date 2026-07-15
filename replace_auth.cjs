const fs = require('fs');
let code = fs.readFileSync('src/components/auth-modal.tsx', 'utf8');

const t = {
  "Geçersiz kullanıcı adı.": "Invalid username.",
  "Böyle bir kullanıcı bulunamadı.": "User not found.",
  "Yanlış şifre.": "Incorrect password.",
  "Bu kullanıcı adı zaten alınmış.": "Username is already taken.",
  "Bir hata oluştu: ": "An error occurred: ",
  "Giriş Yap": "Log In",
  "Kayıt Ol": "Sign Up",
  "Useıcı Adı": "Username",
  "Şifre": "Password",
  "Hesabın yok mu? Kayıt ol": "Don't have an account? Sign up",
  "Zaten hesabın var mı? Giriş yap": "Already have an account? Log in"
};

for (const [tr, en] of Object.entries(t)) {
  code = code.replace(new RegExp(tr, 'g'), en);
}

fs.writeFileSync('src/components/auth-modal.tsx', code);
