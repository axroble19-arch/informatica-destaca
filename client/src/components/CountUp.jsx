import { useEffect, useState } from 'react';

/* Contador animado de Stitch (script 5): ease-out cúbico, 1600 ms, se dispara
   cuando `start` es true (normalmente cuando la sección entra en viewport,
   con IntersectionObserver, umbral 0.3). Extraído de Home.jsx para
   reutilizarlo en todas las vistas con métricas. */
export default function CountUp({ target, decimals = 0, suffix = '', start = true }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1600, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, start]);
  return (
    <>
      {value.toFixed(decimals)}
      {suffix}
    </>
  );
}
