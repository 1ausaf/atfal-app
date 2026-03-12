import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";

const BLOCK_LABELS: Record<string, string> = {
  wake_up: "Wake up",
  fajr: "Fajr prayer",
  school: "School",
  homework: "Homework",
  quran_reading: "Qur'an reading",
  sports: "Sports",
  family_time: "Family time",
  masjid: "Masjid",
  free_time: "Free time",
  sleep: "Sleep",
};

async function getTodaySchedule(userId: string) {
  const supabase = createSupabaseServerClient();
  const today = getTodayToronto();
  const dayOfWeek = new Date(today + "T12:00:00").getDay();
  const { data } = await supabase
    .from("schedule_blocks")
    .select("id, block_type, label, start_time")
    .eq("user_id", userId)
    .eq("day_of_week", dayOfWeek)
    .order("start_time", { nullsFirst: false });
  return (data ?? []).map((b) => ({
    ...b,
    label: b.label || BLOCK_LABELS[b.block_type] || b.block_type,
  }));
}

export async function MyLifeTodayWidgetWithUserId({ userId }: { userId: string }) {
  const blocks = await getTodaySchedule(userId);
  if (blocks.length === 0) {
    return (
      <section className="card-kid p-4 min-h-0 flex flex-col">
        <h2 className="font-bold text-base mb-2 text-gta-text dark:text-slate-100">Today from My Life</h2>
        <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
          Add your schedule in <Link href="/my-life/schedule" className="link-kid">My Life</Link> to see today&apos;s plan and reminders here.
        </p>
      </section>
    );
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = blocks.filter((b) => {
    if (!b.start_time) return true;
    const [h, m] = b.start_time.split(":").map(Number);
    const blockMinutes = h * 60 + (m ?? 0);
    return blockMinutes >= currentMinutes;
  });
  const nextBlock = upcoming[0];
  const fajrBlock = blocks.find((b) => b.block_type === "fajr");

  return (
    <section className="card-kid p-4 min-h-0 flex flex-col border-l-4 border-l-gta-primary dark:border-l-emerald-500">
      <h2 className="font-bold text-base mb-2 text-gta-text dark:text-slate-100">Today from My Life</h2>
      <ul className="text-sm text-gta-text dark:text-slate-200 space-y-1 mb-2">
        {blocks.slice(0, 4).map((b) => (
          <li key={b.id}>
            {b.start_time ? `${b.start_time} – ` : ""}{b.label}
          </li>
        ))}
        {blocks.length > 4 && (
          <li className="text-gta-textSecondary dark:text-slate-400">+{blocks.length - 4} more</li>
        )}
      </ul>
      {nextBlock && (
        <p className="text-sm text-gta-primary dark:text-emerald-400 font-medium">
          Next: {nextBlock.label}
          {nextBlock.start_time ? ` at ${nextBlock.start_time}` : ""}
        </p>
      )}
      {fajrBlock && (
        <p className="text-xs text-gta-textSecondary dark:text-slate-400 mt-1">
          Don&apos;t forget Fajr prayer {fajrBlock.start_time ? `at ${fajrBlock.start_time}` : "today"}.
        </p>
      )}
      <Link href="/my-life" className="link-kid text-sm mt-1 inline-block">
        Open My Life →
      </Link>
    </section>
  );
}
