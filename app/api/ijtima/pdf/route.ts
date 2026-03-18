import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

type IjtimaDocKey = "sagheer-g1" | "sagheer-g2" | "kabeer";

const BUCKET = "ijtima";
const SIGNED_URL_TTL_SECONDS = 60;

const OBJECT_KEY_BY_DOC: Record<IjtimaDocKey, string> = {
  "sagheer-g1": "mayar-e-sagheer-group-1.pdf",
  "sagheer-g2": "mayar-e-sagheer-group-2.pdf",
  kabeer: "mayar-e-kabeer.pdf",
};

const ALLOWED_DOC_BY_AGE_GROUP: Record<string, IjtimaDocKey> = {
  "7-9": "sagheer-g1",
  "10-11": "sagheer-g2",
  "12-14": "kabeer",
};

function textError(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return textError(401, "Unauthorized");
  if (session.user.role !== "tifl") return textError(403, "Forbidden");

  const url = new URL(request.url);
  const doc = url.searchParams.get("doc");
  if (!doc) return textError(400, "Missing doc");
  if (doc !== "sagheer-g1" && doc !== "sagheer-g2" && doc !== "kabeer") return textError(404, "Not found");

  const supabase = createSupabaseServerClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("age_group")
    .eq("id", session.user.id)
    .single();

  if (userError) return textError(500, "Could not load profile");
  const allowed = user?.age_group ? ALLOWED_DOC_BY_AGE_GROUP[user.age_group] : undefined;
  if (!allowed) return textError(403, "Age group not set");
  if (allowed !== doc) return textError(403, "Not allowed for your age group");

  const objectKey = OBJECT_KEY_BY_DOC[doc];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(objectKey, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return textError(500, "Could not create signed URL");

  return NextResponse.redirect(data.signedUrl);
}

