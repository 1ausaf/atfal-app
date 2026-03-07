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

  let salatStar = false;
  let salatSuperstar = false;
  const { data: u, error: _e } = await supabase.from("users").select("salat_star, salat_superstar").eq("id", session.user.id).single();
  if (!_e && u) {
    salatStar = (u as { salat_star?: boolean }).salat_star === true;
    salatSuperstar = (u as { salat_superstar?: boolean }).salat_superstar === true;
  }

  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");

  return (
    <div className="max-w-md mx-auto p-4">
      <Link href="/dashboard" className="link-kid text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2 text-gta-text">Profile</h1>
      {salatStar && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-purple-100 border border-purple-300">
          <span className="text-purple-600 text-xl" aria-hidden>★</span>
          <span className="font-semibold text-purple-900">Salat Star</span>
        </div>
      )}
      {salatSuperstar && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-50 border border-red-300">
          <span className="text-red-500 text-xl" aria-hidden>★</span>
          <span className="font-semibold text-red-800">Salat Superstar</span>
        </div>
      )}
      {(salatStar || salatSuperstar) && (
        <p className="text-sm text-gta-textSecondary mb-4">
          You earn +100 bonus points on every homework and lesson you complete.
        </p>
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
        canEditMajlis={session.user.role === "regional_nazim" || session.user.role === "admin"}
      />
    </div>
  );
}
