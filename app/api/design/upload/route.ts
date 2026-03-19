import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { validateFile } from "@/app/lib/file-validation";

const BUCKET = "design-options";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  // Validate file before upload
  const validation = validateFile(file as File);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  // Ensure bucket exists (idempotent)
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const ext = file!.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file!, { contentType: file!.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
