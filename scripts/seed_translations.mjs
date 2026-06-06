#!/usr/bin/env node
/**
 * Seed de traducciones de apartamentos → tabla `apartment_translations`.
 *
 * Inserta (upsert) la traducción EN de los 5 apartamentos. El contenido ES
 * sigue siendo el de la tabla `apartments` (idioma base / fallback), así que
 * aquí solo van los locales NO base.
 *
 * Traducciones EN escritas a mano a partir del contenido ES vigente en la BD
 * (no se usa ninguna API externa). Para añadir otro idioma, agrega un bloque
 * más al objeto TRANSLATIONS con su locale.
 *
 * Requiere la tabla creada antes (supabase/migration_translations.sql).
 * Uso: node scripts/seed_translations.mjs
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Cargar .env.local sin dependencias extra ────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// ── Traducciones ────────────────────────────────────────────────────────────
// key_features se guarda como array (columna TEXT[]); la web lo une con " · ".
const TRANSLATIONS = {
  en: {
    paloma: {
      name: 'Paloma Apartment',
      subtitle: 'Central · Beach with spectacular views',
      description:
        'Modern, bright and newly renovated apartment in the heart of Marbella. West-facing with views of La Concha mountain. Everything within walking distance: tapas bars, beach restaurants, supermarkets. Nearby parking €10/day or €50/week.',
      key_features: ['2 guests', '1 bedroom', '1 king bed (1.80m)', '1 bathroom'],
      top_amenities: [
        'Views of La Concha mountain',
        '347 Mbps Wi-Fi',
        'Teka induction hob',
        'Central A/C',
        'Pool (Jun–Sep)',
        'Full beach kit',
      ],
    },
    micu: {
      name: 'Micu Apartment',
      subtitle: 'Old Town · Beach · Sea views',
      description:
        'Modern and bright, south-facing with sea views. Perfect for enjoying the Old Town and the beach without a car. Everything close by: tapas bars, beach restaurants, the central market.',
      key_features: ['2 guests', '1 bedroom', '1 double bed (1.60m)', '1 bathroom'],
      top_amenities: [
        'Sea views',
        'Wi-Fi',
        'Induction hob',
        'Central A/C',
        'Terrace with outdoor dining',
        'Pool (Jun–Sep)',
      ],
    },
    larysol: {
      name: 'Larysol Apartment',
      subtitle: 'Fontanilla Beach · Town centre',
      description:
        'Elegant and fully equipped. A 1-minute walk from Fontanilla Beach, 10 minutes from the Old Town and 5 minutes from the Marina. Everything within reach.',
      key_features: ['2 guests', '1 bedroom', '1 king bed (1.80m)', '1 bathroom'],
      top_amenities: [
        '607 Mbps Wi-Fi',
        '1 min to Fontanilla Beach',
        'Balay electric hob + oven',
        'Split A/C + ceiling fan',
        'Free street parking',
        'Terrace with outdoor dining',
      ],
    },
    ami: {
      name: 'AMI Penthouse',
      subtitle: 'Old Town · Views of La Concha',
      description:
        'Penthouse in the heart of Marbella, steps from the Plaza de los Naranjos. Views of La Concha. A 5-minute walk to the beach. North-facing: cool in summer and cosy in winter.',
      key_features: ['2 guests', '1 bedroom', '1 bed (1.80m)', '1 bathroom', 'Walk-in closet with desk'],
      top_amenities: [
        'Views of La Concha',
        'Netflix + Amazon Prime',
        'Workspace with door',
        'Private terrace',
        'Breakfast included',
        'Central A/C',
      ],
    },
    banesto: {
      name: 'Banesto Penthouse',
      subtitle: 'La Alameda · Town centre & beach',
      description:
        'Newly renovated penthouse next to La Alameda Park. 200 metres from La Venus beach. Terrace overlooking the Old Town. Renovated en-suite bathroom and a desk with natural light.',
      key_features: ['2 guests', '1 bedroom', '1 bed (1.80m)', '1 en-suite bathroom'],
      top_amenities: [
        'Old Town views',
        '552 Mbps Wi-Fi',
        'Large terrace (table for 4)',
        'Split A/C',
        'Netflix',
        '200m from La Venus beach',
      ],
    },
  },
}

// ── Upsert ──────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date().toISOString()
  const rows = []
  for (const [locale, bySlug] of Object.entries(TRANSLATIONS)) {
    for (const [apartment_slug, t] of Object.entries(bySlug)) {
      rows.push({
        apartment_slug,
        locale,
        name: t.name,
        subtitle: t.subtitle,
        description: t.description,
        key_features: t.key_features,
        top_amenities: t.top_amenities,
        updated_at: now,
      })
    }
  }

  const { data, error } = await db
    .from('apartment_translations')
    .upsert(rows, { onConflict: 'apartment_slug,locale' })
    .select('apartment_slug, locale')

  if (error) {
    console.error('❌ Error al sembrar traducciones:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${rows.length} traducciones sembradas (upsert):`)
  for (const r of data ?? rows) console.log(`   · ${r.apartment_slug} → ${r.locale}`)
}

main()
