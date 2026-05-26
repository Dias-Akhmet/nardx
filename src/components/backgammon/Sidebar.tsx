import { Play, Palette, Trophy, Crown, Brain } from "lucide-react";

export type Tab = "play" | "skins" | "leaderboard" | "premium" | "coach";

const items: { id: Tab; label: string; icon: typeof Play }[] = [
  { id: "play", label: "Play", icon: Play },
  { id: "coach", label: "AI Coach", icon: Brain },
  { id: "skins", label: "Skins", icon: Palette },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "premium", label: "Premium", icon: Crown },
];

export function Sidebar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <aside className="w-20 lg:w-56 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-5 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-black">
          N
        </div>
        <span className="hidden lg:inline ml-3 font-semibold tracking-tight text-lg">
          Nard<span className="text-primary">X</span>
        </span>
      </div>
      <nav className="flex-1 py-3">
        {items.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`group w-full flex items-center gap-3 px-4 lg:px-5 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground border-l-2 border-transparent"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-3 text-[10px] text-muted-foreground hidden lg:block">
        NardX · v1.0
      </div>
    </aside>
  );
}
