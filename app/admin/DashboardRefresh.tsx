'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRefresh() {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])
  return null
}
