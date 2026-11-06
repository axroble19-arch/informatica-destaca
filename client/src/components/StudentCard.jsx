import TiltCard from './TiltCard';

export function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Tarjeta de candidato del directorio (markup de Stitch: pantalla Perfiles y CVs).
// Sin foto real se usan iniciales con gradiente; nunca fotos inventadas.
const chipColors = ['text-secondary', 'text-on-surface', 'text-on-surface', 'text-primary'];

export default function StudentCard({ student, selected = false, onSelect }) {
  const photo = student.photoUrl || student.avatarUrl;
  const achievementsCount = (student.achievements || []).length;
  const skills = (student.skills || []).slice(0, 4);
  const interests = student.interests || [];
  const subtitle = [
    student.semester ? `${student.semester}° Semestre` : null,
    interests[0] || (student.generation ? `Generación ${student.generation}` : null) || student.academicStatus || 'Licenciatura en Informática',
  ]
    .filter(Boolean)
    .join(' • ');
  const badge = student.semester
    ? `SEM ${student.semester}`
    : student.generation
      ? `GEN ${student.generation}`
      : `${achievementsCount} LOGROS`;

  return (
    <TiltCard
      className={`student-card cursor-pointer rounded-xl p-space-md shadow transition-all duration-300 relative overflow-hidden group border border-transparent hover:shadow-xl hover:border-secondary/30 ${
        selected ? 'bg-surface-container-high shadow-md' : 'bg-surface-container-low hover:bg-surface-container'
      }`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } } : undefined}
    >
      {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <div className="flex items-start gap-space-sm">
        <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
          {photo ? (
            <img className="w-14 h-14 rounded-lg object-cover transition-all duration-300 group-hover:ring-2 group-hover:ring-secondary/50 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]" src={photo} alt={`Foto de ${student.publicName}`} />
          ) : (
            <span className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary-container via-secondary to-tertiary text-on-primary flex items-center justify-center font-bold text-lg transition-all duration-300 group-hover:ring-2 group-hover:ring-secondary/50 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]">
              {initials(student.publicName)}
            </span>
          )}
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-tertiary shadow-[0_0_8px_#45dfa4] animate-pulse"></span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{student.publicName}</h3>
            <span className="font-code-badge text-code-badge bg-surface-container-lowest text-secondary px-2 py-0.5 rounded font-mono shrink-0">{badge}</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant truncate">{subtitle}</p>
          <div className="flex items-center gap-space-xs mt-1 text-on-surface-variant font-code-badge text-code-badge">
            <span>{achievementsCount} {achievementsCount === 1 ? 'logro aprobado' : 'logros aprobados'}</span>
            <span>•</span>
            <span className="text-tertiary">Perfil verificado</span>
          </div>
          {skills.length > 0 && (
            <div className="flex items-center gap-1.5 mt-space-xs flex-wrap">
              {skills.map((s, i) => (
                <span key={s} className={`px-2 py-0.5 rounded bg-surface-container-lowest ${chipColors[i % chipColors.length]} font-code-badge text-code-badge`}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </TiltCard>
  );
}
