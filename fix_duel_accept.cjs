const fs = require("fs");
let text = fs.readFileSync("src/components/home-tab.tsx", "utf8");

const from = `        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: 1000, 
           deck: ["mizrakli", "okcu", "dev", "kilicli"]
        },`;

const to = `        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: 1000, // Ideally fetched from db, placeholder for now
           deck: ["mizrakli", "okcu", "dev", "kilicli"]
        },`;
// I will just add a fetch for the opponent's true stats

const fullFrom = `      const p1Avatar = getAvatarForName(duel.challenger);
      const p2Avatar = state.avatar || getAvatarForName(user.username);
      
      await setDoc(doc(db, "battles", battleId), {`;

const fullTo = `      const oppRef = await getDoc(doc(db, "users", duel.challenger));
      const oppData = oppRef.exists() ? oppRef.data() : {};
      const p1Avatar = oppData.avatar || getAvatarForName(duel.challenger);
      const p2Avatar = state.avatar || getAvatarForName(user.username);
      
      await setDoc(doc(db, "battles", battleId), {`;

text = text.replace(fullFrom, fullTo);

text = text.replace(`        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: 1000, 
           deck: ["mizrakli", "okcu", "dev", "kilicli"]
        },`, `        player1: { 
           username: duel.challenger, 
           avatar: p1Avatar, 
           trophies: oppData.trophies ?? 1000, 
           rankedStars: oppData.rankedStars ?? 0,
           deck: oppData.deck || ["mizrakli", "okcu", "dev", "kilicli"],
           wins: oppData.wins ?? 0,
        },`);

fs.writeFileSync("src/components/home-tab.tsx", text);
