import { NextResponse } from "next/server";
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

  const supabase = createSupabaseServerClient();
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (bucketError && !bucketError.message?.toLowerCase?.().includes("already exists")) {
    return NextResponse.json({ error: bucketError.message }, { status: 500 });
  }

  let payload: { action?: string; fileName?: string; fileType?: string; fileSize?: number } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (payload.action === "create_upload_url") {
    const fileName = payload.fileName ?? "latest.pdf";
    const fileType = payload.fileType ?? "";
    const fileSize = payload.fileSize ?? 0;
    const fakeFile = { name: fileName, type: fileType } as File;
    if (!isPdfFile(fakeFile)) {
      return NextResponse.json(
        { error: `Only PDF files allowed. Received type="${fileType || "unknown"}" name="${fileName}"` },
        { status: 400 }
      );
    }
    if (fileSize > MAX_SIZE) return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(STABLE_FILE_PATH);
    if (error || !data?.token) {
      return NextResponse.json({ error: `Failed to create upload URL: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }
    return NextResponse.json({ path: STABLE_FILE_PATH, token: data.token });
  }

  if (payload.action !== "finalize_upload") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(STABLE_FILE_PATH);
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
