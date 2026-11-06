# Publicación en línea (lista de cotejo 6.1)

Hoy el portal solo corre en localhost. Para obtener un enlace público hay que
desplegar tres piezas: **frontend, backend y base de datos**. Ruta recomendada
(capas gratuitas):

## 1. Base de datos (Render)

1. Crea una cuenta en https://render.com (con tu correo institucional).
2. New → PostgreSQL → plan Free. Anota la **Internal Database URL** y la
   **External Database URL**.
3. En tu equipo, aplica el esquema a esa base (desde `server/`):
   `DATABASE_URL="<External Database URL>" npx prisma migrate deploy`
   y luego el seed:
   `DATABASE_URL="<External Database URL>" npm run seed`
   (El seed borra y recrea los datos; hazlo una sola vez.)

## 2. Backend (Render)

1. Render → New → Web Service → conecta el repositorio del proyecto
   (o sube el código a GitHub primero).
2. Root Directory: `server`. Build Command: `npm install && npx prisma generate`.
   Start Command: `npm run start` (revisa que `package.json` tenga `start`).
3. Variables de entorno:
   - `DATABASE_URL`: la Internal Database URL de Render.
   - `JWT_SECRET`: una cadena larga y aleatoria (no uses la de localhost).
   - `CLIENT_URL`: la URL pública del frontend (paso 3).
   - `PORT`: Render la asigna sola (el servidor ya lee `process.env.PORT`).
4. Anota la URL pública del backend, por ejemplo
   `https://informatica-destaca-api.onrender.com`.

## 3. Frontend (Vercel)

1. Crea una cuenta en https://vercel.com.
2. Import Project → conecta el mismo repositorio. Root Directory: `client`.
3. Variable de entorno: `VITE_API_URL=https://informatica-destaca-api.onrender.com/api`
   (el cliente ya la usa: `services/api.js` lee `VITE_API_URL` o `/api`).
4. Deploy. Vercel te da la URL pública, por ejemplo
   `https://informatica-destaca.vercel.app`.

## 4. Cierre del círculo

- Vuelve al backend en Render y pon `CLIENT_URL` con la URL de Vercel.
- Abre la URL de Vercel y prueba: Home, Cuadro de Honor, Certámenes,
  login de admin y de evaluador.
- Ese enlace es el que se entrega para el criterio 6.1.

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
