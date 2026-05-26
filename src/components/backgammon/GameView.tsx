import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GameState,
  Move,
  Player,
  allLegalMoves,
  applyMove,
  createInitialState,
  endTurn,
  hasAnyMove,
  legalMovesFor,
  rollDice,
  startTurn,
} from "@/lib/backgammon/engine";
import { planAITurn } from "@/lib/backgammon/ai";
import { SkinId, playBearOff, playMove, playRoll, playWin, resumeAudio } from "@/lib/audio";
import { Board } from "./Board";
import { PlayerCard } from "./PlayerCard";
import { DiceArea } from "./DiceArea";
import { BearOffPanel } from "./BearOffPanel";
import { Users, Bot, RefreshCw } from "lucide-react";

type Mode = "local" | "cpu";
const TURN_SECONDS = 180;

export function GameView({ skin }: { skin: SkinId }) {
  const [mode, setMode] = useState<Mode>("local");
  const [state, setState] = useState<GameState>(() => createInitialState("white"));
  const [selected, setSelected] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [timers, setTimers] = useState({ white: TURN_SECONDS, black: TURN_SECONDS });
  const [timeoutWinner, setTimeoutWinner] = useState<Player | null>(null);

  const humanPlayer: Player = "white";
  const winner = state.winner ?? timeoutWinner;

  // Reset everything
  const resetGame = useCallback(() => {
    setState(createInitialState("white"));
    setSelected(null);
    setTimers({ white: TURN_SECONDS, black: TURN_SECONDS });
    setTimeoutWinner(null);
    setAiThinking(false);
    setRolling(false);
  }, []);

  useEffect(() => {
    resetGame();
  }, [mode, resetGame]);

  // Countdown timer
  useEffect(() => {
    if (winner) return;
    const id = setInterval(() => {
      setTimers((t) => {
        const next = { ...t, [state.turn]: t[state.turn] - 1 };
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.turn, winner]);

  useEffect(() => {
    if (winner) return;
    if (timers.white <= 0) {
      setTimeoutWinner("black");
      playWin(skin);
    } else if (timers.black <= 0) {
      setTimeoutWinner("white");
      playWin(skin);
    }
  }, [timers, winner, skin]);

  // Winner sound
  useEffect(() => {
    if (state.winner) playWin(skin);
  }, [state.winner, skin]);

  // Compute legal moves from selected origin
  const legalDestinations = useMemo(() => {
    const map = new Map<number, Move[]>();
    if (selected == null) return map;
    const moves = legalMovesFor(state, state.turn, selected);
    for (const m of moves) {
      if (m.to !== "off") {
        const arr = map.get(m.to) ?? [];
        arr.push(m);
        map.set(m.to, arr);
      }
    }
    return map;
  }, [state, selected]);

  const legalBearOffSources = useMemo(() => {
    const set = new Set<number>();
    if (winner) return set;
    if (state.dice.length === 0) return set;
    for (let p = 0; p < 24; p++) {
      const moves = legalMovesFor(state, state.turn, p);
      if (moves.some((m) => m.to === "off")) set.add(p);
    }
    return set;
  }, [state, winner]);

  const isHumanTurn = mode === "local" || state.turn === humanPlayer;

  // Auto-end turn when no moves remain
  useEffect(() => {
    if (winner) return;
    if (!state.rolled) return;
    if (state.dice.length === 0 || !hasAnyMove(state, state.turn)) {
      const t = setTimeout(() => {
        setState((s) => endTurn(s));
        setSelected(null);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [state, winner]);

  // AI driver
  const aiRunningRef = useRef(false);
  useEffect(() => {
    if (winner) return;
    if (mode !== "cpu") return;
    if (state.turn !== "black") return;
    if (aiRunningRef.current) return;
    aiRunningRef.current = true;
    setAiThinking(true);

    const run = async () => {
      await new Promise((r) => setTimeout(r, 900));
      // Roll if needed
      let cur = state;
      if (!cur.rolled) {
        const roll = rollDice();
        playRoll(skin);
        cur = startTurn(cur, roll);
        setState(cur);
        await new Promise((r) => setTimeout(r, 700));
      }
      // Execute plan one move at a time
      let guard = 0;
      while (!cur.winner && cur.dice.length > 0 && hasAnyMove(cur, "black") && guard++ < 8) {
        const plan = planAITurn(cur, "black");
        if (plan.length === 0) break;
        const mv = plan[0];
        cur = applyMove(cur, "black", mv);
        if (mv.to === "off") playBearOff(skin); else playMove(skin);
        setState(cur);
        await new Promise((r) => setTimeout(r, 500));
      }
      await new Promise((r) => setTimeout(r, 300));
      if (!cur.winner) {
        setState((s) => endTurn(s));
      }
      setAiThinking(false);
      aiRunningRef.current = false;
    };
    run();
  }, [mode, state.turn, state.rolled, winner, skin, state]);

  // Handlers
  const onRoll = () => {
    if (winner) return;
    if (!isHumanTurn) return;
    if (state.rolled) return;
    resumeAudio();
    setRolling(true);
    const roll = rollDice();
    playRoll(skin);
    setTimeout(() => {
      setState((s) => startTurn(s, roll));
      setRolling(false);
    }, 500);
  };

  const onSelectPoint = (p: number) => {
    if (!isHumanTurn || winner || !state.rolled) return;
    // If clicking a destination of currently selected piece, perform move
    if (selected != null && legalDestinations.has(p)) {
      const moves = legalDestinations.get(p)!;
      // pick smallest die that achieves it (deterministic)
      const m = moves.sort((a, b) => a.die - b.die)[0];
      setState((s) => applyMove(s, s.turn, m));
      playMove(skin);
      setSelected(null);
      return;
    }
    // Otherwise select if has own checker
    if (state.points[p][state.turn] > 0) {
      setSelected(selected === p ? null : p);
    } else {
      setSelected(null);
    }
  };

  const onBearOff = (p: number) => {
    if (!isHumanTurn || winner || !state.rolled) return;
    const moves = legalMovesFor(state, state.turn, p).filter((m) => m.to === "off");
    if (moves.length === 0) return;
    const m = moves.sort((a, b) => a.die - b.die)[0];
    setState((s) => applyMove(s, s.turn, m));
    playBearOff(skin);
    setSelected(null);
  };

  const turnLabel = winner
    ? "Game Over"
    : aiThinking
    ? "Computer thinking…"
    : `${state.turn === "white" ? "White" : "Black"}'s turn`;

  const winnerText = winner
    ? timeoutWinner
      ? `Victory by Timeout! ${winner === "white" ? "White" : "Black"} wins!`
      : `${winner === "white" ? "White" : "Black"} bears off all 15 — Victory!`
    : "";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-border">
          <button
            onClick={() => setMode("local")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Local Match
          </button>
          <button
            onClick={() => setMode("cpu")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === "cpu" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="h-3.5 w-3.5" /> Vs Computer
          </button>
        </div>
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> New Game
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-3">
          <PlayerCard
            player="black"
            name={mode === "cpu" ? "Computer" : "Player 2"}
            elo={mode === "cpu" ? 1450 : 1500}
            flag="🤖"
            seconds={timers.black}
            active={state.turn === "black" && !winner}
            borneOff={state.borneOff.black}
          />

          <div className="flex items-stretch gap-3">
            <BearOffPanel player="black" count={state.borneOff.black} />
            <div className="flex-1 min-w-0">
              <Board
                state={state}
                selectable={isHumanTurn && !winner && !!state.rolled}
                selectedFrom={selected}
                legalDestinations={legalDestinations}
                legalBearOffSources={legalBearOffSources}
                onSelectPoint={onSelectPoint}
                onBearOff={onBearOff}
                humanPlayer={humanPlayer}
              />
              <div className="mt-4">
                <DiceArea
                  rolled={state.rolled}
                  remaining={state.dice}
                  canRoll={isHumanTurn && !winner && !state.rolled && !aiThinking}
                  rolling={rolling}
                  onRoll={onRoll}
                  turnLabel={turnLabel}
                />
              </div>
            </div>
            <BearOffPanel player="white" count={state.borneOff.white} />
          </div>

          <PlayerCard
            player="white"
            name="You"
            elo={1500}
            flag="🇺🇸"
            seconds={timers.white}
            active={state.turn === "white" && !winner}
            borneOff={state.borneOff.white}
          />
        </div>
      </div>

      {/* Victory modal */}
      {winner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-6xl mb-3">{winner === humanPlayer && mode === "cpu" ? "🏆" : "♟️"}</div>
            <h2 className="text-2xl font-bold mb-2">
              {winner === "white" ? "White Wins" : "Black Wins"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">{winnerText}</p>
            <button
              onClick={resetGame}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110 transition"
            >
              Reset & Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
