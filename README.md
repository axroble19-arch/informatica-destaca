# Informática Destaca

Plataforma web de reconocimiento, eventos y trayectoria estudiantil para la
Licenciatura en Informática.

## Qué es

La plataforma difunde los logros de los estudiantes, administra eventos
académicos y tecnológicos, publica fotografías y videos, y construye un
historial de participación y reconocimientos consultable como currículum
vitae digital.

Tiene una sección pública para la comunidad y un sistema de administración
que permite registrar, modificar, consultar y publicar información. Nada se
publica sin aprobación previa de un administrador.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL + Prisma |
| Autenticación | JWT + bcryptjs |
| Subida de archivos | Multer (carpeta local `server/uploads`) |

## Cómo arrancar en localhost

### 1. Base de datos (PostgreSQL con Docker)

```bash
docker compose up -d
```

Levanta PostgreSQL en el puerto 5432 con:

- Base de datos: `informatica_destaca`
- Usuario: `postgres`
- Contraseña: `postgres`

> Si Docker no está instalado en tu equipo, instala PostgreSQL localmente
> y ajusta `DATABASE_URL` en `server/.env`.

### 2. Backend

```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

El servidor queda en `http://localhost:4000`.
Salud: `GET http://localhost:4000/api/health`.

### 3. Frontend

En otra terminal:

```bash
cd client
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Las llamadas a `/api` se redirigen
al backend con el proxy de Vite (ver `client/vite.config.js`).

## Cuentas de prueba

Las crea `npm run seed` en el servidor (contraseñas con hash bcrypt, nunca
en texto plano):

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@informatica.edu` | `Admin123!` |
| Responsable de contenido | `contenido@informatica.edu` | `Contenido123!` |
| Estudiante | `estudiante@informatica.edu` | `Estudiante123!` |
| Evaluador del certamen | `evaluador@informatica.edu` | `Evaluador123!` |

- **ADMIN**: gestiona usuarios, estudiantes, eventos, logros y aprueba
  publicaciones.
- **CONTENT_MANAGER**: registra y edita eventos, revisa evidencias y
  propone publicaciones.
- **STUDENT**: solo consulta el portal público y su propia trayectoria
  (perfil y CV); no puede crear, editar ni proponer información, y no puede
  modificar información de otros estudiantes. Cualquier visitante puede
  postular un logro al Cuadro de Honor desde el formulario público, que
  queda en PENDING hasta que un ADMIN lo apruebe.
- **EVALUATOR**: solo usa la plataforma de evaluadores (`/evaluadores`):
  consulta los proyectos concursantes asignados, registra calificaciones
  (0–10) y observaciones, y consulta sus propias evaluaciones. No entra al
  panel de administración ni crea, edita o aprueba contenido.

El seed deja un logro y una participación en estado `PENDING` para probar
la aprobación en el panel de administración.

## Endpoints principales

Base: `http://localhost:4000/api`

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/health` | Salud del servidor | Público |
| POST | `/auth/login` | Iniciar sesión, devuelve JWT | Público |
| POST | `/auth/register` | Crear usuario | ADMIN |
| GET | `/students` | Listar estudiantes | Público (solo aprobados/publicables) |
| GET | `/students/:id` | Perfil + historial cronológico | Público |
| POST/PUT/DELETE | `/students` | CRUD de estudiantes | ADMIN / CONTENT_MANAGER |
| GET | `/events` | Listar eventos (filtros `?status=&from=&to=`) | Público |
| GET | `/events/:id` | Detalle de evento + participantes | Público |
| POST/PUT/DELETE | `/events` | CRUD de eventos | ADMIN / CONTENT_MANAGER |
| GET | `/achievements` | Listar logros (filtro `?category=`) | Público (solo aprobados) |
| POST | `/achievements` | Registrar logro | Autenticado |
| GET | `/participations` | Listar participaciones | Público (solo aprobadas) |
| POST | `/participations` | Asociar estudiante con evento | Autenticado |
| GET | `/media` | Galería multimedia | Público |
| POST | `/media` | Subir archivo o registrar enlace | Autenticado |
| GET | `/search?q=&type=` | Buscar estudiantes y eventos | Público |
| GET | `/admin/pending` | Logros y participaciones pendientes | ADMIN |
| GET | `/evaluations/assignments` | Proyectos concursantes por evaluar | EVALUATOR |
| GET | `/evaluations` | Evaluaciones (propias o todas) | EVALUATOR / ADMIN |
| POST | `/evaluations` | Guardar o actualizar una evaluación | EVALUATOR |
| POST | `/admin/achievements/:id/approve` | Aprobar logro | ADMIN |
| POST | `/admin/achievements/:id/reject` | Rechazar logro | ADMIN |
| POST | `/admin/participations/:id/approve` | Aprobar participación | ADMIN |
| POST | `/admin/participations/:id/reject` | Rechazar participación | ADMIN |

Todas las rutas protegidas esperan el header
`Authorization: Bearer <token>`.

## Flujo de la demo (10 pasos del reto)

1. Iniciar sesión como `admin@informatica.edu`.
2. Registrar un estudiante (o consultar uno existente) en el panel.
3. Registrar un evento.
4. Asociar al estudiante con el evento (participación).
5. Registrar un logro y agregar una evidencia multimedia o enlace.
6. Validar y aprobar la información en el panel de administración.
7. Mostrar cómo aparece el evento en la página pública.
8. Mostrar cómo el logro se incorpora al perfil y al historial del
   estudiante.
9. Buscar al estudiante o evento desde el portal público.
10. Verificar que un usuario sin permisos (rol STUDENT o sin sesión) no
    pueda realizar acciones administrativas: el panel y las rutas de
    escritura responden 401/403.

## Estructura

```
informatica-destaca/
├── docker-compose.yml
├── README.md
├── server/                 # Express + Prisma
│   ├── prisma/schema.prisma
│   ├── src/index.js        # entrada, rutas /api/*
│   ├── src/prisma.js
│   ├── src/middleware/auth.js
│   ├── src/routes/         # auth, students, events, achievements,
│   │                       # participations, media, search, admin,
│   │                       # evaluations
│   ├── src/seed.js
│   └── uploads/            # archivos subidos (no se versiona)
└── client/                 # React + Vite + Tailwind
    ├── src/App.jsx         # rutas
    ├── src/pages/          # Home, HonorBoard, Students, StudentProfile,
    │                       # Events, EventDetail, Gallery, Search, Login, Admin,
    │                       # Evaluators
    ├── src/components/     # Navbar, cards, ProtectedRoute, AutoCarousel,
    │                       # TiltCard, CountUp
    ├── src/services/api.js
    └── src/context/AuthContext.jsx
```

## Notas importantes

- **Nota del entorno de construcción:** en la máquina donde se creó
  esta estructura no había Docker ni PostgreSQL, y el descargador de
  Prisma no usaba el proxy de salida, por lo que `npm install` y
  `prisma generate` fallaban con `ECONNRESET` al bajar los motores.
  Se resolvió instalando con `npm install --ignore-scripts` y
  descargando los motores manualmente con `curl` a
  `server/prisma-engines/`. **En tu equipo, con internet normal, no
  necesitas nada de esto:** `npm install` descarga los motores solo.
  Si alguna vez te pasa lo mismo, genera el cliente así:
  ```bash
  cd server
  PRISMA_QUERY_ENGINE_BINARY=$PWD/prisma-engines/query-engine \
  PRISMA_QUERY_ENGINE_LIBRARY=$PWD/prisma-engines/libquery_engine.so.node \
  PRISMA_SCHEMA_ENGINE_BINARY=$PWD/prisma-engines/schema-engine \
  npx prisma generate
  ```
  y copia `libquery_engine.so.node` y `query-engine` a
  `node_modules/.prisma/client/` con los nombres
  `libquery_engine-debian-openssl-3.0.x.so.node` y
  `query-engine-debian-openssl-3.0.x`.
- **Verificación en vivo (6 nov 2026):** con PostgreSQL 16 local se
  corrieron `prisma migrate` + `npm run seed` y se probaron el flujo de
  evaluadores completo, el flujo demo de 10 pasos y las rutas del
  frontend. Todo pasó. Ver `REPORTE_LISTA_DE_COTEJO.md`.
- **Privacidad:** solo se publican fotos, videos y datos reales con
  autorización (`consentToPublish`). Los datos del seed son ficticios y
  coherentes con el contexto universitario.
- **Multimedia:** los archivos se guardan en `server/uploads/` y se sirven
  en `/uploads/...`; los videos externos se guardan como enlace
  (YouTube/Vimeo) y se muestran con reproductor integrado.
- **CV digital:** cada perfil tiene su vista de CV (`/estudiantes/:id/cv`)
  con perfil, habilidades, proyectos, certificaciones, reconocimientos y
  participaciones en orden cronológico. La descarga en PDF se puede hacer
  desde el navegador (Imprimir → Guardar como PDF).

## Qué falta por hacer para la demo

- Levantar la base de datos y correr `prisma migrate dev` + `seed`
  (en este entorno no había Docker/PostgreSQL disponible para hacerlo).
- Revisar los datos del seed y ajustar nombres/fechas al contexto real
  del equipo.
- Probar el flujo completo de la demo con las cuentas de prueba.
- Generar el CV en PDF desde el backend (opcional, hoy se hace desde el
  navegador).
- Pulir el diseño con el diseño final de Stitch.
