import { getApartments } from '@/lib/db'
import { saveApartamento } from '../actions'

export default async function ApartamentosContentPage() {
  const apartments = await getApartments()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {apartments.map(apt => (
        <div key={apt.slug} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Apartamento {apt.title.split(' · ')[0]}</h2>
            <span style={{ fontSize: 11, color: '#888' }}>{apt.slug}</span>
          </div>
          <form action={async (fd: FormData) => {
            'use server'
            await saveApartamento(apt.slug, {
              title: fd.get('title') as string,
              subtitle: fd.get('subtitle') as string,
              description: fd.get('description') as string,
            })
          }} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Título</label>
              <input type="text" name="title" defaultValue={apt.title} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Subtítulo</label>
              <input type="text" name="subtitle" defaultValue={apt.subtitle} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Descripción</label>
              <textarea name="description" defaultValue={apt.description} rows={4} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      ))}
    </div>
  )
}
