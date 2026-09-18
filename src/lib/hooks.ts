"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuctionState } from "@/lib/types";

const SESSION_KEY = "turf-auction-user";

export function loadSession(): { userId: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export function saveSession(userId: string, role: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, role }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function fetchState(userId?: string | null): Promise<AuctionState> {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`/api/auction${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load auction");
  return res.json() as Promise<AuctionState>;
}

export function useAuctionState() {
  const [state, setState] = useState<AuctionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(loadSession()?.userId ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const sessionId = loadSession()?.userId ?? userId;
        const next = await fetchState(sessionId);
        if (!cancelled) {
          setState(next);
          setLoading(false);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Connection lost");
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId]);

  const mutate = useCallback(async (body: Record<string, unknown>) => {
    setError(null);
    const sessionId = loadSession()?.userId ?? null;
    const res = await fetch("/api/auction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, userId: body.userId ?? sessionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return null;
    }
    setState(data as AuctionState);
    return data as AuctionState;
  }, []);

  return { state, error, loading, mutate, setError, userId, setUserId };
}
