import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export default async function LetterToHuzoorSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  const canView = role === "local_nazim" || role === "regional_nazim" || role === "admin";
  if (!canView) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gta-text tracking-tight">Letter to Huzoor</h1>
        <p className="text-gta-textSecondary">You do not have permission to view submitted letters.</p>
        <Link href="/activities" className="link-kid mt-3 inline-block">
          Back to Activities
        </Link>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();

  // Limit for UI performance (one per month per tifl).
  let submissionsQuery = supabase
    .from("activity_letter_huzoor_submissions")
    .select("id, submission_month, user_id, letter_payload")
    .order("submission_month", { ascending: false })
    .limit(50);

  if (role === "local_nazim") {
    const majlisId = session.user.majlisId;
    const { data: tiflUsers } = await supabase
      .from("users")
      .select("id")
      .eq("majlis_id", majlisId)
      .eq("role", "tifl");

    const userIds = (tiflUsers ?? []).map((u) => u.id);
    if (!userIds.length) {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gta-text tracking-tight">Submitted Letters</h1>
          <p className="text-gta-textSecondary">No submissions found for your Majlis.</p>
        </div>
      );
    }

    submissionsQuery = submissionsQuery.in("user_id", userIds);
  }

  const { data: submissions } = await submissionsQuery;
  const submissionRows = submissions ?? [];

  const userIds = Array.from(new Set(submissionRows.map((s) => s.user_id)));
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, name, majlis_id").in("id", userIds)
    : { data: [] as Array<{ id: string; name: string | null; majlis_id: string | null }> };

  const nameByUserId = new Map((users ?? []).map((u) => [u.id, u.name ?? ""]));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gta-text tracking-tight">Submitted Letters</h1>
          <p className="text-gta-textSecondary mt-1">Regional Nazim can download a filled letter as PDF.</p>
        </div>
        <Link href="/activities" className="link-kid text-sm whitespace-nowrap">
          Back to Activities
        </Link>
      </div>

      {submissionRows.length === 0 ? (
        <div className="card-kid p-5">
          <p className="text-gta-textSecondary">No letter submissions yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submissionRows.map((s) => {
            const name = nameByUserId.get(s.user_id) || "Tifl";
            return (
              <Link
                key={s.id}
                href={`/activities/letter-to-huzoor/submissions/${s.id}`}
                className="card-kid p-4 transition-all hover:shadow-gta-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gta-text truncate">{name}</p>
                    <p className="text-sm text-gta-textSecondary mt-1">Month: {s.submission_month}</p>
                  </div>
                  <span className="text-sm text-gta-primary font-semibold whitespace-nowrap">Open</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

