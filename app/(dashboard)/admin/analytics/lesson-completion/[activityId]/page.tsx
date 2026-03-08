import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonCompletionDetailClient } from "./lesson-completion-detail-client";

export default async function LessonCompletionDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    redirect("/dashboard");

  const { activityId } = await params;

  return <LessonCompletionDetailClient activityId={activityId} />;
}
