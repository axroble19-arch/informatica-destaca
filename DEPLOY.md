# Publicación en línea (lista de cotejo 6.1)

## Estado actual (2026-11-06)

- **Repositorio:** https://github.com/axroble19-arch/informatica-destaca (público, rama main).
- **Backend (Render):** https://informatica-destaca-api.onrender.com — Live, plan Free.
  Verificado: `/api/students` 11, `/api/events` 9, `/api/achievements` 12
  públicos, `/api/media` 57, `/api/evaluations` sin token 401.
- **Base de datos (Render):** PostgreSQL 18 Free, región Oregon, con el esquema
  aplicado y el seed cargado (11 estudiantes, 9 eventos, 13 logros,
  17 participaciones, 2 evaluaciones). **La instancia gratuita expira el
  6 de diciembre de 2026** según el panel de Render.
- **Frontend (Vercel):** https://informatica-destaca.vercel.app — Ready, plan
  Hobby (cuenta axroble19@gmail.com, equipo axroble19-arch). Root Directory
  `client`, Framework Vite, `VITE_API_URL` a la API de Render. Verificado:
  el sitio responde 200 con el título correcto y la API acepta su origen
  (CORS `access-control-allow-origin: https://informatica-destaca.vercel.app`).
- **CLIENT_URL en Render:** ya es `https://informatica-destaca.vercel.app`
  (coincidió con el marcador que se puso al inicio), así que no hizo falta
  cambiarlo. **Criterio 6.1 completado: el portal está publicado en línea.**

## Antes del 6 de diciembre de 2026 (expiración de la base gratuita)

La base gratuita de Render **expira el domingo 6 de diciembre de 2026**.
Según la documentación oficial de Render, una base Free expira 30 días
después de su creación, queda inaccesible a menos que se actualice a un
plan de pago, y tras un periodo de gracia de 14 días Render la **elimina
con todos sus datos** (alrededor del 20 de diciembre). Las bases Free no
tienen respaldos. Render avisa por correo al acercarse ambas fechas.

El 5.º Certamen LI 2026 es el **viernes 4 de diciembre de 2026**: el
portal seguirá en línea durante el certamen, pero muere dos días después.
Si la evaluación o presentación del reto es después del 6 de diciembre,
hay que actuar antes.

**Opciones (decidir a más tardar el 1 de diciembre):**

1. **Actualizar la base a plan de pago** (el más barato es ~$6 USD/mes):
   conserva todos los datos, incluidos los creados en vivo desde el Admin.
2. **Reconstruir en una base Free nueva:** crear otra base gratuita,
   aplicar el esquema con `prisma db push` y correr el seed (mismo método
   del build temporal de arriba). Da otros 30 días, pero hay que repetirlo.
3. **No hacer nada:** el portal publicado deja de funcionar el 6 de
   diciembre.

**Lo que se perdería si la base se elimina:** solo lo creado en vivo en el
Admin después del seed (estudiantes, eventos, aprobaciones, evaluaciones y
subidas). El dataset base se reconstruye en cualquier momento desde el
seed del repositorio. Por eso, si se usa el portal en vivo para registros
reales antes del 6 de diciembre, conviene exportar esos datos antes
(p. ej., desde la API pública con sesión de admin) o actualizar a pago.

## Cómo se desplegó (para repetirlo o entenderlo)

Se usó el **Blueprint** del repositorio (`render.yaml` en la raíz): servicio
web `informatica-destaca-api` (plan free, rootDir `server`,
build `npm install && npx prisma generate`, start `npm run start`) + base
PostgreSQL `informatica-destaca-db` (plan free). El Blueprint crea ambos
recursos y enlaza `DATABASE_URL` (interna) y `JWT_SECRET` (generado por
Render) solos.

Tres detalles que costaron tiempo:

1. **El servicio web necesita `plan: free` explícito en `render.yaml`.**
   Sin él, Render lo trata como plan de pago y pide tarjeta antes de aplicar
   el Blueprint.
2. **Render no detectó solo los pushes a GitHub.** Tras cada push hubo que
   hacer **Manual sync** en la página del Blueprint para que aplicara el
   cambio (el sync mismo dispara el despliegue).
3. **Esquema + seed:** no se pudieron aplicar desde fuera (la Shell de
   Render exige plan Starter de pago, y desde la máquina de trabajo no se
   alcanza el puerto 5432 de la base). Se aplicaron con un **build temporal**:
   se cambió el buildCommand a
   `npm install && npx prisma generate && npx prisma db push && npm run seed`,
   se hizo push + Manual sync, el build creó las tablas y cargó el seed, y
   **enseguida se revirtió el buildCommand al normal** (con otro push +
   Manual sync). El seed borra y recrea los datos: nunca debe quedar en el
   build permanente.

## Frontend (Vercel) — pendiente

1. Crea una cuenta en https://vercel.com (gratis, con Google).
2. Import Project → conecta el repositorio. Root Directory: `client`.
3. Variable de entorno: `VITE_API_URL=https://informatica-destaca-api.onrender.com/api`
   (el cliente ya la usa: `services/api.js` lee `VITE_API_URL` o `/api`).
4. Deploy. Vercel te da la URL pública.
5. Vuelve al backend en Render y pon `CLIENT_URL` con esa URL.
6. Abre la URL de Vercel y prueba: Home, Cuadro de Honor, Certámenes,
   login de admin y de evaluador. Ese enlace es el que se entrega para el
   criterio 6.1.

## Notas

- El plan Free de Render duerme el backend tras ~15 min sin uso: la primera
  carga puede tardar ~1 min. Es normal en la capa gratuita.
- Los archivos subidos (`/uploads`) viven en el disco del backend: en Render
  Free se pierden al redesplegar. Para la demo, las fotos del seed ya están
  en `client/public/` (no se pierden). Las subidas nuevas del Admin sí se
  perderían; si hace falta persistencia, usa un disco persistente de Render
  (plan de pago) o un bucket S3.
- No subas tu `server/.env` al repositorio: las variables van en el panel
  de Render/Vercel.
- El repo no trae `server/prisma/migrations/` (la migración init vive solo
  en el equipo local de desarrollo). Para una base nueva, el esquema se
  aplica con `prisma db push`, no con `prisma migrate deploy`.
