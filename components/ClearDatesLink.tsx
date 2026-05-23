'use client'

import { useRouter } from 'next/navigation'

export default function ClearDatesLink() {
  const router = useRouter()
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); router.push('/apartamentos') }}
      className="text-xs underline underline-offset-2 mb-3 block"
      style={{ color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
    >
      Puedes comprobar otras fechas →
    </button>
  )
}
