# PENDIENTE — HolaMarbella

> Instrucciones: cuando el usuario diga "ejecuta el pendiente", leer este archivo, ejecutar todas las tareas `[ ]`, marcar como `[x]` las completadas o `[!]` las fallidas, desplegar y correr `node scripts/verificar.mjs`.

---

## PRIORIDAD ALTA — cosas rotas

- [x] **Ver mi reserva** en /confirmacion → `/conversacion/[token]` con token correcto *(fix: 2026-05-24)*
- [x] **Pagar ahora** en email de solicitud de pago → Stripe checkout directo vía `/api/pagar/[token]` *(fix: 2026-05-24)*
- [x] **MAR_EMAIL** actualizado a `jordicuesta@gmail.com` en `.env.local` *(fix: 2026-05-24)* — **⚠️ Acción manual: actualizar también en Vercel Dashboard → Settings → Environment Variables**
- [x] **Hash #id eliminado** del detalle de reserva en admin *(fix: 2026-05-24)*
- [x] **Booking ref consistente** — admin usa `reserva.booking_ref` (DB) en lugar de calcularlo; guest recibe el mismo ref vía /confirmacion *(fix: 2026-05-24)*
- [x] **Botón "Ver mi reserva" eliminado** del email de solicitud recibida (guest) *(fix: 2026-05-25)*
- [x] **Email admin nueva solicitud** — botón "Ver reserva en admin" + fila duración/precio *(fix: 2026-05-25)*
- [x] **Fix ruta /api/pagar/[token]** — añadir `dynamic = force-dynamic`, mejorar error handling *(fix: 2026-05-25)*

---

## TÍTULOS Y CONSISTENCIA

- [x] **"Apartamento Paloma"** + subheader descriptivo en home, /apartamentos, detalle, /reservar, /confirmacion, emails, admin *(fix: 2026-05-23–24)*

---

## PÁGINA /confirmacion Y EMAIL

- [x] **Precio estimado** en tabla de detalles (`€/noche × noches = total€`) con disclaimer "El precio exacto será confirmado al revisar tu solicitud" *(fix: 2026-05-24)*
- [x] **Ver mi reserva** → `/conversacion/[token]` *(fix: 2026-05-24)*
- [x] **"Guarda este enlace"** eliminado de /confirmacion, mantenido solo en email *(fix: 2026-05-23)*
- [x] **Tarifa de limpieza visible en /reservar y /confirmacion** — desglose con precio/noche × noches + limpieza + total *(fix: 2026-05-25)*

---

## BUSCADOR Y DISPONIBILIDAD

- [x] **Fechas se arrastran** del buscador → detalle del apartamento → /reservar *(fix: 2026-05-24)*
- [x] **Validación de disponibilidad** antes de enviar solicitud en /reservar *(fix: 2026-05-24)*
- [x] **Fechas flexibles** ±1, ±2, ±3 días en buscador *(fix: 2026-05-25)*

---

## SOLICITUD DE PAGO — mejoras

- [x] **Email "Solicitud de pago para tu reserva"** + botón "Pagar ahora" → Stripe *(fix: 2026-05-24)*
- [x] **Comentario libre del gestor** en solicitud de pago — campo de texto opcional en ChatPanel, aparece en email y en /conversacion/[token] *(fix: 2026-05-25)*
- [x] **Resumen de pagos en admin** — panel mostrando lo pagado, lo pendiente y total *(fix: 2026-05-25)*

---

## GESTOR DE CONTENIDO — /admin/contenido

- [x] **Configuración general** — tarifa de limpieza por apartamento, guarda en tabla `configuracion` *(fix: 2026-05-25)*
- [x] **Disponibilidad** — bloquear/desbloquear fechas manualmente, tabla `bloqueos` *(fix: 2026-05-25)*
- [x] **Precios** — tarifas por noche por apartamento y rango de fechas, tabla `precios` *(fix: 2026-05-25)*
- [x] **Apartamentos** — editar título, subtítulo, descripción y amenidades *(fix: 2026-05-25)*
- [x] **Blog** — crear, editar y publicar artículos para /informacion, tabla `articulos` *(fix: 2026-05-25)*
- [x] **Reseñas** — añadir, editar y eliminar reseñas *(fix: 2026-05-25)*
- [x] **Enlace "Contenido"** en nav admin *(fix: 2026-05-25)*
- [ ] **Migraciones SQL** — ejecutar scripts de creación de tablas en Supabase (requiere PAT manual)

---

## VERIFICACIÓN AUTOMÁTICA

- [x] **verificar.mjs bugs** corregidos — `page→p`, strict mode, confirmacion falso positivo *(fix: 2026-05-25)*
- [x] **Check /conversacion/[token]** en verificar.mjs *(fix: 2026-05-25)*
- [x] **Check /admin/contenido** en verificar.mjs *(fix: 2026-05-25)*
- [x] **Check ruta /api/pagar/** en verificar.mjs *(fix: 2026-05-25)*

---

## NOTAS TÉCNICAS

- Playwright instalado: `@playwright/test` + chromium
- Verificación automática: `node scripts/verificar.mjs`
- Screenshots en: `scripts/screenshots/`
- Para verificar otra URL: `node scripts/verificar.mjs --base http://localhost:3000`
- Último informe: **29 OK · 0 fallos** *(2026-05-25)*
- Migraciones SQL en: `scripts/migrate_contenido.mjs` — ejecutar con `node scripts/migrate_contenido.mjs TU_PAT`
