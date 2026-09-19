const fs = require("fs");
let text = fs.readFileSync("src/components/leaderboard.tsx", "utf8");

text = text.replace("export function LeaderboardTab({ currentUser, currentTrophies }: { currentUser: UserData; currentTrophies: number }) {", "export function LeaderboardTab({ currentUser, currentTrophies, onInviteDuel, onSpectate }: { currentUser: UserData; currentTrophies: number; onInviteDuel: (targetUsername: string) => void; onSpectate: (targetUsername: string) => void; }) {");

text = text.replace("<button onClick={() => alert(\"Savaş henüz başlamadı veya canlı yayın kapalı.\")} className=\"flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition\">\n                  Savaşı İzle\n                </button>", "<button onClick={() => onSpectate(selectedPlayer.username)} className=\"flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition\">\n                  Savaşı İzle\n                </button>");

text = text.replace("<button onClick={() => alert(\"Davet gönderildi! Bekleniyor...\")} className=\"flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition\">\n                  1v1 Davet Et\n                </button>", "<button onClick={() => onInviteDuel(selectedPlayer.username)} className=\"flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition\">\n                  1v1 Davet Et\n                </button>");

fs.writeFileSync("src/components/leaderboard.tsx", text);
