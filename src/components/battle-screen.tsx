import { useEffect, useMemo, useRef, useState } from "react";
import type { CardDef } from "@/lib/cards";
import { CARDS } from "@/lib/cards";
import { CHARMS } from "@/lib/charms";
import { arenaForTrophies, getRankForTrophies } from "@/lib/arenas";
import { ArenaView } from "./arena-view";
import { db } from "@/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { submitPlacements, submitAbilityTrigger, submitEmoji, BattlePlacement, cancelMatchmaking } from "@/lib/matchmaking";
import { cn, getAvatarForName } from "@/lib/utils";
import { AnimatedEmoji } from "./animated-emoji";
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
  applyCombatDamage,
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

  const isRankedMode = mode === "ranked";
  const isMasterTier = isRankedMode || botTrophies >= 3000;
  const isMediumTier = isMasterTier || botTrophies >= 1000;
  const isEasyTier = !isMasterTier && botTrophies < 500;

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

  // === 1. MADENCI (Miner placement) ===
  if (card.id === "madenci") {
    // Ranked & Master Tier: Surgically place adjacent to player's squishiest / support unit
    const shouldSurgicallyTarget = isMasterTier || (isMediumTier && Math.random() < 0.65);
    if (shouldSurgicallyTarget && playerUnits.length > 0) {
      const priorityTargets = playerUnits.filter(u => 
        ["doktor", "tufekci", "bombalama-ucagi", "topcu", "okcu", "mercan", "sapanci", "buz-dolabi", "bira-varili"].includes(u.card.id)
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

    // Default casual miner attempt
    let attempts = 0;
    while (attempts < 100) {
      const c = Math.floor(Math.random() * COLS);
      const r = Math.floor(Math.random() * ROWS);
      if (r !== RIVER_ROW && !isOccupied(c, r)) {
        return { col: c, row: r };
      }
      attempts++;
    }
  }

  // === 2. ÇIĞ (Avalanche - wants front row facing player push) ===
  if (card.id === "cig") {
    const rowsToTry = [11, 10, 9];
    const threatCol = getPlayerThreatColumn();
    if (isMasterTier || isMediumTier) {
      for (const r of rowsToTry) {
        if (!isOccupied(threatCol, r)) return { col: threatCol, row: r };
      }
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
    const rowsToTry = isMasterTier ? [11, 10] : (isMediumTier ? [11, 10, 9] : [9, 8, 10]);
    const threatCol = getPlayerThreatColumn();

    if (isMasterTier || isMediumTier) {
      for (const r of rowsToTry) {
        if (!isOccupied(threatCol, r)) return { col: threatCol, row: r };
        if (threatCol + 1 < COLS && !isOccupied(threatCol + 1, r)) return { col: threatCol + 1, row: r };
        if (threatCol - 1 >= 0 && !isOccupied(threatCol - 1, r)) return { col: threatCol - 1, row: r };
      }
    }

    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 5. DOKTOR & MERCAN (Support / Healer) ===
  if (isHealerSupport) {
    // Master & Medium Tier: Position safely 2-3 rows behind bot's tanks
    if (!isEasyTier) {
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
    const rowsToTry = isEasyTier ? [8, 9, 7] : [7, 8, 6, 5];
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 6. EXTREME BACKLINE ARTILLERY / BUILDINGS (Sapancı, Buz Dolabı, Mezarlık) ===
  if (isExtremeBack) {
    // Keep safely at rows 0-2
    const rowsToTry = [0, 1, 2];
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 7. SQUISHY RANGED (Okçu, Topçu, Bombalama, Kuş Ordusu, Tüfekçi) ===
  if (isSquishyRanged) {
    if (isMasterTier) {
      // In master/ranked tier, place ranged units directly behind the bot's frontline tank for protection!
      const botFrontline = botUnits.filter(u => u.row >= 9);
      if (botFrontline.length > 0) {
        const lead = botFrontline[0];
        const protectedRows = [Math.max(0, Math.round(lead.row) - 3), Math.max(0, Math.round(lead.row) - 2), Math.max(0, Math.round(lead.row) - 4)];
        for (const r of protectedRows) {
          const c = Math.round(lead.col);
          if (!isOccupied(c, r)) return { col: c, row: r };
          if (c + 1 < COLS && !isOccupied(c + 1, r)) return { col: c + 1, row: r };
          if (c - 1 >= 0 && !isOccupied(c - 1, r)) return { col: c - 1, row: r };
        }
      }
    }
    const rowsToTry = isEasyTier ? [9, 8, 7] : [7, 8, 6, 9];
    for (const r of rowsToTry) {
      const colOpt = findBestColInRow(r, true);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // === 8. FAST MELEE / ASSASSINS (Samuray, Vampir, Balık, Kabile) ===
  if (isAssassinFast) {
    const rowsToTry = isMasterTier ? [11, 10] : [11, 10, 9];
    const threatCol = getPlayerThreatColumn();
    if (isMasterTier) {
      for (const r of rowsToTry) {
        if (!isOccupied(threatCol, r)) return { col: threatCol, row: r };
      }
    }
    for (const r of rowsToTry) {
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
  selectedCharms?: string[];
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
  { cards: ["golem", "bombalama-ucagi", "tufekci", "mercan"] }, // Titan Beatdown & Air Siege
  { cards: ["dev", "samuray", "madenci", "okcu"] }, // Assassin Diver & Frontline Breaker
  { cards: ["lav-kopegi", "cehennem-ejderi", "volkan", "zirhli"] }, // Inferno Skies & Molten Ground
  { cards: ["golem", "buz-dolabi", "samuray", "topcu"] }, // Glacial Freeze & Heavy Artillery
  { cards: ["bira-varili", "karinca-ordusu", "kus-ordusu", "dev"] }, // Frenzied Swarm Vanguard
  { cards: ["zirhli", "mercan", "tufekci", "madenci"] }, // Iron Aegis & Precision Sniper
  { cards: ["cig", "golem", "bombalama-ucagi", "vampir"] }, // Avalanche Lockdown & Night Stalker
  { cards: ["dev", "cehennem-ejderi", "buz-dolabi", "samuray"] }, // Dragon Freeze & Melee Sunder
  { cards: ["kopek-baligi", "tufekci", "mercan", "golem"] }, // Abyssal Leviathan & Backline Support
  { cards: ["samuray", "bombalama-ucagi", "zirhli", "madenci"] } // Surgical Blitzkrieg
];

export function BattleScreen({ 
  deck, 
  playerCardLevels = {}, 
  botDeckOverride, 
  playerEmojis = ["", "", "", ""],
  selectedCharms = ["kuvvet", ""], 
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
  const [floatingCheers, setFloatingCheers] = useState<Array<{ id: number; emoji: string; left: number }>>([]);

  const triggerCheer = (emoji: string) => {
    const newCheer = { id: Date.now() + Math.random(), emoji, left: 15 + Math.random() * 70 };
    setFloatingCheers((prev) => [...prev.slice(-12), newCheer]);
    setTimeout(() => {
      setFloatingCheers((prev) => prev.filter((c) => c.id !== newCheer.id));
    }, 2200);
  };
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
  const [opponentCardLevels] = useState<Record<string, number>>(() => {
    const levels: Record<string, number> = {};
    const t = opponentTrophies;
    
    // Calculate player's average deck card level
    const playerLvls = deck.map(id => playerCardLevels[id] ?? 1);
    const avgPlayerLvl = playerLvls.length > 0 
      ? Math.round(playerLvls.reduce((a, b) => a + b, 0) / playerLvls.length) 
      : 1;

    CARDS.forEach((c) => {
      if (mode === "ranked") {
        // In ranked mode, bots use top competitive level cards
        levels[c.id] = Math.max(3, Math.min(5, Math.max(avgPlayerLvl, 3)));
      } else {
        const pLvl = playerCardLevels[c.id] ?? 1;
        const trophyBonus = Math.floor(t / 1000);
        const targetLvl = Math.max(1, Math.min(10, Math.max(avgPlayerLvl, trophyBonus + 1)));
        levels[c.id] = Math.max(targetLvl, pLvl);
      }
    });
    return levels;
  });
  const [botDeck, setBotDeck] = useState<CardDef[]>(() => {
    let cards: CardDef[] = [];
    if (botDeckOverride) {
      cards = botDeckOverride.map(id => typeof id === "string" ? CARDS.find(c => c.id === id)! : id).filter(Boolean) as CardDef[];
    } else if (mode === "ranked" && selectedPredefinedDeck) {
      cards = selectedPredefinedDeck.cards.map(id => CARDS.find(c => c.id === id)!).filter(Boolean);
      // In ranked mode, keep the meticulously crafted meta decks intact with full synergy
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
  const [usedCharms, setUsedCharms] = useState<string[]>([]);
  const [targetingCharm, setTargetingCharm] = useState<string | null>(null);
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
  const winnerRef = useRef<"player" | "bot" | null>(null);

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
    stateRef.current = makeInitialState();
    stateRef.current.battleId = battleId || undefined;
    stateRef.current.isPlayer1 = isPlayer1;
    stateRef.current.arenaId = arena.id;
    startedRef.current = false;
    myPlacementsRef.current = [];
    opponentPlacementsRef.current = [];
    placedBotRef.current = 0;
    triggeredOpponentAbilitiesRef.current.clear();
    triggeredOpponentEmojisRef.current.clear();
    setWinner(null);
    winnerRef.current = null;
    setPhase("placing");
  }, [battleId, isPlayer1, arena.id]);

  const [placeTimer, setPlaceTimer] = useState(PLACE_SECONDS);
  const placedBotRef = useRef(0);

  const handleUseCharm = (charmId: string) => {
    if (usedCharms.includes(charmId)) return;

    if (charmId === "kutsanmislik" || charmId === "bomba") {
      setTargetingCharm(charmId === targetingCharm ? null : charmId);
      return;
    }

    setUsedCharms(prev => [...prev, charmId]);
    const s = stateRef.current;
    if (charmId === "kuvvet") {
      s.charmKuvvetTimeLeft = 5.0; // 5 seconds 2x power
    } else if (charmId === "hiz") {
      s.charmHizTimeLeft = 4.0; // 4 seconds 2x speed
    } else if (charmId === "kan-banyosu") {
      s.charmKanBanyosuTimeLeft = 7.0; // 7 seconds lifesteal
    } else if (charmId === "saglik") {
      s.units.forEach(u => {
        if (u.side === "player" && u.hp > 0) {
          u.hp = Math.min(u.maxHp, u.hp + (u.maxHp * 0.5));
        }
      });
    } else if (charmId === "mutlak-guc") {
      s.charmSafKuvvetTimeLeft = 5.0;
      s.units.forEach(u => {
        if (u.side === "player" && u.hp > 0) {
          u.hp = Math.max(1, Math.round(u.hp * 0.75));
        }
      });
    }
    rerender();
  };

  const handleTargetCharmUnit = (targetUid: number) => {
    if (targetingCharm === "kutsanmislik") {
      const s = stateRef.current;
      const target = s.units.find(u => u.uid === targetUid && u.side === "player" && u.hp > 0);
      if (target) {
        target.maxHp = Math.round(target.maxHp * 2.5);
        target.hp = Math.round(target.hp * 2.5);
        target.kutsanmis = true;
        setUsedCharms(prev => [...prev, "kutsanmislik"]);
        setTargetingCharm(null);
        rerender();
      }
    }
  };

  const handleTargetCharmTile = (col: number, row: number) => {
    if (targetingCharm === "bomba") {
      const s = stateRef.current;
      if (!s.bombExplosions) s.bombExplosions = [];
      s.bombExplosions.push({
        uid: Date.now() + Math.random(),
        col,
        row,
        timeLeft: 1.2,
      });

      // 4x4 area: within 2 tiles col and row (centered or covering 4x4 area)
      // "o bombanın 4x4 alanındaki herşey 100 hasar alır."
      s.units.forEach(u => {
        if (u.hp > 0 && Math.abs(u.col - col) <= 2 && Math.abs(u.row - row) <= 2) {
          applyCombatDamage(s, u, 100, undefined, undefined, true);
        }
      });

      setUsedCharms(prev => [...prev, "bomba"]);
      setTargetingCharm(null);
      rerender();
    }
  };

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

        if (data.winner && !winnerRef.current) {
            const didIWin = isPlayer1 ? (data.winner === "player1") : (data.winner === "player2");
            const w = didIWin ? "player" : "bot";
            winnerRef.current = w;
            setWinner(w);
            const r = getAdjustedRewards(didIWin);
            setRewards(r); 
            setPhase("done");
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

        if ((myReady && oppReady) || data.status === "fighting") {
          // both ready or spectating active battle, start
          if (!startedRef.current) {
            startedRef.current = true;
            stateRef.current.units = []; // clear old units
            // safeguard: make sure our own units are loaded if this was a fresh load
            if (myPlacements) {
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
            const dbWinner = w === "player" 
              ? (isPlayer1 ? "player1" : "player2") 
              : (isPlayer1 ? "player2" : "player1");
            updateDoc(doc(db, "battles", battleId), { winner: dbWinner }).catch(() => {});
        }
        if (!winnerRef.current) {
            winnerRef.current = w;
            setWinner(w);
            const r = getAdjustedRewards(w === "player");
            setRewards(r); 
            setPhase("done");
        }
        return;
      }
      if (stateRef.current.time > FIGHT_TIMEOUT) {
        const pHp = stateRef.current.units.filter((u) => u.side === "player" && u.hp > 0 && u.card.id !== "cig" && u.card.id !== "bira-varili" && u.card.id !== "lanet").reduce((s, u) => s + u.hp, 0);
        const bHp = stateRef.current.units.filter((u) => u.side === "bot" && u.hp > 0 && u.card.id !== "cig" && u.card.id !== "bira-varili" && u.card.id !== "lanet").reduce((s, u) => s + u.hp, 0);
        const w = pHp >= bHp ? "player" : "bot";
        if (battleId && !isBotFallbackRef.current) {
            const dbWinner = w === "player" 
              ? (isPlayer1 ? "player1" : "player2") 
              : (isPlayer1 ? "player2" : "player1");
            updateDoc(doc(db, "battles", battleId), { winner: dbWinner }).catch(() => {});
        }
        if (!winnerRef.current) {
            winnerRef.current = w;
            setWinner(w);
            const r = getAdjustedRewards(w === "player");
            setRewards(r); 
            setPhase("done");
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
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 border-b border-slate-800 text-[11px] shrink-0 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px] font-bold">
            {mode === "ranked" ? "🏆 Dereceli Maç" : mode === "tournament" ? "⚔️ Turnuva Maçı" : "🎯 Standart Arena"}
          </span>
        </div>
      </div>

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
          targetingCharm={phase === "fighting" ? targetingCharm : null}
          onTargetCharmTile={handleTargetCharmTile}
          onTargetCharmUnit={handleTargetCharmUnit}
        />

        {/* Floating Spectator Cheer Animations */}
        {floatingCheers.map((cheer) => (
          <div
            key={cheer.id}
            style={{ left: `${cheer.left}%` }}
            className="absolute bottom-6 z-50 pointer-events-none text-3xl animate-float-cheer"
          >
            {cheer.emoji}
          </div>
        ))}

        {/* Floating guidance banners for targeting charms */}
        {targetingCharm === "bomba" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-950/95 border-2 border-red-500 text-white px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.85)] animate-pulse">
            <span className="text-3xl">💣</span>
            <div className="text-left">
              <div className="text-xs font-black uppercase text-red-200">Bomba Bırakılıyor</div>
              <div className="text-[11px] text-red-300">Sahada istediğin kareye tıkla (4x4 alan, 100 hasar)</div>
            </div>
            <button
              onClick={() => setTargetingCharm(null)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 transition-colors ml-1"
            >
              İptal
            </button>
          </div>
        )}

        {targetingCharm === "kutsanmislik" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-950/95 border-2 border-amber-400 text-white px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.85)] animate-pulse">
            <span className="text-3xl">✨</span>
            <div className="text-left">
              <div className="text-xs font-black uppercase text-amber-200">Kutsanmışlık</div>
              <div className="text-[11px] text-amber-300">Sahadaki dost kartına tıkla (2.5x Can)</div>
            </div>
            <button
              onClick={() => setTargetingCharm(null)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 transition-colors ml-1"
            >
              İptal
            </button>
          </div>
        )}

        {/* Display Opponent Emoji */}
        {displayedOpponentEmoji && (
          <div key={`opp_${displayedOpponentEmoji.timestamp}`} className="absolute top-12 right-6 z-50">
            <AnimatedEmoji
              emoji={displayedOpponentEmoji.emoji}
              bubble={true}
              side="opponent"
              size="xl"
            />
          </div>
        )}

        {/* Display Player Emoji */}
        {displayedPlayerEmoji && (
          <div key={`player_${displayedPlayerEmoji.timestamp}`} className="absolute bottom-12 left-6 z-50">
            <AnimatedEmoji
              emoji={displayedPlayerEmoji.emoji}
              bubble={true}
              side="player"
              size="xl"
            />
          </div>
        )}
      </div>

      {/* bottom: cards & abilities */}
      {phase === "placing" && (
        <div className="bg-slate-950/95 border-t border-slate-850 p-2.5">
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


      {targetingCharm === "kutsanmislik" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="text-center max-w-sm mb-3">
            <span className="text-4xl">✨</span>
            <h2 className="text-2xl font-black text-amber-300 mt-1">Kutsanacak Kartını Seç</h2>
            <p className="text-xs text-slate-300 mt-1">
              Seçtiğin kart 2.5x dayanıklılık (can) kazanır ve etrafında sarı halkalar çıkar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center max-w-md max-h-[50vh] overflow-y-auto p-1">
            {(() => {
              const targets = stateRef.current.units.filter(u => u.side === "player" && u.hp > 0);
              if (targets.length === 0) return <div className="text-slate-400 text-sm">Yaşayan dost kart yok.</div>;
              return targets.map(u => (
                <button 
                  key={u.uid} 
                  onClick={() => handleTargetCharmUnit(u.uid)} 
                  className="panel-3d flex flex-col items-center p-3 rounded-2xl bg-slate-800 hover:bg-amber-950/70 border border-slate-700 hover:border-amber-400 transition-all shadow-md group"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">{u.card.emoji}</span>
                  <span className="text-xs text-white font-bold mt-1.5">{u.card.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5">{Math.round(u.hp)} / {u.maxHp} HP</span>
                  <span className="text-[10px] text-amber-300 font-bold mt-1 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    ➔ {Math.round(u.maxHp * 2.5)} HP
                  </span>
                </button>
              ));
            })()}
          </div>
          <button 
            onClick={() => setTargetingCharm(null)} 
            className="mt-5 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-600 shadow transition-colors"
          >
            İptal Et
          </button>
        </div>
      )}

      {phase === "fighting" && (
        <div className="bg-slate-950/95 border-t border-slate-900 p-2">
          <div className="text-center text-[10px] font-display text-amber-300 mb-1.5 tracking-wide font-medium flex items-center justify-center gap-2">
                <span>CHARMLAR & YETENEKLER</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2 py-0.5 rounded-full text-[9px] font-mono">
                  💎 Stone: {stateRef.current.playerAbilityStones ?? 0}
                </span>
              </div>
              
              {selectedCharms.filter(c => c).length > 0 && (
                <div className="flex justify-center gap-2 mb-2 flex-wrap">
                  {selectedCharms.filter(c => c).map((charmId) => {
                    const charm = CHARMS.find(c => c.id === charmId);
                    if (!charm) return null;
                    const isUsed = usedCharms.includes(charm.id);
                    const isTargeting = targetingCharm === charm.id;

                    let activeText = "";
                    let isActive = false;
                    const s = stateRef.current;
                    if (charm.id === "kuvvet" && s.charmKuvvetTimeLeft && s.charmKuvvetTimeLeft > 0) {
                      isActive = true;
                      activeText = `${s.charmKuvvetTimeLeft.toFixed(1)}s (2x Güç)`;
                    } else if (charm.id === "hiz" && s.charmHizTimeLeft && s.charmHizTimeLeft > 0) {
                      isActive = true;
                      activeText = `${s.charmHizTimeLeft.toFixed(1)}s (2x Hız)`;
                    } else if (charm.id === "kan-banyosu" && s.charmKanBanyosuTimeLeft && s.charmKanBanyosuTimeLeft > 0) {
                      isActive = true;
                      activeText = `${s.charmKanBanyosuTimeLeft.toFixed(1)}s (Can Çalma)`;
                    } else if (charm.id === "mutlak-guc" && s.charmSafKuvvetTimeLeft && s.charmSafKuvvetTimeLeft > 0) {
                      isActive = true;
                      activeText = `${s.charmSafKuvvetTimeLeft.toFixed(1)}s (2.5x Güç)`;
                    }

                    return (
                      <button
                        key={charm.id}
                        disabled={isUsed && !isActive}
                        onClick={() => handleUseCharm(charm.id)}
                        className={cn(
                          "panel-3d flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md",
                          isActive
                            ? "bg-amber-500/30 border-2 border-amber-400 text-amber-200 animate-pulse ring-2 ring-amber-400/50"
                            : isUsed
                              ? "opacity-35 grayscale border-slate-700 bg-slate-900/60 cursor-not-allowed"
                              : isTargeting
                                ? "ring-2 ring-amber-400 bg-amber-900/60 border border-amber-300 text-amber-100 scale-105"
                                : "bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/50 text-white"
                        )}
                      >
                        <span className="text-xl drop-shadow">{charm.emoji}</span>
                        <div className="flex flex-col text-left">
                          <span className="leading-tight">{charm.name}</span>
                          {isActive ? (
                            <span className="text-[9px] font-mono text-amber-300 leading-none mt-0.5">{activeText}</span>
                          ) : isUsed ? (
                            <span className="text-[9px] text-slate-400 leading-none mt-0.5">Kullanıldı</span>
                          ) : (
                            <span className="text-[9px] text-cyan-300/80 leading-none mt-0.5">Kullanmak için bas</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {(() => {
                const playerAbilityUnits = stateRef.current.units.filter((u) => {
                  if (u.side !== "player" || u.hp <= 0) return false;
                  return ["hayalet", "doktor", "bira-varili", "bombalama-ucagi", "zirhli", "kurbaga", "lav-kopegi", "samuray", "cig", "vampir", "lanet"].includes(u.card.id);
                });

                return (
                  <div className="flex gap-2 items-stretch" style={{ minHeight: "60px" }}>
                    {playerAbilityUnits.length === 0 ? (
                      <div className="flex-1 text-center text-[10px] text-slate-500 py-3 font-sans italic flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                        Sahada aktif yeteneği olan canlı dost birlik yok.
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
                          <div className="absolute bottom-full right-4 mb-3 bg-slate-900/95 backdrop-blur-md border-2 border-slate-700 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.85)] z-50 animate-emoji-bubble-pop">
                            {playerEmojis.map((emoji, i) => (
                              <button 
                                key={i} 
                                onClick={emoji ? () => {
                                  setDisplayedPlayerEmoji({ emoji, timestamp: Date.now() });
                                  setShowEmojiMenu(false);
                                  if (battleId) submitEmoji(battleId, !!isPlayer1, emoji, Date.now()).catch(console.error);
                                } : undefined}
                                className={cn(
                                  "w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all shadow-inner relative group",
                                  emoji 
                                    ? "bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-amber-400 hover:scale-110 active:scale-95" 
                                    : "bg-slate-950/50 border-slate-800 opacity-40 cursor-not-allowed"
                                )}
                              >
                                {emoji ? (
                                  <AnimatedEmoji emoji={emoji} size="xl" interactive={true} />
                                ) : (
                                  <span className="text-slate-600 font-mono text-sm">?</span>
                                )}
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

      {phase === "done" && (
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

            {rewards && (
              <>
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
              </>
            )}

            <button
              onClick={() => {
                if (rewards) {
                  onFinish(rewards.gold, rewards.trophy, winner === "player");
                  onExit();
                } else {
                  onExit();
                }
              }}
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
