import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { EditHomeworkForm } from "./edit-homework-form";

export default async function EditHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim")
    redirect("/homework");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: homework, error } = await supabase.from("homework").select("*").eq("id", id).single();
  if (error || !homework) notFound();
  if (session.user.role === "local_nazim" && homework.majlis_id !== session.user.majlisId)
    notFound();
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const isRegional = session.user.role === "regional_nazim";

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/homework/${id}`} className="text-green-600 hover:underline mb-4 inline-block">Back to homework</Link>
      <h1 className="text-2xl font-bold mb-6">Edit homework</h1>
      <EditHomeworkForm
        homework={homework}
        majlisList={majlis ?? []}
        isRegional={isRegional}
        defaultMajlisId={session.user.majlisId}
      />
    </div>
  );
}
