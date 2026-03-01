import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ReadSubsectionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Read</h1>
      <p className="text-slate-600 dark:text-slate-400">More reading content coming soon.</p>
    </div>
  );
}
