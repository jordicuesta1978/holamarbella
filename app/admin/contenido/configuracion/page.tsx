import { getApartments } from '@/lib/db'
import { getCleaningFees, saveCleaningFee } from '../actions'

const APTS = ['paloma', 'micu', 'larysol', 'ami', 'banesto']

export default async function ConfiguracionPage() {
  const [apartments, fees] = await Promise.all([getApartments(), getCleaningFees().catch(() => ({}))])

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Tarifa de limpieza por apartamento</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Se muestra en el resumen de reserva del huésped. Default: 40€.</p>
      </div>
      {APTS.map((slug, i) => {
        const apt = apartments.find(a => a.slug === slug)
        const currentFee = (fees as Record<string, number>)[slug] ?? 40
        return (
          <form key={slug} action={async (fd: FormData) => {
            'use server'
            await saveCleaningFee(slug, Number(fd.get('fee')))
          }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < APTS.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
              {apt?.title ?? slug}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                name="fee"
                defaultValue={currentFee}
                min={0}
                style={{ width: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none' }}
              />
              <span style={{ fontSize: 13, color: '#888' }}>€</span>
              <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Guardar
              </button>
            </div>
          </form>
        )
      })}
    </div>
  )
}
