import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateInToronto } from "@/lib/datetime";

export async function HomeworkDueWidget() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl" || !session.user.majlisId)
    return <p className="text-gray-500">No homework.</p>;
  const supabase = createSupabaseServerClient();
  const { data: list } = await supabase
    .from("homework")
    .select("id, title, due_by")
    .eq("majlis_id", session.user.majlisId)
    .gte("due_by", new Date().toISOString())
    .order("due_by", { ascending: true })
    .limit(5);
  if (!list?.length) return <p className="text-slate-500 dark:text-slate-400">No homework due.</p>;
  return (
    <ul className="space-y-2">
      {list.map((h) => (
        <li key={h.id} className="flex justify-between items-center p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/80 dark:border-emerald-800/30">
          <span className="font-medium text-slate-800 dark:text-white">{h.title}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{formatDateInToronto(h.due_by)}</span>
        </li>
      ))}
    </ul>
  );
}
