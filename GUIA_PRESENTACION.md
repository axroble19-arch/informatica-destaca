# Guía de presentación final — Informática Destaca

Guion para la demostración en vivo del flujo completo: registro, validación
y publicación. Duración sugerida: 10–12 minutos. Todo el flujo ya fue
probado dos veces en vivo y funciona.

## Antes de empezar

- Servidores corriendo: `docker compose up -d`, `npm run dev` en `server/` y
  `npm run dev -- --host 0.0.0.0` en `client/`.
- Navegador en `http://localhost:5173` (pantalla completa, zoom 100%).
- Respaldo: el portal también está publicado en
  https://informatica-destaca.vercel.app por si localhost falla en vivo
  (ver `DEPLOY.md`).
- Tener a la mano las cuentas de prueba (ver `MANUAL_DE_USUARIO.md`).
- Si algo falla en vivo: no improvises con la base de datos; muestra la
  vista pública ya cargada y explica el paso con el manual.

## Guion (10 pasos)

### 1. Presentación del portal (1 min)
Muestra el **Inicio**: el Cuadro de Honor con el podio, los certámenes y la
convocatoria vigente del 5.º Certamen 2026. Di qué es la plataforma y para
quién es (estudiantes, egresados y evaluadores de la Licenciatura en
Informática).

### 2. Iniciar sesión como administrador (30 s)
Entra con `admin@informatica.edu`. Explica que hay cuatro roles
(Administrador, Contenido, Estudiante y Evaluador) y que cada uno ve cosas
distintas.

### 3. Registrar un estudiante (1 min)
En el panel, pestaña **Estudiantes** → **Nuevo estudiante**. Regístralo con
nombre, semestre y generación. Comenta que la foto y los logros aprobados
son lo que lo lleva al Cuadro de Honor.

### 4. Registrar un evento (1 min)
Pestaña **Eventos** → **Nuevo evento**. Categoría **Certamen** para que
aparezca en Certámenes. Explica que los eventos quedan visibles en el
portal público de inmediato.

### 5. Asociar estudiante y evento (1 min)
Pestaña **Participaciones** → **Nueva participación**. Elige al estudiante y
al evento, tipo **Concursante**. Señala que queda en Pendiente.

### 6. Registrar un logro con evidencia (1 min)
Pestaña **Logros** → **Nuevo logro** para ese estudiante, con título,
categoría y evidencia (URL o archivo). También queda en Pendiente.

### 7. Validar y aprobar (1 min)
Pestaña **Pendientes**: muestra el logro y la participación pendientes y
pulsa **Aprobar** en ambos. Explica la regla central: **nada se publica sin
aprobación del administrador**.

### 8. Ver el resultado en público (1 min)
- Abre el evento en **Certámenes**: el estudiante aparece entre los
  participantes.
- Abre el perfil del estudiante: el logro aparece en su historial y en su
  **CV digital**. Muestra el botón de imprimir/descargar PDF.

### 9. Buscar desde el portal público (30 s)
Usa la barra de búsqueda superior (la única del portal) con el nombre del
estudiante o del evento. Aparece en los resultados sin iniciar sesión.

### 10. Probar que un usuario sin permisos no puede administrar (1 min)
Cierra sesión y entra con `estudiante@informatica.edu`. Intenta abrir
`/admin`: el sistema lo rechaza. Explica que las rutas de escritura
responden 401 sin sesión y 403 con un rol sin permiso. Cierra con la
plataforma de evaluadores: entra con `evaluador@informatica.edu`, muestra
un proyecto asignado y registra una calificación de ejemplo (0–10) con una
observación.

## Cierre (30 s)
Resume: registro → validación → publicación; Cuadro de Honor con
estudiantes y egresados; certámenes 2022–2026 con convocatoria vigente;
evaluadores con acceso propio. Invita preguntas.

## Reparto sugerido (equipo)

- Persona 1: pasos 1–2 (portal y roles).
- Persona 2: pasos 3–6 (registros).
- Persona 3: pasos 7–8 (aprobación y publicación).
- Persona 4: pasos 9–10 (búsqueda, permisos y evaluadores).

## Preguntas frecuentes del jurado

- **¿Los datos son reales?** Los 5 estudiantes del Cuadro de Honor son
  reales y con autorización; el resto de los datos del seed son de ejemplo
  (los ganadores 2022–2024 se sustituirán por los reales).
- **¿Dónde está publicada?** En https://informatica-destaca.vercel.app
  (API en Render). La demostración en vivo se hace en localhost para no
  ensuciar los datos publicados; si localhost falla, la URL pública sirve
  como respaldo.
- **¿Qué pasa si un evaluador califica dos veces?** Se actualiza su
  calificación; no se duplica (una por evaluador y proyecto).
- **¿Funciona en el celular?** Sí, el diseño es responsivo y el menú se
  adapta.
