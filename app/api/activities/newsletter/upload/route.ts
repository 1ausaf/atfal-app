import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

const BUCKET = "newsletter-covers";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== "regional_nazim" && role !== "local_nazim")
    return NextResponse.json({ error: "Only Regional or Local Nazim can upload covers" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("cover");
  if (!file || !(file instanceof File))
    return NextResponse.json({ error: "No cover file" }, { status: 400 });
  if (file.type !== "image/png")
    return NextResponse.json({ error: "Only PNG images allowed" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const ext = "png";
  const path = `${session.user.id}/${randomUUID()}.${ext}`;

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
