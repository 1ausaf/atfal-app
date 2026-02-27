"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { HomeworkItemActions } from "./homework-item-actions";

interface HomeworkItem {
  id: string;
  majlis_id?: string | null;
  title: string;
  description: string | null;
  due_by: string;
  links: string[];
  created_at: string;
}

interface HomeworkListProps {
  initialHomework: HomeworkItem[];
  role: string;
  userId: string;
  userMajlisId: string | null;
  majlisList: { id: string; name: string }[];
}

const FILTER_ALL = "all";
const FILTER_REGIONAL = "regional";

export function HomeworkList({ initialHomework, role, userId, userMajlisId, majlisList }: HomeworkListProps) {
  const [homework, setHomework] = useState(initialHomework);
  const [majlisFilter, setMajlisFilter] = useState<string>(FILTER_ALL);
  const majlisMap = useMemo(() => new Map(majlisList.map((m) => [m.id, m.name])), [majlisList]);

  const filteredHomework =
    role === "regional_nazim"
      ? homework.filter((h) => {
          if (majlisFilter === FILTER_ALL) return true;
          if (majlisFilter === FILTER_REGIONAL) return h.majlis_id == null;
          return h.majlis_id === majlisFilter;
        })
      : homework;

  if (!homework.length) return <p className="text-gray-500">No homework.</p>;

  return (
    <>
      {role === "regional_nazim" && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="majlis-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Filter by Majlis:
          </label>
          <select
            id="majlis-filter"
            value={majlisFilter}
            onChange={(e) => setMajlisFilter(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          >
            <option value={FILTER_ALL}>All</option>
            <option value={FILTER_REGIONAL}>Regional only</option>
            {majlisList.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}
      <ul className="space-y-4">
      {filteredHomework.map((h) => {
        const canEdit =
          role === "regional_nazim" || (role === "local_nazim" && userMajlisId != null && h.majlis_id === userMajlisId);
        const tagLabel = h.majlis_id ? majlisMap.get(h.majlis_id) ?? h.majlis_id : "Regional";
        return (
          <li key={h.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/homework/${h.id}`} className="font-semibold text-lg hover:underline">
                    {h.title}
                  </Link>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 shrink-0">
                    {tagLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Due: {new Date(h.due_by).toLocaleString()}</p>
                {h.description && <p className="mt-2 text-slate-600 dark:text-slate-400">{h.description}</p>}
                {h.links?.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {h.links.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline text-sm">
                          Link {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <HomeworkItemActions homeworkId={h.id} canEdit={canEdit} />
                {!canEdit && (role === "local_nazim" || role === "regional_nazim") && (
                  <Link href={`/homework/${h.id}/submissions`} className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
                    View submissions
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
    {role === "regional_nazim" && filteredHomework.length === 0 && homework.length > 0 && (
      <p className="text-slate-500 dark:text-slate-400">No homework match the selected filter.</p>
    )}
    </>
  );
}
