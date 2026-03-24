type ProgressRow = {
  majlis_id: string;
  majlis_name: string;
  normalized_points: number;
  progress_pct: number;
};

type MajlisProgressPanelProps = {
  goalPoints: number;
  prize: string;
  rows: ProgressRow[];
  highlightMajlisId?: string | null;
};

export function MajlisProgressPanel({ goalPoints, prize, rows, highlightMajlisId }: MajlisProgressPanelProps) {
  return (
    <section className="card-kid p-4 md:p-5 majlis-progress-shell">
      <h2 className="text-xl font-bold text-gta-text">Majlis Progress</h2>
      <p className="text-sm text-gta-textSecondary mt-1">
        Prize: <span className="font-semibold text-gta-secondary">{prize}</span>
      </p>
      <p className="text-sm text-gta-textSecondary">Goal: {Math.round(goalPoints)} normalized points</p>

      <div className="mt-4 space-y-3">
        {rows.map((row, idx) => {
          const pct = Math.max(0, Math.min(100, Number(row.progress_pct || 0)));
          const isMine = !!highlightMajlisId && row.majlis_id === highlightMajlisId;
          return (
            <div key={row.majlis_id} className={`majlis-thermo-card ${isMine ? "majlis-thermo-card-active" : ""}`}>
              <div className="flex justify-between items-center gap-2">
                <p className="font-semibold text-gta-text">
                  #{idx + 1} {row.majlis_name}
                </p>
                <p className="text-sm font-bold text-gta-primary">{Number(row.normalized_points || 0).toFixed(2)}</p>
              </div>
              <div className="majlis-thermo-track mt-2">
                <div className="majlis-thermo-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gta-textSecondary mt-1">{pct.toFixed(2)}% toward goal</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
