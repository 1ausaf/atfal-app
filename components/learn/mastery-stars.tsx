"use client";

type MasteryStarsProps = {
  value: number;
  max?: number;
  sizeClass?: string;
};

function starFillClass(starNumber: number, value: number) {
  if (value >= starNumber) return "text-amber-400";
  if (value >= starNumber - 0.5) return "text-amber-300";
  return "text-slate-300 dark:text-slate-600";
}

export function MasteryStars({ value, max = 3, sizeClass = "text-xl" }: MasteryStarsProps) {
  return (
    <div className="inline-flex items-center gap-1" aria-label={`Mastery ${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((starNumber) => (
        <span key={starNumber} className={`${sizeClass} ${starFillClass(starNumber, value)} leading-none`}>
          {value >= starNumber - 0.5 && value < starNumber ? "⯨" : "★"}
        </span>
      ))}
    </div>
  );
}
