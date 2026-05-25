# PENDIENTE — HolaMarbella

> Instrucciones: cuando el usuario diga "ejecuta el pendiente", leer este archivo, ejecutar todas las tareas `[ ]`, marcar como `[x]` las completadas o `[!]` las fallidas, desplegar y correr `node scripts/verificar.mjs`.

---

## PRIORIDAD MÁXIMA — bugs críticos (batch 2026-05-25)

- [x] **Formulario /reservar bloqueado** — sin try-catch en handleSubmit → al fallar cualquier Server Action el botón queda en "Enviando..." para siempre *(fix: 2026-05-25)*
- [x] **crearReserva usa anon key** → puede fallar por RLS; cambiado a supabaseAdmin *(fix: 2026-05-25)*
- [x] **Bloqueos no se guardan** — tabla bloqueos no existía; migración ejecutada *(fix: 2026-05-25)*

---

## PRIORIDAD ALTA — bugs anteriores

- [x] **Ver mi reserva** en /confirmacion → `/conversacion/[token]` con token correcto *(fix: 2026-05-24)*
- [x] **Pagar ahora** en email de solicitud de pago → Stripe checkout directo vía `/api/pagar/[token]` *(fix: 2026-05-24)*
- [x] **MAR_EMAIL** actualizado a `jordicuesta@gmail.com` en `.env.local` *(fix: 2026-05-24)* — **⚠️ Acción manual: actualizar también en Vercel Dashboard**
- [x] **Hash #id eliminado** del detalle de reserva en admin *(fix: 2026-05-24)*
- [x] **Booking ref consistente** — admin usa `reserva.booking_ref` (DB) *(fix: 2026-05-24)*
- [x] **Botón "Ver mi reserva" eliminado** del email de solicitud recibida (guest) *(fix: 2026-05-25)*
- [x] **Email admin nueva solicitud** — botón "Ver reserva en admin" + fila duración/precio *(fix: 2026-05-25)*
- [x] **Fix ruta /api/pagar/[token]** — `dynamic = force-dynamic` *(fix: 2026-05-25)*

---

## REDISEÑO GESTOR DE CONTENIDO (batch 2026-05-25)

- [x] **Apartamentos — CRUD completo** — todos los campos: título, subtítulo, descripción, capacidad, licencia, precio base, tarifa limpieza, activo/inactivo *(fix: 2026-05-25)*
- [x] **Disponibilidad — calendario visual** — mes con días coloreados (bloqueado/libre), form para bloquear rango *(fix: 2026-05-25)*
- [x] **Precios — calendario visual** — mes con precios por día marcados en color *(fix: 2026-05-25)*
- [x] **Reseñas — ordenación** — botones ↑↓ para reordenar, sort_order en Supabase *(fix: 2026-05-25)*
- [x] **Blog — imagen destacada** — campo imagen_url en formulario *(fix: 2026-05-25)*
- [ ] **Apartamentos — galería de fotos** — subir fotos a Supabase Storage, reordenar, marcar principal *(pendiente: requiere bucket Storage)*
- [ ] **Blog — editor enriquecido** — negrita, cursiva, listas *(pendiente: requiere biblioteca)*
- [x] **Migraciones v2** — cleaning_fee + active en apartments, sort_order en resenas, imagen_url en articulos *(script: scripts/migrate_v2.mjs)*

---

## BUSCADOR — mejoras (batch 2026-05-25)

- [x] **Flex pills en buscador home** — "Fecha exacta / ±1 / ±2 / ±3 / ±7 días" en lugar de select *(fix: 2026-05-25)*
- [ ] **Flex pills Booking.com — calendario con overlay** — al hacer clic en fecha abre calendario con pills independientes por llegada/salida *(pendiente: requiere componente calendario custom)*
- [x] **Fechas flexibles ±1, ±2, ±3 días** — ya implementado en buscador *(fix: 2026-05-25)*

---

## EMAILS (batch 2026-05-25)

- [x] **Email admin nueva solicitud** — botón "Ver reserva en admin" + precio estimado *(fix: 2026-05-25)*
- [x] **Botón "Ver mi reserva" eliminado** del email al huésped *(fix: 2026-05-25)*

---

## VERIFICACIÓN AUTOMÁTICA (batch 2026-05-25)

- [x] **verificar.mjs — check /informacion** *(fix: 2026-05-25)*
- [x] **verificar.mjs — check /apartamentos con fechas** *(fix: 2026-05-25)*
- [x] **verificar.mjs — simular envío en /reservar/micu** *(fix: 2026-05-25)*
- [x] **verificar.mjs — allowHttpErrors fix** *(fix: 2026-05-25)*

---

## GESTOR DE CONTENIDO — inicial (ya completado)

- [x] **Configuración general** — tarifa de limpieza *(fix: 2026-05-25)*
- [x] **Disponibilidad** — bloquear fechas *(fix: 2026-05-25)*
- [x] **Precios** — tarifas por rango *(fix: 2026-05-25)*
- [x] **Apartamentos** — editar título/subtítulo/descripción *(fix: 2026-05-25)*
- [x] **Blog** — artículos *(fix: 2026-05-25)*
- [x] **Reseñas** — CRUD *(fix: 2026-05-25)*
- [x] **Enlace "Contenido"** en nav admin *(fix: 2026-05-25)*

---

## NOTAS TÉCNICAS

- Playwright instalado: `@playwright/test` + chromium
- Verificación automática: `node scripts/verificar.mjs`
- Screenshots en: `scripts/screenshots/`
- Para verificar local: `node scripts/verificar.mjs --base http://localhost:3000`
- Último informe: **31 OK · 0 fallos** *(2026-05-25)*
- Migraciones v1: `scripts/migrate_contenido.mjs` — **ya ejecutado**
- Migraciones v2: `scripts/migrate_v2.mjs` — ejecutar con `node scripts/migrate_v2.mjs TU_PAT`
