import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const BUCKET = "design-options";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Ensure bucket exists (idempotent)
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
