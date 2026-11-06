# Manual breve de usuario — Informática Destaca

Cómo usar el portal: consultar el Cuadro de Honor y los certámenes, y cómo
registrar estudiantes, eventos y logros. Para entrar al sistema se necesita
una cuenta; las de prueba se crean con `npm run seed` (ver `README.md`).

## Cuentas

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@informatica.edu` | `Admin123!` |
| Responsable de contenido | `contenido@informatica.edu` | `Contenido123!` |
| Estudiante | `estudiante@informatica.edu` | `Estudiante123!` |
| Evaluador del certamen | `evaluador@informatica.edu` | `Evaluador123!` |

Solo el administrador crea usuarios nuevos (pestaña **Usuarios** del panel).

## 1. Entrar al panel de administración

1. Haz clic en **Iniciar sesión** (arriba a la derecha).
2. Elige tu perfil (Administrador, Contenido, Estudiante o Evaluador) y
   escribe tu correo y contraseña. El formulario autocompleta la cuenta de
   prueba del perfil elegido.
3. Al entrar, el Administrador y el Responsable de contenido llegan al
   **Panel de administración** (`/admin`); el Evaluador, a la plataforma de
   evaluadores (`/evaluadores`); el Estudiante, al inicio.

## 2. Registrar un estudiante

1. En el panel, abre la pestaña **Estudiantes** y pulsa **Nuevo estudiante**.
2. Llena al menos el nombre público, el semestre y la generación. Puedes
   agregar foto (URL o archivo), biografía, intereses y habilidades.
3. Pulsa **Guardar**. El estudiante queda registrado y visible en
   **Estudiantes** (`/estudiantes`).
4. Para que aparezca en el **Cuadro de Honor** necesita dos cosas: una foto
   y al menos un logro aprobado (ver paso 4).

Para editarlo o eliminarlo, usa los botones de su fila (solo Administrador
puede eliminar).

## 3. Registrar un evento

1. En el panel, abre la pestaña **Eventos** y pulsa **Nuevo evento**.
2. Llena título, descripción, fecha, lugar, modalidad, organizador,
   categoría y estado. Para que el evento aparezca en **Certámenes**
   (`/eventos`), la categoría debe ser **Certamen**.
3. Puedes agregar una imagen de portada (URL en el campo `imageUrl` o
   subiéndola en la pestaña **Multimedia**).
4. Pulsa **Guardar**. El evento aparece de inmediato en el portal público.

## 4. Registrar un logro y aprobarlo

Hay tres formas de registrar un logro:

**a) Desde el panel (Administrador o Contenido):**
1. Pestaña **Logros** → **Nuevo logro**.
2. Elige el estudiante, la categoría (Investigación, Innovación, Concurso,
   etc.), el título, la descripción, la fecha y el evento relacionado.
3. Pulsa **Guardar**.

**b) Postulación pública (cualquier visitante):**
1. En **Cuadro de Honor**, pulsa **Postular un logro**.
2. Llena el formulario con tus datos y la evidencia.
3. El logro queda en **Pendiente** hasta que un administrador lo apruebe.

**c) Aprobar o rechazar (solo Administrador):**
1. En el panel, abre la pestaña **Pendientes**.
2. Revisa el logro y la evidencia, y pulsa **Aprobar** o **Rechazar**.
3. Al aprobarse, el logro aparece en el perfil del estudiante, en su CV
   digital y suma al Cuadro de Honor.

## 5. Asociar un estudiante con un evento (participación)

1. En el panel, pestaña **Participaciones** → **Nueva participación**.
2. Elige el estudiante y el evento, el tipo (Concursante, Asistente,
   Ponente, Organizador, Colaborador) y, si aplica, el resultado
   (por ejemplo, "Primer lugar") y la evidencia (URL).
3. Pulsa **Guardar**. La participación queda **Pendiente** y debe aprobarla
   un Administrador en la pestaña **Pendientes** (mismo flujo que los
   logros).
4. Una vez aprobada, se ve en el detalle del evento y en el historial del
   estudiante.

## 6. Subir fotos y evidencias (Multimedia)

1. En el panel, pestaña **Multimedia** → **Subir**.
2. Elige el archivo (imagen o video, hasta 10 MB) o pega una URL.
3. Escribe un título, una descripción y, si aplica, el evento o estudiante
   relacionado. Marca si hay autorización para publicarla.
4. Pulsa **Guardar**. La imagen aparece en la **Galería Multimedia**.

## 7. Evaluar proyectos de un certamen (rol Evaluador)

1. Inicia sesión con la cuenta de Evaluador. Llegas a `/evaluadores`.
2. Verás la lista de **proyectos por evaluar**: cada tarjeta muestra el
   proyecto, el estudiante, el certamen y el promedio actual.
3. Escribe la **calificación (0–10)** y tus **observaciones**, y pulsa
   **Guardar evaluación**. Puedes actualizarla después; no se duplica.
4. En **Mis evaluaciones** consultas lo que ya calificaste. El
   Administrador ve todas las evaluaciones en su pestaña **Evaluaciones**.

## 8. Consultar el portal público (sin cuenta)

- **Inicio:** resumen, Cuadro de Honor, certámenes y convocatoria vigente.
- **Cuadro de Honor:** podio, nómina de estudiantes y sección de egresados.
- **Certámenes:** ediciones 2022–2026, con ganadores, participantes y
  evidencias; la edición vigente muestra su convocatoria.
- **Estudiantes:** lista y perfil de cada estudiante con su historial.
- **CV digital:** en el perfil del estudiante, botón **Ver CV**; desde ahí
  se puede **Descargar / Imprimir PDF** (elige "Guardar como PDF" y
  desmarca "Encabezados y pies de página").
- **Galería Multimedia:** fotos y evidencias con filtro por año.
- **Búsqueda:** la barra superior busca estudiantes y eventos en todo el
  portal.

## 9. Qué hacer si algo no aparece

- Un estudiante nuevo no sale en el Cuadro de Honor: revisa que tenga foto
  y un logro aprobado.
- Un evento nuevo no sale en Certámenes: revisa que su categoría sea
  **Certamen**.
- Un logro o participación no se ve en público: revisa que esté **Aprobado**
  en la pestaña **Pendientes**.
- El login da error: revisa que el backend esté corriendo y que
  `server/.env` tenga un `JWT_SECRET` real.
