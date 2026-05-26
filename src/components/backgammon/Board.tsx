import { GameState, Player, Move, HEAD } from "@/lib/backgammon/engine";

interface BoardProps {
  state: GameState;
  selectable: boolean;
  selectedFrom: number | null;
  legalDestinations: Map<number, Move[]>; // dest point -> moves
  legalBearOffSources: Set<number>;
  onSelectPoint: (p: number) => void;
  onBearOff: (p: number) => void;
  humanPlayer: Player;
}

// Top row: points displayed as White-perspective. We show
// Bottom row (left->right): points 1..12 (indices 0..11)
// Top row (left->right): points 24..13 (indices 23..12)
// White moves bottom-left -> bottom-right -> top-right -> top-left.

function Checker({
  player,
  index,
  total,
  size,
}: {
  player: Player;
  index: number;
  total: number;
  size: number;
}) {
  const maxVisible = 5;
  if (index >= maxVisible && index !== total - 1) return null;
  return (
    <div
      className={`checker-anim absolute rounded-full border ${
        player === "white"
          ? "bg-checker-white border-zinc-300"
          : "bg-checker-black border-zinc-700"
      } shadow-md flex items-center justify-center text-[10px] font-bold ${
        player === "white" ? "text-zinc-700" : "text-zinc-300"
      }`}
      style={{
        width: size,
        height: size,
        bottom: index < maxVisible ? index * (size * 0.35) : (maxVisible - 1) * (size * 0.35),
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      {index === maxVisible - 1 && total > maxVisible ? total : ""}
    </div>
  );
}

function Triangle({
  pointIndex,
  flipped,
  light,
  state,
  highlight,
  selected,
  canBearOff,
  onClick,
  onDoubleClick,
}: {
  pointIndex: number;
  flipped: boolean; // true for top row (pointing down)
  light: boolean;
  state: GameState;
  highlight: boolean;
  selected: boolean;
  canBearOff: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const cell = state.points[pointIndex];
  const player: Player | null = cell.white > 0 ? "white" : cell.black > 0 ? "black" : null;
  const total = cell.white + cell.black;
  // Triangle: 90% of column height, anchored top or bottom
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`relative h-full w-full cursor-pointer group select-none ${
        flipped ? "flex flex-col-reverse" : "flex flex-col"
      }`}
    >
      {/* SVG triangle */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <polygon
          points={flipped ? "0,0 100,0 50,100" : "0,100 100,100 50,0"}
          fill={light ? "var(--color-tri-light)" : "var(--color-tri-dark)"}
          stroke={selected ? "var(--color-primary)" : highlight ? "var(--color-primary)" : "transparent"}
          strokeWidth={selected ? 3 : highlight ? 2 : 0}
          opacity={highlight && !selected ? 0.95 : 1}
        />
        {canBearOff && (
          <polygon
            points={flipped ? "0,0 100,0 50,100" : "0,100 100,100 50,0"}
            fill="var(--color-warning)"
            opacity="0.18"
          />
        )}
      </svg>
      {/* point number */}
      <div
        className={`absolute ${flipped ? "top-0.5" : "bottom-0.5"} left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground/70`}
      >
        {pointIndex + 1}
      </div>
      {/* checkers stack area */}
      <div
        className={`absolute left-0 right-0 ${
          flipped ? "top-0 h-[88%] rotate-180" : "bottom-0 h-[88%]"
        }`}
      >
        {player &&
          Array.from({ length: total }).map((_, i) => (
            <Checker
              key={i}
              player={player}
              index={i}
              total={total}
              size={32}
            />
          ))}
      </div>
    </div>
  );
}

export function Board(props: BoardProps) {
  const {
    state,
    selectable,
    selectedFrom,
    legalDestinations,
    legalBearOffSources,
    onSelectPoint,
    onBearOff,
    humanPlayer,
  } = props;

  // Top row: indices 23..12 (left to right)
  const topRow = Array.from({ length: 12 }, (_, i) => 23 - i);
  // Bottom row: indices 0..11
  const bottomRow = Array.from({ length: 12 }, (_, i) => i);

  const renderRow = (indices: number[], flipped: boolean) => (
    <div className="flex h-full">
      {indices.map((p, i) => {
        const isBar = i === 6; // bar between 6th and 7th
        const light = (p + (flipped ? 1 : 0)) % 2 === 0;
        const highlight = legalDestinations.has(p) || legalBearOffSources.has(p);
        const selected = selectedFrom === p;
        return (
          <>
            {isBar && (
              <div
                key={`bar-${flipped}`}
                className="w-3 h-full bg-board-frame shrink-0"
              />
            )}
            <div key={p} className="flex-1 h-full min-w-0">
              <Triangle
                pointIndex={p}
                flipped={flipped}
                light={light}
                state={state}
                highlight={highlight}
                selected={selected}
                canBearOff={legalBearOffSources.has(p)}
                onClick={() => selectable && onSelectPoint(p)}
                onDoubleClick={() => legalBearOffSources.has(p) && onBearOff(p)}
              />
            </div>
          </>
        );
      })}
    </div>
  );

  return (
    <div className="w-full max-w-[880px] mx-auto">
      <div
        className="relative w-full bg-board-frame rounded-xl p-3 shadow-2xl"
        style={{ aspectRatio: "16 / 10" }}
      >
        <div className="absolute inset-3 bg-board-bg rounded-md flex flex-col overflow-hidden">
          <div className="flex-1 border-b border-board-frame">{renderRow(topRow, true)}</div>
          <div className="flex-1">{renderRow(bottomRow, false)}</div>
        </div>
        {/* Head indicator overlay (subtle) */}
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">
            {humanPlayer === "white" ? "White moves →" : "Black moves →"}
          </div>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1 font-mono">
        <span>Head Rule: 1 from start/turn</span>
        <span>Double-click to bear off</span>
      </div>
    </div>
  );
}
