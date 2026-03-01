import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function LessonActivitiesWidget() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") return <p className="text-gray-500">No lessons.</p>;
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, type, thumbnail_url")
    .order("created_at", { ascending: false });
  const { data: submissions } = await supabase
    .from("lesson_submissions")
    .select("activity_id")
    .eq("user_id", session.user.id);
  const submittedIds = new Set((submissions ?? []).map((s) => s.activity_id));
  const incomplete = (activities ?? []).filter((a) => !submittedIds.has(a.id)).slice(0, 5);
  if (!incomplete.length) return <p className="text-gray-500">No lesson activities to complete.</p>;
  return (
    <ul className="space-y-2">
      {incomplete.map((a) => (
        <li key={a.id} className="flex items-center gap-2">
          {a.thumbnail_url && (
            <Link href={`/lessons/${a.id}`} className="shrink-0">
              <Image src={a.thumbnail_url} alt="" width={40} height={30} className="rounded object-cover w-10 h-[30px]" />
            </Link>
          )}
          <div className="min-w-0">
            <Link href={`/lessons/${a.id}`} className="font-medium text-green-600 hover:underline block truncate">
              {a.title}
            </Link>
            <span className="text-xs text-gray-500">{a.type}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
