/**
 * Badge showing points available (e.g. on lessons). Emerald gradient, pill shape.
 * Use for "X pts" or "Up to X pts" to indicate how many points the user can earn.
 */
export function PointsBadge({
  points,
  variant = "default",
}: {
  points: number;
  variant?: "default" | "upTo";
}) {
  const label = variant === "upTo" ? `Up to ${points} pts` : `${points} pts`;
  const ariaLabel = variant === "upTo" ? `Up to ${points} points available` : `${points} points available`;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-sm whitespace-nowrap"
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
}
