import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { EditEventForm } from "./edit-event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim")
    redirect("/events");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  let query = supabase.from("events").select("*").eq("id", id);
  if (session.user.role === "local_nazim" && session.user.majlisId) {
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data: event, error } = await query.single();
  if (error || !event) notFound();
  if (session.user.role === "local_nazim" && event.majlis_id !== session.user.majlisId)
    notFound();
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisName = event.majlis_id
    ? majlis?.find((m) => m.id === event.majlis_id)?.name ?? null
    : null;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/events" className="text-green-600 hover:underline mb-4 inline-block">Back to events</Link>
      <h1 className="text-2xl font-bold mb-6">Edit event</h1>
      <EditEventForm
        event={event}
        majlisList={majlis ?? []}
        role={session.user.role}
        defaultMajlisId={session.user.majlisId}
        majlisName={majlisName}
      />
    </div>
  );
}
