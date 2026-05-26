import { Brain, Sparkles, CheckCircle2, BookOpen, AlertTriangle, XCircle, Star } from "lucide-react";
import { GameResult } from "./GameView";

interface Props {
  result: GameResult | null;
  onReplay: () => void;
}

interface Stats {
  accuracy: number;
  brilliant: number;
  best: number;
  book: number;
  mistakes: number;
  blunders: number;
}

function genStats(seed: number, won: boolean): Stats {
  const rand = (min: number, max: number) =>
    min + Math.floor(((Math.sin(seed++) + 1) / 2) * (max - min + 1));
  return {
    accuracy: won ? rand(75, 92) : rand(55, 74),
    brilliant: rand(0, 2),
    best: rand(8, 16),
    book: rand(4, 8),
    mistakes: won ? rand(1, 3) : rand(3, 6),
    blunders: won ? rand(0, 1) : rand(1, 3),
  };
}

export function GameReview({ result, onReplay }: Props) {
  if (!result) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">AI Coach</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Post-match analysis powered by NardX engine — finish a game to unlock your review.
        </p>
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold mb-1">No game to review yet</h2>
          <p className="text-sm text-muted-foreground">
            Play a match to get accuracy scores, move classification, and personalized coaching.
          </p>
        </div>
      </div>
    );
  }

  const youWon = result.winner === "white";
  const seed = result.moves * 13 + (youWon ? 7 : 3);
  const you = genStats(seed, youWon);
  const opp = genStats(seed + 100, !youWon);

  const commentary = youWon
    ? `Excellent control. You held the head efficiently and your bear-off timing was clean. A ${you.mistakes} small mistakes cost tempo but never threatened the lead.`
    : `You played well, but a critical Blunder around move ${Math.max(4, Math.floor(result.moves / 2))} exposed your home board and cost you the game. Focus on safer pip distribution before opening the back point.`;

  const rows: { label: string; you: number; opp: number; icon: any; text: string; bg: string }[] = [
    { label: "Brilliant", you: you.brilliant, opp: opp.brilliant, icon: Star, text: "text-cyan-400", bg: "bg-cyan-400" },
    { label: "Best", you: you.best, opp: opp.best, icon: CheckCircle2, text: "text-primary", bg: "bg-primary" },
    { label: "Book", you: you.book, opp: opp.book, icon: BookOpen, text: "text-blue-400", bg: "bg-blue-400" },
    { label: "Mistake", you: you.mistakes, opp: opp.mistakes, icon: AlertTriangle, text: "text-warning", bg: "bg-warning" },
    { label: "Blunder", you: you.blunders, opp: opp.blunders, icon: XCircle, text: "text-destructive", bg: "bg-destructive" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Game Review</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        {youWon ? "Victory" : "Defeat"} · {result.mode === "cpu" ? "vs Computer" : result.mode === "online" ? "Online Match" : "Local Match"} · {result.moves} moves
      </p>

      {/* Accuracy bar */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <AccuracyCard label="You" value={you.accuracy} highlight />
        <AccuracyCard label="Opponent" value={opp.accuracy} />
      </div>

      {/* Move classification */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Move Classification</h3>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>You</span>
            <span>Opponent</span>
          </div>
        </div>
        <div>
          {rows.map(({ label, you: y, opp: o, icon: Icon, color }) => {
            const max = Math.max(y, o, 1);
            return (
              <div key={label} className="px-5 py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-surface-2 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color.replace("text-", "bg-")} rounded-full`}
                      style={{ width: `${(y / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-mono">{y}</span>
                  <div className="flex-1 bg-surface-2 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color.replace("text-", "bg-")} opacity-60 rounded-full`}
                      style={{ width: `${(o / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-mono">{o}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commentary */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">AI Coach Commentary</h3>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{commentary}</p>
      </div>

      <button
        onClick={onReplay}
        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
      >
        Play Another Match
      </button>
    </div>
  );
}

function AccuracyCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label} Accuracy</div>
      <div className="text-4xl font-bold mt-1 mb-3">{value}%</div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${highlight ? "bg-primary" : "bg-muted-foreground"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
