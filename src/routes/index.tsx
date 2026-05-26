import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar, Tab } from "@/components/backgammon/Sidebar";
import { GameView } from "@/components/backgammon/GameView";
import { SKINS, SkinDef, SkinsGallery } from "@/components/backgammon/SkinsGallery";
import { SkinId } from "@/lib/audio";
import { Trophy, Crown, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nardy — Long Backgammon" },
      { name: "description", content: "Premium long backgammon (Nardy) with AI opponent, timed matches and unlockable skins." },
    ],
  }),
  component: Index,
});

function Leaderboard() {
  const rows = [
    { rank: 1, name: "GrandMaster_42", elo: 2450, flag: "🇷🇺", wins: 1284 },
    { rank: 2, name: "NardyKing", elo: 2398, flag: "🇹🇷", wins: 1102 },
    { rank: 3, name: "DiceQueen", elo: 2341, flag: "🇮🇷", wins: 998 },
    { rank: 4, name: "BoardSage", elo: 2287, flag: "🇦🇲", wins: 871 },
    { rank: 5, name: "PipMaster", elo: 2233, flag: "🇬🇪", wins: 812 },
    { rank: 6, name: "You", elo: 1500, flag: "🇺🇸", wins: 12 },
  ];
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
        <Trophy className="h-7 w-7 text-warning" /> Leaderboard
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Top long backgammon players this season.</p>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 w-12">#</th>
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-right px-4 py-3">ELO</th>
              <th className="text-right px-4 py-3">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.rank}
                className={`border-t border-border ${r.name === "You" ? "bg-primary/10" : ""}`}
              >
                <td className="px-4 py-3 font-mono text-muted-foreground">{r.rank}</td>
                <td className="px-4 py-3 font-semibold">
                  {r.flag} {r.name}
                </td>
                <td className="px-4 py-3 text-right font-mono">{r.elo}</td>
                <td className="px-4 py-3 text-right font-mono">{r.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Premium() {
  const perks = [
    "Unlimited rated matches",
    "All skins unlocked instantly",
    "Advanced match analysis",
    "Custom dice and checker sets",
    "Ad-free experience",
  ];
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="rounded-2xl border border-warning/40 bg-gradient-to-br from-warning/10 to-transparent p-8">
        <Crown className="h-10 w-10 text-warning mb-3" />
        <h1 className="text-3xl font-bold">Nardy Premium</h1>
        <p className="text-muted-foreground mt-2">Unlock the full experience for $9.99/month.</p>
        <ul className="mt-6 space-y-2">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-warning" /> {p}
            </li>
          ))}
        </ul>
        <button className="mt-8 w-full py-3 rounded-lg bg-warning text-zinc-900 font-bold hover:brightness-110 transition">
          Start 7-Day Free Trial
        </button>
      </div>
    </div>
  );
}

function PurchaseModal({ skin, onClose, onConfirm }: {
  skin: SkinDef | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!skin) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Unlock {skin.name}</h2>
            <p className="text-xs text-muted-foreground">{skin.tagline}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`h-32 rounded-lg ${skin.preview} mb-4`} />
        <p className="text-sm text-muted-foreground mb-4">{skin.description}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm">One-time purchase</span>
          <span className="text-xl font-bold">{skin.price}</span>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:brightness-110 transition"
        >
          Simulate Purchase
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Demo only — no real charges.
        </p>
      </div>
    </div>
  );
}

function Index() {
  const [tab, setTab] = useState<Tab>("play");
  const [skin, setSkin] = useState<SkinId>("pixel");
  const [owned, setOwned] = useState<Set<SkinId>>(new Set(["pixel"]));
  const [purchaseTarget, setPurchaseTarget] = useState<SkinDef | null>(null);

  const skinClass = `skin-${skin}`;

  return (
    <div className={`flex h-screen w-full bg-background text-foreground ${skinClass}`}>
      <Sidebar tab={tab} onChange={setTab} />
      <main className="flex-1 flex flex-col min-w-0">
        {tab === "play" && <GameView skin={skin} />}
        {tab === "skins" && (
          <SkinsGallery
            active={skin}
            owned={owned}
            onSelect={setSkin}
            onPurchase={setPurchaseTarget}
          />
        )}
        {tab === "leaderboard" && <Leaderboard />}
        {tab === "premium" && <Premium />}
      </main>
      <PurchaseModal
        skin={purchaseTarget}
        onClose={() => setPurchaseTarget(null)}
        onConfirm={() => {
          if (purchaseTarget) {
            setOwned((o) => new Set(o).add(purchaseTarget.id));
            setSkin(purchaseTarget.id);
            setPurchaseTarget(null);
          }
        }}
      />
      {/* Ensure all skin classes are emitted */}
      <div className="hidden skin-pixel skin-wood skin-neon" />
    </div>
  );
}
// Reference imports to avoid unused warnings
void SKINS;
