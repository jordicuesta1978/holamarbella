'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

export default function ClearDatesLink() {
  const router = useRouter()
  const t = useTranslations('apartmentsPage')
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); router.push('/apartamentos') }}
      className="text-xs underline underline-offset-2 mb-3 block"
      style={{ color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
    >
      {t('checkOtherDates')}
    </button>
  )
}
