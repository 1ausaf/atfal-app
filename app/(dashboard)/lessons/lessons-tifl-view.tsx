"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDateInToronto } from "@/lib/datetime";
import { PointsBadge } from "@/components/points-badge";
import { LessonItemActions } from "./lesson-item-actions";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  type: string;
  thumbnail_url?: string | null;
  section_id?: string | null;
  created_at: string;
}

interface Section {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  sort_order?: number | null;
}

interface SubmissionInfo {
  points_awarded: number;
  created_at: string;
}

interface LessonsTiflViewProps {
  activities: Activity[];
  sections: Section[];
  incompleteActivities: Activity[];
  pastActivities: Activity[];
  submissionByActivityId: Record<string, SubmissionInfo>;
  pointsAvailableByActivityId: Record<string, number>;
}

export function LessonsTiflView({
  activities,
  sections,
  incompleteActivities,
  pastActivities,
  submissionByActivityId,
  pointsAvailableByActivityId,
}: LessonsTiflViewProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const sectionStats = useMemo(() => {
    if (!activities?.length || !sections?.length) return [];
    return sections.map((s) => {
      const lessonsInSection = activities.filter((a) => a.section_id === s.id);
      const incompleteInSection = lessonsInSection.filter((a) =>
        incompleteActivities.some((ia) => ia.id === a.id)
      ).length;
      return {
        section: s,
        total: lessonsInSection.length,
        incomplete: incompleteInSection,
      };
    });
  }, [activities, sections, incompleteActivities]);

  const selectedSection =
    selectedSectionId != null ? sections.find((s) => s.id === selectedSectionId) ?? null : null;

  const visibleIncomplete =
    selectedSectionId != null
      ? incompleteActivities.filter((a) => a.section_id === selectedSectionId)
      : incompleteActivities;
  const visiblePast =
    selectedSectionId != null ? pastActivities.filter((a) => a.section_id === selectedSectionId) : pastActivities;

  function LessonList({
    items,
  }: {
    items: Activity[];
  }) {
    if (!items?.length) return null;
    return (
      <ul className="flex flex-col gap-3">
        {items.map((a) => {
          const sub = submissionByActivityId[a.id];
          const pointsAvailable = pointsAvailableByActivityId[a.id] ?? 0;
          return (
            <li key={a.id} className="content-module-item">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 min-w-0 flex-1">
                  {a.thumbnail_url && (
                    <Link href={`/lessons/${a.id}`} className="shrink-0 block">
                      <div className="relative w-20 h-[60px]">
                        <Image
                          src={a.thumbnail_url}
                          alt=""
                          width={80}
                          height={60}
                          className="rounded-lg object-cover w-20 h-[60px]"
                        />
                        {sub && (
                          <>
                            <div className="absolute inset-0 bg-black/50 rounded-lg" />
                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                              ✓
                            </div>
                          </>
                        )}
                      </div>
                    </Link>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/lessons/${a.id}`} className="font-semibold text-lg text-gta-text hover:underline">
                        {a.title}
                      </Link>
                      {pointsAvailable > 0 && !sub && <PointsBadge points={pointsAvailable} />}
                      {sub && pointsAvailable > 0 && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ {sub.points_awarded} / {pointsAvailable} pts
                        </span>
                      )}
                      <span className="text-sm text-gta-textSecondary">{a.type}</span>
                    </div>
                    {a.description && (
                      <p className="mt-2 text-gta-textSecondary line-clamp-2">{a.description}</p>
                    )}
                    {sub && (
                      <p className="mt-1 text-sm text-gta-textSecondary">
                        Submitted {formatDateInToronto(sub.created_at)} ·{" "}
                        <span className="font-semibold text-gta-primary">{sub.points_awarded} pts</span>
                      </p>
                    )}
                  </div>
                </div>
                <LessonItemActions activityId={a.id} canEdit={false} />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (!sections.length) {
    // Fallback: old behavior (no sections defined)
    return (
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gta-text mb-3">Lessons</h2>
        {incompleteActivities.length === 0 && pastActivities.length === 0 ? (
          <p className="text-gta-textSecondary">No lesson activities to complete. Great work!</p>
        ) : (
          <>
            {incompleteActivities.length > 0 && (
              <>
                <h3 className="text-base font-semibold text-gta-text mb-2">To complete</h3>
                <LessonList items={incompleteActivities} />
              </>
            )}
            {pastActivities.length > 0 && (
              <>
                <h3 className="text-base font-semibold text-gta-text mb-2 mt-4">Past lessons</h3>
                <LessonList items={pastActivities} />
              </>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gta-text mb-3">Sections</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sectionStats.map(({ section, total, incomplete }) => {
            const isSelected = selectedSectionId === section.id;
            return (
              <div
                key={section.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSectionId(section.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedSectionId(section.id);
                  }
                }}
                className={`group relative w-full rounded-2xl border bg-gta-surface dark:bg-slate-800 p-4 flex flex-col gap-3 cursor-pointer transition-shadow transition-colors ${
                  isSelected
                    ? "border-gta-primary shadow-md"
                    : "border-gta-border hover:border-gta-primary/60 hover:shadow-md"
                }`}
              >
                <div className="relative w-full h-32 overflow-hidden rounded-xl bg-gta-surfaceSecondary dark:bg-slate-700">
                  {section.thumbnail_url ? (
                    <Image
                      src={section.thumbnail_url}
                      alt={section.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                  {incomplete > 0 && (
                    <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-red-500 text-white text-xs font-bold px-1">
                      {incomplete}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gta-textSecondary dark:text-slate-300">
                  <span className="inline-flex items-center rounded-full bg-gta-surfaceSecondary dark:bg-slate-700 px-2 py-0.5">
                    Lessons
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gta-text dark:text-slate-100 line-clamp-2">
                    {section.title}
                  </p>
                  {section.description && (
                    <p className="mt-1 text-xs text-gta-textSecondary dark:text-slate-400 line-clamp-2">
                      {section.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="font-medium text-gta-text dark:text-slate-100">
                    {total} lesson{total === 1 ? "" : "s"}
                  </span>
                  <span className="text-gta-textSecondary dark:text-slate-400 group-hover:text-gta-primary">
                    View lessons →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div>
            <h2 className="text-lg font-bold text-gta-text">
              {selectedSection ? selectedSection.title : "All lessons"}
            </h2>
            <p className="text-xs text-gta-textSecondary dark:text-slate-400">
              {visibleIncomplete.length} incomplete · {visiblePast.length} completed
            </p>
          </div>
          {selectedSection && (
            <button
              type="button"
              onClick={() => setSelectedSectionId(null)}
              className="text-xs text-gta-primary dark:text-emerald-400 hover:underline"
            >
              Back to sections
            </button>
          )}
        </div>

        {visibleIncomplete.length === 0 && visiblePast.length === 0 ? (
          <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
            No lessons available yet.
          </p>
        ) : (
          <>
            {visibleIncomplete.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gta-text mb-2">To complete</h3>
                <LessonList items={visibleIncomplete} />
              </div>
            )}
            {visiblePast.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gta-text mb-2">Past lessons</h3>
                <LessonList items={visiblePast} />
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

