import { useEffect, useMemo, useRef, useState } from "react";
import type { CardDef } from "@/lib/cards";
import { CARDS } from "@/lib/cards";
import { arenaForTrophies, getRankForTrophies } from "@/lib/arenas";
import { ArenaView } from "./arena-view";
import { db } from "@/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { submitPlacements, submitAbilityTrigger, submitEmoji, BattlePlacement, cancelMatchmaking } from "@/lib/matchmaking";
import { cn } from "@/lib/utils";
import {
  computeRewards,
  makeBotDeck,
  makeOpponentTrophies,
  makeInitialState,
  spawnUnit,
  tickBattle,
  triggerUnitAbility,
  COLS,
  ROWS,
  RIVER_ROW,
  type BattleState,
  type Unit,
} from "@/lib/battle";

type Phase = "placing" | "fighting" | "done";

function getBotPlacementCoordinate(card: CardDef, existingUnits: Unit[]): { col: number; row: number } {
  const isOccupied = (c: number, r: number) => {
    return existingUnits.some(u => Math.round(u.col) === c && Math.round(u.row) === r);
  };

  // Helper to find first free column in a specific row
  const findFreeInRow = (r: number) => {
    // Try random columns first
    const cols = Array.from({ length: COLS }, (_, idx) => idx).sort(() => Math.random() - 0.5);
    for (const c of cols) {
      if (!isOccupied(c, r)) return c;
    }
    return null;
  };

  // Special exception for Madenci (Miner) who digs anywhere:
  if (card.id === "madenci") {
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

  // Rule 3: En köşelere ve en arka sıraya sapan ve bira varilini koysun.
  if (card.id === "sapanci" || card.id === "bira-varili") {
    // Prefer row 0, col 0 or 11
    if (!isOccupied(0, 0)) return { col: 0, row: 0 };
    if (!isOccupied(11, 0)) return { col: 11, row: 0 };
    
    // Else try other columns in row 0
    const colOpt = findFreeInRow(0);
    if (colOpt !== null) return { col: colOpt, row: 0 };
    
    // If entire row 0 is full, fallback to row 1 corners
    if (!isOccupied(0, 1)) return { col: 0, row: 1 };
    if (!isOccupied(11, 1)) return { col: 11, row: 1 };
  }

  // Rule 1: Dev, zırhlı gibi canı 110'un üstünde olan kartları öne koysun.
  if (card.hp > 110) {
    // Front rows (closest to river): row 11, then row 10, then row 9
    for (const r of [11, 10, 9]) {
      const colOpt = findFreeInRow(r);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // Rule 2: Okçu, sapan, topçu, bombalama uçağı, kuş ordusu gibi kartları çok canlı olan kartların 2-3 blok arkasına koysun.
  const isSquishyRanged = ["okcu", "sapanci", "topcu", "bombalama-ucagi", "kus-ordusu"].includes(card.id);
  if (isSquishyRanged) {
    // Front line tanks are at 11 or 10. 2-3 blocks behind them is rows 8, 9, 7
    for (const r of [8, 9, 7]) {
      const colOpt = findFreeInRow(r);
      if (colOpt !== null) return { col: colOpt, row: r };
    }
  }

  // Rule 4: Diğerlerini random yerleştirebilir. (row 1 to 11)
  let attempts = 0;
  while (attempts < 100) {
    const c = Math.floor(Math.random() * COLS);
    // Avoid row 0 (reserved for corners) and row 12 (river)
    const r = 1 + Math.floor(Math.random() * (RIVER_ROW - 1));
    if (!isOccupied(c, r)) {
      return { col: c, row: r };
    }
    attempts++;
  }

  // Absolute fallback: find ANY completely free tile in bot side
  for (let r = 0; r < RIVER_ROW; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isOccupied(c, r)) return { col: c, row: r };
    }
  }

  return { col: Math.floor(Math.random() * COLS), row: Math.floor(Math.random() * RIVER_ROW) };
}


interface Props {
  deck: [string, string, string, string];
  playerEmojis?: [string, string, string, string];
  trophies: number;
  opponentName: string;
  opponentTrophies: number;
  battleId?: string;
  isPlayer1?: boolean;
  onFinish: (gold: number, trophy: number, win: boolean) => void;
  onExit: () => void;
  username: string; // Add this
}

const PLACE_SECONDS = 15;
const FIGHT_TIMEOUT = 60;

export function BattleScreen({ deck, playerEmojis = ["", "", "", ""], trophies, opponentName, opponentTrophies, battleId, isPlayer1, onFinish, onExit, username }: Props) {
  const arena = arenaForTrophies(trophies);
  const playerCards = useMemo(
    () => deck.map((id) => CARDS.find((c) => c.id === id)!).filter(Boolean),
    [deck],
  );
  const [botTrophies] = useState(() => makeOpponentTrophies(trophies));
  const [botDeck, setBotDeck] = useState(() => battleId ? [] : makeBotDeck(arena));

  useEffect(() => {
    if (battleId && opponentDeckRef.current.length > 0) {
        setBotDeck(opponentDeckRef.current);
    }
  }, [battleId]);

  const [phase, setPhase] = useState<Phase>("placing");
  const [selected, setSelected] = useState(0);
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());
  const stateRef = useRef<BattleState>(makeInitialState());
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);
  const rafRef = useRef<number | null>(null);
  const [rewards, setRewards] = useState<{ gold: number; trophy: number } | null>(null);
  const [winner, setWinner] = useState<"player" | "bot" | null>(null);

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
      const isPlaced = stateRef.current.units.some(u => u.side === "player" && (u.card.id === c.id || (c.id === "kus-ordusu" && u.card.id.startsWith("kus-ordusu"))));
      if (!isPlaced) {
        let cCol: number; let rCol: number; let attempts = 0;
        do {
          cCol = Math.floor(Math.random() * COLS);
          if (c.id === "madenci") { rCol = Math.floor(Math.random() * ROWS); if (rCol === RIVER_ROW) rCol = RIVER_ROW + 1; }
          else { rCol = RIVER_ROW + 1 + Math.floor(Math.random() * (ROWS - RIVER_ROW - 1)); }
          attempts++;
        } while (attempts < 20 && stateRef.current.units.some(u => Math.round(u.col) === cCol && Math.round(u.row) === rCol));
        spawnUnit(stateRef.current, c, "player", cCol, rCol);
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
        const { col, row } = getBotPlacementCoordinate(card, stateRef.current.units);
        spawnUnit(stateRef.current, card, "bot", col, row);
        placedBotRef.current++;
      }
      startFight();
    } else {
      const placements = stateRef.current.units.filter(u => u.side === "player" && (!u.card.id.startsWith("kus-ordusu") || u.card.id === "kus-ordusu-bird-0")).map(u => ({
        cardId: u.card.id.startsWith("kus-ordusu") ? "kus-ordusu" : u.card.id,
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
         const { col, row } = getBotPlacementCoordinate(card, stateRef.current.units);
         spawnUnit(stateRef.current, card, "bot", col, row);
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
              spawnUnit(stateRef.current, card, "bot", c, r);
            }
          }
        });

        // 2. Fallback deck if opponent hasn't loaded their deck
        const oppDeckIds = (opponentDeckRef.current && opponentDeckRef.current.length > 0)
          ? opponentDeckRef.current
          : (botDeck && botDeck.length > 0 ? botDeck : ["mizrakli", "kilicli", "okcu", "dev"]);
        const oppCards = oppDeckIds.map(id => CARDS.find(c => c.id === id)).filter(Boolean) as CardDef[];

        // 3. Fill up remaining unplaced units
        const spawnedBotCardIds = stateRef.current.units
          .filter(u => u.side === "bot")
          .map(u => u.card.id.startsWith("kus-ordusu") ? "kus-ordusu" : u.card.id);

        const unplacedOppCards = oppCards.filter(card => !spawnedBotCardIds.includes(card.id));

        unplacedOppCards.forEach(card => {
          const { col, row } = getBotPlacementCoordinate(card, stateRef.current.units);
          spawnUnit(stateRef.current, card, "bot", col, row);
        });

        // 4. Force spawn our player units if they somehow missed spawning
        const myPlacements = myPlacementsRef.current || [];
        if (!stateRef.current.units.some(u => u.side === "player")) {
          if (myPlacements.length > 0) {
            myPlacements.forEach((p: any) => {
              const card = CARDS.find(c => c.id === p.cardId);
              if (card) spawnUnit(stateRef.current, card, "player", p.col, p.row);
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
              spawnUnit(stateRef.current, c, "player", cCol, rCol);
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
            const r = computeRewards(didIWin, trophies, opponentTrophies);
            setRewards(r); setPhase("done");
        }

        const myPlacements = isPlayer1 ? data.player1Placements : data.player2Placements;
        const oppPlacements = isPlayer1 ? data.player2Placements : data.player1Placements;
        
        if (myPlacements) {
          myPlacementsRef.current = myPlacements;
        }

        const oppData = isPlayer1 ? data.player2 : data.player1;
        if (oppData && oppData.deck) {
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
                if (card) spawnUnit(stateRef.current, card, "player", p.col, p.row);
              });
            }
            // spawn opponent units
            if (oppPlacements) {
              oppPlacements.forEach((p: any) => {
                const card = CARDS.find(c => c.id === p.cardId);
                if (card) {
                  const r = ROWS - 1 - p.row;
                  const c = COLS - 1 - p.col;
                  spawnUnit(stateRef.current, card, "bot", c, r);
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

    spawnUnit(stateRef.current, card, "player", col, row);
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
      const placements = stateRef.current.units.filter(u => u.side === "player" && (!u.card.id.startsWith("kus-ordusu") || u.card.id === "kus-ordusu-bird-0")).map(u => ({
        cardId: u.card.id.startsWith("kus-ordusu") ? "kus-ordusu" : u.card.id,
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
        if (battleId && isPlayer1 && !isBotFallbackRef.current) {
            const dbWinner = w === "player" ? "player1" : "player2";
            updateDoc(doc(db, "battles", battleId), { winner: dbWinner });
        }
        if (!battleId || isPlayer1 || isBotFallbackRef.current) {
            setWinner(w);
            const r = computeRewards(w === "player", trophies, opponentTrophies);
            setRewards(r); setPhase("done");
        }
        return;
      }
      if (stateRef.current.time > FIGHT_TIMEOUT) {
        const pHp = stateRef.current.units.filter((u) => u.side === "player").reduce((s, u) => s + u.hp, 0);
        const bHp = stateRef.current.units.filter((u) => u.side === "bot").reduce((s, u) => s + u.hp, 0);
        const w = pHp >= bHp ? "player" : "bot";
        if (battleId && isPlayer1 && !isBotFallbackRef.current) {
            const dbWinner = w === "player" ? "player1" : "player2";
            updateDoc(doc(db, "battles", battleId), { winner: dbWinner });
        }
        if (!battleId || isPlayer1 || isBotFallbackRef.current) {
            setWinner(w);
            const r = computeRewards(w === "player", trophies, opponentTrophies);
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
      <div className="flex items-center justify-between gap-2 bg-black/70 px-3 py-2 text-white">
        <div className="w-[50px] flex items-center justify-start text-lg opacity-60">⚔️</div>
        {(() => {
          const oppRank = getRankForTrophies(opponentTrophies);
          return (
            <div className="text-center font-display">
              <div className="text-stroke text-base leading-none text-slate-100 font-bold tracking-tight">
                {opponentName}
              </div>
              <div className="text-[10px] opacity-95 flex items-center justify-center gap-1.5 mt-0.5">
                <span>{opponentTrophies} 🏆</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="text-cyan-400 font-medium">{oppRank.current.name} {oppRank.current.emoji}</span>
              </div>
            </div>
          );
        })()}
        <div className="font-display text-lg text-amber-300">
          {phase === "placing"
            ? `⏱ ${placeTimer}s`
            : phase === "fighting"
            ? `⚔ ${Math.max(0, FIGHT_TIMEOUT - Math.floor(stateRef.current.time))}s`
            : "—"}
        </div>
      </div>

      {/* arena fills */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ArenaView
          arena={arena}
          state={stateRef.current}
          onPlace={phase === "placing" ? placeAt : undefined}
          selectedCardId={playerCards[selected]?.id}
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
                {placeTimer > 0 ? "Hazırsınız! Rakip bekleniyor..." : "Süre doldu, rakip bekleniyor..."}
              </div>
              {opponentReady && <div className="text-emerald-400 text-sm font-semibold">Rakip hazır! Savaş başlıyor...</div>}
            </div>
          ) : (
            <>
              <div className="text-center text-[11.5px] text-amber-200/90 mb-1.5 font-medium leading-none">
                Kart seç ve kendi alanına dokun ({placedIds.size}/4) — {battleId ? (opponentReady ? "Rakip hazır! 👍" : "Rakip yerleştiriyor... ⏳") : "Bot yerleştiriyor..."}
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
          <div className="text-center text-[10px] font-display text-amber-300 mb-1.5 tracking-wide font-medium">
            ⚡ AKTİF ÖZEL YETENEKLER (TIKLA) ⚡
          </div>
          {(() => {
            const playerAbilityUnits = stateRef.current.units.filter((u) => {
              if (u.side !== "player" || u.hp <= 0) return false;
              return ["hayalet", "madenci", "doktor", "bira-varili", "bombalama-ucagi", "zirhli", "kurbaga", "lav-kopegi"].includes(u.card.id);
            });

            return (
              <div className="flex gap-2 items-stretch" style={{ minHeight: "60px" }}>
                {playerAbilityUnits.length === 0 ? (
                  <div className="flex-1 text-center text-[10px] text-slate-500 py-3 font-sans italic flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                    Savaş alanında aktif yetenekli canlı birliğiniz yok.
                  </div>
                ) : (
                  <div className="flex-1 flex flex-wrap justify-center items-center gap-4 py-1.5 max-h-[100px] overflow-y-auto">
                    {playerAbilityUnits.map((u) => {
                      let statusText: string | null = null;
                      let isDisabled = false;

                      if (u.card.id === "madenci") {
                        isDisabled = !u.underground;
                        statusText = u.underground ? "⛏️" : "✓";
                      } else if (u.card.id === "doktor") {
                        const cd = Math.ceil(u.doktorAbilityCd ?? 0);
                        if (cd > 0) {
                          statusText = `${cd}s`;
                          isDisabled = true;
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
                      }

                      return (
                        <div key={u.uid} className="relative flex items-center gap-1.5 bg-slate-900/40 p-1 rounded-full border border-slate-800/40">
                          <button
                            disabled={isDisabled}
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
                              isDisabled
                                ? "bg-slate-950 border-slate-800 opacity-65 text-slate-500 scale-95"
                                : "bg-gradient-to-b from-amber-500/10 to-amber-600/30 border-amber-500/80 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse"
                            )}
                          >
                            <span>{u.card.emoji}</span>
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
              {winner === "player" ? "ZAFER! 🏆" : "MAĞLUBİYET 💀"}
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-lg font-display">
              <span className={cn(rewards.trophy >= 0 ? "text-amber-300" : "text-red-400")}>
                {rewards.trophy >= 0 ? "+" : ""}{rewards.trophy} 🏆
              </span>
              <span className="text-yellow-200">+{rewards.gold} 🪙</span>
            </div>
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
