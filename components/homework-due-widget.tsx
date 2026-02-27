import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

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
  if (!list?.length) return <p className="text-gray-500">No homework due.</p>;
  return (
    <ul className="space-y-2">
      {list.map((h) => (
        <li key={h.id} className="flex justify-between items-center">
          <span className="font-medium">{h.title}</span>
          <span className="text-sm text-gray-500">{new Date(h.due_by).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}
