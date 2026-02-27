import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { CreateHomeworkForm } from "./create-homework-form";

export default async function NewHomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim") redirect("/homework");
  const supabase = createSupabaseServerClient();
  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");
  const defaultMajlisId = session.user.role === "local_nazim" ? session.user.majlisId : null;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/homework" className="text-green-600 hover:underline mb-4 inline-block">Back to homework</Link>
      <h1 className="text-2xl font-bold mb-6">Create homework</h1>
      <CreateHomeworkForm majlisList={majlisList ?? []} defaultMajlisId={defaultMajlisId} isRegional={session.user.role === "regional_nazim"} />
    </div>
  );
}
