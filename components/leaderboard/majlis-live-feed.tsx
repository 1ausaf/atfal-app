type FeedRow = {
  id: string;
  event_type: string;
  raw_points: number;
  normalized_points: number;
  event_at: string;
  users?: { name?: string | null } | null;
  majlis?: { name?: string | null } | null;
};

export function MajlisLiveFeed({ rows }: { rows: FeedRow[] }) {
  return (
    <aside className="card-kid p-4 md:p-5">
      <h3 className="text-lg font-bold text-gta-text">Live Contribution Feed</h3>
      <p className="text-xs text-gta-textSecondary mt-1">Newest contribution events on top</p>
      <ul className="mt-3 space-y-2 max-h-[700px] overflow-auto pr-1">
        {!rows.length ? (
          <li className="text-sm text-gta-textSecondary">No contribution events yet.</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="majlis-feed-item">
              <p className="text-sm font-semibold text-gta-text">
                {row.users?.name ?? "Unknown Tifl"} · {row.majlis?.name ?? "Unknown Majlis"}
              </p>
              <p className="text-xs text-gta-textSecondary">
                {row.event_type} · raw {Number(row.raw_points ?? 0).toFixed(2)} · normalized +{Number(row.normalized_points ?? 0).toFixed(2)}
              </p>
              <p className="text-[11px] text-gta-textSecondary/80">{new Date(row.event_at).toLocaleString()}</p>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
