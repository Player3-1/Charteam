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
  kind: "arrow" | "stone" | "bullet" | "bomb" | "fire";
  attackerUid: number;
  damage: number;
  aoeRange?: number;
}

export interface BattleState {
  units: Unit[];
  projectiles: Projectile[];
  time: number;
  winner: Side | null;
  isPlayer1?: boolean;
  battleId?: string;
  pendingOpponentAbilities?: Map<string, number>;
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
  if (u.underground) return false;
  if (u.emergingTimeLeft !== undefined && u.emergingTimeLeft > 0) return false;
  return true;
}

export function makeInitialState(): BattleState {
  return { units: [], projectiles: [], time: 0, winner: null, pendingOpponentAbilities: new Map() };
}

export function spawnUnit(state: BattleState, card: CardDef, side: Side, col: number, row: number) {
  // Kuş ordusu spawns 5 individual birds
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
          name: `Kuş ${index + 1}`,
          hp: 20,
          dmg: 10,
          cd: 1.0,
        },
        side,
        col: Math.max(0, Math.min(COLS - 1, col + dc * mult)),
        row: Math.max(0, Math.min(ROWS - 1, row + dr * mult)),
        hp: 20,
        maxHp: 20,
        cdLeft: 1.0,
        flying: true,
      });
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
    flying: card.range === "hava",
    underground: isMiner,
    doktorAbilityCd: isDoktor ? 0 : undefined,
    chargeTime: card.id === "atli" ? 0 : undefined,
    isCharging: card.id === "atli" ? true : undefined,
    bomberUsesLeft: card.id === "bombalama-ucagi" ? 1 : undefined,
  });
}

function attackRange(card: CardDef): number {
  if (card.id === "sapanci") return 25.0; // Extremely high range, can shoot targeting backline
  if (card.range === "yakın") return 1.1;
  if (card.range === "uzak") return 4.5;
  return 5.5;
}

function speed(card: CardDef): number {
  if (card.id === "atli") return 2.4; // Fast cavalry
  if (card.id === "mizrakli") return 1.4; // Fast melee
  if (card.id === "kilicli") return 0.8; // Slow melee
  if (card.id === "dev") return 0.5; // Very slow tank
  if (card.id === "tufekci") return 0.7; // Slow shooter
  if (card.id === "topcu") return 0.5; // Very slow cannon
  if (card.range === "hava") return 1.3;
  if (card.range === "uzak") return 0.9;
  return 1.1;
}

function projectileKind(card: CardDef): Projectile["kind"] | null {
  if (card.id === "sapanci") return "stone";
  if (card.id === "okcu") return "arrow";
  if (card.id === "tufekci") return "bullet";
  if (card.id === "topcu" || card.id === "bombalama-ucagi") return "bomb";
  if (card.id === "ejder") return "fire";
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
  
  if (p.aoeRange) {
    state.units.forEach((targetUnit) => {
      if (targetUnit.side !== p.side && isUnitTargetable(targetUnit)) {
        if (Math.abs(targetUnit.col - p.toCol) <= p.aoeRange! && Math.abs(targetUnit.row - p.toRow) <= p.aoeRange!) {
          applyCombatDamage(targetUnit, p.damage, attacker);
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
    if (best) applyCombatDamage(best, p.damage, attacker);
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
  state.projectiles.forEach((p) => (p.t += dt / p.duration));
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
  }

  // BOT AI trigger of active abilities on opportunity
  for (const u of state.units) {
    if (u.side === "bot" && u.hp > 0) {
      if (state.battleId) {
        continue; // Multiplayer uses direct human click-synchronization! Skip AI.
      }
      // Ghost auto invul on low health or when first targeted
      if (u.card.id === "hayalet" && u.hp < u.maxHp * 0.7 && u.immuneTimeLeft === undefined) {
        u.immuneTimeLeft = 2.5; 
      }
      // Zırhlı defense absorption under 60% health
      if (u.card.id === "zirhli" && u.hp < u.maxHp * 0.6 && !u.zirhliDefendingTimeLeft) {
        u.zirhliDefendingTimeLeft = 8.0;
      }
      // Barrel active boost
      if (u.card.id === "bira-varili" && u.barrelAuraBoostTimeLeft === undefined) {
        u.barrelAuraBoostTimeLeft = 10.0;
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
      // Miner automatically emerges after 4 seconds underground
      if (u.card.id === "madenci" && u.underground && state.time >= 4.0) {
        emergeMiner(u);
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
        // If all ground allies are dead, retreat to the very back of her team's side!
        const targetRow = u.side === "player" ? ROWS - 1 : 0;
        if (Math.abs(u.row - targetRow) > 0.05) {
          const sp = speed(u.card) * dt * 1.25; // Escape fast to the safe baseline
          const dr = targetRow - u.row;
          const len = Math.abs(dr) || 1;
          u.row = Math.max(0, Math.min(ROWS - 1, u.row + (dr / len) * sp));
        }
      }
      continue;
    }

    // Bira Varili does not move or attack (its health is 1, acts as an aura totem)
    if (u.card.id === "bira-varili") {
      continue;
    }

    // Filter targetable enemies
    const enemies = state.units.filter((e) => {
      if (e.side === u.side || !isUnitTargetable(e)) return false;
      // Ghost is invisible unless within 3x3 grid (dist <= 1.5)
      // Ghost is also completely invisible and untargetable if its ability is active
      if (e.card.id === "hayalet") {
        if (e.immuneTimeLeft && e.immuneTimeLeft > 0) return false;
        if (Math.abs(u.col - e.col) > 1.5 || Math.abs(u.row - e.row) > 1.5) return false;
      }
      // Melee ground units cannot attack flying/aerial units
      if (e.flying && u.card.range === "yakın") return false;
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

    if (bestD <= range) {
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
          dmgValueResult *= hasSuperBoost ? 1.7 : 1.3;
        }

        const kind = projectileKind(u.card);
        if (kind) {
          let aoeRange = 0;
          if (u.card.id === "bombalama-ucagi") aoeRange = 2;
          else if (u.card.id === "sapanci") aoeRange = 1.5;
          else if (u.card.id === "ejder") aoeRange = 1.5;
          else if (u.card.id === "topcu") aoeRange = 2.0;

          state.projectiles.push({
            uid: nextUid(),
            side: u.side,
            fromCol: u.col,
            fromRow: u.row,
            toCol: best.col,
            toRow: best.row,
            t: 0,
            duration: Math.max(0.18, bestD * 0.08),
            kind,
            attackerUid: u.uid,
            damage: dmgValueResult,
            aoeRange: aoeRange > 0 ? aoeRange : undefined,
          });
        } else {
          // Direct single strike
          applyCombatDamage(best, dmgValueResult, u);
        }

        u.cdLeft = u.card.cd;
      }
    } else {
      // Movement sequence
      let speedFactor = speed(u.card);

      // Zırhlı ability immobilization state
      if (u.zirhliDefendingTimeLeft !== undefined && u.zirhliDefendingTimeLeft > 0) {
        speedFactor = 0; // Stands still completely
      }

      // Build Cavalry charge
      if (u.card.id === "atli" && speedFactor > 0) {
        u.chargeTime = (u.chargeTime || 0) + dt;
        if (u.chargeTime >= 0.8) {
          u.isCharging = true;
        }
      }

      const sp = speedFactor * dt;
      const dc = best.col - u.col;
      const dr = best.row - u.row;
      const len = Math.hypot(dc, dr) || 1;
      let nc = u.col + (dc / len) * sp;
      let nr = u.row + (dr / len) * sp;

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

  state.units = state.units.filter((u) => u.hp > 0);

  const playerAlive = state.units.some((u) => u.side === "player");
  const botAlive = state.units.some((u) => u.side === "bot");
  if (!playerAlive && botAlive) state.winner = "bot";
  else if (!botAlive && playerAlive) state.winner = "player";
  else if (!playerAlive && !botAlive) state.winner = "player"; // tie → player
}

/** Handles applying damage, considering invulnerabilities and defensive stances */
function applyCombatDamage(defender: Unit, dmg: number, attacker?: Unit) {
  // Check if targetable (cannot take damage if underground or emerging)
  if (!isUnitTargetable(defender)) {
    return; // takes 0 damage
  }

  // Ghost invulnerability 2.5 seconds
  if (defender.immuneTimeLeft !== undefined && defender.immuneTimeLeft > 0) {
    return; // takes 0 damage
  }
  
  // Zırhlı defense absorption (absorbs 40%, takes 60%)
  let finalDmg = defender.zirhliDefendingTimeLeft !== undefined && defender.zirhliDefendingTimeLeft > 0
    ? dmg * 0.6
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

  // Trigger Doktor flee upon taking damage
  if (defender.card.id === "doktor") {
    defender.fleeTimeLeft = 3.0; // Flees furiously for 3 seconds
  }
}

/** Explicitly triggers a units active ability */
export function triggerUnitAbility(unit: Unit, state: BattleState) {
  if (unit.hp <= 0) return;

  // 11. Hayalet: Hasar almaz olma 2.5sn
  if (unit.card.id === "hayalet") {
    unit.immuneTimeLeft = 2.5;
  }

  // 12. Madenci: yer altından fırlar
  else if (unit.card.id === "madenci") {
    if (unit.underground) {
      emergeMiner(unit);
    }
  }

  // 13. Doktor: can iyileştirme 5x5 alanda +75
  else if (unit.card.id === "doktor") {
    if ((unit.doktorAbilityCd || 0) <= 0) {
      unit.doktorAbilityCd = 5.0; // Cooldown 5s

      state.units.forEach((targetUnit) => {
        if (targetUnit.side === unit.side && isUnitTargetable(targetUnit)) {
          // Surrounding blocks (within 5.0 range / 5x5 area)
          if (dist(targetUnit, unit) <= 5.0) {
            targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + 75); // heal 75 health
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
        // Check 6x6 bounding box (within 3 blocks)
        if (Math.abs(targetUnit.col - explodeCol) <= 3 && Math.abs(targetUnit.row - explodeRow) <= 3) {
          applyCombatDamage(targetUnit, 50, unit);
        }
      }
    });
  }

  // 16. Zırhlı: 8sn savunma modu, speed=0, takes %40 less dmg
  else if (unit.card.id === "zirhli") {
    unit.zirhliDefendingTimeLeft = 8.0;
  }
}

// ---------- helpers ----------

export function makeBotDeck(arena: Arena): CardDef[] {
  let allowed = [...CARDS.filter((c) => arena.pool.includes(c.rarity))];
  if (arena.id === 1) {
    allowed = allowed.filter((c) => c.id !== "sapanci");
  }
  for (let i = allowed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = allowed[i];
    allowed[i] = allowed[j];
    allowed[j] = temp;
  }
  return allowed.slice(0, 4);
}

export { makeOpponentTrophies } from "./arenas";

export function computeRewards(
  win: boolean,
  playerTrophies: number,
  opponentTrophies: number,
): { gold: number; trophy: number } {
  const diff = opponentTrophies - playerTrophies;
  if (!win) {
    const loss = -(4 + Math.floor(Math.random() * 4));
    return { gold: 0, trophy: loss };
  }
  if (diff > 20) return { gold: 2000, trophy: 15 };
  if (diff < -20) return { gold: 500, trophy: 7 };
  return { gold: 1000, trophy: 10 };
}
