import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { EditLessonForm } from "./edit-lesson-form";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim") redirect("/lessons");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: activity, error } = await supabase.from("lesson_activities").select("*").eq("id", id).single();
  if (error || !activity) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/lessons/${id}`} className="text-green-600 hover:underline mb-4 inline-block">Back to lesson</Link>
      <h1 className="text-2xl font-bold mb-6">Edit lesson activity</h1>
      <EditLessonForm activity={activity} />
    </div>
  );
}
