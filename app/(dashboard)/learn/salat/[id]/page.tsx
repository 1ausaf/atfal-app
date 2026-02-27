import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { SalatCategoryContent } from "./salat-category-content";

export default async function SalatCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: category, error: catError } = await supabase
    .from("salat_categories")
    .select("*")
    .eq("id", id)
    .single();
  if (catError || !category) notFound();

  const { data: progressRows } = await supabase
    .from("salat_progress")
    .select("id, status, requested_at")
    .eq("user_id", session.user.id)
    .eq("category_id", id);
  const progress = progressRows?.[0] ?? null;
  const status = progress?.status ?? "not_started";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/learn/salat"
        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <span aria-hidden>←</span> Back to Salat Course
      </Link>
      <h1 className="text-2xl font-bold mb-1 text-slate-800 dark:text-slate-200">{category.title}</h1>
      {category.title_ar && (
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-4" dir="rtl" style={{ fontFamily: "var(--font-arabic), 'Amiri', serif" }}>
          {category.title_ar}
        </p>
      )}
      <div className="rounded-xl border border-slate-200 dark:border-emerald-800/50 bg-[var(--salat-card)] dark:bg-[var(--salat-card)] shadow-card p-6 mb-6">
        {Array.isArray(category.subsections) && category.subsections.length > 0 ? (
          <>
            {category.content_en && (
              <p className="text-slate-600 dark:text-slate-400 mb-6">{category.content_en}</p>
            )}
            <div className="space-y-6">
              {(category.subsections as Array<{ title?: string; title_ar?: string; content_ar?: string; content_en?: string }>).map((sub, i) => (
                <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-600 p-4 bg-[#f0fdf6] dark:bg-slate-800/60">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">{sub.title}</h2>
                  {sub.title_ar && (
                    <p className="text-slate-600 dark:text-slate-400 mb-2" dir="rtl" style={{ fontFamily: "var(--font-arabic), 'Amiri', serif" }}>
                      {sub.title_ar}
                    </p>
                  )}
                  {sub.content_ar && (
                    <div
                      className="text-xl leading-loose text-slate-800 dark:text-slate-200 mb-3 p-3 rounded-lg"
                      dir="rtl"
                      style={{ fontFamily: "var(--font-arabic), 'Amiri', 'Noto Naskh Arabic', serif" }}
                    >
                      {sub.content_ar}
                    </div>
                  )}
                  {sub.content_en && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{sub.content_en}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {category.content_ar && (
              <div
                className="text-2xl leading-loose text-slate-800 dark:text-slate-200 mb-4 p-4 rounded-lg bg-[#f0fdf6] dark:bg-slate-800/60"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic), 'Amiri', 'Noto Naskh Arabic', serif" }}
              >
                {category.content_ar}
              </div>
            )}
            {category.content_en && (
              <p className="text-slate-600 dark:text-slate-400">{category.content_en}</p>
            )}
            {!category.content_ar && !category.content_en && (
              <p className="text-slate-500 dark:text-slate-400 italic">Content will be added from the Salat Guide.</p>
            )}
          </>
        )}
      </div>
      <SalatCategoryContent
        categoryId={category.id}
        status={status}
        requestedAt={progress?.requested_at ?? null}
      />
    </div>
  );
}
