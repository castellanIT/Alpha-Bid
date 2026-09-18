"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#f5c518", "#ffe566", "#e10600", "#ff4d45", "#c0c0c0", "#ffffff"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rot: number;
  vr: number;
  life: number;
};

export function ConfettiBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles: Particle[] = [];
    for (let i = 0; i < 160; i++) {
      particles.push({
        x: window.innerWidth * (0.2 + Math.random() * 0.6),
        y: -20 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 14,
        vy: 4 + Math.random() * 10,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 12,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        life: 1,
      });
    }

    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.vy += 0.18;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.008;
        if (p.life <= 0) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (frame < 180) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[80]"
      aria-hidden
    />
  );
}
