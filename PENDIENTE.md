# PENDIENTE — HolaMarbella

> Instrucciones: cuando el usuario diga "ejecuta el pendiente", leer este archivo, ejecutar todas las tareas `[ ]`, marcar como `[x]` las completadas o `[!]` las fallidas, desplegar y correr `node scripts/verificar.mjs`.

---

## EN PROGRESO — batch 2026-05-26 (sesión actual)

### Bugs críticos
- [ ] **Botón "Pagar ahora" da 404** — revisar y asegurar ruta /api/pagar/[token], APT_NAMES actualizados
- [ ] **Booking ref inconsistente** — admin lista debe leer booking_ref de Supabase, no calculado
- [ ] **Checkbox "Apartamento activo"** — home page usa datos estáticos hardcodeados, refactorizar a server component
- [ ] **"Importe total" en email solicitud de pago** — eliminar línea del email

### Sistema de nombres
- [ ] **key_features computado** — añadir a Apartment type, computar desde capacity
- [ ] **Migración datos Supabase** — actualizar title/subtitle/bed en apartments vía scripts/migrate-apt-names.mjs
- [ ] **UI cards (home, /apartamentos)** — H3 bold verde + subtitle gris
- [ ] **UI header detalle** — subtitle encima, H1 verde, key_features debajo
- [ ] **UI panel reserva** — name bold negro + subtitle gris
- [ ] **UI confirmacion, emails, admin** — usar apt.title directamente

### Gestor de Contenido
- [ ] **Form apartamento** — NOMBRE, SUBTÍTULO, KEY FEATURES, DESCRIPCIÓN con ayudas
- [ ] **Amenidades por categorías** — editor interactivo por categoría en admin
- [ ] **Mover limpieza a Precios** — eliminar sección de Configuración o moverla
- [ ] **Calendario rediseño Airbnb** — sidebar apartamento + meses verticales + datos por día

### Emails
- [ ] **Email guest solicitud** — ya sin botón "Ver mi reserva" (hecho batch anterior)
- [ ] **Email solicitud pago** — eliminar "Importe total" label

### Verificación
- [ ] **verificar.mjs** — añadir checks: active, booking_ref, /api/pagar, nombre H3 verde

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
- API Upload: `POST /api/upload` (FormData: file, bucket, path) → `{ url, path }`
- Flex dates: home pasa `flexIn` y `flexOut`; /apartamentos acepta ambos + legacy `flex`
- Migración nombres: `node scripts/migrate-apt-names.mjs` (actualiza title/subtitle/bed en Supabase)
- key_features: campo computado desde capacity (no columna nueva en DB)
