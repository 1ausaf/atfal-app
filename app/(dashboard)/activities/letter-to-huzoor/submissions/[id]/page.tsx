import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { LetterToHuzoorPrintView } from "../../letter-to-huzoor-print-view";
import type { LetterValues } from "../../letter-template";

export default async function LetterToHuzoorSubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  const canView = role === "local_nazim" || role === "regional_nazim" || role === "admin";
  if (!canView) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gta-text tracking-tight">Letter to Huzoor</h1>
        <p className="text-gta-textSecondary">You do not have permission to view this page.</p>
        <Link href="/activities" className="link-kid mt-3 inline-block">
          Back to Activities
        </Link>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: submission } = await supabase
    .from("activity_letter_huzoor_submissions")
    .select("id, submission_month, user_id, letter_payload")
    .eq("id", params.id)
    .single();

  if (!submission) {
    redirect("/activities/letter-to-huzoor/submissions");
  }

  const { data: tiflUser } = await supabase
    .from("users")
    .select("id, name, majlis_id, role")
    .eq("id", submission.user_id)
    .single();

  const userMajlisId = tiflUser?.majlis_id ?? null;

  if (role === "local_nazim" && session.user.majlisId && userMajlisId !== session.user.majlisId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gta-text tracking-tight">Letter to Huzoor</h1>
        <p className="text-gta-textSecondary">You can only download letters submitted within your Majlis.</p>
        <Link href="/activities/letter-to-huzoor/submissions" className="link-kid mt-3 inline-block">
          Back
        </Link>
      </div>
    );
  }

  const lp = (submission.letter_payload ?? {}) as Partial<LetterValues>;
  const values: LetterValues = {
    myName: typeof lp.myName === "string" ? lp.myName : "",
    fatherName: typeof lp.fatherName === "string" ? lp.fatherName : "",
    age: typeof lp.age === "string" ? lp.age : "",
    grade: typeof lp.grade === "string" ? lp.grade : "",
    letterBody: typeof lp.letterBody === "string" ? lp.letterBody : "",
    signatureName: typeof lp.signatureName === "string" ? lp.signatureName : "",
    address: typeof lp.address === "string" ? lp.address : "",
  };

  const tiflName = tiflUser?.name ?? "Tifl";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gta-text tracking-tight">Letter to Huzoor</h1>
          <p className="text-gta-textSecondary mt-1">
            Submitted by {tiflName} for month {submission.submission_month}
          </p>
        </div>
        <Link href="/activities/letter-to-huzoor/submissions" className="link-kid text-sm whitespace-nowrap">
          Back to list
        </Link>
      </div>

      <LetterToHuzoorPrintView values={values} submissionMonth={submission.submission_month} />
    </div>
  );
}

