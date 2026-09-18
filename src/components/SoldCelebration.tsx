"use client";

import { useEffect, useRef, useState } from "react";
import { ConfettiBurst } from "@/components/Confetti";
import type { AuctionState, Player } from "@/lib/types";
import { teamName } from "@/components/AuctionUI";

export function useSoldCelebration(state: AuctionState | null) {
  const [burst, setBurst] = useState(0);
  const [soldPlayer, setSoldPlayer] = useState<Player | null>(null);
  const prevSoldIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!state) return;
    const sold = state.players.filter(
      (p) => !p.isCaptain && p.status === "SOLD" && (p.soldPrice ?? 0) > 0
    );
    const ids = new Set(sold.map((p) => p.id));

    if (!primed.current) {
      prevSoldIds.current = ids;
      primed.current = true;
      return;
    }

    const newlySold = sold.find((p) => !prevSoldIds.current.has(p.id));
    prevSoldIds.current = ids;

    if (newlySold) {
      setSoldPlayer(newlySold);
      setBurst((n) => n + 1);
      const t = setTimeout(() => setSoldPlayer(null), 4200);
      return () => clearTimeout(t);
    }
  }, [state]);

  return { burst, soldPlayer };
}

export function SoldCelebration({
  state,
  burst,
  soldPlayer,
}: {
  state: AuctionState;
  burst: number;
  soldPlayer: Player | null;
}) {
  return (
    <>
      <ConfettiBurst active={burst > 0} key={burst} />
      {soldPlayer && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="sold-pop hex-bg max-w-lg rounded-2xl border-2 border-[rgba(245,197,24,0.7)] bg-gradient-to-br from-[#1a0808]/95 via-black/95 to-[#0a0a0a]/95 px-8 py-10 text-center shadow-[0_0_60px_rgba(225,6,0,0.45)]">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-gold">
              Sold
            </p>
            <h2 className="font-display mt-2 text-5xl text-white md:text-6xl">
              {soldPlayer.name}
            </h2>
            <p className="mt-4 text-2xl font-bold text-gold">
              ₹{soldPlayer.soldPrice ?? 0}
            </p>
            <p className="mt-2 text-xl font-extrabold uppercase tracking-wide text-white">
              {teamName(state, soldPlayer.teamId)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
