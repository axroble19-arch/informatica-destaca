import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, participationsApi } from '../services/api';
import EventCard from '../components/EventCard';
import AutoCarousel from '../components/AutoCarousel';
import CountUp from '../components/CountUp';
import { withEventCover } from '../data/stitchImages';

/**
 * Port fiel de la pantalla EVENTOS de Stitch
 * (eventos_inform_tica_destaca_agenda_hackathons_multimedia/code.html).
 * El header y el footer los aporta App.jsx; esta página empieza en el
 * contenido principal de Stitch. El <script> de Stitch (filtros,
 * chips de estado) está reimplementado con useState/useEffect.
 * Datos reales de la API: esta vista muestra SOLO los certámenes
 * (categoría 'Certamen' de la BD); los conteos son reales.
 * La búsqueda vive solo en el Navbar (página /buscar): esta vista no
 * tiene buscador propio.
 */

const STATE_FILTERS = [
  { key: 'all', label: 'Todos', status: '' },
  { key: 'upcoming', label: 'Próximos', status: 'UPCOMING' },
  { key: 'completed', label: 'Realizados', status: 'COMPLETED' },
  { key: 'cancelled', label: 'Cancelados', status: 'CANCELLED' },
];

const MODALITY_OPTIONS = [
  { value: 'all', label: 'Modalidad: Todas' },
  { value: 'presencial', label: 'Presencial (Campus Ixtlahuaca)' },
  { value: 'virtual', label: 'Virtual (Streaming & Nube)' },
  { value: 'hibrida', label: 'Híbrida (Doble Plataforma)' },
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modality, setModality] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  // Filtro por fecha (el backend ya soporta ?from=&to=; aquí se filtra en
  // cliente porque la lista completa ya está cargada).
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    Promise.all([eventsApi.list(), participationsApi.list()])
      .then(([evts, parts]) => {
        // Solo certámenes (decisión de Axel): los demás eventos de la BD
        // (hackathon, semana, concurso, feria) no se listan en esta vista.
        const certs = (Array.isArray(evts) ? evts : []).filter((e) => e.category === 'Certamen');
        const certIds = new Set(certs.map((e) => e.id));
        setEvents(certs.map(withEventCover));
        setParticipations((Array.isArray(parts) ? parts : []).filter((p) => certIds.has(p.eventId)));
      })
      .catch(() => setError('No se pudieron cargar los eventos.'))
      .finally(() => setLoading(false));
  }, []);

  const countByStatus = (status) =>
    status === '' ? events.length : events.filter((e) => e.status === status).length;

  const participantCountByEvent = useMemo(() => {
    const counts = {};
    participations.forEach((p) => {
      counts[p.eventId] = (counts[p.eventId] || 0) + 1;
    });
    return counts;
  }, [participations]);

  const filtered = useMemo(() => {
    const active = STATE_FILTERS.find((f) => f.key === stateFilter);
    const list = events.filter((e) => {
      const matchesState = !active || !active.status || e.status === active.status;
      const matchesMod = modality === 'all' || normalize(e.modality) === modality;
      const d = e.date ? new Date(e.date) : null;
      const matchesFrom = !fromDate || !d || d >= new Date(`${fromDate}T00:00:00`);
      const matchesTo = !toDate || !d || d <= new Date(`${toDate}T23:59:59`);
      return matchesState && matchesMod && matchesFrom && matchesTo;
    });
    // El más reciente primero (el Certamen LI 2025 va primero y destacado).
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, modality, stateFilter, fromDate, toDate]);

  // Spans de la rejilla: solo el primer certamen (el más reciente) ocupa
  // 2 columnas como destacado; la última tarjeta de la última fila se
  // ensancha para que no quede un hueco vacío.
  const SPAN_CLS = {
    1: 'md:col-span-1 xl:col-span-1',
    2: 'md:col-span-2 xl:col-span-2',
    3: 'md:col-span-2 xl:col-span-3',
  };
  const cardSpans = useMemo(() => {
    const spans = filtered.map((e, i) => (i === 0 ? 2 : 1));
    const total = spans.reduce((a, b) => a + b, 0);
    const remainder = total % 3;
    if (spans.length > 0 && remainder !== 0) spans[spans.length - 1] += 3 - remainder;
    return spans;
  }, [filtered]);

  const resetFilters = () => {
    setModality('all');
    setStateFilter('all');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="w-full bg-surface-container-lowest min-h-screen pt-20">
      <div className="flex flex-col w-full text-on-surface">
        {/* SECTION: Telemetry Header & Institutional Protocol */}
        <section className="relative w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin pt-space-md pb-space-lg overflow-hidden">
          {/* Ambient photonic radial glows */}
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10 ambient-glow-1"></div>
          <div className="absolute top-1/2 right-12 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none -z-10 ambient-glow-2"></div>
          {/* Institutional Pill & Metatags */}
          <div className="flex flex-wrap items-center gap-space-xs mb-space-md">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high/90 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-code-badge text-code-badge text-secondary tracking-widest uppercase">MOD-05 :: AGENDA INSTITUCIONAL &amp; MULTIMEDIA</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container/70 shadow-sm">
              <span className="material-symbols-outlined text-[14px] text-tertiary">verified</span>
              <span className="font-code-badge text-code-badge text-on-surface-variant">CONAIC ACREDITADO 2023-2028</span>
            </div>
            <div className="hidden md:inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container/70 shadow-sm">
              <span className="font-code-badge text-code-badge text-outline">HASH // UMB-IXT-EVT-2025-V4</span>
            </div>
          </div>
          {/* Title & Description Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-end mb-space-xl">
            <div className="lg:col-span-12 flex flex-col gap-space-xs">
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-on-surface via-secondary to-primary-fixed leading-tight">
                Certámenes de Investigación, Innovación y Emprendimiento
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-space-xs">
                Certámenes de investigación, innovación, desarrollo tecnológico y emprendimiento de la Licenciatura en Informática de la UMB Unidad Académica Ixtlahuaca, con sus proyectos, evaluadores y premiaciones.
              </p>
            </div>
          </div>
          {/* Live Telemetry KPI Strip — cifras reales de la API */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-space-xl">
            {/* Metric 1 */}
            <div className="stat-card-glow-1 relative p-space-md rounded-xl bg-surface-container/80 backdrop-blur-xl shadow-md overflow-hidden group hover:bg-surface-container-high/80 transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">CERTÁMENES REGISTRADOS</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]">
                  <span className="material-symbols-outlined text-[18px] anim-stats transition-all duration-300 group-hover:scale-110">calendar_month</span>
                </div>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-headline-xl font-extrabold text-on-surface tracking-tight"><CountUp target={events.length} start={!loading} /></span>
                <span className="font-code-badge text-code-badge text-secondary font-bold">TOTAL</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">Auditados institucionalmente</p>
            </div>
            {/* Metric 2 */}
            <div className="stat-card-glow-2 relative p-space-md rounded-xl bg-surface-container/80 backdrop-blur-xl shadow-md overflow-hidden group hover:bg-surface-container-high/80 transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-tertiary/10 rounded-full blur-xl group-hover:bg-tertiary/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">PARTICIPANTES ACTIVOS</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-tertiary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_16px_rgba(52,211,153,0.5)]">
                  <span className="material-symbols-outlined text-[18px] anim-memory transition-all duration-300 group-hover:scale-110">group</span>
                </div>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-headline-xl font-extrabold text-on-surface tracking-tight"><CountUp target={participations.length} start={!loading} /></span>
                <span className="font-code-badge text-code-badge text-tertiary font-bold">TOTAL</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">Alumnos, ponentes e investigadores</p>
            </div>
            {/* Metric 3 */}
            <div className="stat-card-glow-3 relative p-space-md rounded-xl bg-surface-container/80 backdrop-blur-xl shadow-md overflow-hidden group hover:bg-surface-container-high/80 transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary-container/10 rounded-full blur-xl group-hover:bg-primary-container/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">PRÓXIMOS EN AGENDA</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_16px_rgba(99,102,241,0.5)]">
                  <span className="material-symbols-outlined text-[18px] anim-rocket transition-all duration-300 group-hover:scale-110">rocket_launch</span>
                </div>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-headline-xl font-extrabold text-on-surface tracking-tight"><CountUp target={countByStatus('UPCOMING')} start={!loading} /></span>
                <span className="font-code-badge text-code-badge text-primary-fixed-dim font-bold">EVENTOS</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">Convocatorias en proceso</p>
            </div>
            {/* Metric 4 */}
            <div className="stat-card-glow-4 relative p-space-md rounded-xl bg-surface-container/80 backdrop-blur-xl shadow-md overflow-hidden group hover:bg-surface-container-high/80 transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-secondary-fixed/10 rounded-full blur-xl group-hover:bg-secondary-fixed/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">VALIDEZ CURRICULAR</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]">
                  <span className="material-symbols-outlined text-[18px] anim-trophy transition-all duration-300 group-hover:scale-110">workspace_premium</span>
                </div>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-headline-xl font-extrabold text-on-surface tracking-tight"><CountUp target={100} suffix="%" start={!loading} /></span>
                <span className="font-code-badge text-code-badge text-secondary font-bold">AVAL</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">Créditos complementarios SATCA</p>
            </div>
          </div>
        </section>

        {/* SECTION: Carrusel automático de ediciones (lista de cotejo 3.6):
            avanza solo cada 5 s, se pausa al pasar el cursor. */}
        {!loading && !error && filtered.length > 0 && (
          <section className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin pb-space-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <span className="material-symbols-outlined text-secondary text-[24px]">auto_awesome</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">Ediciones del Certamen</h2>
              <span className="font-code-badge text-code-badge text-on-surface-variant hidden sm:inline-block">CARRUSEL AUTOMÁTICO</span>
            </div>
            <AutoCarousel
              items={filtered}
              intervalMs={5000}
              ariaLabel="Carrusel automático de ediciones del certamen"
              renderItem={(e) => (
                <Link to={`/eventos/${e.id}`} className="block bg-surface-container/80 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-lg overflow-hidden group">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-48 md:h-72 overflow-hidden">
                      {e.imageUrl ? (
                        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={e.imageUrl} alt={e.title} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-container/60 via-surface-container-high to-surface-container-lowest flex items-center justify-center">
                          <span className="font-display-lg text-headline-xl font-extrabold text-on-surface/40">LI</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface-container" />
                    </div>
                    <div className="flex flex-col gap-space-xs p-space-lg justify-center">
                      <span className="font-code-badge text-code-badge text-secondary font-bold">
                        {e.status === 'UPCOMING' ? 'CONVOCATORIA VIGENTE' : e.status === 'COMPLETED' ? 'EDICIÓN REALIZADA' : 'CANCELADO'}
                        {e.date ? ` • ${new Date(e.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                      </span>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight leading-tight">{e.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed line-clamp-3">{e.description}</p>
                      <p className="font-body-md text-body-md text-tertiary font-semibold">
                        {participantCountByEvent[e.id] || 0} participantes · {e.place || 'UES Ixtlahuaca'}
                      </p>
                      <span className="inline-flex items-center gap-1 font-headline-sm text-body-md font-semibold text-secondary mt-1">
                        Ver detalles <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            />
          </section>
        )}

        {/* SECTION: Plataforma de Evaluadores (lista de cotejo 4.1): subsección
            exclusiva para evaluadores dentro de Certámenes. */}
        <section className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin pb-space-md">
          <div className="bg-gradient-to-r from-amber-400/10 via-surface-container to-surface-container-low border border-amber-400/30 rounded-2xl p-space-lg shadow-lg flex flex-col md:flex-row items-start md:items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-amber-400/15 flex items-center justify-center text-amber-300 shrink-0">
              <span className="material-symbols-outlined text-[28px]">grading</span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Plataforma de Evaluadores</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Los evaluadores del certamen ingresan con su usuario y contraseña para consultar los proyectos
                concursantes que deben evaluar y registrar sus calificaciones y observaciones.
              </p>
            </div>
            <Link to="/evaluadores" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-surface-container-lowest font-title-md font-bold hover:opacity-90 transition-opacity shrink-0">
              <span className="material-symbols-outlined text-[20px]">login</span>
              Acceso a evaluadores
            </Link>
          </div>
        </section>

        {/* SECTION: Interactive Filters & Modality Bar */}
        <section className="sticky top-20 z-30 w-full bg-surface-container-lowest/90 backdrop-blur-2xl py-space-sm mb-space-md shadow-md">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex flex-col gap-space-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-sm items-center">
              {/* Modality Segment Filter */}
              <div className="lg:col-span-12">
                <div className="relative w-full">
                  <select
                    className="w-full appearance-none px-space-md py-space-xs rounded-xl bg-surface-container/90 text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:bg-surface-container-high cursor-pointer pr-10"
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                  >
                    {MODALITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">sync_alt</span>
                </div>
              </div>
            </div>
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider hidden md:inline">Filtrar por fecha:</span>
              <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
                Desde
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-space-sm py-1.5 rounded-lg bg-surface-container/90 text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:bg-surface-container-high cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
                Hasta
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-space-sm py-1.5 rounded-lg bg-surface-container/90 text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:bg-surface-container-high cursor-pointer"
                />
              </label>
            </div>
            {/* Quick Chips: State Filters — conteos reales */}
            <div className="flex flex-wrap items-center gap-space-xs pt-1">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider mr-space-xs hidden md:inline">Filtrar por Estado:</span>
              <button
                className={`state-filter-btn px-space-md py-1.5 rounded-lg font-headline-sm text-body-md font-semibold shadow-sm transition-all flex items-center gap-space-xs ${stateFilter === 'all' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high/70 hover:bg-surface-container-highest text-on-surface-variant'}`}
                onClick={() => setStateFilter('all')}
              >
                <span>Todos</span>
                <span className="font-code-badge text-code-badge px-1.5 py-0.2 rounded-full bg-surface-container-lowest/30 text-on-primary">{countByStatus('')}</span>
              </button>
              <button
                className={`state-filter-btn px-space-md py-1.5 rounded-lg font-headline-sm text-body-md font-semibold transition-all flex items-center gap-space-xs ${stateFilter === 'upcoming' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high/70 hover:bg-surface-container-highest text-on-surface-variant'}`}
                onClick={() => setStateFilter('upcoming')}
              >
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span>Próximos</span>
                <span className="font-code-badge text-code-badge px-1.5 py-0.2 rounded-full bg-tertiary/20 text-tertiary">{countByStatus('UPCOMING')}</span>
              </button>
              <button
                className={`state-filter-btn px-space-md py-1.5 rounded-lg font-headline-sm text-body-md font-semibold transition-all flex items-center gap-space-xs ${stateFilter === 'completed' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high/70 hover:bg-surface-container-highest text-on-surface-variant'}`}
                onClick={() => setStateFilter('completed')}
              >
                <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                <span>Realizados</span>
                <span className="font-code-badge text-code-badge px-1.5 py-0.2 rounded-full bg-secondary/20 text-secondary">{countByStatus('COMPLETED')}</span>
              </button>
              <button
                className={`state-filter-btn px-space-md py-1.5 rounded-lg font-headline-sm text-body-md font-semibold transition-all flex items-center gap-space-xs ${stateFilter === 'cancelled' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high/70 hover:bg-surface-container-highest text-on-surface-variant'}`}
                onClick={() => setStateFilter('cancelled')}
              >
                <span className="material-symbols-outlined text-[14px] text-error">cancel</span>
                <span>Cancelados</span>
                <span className="font-code-badge text-code-badge px-1.5 py-0.2 rounded-full bg-error-container/40 text-error">{countByStatus('CANCELLED')}</span>
              </button>
              <div className="ml-auto hidden xl:flex items-center gap-space-xs font-code-badge text-code-badge text-outline">
                <span>ORDEN: CRONOLÓGICO CONAIC</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Event Cards Bento Grid */}
        <section className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin py-space-md">
          {loading && (
            <p className="font-body-md text-body-md text-on-surface-variant py-space-xl text-center">Cargando eventos...</p>
          )}
          {error && (
            <p className="font-body-md text-body-md text-error py-space-xl text-center">{error}</p>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
              {filtered.map((e, i) => (
                <div
                  key={e.id}
                  className={`h-full ${SPAN_CLS[cardSpans[i]] || SPAN_CLS[1]}`}
                >
                  <EventCard event={e} participantCount={participantCountByEvent[e.id] || 0} index={i} featured={i === 0} />
                </div>
              ))}
            </div>
          )}
          {/* Empty State Notification */}
          {!loading && !error && filtered.length === 0 && (
            <div className="w-full p-space-xl text-center rounded-2xl bg-surface-container-low/70 backdrop-blur-md my-space-md">
              <div className="w-16 h-16 mx-auto mb-space-sm rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[32px]">filter_alt_off</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">No se encontraron eventos con los criterios seleccionados</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mt-1">
                Prueba restableciendo los filtros.
              </p>
              <button
                className="mt-space-md px-space-lg py-space-sm rounded-xl bg-primary-container text-on-primary font-headline-sm text-body-md font-semibold hover:bg-primary transition-colors"
                onClick={resetFilters}
              >
                Restablecer Filtros
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
