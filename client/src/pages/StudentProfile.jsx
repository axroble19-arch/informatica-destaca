import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentsApi } from '../services/api';
import { initials } from '../components/StudentCard';
import CountUp from '../components/CountUp';
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

// Visor del dossier / CV digital (panel derecho de Stitch: pantalla Perfiles y CVs).
// Solo datos reales de la API: sin folio, sin hash SHA-256, sin QR, sin barras de
// competencia y sin firma docente (nada de eso existe en la BD).
export function StudentDossier({ student, standalone = false }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animación de entrada del dossier (se monta al llegar el detalle del perfil).
  useEffect(() => {
    setMounted(true);
  }, []);
  const photo = student.photoUrl || student.avatarUrl;
  const achievements = student.achievements || [];
  const participations = student.participations || [];
  const projects = student.projects || [];
  const certifications = student.certifications || [];
  const skills = student.skills || [];
  const interests = student.interests || [];
  const projectIcons = ['hub', 'account_tree'];

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/estudiantes/${student.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible; el enlace permanece en la barra de direcciones.
    }
  };

  return (
    // Dossier fijo, sin tilt: el tilt anidado (dossier + chips) movía todo el
    // expediente al pasar el mouse y el texto se veía encimado.
    <div className={`bg-surface-container-low rounded-xl p-space-lg shadow-2xl flex flex-col gap-space-md relative overflow-hidden transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* CABECERA DEL DOCUMENTO */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm bg-surface-container-lowest -mx-space-lg -mt-space-lg px-space-lg pt-space-lg">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-secondary text-[24px] anim-float">verified</span>
          <div>
            <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">EXPEDIENTE VERIFICADO // UMB-CONAIC</span>
            <p className="font-code-badge text-code-badge text-on-surface-variant font-mono">LICENCIATURA EN INFORMÁTICA • UMB IXTLAHUACA</p>
          </div>
        </div>
        {/* BOTONES DE EXPORTACIÓN Y CONTACTO */}
        <div className="flex items-center gap-space-xs">
          <Link
            to={`/estudiantes/${student.id}/cv`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Descargar PDF
          </Link>
          <button
            className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
            onClick={shareLink}
            title="Copiar enlace verificado"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'share'}</span>
          </button>
        </div>
      </div>

      {/* BLOQUE DE IDENTIFICACIÓN DEL ESTUDIANTE */}
      <div className="flex flex-col sm:flex-row gap-space-md items-start">
        <div className="relative shrink-0">
          {photo ? (
            <img className="w-28 h-28 rounded-xl object-cover shadow-xl" src={photo} alt={`Foto de ${student.publicName}`} />
          ) : (
            <span className="w-28 h-28 rounded-xl shadow-xl bg-gradient-to-br from-primary-container via-secondary to-tertiary text-on-primary flex items-center justify-center font-bold text-4xl">
              {initials(student.publicName)}
            </span>
          )}
          <div className="absolute -bottom-2 -right-2 bg-surface-container-highest px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-code-badge text-code-badge text-tertiary">PUBLICADO</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-space-xs">
            <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">{student.publicName}</h2>
            <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded font-mono font-bold text-secondary text-headline-sm">
              <span><CountUp target={achievements.length} start={mounted} /></span>
              <span className="font-code-badge text-code-badge text-on-surface-variant">logros aprobados</span>
            </div>
          </div>
          <p className="font-title-md text-title-md text-secondary font-medium">
            Licenciatura en Informática{student.semester ? ` • ${student.semester}° Semestre` : ''}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">Universidad Mexiquense del Bicentenario — Unidad Académica Ixtlahuaca</p>
          {/* METADATA: telemetría con brillo secuencial (mismo sistema del Home) */}
          <div className="flex flex-wrap items-center gap-space-xs mt-space-xs text-on-surface-variant font-code-badge text-code-badge">
            <div className="stat-card-glow-1 bg-surface-container-lowest px-2 py-1 rounded font-mono">{participations.length} Participaciones</div>
            <div className="stat-card-glow-2 bg-surface-container-lowest px-2 py-1 rounded text-tertiary">{projects.length} Proyectos</div>
            <div className="stat-card-glow-3 bg-surface-container-lowest px-2 py-1 rounded text-primary">{certifications.length} Certificaciones</div>
            {student.generation && <div className="stat-card-glow-4 bg-surface-container-lowest px-2 py-1 rounded font-mono">Generación {student.generation}</div>}
          </div>
        </div>
      </div>

      {/* RESUMEN EJECUTIVO / BIO TÉCNICA */}
      <div className="bg-surface-container p-space-md rounded-xl">
        <div className="flex items-center gap-1.5 text-secondary font-code-badge text-code-badge uppercase mb-1">
          <span className="material-symbols-outlined text-[16px]">terminal</span>
          Resumen Técnico &amp; Perfil Profesional
        </div>
        <p className="font-body-md text-body-md text-on-surface leading-relaxed">
          {student.bio || 'Sin resumen publicado.'}
        </p>
        {student.academicStatus && (
          <p className="font-code-badge text-code-badge text-on-surface-variant mt-2">ESTATUS ACADÉMICO: {student.academicStatus}</p>
        )}
      </div>

      {/* HABILIDADES E INTERESES (chips con skills reales; sin barras de competencia: la BD no tiene porcentajes) */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Habilidades &amp; Competencias</span>
          <span className="font-code-badge text-code-badge text-on-surface-variant">{skills.length} registradas</span>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl">
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span key={s} className={`px-2.5 py-1 rounded bg-surface-container font-code-badge text-code-badge transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-container-high ${i % 4 === 0 ? 'text-secondary' : i % 4 === 3 ? 'text-primary' : 'text-on-surface'}`}>{s}</span>
              ))}
            </div>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">Sin habilidades registradas.</p>
          )}
          {interests.length > 0 && (
            <>
              <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold block mt-space-md mb-2">Áreas de Interés</span>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded bg-surface-container text-tertiary font-code-badge text-code-badge transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-container-high">{s}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PROYECTOS CLAVE & PRODUCCIÓN DE SOFTWARE */}
      <div className="flex flex-col gap-space-xs">
        <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Proyectos Destacados en Portafolio</span>
        <div className="grid grid-cols-1 gap-space-sm">
          {projects.map((p, i) => (
            <div key={p.id} className="group p-space-md rounded-xl bg-surface-container flex flex-col gap-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className={`material-symbols-outlined ${i % 2 === 0 ? 'text-secondary' : 'text-primary'} text-[20px] transition-transform duration-300 group-hover:scale-110`}>{projectIcons[i % projectIcons.length]}</span>
                  <span className="font-title-md text-title-md font-bold text-on-surface">{p.title}</span>
                </div>
                {(p.technologies || [])[0] && (
                  <span className="font-code-badge text-code-badge bg-tertiary/10 text-tertiary px-2 py-0.5 rounded font-semibold">{p.technologies[0]}</span>
                )}
              </div>
              {p.description && <p className="font-body-md text-body-md text-on-surface-variant">{p.description}</p>}
              {(p.url || (p.technologies || []).length > 0) && (
                <div className="flex items-center gap-space-xs font-code-badge text-code-badge text-outline pt-1 flex-wrap">
                  {p.url && <a className="text-secondary hover:underline break-all" href={p.url} target="_blank" rel="noreferrer">{p.url}</a>}
                  {p.url && (p.technologies || []).length > 0 && <span>•</span>}
                  {(p.technologies || []).length > 0 && <span>{p.technologies.join(' • ')}</span>}
                </div>
              )}
            </div>
          ))}
          {projects.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container p-space-md rounded-xl">Sin proyectos registrados.</p>
          )}
        </div>
      </div>

      {/* CERTIFICACIONES */}
      <div className="flex flex-col gap-space-xs">
        <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Certificaciones &amp; Cursos</span>
        <div className="grid grid-cols-1 gap-space-sm">
          {certifications.map((c) => (
            <div key={c.id} className="group p-space-md rounded-xl bg-surface-container flex items-start gap-space-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 transition-transform duration-300 group-hover:scale-110">verified</span>
              <div className="flex-1 min-w-0">
                <p className="font-title-md text-title-md font-bold text-on-surface">{c.title}</p>
                <p className="font-body-md text-body-md text-on-surface-variant">{c.issuer}{formatYear(c.date) ? ` • ${formatYear(c.date)}` : ''}</p>
              </div>
              {c.url && (
                <a className="font-code-badge text-code-badge text-secondary hover:underline shrink-0" href={c.url} target="_blank" rel="noreferrer">Ver</a>
              )}
            </div>
          ))}
          {certifications.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container p-space-md rounded-xl">Sin certificaciones registradas.</p>
          )}
        </div>
      </div>

      {/* LOGROS APROBADOS */}
      <div className="flex flex-col gap-space-xs">
        <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Logros &amp; Reconocimientos</span>
        <div className="grid grid-cols-1 gap-space-sm">
          {achievements.map((a) => (
            <div key={a.id} className="group p-space-md rounded-xl bg-surface-container flex items-start gap-space-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 transition-transform duration-300 group-hover:scale-110">military_tech</span>
              <div className="flex-1 min-w-0">
                <p className="font-title-md text-title-md font-bold text-on-surface">{a.title}</p>
                {a.description && <p className="font-body-md text-body-md text-on-surface-variant">{a.description}</p>}
                <p className="font-code-badge text-code-badge text-outline pt-1">
                  {a.category}{a.institution ? ` • ${a.institution}` : ''}{formatDate(a.date) ? ` • ${formatDate(a.date)}` : ''}
                </p>
              </div>
            </div>
          ))}
          {achievements.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container p-space-md rounded-xl">Sin logros aprobados registrados.</p>
          )}
        </div>
      </div>

      {/* HISTORIAL DE PARTICIPACIONES APROBADAS */}
      <div className="flex flex-col gap-space-xs">
        <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Historial de Participaciones</span>
        <div className="grid grid-cols-1 gap-space-sm">
          {participations.map((p) => (
            <div key={p.id} className="group p-space-md rounded-xl bg-surface-container flex items-start gap-space-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 transition-transform duration-300 group-hover:scale-110">event</span>
              <div className="flex-1 min-w-0">
                <p className="font-title-md text-title-md font-bold text-on-surface">{p.event?.title || 'Evento'}</p>
                {p.description && <p className="font-body-md text-body-md text-on-surface-variant">{p.description}</p>}
                <p className="font-code-badge text-code-badge text-outline pt-1">
                  {p.type}{p.result ? ` • ${p.result}` : ''}{formatDate(p.date) ? ` • ${formatDate(p.date)}` : ''}
                </p>
              </div>
            </div>
          ))}
          {participations.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container p-space-md rounded-xl">Sin participaciones aprobadas registradas.</p>
          )}
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex flex-wrap items-center gap-space-sm pt-space-sm">
        <Link
          to={`/estudiantes/${student.id}/cv`}
          className="flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-md text-label-md shadow-xl hover:opacity-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Ver CV digital completo
        </Link>
        {standalone && (
          <Link
            to="/estudiantes"
            className="flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary font-label-md text-label-md transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al directorio
          </Link>
        )}
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    studentsApi.get(id).then((s) => setStudent(s && withStudentPhoto(s))).catch(() => setError('Estudiante no encontrado.'));
  }, [id]);

  if (error) return <p className="p-8 text-error">{error}</p>;
  if (!student) return <p className="p-8 text-on-surface-variant">Cargando perfil...</p>;

  return (
    <div className="w-full bg-background min-h-screen pt-20">
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[140px] pointer-events-none"></div>
        <section className="max-w-[1440px] mx-auto px-margin pt-space-lg pb-space-xl w-full">
          <Link to="/estudiantes" className="inline-flex items-center gap-1 font-code-badge text-code-badge text-secondary hover:underline mb-space-md">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            DIRECTORIO DE TALENTO
          </Link>
          <StudentDossier student={student} standalone />
        </section>
      </div>
    </div>
  );
}
