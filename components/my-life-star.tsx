"use client";

import Link from "next/link";

export function MyLifeStar() {
  return (
    <Link
      href="/my-life"
      aria-label="My Life - your personal dashboard"
      className="no-print fixed left-4 top-1/2 z-50 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-2xl border-2 border-gta-primary bg-gta-surface text-gta-primary shadow-gta transition-all duration-300 hover:scale-105 hover:shadow-gta-hover hover:border-gta-secondary dark:border-emerald-400 dark:bg-slate-800 dark:text-emerald-400 dark:hover:border-amber-400 animate-my-life-glow"
    >
      <StarIcon className="h-8 w-8" />
    </Link>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
