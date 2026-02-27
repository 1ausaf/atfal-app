import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { CreateLessonForm } from "./create-lesson-form";

export default async function NewLessonPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim") redirect("/lessons");

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/lessons" className="text-green-600 hover:underline mb-4 inline-block">Back to lessons</Link>
      <h1 className="text-2xl font-bold mb-6">Create lesson activity</h1>
      <CreateLessonForm />
    </div>
  );
}
