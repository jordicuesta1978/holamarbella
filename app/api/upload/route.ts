import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const bucket = (form.get('bucket') as string) || 'apartamentos'
    const path = form.get('path') as string | null

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      // Bucket might not exist — try to create it then retry
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
        await supabaseAdmin.storage.createBucket(bucket, { public: true })
        const retry = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType: file.type, upsert: true })
        if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 })

        const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(retry.data.path)
        return NextResponse.json({ url: urlData.publicUrl, path: retry.data.path })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path)
    return NextResponse.json({ url: urlData.publicUrl, path: data.path })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { bucket, path } = await req.json()
    if (!bucket || !path) return NextResponse.json({ error: 'Missing bucket or path' }, { status: 400 })

    const { error } = await supabaseAdmin.storage.from(bucket).remove([path])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
