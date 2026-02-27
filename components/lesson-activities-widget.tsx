import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function LessonActivitiesWidget() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") return <p className="text-gray-500">No lessons.</p>;
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, type")
    .order("created_at", { ascending: false })
    .limit(5);
  if (!activities?.length) return <p className="text-gray-500">No lesson activities yet.</p>;
  return (
    <ul className="space-y-2">
      {activities.map((a) => (
        <li key={a.id}>
          <Link href={`/lessons/${a.id}`} className="font-medium text-green-600 hover:underline">
            {a.title}
          </Link>
          <span className="ml-2 text-xs text-gray-500">{a.type}</span>
        </li>
      ))}
    </ul>
  );
}
