import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrusel automático genérico (lista de cotejo 2.3 y 3.6): avanza solo cada
 * `intervalMs`, se pausa al pasar el cursor o al enfocar, y permite avanzar
 * o retroceder manualmente (flechas y puntos). El temporizador se reinicia
 * tras cada cambio, manual o automático.
 */
export default function AutoCarousel({
  items = [],
  renderItem,
  intervalMs = 5000,
  ariaLabel = 'Carrusel',
  className = '',
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const count = items.length;

  const goTo = useCallback((i) => {
    if (count === 0) return;
    setIndex(((i % count) + count) % count);
  }, [count]);

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [count, paused, intervalMs, index]);

  if (count === 0) return null;
  const current = items[index];

  return (
    <div
      className={`relative ${className}`}
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div key={index} className="carousel-fade">
        {renderItem(current, index)}
      </div>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-highest text-on-surface flex items-center justify-center backdrop-blur-md shadow-md transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-highest text-on-surface flex items-center justify-center backdrop-blur-md shadow-md transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la diapositiva ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-secondary' : 'w-2 bg-on-surface/40 hover:bg-on-surface/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
