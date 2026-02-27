/**
 * Seed script: run with npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed.ts
 * Or run the SQL below directly in Supabase SQL editor after migrations.
 */

const MAJLIS_NAMES = [
  "Ahmadiyya Abode of Peace",
  "Rexdale",
  "Weston North West",
  "Weston North East",
  "Weston South",
  "Weston Islington",
  "Emery Village",
];

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Insert majlis
  const { data: majlisRows, error: majlisErr } = await supabase
    .from("majlis")
    .upsert(MAJLIS_NAMES.map((name) => ({ name })), { onConflict: "name" })
    .select("id, name");

  if (majlisErr) {
    console.error("Majlis seed error:", majlisErr);
    process.exit(1);
  }
  console.log("Majlis seeded:", majlisRows?.length);

  // Regional Nazim: member_code and password are set via env or default for first run
  const memberCode = process.env.SEED_REGIONAL_MEMBER_CODE || "regional1";
  const password = process.env.SEED_REGIONAL_PASSWORD || "ChangeMe123!";
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);

  const { error: userErr } = await supabase.from("users").upsert(
    {
      member_code: memberCode,
      password_hash: passwordHash,
      role: "regional_nazim",
      majlis_id: null,
      profile_completed: true,
      name: "Regional Nazim Atfal",
    },
    { onConflict: "member_code" }
  );

  if (userErr) {
    console.error("Regional Nazim seed error:", userErr);
    process.exit(1);
  }
  console.log("Regional Nazim seeded. member_code:", memberCode, "password:", password);
}

seed();
