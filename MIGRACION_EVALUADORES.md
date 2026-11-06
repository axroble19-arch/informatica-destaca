# Migración requerida: plataforma de evaluadores

Esta actualización agrega el rol `EVALUATOR` y la tabla `Evaluation` al esquema
de Prisma (`server/prisma/schema.prisma`). **Sin este paso, el backend no
arranca** (el cliente de Prisma no conoce el modelo nuevo) y el seed falla.

## Pasos (en tu equipo Windows, dentro de `informatica-destaca`)

```powershell
cd C:\Users\axrob\Downloads\Informatica-Destaca\informatica-destaca
docker compose up -d
cd server
npx prisma migrate dev --name add_evaluadores
```

`prisma migrate dev` genera la migración a partir del cambio de esquema y la
aplica a tu base de datos. **No** borra datos. Después sigue el flujo normal:

```powershell
npm run seed
npm run dev
```

Y en otra terminal, en `client`:

```powershell
npm run dev -- --host 0.0.0.0
```

## Por qué no viene la migración en el ZIP

La carpeta `server/prisma/migrations/` vive solo en tu máquina (ahí se creó la
migración inicial `20261106061721_init`). El ZIP no la trae; al correr
`migrate dev` se crea la migración nueva junto a la que ya tienes, con el
checksum correcto.

## Qué cambia en la base de datos

- Enum `Role`: nuevo valor `EVALUATOR`.
- Tabla nueva `Evaluation`: `id`, `evaluatorId` (usuario evaluador),
  `participationId` (proyecto concursante), `score` (0–10), `observations`,
  `createdAt`, `updatedAt`. Un evaluador tiene una sola calificación por
  participación (la puede actualizar).
- Cuenta de prueba nueva (la crea el seed): `evaluador@informatica.edu` /
  `Evaluador123!`.
