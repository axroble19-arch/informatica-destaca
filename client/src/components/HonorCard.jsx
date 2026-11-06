import { initials } from './StudentCard';
import TiltCard from './TiltCard';

// ---------------------------------------------------------------------------
// Tarjeta reutilizable del Cuadro de Honor (Stitch: `.student-card` del
// directorio, "Nómina General de Alumnos Laureados").
// Los datos son reales: el estudiante llega enriquecido desde HonorBoard
// (approvedCount, participationCount, approvedAchievements, topAchievement).
// Sin promedios/GPA, sin folios y sin fotos inventadas: si no hay photoUrl /
// avatarUrl se muestran las iniciales con gradiente.
// ---------------------------------------------------------------------------

export function formatHonorDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Avatar con foto real o iniciales con gradiente (resuelve los
// src="placeholder" de Stitch; nunca se inventa una foto).
export function StudentAvatar({ student, className = '', textClassName = 'text-lg' }) {
  const photo = student.photoUrl || student.avatarUrl;
  if (photo) {
    return <img className={className} src={photo} alt={`Retrato de ${student.publicName}`} />;
  }
  return (
    <span
      className={`${className} bg-gradient-to-br from-primary-container via-secondary to-tertiary text-on-primary font-bold flex items-center justify-center ${textClassName}`}
      aria-hidden="true"
    >
      {initials(student.publicName)}
    </span>
  );
}

// Clases completas (literales) por acento: el ciclo de Stitch es
// secondary -> primary -> tertiary según la posición en el grid.
const ACCENTS = {
  secondary: {
    chip: 'bg-secondary/10 border border-secondary/30 text-secondary',
    hoverBorder: 'hover:border-secondary/50',
    titleHover: 'group-hover:text-secondary',
    dot: 'bg-secondary',
    btnHover: 'hover:bg-secondary/20 hover:text-secondary',
    icon: 'text-secondary',
    line: 'via-secondary/60',
  },
  primary: {
    chip: 'bg-primary/10 border border-primary/30 text-primary',
    hoverBorder: 'hover:border-primary/50',
    titleHover: 'group-hover:text-primary',
    dot: 'bg-primary',
    btnHover: 'hover:bg-primary/20 hover:text-primary',
    icon: 'text-primary',
    line: 'via-primary/60',
  },
  tertiary: {
    chip: 'bg-tertiary/10 border border-tertiary/30 text-tertiary',
    hoverBorder: 'hover:border-tertiary/50',
    titleHover: 'group-hover:text-tertiary',
    dot: 'bg-tertiary',
    btnHover: 'hover:bg-tertiary/20 hover:text-tertiary',
    icon: 'text-tertiary',
    line: 'via-tertiary/60',
  },
};

export default function HonorCard({ student, accent = 'secondary', onOpen }) {
  const a = ACCENTS[accent] || ACCENTS.secondary;
  const top = student.topAchievement || null;
  const tags = (student.skills?.length ? student.skills : student.interests || []).slice(0, 3);
  const subtitle = top
    ? `${top.category}${top.relatedEvent ? ` · ${top.relatedEvent}` : ''}`
    : (student.academicStatus || '');
  const description = student.bio || top?.description || '';

  return (
    <TiltCard className={`student-card h-full relative overflow-hidden bg-surface-container-low/80 backdrop-blur-md rounded-xl border border-outline-variant/30 ${a.hoverBorder} transition-all duration-300 p-space-md flex flex-col justify-between group hover:shadow-[0_18px_40px_rgba(0,0,0,0.6)]`}>
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${a.line} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div>
        <div className="flex items-start justify-between">
          <div className="relative transition-transform duration-500 group-hover:scale-105">
            <StudentAvatar
              student={student}
              className="w-14 h-14 rounded-lg object-cover border border-outline-variant/40"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${a.dot} rounded-full border-2 border-surface-container-lowest`}
              title={student.academicStatus || 'Estudiante'}
            />
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-2 py-0.5 rounded ${a.chip} font-mono text-[13px] font-bold`}>
              {student.approvedCount} {student.approvedCount === 1 ? 'logro' : 'logros'}
            </span>
            <span className="font-code-badge text-[10px] text-on-surface-variant font-mono mt-0.5">
              {student.semester ? `${student.semester}° Semestre` : 'Semestre no registrado'}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <h4 className={`font-title-md text-title-md text-on-surface font-bold ${a.titleHover} transition-colors`}>{student.publicName}</h4>
          {subtitle && <p className={`font-code-badge text-code-badge ${a.icon}`}>{subtitle}</p>}
          {description && (
            <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-2 leading-snug">
              {description}
            </p>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[10px]">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-mono text-on-surface-variant">
          <span className={`material-symbols-outlined text-[14px] transition-transform duration-300 group-hover:scale-125 ${a.icon}`}>event</span>
          <span>Último logro: {top ? formatHonorDate(top.date) : '—'}</span>
        </div>
        <button
          type="button"
          className={`p-1.5 rounded-lg bg-surface-container-high ${a.btnHover} text-on-surface transition-all duration-300 hover:scale-110`}
          onClick={onOpen}
          title="Ver Expediente"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </button>
      </div>
    </TiltCard>
  );
}
