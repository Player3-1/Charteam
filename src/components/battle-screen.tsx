import { useEffect, useMemo, useRef, useState } from "react";
import type { CardDef } from "@/lib/cards";
import { CARDS } from "@/lib/cards";
import { arenaForTrophies, getRankForTrophies } from "@/lib/arenas";
import { ArenaView } from "./arena-view";
import { db } from "@/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { submitPlacements, submitAbilityTrigger, submitEmoji, BattlePlacement, cancelMatchmaking } from "@/lib/matchmaking";
import { cn, getAvatarForName } from "@/lib/utils";
import { PROFILE_COLORS } from "@/lib/profile-customization";
import {
  computeRewards,
  makeBotDeck,
  makeOpponentTrophies,
  makeInitialState,
  spawnUnit,
  tickBattle,
  triggerUnitAbility,
  getAbilityStoneCost,
  COLS,
  ROWS,
  RIVER_ROW,
  type BattleState,
  type Unit,
} from "@/lib/battle";

type Phase = "drafting" | "placing" | "fighting" | "done";

function getBotPlacementCoordinate(
  card: CardDef, 
  existingUnits: Unit[], 
  arenaId?: number, 
  mode?: string, 
  botTrophies: number = 0
): { col: number; row: number } {
  const isOccupied = (c: number, r: number) => {
    return existingUnits.some(u => Math.round(u.col) === c && Math.round(u.row) === r);
  };

  const playerUnits = existingUnits.filter(u => u.side === "player");
  const botUnits = existingUnits.filter(u => u.side === "bot");

  const isSquishyRanged = ["okcu", "topcu", "bombalama-ucagi", "kus-ordusu", "kardan-adam", "volkan", "tufekci"].includes(card.id);
  const isExtremeBack = ["sapanci", "buz-dolabi", "zombi"].includes(card.id);
  const isHeavyTank = ["golem", "dev", "zirhli", "lav-kopegi", "kopek-baligi"].includes(card.id) || card.hp >= 150;
  const isHealerSupport = ["doktor", "mercan"].includes(card.id);
  const isAssassinFast = ["samuray", "vampir", "balik", "karinca-ordusu", "kabile"].includes(card.id);

  // Column weights:
  const getColWeight = (c: number, r: number, wantAlign: boolean) => {
    let w = 0;
    for (const pu of playerUnits) {
      const distCol = Math.abs(pu.col - c);
      if (wantAlign) {
        w += Math.max(0, 6 - distCol);
      } else {
        w -= Math.max(0, 6 - distCol);
      }
    }

    // Spread bot units out slightly so they don't block each other
    for (const bu of botUnits) {
      const dist = Math.abs(bu.col - c) + Math.abs(bu.row - r);
      if (dist < 2) {
        w -= (3 - dist) * 3;
      }
    }

    return w;
  };

  const findBestColInRow = (r: number, wantAlign: boolean) => {
    let bestCol = -1;
    let bestW = -Infinity;
    const cols = Array.from({ length: COLS }, (_, idx) => idx).sort(() => Math.random() - 0.5);
    for (const c of cols) {
      if (!isOccupied(c, r)) {
        const w = getColWeight(c, r, wantAlign);
        if (w > bestW) {
          bestW = w;
          bestCol = c;
        }
      }
    }
    return bestCol !== -1 ? bestCol : null;
  };

  // Find column with the highest density/threat of player units
  const getPlayerThreatColumn = (): number => {
    if (playerUnits.length === 0) return Math.floor(COLS / 2);
    const colScores = new Array(COLS).fill(0);
    playerUnits.forEach(pu => {
      const c = Math.round(pu.col);
      if (c >= 0 && c < COLS) {
        const dmgNum = typeof pu.card.dmg === "number" ? pu.card.dmg : 40;
        colScores[c] += (dmgNum * 2 + pu.hp);
      }
    });
    let bestCol = Math.floor(COLS / 2);
    let maxScore = -1;
    colScores.forEach((score, col) => {
      if (score > maxScore) {
        maxScore = score;
        bestCol = col;
      }
    });
    return bestCol;
  };

  // === 1. MADENCI (Special placement across the whole board) ===
  if (card.id === "madenci") {
    // 4000+ Bot: surgically place adjacent to player's squishiest / support unit (Doktor, Sapancı, Okçu, Topçu, etc.)
    if (botTrophies >= 2000 && playerUnits.length > 0) {
      // Find priority target: support or backline ranged
      const priorityTargets = playerUnits.filter(u => 
        ["doktor", "sapanci", "okcu", "topcu", "bombalama-ucagi", "bira-varili", "buz-dolabi", "tufekci"].includes(u.card.id)
      );
      const candidates = priorityTargets.length > 0 ? priorityTargets : [...playerUnits].sort((a, b) => b.row - a.row);
      const target = candidates[0];

      // Try adjacent squares (behind or beside)
      const offsets = [
        { dc: 0, dr: 1 },
        { dc: 1, dr: 0 },
        { dc: -1, dr: 0 },
        { dc: 0, dr: -1 },
        { dc: 1, dr: 1 },
        { dc: -1, dr: 1 },
      ];
      for (const off of offsets) {
        const tc = Math.round(target.col) + off.dc;
        const tr = Math.round(target.row) + off.dr;
        if (tc >= 0 && tc < COLS && tr >= 0 && tr < ROWS && tr !== RIVER_ROW && !isOccupied(tc, tr)) {
          return { col: tc, row: tr };
        }
      }
    }

    // Default miner attempt
    let attempts = 0;
    while (attempts < 100) {
      const c = Math.floor(Math.random() * COLS);
      const r = Math.floor(Math.random() * ROWS);
      if (r !== RIVER_ROW && !isOccupied(c, r)) {
        if (playerUnits.length > 0 && Math.random() < 0.85) {
          const target = playerUnits[Math.floor(Math.random() * playerUnits.length)];
          const tc = Math.round(target.col);
          const tr = Math.round(target.row);
          const dCol = Math.floor(Math.random() * 3) - 1;
          const dRow = Math.floor(Math.random() * 3) - 1;
          const finalC = tc + dCol;
          const finalR = tr + dRow;
          if (finalC >= 0 && finalC < COLS && finalR >= 0 && finalR < ROWS && finalR !== RIVER_ROW && !isOccupied(finalC, finalR)) {
            return { col: finalC, row: finalR };
          }
        } else {
          return { col: c, row: r };
        }
      }
      attempts++;
    }
  }

  // === 2. ÇIĞ (Avalanche - wants front row directly facing player push) ===
  if (card.id === "cig") {
    const rowsToTry = [11, 10, 9];
    const threatCol = getPlayerThreatColumn();
    // Try threat column first
    for (const r of rowsToTry) {
      if (!isOccupied(threatCol, r)) return { col: threatCol, row: r };
    }
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 3. BİRA VARİLİ (Center backline to radiate aura to both lanes) ===
  if (card.id === "bira-varili") {
    const centerCols = [2, 3, 1, 4];
    const rowsToTry = [1, 2, 0];
    for (const r of rowsToTry) {
      for (const c of centerCols) {
        if (!isOccupied(c, r)) return { col: c, row: r };
      }
    }
  }

  // === 4. HEAVY TANKS (Golem, Dev, Zırhlı, Lav Köpeği, Köpek Balığı) ===
  if (isHeavyTank) {
    // High IQ: Frontline (row 11 or 10), directly in the column facing player's biggest threat
    const rowsToTry = botTrophies >= 2000 ? [11, 10, 9] : (Math.random() > 0.3 ? [11, 10] : [9, 8]);
    const threatCol = getPlayerThreatColumn();

    for (const r of rowsToTry) {
      if (!isOccupied(threatCol, r)) return { col: threatCol, row: r };
      // Try adjacent column
      if (threatCol + 1 < COLS && !isOccupied(threatCol + 1, r)) return { col: threatCol + 1, row: r };
      if (threatCol - 1 >= 0 && !isOccupied(threatCol - 1, r)) return { col: threatCol - 1, row: r };
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 5. DOKTOR & MERCAN (Support / Healer) ===
  if (isHealerSupport) {
    // 2000+ & 4000+ Bot: Place directly behind bot's tanks or frontline fighters!
    if (botTrophies >= 2000) {
      const botFrontline = botUnits.filter(u => u.row >= 9);
      if (botFrontline.length > 0) {
        const lead = botFrontline[0];
        const behindRows = [Math.max(0, Math.round(lead.row) - 2), Math.max(0, Math.round(lead.row) - 3)];
        for (const r of behindRows) {
          const c = Math.round(lead.col);
          if (!isOccupied(c, r)) return { col: c, row: r };
          if (c + 1 < COLS && !isOccupied(c + 1, r)) return { col: c + 1, row: r };
          if (c - 1 >= 0 && !isOccupied(c - 1, r)) return { col: c - 1, row: r };
        }
      }
    }
    const rowsToTry = [7, 8, 6, 5];
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 6. EXTREME BACKLINE ARTILLERY / BUILDINGS (Sapancı, Buz Dolabı, Mezarlık) ===
  if (isExtremeBack) {
    // Keep them safely at rows 0-2
    const rowsToTry = [0, 1, 2];
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 7. SQUISHY RANGED (Okçu, Topçu, Bombalama, Kuş Ordusu, Tüfekçi) ===
  if (isSquishyRanged) {
    // NEVER put them in front row 11 where they get insta-killed! Put them in mid-back (6-9)
    const rowsToTry = [7, 8, 6, 9];
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 8. FAST MELEE / ASSASSINS (Samuray, Vampir, Balık, Kabile) ===
  if (isAssassinFast) {
    // Put them in rows 10-11, targeting player's exposed column
    const rowsToTry = [11, 10, 9];
    const threatCol = getPlayerThreatColumn();
    for (const r of rowsToTry) {
      if (!isOccupied(threatCol, r)) return { col: threatCol, row: r };
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // General fallback
  const fallbackRows = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  for (const r of fallbackRows) {
    const colOpt = findBestColInRow(r, true);
    if (colOpt !== null) return { col: colOpt, row: r };
  }

  // Absolute fallback
  for (let r = 0; r < RIVER_ROW; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isOccupied(c, r)) return { col: c, row: r };
    }
  }

  return { col: Math.floor(Math.random() * COLS), row: Math.floor(Math.random() * RIVER_ROW) };
}


interface Props {
  deck: string[];
  playerCardLevels?: Record<string, number>; // Added
  botDeckOverride?: string[] | null;
  playerEmojis?: [string, string, string, string];
  trophies: number;
  playerRankedStars?: number;
  playerAvatar?: string;
  playerColor?: string;
  playerFont?: string;
  opponentName: string;
  opponentAvatar?: string;
  opponentTrophies: number;
  opponentRankedStars?: number;
  opponentWins?: number;
  opponentTournamentWins?: number;
  battleId?: string;
  isPlayer1?: boolean;
  mode?: "standard" | "tournament" | "ranked";
  onFinish: (gold: number, trophy: number, win: boolean) => void;
  onExit: () => void;
  username: string; // Add this
}

const PLACE_SECONDS = 15;
const FIGHT_TIMEOUT = 60;

const RANKED_PREDEFINED_DECKS: Array<{ cards: string[] }> = [
  { cards: ["golem", "bombalama-ucagi", "hayalet", "tufekci"] }, // Tank & Area Control
  { cards: ["samuray", "kopek-baligi", "kus-ordusu", "kardan-adam"] }, // Fast Push
  { cards: ["dev-sinek", "ejder", "cehennem-ejderi", "mercan"] }, // Air Supremacy
  { cards: ["lav-kopegi", "volkan", "topcu", "zirhli"] }, // Heavy Burn
  { cards: ["golem", "buz-dolabi", "kurbaga", "madenci"] }, // Freeze & Strike
  { cards: ["bira-varili", "samuray", "tufekci", "dev"] }, // Pure Damage
  { cards: ["hayalet", "madenci", "balik", "cig"] }, // Annoying Tactics
  { cards: ["zirhli", "bira-varili", "mercan", "kilicli"] }, // High Sustain
  { cards: ["lav-kopegi", "buz-dolabi", "cehennem-ejderi", "kardan-adam"] }, // Fire & Ice
  { cards: ["samuray", "bombalama-ucagi", "dev", "golem"] } // Meta Meta
];

export function BattleScreen({ 
  deck, 
  playerCardLevels = {}, 
  botDeckOverride, 
  playerEmojis = ["", "", "", ""], 
  trophies, 
  playerRankedStars = 0,
  playerAvatar,
  playerColor,
  playerFont,
  opponentName, 
  opponentAvatar,
  opponentTrophies, 
  opponentRankedStars, 
  opponentWins, 
  opponentTournamentWins, 
  battleId, 
  isPlayer1, 
  mode = "standard", 
  onFinish, 
  onExit, 
  username 
}: Props) {
  const arena = arenaForTrophies(trophies);
  const oppWinsMax = Math.max(opponentWins ?? 0, opponentTournamentWins ?? 0);
  const resolvedPlayerAvatar = playerAvatar || getAvatarForName(username);
  const resolvedOpponentAvatar = opponentAvatar || getAvatarForName(opponentName);
  const playerColorClass = PROFILE_COLORS.find((c) => c.value === playerColor)?.class || "text-slate-100";
  const playerFontClass = playerFont || "font-display";
  const playerCards = useMemo(
    () => deck.map((id) => CARDS.find((c) => c.id === id)!).filter(Boolean),
    [deck],
  );
  const [selectedPredefinedDeck] = useState(() => {
    if (mode === "ranked") {
      const idx = Math.floor(Math.random() * RANKED_PREDEFINED_DECKS.length);
      return RANKED_PREDEFINED_DECKS[idx];
    }
    return null;
  });
  const [botTrophies] = useState(() => makeOpponentTrophies(trophies));
  const [opponentCardLevels, setOpponentCardLevels] = useState<Record<string, number>>({});
  const [botDeck, setBotDeck] = useState<CardDef[]>(() => {
    let cards: CardDef[] = [];
    if (botDeckOverride) {
      cards = botDeckOverride.map(id => typeof id === "string" ? CARDS.find(c => c.id === id)! : id).filter(Boolean) as CardDef[];
    } else if (mode === "ranked" && selectedPredefinedDeck) {
      cards = selectedPredefinedDeck.cards.map(id => CARDS.find(c => c.id === id)!).filter(Boolean);
      const rand = Math.random();
      if (rand < 0.4) {
        // 40% chance to swap cards
        const swaps = rand < 0.1 ? 2 : 1; // 10% chance for 2 swaps, 30% chance for 1 swap
        const availableCards = CARDS.filter(c => !cards.some(hc => hc.id === c.id));
        for (let i = 0; i < swaps && availableCards.length > 0; i++) {
          const swapIdx = Math.floor(Math.random() * cards.length);
          const newCardIdx = Math.floor(Math.random() * availableCards.length);
          cards[swapIdx] = availableCards[newCardIdx];
          availableCards.splice(newCardIdx, 1);
        }
      }
    } else {
      cards = battleId ? [] : makeBotDeck(arena);
    }
    // Safeguard: swap Doktor out for bots
    return cards.map(c => {
      if (c && c.id === "doktor") {
        return CARDS.find(x => x.id === "mercan") || CARDS.find(x => x.id === "kilicli")!;
      }
      return c;
    });
  });

  useEffect(() => {
    if (battleId && opponentDeckRef.current.length > 0) {
        const rawDeck = opponentDeckRef.current;
        const cleaned = rawDeck.map(c => {
          if (c && c.id === "doktor") {
            return CARDS.find(x => x.id === "mercan") || CARDS.find(x => x.id === "kilicli")!;
          }
          return c;
        });
        setBotDeck(cleaned);
    }
  }, [battleId]);

  const [phase, setPhase] = useState<Phase>("placing");
  const [selected, setSelected] = useState(0);
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());
  const stateRef = useRef<BattleState>(makeInitialState());
  stateRef.current.arenaId = arena.id;
  stateRef.current.botTrophies = opponentTrophies;

  const playerDeckCost = useMemo(() => {
    return deck.reduce((acc, id) => {
      const card = CARDS.find(c => c.id === id);
      return acc + (card ? card.stoneCost : 0);
    }, 0);
  }, [deck]);

  const botDeckCost = useMemo(() => {
    return botDeck.reduce((acc, card) => {
      return acc + (card ? card.stoneCost : 0);
    }, 0);
  }, [botDeck]);

  useEffect(() => {
    stateRef.current.playerAbilityStones = Math.max(0, 20 - playerDeckCost);
    stateRef.current.botAbilityStones = Math.max(0, 20 - botDeckCost);
  }, [playerDeckCost, botDeckCost]);

  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);
  const rafRef = useRef<number | null>(null);
  const [rewards, setRewards] = useState<{ gold: number; trophy: number } | null>(null);
  const [winner, setWinner] = useState<"player" | "bot" | null>(null);

  const getAdjustedRewards = (win: boolean) => {
    return computeRewards(win, trophies, opponentTrophies, mode, deck, playerCardLevels);
  };

  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  const opponentDeckRef = useRef<string[]>([]);
  const isBotFallbackRef = useRef(false);
  const opponentPlacementsRef = useRef<any[]>([]);
  const myPlacementsRef = useRef<any[]>([]);
  const triggeredOpponentAbilitiesRef = useRef<Set<string>>(new Set());
  
  const triggeredOpponentEmojisRef = useRef<Set<string>>(new Set());
  const [displayedPlayerEmoji, setDisplayedPlayerEmoji] = useState<{ emoji: string, timestamp: number } | null>(null);
  const [displayedOpponentEmoji, setDisplayedOpponentEmoji] = useState<{ emoji: string, timestamp: number } | null>(null);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  useEffect(() => {
    if (displayedPlayerEmoji) {
      const t = setTimeout(() => setDisplayedPlayerEmoji(null), 3000);
      return () => clearTimeout(t);
    }
  }, [displayedPlayerEmoji]);

  useEffect(() => {
    if (displayedOpponentEmoji) {
      const t = setTimeout(() => setDisplayedOpponentEmoji(null), 3000);
      return () => clearTimeout(t);
    }
  }, [displayedOpponentEmoji]);

  useEffect(() => {
    stateRef.current.battleId = battleId || undefined;
    stateRef.current.isPlayer1 = isPlayer1;
  }, [battleId, isPlayer1]);

  const [placeTimer, setPlaceTimer] = useState(PLACE_SECONDS);
  const placedBotRef = useRef(0);

  const handleReadyUp = async () => {
    if (isReady) return;
    setIsReady(true);

    // Auto-fill player's missing cards if any are unplaced
    playerCards.forEach(c => {
      const isPlaced = stateRef.current.units.some(u => u.side === "player" && (
        u.card.id === c.id || 
        (c.id === "kus-ordusu" && u.card.id.startsWith("kus-ordusu")) ||
        (c.id === "karinca-ordusu" && u.card.id.startsWith("karinca-")) ||
        (c.id === "kabile" && u.card.id.startsWith("kabile-"))
      ));
      if (!isPlaced) {
        let cCol: number; let rCol: number; let attempts = 0;
        do {
          cCol = Math.floor(Math.random() * COLS);
          if (c.id === "madenci") { rCol = Math.floor(Math.random() * ROWS); if (rCol === RIVER_ROW) rCol = RIVER_ROW + 1; }
          else { rCol = RIVER_ROW + 1 + Math.floor(Math.random() * (ROWS - RIVER_ROW - 1)); }
          attempts++;
        } while (attempts < 20 && stateRef.current.units.some(u => Math.round(u.col) === cCol && Math.round(u.row) === rCol));
        const lvl = playerCardLevels[c.id] ?? 1;
        spawnUnit(stateRef.current, c, "player", cCol, rCol, lvl);
      }
    });
    setPlacedIds(new Set(playerCards.map(c => c.id)));
    rerender();

    if (!battleId) {
      // Force cancel matchmaking just in case
      cancelMatchmaking(username).catch(console.error);

      // Auto fill remaining bot cards just in case
      while (placedBotRef.current < 4) {
        const i = placedBotRef.current;
        const card = botDeck[i];
        const coords = getBotPlacementCoordinate(card, stateRef.current.units, arena.id, mode, opponentTrophies);
        const col = coords.col;
        const row = coords.row;
        const lvl = opponentCardLevels[card.id] ?? playerCardLevels[card.id] ?? 1;
        spawnUnit(stateRef.current, card, "bot", col, row, lvl);
        placedBotRef.current++;
      }
      startFight();
    } else {
      const placements = stateRef.current.units.filter(u => u.side === "player" && (
        (!u.card.id.startsWith("kus-ordusu") || u.card.id === "kus-ordusu-bird-0") &&
        (!u.card.id.startsWith("karinca-") || u.card.id === "karinca-0") &&
        (!u.card.id.startsWith("kabile-") || u.card.id === "kabile-member-0")
      )).map(u => ({
        cardId: u.card.id.startsWith("kus-ordusu") ? "kus-ordusu" : (u.card.id.startsWith("karinca-") ? "karinca-ordusu" : (u.card.id.startsWith("kabile-") ? "kabile" : u.card.id)),
        col: u.col,
        row: u.row
      }));
      
      const bRef = doc(db, "battles", battleId);
      if (isPlayer1) {
        await updateDoc(bRef, {
          player1Placements: placements,
          player1Ready: true
        });
      } else {
        await updateDoc(bRef, {
          player2Placements: placements,
          player2Ready: true
        });
      }
    }
  };

  // simple interval for placement timer
  useEffect(() => {
    if (phase !== "placing") return;
    const id = setInterval(() => {
      setPlaceTimer(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Handle timer ticks and auto-placement
  useEffect(() => {
    if (phase !== "placing") return;

    if (!battleId) {
       // Auto place bot units progressively
       const elapsed = PLACE_SECONDS - placeTimer;
       const targetPlaced = Math.min(4, Math.floor(elapsed / Math.max(1, Math.floor(PLACE_SECONDS / 4))));
       while (placedBotRef.current < targetPlaced) {
         const i = placedBotRef.current;
         const card = botDeck[i];
         const coords = getBotPlacementCoordinate(card, stateRef.current.units, arena.id, mode, opponentTrophies);
         const col = coords.col;
         const row = coords.row;
         const lvl = opponentCardLevels[card.id] ?? playerCardLevels[card.id] ?? 1;
         spawnUnit(stateRef.current, card, "bot", col, row, lvl);
         placedBotRef.current++;
       }
       // Update UI after bot places
       if (placeTimer > 0) rerender();
    }

    if (placeTimer === 0 && !isReady) {
       // Timer is up! Auto-ready up
       handleReadyUp();
    }
  }, [placeTimer, phase, battleId, botDeck, isReady]);

  useEffect(() => {
    if (phase !== "placing" || !isReady || !battleId) return;

    if (placeTimer === 0 && !opponentReady && !startedRef.current) {
        isBotFallbackRef.current = true;
        startedRef.current = true;

        // Fallback opponent to bot
        // 1. Spawning already-placed opponent units
        const oppPlacements = opponentPlacementsRef.current || [];
        oppPlacements.forEach((p: any) => {
          const card = CARDS.find((c) => c.id === p.cardId);
          if (card) {
            const r = ROWS - 1 - p.row;
            const c = COLS - 1 - p.col;
            if (!stateRef.current.units.some(u => u.side === "bot" && Math.round(u.col) === c && Math.round(u.row) === r)) {
              const lvl = opponentCardLevels[card.id] ?? playerCardLevels[card.id] ?? 1;
              spawnUnit(stateRef.current, card, "bot", c, r, lvl);
            }
          }
        });

        // 2. Fallback deck if opponent hasn't loaded their deck
        const oppDeckIds = (opponentDeckRef.current && opponentDeckRef.current.length > 0)
          ? opponentDeckRef.current
          : (botDeck && botDeck.length > 0 ? botDeck : ["mizrakli", "kilicli", "okcu", "dev"]);
        const oppCards = oppDeckIds.map((id: any) => typeof id === "string" ? CARDS.find(c => c.id === id) : id).filter(Boolean) as CardDef[];

        // 3. Fill up remaining unplaced units
        const spawnedBotCardIds = stateRef.current.units
          .filter(u => u.side === "bot")
          .map(u => u.card.id.startsWith("kus-ordusu") ? "kus-ordusu" : (u.card.id.startsWith("karinca-") ? "karinca-ordusu" : (u.card.id.startsWith("kabile-") ? "kabile" : u.card.id)));

        const unplacedOppCards = oppCards.filter(card => !spawnedBotCardIds.includes(card.id));

        unplacedOppCards.forEach(card => {
          const coords = getBotPlacementCoordinate(card, stateRef.current.units, arena.id, mode, opponentTrophies);
          const col = coords.col;
          const row = coords.row;
          const lvl = opponentCardLevels[card.id] ?? playerCardLevels[card.id] ?? 1;
          spawnUnit(stateRef.current, card, "bot", col, row, lvl);
        });

        // 4. Force spawn our player units if they somehow missed spawning
        const myPlacements = myPlacementsRef.current || [];
        if (!stateRef.current.units.some(u => u.side === "player")) {
          if (myPlacements.length > 0) {
            myPlacements.forEach((p: any) => {
              const card = CARDS.find(c => c.id === p.cardId);
              if (card) {
                const lvl = playerCardLevels[card.id] ?? 1;
                spawnUnit(stateRef.current, card, "player", p.col, p.row, lvl);
              }
            });
          } else {
            // Absolute fallback for player side too just in case
            playerCards.forEach(c => {
              let cCol: number; let rCol: number; let attempts = 0;
              do {
                cCol = Math.floor(Math.random() * COLS);
                rCol = RIVER_ROW + 1 + Math.floor(Math.random() * (ROWS - RIVER_ROW - 1));
                attempts++;
              } while (attempts < 20 && stateRef.current.units.some(u => Math.round(u.col) === cCol && Math.round(u.row) === rCol));
              const lvl = playerCardLevels[c.id] ?? 1;
              spawnUnit(stateRef.current, c, "player", cCol, rCol, lvl);
            });
          }
        }

        startFight();
        rerender();
    }
  }, [placeTimer, phase, isReady, opponentReady, battleId, botDeck, playerCards]);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!battleId) return;
    const unsub = onSnapshot(doc(db, "battles", battleId), (d) => {
      if (d.exists()) {
        const data = d.data();

        // Sync real-time opponent ability clicks
        const oppAbilities: any[] = isPlayer1 ? (data.player2Abilities || []) : (data.player1Abilities || []);
        oppAbilities.forEach((item: any) => {
          const { cardId, simTime } = item;
          const key = `${cardId}_${simTime}`;
          if (!triggeredOpponentAbilitiesRef.current.has(key)) {
            triggeredOpponentAbilitiesRef.current.add(key);
            if (stateRef.current.pendingOpponentAbilities) {
              stateRef.current.pendingOpponentAbilities.set(cardId, simTime);
            }
          }
        });

        // Sync real-time opponent emojis
        const oppEmojis: any[] = isPlayer1 ? (data.player2Emojis || []) : (data.player1Emojis || []);
        oppEmojis.forEach((item: any) => {
          const { emoji, simTime } = item;
          const key = `${emoji}_${simTime}`;
          if (!triggeredOpponentEmojisRef.current.has(key)) {
            triggeredOpponentEmojisRef.current.add(key);
            setDisplayedOpponentEmoji({ emoji, timestamp: Date.now() });
          }
        });

        if (data.winner && !winner) {
            const didIWin = isPlayer1 ? (data.winner === "player1") : (data.winner === "player2");
            setWinner(didIWin ? "player" : "bot");
            const r = getAdjustedRewards(didIWin);
            setRewards(r); setPhase("done");
        }

        const myPlacements = isPlayer1 ? data.player1Placements : data.player2Placements;
        const oppPlacements = isPlayer1 ? data.player2Placements : data.player1Placements;
        
        if (myPlacements) {
          myPlacementsRef.current = myPlacements;
        }

        const oppData = isPlayer1 ? data.player2 : data.player1;
        if (data.mode === "tournament") {
          const oppDraft = isPlayer1 ? data.player2Draft : data.player1Draft;
          if (oppDraft && oppDraft.length > 0) {
            opponentDeckRef.current = oppDraft;
          }
        } else if (oppData && oppData.deck) {
          opponentDeckRef.current = oppData.deck;
        }

        const myReady = isPlayer1 ? !!data.player1Ready : !!data.player2Ready;
        const oppReady = isPlayer1 ? !!data.player2Ready : !!data.player1Ready;
        
        setIsReady(myReady);

        if (oppPlacements) {
          opponentPlacementsRef.current = oppPlacements;
        }
        setOpponentReady(!!oppReady);

        if (myReady && oppReady) {
          // both ready, start
          if (!startedRef.current) {
            startedRef.current = true;
            // safeguard: make sure our own units are loaded if this was a fresh load
            if (myPlacements && !stateRef.current.units.some(u => u.side === "player")) {
              myPlacements.forEach((p: any) => {
                const card = CARDS.find(c => c.id === p.cardId);
                if (card) {
                  const lvl = playerCardLevels[card.id] ?? 1;
                  spawnUnit(stateRef.current, card, "player", p.col, p.row, lvl);
                }
              });
            }
            // spawn opponent units
            if (oppPlacements) {
              oppPlacements.forEach((p: any) => {
                const card = CARDS.find(c => c.id === p.cardId);
                if (card) {
                  const r = ROWS - 1 - p.row;
                  const c = COLS - 1 - p.col;
                  const lvl = opponentCardLevels[card.id] ?? playerCardLevels[card.id] ?? 1;
                  spawnUnit(stateRef.current, card, "bot", c, r, lvl);
                }
              });
            }
            startFight();
          }
        }
      }
    });
    return unsub;
  }, [battleId, phase, isPlayer1]);

  const placeAt = (col: number, row: number) => {
    if (phase !== "placing") return;
    const card = playerCards[selected];
    if (!card || placedIds.has(card.id)) return;
    
    // Prevent stacking cards
    if (stateRef.current.units.some(u => Math.round(u.col) === col && Math.round(u.row) === row)) {
      return; 
    }

    const lvl = playerCardLevels[card.id] ?? 1;
    spawnUnit(stateRef.current, card, "player", col, row, lvl);
    const next = new Set(placedIds);
    next.add(card.id);
    setPlacedIds(next);
    for (let i = 1; i <= playerCards.length; i++) {
      const idx = (selected + i) % playerCards.length;
      if (!next.has(playerCards[idx].id)) { setSelected(idx); break; }
    }
    rerender();

    if (next.size === 4) {
      handleReadyUp();
    } else if (battleId) {
      const placements = stateRef.current.units.filter(u => u.side === "player" && (
        (!u.card.id.startsWith("kus-ordusu") || u.card.id === "kus-ordusu-bird-0") &&
        (!u.card.id.startsWith("karinca-") || u.card.id === "karinca-0") &&
        (!u.card.id.startsWith("kabile-") || u.card.id === "kabile-member-0")
      )).map(u => ({
        cardId: u.card.id.startsWith("kus-ordusu") ? "kus-ordusu" : (u.card.id.startsWith("karinca-") ? "karinca-ordusu" : (u.card.id.startsWith("kabile-") ? "kabile" : u.card.id)),
        col: u.col,
        row: u.row
      }));
      submitPlacements(battleId, isPlayer1!, placements);
    }
  };

  const startFight = () => {
    setPhase("fighting");
    let last = performance.now();
    let accumulator = 0;
    const FIXED_DT = 0.02;

    const loop = () => {
      const now = performance.now();
      const frameTime = Math.min(0.1, (now - last) / 1000);
      last = now;
      accumulator += frameTime;

      while (accumulator >= FIXED_DT) {
        tickBattle(stateRef.current, FIXED_DT);
        accumulator -= FIXED_DT;
      }

      rerender();
      if (stateRef.current.winner) {
        const w = stateRef.current.winner;
        if (battleId && !isBotFallbackRef.current) {
            const dbWinner = w === "player" ? "player1" : "player2";
            updateDoc(doc(db, "battles", battleId), { winner: dbWinner }).catch(() => {});
        }
        if (!winner) {
            setWinner(w);
            const r = getAdjustedRewards(w === "player");
            setRewards(r); setPhase("done");
        }
        return;
      }
      if (stateRef.current.time > FIGHT_TIMEOUT) {
        const pHp = stateRef.current.units.filter((u) => u.side === "player").reduce((s, u) => s + u.hp, 0);
        const bHp = stateRef.current.units.filter((u) => u.side === "bot").reduce((s, u) => s + u.hp, 0);
        const w = pHp >= bHp ? "player" : "bot";
        if (battleId && !isBotFallbackRef.current) {
            const dbWinner = w === "player" ? "player1" : "player2";
            updateDoc(doc(db, "battles", battleId), { winner: dbWinner }).catch(() => {});
        }
        if (!winner) {
            setWinner(w);
            const r = getAdjustedRewards(w === "player");
            setRewards(r); setPhase("done");
        }
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 z-40 flex flex-col bg-black w-full max-w-md shadow-2xl border-x border-slate-900">
      {/* header */}
      <div className="flex items-center justify-between gap-2 bg-slate-950/90 border-b border-slate-800 px-3 py-2 text-white shrink-0 shadow-md">
        {/* Player Profile (Left - Blue Side) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-8 h-8 rounded-full bg-slate-900 border-2 border-blue-500/80 flex items-center justify-center text-lg shadow-sm shrink-0">
            {resolvedPlayerAvatar}
          </span>
          <div className="min-w-0 text-left">
            <div className={cn("text-xs font-bold truncate flex items-center gap-1 leading-tight", playerFontClass, playerColorClass)}>
              <span>{username}</span>
              {username.toLowerCase() === "dgoa" && <span>🛠️</span>}
            </div>
            <div className="text-[10px] text-blue-300 font-medium flex items-center gap-1 leading-tight">
              {mode === "ranked" ? (
                <span>{playerRankedStars ?? 0} ⭐</span>
              ) : (
                <span>{trophies} 🏆</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Timer / VS */}
        <div className="text-center shrink-0 px-1.5 flex flex-col items-center justify-center">
          <div className="font-display text-sm sm:text-base font-bold text-amber-300 drop-shadow">
            {phase === "placing"
              ? `⏱ ${placeTimer}s`
              : phase === "fighting"
              ? `⚔ ${Math.max(0, FIGHT_TIMEOUT - Math.floor(stateRef.current.time))}s`
              : "—"}
          </div>
          <div className="text-[8.5px] text-slate-400 font-mono uppercase tracking-wider leading-none">
            {phase === "placing" ? "Yerleştirme" : phase === "fighting" ? "Savaş" : "Bitti"}
          </div>
        </div>

        {/* Opponent Profile (Right - Red Side) */}
        <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate flex items-center justify-end gap-1 font-display leading-tight">
              <span>{opponentName}</span>
              {opponentName.toLowerCase() === "dgoa" && <span>🛠️</span>}
            </div>
            <div className="text-[10px] text-red-300 font-medium flex items-center justify-end gap-1 leading-tight">
              {mode === "ranked" ? (
                <span>{opponentRankedStars ?? 0} ⭐</span>
              ) : (
                <span>{opponentTrophies} 🏆</span>
              )}
            </div>
          </div>
          <span className="w-8 h-8 rounded-full bg-slate-900 border-2 border-red-500/80 flex items-center justify-center text-lg shadow-sm shrink-0">
            {resolvedOpponentAvatar}
          </span>
        </div>
      </div>

      {/* arena fills */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ArenaView
          arena={arena}
          state={
            phase === "placing" && mode === "ranked"
              ? { ...stateRef.current, units: stateRef.current.units.filter(u => u.side !== "bot") }
              : stateRef.current
          }
          onPlace={phase === "placing" ? placeAt : undefined}
          selectedCardId={playerCards[selected]?.id}
          mode={mode}
        />

        {/* Display Opponent Emoji */}
        {displayedOpponentEmoji && (
          <div key={`opp_${displayedOpponentEmoji.timestamp}`} className="absolute top-12 right-6 bg-slate-900 border-2 border-slate-700 shadow-xl rounded-2xl px-4 py-2 text-4xl animate-bounce z-50 transform origin-bottom-right">
            {displayedOpponentEmoji.emoji}
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-slate-900 border-l-2 border-b-2 border-slate-700 transform rotate-45"></div>
          </div>
        )}

        {/* Display Player Emoji */}
        {displayedPlayerEmoji && (
          <div key={`player_${displayedPlayerEmoji.timestamp}`} className="absolute bottom-12 left-6 bg-slate-900 border-2 border-slate-700 shadow-xl rounded-2xl px-4 py-2 text-4xl animate-bounce z-50 transform origin-top-left">
            {displayedPlayerEmoji.emoji}
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-slate-900 border-r-2 border-b-2 border-slate-700 transform rotate-45"></div>
          </div>
        )}
      </div>

      {/* bottom: cards & abilities */}
      {phase === "placing" && (
        <div className="bg-black/80 p-2">
          {battleId && isReady ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="text-amber-300 font-bold mb-2 animate-pulse">
                {placeTimer > 0 ? "Hazırsın! Rakip bekleniyor..." : "Süre doldu, rakip bekleniyor..."}
              </div>
              {opponentReady && <div className="text-emerald-400 text-sm font-semibold">Rakip hazır! Savaş başlıyor...</div>}
            </div>
          ) : (
            <>
              <div className="text-center text-[11.5px] text-amber-200/90 mb-1.5 font-medium leading-none">
                Kart seç ve alanına dokun ({placedIds.size}/4) — {battleId ? (opponentReady ? "Rakip hazır! 👍" : "Rakip yerleştiriyor... ⏳") : "Bot yerleştiriyor..."}
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {playerCards.map((c, i) => {
                  const isPlaced = placedIds.has(c.id);
                  return (
                    <button
                      key={`${c.id}_${i}`}
                      disabled={isPlaced}
                      onClick={() => setSelected(i)}
                      className={cn(
                        "relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all duration-200",
                        selected === i && !isPlaced ? "border-amber-300 scale-102 shadow-[0_0_10px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/40" : "border-black/40",
                        isPlaced && "opacity-30 scale-95 grayscale",
                      )}
                      style={{ background: "linear-gradient(180deg,#3b4a72,#1f2940)" }}
                    >
                      <span className="flex items-center justify-center text-3.5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{c.emoji}</span>
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-center text-[9px] text-white py-0.5 leading-none font-display font-medium">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {phase === "fighting" && (
        <div className="bg-slate-950/95 border-t border-slate-900 p-2">
          <div className="text-center text-[10px] font-display text-amber-300 mb-1.5 tracking-wide font-medium flex items-center justify-center gap-2">
            <span>⚡ ACTIVE SPECIAL ABILITIES (CLICK) ⚡</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2 py-0.5 rounded-full text-[9px] font-mono">
              💎 Stone: {stateRef.current.playerAbilityStones ?? 0}
            </span>
          </div>
          {(() => {
            const playerAbilityUnits = stateRef.current.units.filter((u) => {
              if (u.side !== "player" || u.hp <= 0) return false;
              return ["hayalet", "doktor", "bira-varili", "bombalama-ucagi", "zirhli", "kurbaga", "lav-kopegi", "samuray", "cig", "vampir", "lanet"].includes(u.card.id);
            });

            return (
              <div className="flex gap-2 items-stretch" style={{ minHeight: "60px" }}>
                {playerAbilityUnits.length === 0 ? (
                  <div className="flex-1 text-center text-[10px] text-slate-500 py-3 font-sans italic flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                    No live unit with active ability on the battlefield.
                  </div>
                ) : (
                  <div className="flex-1 flex flex-wrap justify-center items-center gap-4 py-1.5 max-h-[100px] overflow-y-auto">
                    {playerAbilityUnits.map((u) => {
                      let statusText: string | null = null;
                      let isDisabled = false;

                      if (u.card.id === "doktor") {
                        const uses = u.doktorUsesLeft ?? 3;
                        if (uses <= 0) {
                          statusText = "0/3";
                          isDisabled = true;
                        } else {
                          statusText = `${uses}/3`;
                        }
                      } else if (u.card.id === "hayalet") {
                        const isImmune = (u.immuneTimeLeft ?? 0) > 0;
                        if (isImmune) {
                          statusText = `${u.immuneTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        } else if (u.immuneTimeLeft !== undefined) {
                          statusText = "✓";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "zirhli") {
                        const isDefending = (u.zirhliDefendingTimeLeft ?? 0) > 0;
                        if (isDefending) {
                          statusText = `${u.zirhliDefendingTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        } else if (u.zirhliDefendingTimeLeft !== undefined) {
                          statusText = "✓";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "bira-varili") {
                        const isBoosted = (u.barrelAuraBoostTimeLeft ?? 0) > 0;
                        if (isBoosted) {
                          statusText = `${u.barrelAuraBoostTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        } else if (u.barrelAuraBoostTimeLeft !== undefined) {
                          statusText = "✓";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "bombalama-ucagi") {
                        const uses = u.bomberUsesLeft ?? 0;
                        if (uses <= 0) {
                          statusText = "✓";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "kurbaga") {
                        const isSwallowed = (u.swallowedTimeLeft ?? 0) > 0;
                        if (isSwallowed) {
                          statusText = `${u.swallowedTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        } else if (u.swallowedTimeLeft !== undefined) {
                          statusText = "✓";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "lav-kopegi") {
                        const isBurningActive = (u.lavKopegiAbilityTimeLeft ?? 0) > 0;
                        if (isBurningActive) {
                          statusText = `${u.lavKopegiAbilityTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        } else if (u.lavKopegiAbilityUsed) {
                          statusText = "✓";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "samuray") {
                        if (u.samurayAbilityActive) {
                          statusText = "2x Damage";
                          isDisabled = true;
                        }
                      } else if (u.card.id === "vampir") {
                        const isInvis = (u.vampirInvisTimeLeft ?? 0) > 0;
                        if (isInvis) {
                          statusText = `${u.vampirInvisTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        }
                      } else if (u.card.id === "cig") {
                        if (u.cigTriggered) {
                          statusText = "✓";
                          isDisabled = true;
                        } else {
                          statusText = "🏔️";
                        }
                      } else if (u.card.id === "lanet") {
                        const isCurseActive = (stateRef.current.lanetTimeLeft ?? 0) > 0;
                        if (isCurseActive) {
                          statusText = `${stateRef.current.lanetTimeLeft!.toFixed(1)}s`;
                          isDisabled = true;
                        }
                      }

                      const stoneCost = getAbilityStoneCost(u.card.id);
                      const hasEnoughStones = (stateRef.current.playerAbilityStones ?? 0) >= stoneCost;
                      const buttonDisabled = isDisabled || !hasEnoughStones;

                      return (
                        <div key={u.uid} className="relative flex items-center gap-1.5 bg-slate-900/40 p-1 rounded-full border border-slate-800/40">
                          <button
                            disabled={buttonDisabled}
                            onClick={() => {
                              triggerUnitAbility(u, stateRef.current);
                              rerender();
                              if (battleId) {
                                submitAbilityTrigger(battleId, !!isPlayer1, u.card.id, stateRef.current.time)
                                  .catch(console.error);
                              }
                            }}
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all relative",
                              buttonDisabled
                                ? "bg-slate-950 border-slate-800 opacity-65 text-slate-500 scale-95"
                                : "bg-gradient-to-b from-amber-500/10 to-amber-600/30 border-amber-500/80 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse"
                            )}
                          >
                            <span>{u.card.emoji}</span>
                            <div className="absolute -top-1 -left-1 bg-sky-500 text-slate-950 font-mono font-extrabold text-[8px] rounded-full w-4 h-4 flex items-center justify-center border border-slate-950 shadow" title={`Required Stone: ${stoneCost}`}>
                              {stoneCost}
                            </div>
                            {isDisabled && statusText === "✓" && (
                              <div className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold border border-slate-950 shadow">
                                ✓
                              </div>
                            )}
                          </button>
                          
                          {statusText && statusText !== "✓" && (
                            <div className="bg-slate-950/90 border border-amber-500/55 rounded-full px-2 py-0.5 text-[9px] font-bold font-mono text-amber-300 shadow shadow-amber-500/20 animate-pulse whitespace-nowrap mr-1">
                              ⏱️ {statusText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {playerEmojis.some(e => !!e) && (
                  <div className="relative shrink-0 flex">
                    <button 
                      onClick={() => setShowEmojiMenu(!showEmojiMenu)} 
                      className="px-3 rounded-xl border-2 border-slate-700 bg-slate-800 shadow shadow-black flex items-center justify-center text-3xl hover:bg-slate-700 active:scale-95 transition-transform"
                    >
                      💬
                    </button>
                    {showEmojiMenu && (
                      <div className="absolute bottom-full right-8 mb-3 bg-slate-900 border-2 border-slate-700 rounded-2xl py-3 pr-20 pl-8 grid grid-cols-4 gap-16 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                        {playerEmojis.map((emoji, i) => (
                          <button 
                            key={i} 
                            onClick={emoji ? () => {
                              setDisplayedPlayerEmoji({ emoji, timestamp: Date.now() });
                              setShowEmojiMenu(false);
                              if (battleId) submitEmoji(battleId, !!isPlayer1, emoji, Date.now()).catch(console.error);
                            } : undefined}
                            className={cn(
                              "w-16 h-16 flex items-center justify-center text-3xl rounded-xl border-2 transition-all shadow-inner",
                              emoji 
                                ? "bg-slate-800 border-slate-600 hover:bg-slate-700 hover:scale-105" 
                                : "bg-slate-950/50 border-slate-800 opacity-50 cursor-not-allowed"
                            )}
                          >
                            {emoji || "?"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {phase === "done" && rewards && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md panel-3d rounded-2xl p-4 text-center text-white">
            <div className="text-stroke font-display text-3xl">
              {winner === "player" ? "ZAFER! 🏆" : "BOZGUN 💀"}
            </div>
            
            {/* Matchup Avatars */}
            <div className="flex items-center justify-center gap-4 my-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex flex-col items-center">
                <span className="w-10 h-10 rounded-full bg-slate-950 border-2 border-blue-500/80 flex items-center justify-center text-xl shadow">
                  {resolvedPlayerAvatar}
                </span>
                <span className={cn("text-[11px] font-bold mt-1 max-w-[85px] truncate", playerFontClass, playerColorClass)}>{username}</span>
              </div>
              <span className="text-sm font-black text-amber-400 font-display">VS</span>
              <div className="flex flex-col items-center">
                <span className="w-10 h-10 rounded-full bg-slate-950 border-2 border-red-500/80 flex items-center justify-center text-xl shadow">
                  {resolvedOpponentAvatar}
                </span>
                <span className="text-[11px] font-bold text-slate-200 mt-1 max-w-[85px] truncate font-display">{opponentName}</span>
              </div>
            </div>
            {mode === "tournament" ? (
              <div className="mt-2 flex flex-col items-center justify-center gap-1 font-display">
                <div className="text-xl text-emerald-300">
                  {winner === "player" ? "+1 Galibiyet" : "1 Mağlubiyet"}
                </div>
                <div className={cn("text-sm font-sans font-bold px-3 py-0.5 rounded-full border", winner === "player" ? "text-yellow-300 bg-yellow-500/20 border-yellow-400/30" : "text-cyan-300 bg-cyan-500/20 border-cyan-400/30")}>
                  {winner === "player" ? "+10 XP 🌟 (Destedeki Kartlar)" : "+5 XP 🌟 (Destedeki Kartlar)"}
                </div>
              </div>
            ) : mode === "ranked" ? (
              <div className="mt-2 flex flex-col items-center justify-center gap-1 font-display">
                <div className="flex items-center justify-center gap-3 text-lg">
                  <span className={cn(rewards.trophy >= 0 ? "text-cyan-300" : "text-red-400")}>
                    {rewards.trophy >= 0 ? "+" : ""}{rewards.trophy > 0 ? 1 : -1} ⭐
                  </span>
                  <span className="text-yellow-200">+{rewards.gold} 🪙</span>
                </div>
                <div className={cn("text-sm font-sans font-bold px-3 py-0.5 rounded-full border", winner === "player" ? "text-yellow-300 bg-yellow-500/20 border-yellow-400/30" : "text-cyan-300 bg-cyan-500/20 border-cyan-400/30")}>
                  {winner === "player" ? "+10 XP 🌟 (Destedeki Kartlar)" : "+5 XP 🌟 (Destedeki Kartlar)"}
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center justify-center gap-1 font-display">
                <div className="flex items-center justify-center gap-3 text-lg">
                  <span className={cn(rewards.trophy >= 0 ? "text-amber-300" : "text-red-400")}>
                    {rewards.trophy >= 0 ? "+" : ""}{rewards.trophy} 🏆
                  </span>
                  <span className="text-yellow-200">+{rewards.gold} 🪙</span>
                </div>
                <div className={cn("text-sm font-sans font-bold px-3 py-0.5 rounded-full border", winner === "player" ? "text-yellow-300 bg-yellow-500/20 border-yellow-400/30" : "text-cyan-300 bg-cyan-500/20 border-cyan-400/30")}>
                  {winner === "player" ? "+10 XP 🌟 (Destedeki Kartlar)" : "+5 XP 🌟 (Destedeki Kartlar)"}
                </div>
              </div>
            )}
            <button
              onClick={() => { onFinish(rewards.gold, rewards.trophy, winner === "player"); onExit(); }}
              className="mt-3 w-full rounded-2xl py-3 font-display text-xl text-stroke text-primary-foreground btn-pop active:btn-pop-active"
            >
              Devam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
