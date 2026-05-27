# PENDIENTE — HolaMarbella

> Instrucciones: cuando el usuario diga "ejecuta el pendiente", leer este archivo, ejecutar todas las tareas `[ ]`, marcar como `[x]` las completadas o `[!]` las fallidas, desplegar y correr `node scripts/verificar.mjs`.

---

## PENDIENTE — próximas tareas

### Gestor de Contenido
- [ ] **Amenidades por categorías** — editor interactivo por categoría en admin (AmenidadesEditor.tsx)
- [ ] **Calendario rediseño Airbnb** — sidebar apartamento + meses verticales + datos por día

### Verificación
- [ ] **Correr `node scripts/verificar.mjs`** y adjuntar informe completo

---

## COMPLETADO — batch 2026-05-27

- [x] **app/page.tsx** → server component que llama `getApartments()` y pasa a HomeClient
- [x] **components/HomeClient.tsx** → nuevo client component (carrusel, reviews, flex pills, DB apartments)
- [x] **Migración nombres Supabase** → `node scripts/migrate-apt-names.mjs` ejecutado: 5/5 OK
- [x] **Sistema de nombres completo** → title="Apartamento Paloma" etc. en toda la UI
- [x] **key_features computado** → `computeKeyFeatures()` en lib/apartments.ts, usado en lib/db.ts
- [x] **UI cards /apartamentos** → H3 bold verde + apt.title + apt.subtitle + apt.key_features
- [x] **UI header detalle** → subtitle arriba, H1 verde, key_features debajo
- [x] **UI panel reserva** → apt.title bold + apt.subtitle
- [x] **UI confirmacion** → apt.title directamente (sin split/prefix)
- [x] **app/conversacion/[token]/page.tsx** → nombre completo vía APT_NAMES
- [x] **app/admin/contenido/apartamentos** → header sin "Apartamento" redundante, label "NOMBRE" actualizado
- [x] **app/admin/reservas/page.tsx** → booking_ref desde DB + fallback con check_in
- [x] **app/admin/reservas/[id]/page.tsx** → APT_NAMES con nombres completos
- [x] **app/admin/pagos/page.tsx** → booking_ref desde DB + fallback con check_in
- [x] **app/api/pagar/[token]/route.ts** → APT_NAMES con nombres completos
- [x] **app/actions/reservar.ts** → APT_NAMES_FALLBACK + displayTitle desde input
- [x] **app/actions/mensajes.ts** → eliminar label "Importe total" del email de pago
- [x] **scripts/verificar.mjs** → checks H3 verde para nombres en cards (h2→h3)
- [x] **scripts/migrate-apt-names.mjs** → creado y ejecutado

---

## COMPLETADO — batch 2026-05-26

- [x] **Botón "Pagar ahora" da 404** — solicitarPago ahora actualiza total_price en reservas
- [x] **Checkbox "Apartamento activo" no funciona** — getApartments() filtra con .neq('active', false)
- [x] **Eliminar pestaña "Configuración"** — eliminada del menú lateral
- [x] **Renombrar "Título" → "Nombre corto"** + textos de ayuda por campo
- [x] **Gestión de fotos en apartamentos** — galería Supabase Storage, eliminar, marcar principal
- [x] **Subida de imágenes en Blog** — ImageUploader en bucket blog
- [x] **Calendario de disponibilidad** — precios/noche (verde claro), reservas (verde intenso + nombre), bloqueos (gris)
- [x] **Eliminar "Anfitriona: Mar / Airbnb Superhost..."** — eliminado de ApartamentoDetail
- [x] **Flexibilidad de fechas — rediseño Booking.com** — pills independientes por llegada (flexIn) y salida (flexOut)
- [x] **Email solicitud recibida (guest)**: sin botón "Ver mi reserva"
- [x] **Email alerta al gestor**: fila precio estimado + botón "Ver reserva en admin →"

---

## COMPLETADO (batch 2026-05-25)

- [x] Formulario /reservar bloqueado — try-catch fix
- [x] crearReserva usa supabaseAdmin
- [x] Bloqueos guardados en Supabase
- [x] Rediseño completo gestor de contenido (calendarios, CRUD)
- [x] Flex pills buscador home
- [x] Emails admin + guest mejorados
- [x] Migraciones v2 (cleaning_fee, active, sort_order, imagen_url)
- [x] /informacion page creada
- [x] 500 en /apartamentos con fechas corregido
- [x] .catch() chains eliminados

---

## NOTAS TÉCNICAS

- Playwright: `node scripts/verificar.mjs`
- Storage buckets necesarios: `apartamentos` (público), `blog` (público)
- Migración v2 ejecutada 2026-05-25
- Migración nombres ejecutada 2026-05-27 (5/5 OK)
- API Upload: `POST /api/upload` (FormData: file, bucket, path) → `{ url, path }`
- Flex dates: home pasa `flexIn` y `flexOut`; /apartamentos acepta ambos + legacy `flex`
- key_features: campo computado desde capacity (no columna nueva en DB)
- booking_ref: siempre leer de DB (`r.booking_ref`), fallback `getBookingRef(id, slug, check_in)`
