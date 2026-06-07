'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

export async function marcarVerificado(id: number) {
  await db
    .from('registros_viajeros')
    .update({ verificado: true, verificado_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/registros')
  revalidatePath(`/admin/registros/${id}`)
}

export async function eliminarRegistro(id: number) {
  await db.from('registros_viajeros').delete().eq('id', id)
  revalidatePath('/admin/registros')
  redirect('/admin/registros')
}

export async function getRegistro(id: number) {
  const { data, error } = await db
    .from('registros_viajeros')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data
}
