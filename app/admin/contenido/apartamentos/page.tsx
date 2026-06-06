import { getApartamentos, saveApartamentoFull, getApartamentoPhotos, setApartamentoPrimaryPhoto, savePhotoOrder, getApartmentTranslationsForAdmin } from '../actions'
import PhotoGallery from '@/components/PhotoGallery'
import ApartmentTranslations from '@/components/ApartmentTranslations'
import { TRANSLATABLE_LOCALES } from '@/lib/translations'
import { computeKeyFeatures } from '@/lib/apartments'

function label(text: string, hint?: string) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#888' }}>{text}</label>
      {hint && <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>{hint}</span>}
    </div>
  )
}

function field(name: string, value: unknown, type: string = 'text', extra: Record<string, unknown> = {}) {
  return (
    <input
      type={type}
      name={name}
      defaultValue={String(value ?? '')}
      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
      {...extra}
    />
  )
}

export default async function ApartamentosContentPage() {
  const apartments = await getApartamentos()
  const [photosPerApt, translationsBySlug] = await Promise.all([
    Promise.all(apartments.map(apt => getApartamentoPhotos(apt.slug).catch(() => []))),
    getApartmentTranslationsForAdmin().catch(() => ({} as Awaited<ReturnType<typeof getApartmentTranslationsForAdmin>>)),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
        Edita los datos de cada apartamento. Los cambios se publican en la web automáticamente.
      </p>

      {apartments.map((apt, idx) => {
        const topAmenitiesStr = Array.isArray(apt.top_amenities)
          ? apt.top_amenities.join(', ')
          : (apt.top_amenities ?? '')
        const photos = photosPerApt[idx] ?? []

        return (
          <div key={apt.slug} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 16 }}>
              <img
                src={photos[0]?.url || `/images/${apt.slug}/${apt.slug}-1.jpg`}
                alt={apt.title}
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: '#e2e8f0' }}
              />
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{apt.title}</h2>
                <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{apt.slug}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: apt.active === false ? '#fef2f2' : '#f0f9f6',
                color: apt.active === false ? '#dc2626' : '#4B766B',
              }}>
                {apt.active === false ? 'Inactivo' : 'Activo'}
              </span>
            </div>

            {/* Photos section */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              {label('Galería de fotos', 'La foto marcada como "Principal" aparece en las cards y en la cabecera')}
              <PhotoGallery
                slug={apt.slug}
                initialPhotos={photos}
                onPrimaryChange={async (path: string) => {
                  'use server'
                  await setApartamentoPrimaryPhoto(apt.slug, path)
                }}
                onOrderChange={async (orderedPaths: string[]) => {
                  'use server'
                  await savePhotoOrder(apt.slug, orderedPaths)
                }}
              />
            </div>

            {/* Form */}
            <form
              action={async (fd: FormData) => {
                'use server'
                const topAmenStr = fd.get('top_amenities') as string
                const topAmenArr = topAmenStr
                  ? topAmenStr.split(',').map(s => s.trim()).filter(Boolean)
                  : undefined

                await saveApartamentoFull(apt.slug, {
                  title: fd.get('title') as string,
                  subtitle: fd.get('subtitle') as string,
                  description: fd.get('description') as string,
                  persons: Number(fd.get('persons')),
                  bedrooms: Number(fd.get('bedrooms')),
                  bed: fd.get('bed') as string,
                  bathrooms: Number(fd.get('bathrooms')),
                  bed_extras: (fd.get('bed_extras') as string) || undefined,
                  license: fd.get('license') as string,
                  price_min: Number(fd.get('price_min')),
                  price_max: Number(fd.get('price_max')),
                  top_amenities: topAmenArr,
                  active: fd.get('active') === 'on',
                  cleaning_fee: Number(fd.get('cleaning_fee')) || undefined,
                })
              }}
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Nombre corto y subtítulo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  {label('Nombre', 'Nombre completo del apartamento (ej: Apartamento Paloma, Ático AMI)')}
                  {field('title', apt.title)}
                </div>
                <div>
                  {label('Subtítulo', 'Aparece bajo el nombre en la ficha y en el buscador')}
                  {field('subtitle', apt.subtitle)}
                </div>
              </div>

              {/* Descripción */}
              <div>
                {label('Descripción', 'Texto largo que aparece en la ficha del apartamento')}
                <textarea
                  name="description"
                  defaultValue={apt.description ?? ''}
                  rows={3}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              {/* Capacidad */}
              <div>
                {label('Capacidad')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#aaa' }}>Personas</span>
                    {field('persons', apt.persons, 'number', { min: 1, max: 10 })}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#aaa' }}>Dormitorios</span>
                    {field('bedrooms', apt.bedrooms, 'number', { min: 0, max: 10 })}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#aaa' }}>Baños</span>
                    {field('bathrooms', apt.bathrooms, 'number', { min: 1, max: 5 })}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#aaa' }}>Tipo cama</span>
                    {field('bed', apt.bed)}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#aaa' }}>Extras capacidad</span>
                  {field('bed_extras', apt.bed_extras)}
                </div>
              </div>

              {/* Licencia, precios y limpieza */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div>
                  {label('Licencia VFT', 'Número de licencia turística oficial')}
                  {field('license', apt.license)}
                </div>
                <div>
                  {label('Precio mín €/n', 'Temporada baja')}
                  {field('price_min', apt.price_min, 'number', { min: 1 })}
                </div>
                <div>
                  {label('Precio máx €/n', 'Temporada alta')}
                  {field('price_max', apt.price_max, 'number', { min: 1 })}
                </div>
                <div>
                  {label('Limpieza €', 'Coste fijo de limpieza por estancia')}
                  {field('cleaning_fee', apt.cleaning_fee ?? 40, 'number', { min: 0 })}
                </div>
              </div>

              {/* Top amenities */}
              <div>
                {label('Top amenidades (separadas por coma)', 'Aparecen en la ficha del apartamento')}
                {field('top_amenities', topAmenitiesStr)}
              </div>

              {/* Activo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={apt.active !== false}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  Apartamento activo (visible en la home y en /apartamentos)
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            {/* Traducciones (idiomas no base) */}
            <ApartmentTranslations
              slug={apt.slug}
              locales={TRANSLATABLE_LOCALES}
              esReference={{
                name: apt.title ?? '',
                subtitle: apt.subtitle ?? '',
                description: apt.description ?? '',
                keyFeatures: computeKeyFeatures({
                  persons: apt.persons,
                  bedrooms: apt.bedrooms,
                  bed: apt.bed,
                  bathrooms: apt.bathrooms,
                  extras: apt.bed_extras ?? undefined,
                }),
                topAmenities: Array.isArray(apt.top_amenities) ? apt.top_amenities.join(', ') : '',
              }}
              initial={translationsBySlug[apt.slug] ?? {}}
            />
          </div>
        )
      })}
    </div>
  )
}
