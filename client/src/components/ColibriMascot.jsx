/**
 * Colibrí, animal y mascota de la Universidad Mexiquense del Bicentenario.
 * Diseño geométrico (art déco, teal/azul/dorado) que compartió Axel el
 * 2026-11-06: PNG con el fondo negro eliminado (transparente), guardado
 * local en /images/colibri-geometrico.png para que funcione sin internet.
 * Sustituye al SVG de caricatura (v2). Se anima con `anim-float` donde se usa.
 */
export default function ColibriMascot({ className = '' }) {
  return (
    <img
      src="/images/colibri-geometrico.png"
      alt="Colibrí, mascota de la UMB"
      className={className}
    />
  );
}
