# Documentación técnica — Informática Destaca

Plataforma web de reconocimiento, eventos y trayectoria estudiantil para la
Licenciatura en Informática (Universidad Mexiquense del Bicentenario, Unidad
de Estudios Superiores Ixtlahuaca).

## 1. Tecnologías utilizadas

| Capa | Tecnología | Versión / nota |
|---|---|---|
| Frontend | React + Vite | SPA, JavaScript (JSX) |
| Estilos | Tailwind CSS | Tema oscuro propio (ver `tailwind.config.js`) |
| Backend | Node.js + Express | API REST en `server/src` |
| Base de datos | PostgreSQL 16 | Contenedor Docker `informatica_destaca_db` |
| ORM | Prisma | Cliente v5.22.0, esquema en `server/prisma/schema.prisma` |
| Autenticación | JWT + bcryptjs | Token Bearer, contraseñas con hash |
| Subida de archivos | Multer | Hasta 10 MB, carpeta `server/uploads` |
| Validación | Zod | Esquemas en las rutas del servidor |
| Despliegue (guía) | Render + Vercel | Ver `DEPLOY.md` |

## 2. Arquitectura

```
Navegador (React + Vite, puerto 5173)
        │  /api → proxy de Vite (solo en `npm run dev`)
        ▼
API Express (puerto 4000, rutas /api/*)
        │  Prisma Client
        ▼
PostgreSQL 16 (puerto 5432, base `informatica_destaca`)
```

- **Frontend (SPA):** rutas públicas (Home, Cuadro de Honor, Estudiantes,
  Certámenes, Galería, Búsqueda, Evaluadores, Login) y rutas protegidas
  (`/admin`, solo ADMIN y CONTENT_MANAGER). El estado de sesión vive en
  `AuthContext` y el token JWT en `localStorage`.
- **Backend:** Express con middlewares de autenticación (`verifyToken`,
  `requireRole`, `canManage`) y un manejador de errores central. Las rutas
  de escritura exigen token; las de aprobación y borrado, rol ADMIN.
- **Regla de publicación:** nada se publica sin aprobación. Los registros
  nuevos nacen `PENDING` y solo aparecen en las vistas públicas cuando un
  ADMIN los marca `APPROVED`.

## 3. Módulos (12 del reto)

Home, Cuadro de Honor, Perfil de estudiante, Administración de eventos,
Participaciones y logros, Galería multimedia, Búsqueda y filtros, Registro e
inicio de sesión con roles, Panel de administración, CV digital, Base de
datos, y diseño responsivo / seguridad / UX. A esto se suma la **plataforma
de evaluadores** (`/evaluadores`, rol EVALUATOR) exigida por la lista de
cotejo del proyecto.

## 4. Modelo de datos (PostgreSQL + Prisma)

Nueve tablas. Todas las relaciones usan llaves foráneas con `onDelete:
Cascade` (o `SetNull` en `User.student`).

| Tabla | Campos clave | Relaciones |
|---|---|---|
| `User` | id, name, email (único), passwordHash, role | 1:1 con `Student` (opcional); 1:N con `Evaluation` |
| `Student` | id, publicName, photoUrl, semester, generation, academicStatus, bio, interests[], skills[], consentToPublish, userId | 1:N con `Participation`, `Achievement`, `Project`, `Certification`, `Media` |
| `Event` | id, title, description, date, time, place, modality, organizer, category, imageUrl, status | 1:N con `Participation`, `Media` |
| `Participation` | id, studentId, eventId, type, description, result, evidenceUrl, status | N:1 con `Student` y `Event`; 1:N con `Evaluation`; única por (studentId, eventId, type) |
| `Achievement` | id, studentId, category, title, description, date, relatedEvent, institution, evidenceUrl, evidenceType, status | N:1 con `Student`; 1:N con `Media` |
| `Project` | id, studentId, title, description, url, technologies[] | N:1 con `Student` |
| `Certification` | id, studentId, title, issuer, date, url | N:1 con `Student` |
| `Evaluation` | id, evaluatorId, participationId, score (0–10), observations | N:1 con `User` (evaluador) y `Participation`; única por (evaluatorId, participationId) |
| `Media` | id, title, description, date, type, url, eventId, studentId, achievementId, consentToPublish | N:1 con `Event`, `Student` o `Achievement` (opcionales) |

Enumeraciones: `Role` (ADMIN, CONTENT_MANAGER, STUDENT, EVALUATOR),
`EventStatus` (UPCOMING, COMPLETED, CANCELLED), `ParticipationType`
(ATTENDEE, SPEAKER, CONTESTANT, ORGANIZER, COLLABORATOR, OTHER),
`ApprovalStatus` (PENDING, APPROVED, REJECTED), `MediaType` (IMAGE, VIDEO,
LINK).

### Datos de prueba (seed, `server/src/seed.js`)

`npm run seed` borra todas las tablas y las vuelve a poblar: 4 usuarios, 11
estudiantes (5 reales con foto, 6 de ejemplo), 9 eventos (5 certámenes
2022–2026), 13 logros, 17 participaciones, 57 registros de media y 2
evaluaciones de ejemplo. Deja además 1 logro y 1 participación en PENDING
para probar la aprobación en el Admin.

## 5. API REST

Base: `http://localhost:4000/api`. Tabla completa de endpoints en
`README.md` (sección "Endpoints principales"). Resumen por recurso:

- **Auth** (`/auth`): login (JWT), registro de usuarios (solo ADMIN).
- **Students** (`/students`): listado público (solo publicables), perfil
  completo con historial cronológico, CRUD (ADMIN / CONTENT_MANAGER).
- **Events** (`/events`): listado con filtros (`?status=`, `?from=`,
  `?to=`), detalle con participantes y media, CRUD.
- **Achievements** (`/achievements`): listado público de aprobados, registro
  y postulación pública (`POST /achievements/apply`).
- **Participations** (`/participations`): asociación estudiante–evento,
  edición y borrado.
- **Media** (`/media`): galería; subida en dos pasos (archivo con Multer y
  luego registro del enlace) o registro directo de URL.
- **Evaluations** (`/evaluations`): asignaciones del evaluador, listado
  (propias o todas para ADMIN) y guardado con upsert (una calificación por
  evaluador y participación; score 0–10).
- **Search** (`/search?q=&type=`): búsqueda de estudiantes y eventos.
- **Admin** (`/admin`): cola de pendientes y aprobación/rechazo.

Las rutas protegidas esperan el header `Authorization: Bearer <token>`.
Respuestas de error: 400 (validación), 401 (sin sesión), 403 (sin permiso),
404 (no encontrado).

## 6. Roles y permisos

| Acción | ADMIN | CONTENT_MANAGER | EVALUATOR | STUDENT / visitante |
|---|---|---|---|---|
| Consultar portal público | ✅ | ✅ | ✅ | ✅ |
| Crear/editar estudiantes, eventos, logros, participaciones | ✅ | ✅ (queda PENDING) | ❌ | ❌ |
| Aprobar / rechazar pendientes | ✅ | ❌ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ | ❌ |
| Crear usuarios | ✅ | ❌ | ❌ | ❌ |
| Evaluar proyectos de certamen | ❌ (consulta todas) | ❌ | ✅ | ❌ |
| Ver su perfil y CV | ✅ | ✅ | ✅ | ✅ (propio) |

## 7. Instalación y configuración

Requisitos: Node.js 18+, Docker (para PostgreSQL) y Git.

```bash
# 1. Base de datos
docker compose up -d            # PostgreSQL 16 en :5432

# 2. Backend
cd server
cp .env.example .env            # ajustar DATABASE_URL y JWT_SECRET
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev                     # http://localhost:4000

# 3. Frontend (otra terminal)
cd client
npm install
npm run dev                     # http://localhost:5173
```

Variables de entorno (`server/.env`):

| Variable | Ejemplo | Nota |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/informatica_destaca` | Usar `127.0.0.1` en Windows para evitar problemas de resolución IPv6 |
| `JWT_SECRET` | cadena larga aleatoria | **Obligatoria**: sin ella el login responde 500 |
| `PORT` | `4000` | Puerto del backend |
| `VITE_API_URL` | (vacío en local) | Solo para despliegue; en local el proxy de Vite usa `/api` |

> La demo debe correrse con `npm run dev`, no con `vite preview`: el proxy
> `/api → localhost:4000` solo existe en la configuración de desarrollo.

## 8. Estructura del código

```
informatica-destaca/
├── docker-compose.yml
├── README.md / DOCUMENTACION_TECNICA.md / MANUAL_DE_USUARIO.md
├── REPORTE_LISTA_DE_COTEJO.md / DEPLOY.md / MIGRACION_EVALUADORES.md
├── docs/evidencias/            # capturas de funcionamiento
├── server/
│   ├── prisma/schema.prisma    # modelo de datos
│   ├── src/index.js            # entrada, rutas /api/*
│   ├── src/prisma.js
│   ├── src/middleware/auth.js  # JWT, roles
│   ├── src/routes/             # auth, students, events, achievements,
│   │                           # participations, media, search, admin, evaluations
│   ├── src/seed.js             # datos de prueba
│   └── uploads/                # archivos subidos (no se versiona)
└── client/
    ├── src/App.jsx             # rutas
    ├── src/pages/              # Home, HonorBoard, Students, StudentProfile,
    │                           # Events, EventDetail, Gallery, Search, Login,
    │                           # Admin, Evaluators, Privacy
    ├── src/components/         # Navbar, cards, ProtectedRoute, AutoCarousel,
    │                           # TiltCard, CountUp
    ├── src/services/api.js     # cliente de la API
    └── src/context/AuthContext.jsx
```

## 9. Seguridad y privacidad

- Contraseñas con hash bcrypt; nunca se guardan ni se muestran en texto plano.
- JWT con secreto en variable de entorno (sin valor por defecto).
- Las rutas de escritura validan token y rol en el servidor; el frontend
  solo refleja esos permisos.
- Fotos y datos reales solo se publican con autorización
  (`consentToPublish`). Los datos del seed son ficticios salvo los 5
  estudiantes reales con autorización.
- Las imágenes y fuentes del portal están guardadas en local
  (`client/public/images/`, `client/public/fonts/`); el portal funciona sin
  internet, salvo el video de YouTube y un enlace de ejemplo en la galería.

## 10. Limitaciones conocidas

- La propuesta de información por parte del estudiante no está implementada
  (solo la postulación pública de logros al Cuadro de Honor).
- Los ganadores de los certámenes 2022–2024 son registros de ejemplo del
  seed; deben sustituirse por los ganadores reales.
- La publicación en línea (6.1) requiere cuentas de Render y Vercel; la guía
  está en `DEPLOY.md`.
