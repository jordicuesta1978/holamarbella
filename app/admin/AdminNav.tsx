'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/admin'
import { LayoutDashboard, BookOpen, CalendarDays, Layers, ClipboardList, Settings, Menu, X, LogOut } from 'lucide-react'

export default function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const links = [
    { href: '/admin',               label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { href: '/admin/reservas',      label: 'Reservas',     icon: BookOpen },
    { href: '/admin/calendario',    label: 'Calendario',   icon: CalendarDays },
    { href: '/admin/registros',     label: 'Registros',    icon: ClipboardList },
    { href: '/admin/contenido',     label: 'Contenido',    icon: Layers },
    { href: '/admin/configuracion', label: 'Configuración',icon: Settings },
  ]

  return (
    <>
      {/* ── top bar ── */}
      <nav className="sticky top-0 z-[200] flex items-center justify-between bg-white border-b border-slate-200 px-5 h-14">

        {/* desktop: logo + links */}
        <div className="hidden md:flex items-center gap-0.5">
          <span className="font-extrabold text-[15px] text-[#4B766B] mr-3 tracking-tight whitespace-nowrap">
            HolaMarBella!
          </span>
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap no-underline transition-colors
                  ${active ? 'font-bold text-[#4B766B] bg-[#f0f9f6]' : 'font-medium text-gray-500 hover:text-[#4B766B] hover:bg-[#f0f9f6]'}`}>
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* mobile: logo */}
        <span className="flex md:hidden font-extrabold text-[15px] text-[#4B766B] tracking-tight">
          HolaMarBella!
        </span>

        {/* desktop: logout */}
        <form action={logout} className="hidden md:block">
          <button type="submit"
            className="border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer bg-white">
            Salir
          </button>
        </form>

        {/* mobile: hamburger toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="flex md:hidden items-center border border-slate-200 rounded-lg p-1.5 text-[#4B766B] bg-white cursor-pointer">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* ── mobile dropdown ── */}
      {open && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-[199] bg-white border-b border-slate-200 shadow-lg py-2">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-6 py-3.5 text-[15px] no-underline transition-colors
                  border-l-[3px]
                  ${active
                    ? 'font-bold text-[#4B766B] bg-[#f0f9f6] border-[#4B766B]'
                    : 'font-medium text-gray-700 bg-white border-transparent hover:bg-[#f8fafc]'}`}>
                <Icon size={18} />
                {label}
              </Link>
            )
          })}

          <div className="border-t border-slate-100 mt-2 mb-1" />

          <form action={logout}>
            <button type="submit"
              className="flex items-center gap-3 w-full px-6 py-3.5 text-[15px] font-medium text-gray-400
                border-l-[3px] border-transparent bg-white hover:bg-[#f8fafc] cursor-pointer">
              <LogOut size={18} />
              Salir
            </button>
          </form>
        </div>
      )}
    </>
  )
}
