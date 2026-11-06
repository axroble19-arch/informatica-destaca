import { Link } from 'react-router-dom';

/**
 * Port fiel de la tarjeta de evento de Stitch
 * (eventos_inform_tica_destaca_agenda_hackathons_multimedia/code.html,
 *  sección "Event Cards Bento Grid").
 * Datos reales de la API; sin la imagen de ejemplo de Stitch: si el evento
 * no trae imageUrl se muestra un degradado con las iniciales del título.
 */

const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

export function formatDateShort(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateLong(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function eventYear(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : String(d.getFullYear());
}

/** Folio derivado del id real (Stitch usaba folios escritos a mano). */
export function eventFolio(event) {
  return `UMB-EVT-${eventYear(event.date)}-${String(event.id).padStart(4, '0')}`;
}

export function initialsOf(name) {
  if (!name) return 'ID';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const STATUS_META = {
  UPCOMING: {
    label: 'Próximo',
    badge: 'PRÓXIMO // REGISTRO ABIERTO',
    badgeIcon: null, // punto pulsante (como en Stitch)
    badgeClass: 'bg-tertiary-container/90 text-on-tertiary-container',
    codeClass: 'text-secondary',
    dateIcon: 'alarm',
    dateClass: 'text-tertiary font-bold',
    linkLabel: 'Ver detalles',
    linkClass: 'text-secondary',
  },
  COMPLETED: {
    label: 'Realizado',
    badge: 'REALIZADO',
    badgeIcon: 'check',
    badgeClass: 'bg-secondary-container/90 text-on-secondary-container',
    codeClass: 'text-primary-fixed-dim',
    dateIcon: 'event_available',
    dateClass: 'text-tertiary',
    linkLabel: 'Ver detalles',
    linkClass: 'text-secondary',
  },
  CANCELLED: {
    label: 'Cancelado',
    badge: 'CANCELADO',
    badgeIcon: 'cancel',
    badgeClass: 'bg-error-container/90 text-on-error-container',
    codeClass: 'text-error',
    dateIcon: 'event_busy',
    dateClass: 'text-error font-bold',
    linkLabel: 'Ver detalles',
    linkClass: 'text-error',
  },
};

export const PARTICIPATION_TYPE_LABELS = {
  ATTENDEE: 'Asistente',
  SPEAKER: 'Ponente',
  CONTESTANT: 'Concursante',
  ORGANIZER: 'Organizador',
  COLLABORATOR: 'Colaborador',
  OTHER: 'Participante',
};

export default function EventCard({ event, participantCount = 0, index = 0, featured = false }) {
  const meta = STATUS_META[event.status] || STATUS_META.UPCOMING;
  const dateText = formatDateShort(event.date);
  const isCancelled = event.status === 'CANCELLED';

  return (
    <Link to={`/eventos/${event.id}`} className="block h-full">
      {/* Sin tilt ni Ken Burns en Certámenes: tarjeta fija (decisión de Axel). */}
      <div
        className={`event-card group relative flex flex-col rounded-2xl bg-surface-container-low/90 backdrop-blur-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer h-full${featured ? ' ring-1 ring-secondary/70 shadow-[0_0_28px_rgba(34,211,238,0.25)]' : ''}`}
        data-category={event.category || ''}
        data-event-id={event.id}
        data-modality={(event.modality || '').toLowerCase()}
        data-state={event.status}
      >
        <div className={`relative w-full ${featured ? 'h-64' : 'h-52'} overflow-hidden bg-surface-container-lowest`}>
          {event.imageUrl ? (
            <img
              className={`w-full h-full object-cover${isCancelled ? ' opacity-60 grayscale-[40%]' : ' opacity-90'}`}
              alt={event.title}
              src={event.imageUrl}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br from-primary-container/60 via-surface-container-high to-surface-container-lowest flex items-center justify-center${isCancelled ? ' opacity-60 grayscale-[40%]' : ''}`}
              aria-hidden="true"
            >
              <span className="font-display-lg text-headline-xl font-extrabold tracking-tight text-on-surface/40">
                {initialsOf(event.title)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent"></div>
          <div className="absolute top-3 left-3 flex flex-wrap gap-space-xs">
            <span className={`inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full font-code-badge text-code-badge font-bold shadow-sm transition-all duration-300 group-hover:shadow-[0_0_18px_rgba(93,230,255,0.45)] ${meta.badgeClass}`}>
              {meta.badgeIcon ? (
                <span className="material-symbols-outlined text-[14px] animate-pulse">{meta.badgeIcon}</span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
              )}
              {meta.badge}
            </span>
            {featured && (
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full font-code-badge text-code-badge font-bold shadow-sm bg-secondary text-surface-container-lowest">
                <span className="material-symbols-outlined text-[14px]">star</span>
                CERTAMEN DESTACADO
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span className={`font-code-badge text-code-badge px-space-xs py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-md ${meta.codeClass}`}>
              EVT-{String(event.id).padStart(4, '0')}
            </span>
          </div>
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between font-label-md text-label-md text-on-surface">
            <span className="flex items-center gap-1 font-semibold text-secondary">
              <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:scale-125">location_on</span>
              {event.place || 'Sede por confirmar'}
            </span>
            <span className={`font-code-badge text-code-badge uppercase ${isCancelled ? 'text-outline' : ''}`}>
              {event.modality || ''}
            </span>
          </div>
        </div>
        <div className="p-space-lg flex-1 flex flex-col justify-between">
          <div className="flex flex-col gap-space-xs">
            <div className={`flex items-center gap-space-xs font-code-badge text-code-badge ${meta.dateClass}`}>
              <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">{meta.dateIcon}</span>
              <span>
                {dateText}
                {event.time ? ` • ${event.time} HRS` : ''}
              </span>
            </div>
            <h2 className={`font-headline-md text-headline-md font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-2 min-h-[3.25rem]${isCancelled ? ' group-hover:text-error' : ''}`}>
              {event.title}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
              {event.description || 'Sin descripción registrada.'}
            </p>
          </div>
          <div className="mt-space-md pt-space-sm bg-surface-container-high/40 -mx-space-lg -mb-space-lg p-space-md flex flex-col gap-space-xs">
            <div className="flex items-center justify-between text-label-md font-label-md text-on-surface-variant">
              <span>Organizador: {event.organizer || 'Licenciatura en Informática'}</span>
              {event.status === 'UPCOMING' ? (
                <span className="text-tertiary font-bold">Registro abierto</span>
              ) : (
                <span className="text-secondary font-bold">
                  {participantCount > 0
                    ? `${participantCount} Participante${participantCount !== 1 ? 's' : ''}`
                    : 'Sin participantes'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-code-badge text-code-badge text-outline">
                {(event.category || 'EVENTO INSTITUCIONAL').toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-1 font-headline-sm text-body-md font-semibold group-hover:translate-x-1 transition-transform ${meta.linkClass}`}>
                {meta.linkLabel} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
