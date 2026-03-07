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
    .select("id, status, requested_at, passed_arabic, passed_translation")
    .eq("user_id", session.user.id)
    .eq("category_id", id);
  const progress = progressRows?.[0] ?? null;
  const status = progress?.status ?? "not_started";
  const passedArabic = progress?.passed_arabic === true;
  const passedTranslation = progress?.passed_translation === true;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link
        href="/learn/salat"
        className="link-kid text-sm font-semibold hover:underline mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <span aria-hidden>←</span> Back to Salat Course
      </Link>
      <h1 className="text-2xl font-bold mb-1 text-gta-text">{category.title}</h1>
      {category.title_ar && (
        <p className="text-lg text-gta-textSecondary mb-4" dir="rtl" style={{ fontFamily: "var(--font-arabic), 'Amiri', serif" }}>
          {category.title_ar}
        </p>
      )}
      <div className="card-kid p-6 mb-6">
        {Array.isArray(category.subsections) && category.subsections.length > 0 ? (
          <>
            {category.content_en && (
              <p className="text-gta-textSecondary mb-6">{category.content_en}</p>
            )}
            <div className="space-y-6">
              {(category.subsections as Array<{ title?: string; title_ar?: string; content_ar?: string; content_en?: string }>).map((sub, i) => (
                <div key={i} className="rounded-gta-sm border border-gta-border p-4 bg-gta-surfaceSecondary">
                  <h2 className="text-lg font-bold text-gta-text mb-1">{sub.title}</h2>
                  {sub.title_ar && (
                    <p className="text-gta-textSecondary mb-2" dir="rtl" style={{ fontFamily: "var(--font-arabic), 'Amiri', serif" }}>
                      {sub.title_ar}
                    </p>
                  )}
                  {sub.content_ar && (
                    <div
                      className="text-xl leading-loose text-gta-text mb-3 p-3 rounded-gta-sm bg-gta-surface"
                      dir="rtl"
                      style={{ fontFamily: "var(--font-arabic), 'Amiri', 'Noto Naskh Arabic', serif" }}
                    >
                      {sub.content_ar}
                    </div>
                  )}
                  {sub.content_en && (
                    <p className="text-sm text-gta-textSecondary">{sub.content_en}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {category.content_ar && (
              <div
                className="text-2xl leading-loose text-gta-text mb-4 p-4 rounded-gta-sm bg-gta-surfaceSecondary"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic), 'Amiri', 'Noto Naskh Arabic', serif" }}
              >
                {category.content_ar}
              </div>
            )}
            {category.content_en && (
              <p className="text-gta-textSecondary">{category.content_en}</p>
            )}
            {!category.content_ar && !category.content_en && (
              <p className="text-gta-textSecondary italic">Content will be added from the Salat Guide.</p>
            )}
          </>
        )}
      </div>
      <SalatCategoryContent
        categoryId={category.id}
        status={status}
        requestedAt={progress?.requested_at ?? null}
        passedArabic={passedArabic}
        passedTranslation={passedTranslation}
      />
    </div>
  );
}
