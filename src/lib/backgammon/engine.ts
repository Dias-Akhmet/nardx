// Long Backgammon (Nardy) engine
// Points are 0..23. Display = index+1.
// White starts on point 0 ("Point 1") with 15 checkers. Moves 0 -> 23.
// Black starts on point 12 ("Point 13") with 15 checkers. Moves 12 -> 23 -> 0 -> 11.
// Home: White 18..23, Black 6..11.

export type Player = "white" | "black";

export interface GameState {
  points: { white: number; black: number }[]; // length 24
  borneOff: { white: number; black: number };
  dice: number[]; // remaining usable dice values
  rolled: [number, number] | null;
  turn: Player;
  headUsedThisTurn: Player extends never ? never : { white: boolean; black: boolean };
  winner: Player | null;
  history: { player: Player; from: number; to: number | "off" }[];
}

export const HEAD: Record<Player, number> = { white: 0, black: 12 };

export function createInitialState(starter: Player = "white"): GameState {
  const points = Array.from({ length: 24 }, () => ({ white: 0, black: 0 }));
  points[0].white = 15;
  points[12].black = 15;
  return {
    points,
    borneOff: { white: 0, black: 0 },
    dice: [],
    rolled: null,
    turn: starter,
    headUsedThisTurn: { white: false, black: false },
    winner: null,
    history: [],
  };
}

export function rollDice(): [number, number] {
  return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}

export function diceFromRoll(roll: [number, number]): number[] {
  return roll[0] === roll[1] ? [roll[0], roll[0], roll[0], roll[0]] : [...roll];
}

// Distance along player's path (0..23)
export function distance(player: Player, point: number): number {
  if (player === "white") return point;
  return (point - 12 + 24) % 24;
}

// Resulting position after moving `d` pips. Returns 'off' if past end.
export function destination(player: Player, point: number, d: number): number | "off" {
  const newDist = distance(player, point) + d;
  if (newDist >= 24) return "off";
  if (player === "white") return point + d;
  return (12 + newDist) % 24;
}

// Highest-distance point that still has a checker (for the player)
function maxOccupiedDistance(state: GameState, player: Player): number {
  let max = -1;
  for (let p = 0; p < 24; p++) {
    if (state.points[p][player] > 0) {
      const d = distance(player, p);
      if (d > max) max = d;
    }
  }
  return max;
}

function allInHome(state: GameState, player: Player): boolean {
  for (let p = 0; p < 24; p++) {
    if (state.points[p][player] > 0 && distance(player, p) < 18) return false;
  }
  return true;
}

export function isHome(player: Player, point: number): boolean {
  return distance(player, point) >= 18;
}

export interface Move {
  from: number;
  die: number;
  to: number | "off";
}

export function legalMovesFor(state: GameState, player: Player, from: number): Move[] {
  if (state.points[from][player] === 0) return [];
  // Head rule: only one checker per turn from head
  if (from === HEAD[player] && state.headUsedThisTurn[player]) return [];
  const moves: Move[] = [];
  const seenDice = new Set<number>();
  for (const d of state.dice) {
    if (seenDice.has(d)) continue;
    seenDice.add(d);
    const dest = destination(player, from, d);
    if (dest === "off") {
      if (!allInHome(state, player)) continue;
      const distFrom = distance(player, from);
      const exact = 24 - distFrom === d;
      if (exact) {
        moves.push({ from, die: d, to: "off" });
      } else if (d > 24 - distFrom) {
        // overshoot allowed only if no checker further from home (lower distance)
        const maxD = maxOccupiedDistance(state, player);
        if (distFrom === maxD) moves.push({ from, die: d, to: "off" });
      }
    } else {
      const opp: Player = player === "white" ? "black" : "white";
      if (state.points[dest][opp] > 0) continue;
      moves.push({ from, die: d, to: dest });
    }
  }
  return moves;
}

export function allLegalMoves(state: GameState, player: Player): Move[] {
  const out: Move[] = [];
  for (let p = 0; p < 24; p++) out.push(...legalMovesFor(state, player, p));
  return out;
}

export function applyMove(state: GameState, player: Player, move: Move): GameState {
  const points = state.points.map((p) => ({ ...p }));
  points[move.from][player] -= 1;
  if (move.to !== "off") {
    points[move.to][player] += 1;
  }
  const borneOff = { ...state.borneOff };
  if (move.to === "off") borneOff[player] += 1;

  const dice = [...state.dice];
  const idx = dice.indexOf(move.die);
  if (idx >= 0) dice.splice(idx, 1);

  const headUsedThisTurn = { ...state.headUsedThisTurn };
  if (move.from === HEAD[player]) headUsedThisTurn[player] = true;

  const winner: Player | null = borneOff[player] === 15 ? player : null;

  return {
    ...state,
    points,
    borneOff,
    dice,
    headUsedThisTurn,
    winner,
    history: [...state.history, { player, from: move.from, to: move.to }],
  };
}

export function endTurn(state: GameState): GameState {
  const next: Player = state.turn === "white" ? "black" : "white";
  return {
    ...state,
    turn: next,
    dice: [],
    rolled: null,
    headUsedThisTurn: { white: false, black: false },
  };
}

export function startTurn(state: GameState, roll: [number, number]): GameState {
  return {
    ...state,
    rolled: roll,
    dice: diceFromRoll(roll),
    headUsedThisTurn: { white: false, black: false },
  };
}

export function hasAnyMove(state: GameState, player: Player): boolean {
  if (state.dice.length === 0) return false;
  return allLegalMoves(state, player).length > 0;
}
