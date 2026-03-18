import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

type IjtimaDocKey = "sagheer-g1" | "sagheer-g2" | "kabeer";

const DOC_BY_AGE_GROUP: Record<string, { key: IjtimaDocKey; title: string; subtitle: string }> = {
  "7-9": {
    key: "sagheer-g1",
    title: "Mayar-e-Sagheer (Group 1)",
    subtitle: "Ijtima syllabus PDF",
  },
  "10-11": {
    key: "sagheer-g2",
    title: "Mayar-e-Sagheer (Group 2)",
    subtitle: "Ijtima syllabus PDF",
  },
  "12-14": {
    key: "kabeer",
    title: "Mayar-e-Kabeer",
    subtitle: "Ijtima syllabus PDF",
  },
};

export default async function IjtimaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role !== "tifl") {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gta-text tracking-tight">IJTIMA</h1>
        <p className="text-gta-textSecondary">This section is only available for Tifl accounts.</p>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("age_group")
    .eq("id", session.user.id)
    .single();

  const ageGroup = user?.age_group ?? null;
  const doc = ageGroup ? DOC_BY_AGE_GROUP[ageGroup] : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gta-text tracking-tight">IJTIMA</h1>
          <p className="text-gta-textSecondary mt-1">Your syllabus PDF is shown based on your age group.</p>
        </div>
        <Link href="/activities" className="link-kid text-sm whitespace-nowrap">
          Back to Activities
        </Link>
      </div>

      {!doc ? (
        <div className="card-kid p-5">
          <h2 className="font-bold text-lg text-gta-text">No PDF available</h2>
          <p className="text-gta-textSecondary mt-1">
            Please complete your profile so your age group is set.
          </p>
          <Link href="/profile" className="link-kid mt-3 inline-block">
            Go to Profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/activities/ijtima/${doc.key}`}
            className="card-kid p-6 transition-all hover:shadow-gta-hover ring-1 ring-amber-400/15 hover:ring-amber-400/30"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl p-2 bg-amber-500/10 ring-1 ring-amber-400/20">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-lg text-gta-text">{doc.title}</h2>
                <p className="text-sm text-gta-textSecondary mt-1">{doc.subtitle}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-gta-surfaceSecondary px-3 py-1 text-sm font-semibold text-gta-text">
                    Open PDF
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

