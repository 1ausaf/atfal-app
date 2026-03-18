"use client";

import Link from "next/link";

export function MyLifeStar() {
  return (
    <div className="no-print fixed left-4 top-1/2 z-50 -translate-y-1/2 flex flex-col items-center gap-3">
      <Link
        href="/my-life"
        aria-label="My Life - your personal dashboard"
        className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gta-primary bg-gta-surface text-gta-primary shadow-gta transition-all duration-300 hover:scale-105 hover:shadow-gta-hover hover:border-gta-secondary dark:border-emerald-400 dark:bg-slate-800 dark:text-emerald-400 dark:hover:border-amber-400 animate-my-life-glow"
      >
        <StarIcon className="h-8 w-8" />
      </Link>

      <Link
        href="/activities/ijtima"
        aria-label="IJTIMA - syllabus PDFs"
        className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-gta-surface text-amber-500 shadow-gta transition-all duration-300 hover:scale-105 hover:shadow-gta-hover hover:border-amber-400 dark:bg-slate-800 dark:text-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.22)] hover:shadow-[0_0_28px_rgba(251,191,36,0.30)]"
      >
        <BookIcon className="h-7 w-7" />
      </Link>
    </div>
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

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}
