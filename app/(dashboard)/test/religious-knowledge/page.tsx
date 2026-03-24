import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS } from "@/lib/my-religious-knowledge";
import { ReligiousKnowledgePendingList } from "./religious-knowledge-pending-list";
import { FoundationsPdfUpload } from "./foundations-pdf-upload";

export default async function ReligiousKnowledgeTestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "regional_nazim" && role !== "local_nazim" && role !== "admin") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("religious_knowledge_test_requests")
    .select("id, user_id, section_id, status, requested_at")
    .in("status", ["ready_for_test", "failed"])
    .order("requested_at", { ascending: true });
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-red-600 dark:text-red-400">Failed to load Religious Knowledge test requests.</p>
      </div>
    );
  }

  const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, name, member_code, majlis_id").in("id", userIds)
    : { data: [] };
  const usersMap = new Map((users ?? []).map((u) => [u.id, u]));
  const sectionTitleById = new Map(
    MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS.map((cp) => [cp.id, `${cp.title} (${cp.ageBand})`])
  );

  const filteredRows =
    role === "local_nazim" && session.user.majlisId
      ? (data ?? []).filter((r) => (usersMap.get(r.user_id) as { majlis_id?: string } | undefined)?.majlis_id === session.user.majlisId)
      : (data ?? []);

  const { data: foundationsFile } = await supabase
    .from("religious_knowledge_checkpoint_files")
    .select("file_url")
    .eq("checkpoint_id", "cp-1")
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/test" className="link-kid text-sm inline-flex items-center gap-1 mb-4">
        <span aria-hidden>←</span> Back to TEST
      </Link>
      <h1 className="text-2xl font-bold mb-2 text-gta-text">Religious Knowledge test requests</h1>
      <p className="text-gta-textSecondary mb-6">
        Mark each full section request as pass or fail.
      </p>
      {(role === "regional_nazim" || role === "admin") && (
        <FoundationsPdfUpload initialUrl={foundationsFile?.file_url ?? null} />
      )}
      <ReligiousKnowledgePendingList
        list={filteredRows.map((row) => {
          const u = usersMap.get(row.user_id);
          return {
            id: row.id,
            userName: u?.name ?? "—",
            userMemberCode: (u as { member_code?: string } | undefined)?.member_code ?? "—",
            sectionTitle: sectionTitleById.get(row.section_id) ?? row.section_id,
            requestedAt: row.requested_at ?? "",
            status: row.status as "ready_for_test" | "failed",
          };
        })}
      />
    </div>
  );
}
