'use client'

import { useEffect, useRef, useState } from 'react'
import { isVideoPath } from '@/lib/media'

type Props = {
  src: string
  alt: string
  /** 'cover' rellena el hueco (miniaturas de la galería); 'contain' muestra el archivo entero (pantalla completa) */
  fit?: 'cover' | 'contain'
  className?: string
  imgClassName?: string
  /** Controles nativos (pantalla completa: play/pausa y activar sonido) */
  controls?: boolean
  onClick?: (e: React.MouseEvent) => void
}

/**
 * Muestra una foto o un vídeo de la galería.
 * Vídeos: arrancan solos, silenciados y en bucle (los navegadores solo permiten
 * autoplay sin sonido) y solo mientras están en pantalla. Si el vídeo es vertical
 * (o no encaja en el hueco), se muestra entero sobre un fondo difuminado del
 * propio vídeo, sin recortarlo ni deformarlo.
 */
export default function GalleryMedia({ src, alt, fit = 'cover', className = '', imgClassName = '', controls = false, onClick }: Props) {
  if (!isVideoPath(src)) {
    return (
      <img
        src={src}
        alt={alt}
        onClick={onClick}
        className={imgClassName || className}
        style={{ objectFit: fit }}
      />
    )
  }
  return <GalleryVideo src={src} fit={fit} className={className} controls={controls} onClick={onClick} />
}

function GalleryVideo({ src, fit, className, controls, onClick }: { src: string; fit: 'cover' | 'contain'; className: string; controls: boolean; onClick?: (e: React.MouseEvent) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [needsBackdrop, setNeedsBackdrop] = useState(false)

  // Decide si hace falta el fondo difuminado: cuando la proporción del vídeo
  // no coincide con la del hueco (típico: vídeo vertical en hueco horizontal).
  function checkRatio() {
    const v = videoRef.current
    const w = wrapRef.current
    if (!v || !w || !v.videoWidth || !v.videoHeight) return
    const videoRatio = v.videoWidth / v.videoHeight
    const boxRatio = w.clientWidth / Math.max(1, w.clientHeight)
    setNeedsBackdrop(fit !== 'contain' && Math.abs(videoRatio - boxRatio) / boxRatio > 0.15)
  }

  // Reproducir solo cuando está visible (ahorra batería y datos en el móvil)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (typeof IntersectionObserver === 'undefined') { v.play().catch(() => {}); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { threshold: 0.25 })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  // Fondo difuminado: se pinta el propio vídeo en un canvas pequeño (sin
  // descargarlo dos veces) y se desenfoca con CSS.
  useEffect(() => {
    if (!needsBackdrop) return
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < 120) return // ~8 fps es suficiente para un fondo borroso
      last = t
      if (v.readyState >= 2) {
        try { ctx.drawImage(v, 0, 0, c.width, c.height) } catch { /* ignore */ }
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [needsBackdrop])

  useEffect(() => {
    const w = wrapRef.current
    if (!w || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => checkRatio())
    ro.observe(w)
    return () => ro.disconnect()
  }, [])

  const showWhole = fit === 'contain' || needsBackdrop

  return (
    <div
      ref={wrapRef}
      className={className}
      onClick={onClick}
      style={{ position: 'relative', overflow: 'hidden', background: '#111' }}
    >
      {needsBackdrop && (
        <canvas
          ref={canvasRef}
          width={48}
          height={48}
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'blur(24px) brightness(0.85)', transform: 'scale(1.25)' }}
        />
      )}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        controls={controls}
        onLoadedMetadata={checkRatio}
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: showWhole ? 'contain' : 'cover', display: 'block' }}
      />
    </div>
  )
}
