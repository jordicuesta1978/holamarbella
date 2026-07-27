# PENDIENTE — HolaMarbella

> Instrucciones: cuando el usuario diga "ejecuta el pendiente", leer este archivo, ejecutar todas las tareas `[ ]`, marcar como `[x]` las completadas o `[!]` las fallidas, desplegar y correr `node scripts/verificar.mjs`.

---

## PENDIENTE — próximas tareas

### Ajustes previos a lanzar en real

#### Listado /apartamentos
- [ ] **Quitar "Desde X€ /noche" de las tarjetas** — da una información engañosa (el precio real varía mucho por fechas/temporada). No queremos mostrar precios en el listado. `app/[locale]/apartamentos/page.tsx:137-144`

#### Admin — ficha de reserva individual (`PricingPanel.tsx`)
- [ ] **"Precio por noche" no editable de verdad cuando hay un rango de precio configurado que cubre esas fechas** — confirmado con datos reales: para una reserva sin rango de precio aplicable (p. ej. Micu 10-23 ago 2026, sin rango en `precios` para esas fechas), el input "Precio por noche" sí funciona y controla el total. Pero cuando las fechas SÍ coinciden con un único rango configurado (`rangeBase > 0`, un solo tramo), `base` usa siempre `rangeBase` e ignora lo que el admin escriba en el input — el campo aparenta ser editable pero no tiene efecto real. Se pidió explícitamente que el precio por noche y los gastos de limpieza (las líneas originales de la solicitud) sean editables siempre — hay que hacer que la edición manual tenga prioridad sobre el rango, igual que ya hicimos con los tramos múltiples en el batch anterior.
- [ ] **Nota — NO es bug**: el aparente desajuste de "Pendiente" (200€ pagados a cuenta pero seguía saliendo el total pendiente) se debió a que el admin escribió 200 en "Pagado a cuenta" pero no pulsó "Guardar precio" antes de la captura — comprobado en Supabase: `deposit_paid` seguía en 0 en la reserva real. El fix del batch anterior (resumen "Pagos" usando `deposit_paid`) funciona correctamente.
- [ ] **Riesgo de flujo real detectado**: "Guardar precio" y "Aprobar reserva" son dos botones independientes en la misma página. Si el admin escribe el anticipo en "Pagado a cuenta" pero aprueba la reserva sin pulsar antes "Guardar precio", el anticipo se pierde silenciosamente (exactamente lo que pasó en la reserva de prueba 20260810MIC01: aparece "confirmada" pero `deposit_paid=0` en DB, y por eso el email de confirmación no muestra el anticipo pagado — comprobado, es el mismo caso de la nota anterior, no un bug del email). Falta decidir la solución: ¿guardar automáticamente el precio al aprobar, o avisar/bloquear si hay cambios sin guardar?

### Nueva funcionalidad — descuentos automáticos por volumen de noches
- [ ] **Reglas de descuento por apartamento + rango de fechas + noches mínimas** — nueva configuración en el admin (similar a los rangos de precio por noche que ya existen). Cada regla: apartamento, rango de fechas (fecha_inicio/fecha_fin), noches mínimas, % de descuento. Se aplica sobre el subtotal de alojamiento (noches × precio), NO sobre gastos de limpieza ni extras.
  - Si hay varias reglas que coinciden (misma fecha, distintos umbrales de noches), se aplica la de mayor descuento entre las que se cumplan — así se pueden montar escalones (7+ noches=10%, 14+ noches=15%) con varias reglas simples en vez de una tabla de tramos en un único formulario.
  - De cara al huésped, el descuento debe salir como línea aparte en el desglose de precio: "Descuento estancia larga (-X%): -Y€", igual de visible que el resto de conceptos — no simplemente bajar el precio/noche sin indicarlo.
  - Debe aplicarse en 3 sitios de forma consistente: (1) cálculo del precio estimado que ve el huésped al solicitar (`calcTotalWithRanges` en `app/actions/reservar.ts`), (2) recálculo en el admin al revisar/ajustar el presupuesto (`PricingPanel.tsx`), (3) desglose en los emails (presupuesto y confirmación, vía `lib/pricing.ts`).
  - Pendiente de decidir en implementación: si el rango de fechas de la regla debe cubrir el check-in, o las noches completas de la estancia (para evitar ambigüedad si una estancia cruza dos rangos con reglas distintas).
  - Requiere migración nueva (tabla de reglas, ej. `descuentos_volumen`) + UI de gestión en el admin por apartamento.

### Gestor de Contenido
- [ ] **Amenidades por categorías** — editor interactivo por categoría en admin (AmenidadesEditor.tsx)
- [ ] **Calendario rediseño Airbnb** — sidebar apartamento + meses verticales + datos por día

### Verificación
- [x] **Corrido `node scripts/verificar.mjs`** — 73 OK / 1 fallo (`scripts/informe_2026-07-17T18-59-43.txt`). El único fallo ("Sin badges TOP AIRBNB" en `/es/apartamentos`) es preexistente y no relacionado con el flujo de reserva — no se tocó nada de badges en este batch. FLOW 1 (reserva completa end-to-end) pasó con la migración de `locale` ya aplicada.

---

## COMPLETADO — batch 2026-07-17 (flujo de reserva completo, revisión end-to-end)

- [x] **Fuente del código de Referencia** — quitado `font-family:monospace` en `app/actions/reservar.ts` (afectaba email huésped y email a Mar, misma función `row()`)
- [x] **Desglose de precio en email a Mar** — sustituida la línea inline "955€ (120€×3 + ...)" por la misma tabla `buildPriceRows()` del email del huésped
- [x] **Helper compartido de desglose por tramos** — `lib/pricing.ts` (`computeNightlyBreakdown` + `renderPricingTable`), recalcula los tramos de precio/noche desde `precios` para reutilizar en presupuesto y confirmación
- [x] **Email de presupuesto** (`app/actions/presupuesto.ts`) — el texto libre del admin ahora sustituye la plantilla genérica arriba; desglose completo por tramos; "Precio base" → "Alojamiento"; quitada la frase "Puedes hacer el ingreso del anticipo a través de:"
- [x] **Email "Reserva confirmada"** (`app/actions/admin.ts`) — mismo desglose por tramos + "Alojamiento"; añadidas líneas "Anticipo pagado" / "Pendiente" cuando hay `deposit_paid`
- [x] **PricingPanel — mensaje "Presupuesto enviado"** — quitada la frase "En cuanto Mar registre el pago del anticipo, podrá aprobar la reserva."
- [x] **PricingPanel — líneas del desglose editables/eliminables** — el bloque "Precio por tramos" ahora tiene un input de importe y botón de borrar por tramo, igual que los Extras
- [x] **Dashboard/lista de reservas no se refrescaban al instante** — añadido `revalidatePath('/admin')` + `revalidatePath('/admin/reservas')` en `updateReservaStatus` y `savePricing`
- [x] **Botón "Reabrir reserva"** — nueva acción `reopenReserva()` + componente `ReopenReservaButton.tsx`, sustituye el texto estático "Esta reserva ya fue procesada" en confirmadas/canceladas, vuelve a estado `pending` para poder editarla
- [x] **Localización de emails al huésped (ES/EN)** — nueva columna `locale` en `reservas` (ver migración pendiente arriba), capturada con `useLocale()` en `ReservarContent.tsx`; traducidos "Solicitud recibida", "Solicitud de pago", presupuesto y "Reserva confirmada"/cancelación (`lib/email-i18n.ts`). El email a Mar (admin-facing) se mantiene solo en español a propósito.
- [x] **Nota sobre remitente `onboarding@resend.dev`** — el código ya soporta `RESEND_FROM` como variable de entorno en los 4 archivos de email; falta verificar un dominio propio en Resend y setear la variable (acción externa, no de código)
- [x] **Build/typecheck/lint verificados** tras todos los cambios (`tsc --noEmit` limpio, sin errores nuevos de eslint)

---

## COMPLETADO — batch 2026-07-17 (eliminación de Stripe)

- [x] **Decisión de producto**: no se usará ninguna pasarela de pago; todo pago es manual (transferencia bancaria / Revolut), registrado a mano por Mar en `deposit_paid`
- [x] **Rutas eliminadas**: `app/api/stripe/webhook/`, `app/api/pagar/[token]/`
- [x] **Acción eliminada**: `app/actions/pagos.ts` (`crearSesionPago`)
- [x] **Componente eliminado**: `app/conversacion/[token]/PagoButton.tsx` — sustituido por un bloque con las formas de pago (transferencia/Revolut) cuando hay un pago pendiente
- [x] **Dependencia `stripe` desinstalada** del `package.json`
- [x] **Variables de entorno `STRIPE_*` eliminadas** de `.env.local`
- [x] **`app/actions/mensajes.ts`** (`solicitarPago`, `emailPagoGuest`) — ya no genera enlace de pago Stripe, el email muestra las formas de pago directamente
- [x] **`app/conversacion/[token]/page.tsx`** — `isPaid` ahora se calcula con `deposit_paid >= total_price` en vez de `paid_at`; quitado el banner de "pago recibido" post-redirección de Stripe
- [x] **`app/admin/pagos/page.tsx`** — los buckets "pendientes"/"pagados" ahora se calculan comparando `deposit_paid` vs `total_price` en vez de `paid_at`
- [x] **`app/admin/reservas/page.tsx`** — "Cobrado"/"Pendiente" (chips resumen y columnas de la tabla) ahora usan `deposit_paid` con soporte de pago parcial, en vez de todo-o-nada con `paid_at`
- [x] **`app/admin/reservas/[id]/page.tsx`** — arreglado el bug de la sección "Pagos" que no restaba el anticipo (ver batch anterior); ahora usa `deposit_paid` de forma consistente con el desglose de `PricingPanel`
- [x] **`lib/database.types.ts`** — quitados los campos `stripe_session_id` y `paid_at`
- [x] **Migración `supabase/migration_remove_stripe.sql`** creada y ejecutada en Supabase
- [x] **Scripts de verificación** — eliminado `scripts/verify-pagar.mjs` y el bloque "FLOW 2: API Pagar" de `scripts/verificar.mjs`; borrados artefactos de capturas antiguas de `/api/pagar`
- [x] **`PROMPT.md`** actualizado — sección "PAGOS (STRIPE)" → "PAGOS (MANUALES)", referencias a enlaces Stripe sustituidas por transferencia/Revolut

---

## COMPLETADO — batch 2026-07-17 (reseñas destacadas en home)

- [x] **Migración SQL reseñas destacadas** — `supabase/migration_resenas_home.sql`
- [x] **Marcar reseñas destacadas en admin** — `app/admin/contenido/resenas/page.tsx` + `actions.ts`
- [x] **Mostrar reseñas destacadas en home** — `app/[locale]/page.tsx` + `components/HomeClient.tsx`
- [x] **Build correcto** tras los cambios
- [x] **Editar reseñas existentes** — formulario "Editar" desplegable por reseña, se colapsa tras guardar
- [x] **Campos opcionales en reseñas** — solo Autor y ★ obligatorios (`supabase/migration_resenas_optional_fields.sql`)
- [x] **Fecha de reseña como mes/año** — `type="month"` en vez de `type="date"`
- [x] **Quitar botón "Ver mi reserva" en /confirmacion** — `components/ConfirmacionContent.tsx`, coherente con lo ya hecho en el email al huésped

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
