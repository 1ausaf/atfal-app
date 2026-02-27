import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { ProfileForm } from "@/components/profile-form";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, age, age_group, majlis_id, date_of_birth")
    .eq("id", session.user.id)
    .single();

  if (!user) redirect("/dashboard");

  let salatSuperstar = false;
  const { data: u, error: _e } = await supabase.from("users").select("salat_superstar").eq("id", session.user.id).single();
  if (!_e && u && (u as { salat_superstar?: boolean }).salat_superstar === true) salatSuperstar = true;

  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");

  return (
    <div className="max-w-md mx-auto p-4">
      <Link href="/dashboard" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-200">Profile</h1>
      {salatSuperstar && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <span className="text-amber-600 dark:text-amber-400 text-xl" aria-hidden>★</span>
          <span className="font-medium text-amber-800 dark:text-amber-200">Salat Superstar</span>
        </div>
      )}
      <ProfileForm
        user={{
          name: user.name ?? "",
          date_of_birth: user.date_of_birth ?? "",
          majlis_id: user.majlis_id ?? "",
          age: user.age,
          age_group: user.age_group,
        }}
        majlisList={majlisList ?? []}
      />
    </div>
  );
}
