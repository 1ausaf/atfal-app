import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { CreateEventForm } from "../create-event-form";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim") redirect("/events");
  const supabase = createSupabaseServerClient();
  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");
  let majlisName: string | null = null;
  if (session.user.role === "local_nazim" && session.user.majlisId) {
    const m = (majlisList ?? []).find((x) => x.id === session.user.majlisId);
    majlisName = m?.name ?? null;
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/events" className="text-green-600 hover:underline mb-4 inline-block">Back to events</Link>
      <h1 className="text-2xl font-bold mb-6">Create event</h1>
      <CreateEventForm majlisList={majlisList ?? []} role={session.user.role} defaultMajlisId={session.user.majlisId} majlisName={majlisName} />
    </div>
  );
}
