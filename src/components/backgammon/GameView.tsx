import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GameState,
  Move,
  Player,
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
import { Users, Bot, RefreshCw, Wifi, BarChart3, Copy, Check } from "lucide-react";

export type Mode = "local" | "cpu" | "online";
const TURN_SECONDS = 180;

export interface GameResult {
  winner: Player;
  byTimeout: boolean;
  mode: Mode;
  moves: number;
}

export function GameView({
  skin,
  onGameEnd,
  onReview,
}: {
  skin: SkinId;
  onGameEnd?: (r: GameResult) => void;
  onReview?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("local");
  const [state, setState] = useState<GameState>(() => createInitialState("white"));
  const [selected, setSelected] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [timers, setTimers] = useState({ white: TURN_SECONDS, black: TURN_SECONDS });
  const [timeoutWinner, setTimeoutWinner] = useState<Player | null>(null);

  // Online room state (mock)
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [waitingOpponent, setWaitingOpponent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onlineActive, setOnlineActive] = useState(false);

  const humanPlayer: Player = "white";
  const winner = state.winner ?? timeoutWinner;

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
    if (mode !== "online") {
      setRoomCode(null);
      setWaitingOpponent(false);
      setOnlineActive(false);
    }
  }, [mode, resetGame]);

  // Countdown timer
  useEffect(() => {
    if (winner) return;
    if (mode === "online" && !onlineActive) return;
    const id = setInterval(() => {
      setTimers((t) => ({ ...t, [state.turn]: t[state.turn] - 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [state.turn, winner, mode, onlineActive]);

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

  // Notify game end
  const endedRef = useRef(false);
  useEffect(() => {
    if (winner && !endedRef.current) {
      endedRef.current = true;
      playWin(skin);
      onGameEnd?.({
        winner,
        byTimeout: !!timeoutWinner,
        mode,
        moves: state.history.length,
      });
    }
    if (!winner) endedRef.current = false;
  }, [winner, timeoutWinner, mode, skin, state.history.length, onGameEnd]);

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

  // In cpu mode the human controls only white. Local mode: both. Online: only white.
  const isHumanTurn =
    mode === "local" ? true : state.turn === humanPlayer;

  // Auto-end turn when human has no moves left. Skip during AI turn (AI handles its own).
  useEffect(() => {
    if (winner) return;
    if (!state.rolled) return;
    // Skip auto end-turn if it's the AI's turn — AI loop owns the lifecycle.
    if (mode === "cpu" && state.turn === "black") return;
    if (state.dice.length === 0 || !hasAnyMove(state, state.turn)) {
      const t = setTimeout(() => {
        setState((s) => endTurn(s));
        setSelected(null);
      }, 450);
      return () => clearTimeout(t);
    }
  }, [state, winner, mode]);

  // === AI driver — runs exactly once per black turn in cpu mode ===
  const aiTurnIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== "cpu") return;
    if (winner) return;
    if (state.turn !== "black") {
      // Reset so a new black turn can be handled fresh later
      aiTurnIdRef.current = null;
      setAiThinking(false);
      return;
    }
    // Unique id per turn — uses history length as a turn marker proxy
    const id = `black-${state.history.length}-${state.rolled ? "rolled" : "unrolled"}`;
    if (aiTurnIdRef.current === id) return;
    aiTurnIdRef.current = id;

    let cancelled = false;
    setAiThinking(true);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      await sleep(800);
      if (cancelled) return;

      // Snapshot of current state for this turn
      let cur = state;

      // Roll if not already rolled
      if (!cur.rolled) {
        const roll = rollDice();
        playRoll(skin);
        cur = startTurn(cur, roll);
        setState(cur);
        await sleep(650);
        if (cancelled) return;
      }

      // Execute moves one by one until no dice / no moves
      let guard = 0;
      while (!cur.winner && cur.dice.length > 0 && hasAnyMove(cur, "black") && guard++ < 12) {
        const plan = planAITurn(cur, "black");
        if (plan.length === 0) break;
        const mv = plan[0];
        cur = applyMove(cur, "black", mv);
        if (mv.to === "off") playBearOff(skin);
        else playMove(skin);
        setState(cur);
        await sleep(450);
        if (cancelled) return;
      }

      await sleep(250);
      if (cancelled) return;

      // STRICTLY hand turn back to White
      if (!cur.winner) {
        const handed = endTurn(cur);
        setState(handed);
      }
      setAiThinking(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state.turn, winner, skin]);

  const onRoll = () => {
    if (winner) return;
    if (!isHumanTurn) return;
    if (state.rolled) return;
    if (mode === "online" && !onlineActive) return;
    resumeAudio();
    setRolling(true);
    const roll = rollDice();
    playRoll(skin);
    setTimeout(() => {
      setState((s) => startTurn(s, roll));
      setRolling(false);
    }, 450);
  };

  const onSelectPoint = (p: number) => {
    if (!isHumanTurn || winner || !state.rolled) return;
    if (selected != null && legalDestinations.has(p)) {
      const moves = legalDestinations.get(p)!;
      const m = moves.sort((a, b) => a.die - b.die)[0];
      setState((s) => applyMove(s, s.turn, m));
      playMove(skin);
      setSelected(null);
      return;
    }
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

  // Online room helpers
  const createRoom = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setRoomCode(code);
    setWaitingOpponent(true);
    setOnlineActive(false);
    // simulate opponent join
    setTimeout(() => {
      setWaitingOpponent(false);
      setOnlineActive(true);
    }, 3500);
  };

  const joinRoom = () => {
    if (!/^\d{6}$/.test(joinCode)) return;
    setRoomCode(joinCode);
    setWaitingOpponent(true);
    setOnlineActive(false);
    setTimeout(() => {
      setWaitingOpponent(false);
      setOnlineActive(true);
    }, 1200);
  };

  const opponentName =
    mode === "cpu" ? "Computer" : mode === "online" ? "Opponent_4421" : "Player 2";
  const opponentElo = mode === "cpu" ? 1450 : mode === "online" ? 1487 : 1500;
  const opponentFlag = mode === "cpu" ? "🤖" : mode === "online" ? "🌐" : "🎮";

  // Show online lobby instead of board when waiting
  const showOnlineLobby = mode === "online" && !onlineActive;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-border">
          <button
            onClick={() => setMode("local")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
              mode === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Local
          </button>
          <button
            onClick={() => setMode("cpu")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
              mode === "cpu" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Bot className="h-3.5 w-3.5" /> Vs Computer
          </button>
          <button
            onClick={() => setMode("online")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
              mode === "online" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Wifi className="h-3.5 w-3.5" /> Online Match
          </button>
        </div>
        <div className="flex items-center gap-3">
          {winner && onReview && (
            <button
              onClick={onReview}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Review Game
            </button>
          )}
          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" /> New Game
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        {showOnlineLobby ? (
          <OnlineLobby
            roomCode={roomCode}
            waiting={waitingOpponent}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onCreate={createRoom}
            onJoin={joinRoom}
            copied={copied}
            onCopy={() => {
              if (roomCode) {
                navigator.clipboard?.writeText(roomCode).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
          />
        ) : (
          <div className="max-w-[1000px] mx-auto flex flex-col gap-3">
            {mode === "online" && onlineActive && roomCode && (
              <div className="text-center text-xs text-muted-foreground">
                Online Room <span className="font-mono text-primary">#{roomCode}</span>
              </div>
            )}
            <PlayerCard
              player="black"
              name={opponentName}
              elo={opponentElo}
              flag={opponentFlag}
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
        )}
      </div>

      {winner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-6xl mb-3">{winner === humanPlayer ? "🏆" : "♟️"}</div>
            <h2 className="text-2xl font-bold mb-2">
              {winner === "white" ? "White Wins" : "Black Wins"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">{winnerText}</p>
            <div className="flex gap-2">
              {onReview && (
                <button
                  onClick={onReview}
                  className="flex-1 py-3 rounded-lg bg-surface-2 text-foreground font-semibold border border-border"
                >
                  Review Game
                </button>
              )}
              <button
                onClick={resetGame}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnlineLobby({
  roomCode,
  waiting,
  joinCode,
  setJoinCode,
  onCreate,
  onJoin,
  copied,
  onCopy,
}: {
  roomCode: string | null;
  waiting: boolean;
  joinCode: string;
  setJoinCode: (s: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-1">
          <Wifi className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Online Match</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Play against a remote opponent using a 6-digit room code.
        </p>

        {roomCode && waiting ? (
          <div className="text-center py-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Room Code
            </div>
            <div className="text-5xl font-mono font-bold tracking-[0.3em] text-primary mb-4">
              {roomCode}
            </div>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-2 text-sm font-semibold border border-border mb-6"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy code"}
            </button>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Waiting for opponent...
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="bg-surface-2 rounded-xl p-5">
              <h3 className="font-semibold mb-1">Create a room</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Generate a 6-digit code and share it with a friend.
              </p>
              <button
                onClick={onCreate}
                className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold"
              >
                Create Room
              </button>
            </div>
            <div className="bg-surface-2 rounded-xl p-5">
              <h3 className="font-semibold mb-1">Join a room</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Enter the 6-digit code your opponent shared.
              </p>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="582194"
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={onJoin}
                  disabled={joinCode.length !== 6}
                  className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
