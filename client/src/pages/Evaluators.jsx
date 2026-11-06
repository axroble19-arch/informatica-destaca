import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { evaluationsApi } from '../services/api';

/**
 * Plataforma de Evaluadores (lista de cotejo 4.1–4.5): subsección exclusiva
 * dentro de Certámenes. El evaluador entra con usuario y contraseña
 * (rol EVALUATOR), consulta los proyectos concursantes que debe evaluar,
 * registra su calificación (0–10) y observaciones, y consulta sus
 * evaluaciones. El admin consulta todas las evaluaciones. Las calificaciones
 * nunca se muestran en las vistas públicas.
 */

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'EV';
}

function Avatar({ student }) {
  if (student?.photoUrl) {
    return <img className="w-12 h-12 rounded-full object-cover ring-1 ring-secondary/30" src={student.photoUrl} alt={student.publicName} />;
  }
  return (
    <span className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
      {initials(student?.publicName)}
    </span>
  );
}

export default function Evaluators() {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forms, setForms] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');

  const isEvaluator = user?.role === 'EVALUATOR';
  const isAdmin = user?.role === 'ADMIN';

  const load = useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError('');
    const jobs = [];
    if (isEvaluator) {
      jobs.push(evaluationsApi.assignments().then(setAssignments).catch(() => setError('No se pudieron cargar los proyectos por evaluar.')));
      jobs.push(evaluationsApi.list().then(setEvaluations).catch(() => {}));
    } else if (isAdmin) {
      jobs.push(evaluationsApi.list().then(setEvaluations).catch(() => setError('No se pudieron cargar las evaluaciones.')));
    } else {
      setLoading(false);
      return;
    }
    Promise.all(jobs).finally(() => setLoading(false));
  }, [user, isEvaluator, isAdmin]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  // Prellenar cada formulario con la evaluación ya registrada (si existe).
  useEffect(() => {
    const next = {};
    assignments.forEach((a) => {
      if (a.myEvaluation) {
        next[a.id] = { score: String(a.myEvaluation.score ?? ''), observations: a.myEvaluation.observations || '' };
      } else {
        next[a.id] = { score: '', observations: '' };
      }
    });
    setForms(next);
  }, [assignments]);

  const stats = useMemo(() => {
    const assigned = assignments.length;
    const evaluated = assignments.filter((a) => a.myEvaluation).length;
    const myScores = evaluations.filter((e) => e.evaluatorId === user?.id).map((e) => e.score);
    const myAvg = myScores.length > 0 ? (myScores.reduce((a, b) => a + b, 0) / myScores.length) : null;
    const allAvg = evaluations.length > 0
      ? evaluations.reduce((a, e) => a + e.score, 0) / evaluations.length
      : null;
    return { assigned, evaluated, pending: assigned - evaluated, myAvg, allAvg, total: evaluations.length };
  }, [assignments, evaluations, user]);

  const handleSave = async (assignment) => {
    const form = forms[assignment.id] || {};
    const score = Number(form.score);
    if (Number.isNaN(score) || score < 0 || score > 10) {
      setError('La calificación debe ser un número entre 0 y 10.');
      return;
    }
    setSavingId(assignment.id);
    setError('');
    setSavedMsg('');
    try {
      await evaluationsApi.save({
        participationId: assignment.id,
        score,
        observations: (form.observations || '').trim() || null,
      });
      setSavedMsg(`Calificación guardada para ${assignment.student?.publicName || 'el proyecto'}.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar la evaluación. Inténtalo de nuevo.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="w-full bg-surface-container-lowest min-h-screen pt-20">
      <div className="max-w-[1440px] mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
        {/* Encabezado */}
        <section className="flex flex-col gap-space-xs">
          <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high/90 shadow-sm w-fit">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-code-badge text-code-badge text-amber-300 tracking-widest uppercase">Subsección de Certámenes · Acceso restringido</span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg font-extrabold tracking-tight text-on-surface">
            Plataforma de Evaluadores
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Espacio exclusivo para el panel de evaluadores de los certámenes de la Licenciatura en Informática.
            Aquí se consultan los proyectos concursantes asignados y se registran las calificaciones y
            observaciones. Las evaluaciones solo las ven los evaluadores y el administrador del portal.
          </p>
        </section>

        {error && (
          <p className="bg-error/10 border border-error/40 rounded-xl p-space-md text-on-surface font-body-md">{error}</p>
        )}
        {savedMsg && (
          <p className="bg-tertiary/10 border border-tertiary/40 rounded-xl p-space-md text-on-surface font-body-md">{savedMsg}</p>
        )}

        {authLoading || loading ? (
          <p className="font-body-md text-body-md text-on-surface-variant py-space-xl text-center">Cargando plataforma de evaluadores...</p>
        ) : !user ? (
          /* Sin sesión: presentación pública + acceso */
          <section className="bg-surface-container/80 backdrop-blur-xl rounded-2xl border border-outline-variant/30 p-space-lg shadow-lg flex flex-col gap-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Acceso para evaluadores</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Los evaluadores del certamen ingresan con su usuario y contraseña institucionales. Una vez dentro,
              ven la lista de proyectos concursantes que deben evaluar, registran una calificación de 0 a 10 con
              sus observaciones por proyecto, y pueden consultar las evaluaciones que ya realizaron.
            </p>
            <ul className="flex flex-col gap-space-xs font-body-md text-body-md text-on-surface-variant">
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">assignment</span> Proyectos concursantes de los certámenes, con su evidencia.</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">grading</span> Instrumento de calificación: puntaje de 0 a 10 y observaciones.</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">lock</span> Las calificaciones solo las ven los evaluadores y el administrador.</li>
            </ul>
            <div className="flex flex-wrap gap-space-sm">
              <Link to="/login" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-surface-container-lowest font-title-md font-bold hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[20px]">login</span>
                Iniciar sesión como evaluador
              </Link>
              <Link to="/eventos" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface font-title-md font-semibold border border-outline-variant/30">
                <span className="material-symbols-outlined text-secondary text-[20px]">emoji_events</span>
                Ver certámenes
              </Link>
            </div>
            <p className="font-code-badge text-code-badge text-on-surface-variant">
              ¿Eres evaluador y no tienes cuenta? El administrador del portal crea tu acceso desde Panel de Administración → Usuarios.
            </p>
          </section>
        ) : !isEvaluator && !isAdmin ? (
          /* Sesión con otro rol: sin acceso */
          <section className="bg-surface-container/80 backdrop-blur-xl rounded-2xl border border-outline-variant/30 p-space-lg shadow-lg flex flex-col gap-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Acceso restringido</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Tu perfil ({user.role === 'STUDENT' ? 'estudiante' : 'responsable de contenido'}) no tiene acceso a la
              plataforma de evaluadores. Solo los evaluadores designados y el administrador pueden consultar y
              registrar evaluaciones.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface font-title-md font-semibold border border-outline-variant/30 w-fit">
              <span className="material-symbols-outlined text-secondary text-[20px]">home</span>
              Volver al inicio
            </Link>
          </section>
        ) : isEvaluator ? (
          <>
            {/* Métricas del evaluador */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {[
                { label: 'Proyectos asignados', value: stats.assigned, icon: 'assignment' },
                { label: 'Evaluados por ti', value: stats.evaluated, icon: 'grading' },
                { label: 'Pendientes', value: stats.pending, icon: 'pending_actions' },
                { label: 'Tu promedio', value: stats.myAvg == null ? '—' : stats.myAvg.toFixed(1), icon: 'star' },
              ].map((m) => (
                <div key={m.label} className="p-space-md rounded-xl bg-surface-container/80 backdrop-blur-xl shadow-md border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-md text-label-md text-outline uppercase tracking-wider">{m.label}</span>
                    <span className="material-symbols-outlined text-amber-300 text-[18px]">{m.icon}</span>
                  </div>
                  <span className="font-display-lg text-headline-xl font-extrabold text-on-surface">{m.value}</span>
                </div>
              ))}
            </section>

            {/* Proyectos por evaluar */}
            <section className="flex flex-col gap-space-md">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Proyectos por evaluar</h2>
              {assignments.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">No hay proyectos concursantes aprobados por evaluar todavía.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                  {assignments.map((a) => {
                    const form = forms[a.id] || { score: '', observations: '' };
                    return (
                      <article key={a.id} className="bg-surface-container/80 backdrop-blur-xl rounded-2xl border border-outline-variant/30 p-space-lg shadow-lg flex flex-col gap-space-md">
                        <div className="flex items-start gap-space-md">
                          <Avatar student={a.student} />
                          <div className="flex flex-col min-w-0">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{a.student?.publicName}</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                              {a.student?.semester ? `${a.student.semester}° Semestre` : 'Estudiante'}
                              {a.student?.generation ? ` • Generación ${a.student.generation}` : ''}
                            </p>
                            <p className="font-code-badge text-code-badge text-secondary">{a.event?.title}</p>
                            <p className="font-code-badge text-code-badge text-outline">{fmtDate(a.event?.date)}{a.event?.place ? ` • ${a.event.place}` : ''}</p>
                          </div>
                          {a.myEvaluation && (
                            <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary font-code-badge text-code-badge font-bold">
                              Evaluado: {Number(a.myEvaluation.score).toFixed(1)} / 10
                            </span>
                          )}
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                          {a.description || 'Proyecto concursante del certamen.'}
                          {a.result ? ` Resultado: ${a.result}.` : ''}
                        </p>
                        {a.evidenceUrl && (
                          <a href={a.evidenceUrl} target="_blank" rel="noreferrer" className="font-body-md text-body-md text-secondary hover:underline break-all">
                            Ver evidencia del proyecto
                          </a>
                        )}
                        {a.average?.count > 0 && (
                          <p className="font-code-badge text-code-badge text-on-surface-variant">
                            Promedio general: {Number(a.average.avg).toFixed(1)} / 10 ({a.average.count} {a.average.count === 1 ? 'evaluación' : 'evaluaciones'})
                          </p>
                        )}
                        {/* Instrumento de evaluación */}
                        <div className="flex flex-col gap-space-sm border-t border-outline-variant/20 pt-space-md">
                          <label className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                            Tu calificación (0 a 10)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={form.score}
                            onChange={(e) => setForms((f) => ({ ...f, [a.id]: { ...form, score: e.target.value } }))}
                            placeholder="Ej. 9.5"
                            className="w-32 px-space-sm py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:border-secondary"
                          />
                          <label className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                            Observaciones
                          </label>
                          <textarea
                            rows={3}
                            value={form.observations}
                            onChange={(e) => setForms((f) => ({ ...f, [a.id]: { ...form, observations: e.target.value } }))}
                            placeholder="Fortalezas, áreas de mejora y comentarios para el equipo..."
                            className="w-full px-space-sm py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:border-secondary resize-y"
                          />
                          <button
                            type="button"
                            onClick={() => handleSave(a)}
                            disabled={savingId === a.id}
                            className="self-start inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-surface-container-lowest font-title-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            {savingId === a.id ? 'Guardando...' : a.myEvaluation ? 'Actualizar evaluación' : 'Guardar evaluación'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Mis evaluaciones */}
            <section className="flex flex-col gap-space-md">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Mis evaluaciones realizadas</h2>
              {evaluations.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">Aún no registras evaluaciones.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container/80">
                  <table className="w-full text-left font-body-md text-body-md">
                    <thead>
                      <tr className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider border-b border-outline-variant/20">
                        <th className="px-4 py-3">Proyecto / Estudiante</th>
                        <th className="px-4 py-3">Certamen</th>
                        <th className="px-4 py-3">Calificación</th>
                        <th className="px-4 py-3">Observaciones</th>
                        <th className="px-4 py-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((e) => (
                        <tr key={e.id} className="border-b border-outline-variant/10 text-on-surface">
                          <td className="px-4 py-3 font-semibold">{e.participation?.student?.publicName}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{e.participation?.event?.title}</td>
                          <td className="px-4 py-3 font-bold text-amber-300">{Number(e.score).toFixed(1)} / 10</td>
                          <td className="px-4 py-3 text-on-surface-variant">{e.observations || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{fmtDate(e.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Vista del ADMIN: todas las evaluaciones */
          <>
            <section className="grid grid-cols-2 md:grid-cols-3 gap-gutter">
              {[
                { label: 'Evaluaciones registradas', value: stats.total, icon: 'grading' },
                { label: 'Promedio general', value: stats.allAvg == null ? '—' : stats.allAvg.toFixed(1), icon: 'star' },
                { label: 'Proyectos evaluados', value: new Set(evaluations.map((e) => e.participationId)).size, icon: 'assignment' },
              ].map((m) => (
                <div key={m.label} className="p-space-md rounded-xl bg-surface-container/80 backdrop-blur-xl shadow-md border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-md text-label-md text-outline uppercase tracking-wider">{m.label}</span>
                    <span className="material-symbols-outlined text-amber-300 text-[18px]">{m.icon}</span>
                  </div>
                  <span className="font-display-lg text-headline-xl font-extrabold text-on-surface">{m.value}</span>
                </div>
              ))}
            </section>
            <section className="flex flex-col gap-space-md">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Todas las evaluaciones</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Consulta restringida al administrador. Las calificaciones no se publican en las vistas del portal.
                Las cuentas de evaluador se crean en Panel de Administración → Usuarios.
              </p>
              {evaluations.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">Aún no hay evaluaciones registradas.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container/80">
                  <table className="w-full text-left font-body-md text-body-md">
                    <thead>
                      <tr className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider border-b border-outline-variant/20">
                        <th className="px-4 py-3">Evaluador</th>
                        <th className="px-4 py-3">Proyecto / Estudiante</th>
                        <th className="px-4 py-3">Certamen</th>
                        <th className="px-4 py-3">Calificación</th>
                        <th className="px-4 py-3">Observaciones</th>
                        <th className="px-4 py-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((e) => (
                        <tr key={e.id} className="border-b border-outline-variant/10 text-on-surface">
                          <td className="px-4 py-3 font-semibold">{e.evaluator?.name}<span className="block text-on-surface-variant font-normal text-sm">{e.evaluator?.email}</span></td>
                          <td className="px-4 py-3">{e.participation?.student?.publicName}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{e.participation?.event?.title}</td>
                          <td className="px-4 py-3 font-bold text-amber-300">{Number(e.score).toFixed(1)} / 10</td>
                          <td className="px-4 py-3 text-on-surface-variant">{e.observations || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{fmtDate(e.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
