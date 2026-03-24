"use client";

import { useEffect, useState } from "react";
import { formatDateInToronto } from "@/lib/datetime";
import { getNormalizedCheckpointCategories, type ReligiousCheckpoint } from "@/lib/my-religious-knowledge";
import Image from "next/image";

type RequestStatus = "not_started" | "ready_for_test" | "passed" | "failed";

const CATEGORY_META = [
  { key: "quran", label: "Quran", icon: "📖" },
  { key: "prayers", label: "Prayers", icon: "🤲" },
  { key: "hadith", label: "Hadith", icon: "🕊️" },
  { key: "religiousKnowledge", label: "Religious Knowledge", icon: "🧠" },
] as const;

export function ReligiousCheckpointContent({ checkpoint }: { checkpoint: ReligiousCheckpoint }) {
  const [status, setStatus] = useState<RequestStatus>("not_started");
  const [requestedAt, setRequestedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundationsPdfUrl, setFoundationsPdfUrl] = useState<string | null>(null);

  const normalized = getNormalizedCheckpointCategories(checkpoint);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/religious-knowledge/requests");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load section status");
        const row = (data as Array<{ section_id: string; status: RequestStatus; requested_at?: string | null }>).find(
          (item) => item.section_id === checkpoint.id
        );
        setStatus(row?.status ?? "not_started");
        setRequestedAt(row?.requested_at ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load status");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [checkpoint.id]);

  useEffect(() => {
    if (checkpoint.id !== "cp-1") return;
    async function loadFoundationsPdf() {
      try {
        const res = await fetch("/api/religious-knowledge/foundations-pdf");
        const data = await res.json();
        if (res.ok) setFoundationsPdfUrl(data.file_url ?? null);
      } catch {
        // keep page usable without blocking
      }
    }
    loadFoundationsPdf();
  }, [checkpoint.id]);

  async function handleReadyForTest() {
    setSubmitLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/religious-knowledge/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: checkpoint.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit request");
      setStatus("ready_for_test");
      setRequestedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <section className="rk-detail-shell mt-5">
      {checkpoint.id === "cp-1" ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gta-text">FOUNDATIONS</h2>
          <p className="text-gta-textSecondary">
            Study this file carefully and practice all sections before requesting your test.
          </p>
          {foundationsPdfUrl ? (
            <div className="rounded-gta border border-gta-border overflow-hidden bg-white dark:bg-slate-900">
              <iframe
                src={foundationsPdfUrl}
                title="Foundations PDF"
                className="w-full h-[70vh]"
              />
            </div>
          ) : (
            <p className="text-gta-textSecondary text-sm">
              Foundations PDF has not been uploaded yet. Please ask Regional Nazim Atfal to upload the file.
            </p>
          )}

          <div className="mt-5 rk-action-strip">
            {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
            {(status === "not_started" || status === "failed") && (
              <button
                type="button"
                onClick={handleReadyForTest}
                disabled={submitLoading}
                className="btn-kid-primary px-5 py-2.5 text-sm rounded-gta"
              >
                {submitLoading ? "Sending request..." : "I AM READY TO BE TESTED"}
              </button>
            )}
            <p className="text-sm text-gta-textSecondary mt-2">
              You can be tested on anything from this file.
            </p>
            {status === "ready_for_test" && (
              <p className="text-sm text-gta-textSecondary font-medium">
                Great job. Your request is pending and Nazim Atfal can now test this full section.
              </p>
            )}
            {status === "passed" && (
              <p className="text-sm text-gta-primary font-semibold">
                Awesome. You passed this section and the next checkpoint is now unlocked.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gta-text">
            Section {checkpoint.order}: {checkpoint.title}
          </h2>
          <p className="text-gta-textSecondary mt-1">{checkpoint.description}</p>
        </div>
        <div className="rk-status-bubble">
          <p className="text-xs uppercase tracking-wide text-gta-textSecondary font-semibold">Current Status</p>
          {loading ? (
            <p className="font-semibold text-gta-text">Loading...</p>
          ) : (
            <p className="font-semibold text-gta-text">
              {status === "passed" && "Passed"}
              {status === "ready_for_test" && "Ready for test"}
              {status === "failed" && "Failed - Request again"}
              {status === "not_started" && "Not started"}
            </p>
          )}
          {requestedAt && <p className="text-xs text-gta-textSecondary mt-1">Requested: {formatDateInToronto(requestedAt)}</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 mt-4">
        <div className="rk-cloud rk-cloud-english">
          <h3 className="font-bold text-gta-text mb-2">Learning Goals</h3>
          <ul className="rk-list">
            {checkpoint.learningGoals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>
        <div className="rk-cloud rk-cloud-quiz">
          <h3 className="font-bold text-gta-text mb-2">Skills You Build</h3>
          <ul className="rk-list">
            {checkpoint.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      </div>

      {checkpoint.memorizationBlocks && checkpoint.memorizationBlocks.length > 0 && (
        <div className="rk-cloud rk-cloud-arabic mt-4">
          <h3 className="font-bold text-gta-text mb-2">Foundations Memorization</h3>
          <div className="space-y-3">
            {checkpoint.memorizationBlocks.map((block) => (
              <div key={block.title} className="rk-memorize-strip">
                <p className="font-semibold text-gta-text">{block.title}</p>
                {block.imagePath && (
                  <Image
                    src={block.imagePath}
                    alt={block.title}
                    width={720}
                    height={420}
                    className="mt-2 max-h-52 w-auto rounded-gta-sm border border-gta-border"
                  />
                )}
                {block.arabicText && <p className="text-gta-text mt-1" dir="rtl">{block.arabicText}</p>}
                {block.transliteration && <p className="text-sm text-gta-textSecondary mt-1">{block.transliteration}</p>}
                {block.translation && <p className="text-sm text-gta-textSecondary mt-1">{block.translation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid lg:grid-cols-2 gap-3">
        {CATEGORY_META.map((category) => {
          const block = normalized[category.key];
          return (
            <div key={category.key} className="rk-curriculum-card">
              <h3 className="rk-curriculum-title">
                <span aria-hidden>{category.icon}</span> {category.label}
              </h3>
              {!!block.lessons.length && (
                <div className="rk-curriculum-group">
                  <p className="rk-curriculum-label">Lessons</p>
                  <ul className="rk-list">{block.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul>
                </div>
              )}
              {!!block.tasks.length && (
                <div className="rk-curriculum-group">
                  <p className="rk-curriculum-label">Tasks</p>
                  <ul className="rk-list">{block.tasks.map((task) => <li key={task}>{task}</li>)}</ul>
                </div>
              )}
              {!!block.memorize.length && (
                <div className="rk-memorize-strip">
                  <p className="rk-curriculum-label">Memorize</p>
                  <ul className="rk-list">{block.memorize.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}
              {!!checkpoint.memorizationBlocks?.filter((entry) => entry.section === category.key).length && (
                <div className="mt-3 space-y-2">
                  {checkpoint.memorizationBlocks
                    ?.filter((entry) => entry.section === category.key)
                    .map((entry) => (
                      <div key={`${category.key}-${entry.title}`} className="rk-memorize-strip">
                        <p className="font-semibold text-gta-text">{entry.title}</p>
                        {entry.imagePath && (
                          <Image
                            src={entry.imagePath}
                            alt={entry.title}
                            width={720}
                            height={420}
                            className="mt-2 max-h-56 w-auto rounded-gta-sm border border-gta-border"
                          />
                        )}
                        {entry.arabicText && <p className="text-gta-text mt-1" dir="rtl">{entry.arabicText}</p>}
                        {entry.transliteration && <p className="text-sm text-gta-textSecondary mt-1">{entry.transliteration}</p>}
                        {entry.translation && <p className="text-sm text-gta-textSecondary mt-1">{entry.translation}</p>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rk-action-strip">
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
        {(status === "not_started" || status === "failed") && (
          <button
            type="button"
            onClick={handleReadyForTest}
            disabled={submitLoading}
            className="btn-kid-primary px-5 py-2.5 text-sm rounded-gta"
          >
            {submitLoading ? "Sending request..." : "Ready to be tested"}
          </button>
        )}
        {status === "ready_for_test" && (
          <p className="text-sm text-gta-textSecondary font-medium">
            Great job. Your request is pending and Nazim Atfal can now test this full section.
          </p>
        )}
        {status === "passed" && (
          <p className="text-sm text-gta-primary font-semibold">
            Awesome. You passed this section and the next checkpoint is now unlocked.
          </p>
        )}
      </div>
        </>
      )}
    </section>
  );
}
