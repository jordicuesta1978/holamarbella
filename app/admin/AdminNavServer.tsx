import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNav from './AdminNav'

export default async function AdminNavServer() {
  const { count } = await (supabaseAdmin as any)
    .from('mensajes_chat')
    .select('id', { count: 'exact', head: true })
    .eq('sender', 'guest')
    .eq('leido', false)
  return <AdminNav unreadCount={count ?? 0} />
}
