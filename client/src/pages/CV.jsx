import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentsApi } from '../services/api';
import { initials } from '../components/StudentCard';
import { withStudentPhoto } from '../data/stitchImages';

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatYear(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return String(d.getFullYear());
}

const historyLabels = { achievement: 'Logro', participation: 'Participación', certification: 'Certificación' };

// CV digital imprimible con los tokens de Stitch (sin folio, hash, QR ni
// firma: nada de eso existe en la BD). Conserva el botón de imprimir/guardar PDF.
export default function CV() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    studentsApi.get(id).then((s) => setStudent(s && withStudentPhoto(s))).catch(() => setError('No se pudo cargar el CV.'));
  }, [id]);

  // Fade de entrada al llegar el CV; solo afecta a la vista en pantalla
  // (los estilos de impresión quedan intactos, con print:opacity-100).
  useEffect(() => {
    if (student) setMounted(true);
  }, [student]);

  if (error) return <p className="p-8 text-error">{error}</p>;
  if (!student) return <p className="p-8 text-on-surface-variant">Cargando CV...</p>;

  const photo = student.photoUrl || student.avatarUrl;
  const skills = student.skills || [];
  const interests = student.interests || [];
  const projects = student.projects || [];
  const certifications = student.certifications || [];
  const achievements = student.achievements || [];
  const participations = student.participations || [];
  const history = student.history || [];

  return (
    <div className={`w-full bg-background min-h-screen pt-20 transition-opacity duration-700 print:opacity-100 print:bg-white ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[128px] pointer-events-none print:hidden"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[140px] pointer-events-none print:hidden"></div>
        <section className="max-w-3xl mx-auto px-margin pt-space-lg pb-space-xl w-full">
          <div className="flex flex-wrap justify-between items-center gap-space-sm print:hidden">
            <Link to={`/estudiantes/${student.id}`} className="inline-flex items-center gap-1 font-code-badge text-code-badge text-secondary hover:underline">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              VOLVER AL PERFIL
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-90 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              Descargar / Imprimir PDF
            </button>
          </div>

          <article className="bg-surface-container-low rounded-xl p-space-lg shadow-2xl mt-space-md flex flex-col gap-space-md print:bg-white print:shadow-none print:border print:border-slate-200">
            {/* CABECERA DEL DOCUMENTO */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm bg-surface-container-lowest -mx-space-lg -mt-space-lg px-space-lg pt-space-lg print:bg-white print:border-b print:border-slate-200">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[24px] print:text-emerald-700">verified</span>
                <div>
                  <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">EXPEDIENTE VERIFICADO // UMB-CONAIC</span>
                  <p className="font-code-badge text-code-badge text-on-surface-variant font-mono print:text-slate-500">CURRÍCULUM VITAE DIGITAL</p>
                </div>
              </div>
              <span className="font-code-badge text-code-badge bg-surface-container text-tertiary px-2.5 py-1 rounded print:bg-emerald-50 print:text-emerald-700 print:border print:border-emerald-200">PERFIL PUBLICADO</span>
            </div>

            {/* IDENTIFICACIÓN */}
            <header className="flex flex-col sm:flex-row gap-space-md items-start">
              <div className="relative shrink-0">
                {photo ? (
                  <img className="w-28 h-28 rounded-xl object-cover shadow-xl" src={photo} alt={`Foto de ${student.publicName}`} />
                ) : (
                  <span className="w-28 h-28 rounded-xl shadow-xl bg-gradient-to-br from-primary-container via-secondary to-tertiary text-on-primary flex items-center justify-center font-bold text-4xl">
                    {initials(student.publicName)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight print:text-slate-900">{student.publicName}</h1>
                <p className="font-title-md text-title-md text-secondary font-medium print:text-slate-700">
                  Licenciatura en Informática{student.semester ? ` • ${student.semester}° Semestre` : ''}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant print:text-slate-600">Universidad Mexiquense del Bicentenario — Unidad Académica Ixtlahuaca</p>
                <p className="font-body-md text-body-md text-on-surface-variant print:text-slate-600">
                  {student.generation ? `Generación ${student.generation}` : ''}{student.generation && student.academicStatus ? ' • ' : ''}{student.academicStatus || ''}
                </p>
              </div>
            </header>

            {/* RESUMEN */}
            <section className="bg-surface-container p-space-md rounded-xl print:bg-white print:border print:border-slate-200 print:break-inside-avoid">
              <div className="flex items-center gap-1.5 text-secondary font-code-badge text-code-badge uppercase mb-1 print:text-slate-700">
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                Resumen Técnico &amp; Perfil Profesional
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed print:text-slate-700">{student.bio || 'Sin resumen publicado.'}</p>
            </section>

            {/* HABILIDADES E INTERESES */}
            <section className="bg-surface-container-lowest p-space-md rounded-xl print:bg-white print:border print:border-slate-200 print:break-inside-avoid">
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">Habilidades &amp; Competencias</span>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s, i) => (
                    <span key={s} className={`px-2.5 py-1 rounded bg-surface-container font-code-badge text-code-badge print:bg-slate-100 print:text-slate-700 ${i % 4 === 0 ? 'text-secondary' : i % 4 === 3 ? 'text-primary' : 'text-on-surface'}`}>{s}</span>
                  ))}
                </div>
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 print:text-slate-500">Sin habilidades registradas.</p>
              )}
              {interests.length > 0 && (
                <>
                  <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold block mt-space-md mb-2 print:text-slate-700">Áreas de Interés</span>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded bg-surface-container text-tertiary font-code-badge text-code-badge print:bg-slate-100 print:text-slate-700">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* PROYECTOS */}
            <section className="print:break-inside-avoid">
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">Proyectos Destacados en Portafolio</span>
              <div className="grid grid-cols-1 gap-space-sm mt-2">
                {projects.map((p) => (
                  <div key={p.id} className="p-space-md rounded-xl bg-surface-container flex flex-col gap-1 print:bg-white print:border print:border-slate-200">
                    <div className="flex items-center justify-between gap-space-xs">
                      <span className="font-title-md text-title-md font-bold text-on-surface print:text-slate-900">{p.title}</span>
                      {(p.technologies || [])[0] && (
                        <span className="font-code-badge text-code-badge bg-tertiary/10 text-tertiary px-2 py-0.5 rounded font-semibold shrink-0 print:bg-emerald-50 print:text-emerald-700">{p.technologies[0]}</span>
                      )}
                    </div>
                    {p.description && <p className="font-body-md text-body-md text-on-surface-variant print:text-slate-600">{p.description}</p>}
                    {(p.url || (p.technologies || []).length > 0) && (
                      <p className="font-code-badge text-code-badge text-outline pt-1 print:text-slate-500">
                        {p.url && <a className="text-secondary hover:underline break-all print:text-slate-700" href={p.url} target="_blank" rel="noreferrer">{p.url}</a>}
                        {p.url && (p.technologies || []).length > 0 && ' • '}
                        {(p.technologies || []).length > 0 && p.technologies.join(' • ')}
                      </p>
                    )}
                  </div>
                ))}
                {projects.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant print:text-slate-500">Sin proyectos registrados.</p>}
              </div>
            </section>

            {/* CERTIFICACIONES */}
            <section className="print:break-inside-avoid">
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">Certificaciones &amp; Cursos</span>
              <ul className="mt-2 space-y-2">
                {certifications.map((c) => (
                  <li key={c.id} className="font-body-md text-body-md text-on-surface print:text-slate-900">
                    {c.title} — <span className="text-on-surface-variant print:text-slate-600">{c.issuer}{formatYear(c.date) ? ` (${formatYear(c.date)})` : ''}</span>
                    {c.url && <> (<a className="text-secondary hover:underline print:text-slate-700" href={c.url} target="_blank" rel="noreferrer">ver</a>)</>}
                  </li>
                ))}
                {certifications.length === 0 && <li className="font-body-md text-body-md text-on-surface-variant print:text-slate-500">Sin certificaciones registradas.</li>}
              </ul>
            </section>

            {/* LOGROS */}
            <section className="print:break-inside-avoid">
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">Reconocimientos</span>
              <ul className="mt-2 space-y-2">
                {achievements.map((a) => (
                  <li key={a.id} className="font-body-md text-body-md text-on-surface print:text-slate-900">
                    {a.title} — <span className="text-on-surface-variant print:text-slate-600">{a.category}{a.institution ? ` • ${a.institution}` : ''}{formatDate(a.date) ? ` (${formatDate(a.date)})` : ''}</span>
                    {a.description && <p className="text-on-surface-variant print:text-slate-600">{a.description}</p>}
                  </li>
                ))}
                {achievements.length === 0 && <li className="font-body-md text-body-md text-on-surface-variant print:text-slate-500">Sin logros aprobados registrados.</li>}
              </ul>
            </section>

            {/* PARTICIPACIONES */}
            <section className="print:break-inside-avoid">
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">Participaciones en Eventos</span>
              <ul className="mt-2 space-y-2">
                {participations.map((p) => (
                  <li key={p.id} className="font-body-md text-body-md text-on-surface print:text-slate-900">
                    {p.event?.title || 'Evento'} — <span className="text-on-surface-variant print:text-slate-600">{p.type}{p.result ? ` • ${p.result}` : ''}{formatDate(p.date) ? ` • ${formatDate(p.date)}` : ''}</span>
                  </li>
                ))}
                {participations.length === 0 && <li className="font-body-md text-body-md text-on-surface-variant print:text-slate-500">Sin participaciones aprobadas registradas.</li>}
              </ul>
            </section>

            {/* HISTORIAL CRONOLÓGICO */}
            <section className="print:break-inside-avoid">
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold print:text-slate-700">Historial Cronológico</span>
              <ol className="mt-4 space-y-4 border-l-2 border-primary-container/40 pl-4">
                {history.map((h, i) => (
                  <li key={i}>
                    <p className="font-code-badge text-code-badge text-on-surface-variant print:text-slate-500">{formatDate(h.date)}</p>
                    <p className="font-label-md text-label-md text-on-surface font-semibold print:text-slate-900">{h.title}</p>
                    {h.description && <p className="font-body-md text-body-md text-on-surface-variant print:text-slate-600">{h.description}</p>}
                    <span className="font-code-badge text-code-badge bg-surface-container px-2 py-0.5 rounded text-secondary print:bg-slate-100 print:text-slate-700">{historyLabels[h.type] || h.category || h.type}</span>
                  </li>
                ))}
                {history.length === 0 && <li className="font-body-md text-body-md text-on-surface-variant print:text-slate-500">Sin historial todavía.</li>}
              </ol>
            </section>
          </article>
          <p className="font-code-badge text-code-badge text-on-surface-variant mt-3 print:hidden">Para descargar el PDF usa el botón y elige “Guardar como PDF” en el diálogo de impresión.</p>
        </section>
      </div>
    </div>
  );
}
