import { Player } from "@/lib/backgammon/engine";

export function BearOffPanel({ player, count }: { player: Player; count: number }) {
  const slots = Array.from({ length: 15 }, (_, i) => i < count);
  return (
    <div className="hidden md:flex flex-col items-center gap-2 w-16 shrink-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-center leading-tight">
        {player === "white" ? "White" : "Black"}<br />Borne Off
      </div>
      <div className="flex-1 flex flex-col-reverse gap-[2px] items-center bg-board-frame rounded-md p-2 w-full">
        {slots.map((filled, i) => (
          <div
            key={i}
            className={`h-1.5 w-full rounded-full ${
              filled
                ? player === "white"
                  ? "bg-checker-white"
                  : "bg-checker-black"
                : "bg-surface-2"
            }`}
          />
        ))}
      </div>
      <div className="text-sm font-mono font-bold">
        {count}<span className="text-muted-foreground">/15</span>
      </div>
    </div>
  );
}
