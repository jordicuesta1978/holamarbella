// @ts-check
// Seed Supabase con encoding UTF-8 correcto via Management API

const PAT = process.env.SUPABASE_PAT || "REVOKED";
const REF = "kftyemxltrzxafzpyafh";
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;

async function query(sql) {
  const body = JSON.stringify({ query: sql }); // JSON.stringify ya produce UTF-8
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: text };
  return { ok: true, data: JSON.parse(text) };
}

// Escapa un valor para SQL: NULL o string con '' escapadas
function s(v) {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// ARRAY['a','b',...]
function sqlArray(items) {
  return "ARRAY[" + items.map(s).join(", ") + "]";
}

// '...'::jsonb con comillas simples escapadas
function sqlJsonb(obj) {
  const j = JSON.stringify(obj); // caracteres Unicode quedan como son
  return "'" + j.replace(/'/g, "''") + "'::jsonb";
}

// ─── DATOS ───────────────────────────────────────────────────────────────────

const APARTMENTS = [
  {
    slug: "paloma",
    title: "Hola MarBella Centro/Playa · Vistas espectaculares",
    subtitle: "Centro · Playa · Vistas espectaculares",
    rating: 5.0, review_count: 42, badge: "Top 1% Airbnb",
    persons: 2, bedrooms: 1, bed: "1 cama king 1,80m", bathrooms: 1, bed_extras: null,
    description: "Apartamento moderno, luminoso y recién renovado en el centro de Marbella. Orientación oeste con vistas a La Concha. Todo a pie: tapas, chiringuitos, supermercados. Parking cercano 10€/día o 50€/semana.",
    license: "VFT/MA/597131", photo_count: 19, price_min: 80, price_max: 150,
    top_amenities: ["Vistas a La Concha","Wifi 347 Mbps","Cocina inducción Teka","A/C centralizado","Piscina (jun-sept)","Kit playa completo"],
    amenity_categories: [
      { label: "Baño", items: ["Secador","Champú","Acondicionador","Gel","Ropa de cama y toallas incluidas"] },
      { label: "Dormitorio", items: ["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"] },
      { label: "Cocina", items: ["Cocina inducción Teka","Nevera","Congelador","Lavavajillas","Microondas","Horno","Hervidor","Nespresso + émbolo","Copas vino","Tostadora","Batidora","Arrocera","Utensilios","Mesa comedor","Café"] },
      { label: "Lavandería", items: ["Lavadora","Secadora","Plancha","Tendedero"] },
      { label: "Entretenimiento", items: ['TV 50" HD',"Sonido Bluetooth","Libros"] },
      { label: "Trabajo y conectividad", items: ["Wifi 347 Mbps","Zona trabajo"] },
      { label: "Climatización", items: ["A/C centralizado","Calefacción"] },
      { label: "Seguridad", items: ["Detector de humo","Botiquín"] },
      { label: "Exterior y vistas", items: ["Vistas a La Concha","Terraza","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"] },
      { label: "Acceso", items: ["Entrada privada","Ascensor","Gimnasio","Piscina (jun-sept)","Aparcamiento pago","Dejar equipaje"] },
      { label: "Servicios", items: ["Recepción personal Mar","Estancias largas","Limpieza durante estancia"] },
    ],
  },
  {
    slug: "micu",
    title: "Hola MarBella · Casco Antiguo y playa a 5 minutos",
    subtitle: "Casco Antiguo · Playa · Vistas al mar",
    rating: 5.0, review_count: 19, badge: null,
    persons: 2, bedrooms: 1, bed: "1 cama doble 1,60m", bathrooms: 1, bed_extras: null,
    description: "Moderno y luminoso con orientación sur y vistas al mar. Perfecto para disfrutar del Casco Antiguo y la playa sin coche. Todo a tu alcance: tapas, chiringuitos, mercado central.",
    license: "VFT/MA/597131", photo_count: 15, price_min: 75, price_max: 140,
    top_amenities: ["Vistas al mar","Wifi","Cocina inducción","A/C centralizado","Terraza con comedor exterior","Piscina (jun-sept)"],
    amenity_categories: [
      { label: "Baño", items: ["Secador","Champú Deliplus","Acondicionador","Gel","Ropa de cama y toallas incluidas"] },
      { label: "Dormitorio", items: ["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"] },
      { label: "Cocina", items: ["Cocina inducción","Nevera Beko","Congelador","Lavavajillas","Microondas","Hervidor","Nespresso + filtro","Copas vino","Tostadora","Utensilios","Mesa comedor","Café"] },
      { label: "Lavandería", items: ["Lavadora","Secadora","Plancha","Tendedero"] },
      { label: "Entretenimiento", items: ['TV 50" HD',"Sonido Bluetooth Alehop","Libros"] },
      { label: "Trabajo y conectividad", items: ["Wifi","Ethernet","Zona trabajo ergonómica"] },
      { label: "Climatización", items: ["A/C centralizado","Calefacción"] },
      { label: "Seguridad", items: ["Detector de humo","Extintor","Botiquín"] },
      { label: "Exterior y vistas", items: ["Vistas al mar","Vistas urbanas","Terraza","Comedor exterior","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"] },
      { label: "Acceso", items: ["Entrada privada","Ascensor","Gimnasio","Piscina (jun-sept)","Dejar equipaje"] },
      { label: "Servicios", items: ["Recepción personal Mar","Estancias largas"] },
    ],
  },
  {
    slug: "larysol",
    title: "Hola MarBella · Playa de la Fontanilla / Centro",
    subtitle: "Fontanilla · 1 min a la playa · Wifi 607 Mbps",
    rating: 4.99, review_count: 80, badge: "Top 5% Airbnb",
    persons: 2, bedrooms: 1, bed: "1 cama king 1,80m", bathrooms: 1, bed_extras: null,
    description: "Elegante y totalmente equipado. A 1 minuto de la Playa de la Fontanilla, 10 min del Casco Antiguo y 5 min del Puerto Deportivo. Todo a tu alcance.",
    license: "VUT/MA/38069", photo_count: 15, price_min: 85, price_max: 160,
    top_amenities: ["Wifi 607 Mbps","1 min a la Playa Fontanilla","Cocina eléctrica Balay + horno","A/C split + ventilador techo","Aparcamiento gratuito en calle","Terraza con comedor exterior"],
    amenity_categories: [
      { label: "Baño", items: ["Secador","Champú","Acondicionador Deliplus","Gel","Ropa de cama algodón incluida"] },
      { label: "Dormitorio", items: ["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"] },
      { label: "Cocina", items: ["Cocina eléctrica","Horno Fagor","Nevera","Congelador","Lavavajillas","Microondas","Hervidor","Expreso + Keurig + Nespresso","Copas vino","Tostadora","Bandeja repostería","Batidora","Utensilios","Mesa comedor","Café"] },
      { label: "Lavandería", items: ["Lavadora","Secadora","Plancha","Tendedero"] },
      { label: "Entretenimiento", items: ['TV 50" HD',"Sonido Bluetooth","Libros"] },
      { label: "Trabajo y conectividad", items: ["Wifi 607 Mbps","Ethernet","Zona trabajo privada"] },
      { label: "Climatización", items: ["A/C split","Ventilador de techo","Calefacción split","Calefactor portátil"] },
      { label: "Seguridad", items: ["Detector de humo","Extintor","Botiquín"] },
      { label: "Exterior y vistas", items: ["Terraza","Comedor exterior","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"] },
      { label: "Acceso", items: ["Entrada privada","Ascensor","Gimnasio","Aparcamiento gratuito en calle","Aparcamiento pago en garaje","Dejar equipaje"] },
      { label: "Servicios", items: ["Recepción personal Mar","Estancias largas"] },
    ],
  },
  {
    slug: "ami",
    title: "Hola MarBella · Coqueto Ático · Ubicación inmejorable",
    subtitle: "Casco Antiguo · Vistas a La Concha · Netflix incluido",
    rating: 4.99, review_count: 88, badge: "Top 1% Airbnb",
    persons: 2, bedrooms: 1, bed: "1 cama 1,80m", bathrooms: 1, bed_extras: "Vestidor con escritorio",
    description: "Ático en el corazón de Marbella, a pasos de la Plaza de los Naranjos. Vistas a La Concha. 5 minutos a pie a la playa. Orientación norte: fresco en verano y acogedor en invierno.",
    license: "VFT/MA/47399", photo_count: 15, price_min: 90, price_max: 170,
    top_amenities: ["Vistas a La Concha","Netflix + Amazon Prime","Zona trabajo con puerta","Terraza privada","Desayuno incluido","A/C centralizado"],
    amenity_categories: [
      { label: "Baño", items: ["Secador","Champú Deliplus","Acondicionador","Gel","Ropa de cama algodón incluida"] },
      { label: "Dormitorio", items: ["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"] },
      { label: "Cocina", items: ["Cocina eléctrica","Horno Zanussi","Nevera Roma","Congelador","Lavavajillas","Microondas","Hervidor","Émbolo + Nespresso","Copas vino","Tostadora","Bandeja repostería","Batidora","Utensilios","Mesa comedor","Café"] },
      { label: "Lavandería", items: ["Lavadora","Plancha","Tendedero"] },
      { label: "Entretenimiento", items: ['TV 42" Netflix + Amazon Prime + cable',"Sonido Bluetooth","Libros"] },
      { label: "Trabajo y conectividad", items: ["Wifi","Ethernet","Zona trabajo con puerta"] },
      { label: "Climatización", items: ["A/C centralizado","Calefacción"] },
      { label: "Seguridad", items: ["Detector de humo","Extintor","Botiquín"] },
      { label: "Exterior y vistas", items: ["Vistas a La Concha","Terraza privada","Comedor exterior","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"] },
      { label: "Acceso", items: ["Entrada privada","Ascensor","Aparcamiento pago","Dejar equipaje"] },
      { label: "Servicios", items: ["Recepción personal Mar","Desayuno incluido","Estancias largas","Limpieza (coste adicional)"] },
    ],
  },
  {
    slug: "banesto",
    title: "Hola MarBella · Ático en La Alameda · Centro / Playa",
    subtitle: "La Alameda · 200m playa La Venus · Baño en suite",
    rating: 4.97, review_count: 74, badge: "Top 1% Airbnb",
    persons: 2, bedrooms: 1, bed: "1 cama 1,80m", bathrooms: 1, bed_extras: "Baño en suite",
    description: "Ático recién renovado junto al Parque de la Alameda. A 200 metros de la playa de La Venus. Terraza con vistas al casco antiguo. Baño en suite renovado con escritorio con luz natural.",
    license: "VUT/MA/48799", photo_count: 15, price_min: 95, price_max: 180,
    top_amenities: ["Vistas al casco antiguo","Wifi 552 Mbps","Gran terraza (mesa 4 personas)","A/C split","Netflix","200m de la playa La Venus"],
    amenity_categories: [
      { label: "Baño", items: ["Secador","Champú Deliplus","Acondicionador","Gel","Ropa de cama y toallas incluidas"] },
      { label: "Dormitorio", items: ["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"] },
      { label: "Cocina", items: ["Cocina eléctrica","Nevera Beko","Congelador","Lavavajillas","Microondas","Hervidor","Nespresso","Copas vino","Tostadora","Batidora","Utensilios","Mesa comedor","Café"] },
      { label: "Lavandería", items: ["Lavadora","Secadora","Plancha","Tendedero"] },
      { label: "Entretenimiento", items: ['TV 40" Netflix + cable',"Libros"] },
      { label: "Trabajo y conectividad", items: ["Wifi 552 Mbps","Ethernet","Zona trabajo con puerta"] },
      { label: "Climatización", items: ["A/C split","Calefacción split"] },
      { label: "Seguridad", items: ["Detector de humo","Extintor","Botiquín"] },
      { label: "Exterior y vistas", items: ["Vistas al casco antiguo","Gran terraza (mesa 4 personas)","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"] },
      { label: "Acceso", items: ["Entrada privada","Ascensor","Gimnasio","Aparcamiento pago","Dejar equipaje"] },
      { label: "Servicios", items: ["Recepción personal Mar","Estancias largas"] },
    ],
  },
];

const RESENAS = [
  ["paloma",  "Carlos",      "Madrid",       "Abril 2025",   5, "Mar fue una anfitriona excepcional. El apartamento estaba impecable y la ubicación no podría ser mejor para descubrir Marbella."],
  ["paloma",  "Sarah",       "London",       "March 2025",   5, "Mar was an amazing host. The apartment was spotless and the location couldn't be better. Perfect for a long stay."],
  ["paloma",  "Laura",       "Barcelona",    "Febrero 2025", 5, "Todo perfecto desde el primer mensaje. Mar nos recibió en persona y el apartamento superó todas nuestras expectativas."],
  ["paloma",  "Thomas",      "Paris",        "Janvier 2025", 5, "Vue magnifique sur La Concha. Appartement très propre et bien équipé. Mar est une hôte fantastique, disponible et attentionnée."],
  ["micu",    "Isabel",      "Sevilla",      "Mayo 2025",    5, "Apartamento precioso con vistas increíbles al mar. La ubicación en el casco antiguo es perfecta, a todo a pie. Mar, atentísima."],
  ["micu",    "Mark",        "Amsterdam",    "April 2025",   5, "Great apartment with sea views. Very clean and modern. Mar was super helpful and welcoming. Will definitely come back!"],
  ["micu",    "Ana",         "Valencia",     "Marzo 2025",   5, "Todo impecable. El apartamento es exactamente como en las fotos, incluso mejor. La terraza es una maravilla para cenar."],
  ["larysol", "Mónica",      "Madrid",       "Junio 2025",   5, "Apartamento de lujo a precio razonable. La playa está literalmente a un minuto. El wifi es increíblemente rápido, ideal para trabajar."],
  ["larysol", "James",       "Manchester",   "May 2025",     5, "Excellent location right by Fontanilla beach. Very well equipped kitchen. Mar was perfect – met us in person and gave us great local tips."],
  ["larysol", "Lucía",       "Málaga",       "Abril 2025",   4, "Precioso apartamento muy bien equipado. La terraza exterior es genial para desayunar. Mar muy amable y atenta en todo momento."],
  ["larysol", "Klaus",       "München",      "März 2025",    5, "Super Wohnung, sehr sauber und gut ausgestattet. Perfekte Lage direkt am Strand. Mar ist eine wunderbare Gastgeberin."],
  ["ami",     "Patricia",    "Bilbao",       "Mayo 2025",    5, "Ático espectacular en el centro histórico. Las vistas a La Concha son increíbles. El desayuno incluido es un detalle muy especial."],
  ["ami",     "Emma",        "London",       "April 2025",   5, "Charming penthouse in the heart of the old town. Views are stunning. Loved the Netflix and the cozy terrace. Mar is brilliant."],
  ["ami",     "François",    "Lyon",         "Mars 2025",    5, "Superbe appartement, très bien situé. La terrasse privée est magnifique. Mar nous a accueillis chaleureusement et était toujours disponible."],
  ["ami",     "Rodrigo",     "Buenos Aires", "Febrero 2025", 5, "Un ático único en Marbella. La ubicación en el casco antiguo es perfecta. Mar una anfitriona de lujo, con mil recomendaciones."],
  ["banesto", "Jorge",       "Córdoba",      "Mayo 2025",    5, "Ático increíble con terraza enorme. Las vistas al casco antiguo son preciosas. A dos pasos de la playa La Venus. Mar excelente."],
  ["banesto", "Sophie",      "Brussels",     "April 2025",   5, "Beautiful penthouse with a huge terrace. Very well located near the beach. Everything was spotless. Highly recommend!"],
  ["banesto", "Alessandro",  "Milano",       "Marzo 2025",   5, "Appartamento meraviglioso, terrazza stupenda con vista sul centro storico. Mar è una host fantastica, disponibile e gentile."],
  ["banesto", "Carmen",      "Málaga",       "Febrero 2025", 4, "Ático muy bien equipado y renovado. El baño en suite es una maravilla. La terraza perfecta para tomar el sol. Mar, genial."],
];

// ─── EJECUCIÓN ────────────────────────────────────────────────────────────────

console.log("=".repeat(60));

console.log("PASO 1: Borrando todos los registros (CASCADE)...");
const del = await query("DELETE FROM apartments");
console.log("  →", del.ok ? "OK" : "ERROR: " + del.error);

console.log("\nPASO 2: Insertando apartamentos...");
for (const apt of APARTMENTS) {
  const sql = `
INSERT INTO apartments (
  slug, title, subtitle, rating, review_count, badge,
  persons, bedrooms, bed, bathrooms, bed_extras,
  description, license, photo_count, price_min, price_max,
  top_amenities, amenity_categories
) VALUES (
  ${s(apt.slug)}, ${s(apt.title)}, ${s(apt.subtitle)},
  ${apt.rating}, ${apt.review_count}, ${s(apt.badge)},
  ${apt.persons}, ${apt.bedrooms}, ${s(apt.bed)},
  ${apt.bathrooms}, ${s(apt.bed_extras)},
  ${s(apt.description)}, ${s(apt.license)},
  ${apt.photo_count}, ${apt.price_min}, ${apt.price_max},
  ${sqlArray(apt.top_amenities)},
  ${sqlJsonb(apt.amenity_categories)}
)`.trim();
  const r = await query(sql);
  console.log(`  [${apt.slug.padEnd(8)}] ${r.ok ? "OK" : "ERROR: " + r.error}`);
}

console.log("\nPASO 3: Insertando reseñas...");
for (const [slug, author, location, date, rating, text] of RESENAS) {
  const sql = `INSERT INTO resenas (apartment_slug, author, location, date, rating, text) VALUES (${s(slug)}, ${s(author)}, ${s(location)}, ${s(date)}, ${rating}, ${s(text)})`;
  const r = await query(sql);
  console.log(`  [${slug.padEnd(8)} · ${author.padEnd(12)}] ${r.ok ? "OK" : "ERROR: " + r.error}`);
}

console.log("\nPASO 4: Verificando encoding...");
const check = await query("SELECT slug, LEFT(description,50) AS desc, top_amenities[1] AS amenity1, (amenity_categories->0->>'label') AS cat1 FROM apartments ORDER BY id");
if (check.ok) {
  for (const row of check.data) {
    console.log(`  ${row.slug.padEnd(8)} | ${row.desc}`);
    console.log(`           amenity: ${row.amenity1} | cat: ${row.cat1}`);
  }
} else {
  console.log("  ERROR:", check.error);
}

console.log("\n✓ Hecho.");
