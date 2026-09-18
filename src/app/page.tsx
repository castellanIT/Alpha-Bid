"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/Brand";
import { clearSession, loadSession, saveSession, useAuctionState } from "@/lib/hooks";

const ROLES = [
  {
    title: "Admin",
    pin: "0000",
    hint: "Run the auction & draws",
    accent: "from-[#1a0808] to-black",
  },
  {
    title: "Captain",
    pin: "1001–1008",
    hint: "Tigers → Wolves",
    accent: "from-[#120808] to-black",
  },
  {
    title: "Spectator",
    pin: "9999",
    hint: "Watch the live board",
    accent: "from-[#0a0a0a] to-black",
  },
] as const;

export default function HomePage() {
  const { state, loading } = useAuctionState();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session || !state) return;
    if (session.role === "ADMIN") router.replace("/admin");
    if (session.role === "CAPTAIN") router.replace("/captain");
    if (session.role === "SPECTATOR") router.replace("/board");
  }, [state, router]);

  function login(overridePin?: string) {
    if (!state) return;
    const value = (overridePin ?? pin).trim();
    const user = state.users.find((u) => u.pin === value);
    if (!user) {
      setErr("Invalid PIN");
      return;
    }
    saveSession(user.id, user.role);
    if (user.role === "ADMIN") router.push("/admin");
    else if (user.role === "CAPTAIN") router.push("/captain");
    else router.push("/board");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 md:py-12">
      <section className="hex-bg relative overflow-hidden rounded-2xl border border-[rgba(245,197,24,0.35)] bg-gradient-to-br from-[#1a0505] via-black to-[#120808] px-6 py-12 md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-8 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(225,6,0,0.35),transparent_60%)]" />
        <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
          <BrandMark size="lg" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.4em] text-gold">
            Live Pool Auction
          </p>
          <h1 className="font-display mt-2 text-5xl text-white md:text-7xl">
            TURF CRICKET
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            8 captains. 56 players. Purse ₹1000. Base ₹50. Bids climb by ₹25 —
            max 50% of purse.
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <button
            key={role.title}
            type="button"
            className={`panel bid-pulse-soft bg-gradient-to-br ${role.accent} text-left transition hover:border-[rgba(245,197,24,0.55)]`}
            onClick={() => {
              if (role.title === "Admin") {
                setPin("0000");
                login("0000");
              } else if (role.title === "Spectator") {
                setPin("9999");
                login("9999");
              } else {
                setPin("1001");
              }
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
              {role.title}
            </p>
            <p className="font-display mt-2 text-2xl text-white">{role.pin}</p>
            <p className="mt-1 text-sm text-muted">{role.hint}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="panel space-y-4">
          <h2 className="font-display text-3xl text-gold">Enter with PIN</h2>
          {loading && <p className="text-sm text-muted">Loading…</p>}
          <input
            className="input"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {err && <p className="text-sm text-crimson">{err}</p>}
          <button
            className="btn-primary w-full"
            onClick={() => login()}
            disabled={loading}
          >
            Join auction
          </button>
          <button
            className="btn-secondary w-full"
            onClick={() => {
              clearSession();
              setPin("");
              setErr(null);
            }}
          >
            Clear session
          </button>
        </div>

        <div className="panel space-y-3 text-sm text-muted">
          <h3 className="font-display text-2xl text-white">Quick links</h3>
          <p>Same Alpha Warriors theme on admin, captain, and board.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link className="btn-secondary" href="/board">
              Open board
            </Link>
            <Link className="btn-secondary" href="/summary">
              Squad summary
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
