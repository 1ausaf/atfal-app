import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { ProfileCompleteForm } from "./profile-complete-form";

export default async function ProfileCompletePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");
  if (session.user.profile_completed) redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: majlis } = await supabase.from("majlis").select("id, name").order("name");

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-200">Complete your profile</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Your age group (Mayar) is determined by your age on October 31, before the new Atfal year.
      </p>
      <ProfileCompleteForm majlisList={majlis ?? []} />
    </div>
  );
}
