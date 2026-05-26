import Link from 'next/link'
import AdminNavServer from '@/app/admin/AdminNavServer'

export const dynamic = 'force-dynamic'

const SECTIONS = [
  { href: '/admin/contenido/disponibilidad', label: 'Disponibilidad' },
  { href: '/admin/contenido/precios', label: 'Precios' },
  { href: '/admin/contenido/apartamentos', label: 'Apartamentos' },
  { href: '/admin/contenido/blog', label: 'Blog' },
  { href: '/admin/contenido/resenas', label: 'Reseñas' },
]

export default function ContenidoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Gestor de contenido</h1>
        <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, background: '#fff', borderRadius: 10, padding: 6, border: '1px solid #e2e8f0' }}>
          {SECTIONS.map(s => (
            <Link key={s.href} href={s.href} style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
              color: '#4B766B', textDecoration: 'none', transition: 'background 0.15s',
            }}
              className="hover:bg-slate-100"
            >
              {s.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}
