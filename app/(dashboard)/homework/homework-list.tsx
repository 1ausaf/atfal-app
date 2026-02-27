"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HomeworkItem {
  id: string;
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
}

export function HomeworkList({ initialHomework, role, userId }: HomeworkListProps) {
  const [homework, setHomework] = useState(initialHomework);

  if (!homework.length) return <p className="text-gray-500">No homework.</p>;

  return (
    <ul className="space-y-4">
      {homework.map((h) => (
        <li key={h.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/homework/${h.id}`} className="font-semibold text-lg hover:underline">
                {h.title}
              </Link>
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
            {(role === "local_nazim" || role === "regional_nazim") && (
              <Link href={`/homework/${h.id}/submissions`} className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
                View submissions
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
