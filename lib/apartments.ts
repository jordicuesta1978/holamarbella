export type AmenityCategory = {
  label: string;
  items: string[];
};

export type ApartmentReview = {
  author: string;
  location: string;
  date: string;
  rating: number;
  text: string;
};

export type Apartment = {
  slug: string;
  title: string;
  subtitle: string;
  key_features: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  capacity: {
    persons: number;
    bedrooms: number;
    bed: string;
    bathrooms: number;
    extras?: string;
  };
  description: string;
  license: string;
  topAmenities: string[];
  amenityCategories: AmenityCategory[];
  photoCount: number;
  primaryPhotoUrl?: string;
  priceRange: [number, number];
  reviews: ApartmentReview[];
};

export function computeKeyFeatures(capacity: Apartment['capacity']): string {
  const extrasLower = capacity.extras?.toLowerCase() ?? ''
  const bath = extrasLower.includes('baño')
    ? extrasLower.replace('baño', `${capacity.bathrooms} baño`)
    : `${capacity.bathrooms} baño${capacity.bathrooms > 1 ? 's' : ''}`
  const extras = capacity.extras && !extrasLower.includes('baño') ? ` · ${capacity.extras}` : ''
  return `${capacity.persons} persona${capacity.persons > 1 ? 's' : ''} · ${capacity.bedrooms} dormitorio · ${capacity.bed} · ${bath}${extras}`
}

export function getPhotos(slug: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `/images/${slug}/${slug}-${i + 1}.jpg`);
}

// Static seed kept for reference — source of truth is Supabase (lib/db.ts)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _apartments = [
  {
    slug: 'paloma',
    title: 'Paloma · Centro/Playa · Vistas espectaculares',
    subtitle: 'Centro · Playa · Vistas espectaculares',
    rating: 5.0,
    reviewCount: 42,
    badge: 'Top 1% Airbnb',
    capacity: { persons: 2, bedrooms: 1, bed: '1 cama king 1,80m', bathrooms: 1 },
    description: 'Apartamento moderno, luminoso y recién renovado en el centro de Marbella. Orientación oeste con vistas a La Concha. Todo a pie: tapas, chiringuitos, supermercados. Parking cercano 10€/día o 50€/semana.',
    license: 'VFT/MA/597131',
    photoCount: 19,
    priceRange: [80, 150],
    topAmenities: [
      'Vistas a La Concha',
      'Wifi 347 Mbps',
      'Cocina inducción Teka',
      'A/C centralizado',
      'Piscina (jun-sept)',
      'Kit playa completo',
    ],
    amenityCategories: [
      { label: 'Baño', items: ['Secador', 'Champú', 'Acondicionador', 'Gel', 'Ropa de cama y toallas incluidas'] },
      { label: 'Dormitorio', items: ['Armario y cómoda', 'Perchas', 'Almohadas extra', 'Persianas opacas', 'Caja fuerte'] },
      { label: 'Cocina', items: ['Cocina inducción Teka', 'Nevera', 'Congelador', 'Lavavajillas', 'Microondas', 'Horno', 'Hervidor', 'Nespresso + émbolo', 'Copas vino', 'Tostadora', 'Batidora', 'Arrocera', 'Utensilios', 'Mesa comedor', 'Café'] },
      { label: 'Lavandería', items: ['Lavadora', 'Secadora', 'Plancha', 'Tendedero'] },
      { label: 'Entretenimiento', items: ['TV 50" HD', 'Sonido Bluetooth', 'Libros'] },
      { label: 'Trabajo y conectividad', items: ['Wifi 347 Mbps', 'Zona trabajo'] },
      { label: 'Climatización', items: ['A/C centralizado', 'Calefacción'] },
      { label: 'Seguridad', items: ['Detector de humo', 'Botiquín'] },
      { label: 'Exterior y vistas', items: ['Vistas a La Concha', 'Terraza', 'Kit playa completo', 'Playa a pocos minutos a pie', 'A pasos del mar'] },
      { label: 'Acceso', items: ['Entrada privada', 'Ascensor', 'Gimnasio', 'Piscina (jun-sept)', 'Aparcamiento pago', 'Dejar equipaje'] },
      { label: 'Servicios', items: ['Recepción personal Mar', 'Estancias largas', 'Limpieza durante estancia'] },
    ],
    reviews: [
      { author: 'Carlos', location: 'Madrid', date: 'Abril 2025', rating: 5, text: 'Mar fue una anfitriona excepcional. El apartamento estaba impecable y la ubicación no podría ser mejor para descubrir Marbella.' },
      { author: 'Sarah', location: 'London', date: 'March 2025', rating: 5, text: "Mar was an amazing host. The apartment was spotless and the location couldn't be better. Perfect for a long stay." },
      { author: 'Laura', location: 'Barcelona', date: 'Febrero 2025', rating: 5, text: 'Todo perfecto desde el primer mensaje. Mar nos recibió en persona y el apartamento superó todas nuestras expectativas.' },
      { author: 'Thomas', location: 'Paris', date: 'Janvier 2025', rating: 5, text: 'Vue magnifique sur La Concha. Appartement très propre et bien équipé. Mar est une hôte fantastique, disponible et attentionnée.' },
    ],
  },
  {
    slug: 'micu',
    title: 'Micu · Casco Antiguo · Playa a 5 minutos',
    subtitle: 'Casco Antiguo · Playa · Vistas al mar',
    rating: 5.0,
    reviewCount: 19,
    capacity: { persons: 2, bedrooms: 1, bed: '1 cama doble 1,60m', bathrooms: 1 },
    description: 'Moderno y luminoso con orientación sur y vistas al mar. Perfecto para disfrutar del Casco Antiguo y la playa sin coche. Todo a tu alcance: tapas, chiringuitos, mercado central.',
    license: 'VFT/MA/597131',
    photoCount: 15,
    priceRange: [75, 140],
    topAmenities: [
      'Vistas al mar',
      'Wifi',
      'Cocina inducción',
      'A/C centralizado',
      'Terraza con comedor exterior',
      'Piscina (jun-sept)',
    ],
    amenityCategories: [
      { label: 'Baño', items: ['Secador', 'Champú Deliplus', 'Acondicionador', 'Gel', 'Ropa de cama y toallas incluidas'] },
      { label: 'Dormitorio', items: ['Armario y cómoda', 'Perchas', 'Almohadas extra', 'Persianas opacas', 'Caja fuerte'] },
      { label: 'Cocina', items: ['Cocina inducción', 'Nevera Beko', 'Congelador', 'Lavavajillas', 'Microondas', 'Hervidor', 'Nespresso + filtro', 'Copas vino', 'Tostadora', 'Utensilios', 'Mesa comedor', 'Café'] },
      { label: 'Lavandería', items: ['Lavadora', 'Secadora', 'Plancha', 'Tendedero'] },
      { label: 'Entretenimiento', items: ['TV 50" HD', 'Sonido Bluetooth Alehop', 'Libros'] },
      { label: 'Trabajo y conectividad', items: ['Wifi', 'Ethernet', 'Zona trabajo ergonómica'] },
      { label: 'Climatización', items: ['A/C centralizado', 'Calefacción'] },
      { label: 'Seguridad', items: ['Detector de humo', 'Extintor', 'Botiquín'] },
      { label: 'Exterior y vistas', items: ['Vistas al mar', 'Vistas urbanas', 'Terraza', 'Comedor exterior', 'Kit playa completo', 'Playa a pocos minutos a pie', 'A pasos del mar'] },
      { label: 'Acceso', items: ['Entrada privada', 'Ascensor', 'Gimnasio', 'Piscina (jun-sept)', 'Dejar equipaje'] },
      { label: 'Servicios', items: ['Recepción personal Mar', 'Estancias largas'] },
    ],
    reviews: [
      { author: 'Isabel', location: 'Sevilla', date: 'Mayo 2025', rating: 5, text: 'Apartamento precioso con vistas increíbles al mar. La ubicación en el casco antiguo es perfecta, a todo a pie. Mar, atentísima.' },
      { author: 'Mark', location: 'Amsterdam', date: 'April 2025', rating: 5, text: 'Great apartment with sea views. Very clean and modern. Mar was super helpful and welcoming. Will definitely come back!' },
      { author: 'Ana', location: 'Valencia', date: 'Marzo 2025', rating: 5, text: 'Todo impecable. El apartamento es exactamente como en las fotos, incluso mejor. La terraza es una maravilla para cenar.' },
    ],
  },
  {
    slug: 'larysol',
    title: 'Larysol · Playa de la Fontanilla / Centro',
    subtitle: 'Fontanilla · 1 min a la playa · Wifi 607 Mbps',
    rating: 4.99,
    reviewCount: 80,
    badge: 'Top 5% Airbnb',
    capacity: { persons: 2, bedrooms: 1, bed: '1 cama king 1,80m', bathrooms: 1 },
    description: 'Elegante y totalmente equipado. A 1 minuto de la Playa de la Fontanilla, 10 min del Casco Antiguo y 5 min del Puerto Deportivo. Todo a tu alcance.',
    license: 'VUT/MA/38069',
    photoCount: 15,
    priceRange: [85, 160],
    topAmenities: [
      'Wifi 607 Mbps',
      '1 min a la Playa Fontanilla',
      'Cocina eléctrica Balay + horno',
      'A/C split + ventilador techo',
      'Aparcamiento gratuito en calle',
      'Terraza con comedor exterior',
    ],
    amenityCategories: [
      { label: 'Baño', items: ['Secador', 'Champú', 'Acondicionador Deliplus', 'Gel', 'Ropa de cama algodón incluida'] },
      { label: 'Dormitorio', items: ['Armario y cómoda', 'Perchas', 'Almohadas extra', 'Persianas opacas', 'Caja fuerte'] },
      { label: 'Cocina', items: ['Cocina eléctrica', 'Horno Fagor', 'Nevera', 'Congelador', 'Lavavajillas', 'Microondas', 'Hervidor', 'Expreso + Keurig + Nespresso', 'Copas vino', 'Tostadora', 'Bandeja repostería', 'Batidora', 'Utensilios', 'Mesa comedor', 'Café'] },
      { label: 'Lavandería', items: ['Lavadora', 'Secadora', 'Plancha', 'Tendedero'] },
      { label: 'Entretenimiento', items: ['TV 50" HD', 'Sonido Bluetooth', 'Libros'] },
      { label: 'Trabajo y conectividad', items: ['Wifi 607 Mbps', 'Ethernet', 'Zona trabajo privada'] },
      { label: 'Climatización', items: ['A/C split', 'Ventilador de techo', 'Calefacción split', 'Calefactor portátil'] },
      { label: 'Seguridad', items: ['Detector de humo', 'Extintor', 'Botiquín'] },
      { label: 'Exterior y vistas', items: ['Terraza', 'Comedor exterior', 'Kit playa completo', 'Playa a pocos minutos a pie', 'A pasos del mar'] },
      { label: 'Acceso', items: ['Entrada privada', 'Ascensor', 'Gimnasio', 'Aparcamiento gratuito en calle', 'Aparcamiento pago en garaje', 'Dejar equipaje'] },
      { label: 'Servicios', items: ['Recepción personal Mar', 'Estancias largas'] },
    ],
    reviews: [
      { author: 'Mónica', location: 'Madrid', date: 'Junio 2025', rating: 5, text: 'Apartamento de lujo a precio razonable. La playa está literalmente a un minuto. El wifi es increíblemente rápido, ideal para trabajar.' },
      { author: 'James', location: 'Manchester', date: 'May 2025', rating: 5, text: 'Excellent location right by Fontanilla beach. Very well equipped kitchen. Mar was perfect – met us in person and gave us great local tips.' },
      { author: 'Lucía', location: 'Málaga', date: 'Abril 2025', rating: 4, text: 'Precioso apartamento muy bien equipado. La terraza exterior es genial para desayunar. Mar muy amable y atenta en todo momento.' },
      { author: 'Klaus', location: 'München', date: 'März 2025', rating: 5, text: 'Super Wohnung, sehr sauber und gut ausgestattet. Perfekte Lage direkt am Strand. Mar ist eine wunderbare Gastgeberin.' },
    ],
  },
  {
    slug: 'ami',
    title: 'AMI · Coqueto Ático · Ubicación inmejorable',
    subtitle: 'Casco Antiguo · Vistas a La Concha · Netflix incluido',
    rating: 4.99,
    reviewCount: 88,
    badge: 'Top 1% Airbnb',
    capacity: { persons: 2, bedrooms: 1, bed: '1 cama 1,80m', bathrooms: 1, extras: 'Vestidor con escritorio' },
    description: 'Ático en el corazón de Marbella, a pasos de la Plaza de los Naranjos. Vistas a La Concha. 5 minutos a pie a la playa. Orientación norte: fresco en verano y acogedor en invierno.',
    license: 'VFT/MA/47399',
    photoCount: 15,
    priceRange: [90, 170],
    topAmenities: [
      'Vistas a La Concha',
      'Netflix + Amazon Prime',
      'Zona trabajo con puerta',
      'Terraza privada',
      'Desayuno incluido',
      'A/C centralizado',
    ],
    amenityCategories: [
      { label: 'Baño', items: ['Secador', 'Champú Deliplus', 'Acondicionador', 'Gel', 'Ropa de cama algodón incluida'] },
      { label: 'Dormitorio', items: ['Armario y cómoda', 'Perchas', 'Almohadas extra', 'Persianas opacas', 'Caja fuerte'] },
      { label: 'Cocina', items: ['Cocina eléctrica', 'Horno Zanussi', 'Nevera Roma', 'Congelador', 'Lavavajillas', 'Microondas', 'Hervidor', 'Émbolo + Nespresso', 'Copas vino', 'Tostadora', 'Bandeja repostería', 'Batidora', 'Utensilios', 'Mesa comedor', 'Café'] },
      { label: 'Lavandería', items: ['Lavadora', 'Plancha', 'Tendedero'] },
      { label: 'Entretenimiento', items: ['TV 42" Netflix + Amazon Prime + cable', 'Sonido Bluetooth', 'Libros'] },
      { label: 'Trabajo y conectividad', items: ['Wifi', 'Ethernet', 'Zona trabajo con puerta'] },
      { label: 'Climatización', items: ['A/C centralizado', 'Calefacción'] },
      { label: 'Seguridad', items: ['Detector de humo', 'Extintor', 'Botiquín'] },
      { label: 'Exterior y vistas', items: ['Vistas a La Concha', 'Terraza privada', 'Comedor exterior', 'Kit playa completo', 'Playa a pocos minutos a pie', 'A pasos del mar'] },
      { label: 'Acceso', items: ['Entrada privada', 'Ascensor', 'Aparcamiento pago', 'Dejar equipaje'] },
      { label: 'Servicios', items: ['Recepción personal Mar', 'Desayuno incluido', 'Estancias largas', 'Limpieza (coste adicional)'] },
    ],
    reviews: [
      { author: 'Patricia', location: 'Bilbao', date: 'Mayo 2025', rating: 5, text: 'Ático espectacular en el centro histórico. Las vistas a La Concha son increíbles. El desayuno incluido es un detalle muy especial.' },
      { author: 'Emma', location: 'London', date: 'April 2025', rating: 5, text: 'Charming penthouse in the heart of the old town. Views are stunning. Loved the Netflix and the cozy terrace. Mar is brilliant.' },
      { author: 'François', location: 'Lyon', date: 'Mars 2025', rating: 5, text: 'Superbe appartement, très bien situé. La terrasse privée est magnifique. Mar nous a accueillis chaleureusement et était toujours disponible.' },
      { author: 'Rodrigo', location: 'Buenos Aires', date: 'Febrero 2025', rating: 5, text: 'Un ático único en Marbella. La ubicación en el casco antiguo es perfecta. Mar una anfitriona de lujo, con mil recomendaciones.' },
    ],
  },
  {
    slug: 'banesto',
    title: 'Banesto · Ático en La Alameda · Centro / Playa',
    subtitle: 'La Alameda · 200m playa La Venus · Baño en suite',
    rating: 4.97,
    reviewCount: 74,
    badge: 'Top 1% Airbnb',
    capacity: { persons: 2, bedrooms: 1, bed: '1 cama 1,80m', bathrooms: 1, extras: 'Baño en suite' },
    description: 'Ático recién renovado junto al Parque de la Alameda. A 200 metros de la playa de La Venus. Terraza con vistas al casco antiguo. Baño en suite renovado con escritorio con luz natural.',
    license: 'VUT/MA/48799',
    photoCount: 15,
    priceRange: [95, 180],
    topAmenities: [
      'Vistas al casco antiguo',
      'Wifi 552 Mbps',
      'Gran terraza (mesa 4 personas)',
      'A/C split',
      'Netflix',
      '200m de la playa La Venus',
    ],
    amenityCategories: [
      { label: 'Baño', items: ['Secador', 'Champú Deliplus', 'Acondicionador', 'Gel', 'Ropa de cama y toallas incluidas'] },
      { label: 'Dormitorio', items: ['Armario y cómoda', 'Perchas', 'Almohadas extra', 'Persianas opacas', 'Caja fuerte'] },
      { label: 'Cocina', items: ['Cocina eléctrica', 'Nevera Beko', 'Congelador', 'Lavavajillas', 'Microondas', 'Hervidor', 'Nespresso', 'Copas vino', 'Tostadora', 'Batidora', 'Utensilios', 'Mesa comedor', 'Café'] },
      { label: 'Lavandería', items: ['Lavadora', 'Secadora', 'Plancha', 'Tendedero'] },
      { label: 'Entretenimiento', items: ['TV 40" Netflix + cable', 'Libros'] },
      { label: 'Trabajo y conectividad', items: ['Wifi 552 Mbps', 'Ethernet', 'Zona trabajo con puerta'] },
      { label: 'Climatización', items: ['A/C split', 'Calefacción split'] },
      { label: 'Seguridad', items: ['Detector de humo', 'Extintor', 'Botiquín'] },
      { label: 'Exterior y vistas', items: ['Vistas al casco antiguo', 'Gran terraza (mesa 4 personas)', 'Kit playa completo', 'Playa a pocos minutos a pie', 'A pasos del mar'] },
      { label: 'Acceso', items: ['Entrada privada', 'Ascensor', 'Gimnasio', 'Aparcamiento pago', 'Dejar equipaje'] },
      { label: 'Servicios', items: ['Recepción personal Mar', 'Estancias largas'] },
    ],
    reviews: [
      { author: 'Jorge', location: 'Córdoba', date: 'Mayo 2025', rating: 5, text: 'Ático increíble con terraza enorme. Las vistas al casco antiguo son preciosas. A dos pasos de la playa La Venus. Mar excelente.' },
      { author: 'Sophie', location: 'Brussels', date: 'April 2025', rating: 5, text: 'Beautiful penthouse with a huge terrace. Very well located near the beach. Everything was spotless. Highly recommend!' },
      { author: 'Alessandro', location: 'Milano', date: 'Marzo 2025', rating: 5, text: 'Appartamento meraviglioso, terrazza stupenda con vista sul centro storico. Mar è una host fantastica, disponibile e gentile.' },
      { author: 'Carmen', location: 'Málaga', date: 'Febrero 2025', rating: 4, text: 'Ático muy bien equipado y renovado. El baño en suite es una maravilla. La terraza perfecta para tomar el sol. Mar, genial.' },
    ],
  },
];
