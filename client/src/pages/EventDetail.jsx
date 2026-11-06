import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventsApi, mediaApi } from '../services/api';
import { galleryPosterFor, withEventCover } from '../data/stitchImages';
import AutoCarousel from '../components/AutoCarousel';
import {
  STATUS_META,
  PARTICIPATION_TYPE_LABELS,
  eventFolio,
  formatDateLong,
  formatDateShort,
  initialsOf,
} from '../components/EventCard';

/**
 * Port fiel del detalle de evento de Stitch
 * (eventos_inform_tica_destaca_agenda_hackathons_multimedia/code.html,
 *  sección "Interactive Modal / Detailed Event Inspector").
 * En Stitch era un modal; aquí es la página /eventos/:id (las rutas no
 * cambian). Datos reales: participaciones APROBADAS incluidas en
 * eventsApi.get(id) y galería con mediaApi.list({ eventId }) — solo
 * material con consentToPublish.
 */

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-cyan-400',
  'from-cyan-400 to-emerald-400',
  'from-emerald-400 to-indigo-500',
  'from-fuchsia-500 to-indigo-500',
  'from-amber-400 to-rose-500',
  'from-teal-400 to-cyan-500',
];

const WINNER_RE = /(primer|segundo|tercer|1er|2do|3er|1°|2°|3°|lugar|ganador|finalista|premi)/i;
const PODIUM = [
  { label: '1ER LUGAR // CAMPEÓN ORO', icon: 'military_tech', iconClass: 'text-secondary', labelClass: 'text-secondary', cardClass: 'bg-surface-container-high' },
  { label: '2DO LUGAR // PLATA', icon: 'workspace_premium', iconClass: 'text-primary-fixed-dim', labelClass: 'text-primary-fixed-dim', cardClass: 'bg-surface-container-low' },
  { label: '3ER LUGAR // BRONCE', icon: 'verified', iconClass: 'text-outline', labelClass: 'text-outline', cardClass: 'bg-surface-container-low' },
];

function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(url);
}

function isDirectVideoUrl(url) {
  return !!url && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Visor en la página: las fotos se abren aquí mismo, sin salir del portal.
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const lightboxItem = lightboxIndex === null ? null : gallery[lightboxIndex];

  useEffect(() => {
    setLoading(true);
    Promise.all([eventsApi.get(id), mediaApi.list({ eventId: id })])
      .then(([evt, media]) => {
        setEvent(evt && withEventCover(evt));
        setGallery(Array.isArray(media) ? media : []);
      })
      .catch(() => setError('Evento no encontrado.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Teclado del visor: Esc cierra, flechas cambian de foto.
  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + gallery.length) % gallery.length);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % gallery.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, gallery.length]);

  if (loading) {
    return (
      <div className="w-full bg-surface-container-lowest min-h-screen pt-20">
        <p className="p-8 font-body-md text-body-md text-on-surface-variant text-center">Cargando evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full bg-surface-container-lowest min-h-screen pt-20">
        <p className="p-8 font-body-md text-body-md text-error text-center">{error || 'Evento no encontrado.'}</p>
        <p className="text-center">
          <Link to="/eventos" className="font-headline-sm text-body-md font-semibold text-secondary">← Volver a Eventos</Link>
        </p>
      </div>
    );
  }

  const meta = STATUS_META[event.status] || STATUS_META.UPCOMING;
  const participations = event.participations || [];
  const winners = participations.filter((p) => p.result && WINNER_RE.test(p.result)).slice(0, 3);
  const dateShort = formatDateShort(event.date);
  const dateLong = formatDateLong(event.date);
  const dayMonth = dateShort ? dateShort.split(' ').slice(0, 2).join(' ') : '';

  return (
    <div className="w-full bg-surface-container-lowest min-h-screen pt-20">
      <div className="flex flex-col w-full text-on-surface">
        <div className={`relative w-full max-w-5xl mx-auto max-h-none flex flex-col rounded-2xl bg-surface-container/95 shadow-xl overflow-hidden my-space-md`}>
          {/* Modal Top Bar */}
          <div className="relative w-full h-44 sm:h-56 bg-surface-container-lowest overflow-hidden shrink-0">
            {event.imageUrl ? (
              <img className="w-full h-full object-cover" alt={event.title} src={event.imageUrl} />
            ) : (
              <div
                className="w-full h-full bg-gradient-to-br from-primary-container/60 via-surface-container-high to-surface-container-lowest flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="font-display-lg text-headline-xl font-extrabold tracking-tight text-on-surface/40">
                  {initialsOf(event.title)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/60 to-transparent"></div>
            {/* Close Button → volver al listado */}
            <Link
              to="/eventos"
              aria-label="Volver a eventos"
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-highest text-on-surface flex items-center justify-center backdrop-blur-md shadow-md transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </Link>
            <div className="absolute top-4 left-4 flex flex-wrap gap-space-xs">
              <span className={`px-space-md py-1 rounded-full font-code-badge text-code-badge font-bold ${meta.badgeClass}`}>
                {meta.badge}
              </span>
              <span className="font-code-badge text-code-badge px-space-xs py-1 rounded bg-surface-container-lowest/80 text-secondary backdrop-blur-md">
                FOLIO REGISTRO: {eventFolio(event)}
              </span>
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1">
              <span className="font-code-badge text-code-badge text-secondary">
                {meta.label.toUpperCase()} • {dateShort}
                {event.time ? ` • ${event.time} HRS` : ''}
              </span>
              <h2 className="font-headline-xl text-headline-xl font-extrabold text-on-surface tracking-tight">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-space-md sm:p-space-lg overflow-y-auto flex flex-col gap-space-lg text-body-md font-body-md">
            {/* Quick Metadata Ribbon — datos reales del evento */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-space-sm p-space-md rounded-xl bg-surface-container-high/60 shadow-sm font-label-md text-label-md`}>
              <div className="flex flex-col">
                <span className="text-outline uppercase">MODALIDAD Y SEDE</span>
                <span className="font-bold text-on-surface">{event.modality || '—'}{event.place ? ` · ${event.place}` : ''}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-outline uppercase">FECHA DE EJECUCIÓN</span>
                <span className="font-bold text-on-surface">{dateLong}{event.time ? ` · ${event.time}` : ''}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-outline uppercase">PARTICIPANTES APROBADOS</span>
                <span className="font-bold text-tertiary">{participations.length} Participante{participations.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-outline uppercase">ORGANIZADOR</span>
                <span className="font-bold text-secondary">{event.organizer || 'Licenciatura en Informática'}</span>
              </div>
            </div>

            {/* Convocatoria vigente (lista de cotejo 3.3): solo para el
                certamen próximo. La descripción del evento trae las fechas,
                los requisitos y los datos relevantes de la convocatoria. */}
            {event.status === 'UPCOMING' && event.category === 'Certamen' ? (
              <div className="flex flex-col gap-space-md rounded-2xl border border-tertiary/40 bg-tertiary/10 p-space-lg shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">campaign</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Convocatoria Vigente</h3>
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-tertiary/20 text-tertiary font-code-badge text-code-badge font-bold">REGISTRO ABIERTO</span>
                </div>
                <p className="text-on-surface leading-relaxed whitespace-pre-line">
                  {event.description || 'Convocatoria del certamen.'}
                </p>
                <div className="flex flex-wrap gap-space-sm">
                  <Link to="/admin" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-gradient-to-r from-tertiary to-emerald-500 text-surface-container-lowest font-title-md font-bold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    Registrar participaciones
                  </Link>
                  <Link to="/evaluadores" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface font-title-md font-semibold border border-outline-variant/30">
                    <span className="material-symbols-outlined text-amber-300 text-[20px]">grading</span>
                    Acceso a evaluadores
                  </Link>
                </div>
              </div>
            ) : (
              /* Description Section */
              <div className={`flex flex-col gap-space-xs`}>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary">psychology</span>
                  Objetivo y Contexto del Reto Tecnológico
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {event.description || 'Este evento no tiene descripción registrada.'}
                </p>
              </div>
            )}

            {/* Schedule / Agenda Timeline — un solo día real (la BD guarda
                una única fecha/hora/lugar por evento; no existe la agenda
                de 3 días de Stitch) */}
            <div className={`flex flex-col gap-space-sm`}>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Cronograma Operativo de la Jornada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-xs transition-all duration-300 hover:shadow-md hover:bg-surface-container-high/70">
                  <div className="flex items-center justify-between">
                    <span className="font-code-badge text-code-badge text-secondary font-bold">JORNADA ÚNICA</span>
                    <span className="font-code-badge text-code-badge text-outline">{dayMonth}</span>
                  </div>
                  <ul className="space-y-2 text-on-surface-variant font-body-md text-body-md">
                    <li><strong className="text-on-surface">Fecha:</strong> {dateLong}</li>
                    {event.time && <li><strong className="text-on-surface">Horario:</strong> {event.time}</li>}
                    {event.place && <li><strong className="text-on-surface">Lugar:</strong> {event.place}</li>}
                    {event.modality && <li><strong className="text-on-surface">Modalidad:</strong> {event.modality}</li>}
                    {event.organizer && <li><strong className="text-on-surface">Organiza:</strong> {event.organizer}</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Participants Matrix — participaciones APROBADAS reales */}
            <div className={`flex flex-col gap-space-xs`}>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary">star</span>
                  Cuadro de Estudiantes Destacados en el Encuentro
                </h3>
                <span className="font-code-badge text-code-badge text-outline">BASE DE DATOS ACADÉMICA UMB</span>
              </div>
              {participations.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">Sin participantes aprobados registrados todavía.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-sm">
                  {participations.map((p, i) => {
                    const student = p.student || {};
                    const detail = [
                      student.semester ? `${student.semester}° Semestre` : null,
                      (student.interests && student.interests[0]) || (student.skills && student.skills[0]) || null,
                    ].filter(Boolean).join(' · ');
                    return (
                      <div key={p.id} className="p-space-md rounded-xl bg-surface-container-low flex items-center gap-space-sm shadow-sm transition-all duration-300 hover:shadow-md hover:bg-surface-container-high/80 group">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-headline-sm shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                          {initialsOf(student.publicName || 'Estudiante')}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline-sm text-body-md font-bold text-on-surface truncate">{student.publicName || 'Estudiante'}</span>
                          {detail && <span className="font-label-md text-label-md text-outline">{detail}</span>}
                          <span className="font-code-badge text-code-badge text-tertiary font-bold">
                            {PARTICIPATION_TYPE_LABELS[p.type] || p.type}
                            {p.result ? ` · ${p.result}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Winners & Podiums — carrusel automático (lista de cotejo 3.6):
                un ganador por diapositiva, avanza solo cada 4.5 s. */}
            {winners.length > 0 && (
              <div className={`flex flex-col gap-space-xs`}>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary">emoji_events</span>
                  Resolución Oficial de Ganadores
                </h3>
                <AutoCarousel
                  items={winners}
                  intervalMs={4500}
                  ariaLabel="Carrusel automático de ganadores"
                  renderItem={(p) => {
                    const i = winners.findIndex((w) => w.id === p.id);
                    const podium = PODIUM[i] || PODIUM[2];
                    return (
                      <div className={`p-space-md rounded-xl ${podium.cardClass} shadow-sm flex flex-col gap-space-xs`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-code-badge text-code-badge font-bold ${podium.labelClass}`}>{podium.label}</span>
                          <span className={`material-symbols-outlined ${podium.iconClass}`}>{podium.icon}</span>
                        </div>
                        <span className="font-headline-sm text-title-md font-bold text-on-surface">{p.student?.publicName || 'Estudiante'}</span>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {p.description || PARTICIPATION_TYPE_LABELS[p.type] || p.type}
                        </p>
                        <span className="font-code-badge text-code-badge text-tertiary mt-auto">{p.result}</span>
                      </div>
                    );
                  }}
                />
              </div>
            )}

            {/* Panel de Evaluadores (lista de cotejo 4.1): subsección exclusiva
                para evaluadores dentro de cada certamen. */}
            {event.category === 'Certamen' && (
              <div className="flex flex-col gap-space-sm rounded-2xl border border-amber-400/30 bg-amber-400/5 p-space-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-amber-300 text-[24px]">grading</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Panel de Evaluadores</h3>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Este certamen es evaluado por un panel de especialistas. Los evaluadores ingresan con su usuario
                  y contraseña para consultar los proyectos concursantes asignados y registrar sus calificaciones
                  y observaciones. Las evaluaciones son confidenciales.
                </p>
                <div>
                  <Link to="/evaluadores" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-surface-container-lowest font-title-md font-bold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    Acceso a evaluadores
                  </Link>
                </div>
              </div>
            )}

            {/* Mini Bento Photo Gallery — solo si hay media con consentimiento */}
            {gallery.length > 0 && (
              <div className={`flex flex-col gap-space-xs`}>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary">photo_library</span>
                  Evidencia Multimedia y Registro Fotográfico
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm h-48">
                  {gallery.map((m, i) => (
                    <div key={m.id} className="relative rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        title={`${m.title} — ver ampliada`}
                        className="relative rounded-xl overflow-hidden bg-surface-container-lowest block transition-all duration-300 hover:shadow-xl hover:shadow-secondary/20 h-full w-full cursor-pointer text-left"
                      >
                        {m.type === 'IMAGE' ? (
                          <img className="w-full h-full object-cover" alt={m.title} src={m.url} />
                        ) : (
                          <span className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center gap-space-xs p-space-sm text-center">
                            <img src={galleryPosterFor(m)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <span className="absolute inset-0 bg-surface-container-lowest/50" />
                            <span className="material-symbols-outlined text-[32px] text-secondary relative">
                              {m.type === 'VIDEO' ? 'videocam' : 'link'}
                            </span>
                            <span className="font-label-md text-label-md text-on-surface line-clamp-2 relative">{m.title}</span>
                            <span className="font-code-badge text-code-badge text-outline uppercase relative">{m.type}</span>
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action / Download Buttons — sin descargas reales en la BD:
                se conserva la barra con el folio real y el regreso al listado */}
            <div className={`flex flex-wrap items-center justify-between gap-space-md pt-space-md bg-surface-container-high/40 p-space-md rounded-xl`}>
              <div className="flex items-center gap-space-sm text-on-surface-variant font-label-md text-label-md">
                <span className="material-symbols-outlined text-tertiary">qr_code_2</span>
                <span>Folio de Registro: #{eventFolio(event)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <Link to="/eventos" className="px-space-md py-space-xs rounded-xl bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-body-md font-semibold transition-colors flex items-center gap-space-xs shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver a Eventos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visor de evidencia en la página: la foto se abre aquí mismo, sin salir del portal */}
      {lightboxItem && (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-50 bg-surface-container-lowest/95 backdrop-blur-2xl flex items-center justify-center p-space-sm md:p-space-lg"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxIndex(null); }}
        >
          <div className="relative w-full max-w-4xl rounded-2xl bg-surface-container-low/95 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="absolute top-4 right-4 z-30">
              <button
                className="w-10 h-10 rounded-full bg-surface-container-highest/80 hover:bg-surface-container-highest text-on-surface hover:text-secondary flex items-center justify-center transition-colors shadow-md cursor-pointer"
                onClick={() => setLightboxIndex(null)}
                title="Cerrar visor (Esc)"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="relative bg-surface-container-lowest flex items-center justify-center min-h-[300px] overflow-hidden">
              {lightboxItem.type === 'IMAGE' && isImageUrl(lightboxItem.url) ? (
                <img alt={lightboxItem.title} className="w-full max-h-[70vh] object-contain bg-surface-container-lowest" src={lightboxItem.url} />
              ) : lightboxItem.type === 'VIDEO' && isDirectVideoUrl(lightboxItem.url) ? (
                <video className="w-full max-h-[70vh] object-contain bg-surface-container-lowest" src={lightboxItem.url} controls autoPlay />
              ) : lightboxItem.type === 'VIDEO' && youtubeId(lightboxItem.url) ? (
                <iframe
                  title={lightboxItem.title}
                  src={`https://www.youtube.com/embed/${youtubeId(lightboxItem.url)}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full min-h-[300px] md:min-h-[480px]"
                />
              ) : (
                <div className="relative w-full min-h-[300px] md:min-h-[420px] flex flex-col items-center justify-center gap-space-sm p-space-lg text-center">
                  <img src={galleryPosterFor(lightboxItem)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  <span className="material-symbols-outlined text-[64px] text-on-surface/60 relative">{lightboxItem.type === 'VIDEO' ? 'smart_display' : 'description'}</span>
                  <span className="font-body-md text-body-md text-on-surface-variant max-w-md relative">Esta pieza se abre en su fuente original.</span>
                </div>
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container text-on-surface hover:text-secondary flex items-center justify-center transition-all shadow-lg cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length); }}
                    title="Foto anterior (←)"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container text-on-surface hover:text-secondary flex items-center justify-center transition-all shadow-lg cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % gallery.length); }}
                    title="Foto siguiente (→)"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between gap-space-md p-space-md bg-surface-container">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-title-md text-title-md font-bold text-on-surface truncate">{lightboxItem.title}</span>
                <span className="font-code-badge text-code-badge text-outline">{lightboxIndex + 1} / {gallery.length}{lightboxItem.description ? ` · ${lightboxItem.description}` : ''}</span>
              </div>
              {!(lightboxItem.type === 'IMAGE' && isImageUrl(lightboxItem.url)) && (
                <a
                  className="shrink-0 inline-flex items-center gap-2 px-space-md py-2 rounded-xl bg-gradient-to-r from-inverse-primary to-secondary-container text-on-primary font-label-md text-label-md font-semibold shadow-md hover:opacity-95 transition-opacity"
                  href={lightboxItem.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>Abrir original</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
