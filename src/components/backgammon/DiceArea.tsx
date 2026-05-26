interface Props {
  rolled: [number, number] | null;
  remaining: number[];
  canRoll: boolean;
  rolling: boolean;
  onRoll: () => void;
  turnLabel: string;
}

const Pip = ({ x, y }: { x: number; y: number }) => (
  <div
    className="absolute h-1.5 w-1.5 rounded-full bg-zinc-900"
    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
  />
);

const PIP_MAP: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value, used, shaking }: { value: number; used?: boolean; shaking?: boolean }) {
  return (
    <div
      className={`relative h-12 w-12 rounded-lg bg-checker-white shadow-md ${
        used ? "opacity-30" : ""
      } ${shaking ? "dice-shake" : ""}`}
    >
      {PIP_MAP[value]?.map(([x, y], i) => <Pip key={i} x={x} y={y} />)}
    </div>
  );
}

export function DiceArea({ rolled, remaining, canRoll, rolling, onRoll, turnLabel }: Props) {
  const remCount = (v: number) => remaining.filter((d) => d === v).length;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{turnLabel}</div>
      <div className="flex items-center gap-3 min-h-[56px]">
        {rolled ? (
          rolled[0] === rolled[1] ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="relative">
                <Die value={rolled[0]} used={remCount(rolled[0]) <= i} shaking={rolling} />
              </div>
            ))
          ) : (
            rolled.map((v, i) => (
              <Die key={i} value={v} used={remCount(v) === 0} shaking={rolling} />
            ))
          )
        ) : (
          <div className="text-muted-foreground text-sm">Roll the dice to begin your turn</div>
        )}
      </div>
      <button
        onClick={onRoll}
        disabled={!canRoll}
        className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
      >
        Roll Dice
      </button>
    </div>
  );
}
