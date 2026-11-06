import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { achievementsApi, eventsApi, participationsApi, studentsApi } from '../services/api';
import CountUp from '../components/CountUp';
import TiltCard from '../components/TiltCard';
import HonorCard, { StudentAvatar, formatHonorDate } from '../components/HonorCard';
import AutoCarousel from '../components/AutoCarousel';
import { portraitForStudent } from '../data/stitchImages';

// ---------------------------------------------------------------------------
// CUADRO DE HONOR — port fiel de Stitch
// (stitch-export/.../cuadro_de_honor_inform_tica_destaca_directorio_excelencia)
// El header y el footer NO van aquí: los porta el coordinador (Navbar/App).
// Esta página empieza en el <main> de Stitch.
//
// DATOS REALES (nada de ejemplo de Stitch):
// - studentsApi.list()      -> estudiantes con consentToPublish (incluye los
//   ids de sus logros APROBADOS). La API pública de logros SOLO devuelve
//   status APPROVED, así que todo lo publicado aquí ya está aprobado.
// - achievementsApi.list()  -> logros aprobados con su estudiante.
// - participationsApi.list()-> participaciones aprobadas (desempate).
// - eventsApi.list()        -> eventos (métrica del encabezado).
// Ranking: nº de logros APROBADOS desc, desempate por nº de participaciones
// aprobadas, luego alfabético. Sin GPA/promedios (no existen en la BD),
// sin folios, sin hashes SHA-256, sin fotos inventadas (iniciales).
// ---------------------------------------------------------------------------

const SORT_LABELS = {
  achievements: 'MÁS LOGROS APROBADOS',
  name: 'ALFABÉTICO (A-Z)',
  semester: 'SEMESTRE DESCENDENTE',
  participations: 'MÁS PARTICIPACIONES',
};

function rankCompare(a, b) {
  if (b.approvedCount !== a.approvedCount) return b.approvedCount - a.approvedCount;
  if (b.participationCount !== a.participationCount) return b.participationCount - a.participationCount;
  return a.publicName.localeCompare(b.publicName, 'es');
}

// --- Podio (Stitch, sección 2): 3 variantes de tarjeta, una por lugar. ---
const PODIUM = {
  1: {
    accent: 'secondary',
    badge: '1ER LUGAR · EXCELENCIA SUPREMA',
    medal: 'MEDALLA ORO',
  },
  2: {
    accent: 'primary',
    badge: '2° LUGAR · PLATA',
    badgeClass: 'bg-primary/20 border-b border-l border-primary/40 text-primary',
    avatarBorder: 'border-primary/40',
    avatarShadow: 'shadow-[0_0_15px_rgba(192,193,255,0.2)]',
    subtitleClass: 'text-primary',
    nameHover: 'group-hover:text-primary',
    chipClass: 'bg-primary/20 text-primary',
    sparkClass: 'text-primary',
    sparkDot: 'fill-primary',
    btnHover: 'hover:bg-primary/20 hover:border-primary/50',
  },
  3: {
    accent: 'tertiary',
    badge: '3ER LUGAR · BRONCE',
    badgeClass: 'bg-tertiary/20 border-b border-l border-tertiary/40 text-tertiary',
    avatarBorder: 'border-tertiary/40',
    avatarShadow: 'shadow-[0_0_15px_rgba(69,223,164,0.2)]',
    subtitleClass: 'text-tertiary',
    nameHover: 'group-hover:text-tertiary',
    chipClass: 'bg-tertiary/20 text-tertiary',
    sparkClass: 'text-tertiary',
    sparkDot: 'fill-tertiary',
    btnHover: 'hover:bg-tertiary/20 hover:border-tertiary/50',
  },
};

function PodiumTags({ student, centered = false, hero = false }) {
  const tags = (student.skills?.length ? student.skills : student.interests || []).slice(0, 4);
  if (tags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${centered ? 'justify-center' : ''}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={hero
            ? 'px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-[11px] font-mono border border-secondary/30 font-semibold'
            : 'px-2.5 py-1 rounded-md bg-surface-container-highest/80 text-on-surface text-[11px] font-mono border border-outline-variant/20'}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function PodiumSparkline({ student, hero = false, sparkClass = 'text-primary', dotClass = 'fill-primary' }) {
  return (
    <div className={hero
      ? 'bg-surface-container-lowest/80 p-3 rounded-xl border border-secondary/30 flex flex-col gap-1.5'
      : 'bg-surface-container-highest/40 p-2.5 rounded-lg border border-outline-variant/20 flex flex-col gap-1'}
    >
      <div className="flex justify-between items-center font-code-badge text-[10px]">
        <span className="text-on-surface-variant uppercase">Logros aprobados</span>
        <span className={`${hero ? 'text-secondary font-mono font-bold' : `${sparkClass} font-mono font-semibold`}`}>
          {student.approvedCount} {student.approvedCount === 1 ? 'LOGRO' : 'LOGROS'}
        </span>
      </div>
      {hero ? (
        <svg className="w-full h-10 overflow-visible" viewBox="0 0 240 36">
          <path className="text-secondary sparkline-animated" d="M 0,30 L 35,28 L 70,22 L 105,18 L 140,12 L 175,10 L 210,4 L 240,2" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle className="fill-secondary animate-ping" cx="240" cy="2" r="3.5" />
          <circle className="fill-secondary" cx="240" cy="2" r="3.5" />
        </svg>
      ) : (
        <svg className="w-full h-8 overflow-visible" viewBox="0 0 200 32">
          <path className={`${sparkClass} sparkline-animated`} d="M 0,26 L 30,22 L 60,24 L 90,14 L 120,18 L 150,8 L 180,6 L 200,4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle className={`${dotClass} animate-ping`} cx="200" cy="4" r="3" />
          <circle className={dotClass} cx="200" cy="4" r="3" />
        </svg>
      )}
    </div>
  );
}

function PodiumCard({ student, rank, onOpen }) {
  const cfg = PODIUM[rank];
  const top = student.topAchievement || null;
  const bio = student.bio || top?.description || '';
  const mention = top ? `Mención ${top.category}` : '';

  // 1ER LUGAR: héroe del podio (Stitch, tarjeta central con gradiente).
  if (rank === 1) {
    return (
      <div className="lg:col-span-4 order-1 lg:order-2 lg:-translate-y-3">
      <TiltCard className="h-full flex flex-col bg-gradient-to-b from-surface-container-high via-surface-container to-surface-container-lowest backdrop-blur-xl rounded-2xl border-2 border-secondary/50 shadow-[0_0_40px_rgba(93,230,255,0.22)] hover:shadow-[0_0_55px_rgba(93,230,255,0.35)] transition-shadow duration-300 p-space-lg justify-between relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-secondary to-primary-container text-on-primary rounded-bl-xl font-code-badge text-code-badge font-bold flex items-center gap-1.5 shadow-md">
          <span className="material-symbols-outlined text-[16px] anim-trophy">military_tech</span>
          <span>{cfg.badge}</span>
        </div>
        <div className="flex flex-col gap-space-md relative z-10">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl p-1 bg-gradient-to-br from-secondary via-primary to-tertiary shadow-[0_0_25px_rgba(93,230,255,0.4)]">
                <StudentAvatar
                  student={student}
                  className="w-full h-full rounded-xl object-cover"
                  textClassName="text-3xl"
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-surface-container-lowest border border-secondary text-secondary font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <span className="material-symbols-outlined text-[14px]">award_star</span>
                <span>{cfg.medal}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">{student.publicName}</h3>
                <span className="material-symbols-outlined text-secondary text-[20px]" title="Identidad Verificada">verified</span>
              </div>
              {top && <span className="font-label-md text-label-md text-secondary font-semibold">{top.title}</span>}
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 rounded-full bg-secondary/20 border border-secondary/50 text-secondary font-mono text-[14px] font-extrabold shadow-[0_0_12px_rgba(93,230,255,0.25)]">
                  {student.approvedCount} {student.approvedCount === 1 ? 'logro aprobado' : 'logros aprobados'}
                </div>
                {student.semester && <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-code-badge text-code-badge">{student.semester}° Semestre</span>}
                <span className="text-tertiary font-code-badge text-code-badge font-semibold">N.º 1 del Cuadro</span>
              </div>
            </div>
          </div>
          {bio && (
            <p className="font-body-md text-body-md text-on-surface leading-relaxed text-center">
              {bio}
            </p>
          )}
          <PodiumTags student={student} centered hero />
          <PodiumSparkline student={student} hero />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-md border-t border-outline-variant/30 mt-space-md relative z-10">
          <button type="button" className="shimmer-effect w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-secondary to-primary-container text-on-primary font-label-md text-label-md font-bold transition-all text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(93,230,255,0.3)] cursor-pointer" onClick={onOpen}>
            <span>Expediente de Honor</span>
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </button>
          <Link to={`/estudiantes/${student.id}`} className="w-full sm:w-auto p-2.5 rounded-xl bg-surface-container-high hover:bg-secondary/20 text-secondary border border-secondary/40 transition-colors flex items-center justify-center gap-1" title="Ver perfil del estudiante">
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </Link>
        </div>
      </TiltCard>
      </div>
    );
  }

  // 2° / 3ER LUGAR: tarjeta lateral del podio (Stitch).
  return (
    <TiltCard className={`lg:col-span-4 flex flex-col ${rank === 2 ? 'order-2 lg:order-1' : 'order-3'} bg-surface-container-low/80 backdrop-blur-md rounded-2xl border border-outline-variant/40 ${cfg.accent === 'primary' ? 'hover:border-primary/40' : 'hover:border-tertiary/40'} transition-all duration-300 hover:shadow-[0_16px_35px_rgba(0,0,0,0.5)] p-space-lg justify-between relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 px-4 py-1.5 ${cfg.badgeClass} rounded-bl-xl font-code-badge text-code-badge font-bold flex items-center gap-1`}>
        <span className="material-symbols-outlined text-[16px] anim-trophy">{rank === 2 ? 'stars' : 'military_tech'}</span>
        <span>{cfg.badge}</span>
      </div>
      <div className="flex flex-col gap-space-md">
        <div className="flex items-start gap-space-md pt-2">
          <div className="relative shrink-0">
            <StudentAvatar
              student={student}
              className={`w-20 h-20 rounded-xl object-cover border-2 ${cfg.avatarBorder} ${cfg.avatarShadow}`}
              textClassName="text-xl"
            />
            {student.semester && (
              <span className={`absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded bg-surface-container-highest border border-outline-variant/40 font-mono text-[10px] ${cfg.subtitleClass} font-bold`}>{student.semester}° SEM</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h3 className={`font-title-md text-title-md text-on-surface font-bold ${cfg.nameHover} transition-colors`}>{student.publicName}</h3>
              <span className={`material-symbols-outlined ${cfg.subtitleClass} text-[16px]`}>verified</span>
            </div>
            {mention && <span className={`font-code-badge text-code-badge ${cfg.subtitleClass} font-semibold`}>{mention}</span>}
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded ${cfg.chipClass} font-mono text-[12px] font-bold`}>
                {student.approvedCount} {student.approvedCount === 1 ? 'logro' : 'logros'}
              </span>
              <span className="text-on-surface-variant font-code-badge text-code-badge">
                {student.generation ? `Gen. ${student.generation}` : (student.semester ? `${student.semester}° Semestre` : '')}
              </span>
            </div>
          </div>
        </div>
        {bio && (
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {bio}
          </p>
        )}
        <PodiumTags student={student} />
        <PodiumSparkline student={student} sparkClass={cfg.sparkClass} dotClass={cfg.sparkDot} />
      </div>
      <div className="flex items-center gap-space-sm pt-space-md border-t border-outline-variant/20 mt-space-md">
        <button type="button" className={`flex-1 py-2 px-3 rounded-lg bg-surface-container-high ${cfg.btnHover} border border-outline-variant/40 text-on-surface text-label-md font-label-md transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer`} onClick={onOpen}>
          <span>Ver Expediente</span>
          <span className="material-symbols-outlined text-[16px]">visibility</span>
        </button>
        <Link to={`/estudiantes/${student.id}`} className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-secondary border border-outline-variant/30 hover:border-secondary/40 transition-colors" title="Ver perfil del estudiante">
          <span className="material-symbols-outlined text-[18px]">verified</span>
        </Link>
      </div>
    </TiltCard>
  );
}

export default function HonorBoard() {
  const [students, setStudents] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [semesterFilter, setSemesterFilter] = useState('all');
  const [sort, setSort] = useState('achievements');
  const [view, setView] = useState('grid');
  const [category, setCategory] = useState('all');

  const [selected, setSelected] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applySent, setApplySent] = useState(false);
  // Postulación real: crea un logro en PENDING (POST /api/achievements/apply).
  const [applyForm, setApplyForm] = useState({ publicName: '', semester: '', category: 'Académico', title: '', evidenceUrl: '' });
  const [applyError, setApplyError] = useState('');
  const [applySending, setApplySending] = useState(false);

  // Contadores del encabezado: arrancan al entrar en viewport (como Home).
  // El efecto depende de `loading`: al montar, la vista muestra "Cargando…"
  // y el div de métricas aún no existe (statsRef es null); sin esta
  // dependencia el observador nunca se conectaba y los contadores se
  // quedaban en 0.
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStatsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  // Entrada escalonada de la nómina (como el stagger del Home).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      studentsApi.list(),
      achievementsApi.list(),
      eventsApi.list(),
      participationsApi.list(),
    ])
      .then(([studentsData, achievementsData, eventsData, participationsData]) => {
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setAchievements(Array.isArray(achievementsData) ? achievementsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setParticipations(Array.isArray(participationsData) ? participationsData : []);
      })
      .catch(() => setError('No se pudo cargar el Cuadro de Honor.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Cerrar modales con ESC (comportamiento de Stitch).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setApplyOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Estudiantes galardonados: solo los alumnos reales que Axel pasó
  // (con foto publicada en la BD), con >= 1 logro aprobado, ordenados por
  // logros aprobados (desempate: participaciones aprobadas, luego A-Z).
  // Los alumnos de ejemplo del seed (sin foto) NO aparecen en el Cuadro.
  const ranked = useMemo(() => {
    const byStudent = new Map();
    achievements.forEach((a) => {
      if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, []);
      byStudent.get(a.studentId).push(a);
    });
    const partCount = new Map();
    participations.forEach((p) => partCount.set(p.studentId, (partCount.get(p.studentId) || 0) + 1));
    return students
      .map((s) => {
        const approved = (byStudent.get(s.id) || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        return {
          ...s,
          // Retrato local de Stitch por id (determinista en todas las pantallas).
          photoUrl: portraitForStudent(s),
          // Foto real publicada en la BD (antes del retrato de Stitch).
          hasRealPhoto: Boolean(s.photoUrl),
          approvedAchievements: approved,
          approvedCount: approved.length,
          participationCount: partCount.get(s.id) || 0,
          topAchievement: approved[0] || null,
          categories: [...new Set(approved.map((a) => a.category))],
        };
      })
      .filter((s) => s.approvedCount > 0 && s.hasRealPhoto)
      .sort(rankCompare);
  }, [students, achievements, participations]);

  // Podio: los 3 primeros del ranking (ya solo hay alumnos reales).
  const podium = ranked.slice(0, 3);

  // Egresados con distinción (lista de cotejo 2.1): alumnos con
  // academicStatus "Egresado"/"Egresada" y >= 1 logro aprobado. No se exige
  // foto real: su retrato es la foto publicada o el retrato de Stitch.
  const isAlumni = (student) =>
    String(student?.academicStatus || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().startsWith('egresad');
  const alumniRanked = useMemo(() => {
    const byStudent = new Map();
    achievements.forEach((a) => {
      if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, []);
      byStudent.get(a.studentId).push(a);
    });
    const partCount = new Map();
    participations.forEach((p) => partCount.set(p.studentId, (partCount.get(p.studentId) || 0) + 1));
    return students
      .filter((s) => isAlumni(s))
      .map((s) => {
        const approved = (byStudent.get(s.id) || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        return {
          ...s,
          photoUrl: portraitForStudent(s),
          hasRealPhoto: Boolean(s.photoUrl),
          approvedAchievements: approved,
          approvedCount: approved.length,
          participationCount: partCount.get(s.id) || 0,
          topAchievement: approved[0] || null,
          categories: [...new Set(approved.map((a) => a.category))],
        };
      })
      .filter((s) => s.approvedCount > 0)
      .sort(rankCompare);
  }, [students, achievements, participations]);

  // Categorías reales de los logros aprobados, con nº de estudiantes por categoría.
  const categories = useMemo(() => {
    const map = new Map();
    ranked.forEach((s) => {
      s.categories.forEach((c) => map.set(c, (map.get(c) || 0) + 1));
    });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [ranked]);

  const semesters = useMemo(() => {
    const set = new Set(ranked.map((s) => s.semester).filter((n) => n != null));
    return [...set].sort((a, b) => b - a);
  }, [ranked]);

  const filtered = useMemo(() => {
    const list = ranked.filter((s) => {
      const matchesCategory = category === 'all' || s.categories.includes(category);
      const matchesSemester = semesterFilter === 'all' || s.semester === Number(semesterFilter);
      return matchesCategory && matchesSemester;
    });
    const sorted = list.slice();
    if (sort === 'name') sorted.sort((a, b) => a.publicName.localeCompare(b.publicName, 'es'));
    else if (sort === 'semester') sorted.sort((a, b) => (b.semester || 0) - (a.semester || 0) || rankCompare(a, b));
    else if (sort === 'participations') sorted.sort((a, b) => b.participationCount - a.participationCount || rankCompare(a, b));
    else sorted.sort(rankCompare);
    return sorted;
  }, [ranked, category, semesterFilter, sort]);

  // Métricas reales del encabezado (Stitch, sección 1).
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const approvedTotal = achievements.length;
    const pct = totalStudents > 0 ? Math.round((ranked.length / totalStudents) * 100) : 0;
    return { totalStudents, rankedCount: ranked.length, approvedTotal, eventsCount: events.length, pct };
  }, [students, achievements, events, ranked]);

  // Postulación real: el logro se crea en estado PENDING y aparece en la
  // cola de Aprobación del Admin. El éxito solo se muestra si la API
  // confirma; si el estudiante no existe, el endpoint lo crea en el padrón.
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplySending(true);
    setApplyError('');
    try {
      await achievementsApi.apply({
        publicName: applyForm.publicName.trim(),
        semester: applyForm.semester ? Number(applyForm.semester) : null,
        category: applyForm.category,
        title: applyForm.title.trim(),
        evidenceUrl: applyForm.evidenceUrl.trim() || null,
      });
      setApplySent(true);
      setApplyForm({ publicName: '', semester: '', category: 'Académico', title: '', evidenceUrl: '' });
    } catch (err) {
      setApplyError(err?.response?.data?.error || 'No se pudo enviar la postulación. Inténtalo de nuevo.');
    } finally {
      setApplySending(false);
    }
  };

  const closeApply = () => {
    setApplyOpen(false);
    setApplySent(false);
    setApplyError('');
  };

  if (loading) {
    return (
      <div className="w-full bg-background min-h-screen flex items-center justify-center pt-20">
        <p className="font-code-badge text-code-badge text-on-surface-variant">Cargando Cuadro de Honor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-background min-h-screen flex flex-col items-center justify-center gap-4 px-gutter pt-20">
        <p className="font-body-lg text-body-lg text-error">{error}</p>
        <button type="button" onClick={load} className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md border border-outline-variant/40 hover:border-secondary/50 transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pt-20">
      <div className="relative w-full overflow-hidden bg-background min-h-screen">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] pointer-events-none ambient-glow-1" />
        <div className="absolute top-96 -right-32 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[160px] pointer-events-none ambient-glow-2" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-tertiary/10 rounded-full blur-[130px] pointer-events-none ambient-glow-3" />
        <div className="max-w-[1440px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl relative z-10">

          {/* 1. HEADER & METRIC TELEMETRY STRIP */}
          <section className="flex flex-col gap-space-lg">
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-secondary/30 shadow-[0_0_15px_rgba(93,230,255,0.15)]">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-code-badge text-code-badge text-secondary font-semibold uppercase tracking-wider">Reconocimiento al Mérito Académico &amp; Excelencia</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/60 backdrop-blur-md border border-outline-variant/30 text-on-surface-variant font-code-badge text-code-badge">
                <span className="material-symbols-outlined text-[14px] text-tertiary">verified_user</span>
                <span>Acreditación Nacional CONAIC · Ciclo 2024-2025</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-outline font-code-badge text-code-badge border border-outline-variant/20 ml-auto">
                <span className="material-symbols-outlined text-[13px] text-secondary">update</span>
                <span>AUDIT: 2025.Q1-VERIFIED</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-end">
              <div className="lg:col-span-8 flex flex-col gap-space-xs">
                <span className="font-code-badge text-code-badge text-primary uppercase tracking-widest font-semibold">// HONOR_ROLL :: DEPARTAMENTO DE CIENCIAS COMPUTACIONALES</span>
                <h1 className="font-display-lg text-display-lg text-on-surface font-extrabold tracking-tight leading-none">
                  Cuadro de Honor <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-tertiary">Institucional</span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-2 leading-relaxed">
                  Consagración académica de los estudiantes de más alto rendimiento, investigadores junior y arquitectos de software distinguidos de la Licenciatura en Informática de la UMB Ixtlahuaca. Excelencia algorítmica, impacto científico y rigor técnico.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="flex items-center gap-space-sm bg-surface-container-high/60 backdrop-blur-md p-2 rounded-xl border border-outline-variant/30">
                  <a className="neon-elastic-btn flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-secondary/20 border border-secondary/40 text-on-surface font-label-md text-label-md transition-all" href="#postulaciones">
                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                    <span>Validar Certificado QR</span>
                  </a>
                  <a className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary-container text-on-primary font-label-md text-label-md font-bold shadow-[0_0_16px_rgba(93,230,255,0.3)] hover:brightness-110 transition-all" href="#directorio">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>Explorar Nómina</span>
                  </a>
                </div>
              </div>
            </div>
            {/* Metric Telemetry Cards Strip (valores reales) */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-space-md mt-2">
              <TiltCard className="stat-card-glow-1 bg-surface-container-low/70 backdrop-blur-md p-space-md rounded-xl border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="font-code-badge text-code-badge text-secondary font-medium tracking-wider uppercase">Galardonados</span>
                  <span className="material-symbols-outlined text-secondary text-[20px] anim-trophy transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">military_tech</span>
                </div>
                <div className="mt-3">
                  <div className="font-headline-xl text-headline-xl text-on-surface font-mono font-bold tracking-tight"><CountUp target={stats.rankedCount} start={statsVisible} /></div>
                  <div className="flex items-center gap-1 text-tertiary font-code-badge text-code-badge mt-1">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    <span>{stats.approvedTotal} logros aprobados en total</span>
                  </div>
                </div>
              </TiltCard>
              <TiltCard className="stat-card-glow-2 bg-surface-container-low/70 backdrop-blur-md p-space-md rounded-xl border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="font-code-badge text-code-badge text-primary font-medium tracking-wider uppercase">Logros Aprobados</span>
                  <span className="material-symbols-outlined text-primary text-[20px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.7)]">analytics</span>
                </div>
                <div className="mt-3">
                  <div className="font-headline-xl text-headline-xl text-on-surface font-mono font-bold tracking-tight"><CountUp target={stats.approvedTotal} start={statsVisible} /></div>
                  <div className="flex items-center gap-1 text-on-surface-variant font-code-badge text-code-badge mt-1">
                    <span>Reconocimientos publicados</span>
                  </div>
                </div>
              </TiltCard>
              <TiltCard className="stat-card-glow-3 bg-surface-container-low/70 backdrop-blur-md p-space-md rounded-xl border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-tertiary/10 rounded-full blur-xl group-hover:bg-tertiary/20 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="font-code-badge text-code-badge text-tertiary font-medium tracking-wider uppercase">Eventos</span>
                  <span className="material-symbols-outlined text-tertiary text-[20px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]">terminal</span>
                </div>
                <div className="mt-3">
                  <div className="font-headline-xl text-headline-xl text-on-surface font-mono font-bold tracking-tight"><CountUp target={stats.eventsCount} start={statsVisible} /></div>
                  <div className="flex items-center gap-1 text-tertiary font-code-badge text-code-badge mt-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>Eventos registrados en el portal</span>
                  </div>
                </div>
              </TiltCard>
              <TiltCard className="stat-card-glow-4 bg-surface-container-low/70 backdrop-blur-md p-space-md rounded-xl border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="font-code-badge text-code-badge text-secondary font-medium tracking-wider uppercase">Estudiantes Galardonados</span>
                  <span className="material-symbols-outlined text-secondary text-[20px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">group</span>
                </div>
                <div className="mt-3">
                  <div className="font-headline-xl text-headline-xl text-on-surface font-mono font-bold tracking-tight"><CountUp target={stats.pct} suffix="%" start={statsVisible} /></div>
                  <div className="flex items-center gap-1 text-on-surface-variant font-code-badge text-code-badge mt-1">
                    <span>Del total de estudiantes publicados</span>
                  </div>
                </div>
              </TiltCard>
            </div>
          </section>

          {/* 1.5 CARRUSEL AUTOMÁTICO DEL CUADRO DE HONOR (lista de cotejo 2.3):
              avanza solo cada 5 s, se pausa al pasar el cursor y permite
              avanzar o retroceder con flechas y puntos. */}
          {ranked.length > 0 && (
            <section className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px] anim-trophy">auto_awesome</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">Destacados del Cuadro de Honor</h2>
                <span className="font-code-badge text-code-badge text-on-surface-variant hidden sm:inline-block">CARRUSEL AUTOMÁTICO</span>
              </div>
              <AutoCarousel
                items={ranked}
                intervalMs={5000}
                ariaLabel="Carrusel automático del Cuadro de Honor"
                renderItem={(student) => {
                  const rank = ranked.findIndex((s) => s.id === student.id) + 1;
                  return (
                    <div className="bg-surface-container/80 backdrop-blur-xl rounded-2xl border border-outline-variant/30 p-space-lg shadow-lg flex flex-col sm:flex-row items-center gap-space-lg">
                      <img
                        className="w-28 h-28 rounded-2xl object-cover shadow-xl ring-1 ring-secondary/30 shrink-0"
                        src={student.photoUrl}
                        alt={`Foto de ${student.publicName}`}
                      />
                      <div className="flex flex-col gap-1 flex-1 text-center sm:text-left">
                        <span className="font-code-badge text-code-badge text-secondary font-bold">LUGAR #{rank} · {student.approvedCount} {student.approvedCount === 1 ? 'LOGRO APROBADO' : 'LOGROS APROBADOS'}</span>
                        <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">{student.publicName}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {student.semester ? `${student.semester}° Semestre` : 'Estudiante'}
                          {student.generation ? ` • Generación ${student.generation}` : ''}
                          {student.participationCount > 0 ? ` • ${student.participationCount} participaciones` : ''}
                        </p>
                        {student.topAchievement && (
                          <p className="font-body-md text-body-md text-tertiary font-medium">{student.topAchievement.title}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelected(student)}
                        className="shrink-0 inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-gradient-to-r from-secondary to-primary-container text-on-primary font-title-md font-bold hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Ver expediente
                      </button>
                    </div>
                  );
                }}
              />
            </section>
          )}

          {/* 2. PODIO DE HONOR: TOP 3 ESTUDIANTES INSIGNIA */}
          {podium.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[24px] anim-trophy">workspace_premium</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">Podio de Honor · Máximas Distinciones</h2>
                </div>
                <span className="font-code-badge text-code-badge text-on-surface-variant hidden sm:inline-block">CANDIDATOS AL LAUREL INSTITUCIONAL</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
                {podium[1] && <PodiumCard student={podium[1]} rank={2} onOpen={() => setSelected(podium[1])} />}
                {podium[0] && <PodiumCard student={podium[0]} rank={1} onOpen={() => setSelected(podium[0])} />}
                {podium[2] && <PodiumCard student={podium[2]} rank={3} onOpen={() => setSelected(podium[2])} />}
              </div>
            </section>
          )}

          {/* 3. BARRA DE HERRAMIENTAS Y FILTRADO AVANZADO (el buscador vive solo en el Navbar) */}
          <section className="bg-surface-container-low/70 backdrop-blur-xl p-space-md rounded-2xl border border-outline-variant/30 flex flex-col gap-space-md shadow-lg" id="directorio">
            <div className="flex flex-col md:flex-row items-center gap-space-md justify-end">
              <div className="flex flex-wrap items-center gap-space-sm w-full md:w-auto justify-end">
                <div className="flex items-center gap-1 bg-surface-container-lowest/80 rounded-xl px-2.5 py-1.5 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">school</span>
                  <select
                    className="bg-transparent text-on-surface font-label-md text-label-md border-0 focus:ring-0 cursor-pointer pr-6"
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                  >
                    <option className="bg-surface-container-high text-on-surface" value="all">Todos los Semestres</option>
                    {semesters.map((sem) => (
                      <option key={sem} className="bg-surface-container-high text-on-surface" value={sem}>{sem}° Semestre</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-lowest/80 rounded-xl px-2.5 py-1.5 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">sort</span>
                  <select
                    className="bg-transparent text-on-surface font-label-md text-label-md border-0 focus:ring-0 cursor-pointer pr-6"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option className="bg-surface-container-high text-on-surface" value="achievements">Más logros aprobados</option>
                    <option className="bg-surface-container-high text-on-surface" value="name">Alfabético (A-Z)</option>
                    <option className="bg-surface-container-high text-on-surface" value="semester">Semestre Avanzado</option>
                    <option className="bg-surface-container-high text-on-surface" value="participations">Más participaciones</option>
                  </select>
                </div>
                <div className="flex items-center bg-surface-container-lowest/90 p-1 rounded-xl border border-outline-variant/30">
                  <button
                    type="button"
                    className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-surface-container text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    onClick={() => setView('grid')}
                    title="Vista Cuadrícula"
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  </button>
                  <button
                    type="button"
                    className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-surface-container text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    onClick={() => setView('list')}
                    title="Vista Lista Detallada"
                  >
                    <span className="material-symbols-outlined text-[18px]">view_list</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="font-code-badge text-code-badge text-on-surface-variant shrink-0 uppercase tracking-wider mr-1">Filtrar área:</span>
              <button
                type="button"
                className={`category-pill px-3.5 py-1.5 rounded-full font-label-md text-label-md shrink-0 transition-all ${category === 'all' ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(93,230,255,0.35)] font-semibold' : 'bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant/20'}`}
                onClick={() => setCategory('all')}
              >
                Todos ({ranked.length})
              </button>
              {categories.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  className={`category-pill px-3.5 py-1.5 rounded-full font-label-md text-label-md shrink-0 transition-all ${category === name ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(93,230,255,0.35)] font-semibold' : 'bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant/20'}`}
                  onClick={() => setCategory(name)}
                >
                  {name} ({count})
                </button>
              ))}
            </div>
          </section>

          {/* 4. DIRECTORIO COMPLETO: GRID DE ESTUDIANTES GALARDONADOS */}
          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface font-bold">Nómina General de Alumnos Laureados</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary font-mono text-[11px] font-bold">{filtered.length} Seleccionados</span>
              </div>
              <span className="font-code-badge text-code-badge text-on-surface-variant">ORDENADO POR: {SORT_LABELS[sort]}</span>
            </div>
            {filtered.length > 0 ? (
              <div className={view === 'list' ? 'flex flex-col gap-space-sm' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md'}>
                {filtered.map((student, i) => (
                  <div
                    key={student.id}
                    className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${view === 'list' ? 'hover:-translate-y-0.5' : 'h-full'}`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <HonorCard
                      student={student}
                      accent={['secondary', 'primary', 'tertiary'][i % 3]}
                      onOpen={() => setSelected(student)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant py-8 text-center">
                No hay estudiantes galardonados que coincidan con los filtros.
              </p>
            )}
            {/* 5. TELEMETRÍA DE REGISTROS (sin paginación: la API devuelve la nómina completa) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md border-t border-outline-variant/20 mt-2">
              <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                <span>Mostrando <strong className="text-on-surface font-mono">{filtered.length}</strong> de <strong className="text-on-surface font-mono">{ranked.length}</strong> estudiantes con distinción honorífica</span>
              </div>
            </div>
          </section>

          {/* 5. EGRESADOS CON DISTINCIÓN (lista de cotejo 2.1 y 2.2): división
              propia del Cuadro de Honor, después de los estudiantes actuales. */}
          <section className="flex flex-col gap-space-md" id="egresados">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-tertiary text-[24px]">school</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">Egresados con Distinción</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-tertiary/10 border border-tertiary/30 text-tertiary font-mono text-[11px] font-bold">{alumniRanked.length} Egresados</span>
            </div>
            {alumniRanked.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {alumniRanked.map((student, i) => (
                  <HonorCard
                    key={student.id}
                    student={student}
                    accent={['tertiary', 'secondary', 'primary'][i % 3]}
                    onOpen={() => setSelected(student)}
                  />
                ))}
              </div>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant py-6 text-center">
                Aún no hay egresados con distinciones registradas. Los egresados se registran desde el Panel de
                Administración cambiando el estatus académico del alumno a “Egresado” o “Egresada”.
              </p>
            )}
          </section>

          {/* 6. BANNER DE CONVOCATORIA, CRITERIOS DE INCLUSIÓN Y VALIDACIÓN DE EXPEDIENTES */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low border border-secondary/30 p-space-xl shadow-[0_0_35px_rgba(0,0,0,0.5)]" id="postulaciones">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-tertiary/20 text-tertiary font-mono text-[11px] font-bold uppercase tracking-wider border border-tertiary/40">
                    PROCESO DE AUDITORÍA ABIERTO
                  </span>
                  <span className="text-on-surface-variant font-code-badge text-code-badge">CICLO LECTIVO 2025-A</span>
                </div>
                <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight leading-tight">
                  ¿Cuentas con promedio ≥ 9.5 o producción científica destacada?
                </h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  La postulación al Cuadro de Honor es evaluada por el Consejo Técnico de la Licenciatura en Informática bajo estrictos criterios CONAIC: constancias verificadas, repositorios de software con pruebas automatizadas, artículos científicos o victorias en concursos reconocidos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-2">
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">check_box</span>
                    <span className="font-body-md text-body-md text-on-surface-variant"><strong className="text-on-surface">Promedio Mínimo:</strong> 9.50 sin extraordinarios</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">check_box</span>
                    <span className="font-body-md text-body-md text-on-surface-variant"><strong className="text-on-surface">Evidencia Técnica:</strong> Código público o Paper</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">check_box</span>
                    <span className="font-body-md text-body-md text-on-surface-variant"><strong className="text-on-surface">Aval Académico:</strong> Firma digital de tutor</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-space-md items-center lg:items-end">
                <div className="p-space-md rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 flex flex-col items-center gap-space-sm text-center w-full max-w-sm">
                  <span className="material-symbols-outlined text-secondary text-[36px]">assignment_turned_in</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-bold">Postulación en Línea</span>
                    <span className="font-code-badge text-code-badge text-on-surface-variant">Cierre de Convocatoria: 15 de Mayo, 2025</span>
                  </div>
                  <button type="button" className="shimmer-effect w-full py-3 px-4 rounded-xl bg-gradient-to-r from-secondary to-primary-container text-on-primary font-label-md text-label-md font-bold shadow-[0_0_20px_rgba(93,230,255,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer" onClick={() => setApplyOpen(true)}>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Iniciar Postulación Digital</span>
                  </button>
                  <a className="font-code-badge text-code-badge text-secondary hover:underline flex items-center gap-1" href="#">
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    <span>Descargar Lineamientos Oficiales (PDF)</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL INTERACTIVO / EXPEDIENTE DE ALUMNO (POPUP PREVIEW) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="relative w-full max-w-2xl bg-surface-container-high rounded-2xl border border-secondary/40 shadow-[0_0_50px_rgba(93,230,255,0.25)] p-space-lg flex flex-col gap-space-md overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-tertiary" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[28px]">badge</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-code-badge text-code-badge text-secondary uppercase font-semibold">Expediente Oficial de Honor</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{selected.publicName}</h3>
                </div>
              </div>
              <button type="button" className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-secondary/20 text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm py-2">
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                <span className="font-code-badge text-[10px] text-on-surface-variant uppercase">Logros Aprobados</span>
                <span className="font-mono text-title-md text-secondary font-bold">{selected.approvedCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                <span className="font-code-badge text-[10px] text-on-surface-variant uppercase">Semestre Activo</span>
                <span className="font-mono text-title-md text-on-surface font-bold">{selected.semester ? `${selected.semester}°` : '—'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                <span className="font-code-badge text-[10px] text-on-surface-variant uppercase">Estatus Académico</span>
                <span className="font-mono text-title-md text-tertiary font-bold">{selected.academicStatus || '—'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                <span className="font-code-badge text-[10px] text-on-surface-variant uppercase">Generación</span>
                <span className="font-mono text-title-md text-primary font-bold">{selected.generation || '—'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Especialidad &amp; Trayectoria</span>
              <p className="font-body-md text-body-md text-secondary font-medium">{selected.topAchievement ? selected.topAchievement.title : 'Sin logro destacado registrado'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Resumen de Contribución &amp; Logros</span>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {selected.bio || selected.topAchievement?.description || 'Sin descripción registrada.'}
              </p>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[28px]">military_tech</span>
                <span className="font-code-badge text-code-badge text-on-surface font-mono font-bold">LOGROS APROBADOS ({selected.approvedCount})</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {selected.approvedAchievements.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="text-on-surface">{a.title}</span>
                    <span className="font-mono text-[11px] text-on-surface-variant shrink-0">
                      {a.category} · {formatHonorDate(a.date)}
                    </span>
                  </li>
                ))}
              </ul>
              {selected.topAchievement?.evidenceUrl && (
                <a href={selected.topAchievement.evidenceUrl} target="_blank" rel="noreferrer" className="font-code-badge text-code-badge text-secondary hover:underline">Ver evidencia del logro más reciente</a>
              )}
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors" onClick={() => setSelected(null)}>
                Cerrar
              </button>
              <Link to={`/estudiantes/${selected.id}`} className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary-container text-on-primary font-label-md text-label-md font-bold shadow-[0_0_15px_rgba(93,230,255,0.3)] hover:brightness-110 transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Ver perfil completo</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE POSTULACIÓN DIGITAL */}
      {applyOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeApply(); }}
        >
          <div className="relative w-full max-w-lg bg-surface-container-high rounded-2xl border border-secondary/40 shadow-[0_0_50px_rgba(93,230,255,0.25)] p-space-lg flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">send</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Postulación al Cuadro de Honor</h3>
              </div>
              <button type="button" className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" onClick={closeApply}>
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {applySent ? (
              <div className="flex flex-col gap-space-md items-start">
                <span className="material-symbols-outlined text-tertiary text-[36px]">check_circle</span>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  ¡Postulación recibida con éxito! Tu expediente ha entrado a la cola de verificación del Consejo Técnico. Podrás verlo en el Cuadro de Honor cuando un administrador lo apruebe.
                </p>
                <button type="button" className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary-container text-on-primary font-label-md text-label-md font-bold self-end" onClick={closeApply}>
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Ingresa tus datos y el logro que postulas. La solicitud queda en revisión y aparece en el Cuadro de Honor cuando un administrador la apruebe.
                </p>
                {applyError && (
                  <p className="font-body-md text-body-md text-error bg-error/10 border border-error/40 rounded-lg px-3 py-2">{applyError}</p>
                )}
                <form className="flex flex-col gap-space-sm" onSubmit={handleApplySubmit}>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Nombre completo</label>
                    <input className="bg-surface-container-lowest text-on-surface px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:border-secondary focus:outline-none font-body-md" placeholder="Ej. Ana Lucía Domínguez" required type="text" value={applyForm.publicName} onChange={(e) => setApplyForm({ ...applyForm, publicName: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-on-surface font-semibold">Semestre</label>
                      <select className="bg-surface-container-lowest text-on-surface px-3 py-2.5 rounded-lg border border-outline-variant/40 focus:border-secondary focus:outline-none font-body-md" value={applyForm.semester} onChange={(e) => setApplyForm({ ...applyForm, semester: e.target.value })}>
                        <option value="">Sin asignar</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}° Semestre</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-on-surface font-semibold">Categoría Principal</label>
                      <select className="bg-surface-container-lowest text-on-surface px-3 py-2.5 rounded-lg border border-outline-variant/40 focus:border-secondary focus:outline-none font-body-md" value={applyForm.category} onChange={(e) => setApplyForm({ ...applyForm, category: e.target.value })}>
                        {['Académico', 'Concurso', 'Investigación', 'Innovación', 'Certificación'].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Título del logro</label>
                    <input className="bg-surface-container-lowest text-on-surface px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:border-secondary focus:outline-none font-body-md" placeholder="Ej. 1er lugar Hackathon IoT 2025" required type="text" value={applyForm.title} onChange={(e) => setApplyForm({ ...applyForm, title: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Enlace de Repositorio o Publicación</label>
                    <input className="bg-surface-container-lowest text-on-surface px-3.5 py-2.5 rounded-lg border border-outline-variant/40 focus:border-secondary focus:outline-none font-body-md" placeholder="https://github.com/... o DOI de publicación" type="text" value={applyForm.evidenceUrl} onChange={(e) => setApplyForm({ ...applyForm, evidenceUrl: e.target.value })} />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-space-sm">
                    <button type="button" className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface font-label-md text-label-md" onClick={closeApply}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={applySending} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary to-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md hover:brightness-110 disabled:opacity-60">
                      {applySending ? 'Enviando…' : 'Enviar Solicitud'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
