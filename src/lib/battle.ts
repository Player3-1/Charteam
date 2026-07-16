import { CARDS, dmgValue, pickCardByRarity, type CardDef, type Rarity } from "./cards";
import { type Arena, ARENAS } from "./arenas";

export const COLS = 12;
export const ROWS = 25;
export const RIVER_ROW = 12;
export const BRIDGE_COLS = [5, 6];

export type Side = "player" | "bot";

export interface Unit {
  uid: number;
  card: CardDef;
  side: Side;
  col: number;
  row: number;
  hp: number;
  maxHp: number;
  cdLeft: number;
  flying: boolean;
  level: number; // The level of the unit (1 to 10)
  // --- Custom ability tracking fields ---
  isCharging?: boolean;
  chargeTime?: number;
  underground?: boolean;
  emergingTimeLeft?: number;
  immuneTimeLeft?: number;
  doktorUsesLeft?: number;
  doktorAbilityCd?: number;
  barrelAuraBoostTimeLeft?: number;
  barrelAge?: number;
  zirhliDefendingTimeLeft?: number;
  fleeTimeLeft?: number;
  bomberUsesLeft?: number;
  frozenTimeLeft?: number;
  poisonTicksLeft?: number;
  poisonCdLeft?: number;
  burningTicksLeft?: number;
  burningDmgPerTick?: number;
  burningCdLeft?: number;
  swallowingUid?: number;
  swallowedTimeLeft?: number;
  tongueTimeLeft?: number;
  swallowingTargetUid?: number;
  lavKopegiAbilityUsed?: boolean;
  lavKopegiAbilityTimeLeft?: number;
  hayaletRevealedByUid?: number;
  laserTargetUid?: number;
  laserChannelTime?: number;
  laserTickTimer?: number;
  ufoAttacking?: boolean;
  samurayAbilityActive?: boolean;
  cigTriggered?: boolean;
}

export interface Projectile {
  uid: number;
  side: Side;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  t: number; // 0..1
  duration: number;
  kind: "arrow" | "stone" | "bullet" | "bomb" | "fire" | "snowball" | "ice" | "tongue";
  attackerUid: number;
  damage: number;
  aoeRange?: number;
  targetUid?: number;
}

export interface BattleState {
  units: Unit[];
  projectiles: Projectile[];
  time: number;
  winner: Side | null;
  isPlayer1?: boolean;
  battleId?: string;
  pendingOpponentAbilities?: Map<string, number>;
  arenaId?: number;
  playerAbilityStones?: number;
  botAbilityStones?: number;
}

let _uid = 1;
const nextUid = () => _uid++;

export function sortUnitsSymmetrically(units: Unit[], isPlayer1: boolean) {
  units.sort((a, b) => {
    const isP1_UnitA = (isPlayer1 && a.side === "player") || (!isPlayer1 && a.side === "bot");
    const rA = isP1_UnitA ? a.row : ROWS - 1 - a.row;
    const cA = isP1_UnitA ? a.col : COLS - 1 - a.col;

    const isP1_UnitB = (isPlayer1 && b.side === "player") || (!isPlayer1 && b.side === "bot");
    const rB = isP1_UnitB ? b.row : ROWS - 1 - b.row;
    const cB = isP1_UnitB ? b.col : COLS - 1 - b.col;

    if (Math.abs(rA - rB) > 0.001) return rA - rB;
    if (Math.abs(cA - cB) > 0.001) return cA - cB;
    return a.card.id.localeCompare(b.card.id);
  });
}

export function isUnitTargetable(u: Unit): boolean {
  if (u.hp <= 0) return false;
  if (u.card.id === "cig") return false;
  if (u.underground) return false;
  if (u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0) return false;
  return true;
}

export function makeInitialState(): BattleState {
  return { units: [], projectiles: [], time: 0, winner: null, pendingOpponentAbilities: new Map() };
}

export function spawnUnit(state: BattleState, card: CardDef, side: Side, col: number, row: number, level: number = 1) {
  // Bird ordusu spawns 5 individual birds
  if (card.id === "kus-ordusu") {
    const offsets = [
      [0, 0],
      [-0.4, -0.4],
      [0.4, -0.4],
      [-0.3, 0.4],
      [0.3, 0.4]
    ];
    const mult = side === "bot" ? -1 : 1;
    offsets.forEach(([dc, dr], index) => {
      state.units.push({
        uid: nextUid(),
        card: {
          ...card,
          id: `kus-ordusu-bird-${index}`,
          name: `Bird ${index + 1}`,
          hp: 20,
          dmg: 5,
          cd: 1.0,
        },
        side,
        col: Math.max(0, Math.min(COLS - 1, col + dc * mult)),
        row: Math.max(0, Math.min(ROWS - 1, row + dr * mult)),
        hp: 20,
        maxHp: 20,
        cdLeft: 1.0,
        flying: true,
        level,
      });
    });
    return;
  }

  // Kabile spawns 6 individual tribe members
  if (card.id === "kabile") {
    const offsets = [
      [0, 0],
      [-0.4, -0.4],
      [0.4, -0.4],
      [-0.4, 0.4],
      [0.4, 0.4],
      [0, 0.5]
    ];
    const mult = side === "bot" ? -1 : 1;
    offsets.forEach(([dc, dr], index) => {
      state.units.push({
        uid: nextUid(),
        card: {
          ...card,
          id: `kabile-member-${index}`,
          name: `Tribe Fighter ${index + 1}`,
          hp: 25,
          dmg: 15,
          cd: 1.0,
        },
        side,
        col: Math.max(0, Math.min(COLS - 1, col + dc * mult)),
        row: Math.max(0, Math.min(ROWS - 1, row + dr * mult)),
        hp: 25,
        maxHp: 25,
        cdLeft: 1.0,
        flying: false,
        level,
      });
    });
    return;
  }

  // Çığ spawns a non-combat placeholder unit that falls after 5 seconds
  if (card.id === "cig") {
    state.units.push({
      uid: nextUid(),
      card,
      side,
      col,
      row,
      hp: 1,
      maxHp: 1,
      cdLeft: 999,
      flying: false,
      level,
    });
    return;
  }

  const hp = Math.max(1, card.hp);
  
  // Custom setups for specific cards
  const isMiner = card.id === "madenci";
  const isDoktor = card.id === "doktor";

  state.units.push({
    uid: nextUid(),
    card,
    side,
    col,
    row,
    hp,
    maxHp: hp,
    cdLeft: card.cd,
    flying: card.range === "hava" || card.id === "hayalet",
    underground: isMiner,
    doktorAbilityCd: isDoktor ? 0 : undefined,
    chargeTime: card.id === "atli" ? 0 : undefined,
    isCharging: card.id === "atli" ? true : undefined,
    bomberUsesLeft: card.id === "bombalama-ucagi" ? 1 : undefined,
    level,
  });
}

function attackRange(card: CardDef): number {
  if (card.id === "sapanci") return 25.0; // Extremely high range, can shoot targeting backline
  if (card.id === "volkan") return 20.0; // exactly 5 blocks less than sapanci (25.0 - 5.0)
  if (card.range === "yakın") return 1.1;
  if (card.range === "uzak") return 4.5;
  return 5.5;
}

function speed(card: CardDef): number {
  if (card.id === "mercan" || card.id === "volkan") return 0; // Static building/coral
  if (card.id === "kopek-baligi") return 1.5; // Fast shark
  if (card.id === "balik") return 1.3; // Fast fish
  if (card.id === "mercan" || card.id === "volkan") return 0; // Static building/coral
  if (card.id === "atli") return 2.4; // Fast cavalry
  if (card.id === "mizrakli") return 1.4; // Fast melee
  if (card.id === "kilicli") return 0.8; // Slow melee
  if (card.id === "dev") return 0.5; // Very slow tank
  if (card.id === "tufekci") return 0.7; // Slow shooter
  if (card.id === "topcu") return 0.5; // Very slow cannon
  if (card.id === "hayalet") return 1.375; // +25% speed
  if (card.range === "hava") return 1.3;
  if (card.range === "uzak") return 0.9;
  return 1.1;
}

function projectileKind(card: CardDef): Projectile["kind"] | null {
  if (card.id === "sapanci") return "stone";
  if (card.id === "okcu") return "arrow";
  if (card.id === "tufekci") return "bullet";
  if (card.id === "topcu" || card.id === "bombalama-ucagi") return "bomb";
  if (card.id === "ejder" || card.id === "volkan" || card.id === "cehennem-ejderi") return "fire";
  if (card.id === "buz-dolabi") return "ice";
  if (card.id === "kardan-adam") return "snowball";
  if (card.id === "kurbaga") return "tongue";
  if (card.range === "yakın") return null;
  return "arrow";
}

function dist(a: { col: number; row: number }, b: { col: number; row: number }) {
  return Math.hypot(a.col - b.col, a.row - b.row);
}

export function emergeMiner(u: Unit) {
  if (u.underground) {
    u.underground = false;
    u.emergingTimeLeft = 1.2; // 1.2s of transparent surfacing phase where he cannot attack/move
  }
}

function handleProjectileImpact(p: Projectile, state: BattleState) {
  const attacker = state.units.find((u) => u.uid === p.attackerUid);
  
  const applyEffects = (target: Unit) => {
    applyCombatDamage(target, p.damage, attacker, true);
    if (p.kind === "snowball" && p.damage > 0) {
      target.frozenTimeLeft = Math.max(target.frozenTimeLeft || 0, 1.2);
    } else if (p.kind === "ice") {
      target.frozenTimeLeft = Math.max(target.frozenTimeLeft || 0, 1.5);
    } else if (p.kind === "tongue" && attacker) {
      target.poisonTicksLeft = 10;
      target.poisonCdLeft = 1.0;
    }

    if (attacker) {
      if (attacker.card.id === "volkan") {
        target.burningTicksLeft = 4;
        target.burningDmgPerTick = 5;
        target.burningCdLeft = 1.0;
      } else if (attacker.card.id === "cehennem-ejderi") {
        target.burningTicksLeft = 4;
        target.burningDmgPerTick = 5;
        target.burningCdLeft = 1.0;
      } else if (attacker.card.id === "lav-kopegi") {
        target.burningTicksLeft = 7;
        target.burningDmgPerTick = 5;
        target.burningCdLeft = 1.0;
      }
    }
  };

  if (p.aoeRange) {
    state.units.forEach((targetUnit) => {
      if (targetUnit.side !== p.side && isUnitTargetable(targetUnit)) {
        if (targetUnit.card.id === "doktor") return; // Doktor does not take AOE damage
        if (Math.abs(targetUnit.col - p.toCol) <= p.aoeRange! && Math.abs(targetUnit.row - p.toRow) <= p.aoeRange!) {
          applyEffects(targetUnit);
        }
      }
    });
  } else {
    // Single target: find closest to p.toCol, p.toRow
    let best = null;
    let bestDist = 1.0; 
    for(const u of state.units) {
      if (u.side !== p.side && isUnitTargetable(u)) {
        const d = dist(u, {col: p.toCol, row: p.toRow});
        if (d <= bestDist) {
           bestDist = d;
           best = u;
        }
      }
    }
    if (best) applyEffects(best);
  }
}

export function tickBattle(state: BattleState, dt: number) {
  if (state.winner) return;

  // 1. Force deterministic sort every tick in multiplayer to prevent any divergence
  if (state.battleId && state.isPlayer1 !== undefined) {
    sortUnitsSymmetrically(state.units, state.isPlayer1);
  }

  // 2. Process real-time synced opponent ability triggers if in multiplayer
  if (state.battleId && state.pendingOpponentAbilities) {
    for (const [cardId, simTime] of Array.from(state.pendingOpponentAbilities.entries())) {
      if (state.time >= simTime) {
        const oppUnit = state.units.find(
          (u) => u.side === "bot" && (u.card.id === cardId || (cardId === "kus-ordusu" && u.card.id.startsWith("kus-ordusu")))
        );
        if (oppUnit && oppUnit.hp > 0) {
          triggerUnitAbility(oppUnit, state);
        }
        state.pendingOpponentAbilities.delete(cardId);
      }
    }
  }

  state.time += dt;

  // projectiles
  state.projectiles.forEach((p) => {
    if (p.targetUid !== undefined) {
      const target = state.units.find(u => u.uid === p.targetUid && u.hp > 0);
      if (target) {
        p.toCol = target.col;
        p.toRow = target.row;
      }
    }
    p.t += dt / p.duration;
  });
  state.projectiles = state.projectiles.filter((p) => {
    if (p.t >= 1) {
      handleProjectileImpact(p, state);
      return false;
    }
    return true;
  });

  // Auto-Emerge Miner if everyone else on their side dies
  for (const u of state.units) {
    if (u.underground && u.hp > 0) {
      const otherAlliesNonMiner = state.units.some(
        (o) => o.side === u.side && o.hp > 0 && o.uid !== u.uid && !o.underground
      );
      if (!otherAlliesNonMiner) {
        emergeMiner(u); // Force emerge with transparent transition!
      }
    }
  }

  // Active buff and aging updates
  for (const u of state.units) {
    if (u.hp <= 0) continue;

    // Tick down attack/strike cooldown globally
    if (u.cdLeft > 0) {
      u.cdLeft = Math.max(0, u.cdLeft - dt);
    }

    // Miner emerging timer
    if (u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0) {
      u.emergingTimeLeft = Math.max(0, u.emergingTimeLeft - dt);
    }

    // Frozen timer
    if (u.frozenTimeLeft !== undefined && u.frozenTimeLeft > 0) {
      u.frozenTimeLeft = Math.max(0, u.frozenTimeLeft - dt);
    }

    // Poison timer
    if (u.poisonTicksLeft !== undefined && u.poisonTicksLeft > 0) {
      if (u.poisonCdLeft !== undefined) {
        u.poisonCdLeft -= dt;
        if (u.poisonCdLeft <= 0) {
          u.poisonCdLeft = 1.0;
          u.poisonTicksLeft -= 1;
          applyCombatDamage(u, 3); // 3 damage per tick
        }
      }
    }

    // Burning timer
    if (u.burningTicksLeft !== undefined && u.burningTicksLeft > 0) {
      if (u.burningCdLeft !== undefined) {
        u.burningCdLeft -= dt;
        if (u.burningCdLeft <= 0) {
          u.burningCdLeft = 1.0;
          u.burningTicksLeft -= 1;
          const tickDmg = u.burningDmgPerTick ?? 5;
          applyCombatDamage(u, tickDmg);
        }
      }
    }

    // Tongue ability (Kurbağa) pull-in
    if (u.tongueTimeLeft !== undefined && u.tongueTimeLeft > 0) {
      const target = state.units.find(eu => eu.uid === u.swallowingTargetUid);
      if (target) {
        // Move target closer to Kurbağa
        const distCol = u.col - target.col;
        const distRow = u.row - target.row;
        target.col += distCol * (dt / u.tongueTimeLeft);
        target.row += distRow * (dt / u.tongueTimeLeft);
      }
      u.tongueTimeLeft -= dt;
      if (u.tongueTimeLeft <= 0) {
        if (target) {
          target.col = u.col;
          target.row = u.row;
          target.hp = 0; // kill
          u.swallowedTimeLeft = 2.0; // Start swallowing explosion
        }
        u.tongueTimeLeft = undefined;
        u.swallowingTargetUid = undefined;
      }
    }

    // Swallowed explosion timer (Kurbağa)
    if (u.swallowedTimeLeft !== undefined && u.swallowedTimeLeft > 0) {
      u.swallowedTimeLeft -= dt;
      if (u.swallowedTimeLeft <= 0) {
         u.hp = 0; // explode
         u.swallowedTimeLeft = 0;
         continue;
      }
    }

    // Ghost invul rate
    if (u.immuneTimeLeft !== undefined && u.immuneTimeLeft > 0) {
      u.immuneTimeLeft = Math.max(0, u.immuneTimeLeft - dt);
    }

    // Zırhlı defend timer
    if (u.zirhliDefendingTimeLeft !== undefined && u.zirhliDefendingTimeLeft > 0) {
      u.zirhliDefendingTimeLeft = Math.max(0, u.zirhliDefendingTimeLeft - dt);
    }

    // Doktor fleeing cooldown
    if (u.fleeTimeLeft !== undefined && u.fleeTimeLeft > 0) {
      u.fleeTimeLeft = Math.max(0, u.fleeTimeLeft - dt);
    }

    // Doktor ability cooldown
    if (u.doktorAbilityCd !== undefined && u.doktorAbilityCd > 0) {
      u.doktorAbilityCd = Math.max(0, u.doktorAbilityCd - dt);
    }

    // Lav Köpeği ability duration timer
    if (u.lavKopegiAbilityTimeLeft !== undefined && u.lavKopegiAbilityTimeLeft > 0) {
      u.lavKopegiAbilityTimeLeft = Math.max(0, u.lavKopegiAbilityTimeLeft - dt);
    }

    // Barrel lifespan & burst timer
    if (u.card.id === "bira-varili") {
      u.barrelAge = (u.barrelAge || 0) + dt;
      if (u.barrelAge >= 30) {
        u.hp = 0; // expires after 30 seconds
        continue;
      }
      if (u.barrelAuraBoostTimeLeft !== undefined && u.barrelAuraBoostTimeLeft > 0) {
        u.barrelAuraBoostTimeLeft = Math.max(0, u.barrelAuraBoostTimeLeft - dt);
      }
    }

    // Ghost visibility hysteresis
    if (u.card.id === "hayalet") {
      if (u.immuneTimeLeft && u.immuneTimeLeft > 0) {
        u.hayaletRevealedByUid = undefined;
      } else {
        const isAttacking = u.cdLeft > 0;
        const closeEnemy = state.units.find(
          (e) => e.side !== u.side && e.hp > 0 && Math.hypot(u.col - e.col, u.row - e.row) <= 2.0
        );
        if (isAttacking) {
          u.hayaletRevealedByUid = closeEnemy ? closeEnemy.uid : u.uid;
        } else if (closeEnemy) {
          u.hayaletRevealedByUid = closeEnemy.uid;
        } else {
          u.hayaletRevealedByUid = undefined;
        }
      }
    }
  }

  // Delete Process Çığ (Avalanche) explosion from here since it's now ability based
  for (const u of state.units) {
  }

  // BOT AI trigger of active abilities on opportunity
  for (const u of state.units) {
    if (u.side === "bot" && u.hp > 0) {
      if (state.battleId) {
        continue; // Multiplayer uses direct human click-synchronization! Skip AI.
      }
      if (state.arenaId === 1) {
        continue; // In Arena 1 (first arena), bots play very poorly and do not use their active abilities
      }
      // Ghost auto invul on low health or when first targeted
      if (u.card.id === "hayalet" && u.hp < u.maxHp * 0.7 && u.immuneTimeLeft === undefined) {
        triggerUnitAbility(u, state);
      }
      // Zırhlı defense absorption under 60% health
      if (u.card.id === "zirhli" && u.hp < u.maxHp * 0.6 && !u.zirhliDefendingTimeLeft) {
        triggerUnitAbility(u, state);
      }
      // Çığ triggers immediately if enemies are near
      if (u.card.id === "cig" && !u.cigTriggered) {
        const enemiesNearby = state.units.filter((o) => o.side !== u.side && o.hp > 0 && dist(u, o) <= 2.8);
        if (enemiesNearby.length >= 1) {
          triggerUnitAbility(u, state);
        }
      }
      // Barrel active boost
      if (u.card.id === "bira-varili" && u.barrelAuraBoostTimeLeft === undefined) {
        triggerUnitAbility(u, state);
      }
      // Samuray active double damage boost if in combat
      if (u.card.id === "samuray" && !u.samurayAbilityActive && u.cdLeft <= 0.1) {
        const enemiesNearby = state.units.filter((o) => o.side !== u.side && o.hp > 0 && dist(u, o) <= attackRange(u.card));
        if (enemiesNearby.length > 0) {
          triggerUnitAbility(u, state);
        }
      }
      // Doktor heal if allies are injured
      if (u.card.id === "doktor" && (u.doktorAbilityCd || 0) <= 0) {
        const injuredNearby = state.units.some(
          (o) => o.side === u.side && o.hp > 0 && o.hp < o.maxHp * 0.9 && dist(u, o) <= 5.0
        );
        if (injuredNearby) {
          triggerUnitAbility(u, state);
        }
      }
      // Bomber drops mega bomb when entering combat
      if (u.card.id === "bombalama-ucagi" && u.cdLeft <= 0) {
        // Trigger mega bomb if enemies are crowded
        const enemiesNearby = state.units.filter((o) => o.side !== u.side && o.hp > 0 && dist(u, o) <= 4.0);
        if (enemiesNearby.length >= 2) {
          triggerUnitAbility(u, state);
        }
      }
      // Kurbaga triggers swallow if enemies are near
      if (u.card.id === "kurbaga" && (u.swallowedTimeLeft ?? 0) <= 0) {
        const enemiesNearby = state.units.filter((o) => o.side !== u.side && o.hp > 0 && dist(u, o) <= 3.0);
        if (enemiesNearby.length >= 1) {
          triggerUnitAbility(u, state);
        }
      }
      // Lav kopegi ability if enemies are near
      if (u.card.id === "lav-kopegi" && !u.lavKopegiAbilityUsed) {
        const enemiesNearby = state.units.filter((o) => o.side !== u.side && o.hp > 0 && dist(u, o) <= 2.5);
        if (enemiesNearby.length >= 2 || (enemiesNearby.length === 1 && enemiesNearby[0].hp > 200)) {
          triggerUnitAbility(u, state);
        }
      }
      
      // Miner automatically emerges after 4 seconds underground
      if (u.card.id === "madenci" && u.underground && state.time >= 4.0) {
        emergeMiner(u);
      }
    }
  }

  // Persistent abilities that trigger automatically regardless of side
  for (const u of state.units) {
    if (u.hp > 0) {
      if (u.card.id === "buz-dolabi" && u.cdLeft <= 0) {
        // We need to know if it succeeded. Let's make triggerUnitAbility return a boolean?
        // Or just check here?
        const enemies = state.units.filter((e) => e.side !== u.side && isUnitTargetable(e));
        if (enemies.length > 0) {
          triggerUnitAbility(u, state);
          u.cdLeft = u.card.cd; 
        }
      }
      if (u.card.id === "mercan" && u.cdLeft <= 0) {
        state.units.forEach((targetUnit) => {
          if (targetUnit.side === u.side && targetUnit.hp > 0) {
            targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + 10);
          }
        });
        u.cdLeft = u.card.cd; 
      }
    }
  }

  for (const u of state.units) {
    if (u.hp <= 0 || u.underground) continue;

    // Miner cannot move or attack while emerging!
    if (u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0) {
      continue;
    }

    // Doktor has 0 attack damage, she only supports
    if (u.card.id === "doktor") {
      // Follow teammates!
      // Doktor only follows ground units (not flying/aerial units like kus-ordusu, ejder, or bombalama-ucagi, and not other dokturs or static barrels)
      const allies = state.units.filter(
        (o) => o.side === u.side && o.uid !== u.uid && isUnitTargetable(o) && !o.flying && o.card.id !== "doktor" && o.card.id !== "bira-varili"
      );
      if (allies.length > 0) {
        // Prioritize injured allies, otherwise nearest active ally
        const injuredAllies = allies.filter((o) => o.hp < o.maxHp);
        const candidates = injuredAllies.length > 0 ? injuredAllies : allies;
        
        let targetAlly = candidates[0];
        let bestD = dist(u, targetAlly);
        for (const a of candidates) {
          const d = dist(u, a);
          if (d < bestD) {
            bestD = d;
            targetAlly = a;
          }
        }

        // Move towards the target ally if not already super close (e.g., within 1 tile)
        if (bestD > 1.0) {
          const sp = speed(u.card) * dt;
          const dc = targetAlly.col - u.col;
          const dr = targetAlly.row - u.row;
          const len = Math.hypot(dc, dr) || 1;
          let nc = u.col + (dc / len) * sp;
          let nr = u.row + (dr / len) * sp;

          u.col = Math.max(0, Math.min(COLS - 1, nc));
          u.row = Math.max(0, Math.min(ROWS - 1, nr));
        }
      } else {
        // If all ground allies are dead, Doktor advances towards the nearest targetable enemy card!
        const enemies = state.units.filter((e) => e.side !== u.side && isUnitTargetable(e));
        if (enemies.length > 0) {
          let targetEnemy = enemies[0];
          let bestD = dist(u, targetEnemy);
          for (const e of enemies) {
            const d = dist(u, e);
            if (d < bestD) {
              bestD = d;
              targetEnemy = e;
            }
          }

          if (bestD > 0.1) {
            const sp = speed(u.card) * dt;
            const dc = targetEnemy.col - u.col;
            const dr = targetEnemy.row - u.row;
            const len = Math.hypot(dc, dr) || 1;
            let nc = u.col + (dc / len) * sp;
            let nr = u.row + (dr / len) * sp;

            u.col = Math.max(0, Math.min(COLS - 1, nc));
            u.row = Math.max(0, Math.min(ROWS - 1, nr));
          }
        }
      }
      continue;
    }

    // Bira Varili and Cig do not move or attack
    if (u.card.id === "bira-varili" || u.card.id === "cig") {
      continue;
    }

    // Filter targetable enemies
    const enemies = state.units.filter((e) => {
      if (e.side === u.side || !isUnitTargetable(e)) return false;
      // Ghost is invisible unless revealed
      // Ghost is also completely invisible and untargetable if its ability is active
      if (e.card.id === "hayalet") {
        if (e.immuneTimeLeft && e.immuneTimeLeft > 0) return false;
        if (e.hayaletRevealedByUid === undefined) return false;
      }
      // Melee ground units cannot attack flying/aerial units
      if (e.flying && !u.flying && u.card.range === "yakın") return false;
      return true;
    });

    if (enemies.length === 0) continue;

    // Sapancı target priorities: Always target Doktor or Bira Varili first!
    let targetPool = enemies;
    if (u.card.id === "sapanci") {
      const priorityTargets = enemies.filter((e) => e.card.id === "doktor" || e.card.id === "bira-varili");
      if (priorityTargets.length > 0) {
        targetPool = priorityTargets;
      }
    }

    let best = targetPool[0];
    let bestD = dist(u, best);
    for (const e of targetPool) {
      const d = dist(u, e);
      if (d < bestD) { bestD = d; best = e; }
    }
    const range = attackRange(u.card);
    const standsFleeing = u.card.id === "balik" && u.fleeTimeLeft !== undefined && u.fleeTimeLeft > 0;

    if (bestD <= range && !standsFleeing) {
      // Cavalry (Atlı) loses charge focus upon attack range reach
      u.chargeTime = 0;

      if (u.cdLeft <= 0 && u.card.cd > 0) {
        // Compute base damage
        let dmgValueResult = dmgValue(u.card.dmg);
        
        // Custom combat stats logic:
        if (u.card.id === "atli") {
          dmgValueResult = u.isCharging ? 75 : 25;
          u.isCharging = false; // discharge charging stamp
        }

        // Apply Bira Varili damage aura boosts
        const activeAuraBarrels = state.units.filter(
          (o) => o.side === u.side && o.hp > 0 && o.card.id === "bira-varili"
        );
        if (activeAuraBarrels.length > 0) {
          const hasSuperBoost = activeAuraBarrels.some((b) => (b.barrelAuraBoostTimeLeft || 0) > 0);
          dmgValueResult *= hasSuperBoost ? 3.0 : 2.0;
        }

        // Apply Hayalet ability damage boost
        if (u.card.id === "hayalet" && (u.immuneTimeLeft || 0) > 0) {
          dmgValueResult *= 2.0;
        }

        // Apply Samuray ability damage boost
        if (u.card.id === "samuray" && u.samurayAbilityActive) {
          dmgValueResult *= 2.0;
          u.samurayAbilityActive = false; // consume the active ability
        }

        const kind = projectileKind(u.card);
        if (kind) {
          let aoeRange = 0;
          if (u.card.id === "bombalama-ucagi") aoeRange = 2;
          else if (u.card.id === "sapanci") aoeRange = 1.5;
          else if (u.card.id === "ejder") aoeRange = 1.5;
          else if (u.card.id === "topcu") aoeRange = 2.0;
          else if (u.card.id === "buz-dolabi") aoeRange = 1.5;
          else if (u.card.id === "volkan") aoeRange = 1.5;

          state.projectiles.push({
            uid: nextUid(),
            side: u.side,
            fromCol: u.col,
            fromRow: u.row,
            toCol: best.col,
            toRow: best.row,
            t: 0,
            duration: u.card.id === "sapanci" ? Math.max(0.15, bestD * 0.04) : Math.max(0.3, bestD * 0.1),
            kind,
            attackerUid: u.uid,
            damage: dmgValueResult,
            aoeRange: aoeRange > 0 ? aoeRange : undefined,
            targetUid: best.uid,
          });
        } else {
          // Direct single strike
          applyCombatDamage(best, dmgValueResult, u);
          if (u.card.id === "balik") {
            u.fleeTimeLeft = 1.2; // flee for 1.2s of its 2.0s cooldown
          }
        }

        u.cdLeft = u.card.cd;
      }
    } else {
      // Movement sequence
      let speedFactor = speed(u.card);

      // Frozen ability slowing effect
      if (u.frozenTimeLeft !== undefined && u.frozenTimeLeft > 0) {
        speedFactor *= 0.25; // slow down by 75%
      }

      // Zırhlı ability immobilization state
      if (u.zirhliDefendingTimeLeft !== undefined && u.zirhliDefendingTimeLeft > 0) {
        speedFactor = 0; // Stands still completely
      }
      
      // Buz dolabı static behavior
      if (u.card.id === "buz-dolabi") {
        speedFactor = 0;
      }

      // Build Cavalry charge
      if (u.card.id === "atli" && speedFactor > 0) {
        u.chargeTime = (u.chargeTime || 0) + dt;
        if (u.chargeTime >= 0.8) {
          u.isCharging = true;
        }
      }

      let isFleeing = u.card.id === "balik" && u.fleeTimeLeft !== undefined && u.fleeTimeLeft > 0;
      const sp = speedFactor * dt;
      const dc = best.col - u.col;
      const dr = best.row - u.row;
      const len = Math.hypot(dc, dr) || 1;
      
      const dirMult = isFleeing ? -1 : 1;
      let nc = u.col + (dc / len) * sp * dirMult;
      let nr = u.row + (dr / len) * sp * dirMult;

      if (!u.flying) {
        const crossing =
          (u.row < RIVER_ROW && nr >= RIVER_ROW) ||
          (u.row > RIVER_ROW && nr <= RIVER_ROW) ||
          Math.abs(nr - RIVER_ROW) < 0.6;
        if (crossing) {
          const midpoint = (BRIDGE_COLS[0] + BRIDGE_COLS[1]) / 2;
          const nearestBridge = nc < midpoint ? BRIDGE_COLS[0] : BRIDGE_COLS[1];
          const stepX = Math.sign(nearestBridge - u.col) * Math.min(sp, Math.abs(nearestBridge - u.col));
          nc = u.col + stepX;
          if (Math.abs(u.col - nearestBridge) > 0.5) nr = u.row;
        }
      }

      u.col = Math.max(0, Math.min(COLS - 1, nc));
      u.row = Math.max(0, Math.min(ROWS - 1, nr));
    }
  }

  // Filter out any units that died in this tick
  state.units = state.units.filter((u) => u.hp > 0);

  // --- 3. Collision Resolution (Ground units cannot pass through/stack on each other) ---
  // Run 2 relaxation passes to spread out overlapping ground units
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < state.units.length; i++) {
      const u1 = state.units[i];
      if (u1.hp <= 0 || u1.flying || u1.card.id === "hayalet" || u1.card.id === "madenci" || u1.card.id === "cig" || u1.underground) {
        continue;
      }
      for (let j = i + 1; j < state.units.length; j++) {
        const u2 = state.units[j];
        if (u2.hp <= 0 || u2.flying || u2.card.id === "hayalet" || u2.card.id === "madenci" || u2.card.id === "cig" || u2.underground) {
          continue;
        }
        
        const dx = u2.col - u1.col;
        const dy = u2.row - u1.row;
        const distVal = Math.hypot(dx, dy);
        const minDist = 0.65; // minimum padding between ground units
        
        if (distVal < minDist) {
          const overlap = minDist - distVal;
          const pushX = (dx / (distVal || 1)) * overlap * 0.5;
          const pushY = (dy / (distVal || 1)) * overlap * 0.5;
          
          u1.col = Math.max(0, Math.min(COLS - 1, u1.col - pushX));
          u1.row = Math.max(0, Math.min(ROWS - 1, u1.row - pushY));
          u2.col = Math.max(0, Math.min(COLS - 1, u2.col + pushX));
          u2.row = Math.max(0, Math.min(ROWS - 1, u2.row + pushY));
        }
      }
    }
  }

  const playerAlive = state.units.some((u) => u.side === "player" && u.card.id !== "cig" && u.card.id !== "bira-varili");
  const botAlive = state.units.some((u) => u.side === "bot" && u.card.id !== "cig" && u.card.id !== "bira-varili");
  if (state.time > 0.5) {
      if (!playerAlive && botAlive) state.winner = "bot";
      else if (!botAlive && playerAlive) state.winner = "player";
      else if (!playerAlive && !botAlive) state.winner = "player"; // tie → player
  }
}

/** Handles applying damage, considering invulnerabilities and defensive stances */
function applyCombatDamage(defender: Unit, dmg: number, attacker?: Unit, isProjectile?: boolean) {
  // Check if targetable (cannot take damage if underground or emerging)
  if (!isUnitTargetable(defender)) {
    return; // takes 0 damage
  }

  // Fish is immune to melee (non-projectile) damage while fleeing
  if (defender.card.id === "balik" && defender.fleeTimeLeft !== undefined && defender.fleeTimeLeft > 0 && !isProjectile) {
    return; // takes 0 damage from melee while running away
  }

  // Ghost invulnerability 2.5 seconds
  if (defender.immuneTimeLeft !== undefined && defender.immuneTimeLeft > 0) {
    return; // takes 0 damage
  }
  
  // Zırhlı defense absorption (absorbs 25%, takes 75%)
  let finalDmg = defender.zirhliDefendingTimeLeft !== undefined && defender.zirhliDefendingTimeLeft > 0
    ? dmg * 0.75
    : dmg;

  // Custom balance: Slinger/Dragon deal partial damage to birds
  if (attacker && ["sapanci", "ejder"].includes(attacker.card.id) && defender.card.id.startsWith("kus-ordusu")) {
    finalDmg *= 0.25; // 30*0.25=7.5 or 45*0.25=11.25. Actually, user wants 2 hits. 20HP / 2 = 10 dmg.
    // If dmg=30, finalDmg should be 10. 30 * x = 10 => x = 1/3.
    // If dmg=45, finalDmg should be 10. 45 * x = 10 => x = 10/45 = 2/9.
    // Making it complex. Let's just fix the dmgValue for birds.
    finalDmg = 10;
  }

  defender.hp = Math.max(0, defender.hp - finalDmg);

  // Doctor does not flee on taking damage anymore, advances toward the nearest target
  if (defender.card.id === "doktor") {
    defender.fleeTimeLeft = 0;
  }
}

export function getAbilityStoneCost(cardId: string): number {
  switch (cardId) {
    case "zirhli": return 2;
    case "hayalet": return 1;
    case "madenci": return 0;
    case "doktor": return 1;
    case "bira-varili": return 2;
    case "bombalama-ucagi": return 1;
    case "cig": return 0;
    case "kurbaga": return 3;
    case "lav-kopegi": return 1;
    case "samuray": return 1;
    default: return 0;
  }
}

/** Explicitly triggers a units active ability */
export function triggerUnitAbility(unit: Unit, state: BattleState) {
  if (unit.hp <= 0) return;

  const cost = getAbilityStoneCost(unit.card.id);
  if (unit.side === "player") {
    if (state.playerAbilityStones === undefined) {
      state.playerAbilityStones = 20; // Fallback
    }
    if (state.playerAbilityStones < cost) return;
    state.playerAbilityStones -= cost;
  } else {
    if (state.botAbilityStones === undefined) {
      state.botAbilityStones = 20; // Fallback
    }
    if (state.botAbilityStones < cost) return;
    state.botAbilityStones -= cost;
  }

  // 11. Hayalet: Damage almaz olma 5sn
  if (unit.card.id === "hayalet") {
    unit.immuneTimeLeft = 5.0;
  }

  // 12. Madenci: yer altından fırlar
  else if (unit.card.id === "madenci") {
    if (unit.underground) {
      emergeMiner(unit);
    }
  }

  // 13. Doktor: hp healing 5x5 alanda +90
  else if (unit.card.id === "doktor") {
    if ((unit.doktorAbilityCd || 0) <= 0) {
      unit.doktorAbilityCd = 5.0; // Cooldown 5s

      state.units.forEach((targetUnit) => {
        if (targetUnit.side === unit.side && isUnitTargetable(targetUnit)) {
          // Surrounding blocks (within 5.0 range / 5x5 area)
          if (dist(targetUnit, unit) <= 5.0) {
            targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + 90); // heal 90 health
          }
        }
      });
    }
  }

  // 14. Bira Varili: 10sn boyunca takımın hasarını 1.7 katına çıkartır
  else if (unit.card.id === "bira-varili") {
    unit.barrelAuraBoostTimeLeft = 10.0;
  }

  // 15. Bombalama Uçağı: altına 6x6 alana 50 hasarlı büyük bomba bırakır
  else if (unit.card.id === "bombalama-ucagi") {
    if ((unit.bomberUsesLeft ?? 0) <= 0) return;
    unit.bomberUsesLeft = (unit.bomberUsesLeft ?? 1) - 1;

    // Find closest enemy position to spawn massive blast, else explode directly below
    const enemies = state.units.filter((e) => e.side !== unit.side && isUnitTargetable(e));
    let explodeCol = unit.col;
    let explodeRow = unit.row;

    if (enemies.length > 0) {
      // nearest targets
      let best = enemies[0];
      let bestD = dist(unit, best);
      for (const e of enemies) {
        const d = dist(unit, e);
        if (d < bestD) { bestD = d; best = e; }
      }
      explodeCol = best.col;
      explodeRow = best.row;
    }

    state.projectiles.push({
      uid: nextUid(),
      side: unit.side,
      attackerUid: unit.uid,
      damage: 50,
      fromCol: unit.col,
      fromRow: unit.row,
      toCol: explodeCol,
      toRow: explodeRow,
      t: 0,
      duration: 0.45,
      kind: "bomb",
    });

    state.units.forEach((targetUnit) => {
      if (targetUnit.side !== unit.side && isUnitTargetable(targetUnit)) {
        if (targetUnit.card.id === "doktor") return; // Doktor does not take AOE damage
        // Check 6x6 bounding box (within 3 blocks)
        if (Math.abs(targetUnit.col - explodeCol) <= 3 && Math.abs(targetUnit.row - explodeRow) <= 3) {
          applyCombatDamage(targetUnit, 50, unit);
        }
      }
    });
  }

  // 19. Kurbağa: En yakın olan kartı yutar, 2 saniye sonra patlar
  else if (unit.card.id === "kurbaga") {
    // Already swallowing or tonguing? Do nothing
    if ((unit.swallowedTimeLeft ?? 0) > 0 || (unit.tongueTimeLeft ?? 0) > 0) return;

    // Find nearest targetable enemy
    const enemies = state.units.filter((e) => e.side !== unit.side && isUnitTargetable(e));
    if (enemies.length > 0) {
      let best = enemies[0];
      let bestD = dist(unit, best);
      for (const e of enemies) {
         const d = dist(unit, e);
         if (d < bestD) { bestD = d; best = e; }
      }
      
      unit.swallowingTargetUid = best.uid;
      unit.tongueTimeLeft = 0.5; // 0.5s animation
    }
  }

  // 20. Buz Dolabı: Buz atar
  else if (unit.card.id === "buz-dolabi") {
       const enemies = state.units.filter((e) => e.side !== unit.side && isUnitTargetable(e));
       if (enemies.length > 0) {
            let best = enemies[0];
            let bestD = dist(unit, best);
            for (const e of enemies) {
                const d = dist(unit, e);
                if (d < bestD) { bestD = d; best = e; }
            }
            state.projectiles.push({
                uid: nextUid(),
                side: unit.side,
                attackerUid: unit.uid,
                damage: 10,
                fromCol: unit.col,
                fromRow: unit.row,
                toCol: best.col,
                toRow: best.row,
                t: 0,
                duration: 0.5,
                kind: "ice",
                aoeRange: 1.5,
                targetUid: best.uid,
            });
       }
  }

  // 16. Zırhlı: 8sn savunma modu, speed=0, takes %40 less dmg
  else if (unit.card.id === "zirhli") {
    unit.zirhliDefendingTimeLeft = 8.0;
  }

  // 24. Lav Köpeği: 3x3 alana 3 saniye süren ve her saniye 20 hasar veren alev etkisi versin
  else if (unit.card.id === "lav-kopegi") {
    if (unit.lavKopegiAbilityUsed) return;
    unit.lavKopegiAbilityUsed = true;
    unit.lavKopegiAbilityTimeLeft = 3.0;

    state.units.forEach((target) => {
      if (target.side !== unit.side && isUnitTargetable(target)) {
        if (target.card.id === "doktor") return; // Doktor does not take AOE damage
        const colDiff = Math.abs(target.col - unit.col);
        const rowDiff = Math.abs(target.row - unit.row);
        // 3x3 area is within 1.5 distance in columns and rows
        if (colDiff <= 1.5 && rowDiff <= 1.5) {
          target.burningTicksLeft = 3;
          target.burningDmgPerTick = 20;
          target.burningCdLeft = 1.0;
        }
      }
    });

    // Create a spectacular 3x3 visual fire blast centered on the Lav Köpeği
    const fireOffsets = [
      { dCol: -1, dRow: -1 },
      { dCol: 1, dRow: -1 },
      { dCol: -1, dRow: 1 },
      { dCol: 1, dRow: 1 },
      { dCol: 0, dRow: 1 },
      { dCol: 0, dRow: -1 },
      { dCol: 1, dRow: 0 },
      { dCol: -1, dRow: 0 },
      { dCol: 0, dRow: 0 },
    ];

    fireOffsets.forEach((offset, index) => {
      state.projectiles.push({
        uid: nextUid(),
        side: unit.side,
        attackerUid: unit.uid,
        damage: 0,
        fromCol: unit.col,
        fromRow: unit.row,
        toCol: Math.min(COLS - 1, Math.max(0, unit.col + offset.dCol)),
        toRow: Math.min(ROWS - 1, Math.max(0, unit.row + offset.dRow)),
        t: 0,
        duration: 0.3 + (index % 3) * 0.05,
        kind: "fire",
      });
    });
  }
  // 30. Samuray: strike deals 2x damage
  else if (unit.card.id === "samuray") {
    unit.samurayAbilityActive = true;
  }
  else if (unit.card.id === "cig") {
    if (unit.cigTriggered) return;
    unit.cigTriggered = true;
    unit.hp = 0; // dies/disappears immediately

    // Spawn falling ice projectiles to represent the avalanche
    for (let i = 0; i < 8; i++) {
      const offsetCol = (Math.random() - 0.5) * 4;
      const offsetRow = (Math.random() - 0.5) * 4;
      state.projectiles.push({
        uid: nextUid(),
        side: unit.side,
        attackerUid: unit.uid,
        damage: 0,
        fromCol: unit.col + offsetCol,
        fromRow: unit.row + offsetRow - 5,
        toCol: unit.col + offsetCol,
        toRow: unit.row + offsetRow,
        t: 0,
        duration: 0.3 + Math.random() * 0.4,
        kind: "snowball",
      });
    }

    // Deal 60 damage to all enemies within 4x4 area of (u.col, u.row)
    state.units.forEach((targetUnit) => {
      if (targetUnit.side !== unit.side && isUnitTargetable(targetUnit)) {
        if (targetUnit.card.id === "doktor") return; // Doktor does not take AOE damage
        const colDiff = Math.abs(targetUnit.col - unit.col);
        const rowDiff = Math.abs(targetUnit.row - unit.row);
        if (colDiff <= 2.0 && rowDiff <= 2.0) {
          applyCombatDamage(targetUnit, 60, unit);
        }
      }
    });
  }
}

// ---------- helpers ----------

import { getUnlockedCardsUpToTrophies } from "./arenas";

export function makeBotDeck(arena: Arena): CardDef[] {
  const unlockedIds = getUnlockedCardsUpToTrophies(arena.min);
  let allowed = [...CARDS.filter((c) => unlockedIds.includes(c.id))];
  if (arena.id === 1) {
    allowed = allowed.filter((c) => c.id !== "sapanci");
  }

  // Define roles
  const tanks = ["dev", "zirhli", "dev-sinek", "lav-kopegi", "kilicli", "kopek-baligi"];
  const ranged = ["okcu", "tufekci", "sapanci", "topcu", "buz-dolabi", "kardan-adam", "kurbaga", "volkan"];
  const airOrSpecial = ["ejder", "kus-ordusu", "bombalama-ucagi", "cehennem-ejderi", "balik", "mercan", "doktor", "bira-varili"];
  const meleeFast = ["mizrakli", "atli", "madenci", "hayalet"];

  const deck: CardDef[] = [];
  
  // Try to pick one from each category
  const categories = [tanks, ranged, meleeFast, airOrSpecial];
  for (const cat of categories) {
    const available = allowed.filter(c => cat.includes(c.id) && !deck.includes(c));
    if (available.length > 0) {
      deck.push(available[Math.floor(Math.random() * available.length)]);
    }
  }

  // Fill remaining slots randomly if needed
  while (deck.length < 4 && allowed.length > 0) {
    const available = allowed.filter(c => !deck.includes(c));
    if (available.length === 0) break;
    deck.push(available[Math.floor(Math.random() * available.length)]);
  }

  // Shuffle final deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

export { makeOpponentTrophies } from "./arenas";

export function computeRewards(
  win: boolean,
  playerTrophies: number,
  opponentTrophies: number,
  mode: "standard" | "tournament" | "ranked" = "standard"
): { gold: number; trophy: number } {
  if (mode === "ranked") {
    if (win) return { gold: 1000, trophy: 10 };
    return { gold: 0, trophy: -(Math.floor(Math.random() * 11) + 10) };
  }

  const diff = opponentTrophies - playerTrophies;
  if (!win) {
    const loss = -(4 + Math.floor(Math.random() * 4));
    return { gold: 0, trophy: loss };
  }
  if (diff > 20) return { gold: 2000, trophy: 15 };
  if (diff < -20) return { gold: 500, trophy: 7 };
  return { gold: 1000, trophy: 10 };
}
