import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { HomeworkList } from "./homework-list";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  let query = supabase.from("homework").select("id, majlis_id, title, description, due_by, links, created_at").order("due_by", { ascending: true });
  if (session.user.role === "tifl") {
    if (!session.user.majlisId) return <p>Complete your profile to see homework.</p>;
    query = query.or(`majlis_id.eq.${session.user.majlisId},majlis_id.is.null`);
  } else if (session.user.role === "local_nazim") {
    if (!session.user.majlisId) return <p>No Majlis assigned.</p>;
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data: homeworkList } = await query;
  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");
  const canCreate = session.user.role === "local_nazim" || session.user.role === "regional_nazim";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Homework</h1>
        {canCreate && (
          <Link href="/homework/new" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Create homework
          </Link>
        )}
      </div>
      <HomeworkList initialHomework={homeworkList ?? []} role={session.user.role} userId={session.user.id} userMajlisId={session.user.majlisId ?? null} majlisList={majlisList ?? []} />
    </div>
  );
}
