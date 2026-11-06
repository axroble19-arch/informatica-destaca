import { useEffect, useMemo, useState } from 'react';
import CountUp from '../components/CountUp';
import TiltCard from '../components/TiltCard';
import { mediaApi, eventsApi } from '../services/api';
import { galleryPosterFor } from '../data/stitchImages';

// Mapeo de tipos reales (Prisma MediaType) a los data-type de Stitch.
const TYPE_KEY = { IMAGE: 'image', VIDEO: 'video', LINK: 'link' };
const TYPE_LABEL = {
  IMAGE: 'Fotografías',
  VIDEO: 'Videos & Streaming',
  LINK: 'Enlaces & Documentos',
};
const TYPE_BADGE = {
  IMAGE: { label: 'FOTOGRAFÍA HD', classes: 'bg-tertiary/20 text-tertiary', icon: 'photo_camera' },
  VIDEO: { label: 'VIDEO // STREAM', classes: 'bg-secondary-container/30 text-secondary', icon: 'smart_display' },
  LINK: { label: 'ENLACE // DOCUMENTO', classes: 'bg-tertiary/20 text-tertiary', icon: 'description' },
};
const MODAL_BADGE = {
  IMAGE: { label: 'FOTOGRAFÍA ALTA RESOLUCIÓN', classes: 'bg-primary/20 text-primary' },
  VIDEO: { label: 'VIDEO 4K // STREAM', classes: 'bg-secondary/20 text-secondary' },
  LINK: { label: 'ENLACE // DOCUMENTO', classes: 'bg-tertiary/20 text-tertiary' },
};
const FORMAT_LABEL = {
  IMAGE: 'Fotografía • Imagen',
  VIDEO: 'Video • Streaming',
  LINK: 'Enlace • Documento',
};

// Cuadrícula uniforme: con 62 piezas el bento de Stitch (12 piezas, con héroe
// 8x2 y vertical 4x2) dejaba filas irregulares y huecos enormes. Todas las
// teselas son ahora del mismo tamaño (4:3) y el mismo diseño.

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

function formatShortDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const s = d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Visual de la tarjeta: revelado a color + barrido de luz.
// En reposo la pieza se ve en tono frío (gris + tinte índigo/cian); al pasar
// el mouse recupera su color completo, un haz de luz diagonal cruza la tesela
// y aparece un borde neón. El zoom vive en el envoltorio porque el Ken Burns
// ya anima el transform de la imagen/video. Nunca se usan fotos inventadas:
// los src="placeholder" de Stitch se resuelven con su póster.
function CardVisual({ item, index = 0 }) {
  // Ken Burns lento y cíclico, como en la galería del Home.
  const kenburns = ['kenburns-1', 'kenburns-2', 'kenburns-3'][index % 3];
  // Tono frío suave en reposo -> color completo al hover (solo filtro, no transform).
  // Antes era gris 45% + brillo 0.82 y con 62 piezas toda la página se veía
  // lavada o casi negra; ahora el reposo es mucho más cercano al color real.
  const tone =
    'transition-[filter] duration-700 grayscale-[25%] brightness-[0.92] saturate-[0.9] group-hover:grayscale-0 group-hover:brightness-100 group-hover:saturate-100';
  let media;
  if (item.type === 'IMAGE' && isImageUrl(item.url)) {
    media = (
      <img
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover ${kenburns} ${tone}`}
        src={item.url}
        loading="lazy"
      />
    );
  } else if (item.type === 'VIDEO' && isDirectVideoUrl(item.url)) {
    media = (
      <video
        className={`absolute inset-0 w-full h-full object-cover ${kenburns} ${tone}`}
        src={item.url}
        preload="metadata"
        muted
      />
    );
  } else {
    // YouTube / enlace: el póster recibe el mismo tratamiento de revelado.
    media = (
      <img
        src={galleryPosterFor(item)}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover ${kenburns} ${tone}`}
      />
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="gallery-zoom absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        {media}
      </div>
      {/* Tinte frío que se disuelve al revelar el color. */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/25 via-surface-container-lowest/10 to-secondary/10 transition-opacity duration-700 group-hover:opacity-0"
        aria-hidden="true"
      />
      {/* Barrido de luz diagonal al pasar el mouse. */}
      <div className="gallery-sweep pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-25%] bottom-[-25%] left-0 w-[45%] -translate-x-[260%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[560%]" />
      </div>
    </div>
  );
}

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [isDescending, setIsDescending] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  // Entrada escalonada de las teselas del bento (como el Home). `entered` se
  // activa cuando termina la entrada para no retrasar los hovers después.
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([mediaApi.list(), eventsApi.list()])
      .then(([mediaItems, eventItems]) => {
        if (cancelled) return;
        // Solo material con autorización de publicación.
        setMedia((mediaItems || []).filter((m) => m.consentToPublish === true));
        setEvents(eventItems || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo cargar la galería.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Entrada escalonada de las teselas del bento (como el Home).
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setEntered(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const eventOf = (item) => events.find((e) => e.id === item.eventId);

  // Conteos reales por tipo para el encabezado y los filtros.
  const counts = useMemo(() => ({
    total: media.length,
    photos: media.filter((m) => m.type === 'IMAGE').length,
    videos: media.filter((m) => m.type === 'VIDEO').length,
    docs: media.filter((m) => m.type === 'LINK').length,
  }), [media]);

  // Años presentes en la galería (de las fechas reales de cada pieza).
  const years = useMemo(() => {
    const set = new Set();
    media.forEach((m) => {
      const y = new Date(m.date).getFullYear();
      if (!Number.isNaN(y)) set.add(y);
    });
    return [...set].sort((a, b) => b - a);
  }, [media]);

  const visible = useMemo(() => {
    const filtered = media.filter((item) => {
      const matchesType = typeFilter === 'all' || TYPE_KEY[item.type] === typeFilter;
      const matchesEvent = eventFilter === 'all' || item.eventId === Number(eventFilter);
      const matchesYear = yearFilter === 'all' || new Date(item.date).getFullYear() === Number(yearFilter);
      return matchesType && matchesEvent && matchesYear;
    });
    filtered.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return isDescending ? timeB - timeA : timeA - timeB;
    });
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, eventFilter, typeFilter, isDescending]);

  const lightboxItem = lightboxIndex === null ? null : visible[lightboxIndex];

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = () => {
    if (visible.length === 0) return;
    setLightboxIndex((i) => ((i === null ? -1 : i) + 1) % visible.length);
  };
  const prevLightbox = () => {
    if (visible.length === 0) return;
    setLightboxIndex((i) => (((i === null ? 0 : i) - 1) + visible.length) % visible.length);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setEventFilter('all');
    setYearFilter('all');
  };

  const handleShare = async () => {
    if (!lightboxItem) return;
    try {
      await navigator.clipboard.writeText(lightboxItem.url);
    } catch {
      // Portapapeles no disponible: se muestra igualmente la confirmación visual.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Atajos de teclado de Stitch: en el lightbox Esc cierra y ←/→ navegan.
  useEffect(() => {
    const onKey = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') nextLightbox();
      else if (e.key === 'ArrowLeft') prevLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, visible.length]);

  // Bloquea el scroll del fondo mientras el lightbox está abierto (como Stitch).
  useEffect(() => {
    document.body.style.overflow = lightboxIndex === null ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  const typeChips = [
    { key: 'all', icon: 'auto_awesome', label: 'Todos', count: counts.total, iconClass: '', badgeClass: 'bg-on-primary/20 text-on-primary' },
    { key: 'image', icon: 'photo_camera', label: 'Fotografías', count: counts.photos, iconClass: 'text-tertiary', badgeClass: 'bg-surface-container-highest text-tertiary' },
    { key: 'video', icon: 'smart_display', label: 'Videos & Streaming', count: counts.videos, iconClass: 'text-secondary', badgeClass: 'bg-surface-container-highest text-secondary' },
    { key: 'link', icon: 'terminal', label: 'Enlaces & Documentos', count: counts.docs, iconClass: 'text-primary', badgeClass: 'bg-surface-container-highest text-primary' },
  ];

  const renderCard = (item, index) => {
    const badge = TYPE_BADGE[item.type] || TYPE_BADGE.IMAGE;
    const shortDate = formatShortDate(item.date);
    const baseClass = `media-card group relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container/70 backdrop-blur-xl shadow-xl flex flex-col cursor-pointer transition-all duration-500 hover:ring-1 hover:ring-secondary/60 hover:shadow-[0_0_36px_rgba(34,211,238,0.30),0_16px_40px_-8px_rgba(99,102,241,0.30)] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;
    const entranceStyle = { transitionDelay: entered ? '0ms' : `${Math.min(index, 11) * 60}ms` };
    const onOpen = () => openLightbox(index);
    const onKeyOpen = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    };

    // TESELA ÚNICA (todas las piezas iguales): imagen con revelado a color,
    // distintivo de tipo, fecha, título y descripción. Sin botón central: en las
    // fotos verticales tapaba a las personas.
    return (
      <div
        key={item.id}
        onClick={onOpen}
        onKeyDown={onKeyOpen}
        tabIndex={0}
        style={entranceStyle}
        className={`${baseClass} justify-end p-space-md`}
      >
        <CardVisual item={item} index={index} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded font-code-badge text-code-badge ${badge.classes} font-semibold flex items-center gap-1`}>
              <span className="material-symbols-outlined text-[14px]">{badge.icon}</span> {badge.label}
            </span>
            <span className="font-code-badge text-code-badge text-on-surface-variant">{shortDate}</span>
          </div>
          <h2 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-secondary transition-colors truncate">
            {item.title}
          </h2>
          {item.description && (
            <span className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
              {item.description}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Visual del lightbox según el tipo real de la pieza.
  const renderLightboxVisual = (item) => {
    if (item.type === 'IMAGE' && isImageUrl(item.url)) {
      return (
        <img
          alt={`Visualización ampliada de la pieza: ${item.title}`}
          className="w-full h-full object-cover max-h-[716px] lg:max-h-full"
          src={item.url}
        />
      );
    }
    if (item.type === 'VIDEO' && isDirectVideoUrl(item.url)) {
      return (
        <video
          className="w-full h-full object-contain max-h-[716px] lg:max-h-full bg-surface-container-lowest"
          src={item.url}
          controls
          autoPlay
        />
      );
    }
    const yt = item.type === 'VIDEO' ? youtubeId(item.url) : null;
    if (yt) {
      return (
        <iframe
          title={item.title}
          src={`https://www.youtube.com/embed/${yt}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full min-h-[300px] lg:min-h-[580px]"
        />
      );
    }
    const icon = item.type === 'VIDEO' ? 'smart_display' : item.type === 'LINK' ? 'description' : 'photo_camera';
    return (
      <div className="relative w-full h-full min-h-[300px] lg:min-h-[580px] overflow-hidden flex flex-col items-center justify-center gap-space-sm p-space-lg text-center">
        <img src={galleryPosterFor(item)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-surface-container-high/70 to-surface-container-lowest/80" />
        <span className="material-symbols-outlined text-[64px] text-on-surface/60 relative">{icon}</span>
        <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider relative">
          {TYPE_LABEL[item.type] || item.type}
        </span>
        <span className="font-body-md text-body-md text-on-surface-variant max-w-md relative">
          Usa el botón “Abrir Archivo Original” para ver esta pieza en su fuente.
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full bg-surface pt-20">
      {/* SECTION: Institutional Header & Ambient Glow */}
      <section className="relative w-full overflow-hidden px-gutter lg:px-margin pt-space-lg pb-space-xl">
        {/* Atmospheric background gradient spheres (contained) */}
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none ambient-glow-1" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none ambient-glow-2" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-48 rounded-full bg-tertiary/10 blur-3xl pointer-events-none ambient-glow-3" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-space-lg">
          {/* Breadcrumb & Audit Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary -ml-2.5" />
              <span className="font-code-badge text-code-badge text-secondary font-semibold uppercase tracking-wider">
                MOD-06 :: REPOSITORIO MULTIMEDIA & MEMORIA HISTÓRICA // CONAIC AUDITED 2025
              </span>
            </div>
            <div className="flex items-center gap-space-xs font-code-badge text-code-badge text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
              <span>ESTÁNDAR CONAIC-PE-INFO-2023-088</span>
              <span className="text-outline">/</span>
              <span className="text-primary font-medium">REV. 2025.2</span>
            </div>
          </div>
          {/* Main Headline & Editorial Narrative */}
          <div className="flex flex-col gap-space-sm max-w-4xl">
            <h1 className="font-display-lg text-display-lg font-extrabold tracking-tight bg-gradient-to-r from-secondary via-primary to-primary-container bg-clip-text text-transparent">
              Galería Multimedia & Memoria Institucional
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Acervo digital interactivo de conferencias magistrales, hackathons de innovación continua, coberturas inmersivas y memorias fotográficas de la comunidad de Informática UMB Ixtlahuaca.
            </p>
          </div>
          {/* KPI Bar (Glassmorphism Stat Strip) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mt-space-xs">
            <TiltCard className="bg-surface-container/70 backdrop-blur-xl rounded-xl p-space-md shadow-md flex items-center gap-space-md stat-card-glow-1 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_24px_rgba(34,211,238,0.45)]">
                <span className="material-symbols-outlined text-[26px] anim-stats transition-all duration-300 group-hover:scale-110">perm_media</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface"><CountUp target={counts.total} /></span>
                  <span className="font-code-badge text-code-badge text-secondary font-semibold">ACTIVOS</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant truncate">Total Piezas Digitales</span>
              </div>
            </TiltCard>
            <TiltCard className="bg-surface-container/70 backdrop-blur-xl rounded-xl p-space-md shadow-md flex items-center gap-space-md stat-card-glow-2 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-tertiary shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_24px_rgba(52,211,153,0.45)]">
                <span className="material-symbols-outlined text-[26px] anim-stats transition-all duration-300 group-hover:scale-110">photo_camera</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface"><CountUp target={counts.photos} /></span>
                  <span className="font-code-badge text-code-badge text-tertiary font-semibold">HD</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant truncate">Fotos de Hackathons & Salones</span>
              </div>
            </TiltCard>
            <TiltCard className="bg-surface-container/70 backdrop-blur-xl rounded-xl p-space-md shadow-md flex items-center gap-space-md stat-card-glow-3 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_24px_rgba(99,102,241,0.45)]">
                <span className="material-symbols-outlined text-[26px] anim-stats transition-all duration-300 group-hover:scale-110">play_circle</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface"><CountUp target={counts.videos} /></span>
                  <span className="font-code-badge text-code-badge text-primary font-semibold">VIDEO</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant truncate">Producciones en Video & Demos</span>
              </div>
            </TiltCard>
            <TiltCard className="bg-surface-container/70 backdrop-blur-xl rounded-xl p-space-md shadow-md flex items-center gap-space-md stat-card-glow-4 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary-fixed shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_24px_rgba(165,243,252,0.45)]">
                <span className="material-symbols-outlined text-[26px] anim-stats transition-all duration-300 group-hover:scale-110">hub</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface"><CountUp target={counts.docs} /></span>
                  <span className="font-code-badge text-code-badge text-secondary-fixed font-semibold">DOCS</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant truncate">Enlaces & Memorias Técnicas</span>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* SECTION: Interactive Control Console (Tabs, Filter Dropdown, Sorting) */}
      <section className="w-full px-gutter lg:px-margin pb-space-lg relative z-20">
        <div className="max-w-7xl mx-auto bg-surface-container-low/90 backdrop-blur-2xl rounded-2xl p-space-md lg:p-space-lg shadow-xl flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-end gap-space-md">
            {/* Filter Controls Right Wing */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
              {/* Event Category Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full sm:w-auto appearance-none bg-surface-container rounded-xl px-space-md py-2.5 pr-10 font-body-md text-body-md text-on-surface focus:outline-none shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="all">Todas las fotos</option>
                  {events.map((event) => (
                    <option key={event.id} value={String(event.id)}>{event.title}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[18px]">
                  expand_more
                </span>
              </div>
              {/* Year Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full sm:w-auto appearance-none bg-surface-container rounded-xl px-space-md py-2.5 pr-10 font-body-md text-body-md text-on-surface focus:outline-none shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  <option value="all">Todos los años</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[18px]">
                  expand_more
                </span>
              </div>
              {/* Chronological Order Button */}
              <button
                className="flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-sm transition-colors cursor-pointer shrink-0"
                onClick={() => setIsDescending((v) => !v)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">{isDescending ? 'schedule' : 'history'}</span>
                <span>{isDescending ? 'Más recientes' : 'Más antiguos'}</span>
              </button>
            </div>
          </div>
          {/* Segmented Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
            {typeChips.map((chip) => {
              const active = typeFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setTypeFilter(chip.key)}
                  className={`filter-chip flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all duration-300 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-inverse-primary to-secondary-container text-on-primary shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface shadow-sm'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${chip.iconClass}`}>{chip.icon}</span>
                  <span>{chip.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full font-code-badge text-[10px] ${chip.badgeClass}`}><CountUp target={chip.count} /></span>
                </button>
              );
            })}
            <div className="ml-auto hidden xl:flex items-center gap-2 text-outline font-code-badge text-code-badge">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              <span>Mostrando <CountUp target={visible.length} /> de <CountUp target={media.length} /> registros</span>
            </div>
          </div>
          {error && <p className="font-body-md text-body-md text-error">{error}</p>}
        </div>
      </section>

      {/* SECTION: Interactive Gallery Grid (uniforme) */}
      <section className="w-full px-gutter lg:px-margin pb-space-xl">
        {/* Cuadrícula uniforme 3 columnas, todas las teselas 4:3: con 62 piezas
            el bento de 12 dejaba filas irregulares y huecos enormes. */}
        {loading ? (
          <p className="max-w-7xl mx-auto font-body-md text-body-md text-on-surface-variant">Cargando galería…</p>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {visible.map((item, index) => renderCard(item, index))}
          </div>
        )}
        {/* Empty State Fallback */}
        {!loading && !error && visible.length === 0 && (
          <div className="max-w-xl mx-auto py-space-xl text-center flex flex-col items-center gap-space-sm bg-surface-container/60 backdrop-blur-xl rounded-2xl p-space-xl mt-space-lg shadow-xl">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-outline anim-float">
              <span className="material-symbols-outlined text-[32px]">filter_alt_off</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No se encontraron piezas multimedia</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No hay registros que coincidan con los criterios seleccionados. Prueba cambiando el filtro de evento o el tipo de pieza.
            </p>
            <button
              className="mt-space-sm px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest font-label-md text-label-md text-secondary transition-colors cursor-pointer"
              onClick={resetFilters}
              type="button"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}
      </section>

      {/* SECTION: Interactive Ultra-Dark Lightbox Modal */}
      {lightboxItem && (
        <div
          aria-labelledby="modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-surface-container-lowest/95 backdrop-blur-2xl flex items-center justify-center p-space-sm md:p-space-lg"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          {/* Modal Card Container */}
          <div className="relative w-full max-w-6xl max-h-[942px] rounded-2xl bg-surface-container-low/95 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col lg:flex-row">
            {/* Top Action Bar (Mobile & General Close) */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <button
                className="w-10 h-10 rounded-full bg-surface-container-highest/80 hover:bg-surface-container-highest text-on-surface hover:text-secondary flex items-center justify-center transition-colors shadow-md cursor-pointer"
                onClick={closeLightbox}
                title="Cerrar visor (Esc)"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Main Visual Viewport (Left/Top) */}
            <div className="relative flex-1 bg-surface-container-lowest flex items-center justify-center min-h-[300px] lg:min-h-[580px] overflow-hidden group/media">
              {renderLightboxVisual(lightboxItem)}
              {/* Navigation Arrows Floating inside Viewport */}
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container text-on-surface hover:text-secondary flex items-center justify-center transition-all shadow-lg cursor-pointer"
                onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                title="Pieza anterior (←)"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">chevron_left</span>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container text-on-surface hover:text-secondary flex items-center justify-center transition-all shadow-lg cursor-pointer"
                onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                title="Pieza siguiente (→)"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </button>
            </div>
            {/* Technical Metadata Side Panel (Right/Bottom) */}
            <div className="w-full lg:w-[420px] bg-surface-container p-space-lg flex flex-col justify-between overflow-y-auto max-h-[512px] lg:max-h-full">
              <div className="flex flex-col gap-space-md">
                {/* Type & Index Tag */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded font-code-badge text-code-badge font-semibold uppercase ${(MODAL_BADGE[lightboxItem.type] || MODAL_BADGE.IMAGE).classes}`}>
                    {(MODAL_BADGE[lightboxItem.type] || MODAL_BADGE.IMAGE).label}
                  </span>
                  <span className="font-code-badge text-code-badge text-outline">
                    {String(lightboxIndex + 1).padStart(2, '0')} / {String(visible.length).padStart(2, '0')}
                  </span>
                </div>
                {/* Title & Extended Description */}
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface" id="modal-title">
                    {lightboxItem.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {lightboxItem.description || 'Sin descripción.'}
                  </p>
                </div>
                {/* Structured Metadata Specs Strip */}
                <div className="flex flex-col gap-2.5 pt-space-xs font-code-badge text-code-badge">
                  <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                    <span className="text-outline">EVENTO INSTITUCIONAL:</span>
                    <span className="text-on-surface font-semibold text-right">{eventOf(lightboxItem)?.title || 'Sin evento asociado'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                    <span className="text-outline">FECHA DE REGISTRO:</span>
                    <span className="text-secondary font-semibold">{formatShortDate(lightboxItem.date)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                    <span className="text-outline">AUTOR / COORDINACIÓN:</span>
                    <span className="text-on-surface truncate max-w-[200px] text-right">{eventOf(lightboxItem)?.organizer || 'No registrado'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                    <span className="text-outline">FORMATO / RESOLUCIÓN:</span>
                    <span className="text-tertiary">{FORMAT_LABEL[lightboxItem.type] || lightboxItem.type}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                    <span className="text-outline">AUDITORÍA CONAIC:</span>
                    <span className="text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> CERTIFICADO
                    </span>
                  </div>
                </div>
              </div>
              {/* Action CTAs & Keyboard Hint */}
              <div className="flex flex-col gap-space-sm pt-space-md mt-space-md bg-surface-container">
                <div className="flex items-center gap-space-sm">
                  <a
                    className="flex-1 inline-flex items-center justify-center gap-2 px-space-md py-2.5 rounded-xl bg-gradient-to-r from-inverse-primary to-secondary-container text-on-primary font-label-md text-label-md font-semibold shadow-md hover:opacity-95 transition-opacity"
                    href={lightboxItem.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    <span>Abrir Archivo Original</span>
                  </a>
                  <button
                    className="px-3 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface transition-colors"
                    onClick={handleShare}
                    title="Copiar enlace permanente"
                    type="button"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${copied ? 'text-tertiary' : ''}`}>{copied ? 'done' : 'share'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-center gap-space-md text-[11px] font-code-badge text-outline">
                  <span>Usa <kbd className="bg-surface-container-high px-1 rounded">←</kbd> <kbd className="bg-surface-container-high px-1 rounded">→</kbd> para navegar</span>
                  <span>•</span>
                  <span><kbd className="bg-surface-container-high px-1 rounded">Esc</kbd> para salir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
