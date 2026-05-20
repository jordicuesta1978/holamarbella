-- ============================================================
-- HolaMarbella — Esquema de base de datos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ---- APARTMENTS ----
CREATE TABLE IF NOT EXISTS apartments (
  id               BIGSERIAL PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  subtitle         TEXT NOT NULL,
  rating           NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  review_count     INT NOT NULL DEFAULT 0,
  badge            TEXT,
  persons          INT NOT NULL,
  bedrooms         INT NOT NULL,
  bed              TEXT NOT NULL,
  bathrooms        INT NOT NULL,
  bed_extras       TEXT,
  description      TEXT NOT NULL,
  license          TEXT NOT NULL,
  photo_count      INT NOT NULL DEFAULT 0,
  price_min        INT NOT NULL,
  price_max        INT NOT NULL,
  top_amenities    TEXT[] NOT NULL DEFAULT '{}',
  amenity_categories JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- RESEÑAS ----
CREATE TABLE IF NOT EXISTS resenas (
  id               BIGSERIAL PRIMARY KEY,
  apartment_slug   TEXT NOT NULL REFERENCES apartments(slug) ON DELETE CASCADE,
  author           TEXT NOT NULL,
  location         TEXT NOT NULL,
  date             TEXT NOT NULL,
  rating           NUMERIC(3,2) NOT NULL,
  text             TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- RESERVAS ----
CREATE TABLE IF NOT EXISTS reservas (
  id               BIGSERIAL PRIMARY KEY,
  apartment_slug   TEXT NOT NULL REFERENCES apartments(slug) ON DELETE RESTRICT,
  guest_name       TEXT NOT NULL,
  guest_email      TEXT NOT NULL,
  guest_phone      TEXT,
  check_in         DATE NOT NULL,
  check_out        DATE NOT NULL,
  guests           INT NOT NULL DEFAULT 1,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled')),
  notes            TEXT,
  total_price      INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- ---- MENSAJES ----
CREATE TABLE IF NOT EXISTS mensajes (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  apartment_slug   TEXT REFERENCES apartments(slug) ON DELETE SET NULL,
  subject          TEXT,
  message          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','read','replied')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE apartments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes           ENABLE ROW LEVEL SECURITY;

-- Apartments y reseñas: lectura pública, sin escritura desde cliente
CREATE POLICY "apartments_public_read"  ON apartments  FOR SELECT USING (true);
CREATE POLICY "resenas_public_read"     ON resenas      FOR SELECT USING (true);

-- Reservas: cualquiera puede insertar, nadie puede leer las de otros
CREATE POLICY "reservas_insert"         ON reservas     FOR INSERT WITH CHECK (true);

-- Mensajes: cualquiera puede insertar, nadie puede leer
CREATE POLICY "mensajes_insert"         ON mensajes     FOR INSERT WITH CHECK (true);

-- ============================================================
-- SEED — datos iniciales desde lib/apartments.ts
-- ============================================================
INSERT INTO apartments (slug, title, subtitle, rating, review_count, badge, persons, bedrooms, bed, bathrooms, bed_extras, description, license, photo_count, price_min, price_max, top_amenities, amenity_categories)
VALUES
  (
    'paloma',
    'Hola MarBella Centro/Playa · Vistas espectaculares',
    'Centro · Playa · Vistas espectaculares',
    5.0, 42, 'Top 1% Airbnb',
    2, 1, '1 cama king 1,80m', 1, NULL,
    'Apartamento moderno, luminoso y recién renovado en el centro de Marbella. Orientación oeste con vistas a La Concha. Todo a pie: tapas, chiringuitos, supermercados. Parking cercano 10€/día o 50€/semana.',
    'VFT/MA/597131', 19, 80, 150,
    ARRAY['Vistas a La Concha','Wifi 347 Mbps','Cocina inducción Teka','A/C centralizado','Piscina (jun-sept)','Kit playa completo'],
    '[{"label":"Baño","items":["Secador","Champú","Acondicionador","Gel","Ropa de cama y toallas incluidas"]},{"label":"Dormitorio","items":["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"]},{"label":"Cocina","items":["Cocina inducción Teka","Nevera","Congelador","Lavavajillas","Microondas","Horno","Hervidor","Nespresso + émbolo","Copas vino","Tostadora","Batidora","Arrocera","Utensilios","Mesa comedor","Café"]},{"label":"Lavandería","items":["Lavadora","Secadora","Plancha","Tendedero"]},{"label":"Entretenimiento","items":["TV 50\" HD","Sonido Bluetooth","Libros"]},{"label":"Trabajo y conectividad","items":["Wifi 347 Mbps","Zona trabajo"]},{"label":"Climatización","items":["A/C centralizado","Calefacción"]},{"label":"Seguridad","items":["Detector de humo","Botiquín"]},{"label":"Exterior y vistas","items":["Vistas a La Concha","Terraza","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"]},{"label":"Acceso","items":["Entrada privada","Ascensor","Gimnasio","Piscina (jun-sept)","Aparcamiento pago","Dejar equipaje"]},{"label":"Servicios","items":["Recepción personal Mar","Estancias largas","Limpieza durante estancia"]}]'
  ),
  (
    'micu',
    'Hola MarBella · Casco Antiguo y playa a 5 minutos',
    'Casco Antiguo · Playa · Vistas al mar',
    5.0, 19, NULL,
    2, 1, '1 cama doble 1,60m', 1, NULL,
    'Moderno y luminoso con orientación sur y vistas al mar. Perfecto para disfrutar del Casco Antiguo y la playa sin coche. Todo a tu alcance: tapas, chiringuitos, mercado central.',
    'VFT/MA/597131', 15, 75, 140,
    ARRAY['Vistas al mar','Wifi','Cocina inducción','A/C centralizado','Terraza con comedor exterior','Piscina (jun-sept)'],
    '[{"label":"Baño","items":["Secador","Champú Deliplus","Acondicionador","Gel","Ropa de cama y toallas incluidas"]},{"label":"Dormitorio","items":["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"]},{"label":"Cocina","items":["Cocina inducción","Nevera Beko","Congelador","Lavavajillas","Microondas","Hervidor","Nespresso + filtro","Copas vino","Tostadora","Utensilios","Mesa comedor","Café"]},{"label":"Lavandería","items":["Lavadora","Secadora","Plancha","Tendedero"]},{"label":"Entretenimiento","items":["TV 50\" HD","Sonido Bluetooth Alehop","Libros"]},{"label":"Trabajo y conectividad","items":["Wifi","Ethernet","Zona trabajo ergonómica"]},{"label":"Climatización","items":["A/C centralizado","Calefacción"]},{"label":"Seguridad","items":["Detector de humo","Extintor","Botiquín"]},{"label":"Exterior y vistas","items":["Vistas al mar","Vistas urbanas","Terraza","Comedor exterior","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"]},{"label":"Acceso","items":["Entrada privada","Ascensor","Gimnasio","Piscina (jun-sept)","Dejar equipaje"]},{"label":"Servicios","items":["Recepción personal Mar","Estancias largas"]}]'
  ),
  (
    'larysol',
    'Hola MarBella · Playa de la Fontanilla / Centro',
    'Fontanilla · 1 min a la playa · Wifi 607 Mbps',
    4.99, 80, 'Top 5% Airbnb',
    2, 1, '1 cama king 1,80m', 1, NULL,
    'Elegante y totalmente equipado. A 1 minuto de la Playa de la Fontanilla, 10 min del Casco Antiguo y 5 min del Puerto Deportivo. Todo a tu alcance.',
    'VUT/MA/38069', 15, 85, 160,
    ARRAY['Wifi 607 Mbps','1 min a la Playa Fontanilla','Cocina eléctrica Balay + horno','A/C split + ventilador techo','Aparcamiento gratuito en calle','Terraza con comedor exterior'],
    '[{"label":"Baño","items":["Secador","Champú","Acondicionador Deliplus","Gel","Ropa de cama algodón incluida"]},{"label":"Dormitorio","items":["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"]},{"label":"Cocina","items":["Cocina eléctrica","Horno Fagor","Nevera","Congelador","Lavavajillas","Microondas","Hervidor","Expreso + Keurig + Nespresso","Copas vino","Tostadora","Bandeja repostería","Batidora","Utensilios","Mesa comedor","Café"]},{"label":"Lavandería","items":["Lavadora","Secadora","Plancha","Tendedero"]},{"label":"Entretenimiento","items":["TV 50\" HD","Sonido Bluetooth","Libros"]},{"label":"Trabajo y conectividad","items":["Wifi 607 Mbps","Ethernet","Zona trabajo privada"]},{"label":"Climatización","items":["A/C split","Ventilador de techo","Calefacción split","Calefactor portátil"]},{"label":"Seguridad","items":["Detector de humo","Extintor","Botiquín"]},{"label":"Exterior y vistas","items":["Terraza","Comedor exterior","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"]},{"label":"Acceso","items":["Entrada privada","Ascensor","Gimnasio","Aparcamiento gratuito en calle","Aparcamiento pago en garaje","Dejar equipaje"]},{"label":"Servicios","items":["Recepción personal Mar","Estancias largas"]}]'
  ),
  (
    'ami',
    'Hola MarBella · Coqueto Ático · Ubicación inmejorable',
    'Casco Antiguo · Vistas a La Concha · Netflix incluido',
    4.99, 88, 'Top 1% Airbnb',
    2, 1, '1 cama 1,80m', 1, 'Vestidor con escritorio',
    'Ático en el corazón de Marbella, a pasos de la Plaza de los Naranjos. Vistas a La Concha. 5 minutos a pie a la playa. Orientación norte: fresco en verano y acogedor en invierno.',
    'VFT/MA/47399', 15, 90, 170,
    ARRAY['Vistas a La Concha','Netflix + Amazon Prime','Zona trabajo con puerta','Terraza privada','Desayuno incluido','A/C centralizado'],
    '[{"label":"Baño","items":["Secador","Champú Deliplus","Acondicionador","Gel","Ropa de cama algodón incluida"]},{"label":"Dormitorio","items":["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"]},{"label":"Cocina","items":["Cocina eléctrica","Horno Zanussi","Nevera Roma","Congelador","Lavavajillas","Microondas","Hervidor","Émbolo + Nespresso","Copas vino","Tostadora","Bandeja repostería","Batidora","Utensilios","Mesa comedor","Café"]},{"label":"Lavandería","items":["Lavadora","Plancha","Tendedero"]},{"label":"Entretenimiento","items":["TV 42\" Netflix + Amazon Prime + cable","Sonido Bluetooth","Libros"]},{"label":"Trabajo y conectividad","items":["Wifi","Ethernet","Zona trabajo con puerta"]},{"label":"Climatización","items":["A/C centralizado","Calefacción"]},{"label":"Seguridad","items":["Detector de humo","Extintor","Botiquín"]},{"label":"Exterior y vistas","items":["Vistas a La Concha","Terraza privada","Comedor exterior","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"]},{"label":"Acceso","items":["Entrada privada","Ascensor","Aparcamiento pago","Dejar equipaje"]},{"label":"Servicios","items":["Recepción personal Mar","Desayuno incluido","Estancias largas","Limpieza (coste adicional)"]}]'
  ),
  (
    'banesto',
    'Hola MarBella · Ático en La Alameda · Centro / Playa',
    'La Alameda · 200m playa La Venus · Baño en suite',
    4.97, 74, 'Top 1% Airbnb',
    2, 1, '1 cama 1,80m', 1, 'Baño en suite',
    'Ático recién renovado junto al Parque de la Alameda. A 200 metros de la playa de La Venus. Terraza con vistas al casco antiguo. Baño en suite renovado con escritorio con luz natural.',
    'VUT/MA/48799', 15, 95, 180,
    ARRAY['Vistas al casco antiguo','Wifi 552 Mbps','Gran terraza (mesa 4 personas)','A/C split','Netflix','200m de la playa La Venus'],
    '[{"label":"Baño","items":["Secador","Champú Deliplus","Acondicionador","Gel","Ropa de cama y toallas incluidas"]},{"label":"Dormitorio","items":["Armario y cómoda","Perchas","Almohadas extra","Persianas opacas","Caja fuerte"]},{"label":"Cocina","items":["Cocina eléctrica","Nevera Beko","Congelador","Lavavajillas","Microondas","Hervidor","Nespresso","Copas vino","Tostadora","Batidora","Utensilios","Mesa comedor","Café"]},{"label":"Lavandería","items":["Lavadora","Secadora","Plancha","Tendedero"]},{"label":"Entretenimiento","items":["TV 40\" Netflix + cable","Libros"]},{"label":"Trabajo y conectividad","items":["Wifi 552 Mbps","Ethernet","Zona trabajo con puerta"]},{"label":"Climatización","items":["A/C split","Calefacción split"]},{"label":"Seguridad","items":["Detector de humo","Extintor","Botiquín"]},{"label":"Exterior y vistas","items":["Vistas al casco antiguo","Gran terraza (mesa 4 personas)","Kit playa completo","Playa a pocos minutos a pie","A pasos del mar"]},{"label":"Acceso","items":["Entrada privada","Ascensor","Gimnasio","Aparcamiento pago","Dejar equipaje"]},{"label":"Servicios","items":["Recepción personal Mar","Estancias largas"]}]'
  )
ON CONFLICT (slug) DO NOTHING;

-- ---- Reseñas ----
INSERT INTO resenas (apartment_slug, author, location, date, rating, text) VALUES
  ('paloma', 'Carlos',  'Madrid',    'Abril 2025',   5, 'Mar fue una anfitriona excepcional. El apartamento estaba impecable y la ubicación no podría ser mejor para descubrir Marbella.'),
  ('paloma', 'Sarah',   'London',    'March 2025',   5, 'Mar was an amazing host. The apartment was spotless and the location couldn''t be better. Perfect for a long stay.'),
  ('paloma', 'Laura',   'Barcelona', 'Febrero 2025', 5, 'Todo perfecto desde el primer mensaje. Mar nos recibió en persona y el apartamento superó todas nuestras expectativas.'),
  ('paloma', 'Thomas',  'Paris',     'Janvier 2025', 5, 'Vue magnifique sur La Concha. Appartement très propre et bien équipé. Mar est une hôte fantastique, disponible et attentionnée.'),
  ('micu',   'Isabel',  'Sevilla',   'Mayo 2025',    5, 'Apartamento precioso con vistas increíbles al mar. La ubicación en el casco antiguo es perfecta, a todo a pie. Mar, atentísima.'),
  ('micu',   'Mark',    'Amsterdam', 'April 2025',   5, 'Great apartment with sea views. Very clean and modern. Mar was super helpful and welcoming. Will definitely come back!'),
  ('micu',   'Ana',     'Valencia',  'Marzo 2025',   5, 'Todo impecable. El apartamento es exactamente como en las fotos, incluso mejor. La terraza es una maravilla para cenar.'),
  ('larysol','Mónica',  'Madrid',    'Junio 2025',   5, 'Apartamento de lujo a precio razonable. La playa está literalmente a un minuto. El wifi es increíblemente rápido, ideal para trabajar.'),
  ('larysol','James',   'Manchester','May 2025',     5, 'Excellent location right by Fontanilla beach. Very well equipped kitchen. Mar was perfect – met us in person and gave us great local tips.'),
  ('larysol','Lucía',   'Málaga',    'Abril 2025',   4, 'Precioso apartamento muy bien equipado. La terraza exterior es genial para desayunar. Mar muy amable y atenta en todo momento.'),
  ('larysol','Klaus',   'München',   'März 2025',    5, 'Super Wohnung, sehr sauber und gut ausgestattet. Perfekte Lage direkt am Strand. Mar ist eine wunderbare Gastgeberin.'),
  ('ami',    'Patricia','Bilbao',    'Mayo 2025',    5, 'Ático espectacular en el centro histórico. Las vistas a La Concha son increíbles. El desayuno incluido es un detalle muy especial.'),
  ('ami',    'Emma',    'London',    'April 2025',   5, 'Charming penthouse in the heart of the old town. Views are stunning. Loved the Netflix and the cozy terrace. Mar is brilliant.'),
  ('ami',    'François','Lyon',      'Mars 2025',    5, 'Superbe appartement, très bien situé. La terrasse privée est magnifique. Mar nous a accueillis chaleureusement et était toujours disponible.'),
  ('ami',    'Rodrigo', 'Buenos Aires','Febrero 2025',5,'Un ático único en Marbella. La ubicación en el casco antiguo es perfecta. Mar una anfitriona de lujo, con mil recomendaciones.'),
  ('banesto','Jorge',   'Córdoba',   'Mayo 2025',    5, 'Ático increíble con terraza enorme. Las vistas al casco antiguo son preciosas. A dos pasos de la playa La Venus. Mar excelente.'),
  ('banesto','Sophie',  'Brussels',  'April 2025',   5, 'Beautiful penthouse with a huge terrace. Very well located near the beach. Everything was spotless. Highly recommend!'),
  ('banesto','Alessandro','Milano',  'Marzo 2025',   5, 'Appartamento meraviglioso, terrazza stupenda con vista sul centro storico. Mar è una host fantastica, disponibile e gentile.'),
  ('banesto','Carmen',  'Málaga',    'Febrero 2025', 4, 'Ático muy bien equipado y renovado. El baño en suite es una maravilla. La terraza perfecta para tomar el sol. Mar, genial.')
ON CONFLICT DO NOTHING;
