"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDateTimeInToronto } from "@/lib/datetime";
import { HomeworkItemActions } from "./homework-item-actions";

interface HomeworkItem {
  id: string;
  majlis_id?: string | null;
  title: string;
  description: string | null;
  due_by: string;
  links: string[];
  release_at?: string | null;
  lesson_activity_id?: string | null;
  created_at: string;
}

interface PastHomeworkItem {
  id: string;
  title: string;
  due_by: string;
  links: string[];
  submitted_at: string | null;
  points_awarded: number | null;
}

interface HomeworkListProps {
  initialHomework: HomeworkItem[];
  role: string;
  userId: string;
  userMajlisId: string | null;
  majlisList: { id: string; name: string }[];
  lessonList?: { id: string; title: string }[];
  pastAssignments?: PastHomeworkItem[];
}

const FILTER_ALL = "all";
const FILTER_REGIONAL = "regional";

export function HomeworkList({
  initialHomework,
  role,
  userId,
  userMajlisId,
  majlisList,
  lessonList = [],
  pastAssignments = [],
}: HomeworkListProps) {
  const [homework, setHomework] = useState(initialHomework);
  const [majlisFilter, setMajlisFilter] = useState<string>(FILTER_ALL);
  const majlisMap = useMemo(() => new Map(majlisList.map((m) => [m.id, m.name])), [majlisList]);
  const lessonMap = useMemo(() => new Map(lessonList.map((l) => [l.id, l.title])), [lessonList]);

  const filteredHomework =
    (role === "regional_nazim" || role === "admin")
      ? homework.filter((h) => {
          if (majlisFilter === FILTER_ALL) return true;
          if (majlisFilter === FILTER_REGIONAL) return h.majlis_id == null;
          return h.majlis_id === majlisFilter;
        })
      : homework;

  if (role !== "tifl" && !homework.length) return <p className="text-gta-textSecondary">No homework.</p>;

  const hasPast = pastAssignments.length > 0;

  return (
    <>
      {role === "tifl" && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gta-text tracking-tight mb-3">Past Homework Assignments</h2>
          {!hasPast ? (
            <p className="text-gta-textSecondary">No past approved homework yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pastAssignments.map((p) => {
                const pointsValue = p.points_awarded ?? 0;
                const points =
                  pointsValue > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {pointsValue} pts
                    </span>
                  ) : (
                    <span className="text-gta-textSecondary text-sm">
                      {pointsValue} pts
                    </span>
                  );

                return (
                  <li key={p.id} className="card-kid p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/homework/${p.id}`} className="font-semibold text-lg text-gta-text hover:underline">
                          {p.title}
                        </Link>
                      </div>
                      <p className="text-sm text-gta-textSecondary mt-1">Due: {formatDateTimeInToronto(p.due_by)}</p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-sm text-gta-textSecondary dark:text-slate-400 font-medium">Awarded:</span>{" "}
                      {points}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {(role === "regional_nazim" || role === "admin") && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="majlis-filter" className="text-sm font-semibold text-gta-text">
            Filter by Majlis:
          </label>
          <select
            id="majlis-filter"
            value={majlisFilter}
            onChange={(e) => setMajlisFilter(e.target.value)}
            className="rounded-lg border border-gta-border bg-gta-surface px-3 py-1.5 text-sm text-gta-text focus:ring-2 focus:ring-gta-primary/30 focus:outline-none"
          >
            <option value={FILTER_ALL}>All</option>
            <option value={FILTER_REGIONAL}>Regional only</option>
            {majlisList.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}
      <ul className="flex flex-col gap-3">
      {filteredHomework.map((h) => {
        const canEdit =
          (role === "regional_nazim" || role === "admin") || (role === "local_nazim" && userMajlisId != null && h.majlis_id === userMajlisId);
        const tagLabel = h.majlis_id ? majlisMap.get(h.majlis_id) ?? h.majlis_id : "Regional";
        return (
          <li key={h.id} className="content-module-item">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/homework/${h.id}`} className="font-semibold text-lg text-gta-text hover:underline">
                    {h.title}
                  </Link>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gta-secondary text-white shrink-0">
                    {tagLabel}
                  </span>
                  {(role === "local_nazim" || role === "regional_nazim" || role === "admin") && h.release_at != null && new Date(h.release_at) > new Date() && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gta-surfaceSecondary text-gta-text shrink-0">
                      Releases at {formatDateTimeInToronto(h.release_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gta-textSecondary mt-1">Due: {formatDateTimeInToronto(h.due_by)}</p>
                {h.lesson_activity_id && lessonMap.get(h.lesson_activity_id) && (
                  <p className="text-xs text-gta-textSecondary mt-0.5">
                    Lesson: <Link href={`/lessons/${h.lesson_activity_id}`} className="link-kid">{lessonMap.get(h.lesson_activity_id)}</Link>
                  </p>
                )}
                {h.description && <p className="mt-2 text-gta-textSecondary">{h.description}</p>}
                {h.links?.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {h.links.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="link-kid text-sm">
                          Link {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <HomeworkItemActions homeworkId={h.id} canEdit={canEdit} />
                {!canEdit && (role === "local_nazim" || (role === "regional_nazim" || role === "admin")) && (
                  <Link href={`/homework/${h.id}/submissions`} className="link-kid text-sm">
                    View submissions
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
    {(role === "regional_nazim" || role === "admin") && filteredHomework.length === 0 && homework.length > 0 && (
      <p className="text-gta-textSecondary">No homework match the selected filter.</p>
    )}
    </>
  );
}
