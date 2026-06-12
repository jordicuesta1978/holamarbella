'use client'

import { useEffect } from 'react'
import 'shepherd.js/dist/css/shepherd.css'

const STORAGE_KEY = 'hmb_tour_done'

const TOUR_CSS = `
  /* Shape & shadow */
  .hmb-tour .shepherd-content { border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.16); border: 1px solid #e2e8f0; font-family: system-ui,-apple-system,'Segoe UI',sans-serif; overflow: hidden; min-width: 300px; max-width: 380px; }

  /* Header — must beat Shepherd's ".shepherd-has-title .shepherd-content .shepherd-header" (0,3,0) */
  .shepherd-has-title.hmb-tour .shepherd-content .shepherd-header { background: #4B766B !important; padding: 14px 18px 12px !important; border-radius: 12px 12px 0 0; }

  /* Title — must beat Shepherd's ".shepherd-title" (0,1,0) */
  .shepherd-has-title.hmb-tour .shepherd-content .shepherd-title { color: #fff !important; font-size: 14px; font-weight: 700; }

  /* Cancel icon — must beat Shepherd's ".shepherd-has-title .shepherd-content .shepherd-cancel-icon" (0,3,0) */
  .shepherd-has-title.hmb-tour .shepherd-content .shepherd-cancel-icon { color: rgba(255,255,255,0.75) !important; font-size: 20px; }
  .shepherd-has-title.hmb-tour .shepherd-content .shepherd-cancel-icon:hover { color: #fff !important; }

  /* Arrow color to match green header when tooltip is below the target */
  .shepherd-has-title.hmb-tour[data-popper-placement^=bottom] > .shepherd-arrow:before { background-color: #4B766B !important; }

  /* Body text */
  .hmb-tour .shepherd-text { padding: 16px 18px; font-size: 13px; line-height: 1.7; color: #333; }
  .hmb-tour .shepherd-text p { margin: 0 0 8px; }
  .hmb-tour .shepherd-text p:last-child { margin: 0; }

  /* Footer & buttons */
  .hmb-tour .shepherd-footer { padding: 4px 18px 16px; display: flex; justify-content: flex-end; gap: 8px; }
  .hmb-tour .shepherd-button { border-radius: 8px; padding: 7px 16px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: opacity 0.15s; }
  .hmb-tour .shepherd-button:hover { opacity: 0.85; }
  .hmb-tour .shepherd-button-primary { background: #4B766B; color: #fff; }
  .hmb-tour .shepherd-button-secondary { background: #f0f0f0; color: #555; }

  /* Modal overlay */
  .shepherd-modal-overlay-container { fill: #1a1a2e; opacity: 0.45 !important; }
`

export default function AdminTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) return

    // Inject CSS once
    if (!document.getElementById('hmb-tour-css')) {
      const style = document.createElement('style')
      style.id = 'hmb-tour-css'
      style.textContent = TOUR_CSS
      document.head.appendChild(style)
    }

    let tourRef: { cancel: () => void } | null = null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('shepherd.js').then((mod: any) => {
      // Shepherd.js 15.x: default export is { activeTour, Step, Tour }
      const Shepherd = mod.default as { Tour: new (opts: object) => any }
      const { Tour } = Shepherd

      const tour = new Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          classes: 'hmb-tour',
          scrollTo: { behavior: 'smooth', block: 'center' },
          canClickTarget: false,
        },
      })

      tourRef = tour

      const next = { text: 'Siguiente →', action: () => tour.next(), classes: 'shepherd-button-primary' }
      const prev = { text: '← Atrás', action: () => tour.back(), classes: 'shepherd-button-secondary' }
      const done = { text: '¡Vamos!', action: () => tour.complete(), classes: 'shepherd-button-primary' }

      tour.addStep({
        id: 'bienvenida',
        title: '¡Hola, Mar! 👋',
        text: '<p>Bienvenida a tu panel de gestión. Te hacemos un tour rápido para que te orientes.</p><p>Solo tardará un minuto.</p>',
        buttons: [done, next],
      })

      tour.addStep({
        id: 'dashboard',
        title: 'Dashboard',
        text: '<p>De un vistazo ves las <strong>reservas pendientes</strong> y las <strong>llegadas de esta semana</strong>. Un clic y llegas directamente.</p>',
        attachTo: { element: '[data-tour="stats"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'reservas',
        title: 'Reservas',
        text: '<p>Aquí verás todas las <strong>solicitudes de reserva</strong>. Puedes confirmarlas, rechazarlas y solicitar pagos directamente desde cada reserva.</p>',
        attachTo: { element: 'a[href="/admin/reservas"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'calendario',
        title: 'Calendario',
        text: '<p>Vista <strong>mensual</strong> de todas tus reservas y llegadas. De un vistazo sabes cuándo tienes el apartamento ocupado y cuándo libre.</p>',
        attachTo: { element: 'a[href="/admin/calendario"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'disponibilidad',
        title: 'Disponibilidad',
        text: '<p>En <strong>Contenido → Disponibilidad</strong> puedes bloquear fechas manualmente cuando el apartamento no esté disponible por reformas o uso personal.</p>',
        attachTo: { element: 'a[href="/admin/contenido"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'precios',
        title: 'Precios',
        text: '<p>En <strong>Contenido → Precios</strong> configuras el precio por noche según la temporada. Define rangos de fechas con precios distintos.</p>',
        attachTo: { element: 'a[href="/admin/contenido"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'apartamentos',
        title: 'Apartamentos',
        text: '<p>En <strong>Contenido → Apartamentos</strong> editas la información, fotos y descripción de cada apartamento. También gestionas reseñas y blog.</p>',
        attachTo: { element: 'a[href="/admin/contenido"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'configuracion',
        title: 'Configuración',
        text: '<p>Aquí puedes <strong>cambiar tu contraseña</strong> cuando quieras, de forma segura.</p>',
        attachTo: { element: 'a[href="/admin/configuracion"]', on: 'bottom' },
        buttons: [prev, next],
      })

      tour.addStep({
        id: 'fin',
        title: '¡Todo listo! ✨',
        text: '<p>Ya conoces tu panel. Ahora es todo tuyo.</p><p>Si necesitas ayuda, <strong>Jordi está a un mensaje</strong>.</p>',
        buttons: [prev, done],
      })

      const markDone = () => localStorage.setItem(STORAGE_KEY, '1')
      tour.on('complete', markDone)
      tour.on('cancel', markDone)

      setTimeout(() => tour.start(), 700)
    }).catch(console.error)

    return () => {
      try { tourRef?.cancel() } catch { /* ignore if already done */ }
    }
  }, [])

  return null
}
