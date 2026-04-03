import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CrosswordGame } from "@/components/crossword/crossword-game";

export default async function CrosswordPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Daily crossword</h1>
      <CrosswordGame />
    </div>
  );
}
