'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/admin'
import { LayoutDashboard, MessageSquare, BookOpen, CreditCard, CalendarDays } from 'lucide-react'

type Props = { unreadCount?: number }

export default function AdminNav({ unreadCount = 0 }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/inbox', label: 'Inbox', icon: MessageSquare, badge: unreadCount },
    { href: '/admin/reservas', label: 'Reservas', icon: BookOpen },
    { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
    { href: '/admin/calendario', label: 'Calendario', icon: CalendarDays },
  ]

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e2e8f0',
      padding: '0 20px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#4B766B', marginRight: 12, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
          HolaMarBella!
        </span>
        {links.map(({ href, label, icon: Icon, badge, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 8,
              fontSize: 13, fontWeight: active ? 700 : 500,
              color: active ? '#4B766B' : '#666',
              background: active ? '#f0f9f6' : 'transparent',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              <Icon size={14} />
              {label}
              {badge != null && badge > 0 && (
                <span style={{
                  background: '#e53e3e', color: '#fff',
                  borderRadius: 20, fontSize: 10, fontWeight: 800,
                  padding: '1px 6px', lineHeight: '16px', minWidth: 18, textAlign: 'center',
                }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
      <form action={logout}>
        <button type="submit" style={{
          background: 'none', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '6px 14px', fontSize: 12,
          color: '#888', cursor: 'pointer',
        }}>
          Salir
        </button>
      </form>
    </nav>
  )
}
