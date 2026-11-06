import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentsApi } from '../services/api';
import StudentCard from '../components/StudentCard';
import CountUp from '../components/CountUp';
import { withStudentPhoto } from '../data/stitchImages';
import { StudentDossier } from './StudentProfile.jsx';

// Áreas del filtro de Stitch; sin campo "área" en la BD, cada chip busca
// palabras clave en skills, intereses y bio reales del estudiante.
const AREAS = [
  { label: 'Todos los Perfiles', keywords: null },
  { label: 'Sistemas Distribuidos & Cloud', keywords: ['cloud', 'distribuid', 'devops', 'docker', 'kubernetes', 'microservicio', 'aws', 'azure', 'backend'] },
  { label: 'IA & Bioinformática', keywords: ['inteligencia artificial', 'machine learning', 'pytorch', 'tensorflow', 'bioinform', 'llm', 'datos', 'data', 'ia'] },
  { label: 'Ciberseguridad & Kernel', keywords: ['seguridad', 'ciberseguridad', 'kernel', 'linux', 'ebpf', 'hacking', 'pentest', 'criptograf'] },
  { label: 'Algoritmia & Cómputo Cuántico', keywords: ['algoritm', 'cuántic', 'qiskit', 'estructuras de datos', 'icpc', 'competitiva'] },
  { label: 'IoT & Embebidos', keywords: ['iot', 'embebid', 'arduino', 'raspberry', 'lora', 'freertos', 'sensor', 'hardware'] },
];

// Sin GPA en la BD: el orden es por nombre, por logros aprobados o por habilidades.
const SORTS = [
  { value: 'name', label: 'Ordenar: Nombre (A–Z)' },
  { value: 'achievements', label: 'Más logros aprobados' },
  { value: 'skills', label: 'Más habilidades' },
];

function searchableText(s) {
  return [...(s.skills || []), ...(s.interests || []), s.bio || '', s.publicName || ''].join(' ').toLowerCase();
}

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [area, setArea] = useState(AREAS[0].label);
  const [sort, setSort] = useState('name');
  const [view, setView] = useState('split');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    studentsApi.list().then((list) => setStudents(list.map(withStudentPhoto))).catch(() => setError('No se pudieron cargar los estudiantes.'));
  }, []);

  // La entrada escalonada se dispara cuando llega el listado de la API.
  useEffect(() => {
    if (students.length > 0) setMounted(true);
  }, [students]);

  useEffect(() => {
    if (students.length > 0 && selectedId === null) setSelectedId(students[0].id);
  }, [students, selectedId]);

  // El dossier del panel derecho necesita el perfil completo (proyectos,
  // certificaciones, participaciones); el listado solo trae el resumen.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setDetailLoading(true);
    studentsApi
      .get(selectedId)
      .then((d) => { if (!cancelled) { setDetail(d && withStudentPhoto(d)); setDetailLoading(false); } })
      .catch(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const areaDef = AREAS.find((a) => a.label === area);
    let list = students.filter((s) => {
      const text = searchableText(s);
      if (areaDef?.keywords && !areaDef.keywords.some((k) => text.includes(k))) return false;
      return true;
    });
    if (sort === 'achievements') list = [...list].sort((a, b) => (b.achievements?.length || 0) - (a.achievements?.length || 0));
    else if (sort === 'skills') list = [...list].sort((a, b) => (b.skills?.length || 0) - (a.skills?.length || 0));
    else list = [...list].sort((a, b) => (a.publicName || '').localeCompare(b.publicName || '', 'es'));
    return list;
  }, [students, area, sort]);

  const totalAchievements = students.reduce((acc, s) => acc + (s.achievements?.length || 0), 0);
  const generations = [...new Set(students.map((s) => s.generation).filter(Boolean))];
  const semesters = students.map((s) => s.semester).filter((n) => typeof n === 'number');
  const semesterRange = semesters.length > 0 ? `SEM ${Math.min(...semesters)}–${Math.max(...semesters)}` : 'LIC. INFORMÁTICA';

  return (
    <div className="w-full bg-background min-h-screen pt-20">
      <div className="flex flex-col w-full">
        {/* AMBIENT GLOW SYSTEM */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[128px] pointer-events-none"></div>
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[140px] pointer-events-none"></div>

          {/* 1. HERO BANNER: MÓDULO 4 TALENTO & DOSSIER DIGITAL */}
          <section className="max-w-[1440px] mx-auto px-margin pt-space-lg pb-space-xl w-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-gutter pb-space-lg">
              <div className="flex flex-col gap-space-sm max-w-3xl">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container-high text-secondary font-code-badge text-code-badge">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                    MOD-04 :: TALENT REPOSITORY &amp; VERIFIED DOSSIERS
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-tertiary font-code-badge text-code-badge">
                    <span className="material-symbols-outlined text-[14px] anim-float">verified</span>
                    CONAIC ACREDITADO • UMB IXTLAHUACA
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-tight">
                  Perfiles Técnicos &amp; <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-tertiary">
                    Expedientes Digitales Verificados
                  </span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  Directorio institucional de vinculación tecnológica de la Licenciatura en Informática (UMB Ixtlahuaca). Hojas de vida computacionales respaldadas con firma criptográfica docente, telemetría de repositorios y proyectos de alto impacto.
                </p>
              </div>
              {/* ACCIONES RÁPIDAS DEL PORTAL */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-gradient-to-r from-primary-container to-secondary text-on-primary font-label-md text-label-md shadow-xl hover:opacity-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  Generar mi CV Oficial
                </Link>
              </div>
            </div>
            {/* BARRA DE TELEMETRÍA INSTITUCIONAL (cifras reales de la BD) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter bg-surface-container-low rounded-xl p-space-md shadow-lg">
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold"><CountUp target={students.length} start={mounted} /></span>
                  <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Perfiles Publicados</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[24px]">military_tech</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-tertiary font-bold"><CountUp target={totalAchievements} start={mounted} /></span>
                  <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Logros Aprobados</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">domain_verification</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold"><CountUp target={generations.length} start={mounted} /></span>
                  <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Generaciones Activas</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary-container">
                  <span className="material-symbols-outlined text-[24px]">work_history</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-secondary font-bold">{semesters.length > 0 ? `${Math.min(...semesters)}°–${Math.max(...semesters)}°` : '—'}</span>
                  <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Semestres Representados</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. EXPLORADOR SPOTLIGHT & FILTROS MULTICRITERIO */}
          <section className="max-w-[1440px] mx-auto px-margin pb-space-lg w-full">
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-md shadow-md">
              {/* SPECIALTY FILTER CHIPS */}
              <div className="flex items-center justify-between flex-wrap gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-code-badge text-code-badge text-outline uppercase mr-2">Área:</span>
                  {AREAS.map((a) => {
                    const active = area === a.label;
                    const label = a.keywords === null ? `${a.label} (${students.length})` : a.label;
                    return (
                      <button
                        key={a.label}
                        className={`filter-chip px-3 py-1.5 rounded-lg font-code-badge text-code-badge transition-all ${
                          active
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                        }`}
                        type="button"
                        onClick={() => setArea(a.label)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {/* CONTROLES SECUNDARIOS Y VISTA */}
                <div className="flex items-center gap-space-xs">
                  <div className="flex items-center bg-surface-container-highest rounded-lg p-1">
                    <button
                      className={`px-2 py-1 rounded flex items-center ${view === 'split' ? 'bg-surface-container text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                      title="Vista Dividida"
                      type="button"
                      onClick={() => setView('split')}
                    >
                      <span className="material-symbols-outlined text-[18px]">vertical_split</span>
                    </button>
                    <button
                      className={`px-2 py-1 rounded flex items-center ${view === 'grid' ? 'bg-surface-container text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                      title="Vista Cuadrícula"
                      type="button"
                      onClick={() => setView('grid')}
                    >
                      <span className="material-symbols-outlined text-[18px]">grid_view</span>
                    </button>
                  </div>
                  <select
                    className="bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg px-3 py-1.5 focus:outline-none"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {error && <p className="text-error mt-4 font-body-md text-body-md">{error}</p>}
          </section>

          {/* 3. SPLIT WORKSPACE: DIRECTORIO DE TALENTO & VISOR DE CV DIGITAL */}
          <section className="max-w-[1440px] mx-auto px-margin pb-space-xl w-full">
            {view === 'grid' ? (
              <div>
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Perfiles Publicados ({filtered.length})</span>
                  <span className="font-code-badge text-code-badge text-on-surface-variant">UMB // {semesterRange}</span>
                </div>
                <div className="grid gap-space-sm sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((s, i) => (
                    <div
                      key={s.id}
                      className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ transitionDelay: `${Math.min(i, 11) * 60}ms` }}
                    >
                      <StudentCard student={s} onSelect={() => navigate(`/estudiantes/${s.id}`)} />
                    </div>
                  ))}
                </div>
                {filtered.length === 0 && !error && (
                  <p className="text-on-surface-variant mt-6 font-body-md text-body-md">Aún no hay perfiles publicados.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                {/* PANEL IZQUIERDO: LISTA DE ESTUDIANTES CANDIDATOS */}
                <div className="lg:col-span-5 flex flex-col gap-space-sm h-[940px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between pb-space-xs">
                    <span className="font-code-badge text-code-badge uppercase text-secondary font-semibold">Perfiles Publicados ({filtered.length})</span>
                    <span className="font-code-badge text-code-badge text-on-surface-variant">UMB // {semesterRange}</span>
                  </div>
                  {filtered.map((s, i) => (
                    <div
                      key={s.id}
                      className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ transitionDelay: `${Math.min(i, 11) * 60}ms` }}
                    >
                      <StudentCard student={s} selected={s.id === selectedId} onSelect={() => setSelectedId(s.id)} />
                    </div>
                  ))}
                  {filtered.length === 0 && !error && (
                    <p className="text-on-surface-variant font-body-md text-body-md">Sin perfiles que coincidan con los filtros seleccionados.</p>
                  )}
                </div>
                {/* PANEL DERECHO: VISOR INMERSIVO DEL DOSSIER / CV DIGITAL */}
                <div className="lg:col-span-7">
                  {detailLoading && !detail ? (
                    <p className="text-on-surface-variant p-space-lg">Cargando expediente...</p>
                  ) : detail ? (
                    <StudentDossier student={detail} />
                  ) : (
                    <p className="text-on-surface-variant p-space-lg">Selecciona un perfil del directorio para ver su expediente.</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 4. GENERADOR / POSTULACIÓN DE CV PARA ALUMNOS DE LA LICENCIATURA */}
          <section className="max-w-[1440px] mx-auto px-margin pb-space-xl w-full">
            <div className="bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low rounded-xl p-space-lg shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-secondary/5 blur-3xl pointer-events-none"></div>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-space-lg">
                <div className="flex flex-col gap-space-sm max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-secondary/10 text-secondary font-code-badge text-code-badge w-fit">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    TRÁMITE DE TITULACIÓN &amp; RESIDENCIAS UMB
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
                    ¿Eres estudiante de Informática y deseas certificar tu CV Digital?
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Inicia el proceso de validación curricular. Conecta tu historial académico oficial, somete tus proyectos a revisión por el comité docente y obtén tu expediente digital verificado respaldado por la acreditación CONAIC.
                  </p>
                  {/* 3 STEPS CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mt-space-xs">
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-start gap-space-xs">
                      <span className="font-mono text-secondary font-bold text-headline-sm">01</span>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface font-semibold">Kardex Oficial</h4>
                        <p className="font-code-badge text-code-badge text-on-surface-variant">Carga de matrícula institucional y promedio</p>
                      </div>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-start gap-space-xs">
                      <span className="font-mono text-tertiary font-bold text-headline-sm">02</span>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface font-semibold">Repositorios</h4>
                        <p className="font-code-badge text-code-badge text-on-surface-variant">Enlace con GitHub, GitLab o Papers</p>
                      </div>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-start gap-space-xs">
                      <span className="font-mono text-primary font-bold text-headline-sm">03</span>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface font-semibold">Aval Docente</h4>
                        <p className="font-code-badge text-code-badge text-on-surface-variant">Revisión del comité y publicación del perfil</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* BOTÓN PRINCIPAL DE APERTURA */}
                <div className="flex flex-col gap-space-xs w-full lg:w-auto shrink-0">
                  <Link
                    to="/login"
                    className="px-space-lg py-space-md rounded-lg bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md font-bold text-center shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Iniciar Trámite de Certificación Curricular
                  </Link>
                  <span className="font-code-badge text-code-badge text-on-surface-variant text-center">Requiere credenciales institucionales activas (@alumnos.umb.mx)</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
