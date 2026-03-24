import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const BUCKET = "religious-knowledge-pdfs";
const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const CHECKPOINT_ID = "cp-1";
const STABLE_FILE_PATH = `${CHECKPOINT_ID}/latest.pdf`;

function isPdfFile(file: File) {
  const mimeOk = file.type === "application/pdf";
  const nameOk = file.name.toLowerCase().endsWith(".pdf");
  return mimeOk || nameOk;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("religious_knowledge_checkpoint_files")
    .select("file_url, updated_at")
    .eq("checkpoint_id", CHECKPOINT_ID)
    .maybeSingle();
  if (!error && data?.file_url) {
    return NextResponse.json({ file_url: data.file_url, updated_at: data.updated_at ?? null });
  }

  const { data: listData } = await supabase.storage.from(BUCKET).list(CHECKPOINT_ID, {
    search: "latest.pdf",
    limit: 10,
  });
  const hasStableFile = (listData ?? []).some((item) => item.name === "latest.pdf");
  if (!hasStableFile) return NextResponse.json({ file_url: null, updated_at: null });

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(STABLE_FILE_PATH);
  return NextResponse.json({ file_url: urlData.publicUrl, updated_at: null });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only Regional Nazim can upload Foundations PDF" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("pdf");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "No PDF file" }, { status: 400 });
  if (!isPdfFile(file)) {
    return NextResponse.json(
      { error: `Only PDF files allowed. Received type="${file.type || "unknown"}" name="${file.name}"` },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (bucketError && !bucketError.message?.toLowerCase?.().includes("already exists")) {
    return NextResponse.json({ error: bucketError.message }, { status: 500 });
  }

  const path = STABLE_FILE_PATH;
  const ab = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, ab, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { error: saveError } = await supabase.from("religious_knowledge_checkpoint_files").upsert(
    {
      checkpoint_id: CHECKPOINT_ID,
      file_url: url,
      uploaded_by: session.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "checkpoint_id" }
  );
  // Keep upload functional even if migration table is missing.
  if (saveError) {
    return NextResponse.json({
      file_url: url,
      warning: `Metadata save warning: ${saveError.message}`,
    });
  }

  return NextResponse.json({ file_url: url });
}
