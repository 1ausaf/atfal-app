import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

const BUCKET = "lesson-thumbnails";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Only Regional Nazim can upload lesson thumbnails" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("thumbnail");
  if (!file || !(file instanceof File))
    return NextResponse.json({ error: "No thumbnail file" }, { status: 400 });
  if (file.type !== "image/png")
    return NextResponse.json({ error: "Only PNG images allowed" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const path = `${session.user.id}/${randomUUID()}.png`;

  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (bucketError && !bucketError.message?.toLowerCase?.().includes("already exists"))
    return NextResponse.json({ error: bucketError.message }, { status: 500 });

  const ab = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, ab, {
    contentType: "image/png",
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
