import { Lock, Check } from "lucide-react";
import { SkinId } from "@/lib/audio";

export interface SkinDef {
  id: SkinId;
  name: string;
  tagline: string;
  price: string;
  free: boolean;
  preview: string;
  description: string;
}

export const SKINS: SkinDef[] = [
  {
    id: "wood",
    name: "Classic Wood",
    tagline: "Heritage tournament felt",
    price: "FREE",
    free: true,
    preview: "bg-gradient-to-br from-amber-800 via-amber-600 to-amber-900",
    description: "Walnut and maple board with weighty wooden thuds and a deep dice-rattle.",
  },
  {
    id: "pixel",
    name: "Pixel Retro",
    tagline: "8-bit arcade chiptune",
    price: "FREE",
    free: true,
    preview: "bg-gradient-to-br from-fuchsia-500 via-amber-400 to-cyan-400",
    description: "Pixelated arcade board with chiptune blips and retro selects.",
  },
  {
    id: "minimal",
    name: "Minimalist Smooth",
    tagline: "Modern monochrome",
    price: "FREE",
    free: true,
    preview: "bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-800",
    description: "Quiet monochrome surface with refined typography and crisp lines.",
  },
  {
    id: "neon",
    name: "Neon Cyberpunk",
    tagline: "Glowing synthwave grid",
    price: "$6.99",
    free: false,
    preview: "bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-indigo-600",
    description: "Neon grids with synthetic laser sweeps and futuristic interface beeps.",
  },
  {
    id: "marble",
    name: "Royal Marble",
    tagline: "Ivory and onyx",
    price: "$7.99",
    free: false,
    preview: "bg-gradient-to-br from-stone-100 via-stone-300 to-stone-700",
    description: "Polished marble surfaces with gold inlays and a regal acoustic feel.",
  },
];

interface Props {
  active: SkinId;
  owned: Set<SkinId>;
  onSelect: (id: SkinId) => void;
  onPurchase: (skin: SkinDef) => void;
}

export function SkinsGallery({ active, owned, onSelect, onPurchase }: Props) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Skins</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cosmetic boards with their own sound packs. Three are free — premium skins unlock with a one-time purchase.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SKINS.map((s) => {
          const isOwned = owned.has(s.id);
          const isActive = active === s.id;
          return (
            <div
              key={s.id}
              className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col"
            >
              <div className={`h-40 ${s.preview} relative`}>
                {!isOwned && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white/90" />
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                    Active
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className={`text-xs font-bold ${s.free ? "text-primary" : "text-muted-foreground"}`}>
                    {s.price}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
                <p className="text-xs text-muted-foreground/80 mt-3 flex-1">{s.description}</p>
                <div className="mt-4">
                  {isOwned ? (
                    <button
                      onClick={() => onSelect(s.id)}
                      disabled={isActive}
                      className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isActive ? (
                        <>
                          <Check className="h-4 w-4" /> Equipped
                        </>
                      ) : (
                        "Equip"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => onPurchase(s)}
                      className="w-full py-2 rounded-md bg-surface-2 hover:bg-secondary text-sm font-semibold"
                    >
                      Unlock for {s.price}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
