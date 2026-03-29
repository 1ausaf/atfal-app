import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase";
import { TiflsList } from "./tifls-list";

export default async function TiflsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin") redirect("/dashboard");
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("users")
    .select("id, name, age, age_group, majlis_id, date_of_birth, manual_points, created_at, banned_at, banned_reason")
    .eq("role", "tifl")
    .is("deleted_at", null)
    .order("name");
  if (session.user.role === "local_nazim") {
    if (!session.user.majlisId) return <p>No Majlis assigned.</p>;
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data: tifls } = await query;
  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");
  const majlisMap = new Map((majlisList ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gta-text">Tifls</h1>
        {(session.user.role === "regional_nazim" || session.user.role === "admin") && (
          <Link href="/tifls/new" className="px-4 py-2 btn-kid-primary rounded-gta inline-block">
            Create user
          </Link>
        )}
      </div>
      {(session.user.role === "regional_nazim" || session.user.role === "admin") && (
        <p className="text-gta-textSecondary mb-4">Select a Majlis to filter, or leave blank to see all.</p>
      )}
      <TiflsList
        initialTifls={tifls ?? []}
        majlisList={majlisList ?? []}
        isRegional={session.user.role === "regional_nazim" || session.user.role === "admin"}
        majlisMap={majlisMap}
      />
    </div>
  );
}
