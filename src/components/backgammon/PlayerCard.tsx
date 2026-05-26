import { Player } from "@/lib/backgammon/engine";

interface Props {
  player: Player;
  name: string;
  elo: number;
  flag: string;
  seconds: number;
  active: boolean;
  borneOff: number;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function PlayerCard({ player, name, elo, flag, seconds, active, borneOff }: Props) {
  const low = seconds <= 30;
  return (
    <div
      className={`flex items-center justify-between rounded-lg border bg-surface px-4 py-3 transition-all ${
        active ? "border-primary/60 shadow-[0_0_0_1px_var(--color-primary)]" : "border-border"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-md flex items-center justify-center font-bold text-sm ${
            player === "white" ? "bg-checker-white text-zinc-900" : "bg-checker-black text-white border border-border"
          }`}
        >
          {player === "white" ? "W" : "B"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{name}</span>
            <span className="text-xs">{flag}</span>
          </div>
          <div className="text-xs text-muted-foreground">({elo})</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          Borne off <span className="text-foreground font-semibold">{borneOff}/15</span>
        </div>
        <div
          className={`tabular-nums font-mono text-lg px-3 py-1.5 rounded-md min-w-[72px] text-center transition-colors ${
            active
              ? low
                ? "bg-destructive/20 text-destructive"
                : "bg-primary text-primary-foreground"
              : "bg-surface-2 text-muted-foreground"
          }`}
        >
          {fmt(Math.max(0, seconds))}
        </div>
      </div>
    </div>
  );
}
