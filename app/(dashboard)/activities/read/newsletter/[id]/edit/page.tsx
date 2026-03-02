import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { EditNewsletterForm } from "./edit-newsletter-form";

export default async function EditNewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") redirect("/activities/read/newsletter");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity_newsletter")
    .select("id, title, document_url, cover_url, order, created_at")
    .eq("id", id)
    .single();
  if (error || !data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Edit newsletter document</h1>
      <EditNewsletterForm item={data} />
    </div>
  );
}
