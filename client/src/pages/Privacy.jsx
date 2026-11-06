import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// AVISO DE PRIVACIDAD — Licenciatura en Informática, Universidad Mexiquense
// del Bicentenario (UES Ixtlahuaca). Texto real del portal: responsable,
// datos que se recogen, finalidades, consentimiento, derechos ARCO y contacto.
// Antes era un enlace muerto (href="#") en el footer y en el Login.
// ---------------------------------------------------------------------------

const sections = [
  {
    title: '1. Responsable del tratamiento de los datos',
    body: 'La Licenciatura en Informática de la Universidad Mexiquense del Bicentenario, Unidad de Estudios Superiores Ixtlahuaca (UES Ixtlahuaca), es responsable del tratamiento de los datos personales que se recogen a través del portal Informática Destaca. Domicilio institucional: Ixtlahuaca, Estado de México. Contacto: informatica.destaca@universidad.edu.',
  },
  {
    title: '2. Datos personales que se recogen',
    body: 'Nombre completo, correo electrónico institucional, semestre, generación, estado académico, biografía, intereses y habilidades, así como fotografías, videos y enlaces que el titular decida compartir como evidencia de sus logros, participaciones y trayectoria académica. Las contraseñas nunca se almacenan en texto plano: se guardan únicamente como hash cifrado.',
  },
  {
    title: '3. Finalidades del tratamiento',
    body: 'Los datos se utilizan exclusivamente para: (a) reconocer públicamente el mérito académico en el Cuadro de Honor; (b) difundir eventos, certámenes y memorias multimedia de la Licenciatura; (c) integrar el perfil y el currículum vitae digital del estudiante; y (d) gestionar la validación de logros y participaciones por parte del Consejo Técnico. No se utilizan para fines distintos ni se venden, rentan o ceden a terceros.',
  },
  {
    title: '4. Publicación y consentimiento',
    body: 'Ningún dato, fotografía, video o enlace se publica en el portal sin la autorización expresa del titular (casilla de "Autorización para publicar" en el registro). El contenido en estado pendiente de validación no es visible al público. El titular puede retirar su autorización en cualquier momento solicitándolo al correo de contacto; la retirada aplica a publicaciones futuras y a la baja de las existentes.',
  },
  {
    title: '5. Derechos ARCO',
    body: 'El titular tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, envíe una solicitud al correo informatica.destaca@universidad.edu indicando nombre completo, el derecho que desea ejercer y los datos sobre los que versa. La solicitud se atenderá en un plazo máximo de 20 días hábiles.',
  },
  {
    title: '6. Seguridad de la información',
    body: 'El portal protege los datos con cifrado de contraseñas (bcrypt), autenticación por token (JWT) con expiración, control de acceso por roles (administrador, responsable de contenido y estudiante) y validación de todos los datos de entrada. El acceso administrativo queda registrado y auditado.',
  },
  {
    title: '7. Vigencia y cambios',
    body: 'Este aviso puede actualizarse para reflejar cambios normativos o en el funcionamiento del portal. La versión vigente es siempre la publicada en esta página. Última actualización: noviembre de 2026.',
  },
];

export default function Privacy() {
  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-[900px] mx-auto px-gutter py-margin">
        <p className="font-code-badge text-code-badge text-secondary tracking-wider uppercase">// Aviso de Privacidad</p>
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-space-sm">
          Aviso de Privacidad Integral
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-sm leading-relaxed">
          Portal Informática Destaca — Licenciatura en Informática, Universidad Mexiquense del Bicentenario (UES Ixtlahuaca).
        </p>
        <div className="flex flex-col gap-space-lg mt-space-lg">
          {sections.map((s) => (
            <section key={s.title} className="bg-surface-container/70 border border-outline-variant/20 rounded-xl p-space-lg">
              <h2 className="font-title-md text-title-md text-on-surface font-bold">{s.title}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-space-xs">{s.body}</p>
            </section>
          ))}
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-lg">
          ¿Dudas sobre tus datos? Escríbenos a{' '}
          <a className="text-secondary hover:underline" href="mailto:informatica.destaca@universidad.edu">informatica.destaca@universidad.edu</a>
          {' '}o <Link className="text-secondary hover:underline" to="/">vuelve al inicio</Link>.
        </p>
      </div>
    </main>
  );
}
