import type { ReactNode } from 'react'

export const metadata = { title: 'Admin — HolaMarbella' }

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", color: '#1a1a2e' }}>
      {children}
    </div>
  )
}
