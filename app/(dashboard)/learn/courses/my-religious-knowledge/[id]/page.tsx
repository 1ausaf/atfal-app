import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS } from "@/lib/my-religious-knowledge";
import { ReligiousCheckpointContent } from "@/components/learn/religious-checkpoint-content";

export default async function ReligiousCheckpointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  const { id } = await params;
  const checkpoint = MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS.find((cp) => cp.id === id);
  if (!checkpoint) notFound();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Link href="/learn/courses/my-religious-knowledge" className="link-kid text-sm inline-flex items-center gap-1 mb-3">
        <span aria-hidden>←</span> Back to Checkpoints
      </Link>
      <ReligiousCheckpointContent checkpoint={checkpoint} />
    </div>
  );
}
