import { SkinId } from "@/lib/audio";
import { SKINS } from "./SkinsGallery";
import { Lock, Sparkles } from "lucide-react";
import { useState } from "react";

interface Props {
  onEnter: (skin: SkinId) => void;
  owned: Set<SkinId>;
}

export function WelcomeScreen({ onEnter, owned }: Props) {
  const firstOwned = SKINS.find((s) => owned.has(s.id))?.id ?? "wood";
  const [selected, setSelected] = useState<SkinId>(firstOwned);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* Background flair */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-neon/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-3">
            <Sparkles className="h-3 w-3 text-primary" /> Premium Long Backgammon
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight">
            Nard<span className="text-primary">X</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm max-w-md mx-auto">
            Choose your board. Master the dice. Dominate the leaderboard.
          </p>
        </div>

        <div className="w-full max-w-5xl">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">
            Select your skin
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {SKINS.map((s) => {
              const isOwned = owned.has(s.id);
              const isActive = selected === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => isOwned && setSelected(s.id)}
                  disabled={!isOwned}
                  className={`relative rounded-xl border-2 overflow-hidden text-left group ${
                    isActive
                      ? "border-primary shadow-[0_0_0_4px_rgba(132,204,22,0.15)]"
                      : "border-border hover:border-muted-foreground/40"
                  } ${!isOwned ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className={`h-24 ${s.preview} relative`}>
                    {!isOwned && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white/90" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-surface">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div
                      className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                        s.free ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {s.free ? "FREE" : "PREMIUM"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => onEnter(selected)}
              className="px-10 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold tracking-wide shadow-lg shadow-primary/20"
            >
              Enter Game →
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center text-[10px] text-muted-foreground py-4">
        NardX · Long Backgammon · v1.0
      </div>
    </div>
  );
}
