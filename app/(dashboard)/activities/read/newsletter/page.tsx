import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { NewsletterItemActions } from "./newsletter-item-actions";

export default async function NewsletterPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  const role = session.user.role;
  const userMajlisId = session.user.majlisId ?? null;
  let query = supabase
    .from("activity_newsletter")
    .select("id, title, document_url, cover_url, order, created_at, majlis_id")
    .order("order", { ascending: true })
    .order("created_at", { ascending: false });
  if (role === "tifl") {
    if (userMajlisId) query = query.or(`majlis_id.eq.${userMajlisId},majlis_id.is.null`);
    else query = query.is("majlis_id", null);
  } else if (role === "local_nazim") {
    if (userMajlisId) query = query.or(`majlis_id.eq.${userMajlisId},majlis_id.is.null`);
    else query = query.is("majlis_id", null);
  }
  const { data: items } = await query;
  const list = items ?? [];
  const canAdd = role === "regional_nazim" || role === "local_nazim";
  const canEditAny = role === "regional_nazim";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Newsletter</h1>
        {canAdd && (
          <Link
            href="/activities/read/newsletter/new"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add document
          </Link>
        )}
      </div>
      {!list.length ? (
        <p className="text-slate-500 dark:text-slate-400">No newsletter documents yet.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((item) => (
            <NewsletterItemActions key={item.id} item={item} canEdit={canEditAny} />
          ))}
        </div>
      )}
    </div>
  );
}
