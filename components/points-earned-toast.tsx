"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastItem {
  id: string;
  points: number;
  exiting: boolean;
}

interface PointsEarnedContextValue {
  showPointsEarned: (points: number) => void;
}

const PointsEarnedContext = createContext<PointsEarnedContextValue | null>(null);

const TOAST_DURATION_MS = 3000;
const EXIT_START_MS = 2500;

function ToastCard({
  id,
  points,
  exiting,
  onExit,
}: {
  id: string;
  points: number;
  exiting: boolean;
  onExit: (id: string) => void;
}) {
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (exiting) {
        onExit(id);
      }
    },
    [id, exiting, onExit]
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onAnimationEnd={handleAnimationEnd}
      className={
        exiting
          ? "animate-toast-unpop"
          : "animate-toast-pop"
      }
    >
      <div className="flex items-center gap-3 rounded-gta border-2 border-amber-500 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md dark:border-amber-500 dark:bg-slate-900/90 dark:shadow-none">
        <span className="text-2xl" aria-hidden="true">
          🏆
        </span>
        <p className="font-semibold tracking-wide text-gta-text">
          YOU EARNED{" "}
          <span className="font-black text-amber-600 animate-points-glow dark:text-amber-300">
            {points}
          </span>{" "}
          POINTS
        </p>
      </div>
    </div>
  );
}

export function PointsEarnedProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeToast = useCallback((id: string) => {
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timeoutsRef is stable
  }, []);

  const startExit = useCallback((id: string) => {
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timeoutsRef is stable
  }, []);

  const showPointsEarned = useCallback(
    (points: number) => {
      if (points <= 0) return;
      const id = crypto.randomUUID?.() ?? `toast-${Date.now()}-${Math.random()}`;
      const item: ToastItem = { id, points, exiting: false };
      setToasts((prev) => [item, ...prev]);

      const exitTimeout = setTimeout(() => startExit(id), EXIT_START_MS);
      timeoutsRef.current.set(id, exitTimeout);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timeoutsRef is stable
    [startExit]
  );

  return (
    <PointsEarnedContext.Provider value={{ showPointsEarned }}>
      {children}
      <div
        className="fixed left-1/2 top-4 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
        aria-label="Points earned notifications"
      >
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            id={t.id}
            points={t.points}
            exiting={t.exiting}
            onExit={removeToast}
          />
        ))}
      </div>
    </PointsEarnedContext.Provider>
  );
}

export function usePointsEarnedToast(): PointsEarnedContextValue {
  const ctx = useContext(PointsEarnedContext);
  if (!ctx) {
    return {
      showPointsEarned: () => {},
    };
  }
  return ctx;
}
