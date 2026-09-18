"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuctionState } from "@/lib/types";
import { teamName } from "@/components/AuctionUI";

function ScratchCard({
  teamLabel,
  canScratch,
  revealed,
  onReveal,
}: {
  teamLabel: string;
  canScratch: boolean;
  revealed: boolean;
  onReveal: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealedRef = useRef(false);
  const [done, setDone] = useState(revealed);

  useEffect(() => {
    if (revealed) {
      setDone(true);
      revealedRef.current = true;
    }
  }, [revealed]);

  useEffect(() => {
    if (done) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#c0c0c0");
    grad.addColorStop(0.5, "#f5c518");
    grad.addColorStop(1, "#8b0000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH", w / 2, h / 2 - 8);
    ctx.font = "12px sans-serif";
    ctx.fillText("to reveal", w / 2, h / 2 + 14);
  }, [done]);

  const scratch = useCallback(
    (clientX: number, clientY: number) => {
      if (!canScratch || revealedRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * canvas.width;
      const y = ((clientY - rect.top) / rect.height) * canvas.height;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) cleared += 1;
      }
      const pct = cleared / (canvas.width * canvas.height);
      if (pct > 0.42 && !revealedRef.current) {
        revealedRef.current = true;
        setDone(true);
        onReveal();
      }
    },
    [canScratch, onReveal]
  );

  return (
    <div className="relative h-36 w-44 overflow-hidden rounded-xl border-2 border-[rgba(245,197,24,0.55)] bg-black shadow-lg">
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a0808] to-black px-2 text-center">
        <span className="font-display text-2xl font-bold uppercase tracking-wide text-gold">
          {done || revealed ? teamLabel : "???"}
        </span>
      </div>
      {!done && (
        <canvas
          ref={canvasRef}
          width={220}
          height={160}
          className={`absolute inset-0 h-full w-full ${
            canScratch ? "cursor-crosshair" : "cursor-not-allowed opacity-90"
          }`}
          onMouseDown={(e) => {
            if (!canScratch) return;
            const move = (ev: MouseEvent) => scratch(ev.clientX, ev.clientY);
            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            scratch(e.clientX, e.clientY);
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
          onTouchStart={(e) => {
            if (!canScratch) return;
            const t = e.touches[0];
            scratch(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            if (!canScratch) return;
            e.preventDefault();
            const t = e.touches[0];
            scratch(t.clientX, t.clientY);
          }}
        />
      )}
    </div>
  );
}

export function DrawScreen({
  state,
  isAdmin,
  myTeamId,
  onAssignPicker,
  onReveal,
}: {
  state: AuctionState;
  isAdmin: boolean;
  myTeamId: string | null;
  onAssignPicker: (pickerTeamId: string) => void;
  onReveal: (cardIndex: number) => void;
}) {
  const draw = state.auction.draw;
  if (!draw || state.auction.status !== "DRAW") return null;

  const player = state.players.find((p) => p.id === draw.playerId);
  const pickerName = draw.pickerTeamId
    ? teamName(state, draw.pickerTeamId)
    : null;
  const eligiblePickers = state.teams.filter(
    (t) => !draw.contenderTeamIds.includes(t.id)
  );
  const needsPicker = !draw.pickerTeamId && draw.revealedIndex == null;
  const canScratch =
    !!draw.pickerTeamId &&
    (isAdmin || myTeamId === draw.pickerTeamId) &&
    draw.revealedIndex == null;

  return (
    <>
      {isAdmin && needsPicker && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="hex-bg w-full max-w-xl rounded-2xl border-2 border-[rgba(245,197,24,0.65)] bg-gradient-to-br from-[#1a0808] via-black to-[#0a0a0a] p-6 shadow-[0_0_50px_rgba(225,6,0,0.4)] md:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-gold">
              ₹500 Draw — Step 1
            </p>
            <h2 className="font-display mt-3 text-center text-3xl text-white md:text-4xl">
              Choose who scratches
            </h2>
            <p className="mt-3 text-center text-sm text-muted">
              {player?.name ?? "Player"} is tied at ₹500. Pick a team that did{" "}
              <span className="text-gold">not</span> match ₹500.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {draw.contenderTeamIds.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-[rgba(225,6,0,0.45)] bg-[rgba(225,6,0,0.12)] px-3 py-1 text-xs font-bold uppercase text-crimson"
                >
                  Tied: {teamName(state, id)}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {eligiblePickers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="btn-primary w-full"
                  style={{ textTransform: "none" }}
                  onClick={() => onAssignPicker(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
            {eligiblePickers.length === 0 && (
              <p className="mt-4 text-center text-crimson">
                No eligible picker teams
              </p>
            )}
          </div>
        </div>
      )}

      <div className="hex-bg rounded-2xl border-2 border-[rgba(245,197,24,0.55)] bg-gradient-to-br from-[#1a0808] via-black to-[#0a0a0a] p-6 shadow-[0_0_40px_rgba(225,6,0,0.25)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gold">
          ₹500 Draw
        </p>
        <h2 className="font-display mt-2 text-center text-4xl text-white">
          {player?.name ?? "Player"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Multiple teams matched ₹500 — scratch a card to decide the winner
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {draw.contenderTeamIds.map((id) => (
            <span
              key={id}
              className="rounded-full border border-[rgba(245,197,24,0.4)] bg-[rgba(225,6,0,0.15)] px-3 py-1 text-xs font-bold uppercase text-gold"
            >
              {teamName(state, id)}
            </span>
          ))}
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-gold">
          {pickerName
            ? `Picker: ${pickerName}${
                canScratch ? " — scratch a card now" : " will scratch"
              }`
            : isAdmin
              ? "Select a picker team in the prompt…"
              : "Waiting for admin to assign a picker…"}
        </p>

        {draw.pickerTeamId && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {draw.cardOrder.map((teamId, index) => (
              <ScratchCard
                key={`${draw.playerId}-${index}`}
                teamLabel={teamName(state, teamId)}
                canScratch={canScratch}
                revealed={draw.revealedIndex === index}
                onReveal={() => onReveal(index)}
              />
            ))}
          </div>
        )}

        {!draw.pickerTeamId && (
          <div className="mt-6 flex flex-wrap justify-center gap-4 opacity-40">
            {draw.cardOrder.map((_, index) => (
              <div
                key={index}
                className="flex h-36 w-44 items-center justify-center rounded-xl border-2 border-dashed border-[rgba(245,197,24,0.35)] bg-black/50"
              >
                <span className="text-xs uppercase tracking-widest text-muted">
                  Locked
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
