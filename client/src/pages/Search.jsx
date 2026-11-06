import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchApi } from '../services/api';
import TiltCard from '../components/TiltCard';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramQ = searchParams.get('q') || '';
  const paramCategory = searchParams.get('category') || 'all';
  const paramStatus = searchParams.get('status') || 'all';
  const [q, setQ] = useState(paramQ);
  // Filtros que el backend ya soporta: ?category= (logros) y ?status= (eventos).
  const [category, setCategory] = useState(paramCategory);
  const [status, setStatus] = useState(paramStatus);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  // Entrada escalonada de las secciones de resultados: se reinicia en cada
  // búsqueda para que los resultados nuevos entren animados.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const t = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(t);
  }, [results]);

  const doSearch = useCallback(async (term, cat = 'all', st = 'all') => {
    const clean = (term || '').trim();
    if (!clean) {
      setResults(null);
      return;
    }
    try {
      const params = { q: clean };
      if (cat && cat !== 'all') params.category = cat;
      if (st && st !== 'all') params.status = st;
      const r = await searchApi.search(params);
      setResults(r);
      setError('');
    } catch {
      setError('La búsqueda falló. Verifica que el servidor esté corriendo.');
    }
  }, []);

  // Busca automáticamente cuando llega ?q= desde el Navbar (o al recargar /buscar?q=...).
  useEffect(() => {
    setQ(paramQ);
    setCategory(paramCategory);
    setStatus(paramStatus);
    if (paramQ.trim()) doSearch(paramQ, paramCategory, paramStatus);
    else setResults(null);
  }, [paramQ, paramCategory, paramStatus, doSearch]);

  const onSearch = async (e) => {
    e.preventDefault();
    const clean = q.trim();
    const params = {};
    if (clean) params.q = clean;
    if (category !== 'all') params.category = category;
    if (status !== 'all') params.status = status;
    setSearchParams(params);
    await doSearch(clean, category, status);
  };

  const onFilterChange = async (nextCategory, nextStatus) => {
    setCategory(nextCategory);
    setStatus(nextStatus);
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (nextCategory !== 'all') params.category = nextCategory;
    if (nextStatus !== 'all') params.status = nextStatus;
    setSearchParams(params);
    await doSearch(q, nextCategory, nextStatus);
  };

  const totalResults = results
    ? (results.students || []).length + (results.events || []).length + (results.achievements || []).length
    : 0;
  const entranceClass =
    `transition-all duration-500 ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`;
  const entranceStyle = (delay) => ({ transitionDelay: `${delay}ms` });

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="max-w-[1440px] mx-auto px-gutter py-margin">
        <p className="font-code-badge text-code-badge text-secondary tracking-wider uppercase">// Búsqueda global</p>
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-space-sm">Buscar en el portal</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">Busca estudiantes por nombre, eventos por nombre y logros por categoría.</p>
        <form onSubmit={onSearch} className="flex gap-space-sm mt-space-lg">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. Ana, Hackathon..."
            className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-space-md py-space-sm text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary/60 focus:ring-1 focus:ring-secondary/30"
          />
          <button className="px-space-lg py-space-sm rounded-full font-label-md text-label-md text-on-primary bg-gradient-to-r from-secondary to-primary-container hover:brightness-110 shadow-[0_0_20px_rgba(93,230,255,0.25)] transition-all font-semibold inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">search</span>
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-space-sm mt-space-md">
          <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
            Categoría de logro
            <select
              value={category}
              onChange={(e) => onFilterChange(e.target.value, status)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-space-sm py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary/60"
            >
              <option value="all">Todas</option>
              {['Académico', 'Concurso', 'Investigación', 'Innovación', 'Certificación'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
            Estado de evento
            <select
              value={status}
              onChange={(e) => onFilterChange(category, e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-space-sm py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary/60"
            >
              <option value="all">Todos</option>
              <option value="UPCOMING">Próximos</option>
              <option value="COMPLETED">Realizados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </label>
        </div>
        {error && <p className="text-error font-body-md text-body-md mt-space-md">{error}</p>}
        {results && totalResults === 0 && (
          <div className={`mt-space-lg bg-surface-container border border-outline-variant/20 rounded-xl p-space-xl text-center flex flex-col items-center gap-space-sm ${entranceClass}`} style={entranceStyle(0)}>
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary anim-float">
              <span className="material-symbols-outlined text-[36px]">search_off</span>
            </div>
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">Sin resultados para «{paramQ}»</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">Prueba con otro término: un nombre de estudiante, un evento o una categoría de logro.</p>
          </div>
        )}
        {results && totalResults > 0 && (
          <div className="space-y-space-lg mt-space-lg">
            <section className={`bg-surface-container border border-outline-variant/20 rounded-xl p-space-lg ${entranceClass}`} style={entranceStyle(0)}>
              <h2 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary anim-float">school</span>
                Estudiantes ({(results.students || []).length})
              </h2>
              {(results.students || []).map((s, i) => (
                <TiltCard key={s.id} max={6} scale={1.01} className="rounded-lg">
                  <Link to={`/estudiantes/${s.id}`} style={entranceStyle(120 + i * 60)} className={`group flex items-center gap-2 py-space-sm border-b border-outline-variant/20 last:border-0 text-secondary font-body-md text-body-md hover:underline ${entranceClass}`}>
                    <span className="material-symbols-outlined text-[20px] text-secondary/70 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">school</span>
                    {s.publicName}
                  </Link>
                </TiltCard>
              ))}
              {(results.students || []).length === 0 && <p className="text-on-surface-variant font-body-md text-body-md mt-space-sm">Sin resultados.</p>}
            </section>
            <section className={`bg-surface-container border border-outline-variant/20 rounded-xl p-space-lg ${entranceClass}`} style={entranceStyle(120)}>
              <h2 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary anim-float">event</span>
                Eventos ({(results.events || []).length})
              </h2>
              {(results.events || []).map((e, i) => (
                <TiltCard key={e.id} max={6} scale={1.01} className="rounded-lg">
                  <Link to={`/eventos/${e.id}`} style={entranceStyle(240 + i * 60)} className={`group flex items-center gap-2 py-space-sm border-b border-outline-variant/20 last:border-0 text-secondary font-body-md text-body-md hover:underline ${entranceClass}`}>
                    <span className="material-symbols-outlined text-[20px] text-secondary/70 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">event</span>
                    {e.title}
                  </Link>
                </TiltCard>
              ))}
              {(results.events || []).length === 0 && <p className="text-on-surface-variant font-body-md text-body-md mt-space-sm">Sin resultados.</p>}
            </section>
            <section className={`bg-surface-container border border-outline-variant/20 rounded-xl p-space-lg ${entranceClass}`} style={entranceStyle(240)}>
              <h2 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary anim-float">emoji_events</span>
                Logros ({(results.achievements || []).length})
              </h2>
              {(results.achievements || []).map((a, i) => (
                <TiltCard key={a.id} max={6} scale={1.01} className="rounded-lg">
                  <p style={entranceStyle(360 + i * 60)} className={`group flex items-center gap-2 py-space-sm border-b border-outline-variant/20 last:border-0 font-body-md text-body-md text-on-surface ${entranceClass}`}>
                    <span className="material-symbols-outlined text-[20px] text-tertiary transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">emoji_events</span>
                    <span>{a.title} — {a.student?.publicName} ({a.category})</span>
                  </p>
                </TiltCard>
              ))}
              {(results.achievements || []).length === 0 && <p className="text-on-surface-variant font-body-md text-body-md mt-space-sm">Sin resultados.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
