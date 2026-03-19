import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { validateFile } from '@/app/lib/file-validation';
import { uploadLimiter } from '@/app/lib/rate-limiter';
import { auditLog } from '@/app/lib/audit';

const BUCKET = 'design-options';

/**
 * Extract client IP from request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Check rate limit (10 uploads per minute per IP)
    const limitCheck = uploadLimiter.check(clientIp);
    if (!limitCheck.allowed) {
      await auditLog('/api/design/upload', clientIp, 'rate_limit_hit', 'Max upload requests exceeded', {
        userAgent,
      });

      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file before upload
    const validation = validateFile(file as File);
    if (!validation.valid) {
      await auditLog('/api/design/upload', clientIp, 'validation_error', validation.error, {
        userAgent,
      });

      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();

    // Ensure bucket exists (idempotent)
    await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const ext = file!.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file!, { contentType: file!.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
