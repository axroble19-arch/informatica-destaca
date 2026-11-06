import { useEffect, useRef, useState } from 'react';

/* Tilt 3D + glare especular de Stitch (script 3), extraído de Home.jsx sin
   cambiar su sensación: rotación ±max° siguiendo el cursor (perspective
   1000px, scale) y brillo radial en la posición del puntero; se respeta
   prefers-reduced-motion. `dimmed` reproduce el filtrado de Stitch
   (opacidad 0.25, escala 0.96) y desactiva el tilt en esas tarjetas.
   Las props extra (onClick, role, tabIndex, data-*, ...) se pasan al
   contenedor, así que puede ser la raíz de una tarjeta clicable.
   NOTA: el tilt escribe el transform inline; no combines este contenedor
   con clases hover:-translate-* (el inline las anularía): el tilt con su
   scale sustituye esa elevación. */
export default function TiltCard({
  className = '',
  style,
  dimmed = false,
  max = 10,
  scale = 1.02,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [glare, setGlare] = useState({ opacity: 0, x: 50, y: 50 });
  const reducedRef = useRef(false);
  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || dimmed || reducedRef.current) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -max;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * max;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    setGlare({ opacity: 0.85, x, y });
  };
  const onLeave = () => {
    const el = ref.current;
    if (el && !dimmed) el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <div
      ref={ref}
      className={`tilt-card-container relative ${className}`}
      style={dimmed ? { opacity: 0.25, transform: 'scale(0.96)' } : style}
      {...rest}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="card-glare"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}px ${glare.y}px, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 60%)`,
        }}
      />
      {children}
    </div>
  );
}
