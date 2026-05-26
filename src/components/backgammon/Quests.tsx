import { Target, Zap, Trophy, Sparkles, Lock } from "lucide-react";

interface Quest {
  title: string;
  desc: string;
  progress: number;
  goal: number;
  reward: number;
}

const DAILY: Quest[] = [
  { title: "Win Streak", desc: "Win 2 games in a row", progress: 1, goal: 2, reward: 50 },
  { title: "Bear Off Master", desc: "Bear off 15 checkers total", progress: 9, goal: 15, reward: 50 },
  { title: "Challenge the Bot", desc: "Play 1 game against AI", progress: 0, goal: 1, reward: 50 },
];

export function Quests({ onPlay }: { onPlay?: () => void }) {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Quests & Puzzles</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">
        Complete daily challenges and tactical puzzles to earn XP and climb the ranks.
      </p>

      {/* Daily Quests */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" /> Daily Quests
          </h2>
          <span className="text-xs text-muted-foreground font-mono">Resets in 14h 22m</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {DAILY.map((q) => {
            const pct = Math.min(100, (q.progress / q.goal) * 100);
            const done = q.progress >= q.goal;
            return (
              <div
                key={q.title}
                className="rounded-xl border border-border bg-surface p-4 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{q.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      done
                        ? "bg-primary/20 text-primary"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    +{q.reward} XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 flex-1">{q.desc}</p>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full ${done ? "bg-primary" : "bg-warning"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>
                    {q.progress}/{q.goal}
                  </span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tactics Puzzle */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Tactics Puzzles
          </h2>
          <span className="text-xs text-muted-foreground">Rating: 1420</span>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 flex flex-col md:flex-row gap-6 items-center">
          <MiniBoard />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Daily Puzzle
              </span>
            </div>
            <h3 className="text-xl font-bold mb-1">White to move and trap Black</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Black has a single runner on point 7. Find the move that builds the perfect
              prime and locks the back point. Rolled dice: <span className="font-mono text-foreground">6-3</span>.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onPlay}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
              >
                Solve Puzzle
              </button>
              <button className="px-5 py-2.5 rounded-lg bg-surface-2 text-foreground font-medium text-sm border border-border flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Puzzle Archive
              </button>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>Solved today: <span className="text-foreground font-semibold">12,438</span></span>
              <span>Success: <span className="text-foreground font-semibold">38%</span></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniBoard() {
  // Stylized SVG board preview — purely decorative.
  const triangles = Array.from({ length: 12 });
  return (
    <div className="shrink-0 w-56 h-40 rounded-xl bg-surface-2 border border-border p-2 relative overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-12">
        {triangles.map((_, i) => (
          <div
            key={i}
            className="relative"
            style={{
              clipPath: i % 2 === 0 ? "polygon(50% 100%, 0 0, 100% 0)" : "polygon(50% 0, 0 100%, 100% 100%)",
              background: i % 2 === 0 ? "var(--muted)" : "var(--surface)",
              opacity: 0.65,
            }}
          />
        ))}
      </div>
      {/* Checkers */}
      <div className="absolute top-1.5 left-2 flex flex-col gap-0.5">
        <span className="w-3 h-3 rounded-full bg-foreground" />
        <span className="w-3 h-3 rounded-full bg-foreground" />
        <span className="w-3 h-3 rounded-full bg-foreground" />
      </div>
      <div className="absolute bottom-1.5 right-2 flex flex-col-reverse gap-0.5">
        <span className="w-3 h-3 rounded-full bg-primary" />
        <span className="w-3 h-3 rounded-full bg-primary" />
        <span className="w-3 h-3 rounded-full bg-primary" />
        <span className="w-3 h-3 rounded-full bg-primary" />
      </div>
      <div className="absolute bottom-1.5 left-12 w-3 h-3 rounded-full bg-foreground ring-2 ring-warning" />
      <div className="absolute inset-x-0 bottom-0 text-center text-[9px] font-mono text-muted-foreground bg-background/60 py-0.5">
        White to move · 6-3
      </div>
    </div>
  );
}
