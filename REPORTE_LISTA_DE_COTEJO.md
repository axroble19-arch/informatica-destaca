# Reporte de cumplimiento — Lista de cotejo: Plataforma web Informática

Fecha: 6 de noviembre de 2026. El diseño no se modificó (criterio 1.1 excluido
por decisión del equipo: se conserva el diseño oscuro logrado).

## Puntaje estimado: 42/50

Auditoría inicial (estática, antes de los cambios): 26/50. Tras implementar lo
faltante y verificarlo en vivo: 42/50. Quedan fuera del código: 1.1 (2 pts,
diseño conservado por decisión expresa), 6.1 (2 pts, publicar en línea
requiere cuentas del equipo — ver DEPLOY.md) y 6.3 (1 pt, presentación en
vivo del equipo). La suma de los renglones de la lista es 47, aunque el PDF
dice 50.

## Por criterio

| Criterio | Estado | Nota |
|---|---|---|
| 1.1 Colores/logo institucionales | Excluido | Diseño conservado por decisión del equipo |
| 1.2 Responsivo (computadora/tablet/celular) | ✅ 2/2 | viewport + clases responsivas + menú hamburguesa |
| 1.3 Navegación clara y organizada | ✅ 1/1 | Navbar fija con secciones, buscador global, estado activo |
| 2.1 Cuadro de Honor dividido estudiantes/egresados | ✅ 2/2 | Sección "Egresados con Distinción" (Lucía Fernández, Jorge Sánchez) |
| 2.2 Estudiantes y egresados actuales primero, con info y fotos | ✅ 2/2 | Podio + nómina primero; egresados con retrato y logros |
| 2.3 Carrusel automático del cuadro de honor | ✅ 2/2 | "Destacados del Cuadro de Honor", avanza solo cada 5 s |
| 2.4 CRUD del cuadro de honor | ✅ 3/3 | Vía estudiantes + logros + aprobación en Admin; postulación pública real |
| 2.5 Estructura clara, legible y uniforme | ✅ 1/1 | Tarjetas uniformes, ordenamiento explícito |
| 3.1 Sección independiente de certámenes | ✅ 1/1 | /eventos solo certámenes |
| 3.2 Cuatro ediciones anteriores cargadas | ✅ 2/2 | 2022, 2023, 2024 y 2025 con fecha, lugar y fotos |
| 3.3 Quinta edición con convocatoria vigente | ✅ 2/2 | 5.º Certamen Interinstitucional LI 2026, 4 dic 2026, con convocatoria real del cartel oficial de UES Ixtlahuaca (Facebook, 27 oct 2026) |
| 3.4 Premiaciones, resultados y participantes por edición | ✅ 2/2 | Cada edición tiene 3 ganadores y participantes consultables |
| 3.5 Fotografías y evidencias de ediciones anteriores | ✅ 1/1 | 49 fotos de certámenes + flyers |
| 3.6 Carruseles automáticos | ✅ 2/2 | Ediciones en /eventos, ganadores en el detalle, honor en el Home |
| 3.7 CRUD de ediciones del certamen | ✅ 2/2 | Admin: crear/editar/eliminar eventos |
| 4.1 Subsección exclusiva de evaluadores | ✅ 1/1 | /evaluadores + banner en /eventos y tarjeta en cada certamen |
| 4.2 Acceso con usuario y contraseña | ✅ 2/2 | Rol EVALUATOR, login con 4.º perfil, cuenta evaluador@informatica.edu |
| 4.3 Consultar proyectos/participantes a evaluar | ✅ 1/1 | Lista de proyectos concursantes asignados con evidencia |
| 4.4 Formulario de calificaciones y observaciones | ✅ 2/2 | Calificación 0–10 + observaciones por proyecto |
| 4.5 Guardar/consultar evaluaciones, acceso restringido | ✅ 2/2 | Evaluador ve las suyas; admin ve todas; nada en vistas públicas |
| 5.1 Panel de administración | ✅ 2/2 | /admin con 8 pestañas |
| 5.2 CRUD en las secciones | ✅ 2/2 | Estudiantes, eventos, logros, participaciones, multimedia, usuarios, evaluaciones |
| 5.3 Cargar/administrar fotos, convocatorias, documentos y evidencias | ✅ 2/2 | Subida de archivos + registro de enlaces + imageUrl en eventos |
| 5.4 Cambios del panel se reflejan en lo público | ✅ 1/1 | Misma API y BD; aprobación PENDING → APPROVED |
| 6.1 Página publicada en línea con enlace | ⏳ 0/2 | Pendiente: seguir DEPLOY.md (Render + Vercel) |
| 6.2 Enlaces, botones, formularios, carruseles y operaciones funcionan | ✅ 2/2 | Verificado en vivo (ver abajo) |
| 6.3 El equipo presenta la plataforma | ⏳ 0/1 | Presentación en vivo del equipo |

## Verificación en vivo (6 nov 2026, PostgreSQL 16 + seed real + backend 4000)

- Seed: 4 usuarios, 11 estudiantes, 9 eventos, 13 logros, 17 participaciones,
  57 registros de media, 2 evaluaciones.
- Evaluadores: login 200; 11 proyectos asignados; guardar calificación 201;
  actualizar la misma (upsert, sin duplicar); puntaje 11 → 400; proyecto no
  certamen → 400; evaluador ve solo las suyas; admin ve todas (3); estudiante
  en asignaciones → 403; sin token → 401; CONTENT_MANAGER al guardar → 403.
- Flujo demo de 10 pasos: todo pasa (login admin, crear evento/estudiante/
  participación/logro, aprobar, visibilidad pública, búsqueda, bloqueos 403/401).
- Frontend (dev): 200 en /, /cuadro-de-honor, /eventos, /eventos/:id (2026),
  /evaluadores y /login.
- Corrección menor incluida: ids no numéricos en /api/events, /api/students y
  /api/achievements devolvían 500; ahora devuelven 404.

## Notas y decisiones del equipo

- Egresados: Lucía Fernández y Jorge Sánchez son alumnos de ejemplo del seed
  con retratos de Stitch; se aceptaron como egresados por decisión del equipo
  (ningún alumno real es egresado). La sección de estudiantes del Cuadro
  sigue mostrando solo a los 5 alumnos reales.
- Ganadores 2022–2024: registros de ejemplo del seed; sustituir por los
  ganadores reales de cada año cuando se cuente con el dato.
- La 5.ª edición usa solo datos del cartel oficial (fecha, tecnologías,
  evaluadores, escuelas invitadas, premiación, registro por QR).
- Esta actualización cambia la base de datos: antes del seed hay que correr
  `npx prisma migrate dev --name add_evaluadores` en `server/`
  (ver MIGRACION_EVALUADORES.md).
