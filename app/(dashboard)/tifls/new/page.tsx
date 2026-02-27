import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { CreateUserForm } from "./create-user-form";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim") redirect("/tifls");
  const supabase = createSupabaseServerClient();
  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/tifls" className="text-green-600 hover:underline mb-4 inline-block">Back to Tifls</Link>
      <h1 className="text-2xl font-bold mb-6">Create user</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-4">Create a Tifl (youth) or Local Nazim account. Give the member code and password to the user.</p>
      <CreateUserForm majlisList={majlisList ?? []} />
    </div>
  );
}
