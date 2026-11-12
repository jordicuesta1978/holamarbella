import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifySession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const ALLOWED_BUCKETS = ['apartamentos', 'blog']

// Devuelve una URL firmada para que el navegador del admin suba el archivo
// directamente a Supabase Storage (sin pasar por el límite de tamaño de Vercel).
export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const { bucket, path } = await req.json()
    if (!bucket || !path || typeof path !== 'string' || path.includes('..')) {
      return NextResponse.json({ error: 'Falta bucket o ruta' }, { status: 400 })
    }
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 })
    }

    let res = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path, { upsert: true })
    if (res.error && /bucket/i.test(res.error.message)) {
      await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {})
      res = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path, { upsert: true })
    }
    if (res.error || !res.data) {
      return NextResponse.json({ error: res.error?.message ?? 'Error al firmar la subida' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(res.data.path)
    return NextResponse.json({ token: res.data.token, path: res.data.path, publicUrl: urlData.publicUrl })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
