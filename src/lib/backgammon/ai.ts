import {
  GameState,
  Player,
  allLegalMoves,
  applyMove,
  distance,
  Move,
} from "./engine";

// Greedy AI: prefers bear off, then farthest advancement (highest distance),
// avoids leaving head if better moves exist, and stacks on existing points.
export function chooseAIMove(state: GameState, player: Player): Move | null {
  const moves = allLegalMoves(state, player);
  if (moves.length === 0) return null;

  const scored = moves.map((m) => {
    let score = 0;
    if (m.to === "off") score += 1000;
    else {
      const distGain = distance(player, m.to) - distance(player, m.from);
      score += distGain * 2;
      // stack bonus
      if (state.points[m.to][player] > 0) score += 5;
      // prefer reaching home
      if (distance(player, m.to) >= 18) score += 8;
    }
    // discourage opening head when other options exist
    if (m.from === (player === "white" ? 0 : 12)) score -= 3;
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].m;
}

export function planAITurn(state: GameState, player: Player): Move[] {
  const plan: Move[] = [];
  let cur = state;
  let guard = 0;
  while (cur.dice.length > 0 && !cur.winner && guard++ < 8) {
    const mv = chooseAIMove(cur, player);
    if (!mv) break;
    plan.push(mv);
    cur = applyMove(cur, player, mv);
  }
  return plan;
}
