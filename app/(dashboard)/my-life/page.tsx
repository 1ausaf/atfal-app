import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { MyLifeDashboard } from "@/components/my-life/my-life-dashboard";
import { MyLifeOnboarding } from "@/components/my-life/my-life-onboarding";

export default async function MyLifePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: settings } = await supabase
    .from("my_life_settings")
    .select("onboarding_completed_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const showOnboarding = !settings?.onboarding_completed_at;

  if (showOnboarding) {
    return <MyLifeOnboarding userId={session.user.id} />;
  }

  return <MyLifeDashboard />;
}
