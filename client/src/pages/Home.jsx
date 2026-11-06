import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { achievementsApi, eventsApi, mediaApi, studentsApi } from '../services/api';
import { HERO_PORTRAIT, homePosterFor, withEventCover, withStudentPhoto } from '../data/stitchImages';
import CountUp from '../components/CountUp';
import TiltCard from '../components/TiltCard';
import ColibriMascot from '../components/ColibriMascot';

/* Port fiel de stitch_portal_web_inform_tica_destaca / p_gina_principal (variante
   CONVOCATORIA, sin Dino). El header y el footer NO van aquí: ya existen Navbar.jsx
   y el footer de App.jsx. Este componente empieza en el <main> de Stitch (la
   Navbar local es fixed como en Stitch, por eso se conserva su pt-20) y
   termina con la sección de convocatoria y CTA.
   Los datos de ejemplo de Stitch se sustituyen por datos reales de la API; los
   detalles de cada sustitución están anotados donde corresponde. */

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'ID';

const photoOf = (student) => student?.photoUrl || student?.avatarUrl || null;

const fmtShort = (d) => {
  try {
    return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const fmtMonthYear = (d) => {
  try {
    const s = new Date(d).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return '';
  }
};

const MEDIA_TYPE_LABEL = { IMAGE: 'Imagen', VIDEO: 'Video', LINK: 'Enlace' };

/* Foto real del estudiante; si no hay photoUrl/avatarUrl (la BD no trae fotos
   en el seed), iniciales con gradiente. Nunca se inventan fotos. */
function Avatar({ student, name, className = 'w-full h-full' }) {
  const url = photoOf(student);
  const label = name || student?.publicName || 'Estudiante';
  if (url) {
    return <img className={`${className} object-cover`} src={url} alt={label} />;
  }
  return (
    <div
      className={`${className} bg-gradient-to-br from-secondary via-primary-container to-tertiary flex items-center justify-center font-extrabold text-on-primary`}
      aria-hidden="true"
    >
      {initials(label)}
    </div>
  );
}

/* Botón magnético + ripple de Stitch (script 4): se desplaza un 18% hacia el
   cursor y genera una onda .ripple-wave al hacer clic. Solo se usa en los
   botones que en Stitch llevan .magnetic-btn. */
function MagneticLink({ to, className = '', children }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const reducedRef = useRef(false);
  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const onMove = (e) => {
    if (reducedRef.current) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - rect.left - rect.width / 2) * 0.18,
      y: (e.clientY - rect.top - rect.height / 2) * 0.18,
    });
  };
  const onClick = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const id = Date.now() + Math.random();
    const ripple = {
      id,
      size,
      left: e.clientX - rect.left - size / 2,
      top: e.clientY - rect.top - size / 2,
    };
    setRipples((r) => [...r, ripple]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 600);
  };

  return (
    <Link
      ref={ref}
      to={to}
      className={`magnetic-btn ${className}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onMouseMove={onMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onClick={onClick}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-wave"
          style={{ width: r.size, height: r.size, left: r.left, top: r.top }}
        />
      ))}
      {children}
    </Link>
  );
}

/* Paletas de acento de las tarjetas del Cuadro de Honor de Stitch (rotan
   terciario / secundario / primario / secondary-fixed). */
const HONOR_PALETTES = [
  {
    text: 'text-tertiary',
    groupHoverText: 'group-hover:text-tertiary',
    hoverText: 'hover:text-tertiary',
    badge: 'text-tertiary',
    ring: 'from-tertiary via-tertiary/40 to-transparent',
    ringShadow: 'shadow-[0_0_20px_rgba(69,223,164,0.3)]',
    topLine: 'via-tertiary',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(69,223,164,0.18)]',
    icon: 'psychology',
    iconTitle: 'Mención de Honor',
  },
  {
    text: 'text-secondary',
    groupHoverText: 'group-hover:text-secondary',
    hoverText: 'hover:text-secondary',
    badge: 'text-secondary',
    ring: 'from-secondary via-secondary/40 to-transparent',
    ringShadow: 'shadow-[0_0_20px_rgba(93,230,255,0.3)]',
    topLine: 'via-secondary',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(93,230,255,0.2)]',
    icon: 'shield',
    iconTitle: 'Primer Lugar Nacional',
  },
  {
    text: 'text-primary',
    groupHoverText: 'group-hover:text-primary',
    hoverText: 'hover:text-primary',
    badge: 'text-primary',
    ring: 'from-primary via-primary/40 to-transparent',
    ringShadow: 'shadow-[0_0_20px_rgba(192,193,255,0.3)]',
    topLine: 'via-primary',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(192,193,255,0.2)]',
    icon: 'workspace_premium',
    iconTitle: 'Máxima Calificación',
  },
  {
    text: 'text-secondary-fixed',
    groupHoverText: 'group-hover:text-secondary-fixed',
    hoverText: 'hover:text-secondary-fixed',
    badge: 'text-secondary-fixed',
    ring: 'from-secondary-fixed via-primary-container to-transparent',
    ringShadow: 'shadow-[0_0_20px_rgba(47,217,244,0.3)]',
    topLine: 'via-secondary-container',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(93,230,255,0.2)]',
    icon: 'hub',
    iconTitle: 'Investigación Cuántica',
  },
];

/* Paletas de las 3 tarjetas de Logros Recientes de Stitch (secundario /
   primario / terciario, en ese orden). */
const RECENT_PALETTES = [
  {
    text: 'text-secondary',
    groupHoverText: 'group-hover:text-secondary',
    badgeBg: 'bg-secondary/15 text-secondary border-secondary/30',
    topLine: 'via-secondary',
    hoverBorder: 'hover:border-secondary/50',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(93,230,255,0.2)]',
    ring: 'ring-secondary/40',
    btnBorder: 'hover:border-secondary/40',
    icon: 'verified',
  },
  {
    text: 'text-primary',
    groupHoverText: 'group-hover:text-primary',
    badgeBg: 'bg-primary/15 text-primary border-primary/30',
    topLine: 'via-primary',
    hoverBorder: 'hover:border-primary/50',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(192,193,255,0.2)]',
    ring: 'ring-primary/40',
    btnBorder: 'hover:border-primary/40',
    icon: 'menu_book',
  },
  {
    text: 'text-tertiary',
    groupHoverText: 'group-hover:text-tertiary',
    badgeBg: 'bg-tertiary/15 text-tertiary border-tertiary/30',
    topLine: 'via-tertiary',
    hoverBorder: 'hover:border-tertiary/50',
    hoverShadow: 'hover:shadow-[0_16px_36px_rgba(69,223,164,0.18)]',
    ring: 'ring-tertiary/40',
    btnBorder: 'hover:border-tertiary/40',
    icon: 'military_tech',
  },
];

export default function Home() {
  const [students, setStudents] = useState([]);
  const [profilesById, setProfilesById] = useState(new Map());
  const [approved, setApproved] = useState([]);
  const [events, setEvents] = useState([]);
  const [media, setMedia] = useState([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [error, setError] = useState('');
  const [honorFilter, setHonorFilter] = useState('Todos');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      studentsApi.list().catch(() => []),
      achievementsApi.list().catch(() => []),
      eventsApi.list().catch(() => []),
      mediaApi.list().catch(() => []),
    ])
      .then(async ([studentsData, achievementsData, eventsData, mediaData]) => {
        if (cancelled) return;
        const list = Array.isArray(studentsData) ? studentsData : [];
        /* La API pública de logros ya solo devuelve APPROVED con su estudiante
           incluido; el filtro es defensivo. */
        const approvedList = (Array.isArray(achievementsData) ? achievementsData : []).filter(
          (a) => a.status === 'APPROVED',
        );
        setStudents(list.map(withStudentPhoto));
        setApproved(approvedList);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setMedia(Array.isArray(mediaData) ? mediaData : []);
        /* studentsApi.list() no incluye los proyectos: se suman desde el perfil
           completo de cada estudiante (única fuente real de Project). */
        try {
          const profiles = await Promise.all(list.map((s) => studentsApi.get(s.id).catch(() => null)));
          if (cancelled) return;
          setProfilesById(new Map(profiles.filter(Boolean).map((p) => [p.id, withStudentPhoto(p)])));
          setProjectsTotal(profiles.reduce((n, p) => n + (p?.projects?.length || 0), 0));
        } catch {
          /* Sin perfiles, el conteo de proyectos queda en 0; el resto sigue real. */
        }
      })
      .catch(() =>
        setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 4000.'),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  /* Barra de stats: el contador arranca al entrar en viewport (script 5). */
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
  }, []);

  /* Carrusel del Cuadro de Honor (script 2 de Stitch): auto-scroll continuo,
     arrastre con ratón/táctil, rueda horizontal, pausa al pasar el cursor y
     botones anterior/siguiente, con bucle sin costuras (lista duplicada). */
  const honorWrapRef = useRef(null);
  const honorTrackRef = useRef(null);
  const honorPrevRef = useRef(null);
  const honorNextRef = useRef(null);
  const honorStateRef = useRef({
    currentX: 0,
    velocity: 0,
    isDragging: false,
    isHovered: false,
    startX: 0,
    startTranslate: 0,
    lastMoveX: 0,
    lastMoveTime: 0,
    resumeTimeout: null,
  });

  /* Una tarjeta por logro APROBADO (con su estudiante), no una por estudiante:
     es lo que la API puede construir sin inventar datos.
     El mini cuadro del Home solo muestra a los alumnos reales (con foto
     publicada en la BD); el cuadro completo (/cuadro-de-honor) muestra a
     todos los galardonados. */
  const honorItems = approved.filter((a) => a.student?.photoUrl);
  const honorCategories = useMemo(
    () => [...new Set(honorItems.map((a) => a.category).filter(Boolean))],
    [honorItems],
  );

  useEffect(() => {
    const wrap = honorWrapRef.current;
    const track = honorTrackRef.current;
    const prevBtn = honorPrevRef.current;
    const nextBtn = honorNextRef.current;
    if (!wrap || !track) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = honorStateRef.current;
    const getLoopWidth = () => track.scrollWidth / 2;
    const updateTransform = () => {
      const loopWidth = getLoopWidth();
      if (loopWidth > 0) {
        if (s.currentX <= -loopWidth) s.currentX += loopWidth;
        else if (s.currentX > 0) s.currentX -= loopWidth;
      }
      track.style.transform = `translate3d(${s.currentX}px, 0, 0)`;
    };
    let raf;
    const tick = () => {
      if (!s.isDragging) {
        if (Math.abs(s.velocity) > 0.05) {
          s.currentX += s.velocity;
          s.velocity *= 0.94;
          updateTransform();
        } else {
          s.velocity = 0;
          if (!s.isHovered && !reduced) {
            s.currentX -= 0.85;
            updateTransform();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const moveBy = (delta) => {
      const step = (track.children[0]?.offsetWidth || 340) + 24;
      s.currentX += delta * step;
      const loopWidth = getLoopWidth();
      if (loopWidth > 0) {
        while (s.currentX <= -loopWidth) s.currentX += loopWidth;
        while (s.currentX > 0) s.currentX -= loopWidth;
      }
      track.style.transition = 'transform 0.4s ease-out';
      track.style.transform = `translate3d(${s.currentX}px, 0, 0)`;
      setTimeout(() => {
        track.style.transition = '';
      }, 400);
    };
    const onPrev = (e) => {
      e.preventDefault();
      e.stopPropagation();
      moveBy(1);
    };
    const onNext = (e) => {
      e.preventDefault();
      e.stopPropagation();
      moveBy(-1);
    };
    const onEnter = () => {
      s.isHovered = true;
    };
    const onLeave = () => {
      if (!s.isDragging) s.isHovered = false;
    };
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      s.isDragging = true;
      s.startX = e.clientX;
      s.startTranslate = s.currentX;
      s.lastMoveX = e.clientX;
      s.lastMoveTime = performance.now();
      s.velocity = 0;
      wrap.classList.add('cursor-grabbing');
      wrap.classList.remove('cursor-grab');
      if (s.resumeTimeout) clearTimeout(s.resumeTimeout);
    };
    const onMouseMove = (e) => {
      if (!s.isDragging) return;
      const now = performance.now();
      s.currentX = s.startTranslate + (e.clientX - s.startX);
      const dt = now - s.lastMoveTime;
      if (dt > 0) s.velocity = ((e.clientX - s.lastMoveX) / dt) * 15;
      s.lastMoveX = e.clientX;
      s.lastMoveTime = now;
      updateTransform();
    };
    const onMouseUp = () => {
      if (!s.isDragging) return;
      s.isDragging = false;
      wrap.classList.remove('cursor-grabbing');
      wrap.classList.add('cursor-grab');
      s.resumeTimeout = setTimeout(() => {
        s.isHovered = false;
      }, 1200);
    };
    const onTouchStart = (e) => {
      s.isDragging = true;
      s.startX = e.touches[0].clientX;
      s.startTranslate = s.currentX;
      s.lastMoveX = e.touches[0].clientX;
      s.lastMoveTime = performance.now();
      s.velocity = 0;
      if (s.resumeTimeout) clearTimeout(s.resumeTimeout);
    };
    const onTouchMove = (e) => {
      if (!s.isDragging) return;
      const now = performance.now();
      const clientX = e.touches[0].clientX;
      s.currentX = s.startTranslate + (clientX - s.startX);
      const dt = now - s.lastMoveTime;
      if (dt > 0) s.velocity = ((clientX - s.lastMoveX) / dt) * 15;
      s.lastMoveX = clientX;
      s.lastMoveTime = now;
      updateTransform();
    };
    const onTouchEnd = () => {
      s.isDragging = false;
      s.resumeTimeout = setTimeout(() => {
        s.isHovered = false;
      }, 1200);
    };
    const onWheel = (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) > 2) {
        e.preventDefault();
        s.currentX -= delta * 0.9;
        s.velocity = -delta * 0.2;
        updateTransform();
        s.isHovered = true;
        if (s.resumeTimeout) clearTimeout(s.resumeTimeout);
        s.resumeTimeout = setTimeout(() => {
          s.isHovered = false;
        }, 1500);
      }
    };

    prevBtn?.addEventListener('click', onPrev);
    nextBtn?.addEventListener('click', onNext);
    wrap.addEventListener('mouseenter', onEnter);
    wrap.addEventListener('mouseleave', onLeave);
    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: true });
    wrap.addEventListener('touchend', onTouchEnd);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      if (s.resumeTimeout) clearTimeout(s.resumeTimeout);
      prevBtn?.removeEventListener('click', onPrev);
      nextBtn?.removeEventListener('click', onNext);
      wrap.removeEventListener('mouseenter', onEnter);
      wrap.removeEventListener('mouseleave', onLeave);
      wrap.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('wheel', onWheel);
    };
  }, [honorItems.length]);

  /* Estudiante destacado del hero: el estudiante con más logros aprobados
     (desempate: primero en la lista). Stitch mostraba a "Camila V. Arismendi,
     Estudiante del Mes" con GPA 9.94 y foto; la BD no tiene designación de
     Estudiante del Mes, ni promedios/GPA, ni fotos: se conserva la tarjeta y
     su rótulo, pero con el estudiante real de mayor mérito y métricas reales
     (semestre, logros aprobados, proyectos). */
  const featured = useMemo(() => {
    if (!students.length) return null;
    let best = null;
    let bestCount = -1;
    for (const s of students) {
      const full = profilesById.get(s.id);
      const count = full?.achievements?.length ?? s.achievements?.length ?? 0;
      if (count > bestCount) {
        bestCount = count;
        best = full || s;
      }
    }
    // La tarjeta destacada del hero de Stitch muestra siempre su retrato
    // cinematográfico (HERO_PORTRAIT), no el retrato por id del estudiante.
    return best ? { ...best, photoUrl: HERO_PORTRAIT } : null;
  }, [students, profilesById]);
  const featuredAchievements = useMemo(() => {
    if (!featured) return [];
    if (featured.achievements?.length && featured.achievements[0]?.title) return featured.achievements;
    return approved.filter((a) => a.studentId === featured.id);
  }, [featured, approved]);

  // Certamen con convocatoria vigente (lista de cotejo 3.3): el próximo
  // certamen (UPCOMING) por fecha, si existe.
  const upcomingCertamen = useMemo(() => {
    const upcoming = events
      .filter((e) => e.category === 'Certamen' && e.status === 'UPCOMING')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming[0] || null;
  }, [events]);

  // Previa de Certámenes para el Home: el Certamen LI 2025 primero y
  // destacado, luego los demás por fecha descendente. Máximo 3 tarjetas.
  const previewEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aCert = a.category === 'Certamen' ? 0 : 1;
      const bCert = b.category === 'Certamen' ? 0 : 1;
      if (aCert !== bCert) return aCert - bCert;
      return new Date(b.date) - new Date(a.date);
    });
    return sorted.slice(0, 3).map((e) => withEventCover(e));
  }, [events]);

  /* Stats reales. La 4ª métrica de Stitch ("Tasa de Empleabilidad & Prácticas",
     98.7%) NO tiene equivalente real: la BD no guarda empleabilidad ni
     prácticas. Se sustituye por "Logros Aprobados" (conteo real de logros
     aprobados) con el mismo icono y resplandor. */
  const honorStudentCount = useMemo(() => new Set(honorItems.map((a) => a.studentId)).size, [honorItems]);
  const stats = [
    {
      icon: 'emoji_events',
      anim: 'anim-trophy',
      glow: 'stat-card-glow-1',
      iconBox: 'bg-secondary/15 shadow-[0_0_20px_rgba(93,230,255,0.2)]',
      iconText: 'text-secondary',
      value: honorStudentCount,
      decimals: 0,
      suffix: '+',
      label: 'Estudiantes en Cuadro de Honor',
    },
    {
      icon: 'memory',
      anim: 'anim-memory',
      glow: 'stat-card-glow-2',
      iconBox: 'bg-primary-container/20 shadow-[0_0_20px_rgba(128,131,255,0.2)]',
      iconText: 'text-primary',
      value: projectsTotal,
      decimals: 0,
      suffix: '',
      label: 'Proyectos Registrados',
    },
    {
      icon: 'rocket_launch',
      anim: 'anim-rocket',
      glow: 'stat-card-glow-3',
      iconBox: 'bg-tertiary/15 shadow-[0_0_20px_rgba(69,223,164,0.2)]',
      iconText: 'text-tertiary',
      value: events.length,
      decimals: 0,
      suffix: '',
      label: 'Eventos y Hackathons',
    },
    {
      icon: 'query_stats',
      anim: 'anim-stats',
      glow: 'stat-card-glow-4',
      iconBox: 'bg-secondary-fixed/15 shadow-[0_0_20px_rgba(162,238,255,0.2)]',
      iconText: 'text-secondary-fixed',
      value: approved.length,
      decimals: 0,
      suffix: '',
      label: 'Logros Aprobados',
    },
  ];

  const recentAchievements = approved.slice(0, 3);
  const galleryItems = media.slice(0, 4);

  return (
    <div className="flex flex-col w-full relative overflow-hidden text-on-surface pt-20">
      {/* pt-20 compensa el header fixed de Stitch (Navbar) */}
      {/* GLOW AMBIENT BACKGROUND ELEMENTS WITH GENTLE FLOATING MOTION */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[130px] pointer-events-none -z-10 ambient-glow-1"></div>
      <div className="absolute top-[30%] -right-20 w-[550px] h-[550px] rounded-full bg-primary-container/15 blur-[140px] pointer-events-none -z-10 ambient-glow-2"></div>
      <div className="absolute top-[65%] left-[-100px] w-[650px] h-[650px] rounded-full bg-tertiary-container/10 blur-[150px] pointer-events-none -z-10 ambient-glow-3"></div>

      {error && (
        <p className="max-w-[1440px] w-full mx-auto px-gutter mt-6 bg-amber-500/15 text-amber-300 border border-amber-400/20 p-3 rounded-lg text-sm">
          {error}
        </p>
      )}

      {/* ================= 1. HERO SECTION DINÁMICA ================= */}
      <section className="relative px-gutter mx-auto max-w-[1440px] w-full pt-12 pb-20 lg:pt-16 lg:pb-28">
        {/* Foto del campus UES Ixtlahuaca como fondo del hero (decisión de
            Axel): fija, sin movimiento, con velos oscuros para que el texto
            siga legible sobre la foto. */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
          <img
            src="/images/campus-ues-ixtlahuaca.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/85 to-[#020617]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/60" />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start gap-space-lg">
            {/* Floating Pill Badge with Pulse */}
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-sm transition-transform duration-300 hover:scale-105 border border-outline-variant/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
              </span>
              <span className="font-code-badge text-code-badge tracking-wider text-secondary uppercase font-semibold">
                ⚡ Portal Oficial de Excelencia Académica e Innovación
              </span>
            </div>
            {/* Main Title */}
            <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface font-extrabold tracking-tight leading-tight">
              Impulsando el Talento que <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-secondary via-primary to-secondary-fixed bg-clip-text text-transparent">
                Transforma la Tecnología
              </span>
            </h1>
            {/* Subtitle */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Plataforma oficial de la Licenciatura en Informática de la Universidad Mexiquense del Bicentenario
              dedicada a proyectar el talento estudiantil, gestionar eventos académicos y tecnológicos, difundir
              memorias multimedia y consolidar un currículum vitae digital con el historial verificable de logros y
              reconocimientos de nuestra comunidad.
            </p>
            {/* CTA Action Cluster with Dynamic Glow & Shimmer */}
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs w-full sm:w-auto">
              <MagneticLink
                to="/cuadro-de-honor"
                className="shimmer-effect group relative inline-flex items-center justify-center gap-space-xs px-space-xl py-space-md rounded-full bg-gradient-to-r from-secondary-container to-primary-container text-on-primary font-title-md text-title-md font-bold transition-all duration-300 hover:shadow-[0_0_35px_rgba(93,230,255,0.45)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:rotate-12 anim-float">
                  military_tech
                </span>
                <span className="relative z-10">Explorar Cuadro de Honor</span>
              </MagneticLink>
            </div>
            {/* Metric Badges Strip */}
            <div className="flex flex-wrap items-center gap-space-lg pt-space-sm text-on-surface-variant font-code-badge text-code-badge">
              <div className="flex items-center gap-space-xs hover:text-tertiary transition-colors cursor-default">
                <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                <span className="">Acreditación Internacional CONAIC</span>
              </div>
            </div>
          </div>

          {/* Right Column: Mascota colibrí + Interactive Holographic Student Card with 3D Tilt & Specular Glare */}
          <div className="lg:col-span-5 relative w-full flex flex-col items-center lg:items-end gap-space-md [perspective:1000px]">
            {/* Mascota: el colibrí, animal de la UMB, flotando sobre la tarjeta */}
            <div className="flex flex-col items-center gap-1 anim-float">
              <ColibriMascot className="w-32 h-auto drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]" />
              <span className="px-space-sm py-1 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-outline-variant/20 font-code-badge text-code-badge text-secondary font-semibold uppercase tracking-wider">
                Colibrí · Mascota UMB
              </span>
            </div>
            {/* Subtle back glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary/20 to-primary-container/20 rounded-3xl blur-2xl -z-10 transform scale-95 transition-opacity duration-500"></div>
            {/* Student Showcase Card */}
            {featured ? (
              <TiltCard
                className="w-full max-w-md bg-surface-container/80 backdrop-blur-xl rounded-2xl p-space-lg shadow-xl relative overflow-hidden group border border-outline-variant/30"
                style={{ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' }}
              >
                {/* Inner specular highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent"></div>
                {/* Top Meta Bar */}
                <div className="flex items-center justify-between pb-space-md">
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-highest">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    <span className="font-code-badge text-code-badge text-tertiary font-semibold uppercase">
                      Estudiante del Mes
                    </span>
                  </div>
                  {/* Stitch: "EXP: 2025-Q1". Sin equivalente real: se muestra la
                      generación real del estudiante. */}
                  {featured.generation && (
                    <span className="font-code-badge text-code-badge text-secondary font-mono tracking-wider">
                      GEN: {featured.generation}
                    </span>
                  )}
                </div>
                {/* Profile Snapshot */}
                <div className="flex items-center gap-space-md pt-space-xs">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md ring-1 ring-secondary/30 transition-transform duration-300 group-hover:scale-105">
                      <Avatar student={featured} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary rounded-full p-0.5 flex items-center justify-center shadow-md animate-bounce">
                      <span className="material-symbols-outlined text-[16px]">stars</span>
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                        {featured.publicName}
                      </h3>
                      <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                    </div>
                    {/* Stitch: "9° Semestre • Especialidad en Computación Distribuida".
                        La BD no tiene "especialidad": se muestra semestre y generación. */}
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {featured.semester ? `${featured.semester}° Semestre` : 'Estudiante'}
                      {featured.generation ? ` • Generación ${featured.generation}` : ''}
                    </p>
                    {/* Stitch: "1er Lugar Hackathon TechNova 2024". Se sustituye por el
                        logro aprobado más reciente del estudiante. */}
                    {featuredAchievements[0] && (
                      <span className="font-code-badge text-code-badge text-tertiary mt-space-xs font-semibold">
                        {featuredAchievements[0].title}
                      </span>
                    )}
                  </div>
                </div>
                {/* Technical Metrics Grid: Stitch mostraba GPA 99.4 / Repositorios 14 /
                    Impacto 4.8k. La BD no tiene promedios, repositorios ni impacto:
                    se muestran semestre, logros aprobados y proyectos reales. */}
                <div className="grid grid-cols-3 gap-space-sm py-space-md mt-space-md rounded-xl bg-surface-container-low/70 px-space-md border border-outline-variant/20">
                  <div className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="font-code-badge text-code-badge text-on-surface-variant uppercase">Semestre</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                      {featured.semester ? `${featured.semester}°` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="font-code-badge text-code-badge text-on-surface-variant uppercase">Logros</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {featuredAchievements.length}
                    </span>
                  </div>
                  <div className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="font-code-badge text-code-badge text-on-surface-variant uppercase">Proyectos</span>
                    <span className="font-headline-sm text-headline-sm text-tertiary font-bold">
                      {featured.projects?.length ?? 0}
                    </span>
                  </div>
                </div>
                {/* Tech Stack Tags: habilidades reales del estudiante (skills[]). */}
                <div className="flex flex-col gap-space-xs mt-space-md">
                  <span className="font-code-badge text-code-badge text-on-surface-variant uppercase font-medium">
                    Stack de Dominio Técnico:
                  </span>
                  <div className="flex flex-wrap gap-space-xs">
                    {(featured.skills || []).slice(0, 4).map((skill, i) => (
                      <span
                        key={skill}
                        className={`px-space-sm py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors font-code-badge text-code-badge font-mono ${
                          ['text-secondary', 'text-tertiary', 'text-primary', 'text-on-surface'][i % 4]
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {(featured.skills || []).length === 0 && (
                      <span className="font-code-badge text-code-badge text-on-surface-variant">
                        Sin habilidades registradas
                      </span>
                    )}
                  </div>
                </div>
                {/* Micro Sparkline SVG Visualization with living stroke */}
                <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[16px] animate-pulse">
                      trending_up
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">Actividad Algorítmica</span>
                  </div>
                  <div className="relative flex items-center">
                    <svg
                      className="w-32 h-6 text-secondary overflow-visible"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 24"
                    >
                      <defs>
                        <linearGradient id="sparklineGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" stopColor="#2fd9f4"></stop>
                          <stop offset="100%" stopColor="#68fcbf"></stop>
                        </linearGradient>
                      </defs>
                      <path
                        className="sparkline-animated"
                        d="M0,18 L15,14 L30,19 L45,8 L60,12 L75,3 L90,9 L100,2"
                        stroke="url(#sparklineGrad)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      ></path>
                      <circle className="animate-ping" cx="100" cy="2" fill="#68fcbf" r="3"></circle>
                      <circle cx="100" cy="2" fill="#68fcbf" r="2.5"></circle>
                    </svg>
                  </div>
                </div>
              </TiltCard>
            ) : (
              <div className="w-full max-w-md bg-surface-container/80 backdrop-blur-xl rounded-2xl p-space-lg shadow-xl border border-outline-variant/30">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Aún no hay estudiantes publicados.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= 2. STATS BAR (BARRA FLOTANTE CON CONTADORES ANIMADOS & RESPLANDOR SECUENCIAL) ================= */}
      <section ref={statsRef} className="px-gutter mx-auto max-w-[1440px] w-full -mt-6 lg:-mt-10 relative z-20 mb-12">
        <div className="w-full bg-surface-container-low/80 backdrop-blur-2xl rounded-2xl p-space-lg shadow-xl relative overflow-hidden border border-outline-variant/30">
          {/* Top specular glow line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg divide-y sm:divide-y-0 sm:divide-x-0">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`stat-card ${stat.glow} p-space-sm rounded-xl flex items-center gap-space-md pt-space-sm sm:pt-space-sm group transition-all duration-300 hover:translate-x-1 border border-transparent cursor-default`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${stat.iconBox} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <span className={`material-symbols-outlined ${stat.iconText} text-[30px] ${stat.anim}`}>
                    {stat.icon}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight counter-value">
                    <CountUp target={stat.value} decimals={stat.decimals} suffix={stat.suffix} start={statsVisible} />
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3. SECCIÓN DE CUADRO DE HONOR (DRAGGABLE, TOUCH & AUTO CONTINUO) ================= */}
      {/* ================= SECCIÓN DE LOGROS RECIENTES Y RECONOCIMIENTOS ================= */}
      <section className="px-gutter mx-auto max-w-[1440px] w-full py-16">
        {/* Section Header & Category Tabs (Clean & Modern, No Arrow Buttons) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-12">
          <div className="flex flex-col gap-space-xs max-w-xl">
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high w-fit border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[16px]">stars</span>
              <span className="font-code-badge text-code-badge text-secondary font-semibold uppercase">
                Reconocimiento al Mérito
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface font-bold tracking-tight">
              Cuadro de Honor Destacado
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Estudiantes que superan los límites del rigor académico, la formulación de software de alta calidad y
              la trascendencia competitiva.
            </p>
          </div>
          {/* Clean Category Tabs Only. Stitch tenía 5 pestañas fijas (Promedios
              Sobresalientes, Desarrollo de Software, Investigación & IA,
              Competencias Internacionales): la BD no tiene promedios ni esas
              clasificaciones, así que las pestañas se generan desde las
              categorías reales de los logros aprobados. */}
          <div
            className="flex flex-wrap items-center gap-space-xs bg-surface-container-lowest/60 p-1.5 rounded-2xl backdrop-blur-md border border-outline-variant/30 shrink-0"
            id="honor-filters"
          >
            {['Todos', ...honorCategories].map((cat) => {
              const active = honorFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setHonorFilter(cat)}
                  className={`filter-btn px-space-md py-space-xs rounded-xl font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                    active
                      ? 'shadow-sm bg-surface-container-high text-secondary font-semibold active-pill'
                      : 'hover:bg-surface-container-high hover:text-on-surface text-on-surface-variant font-medium'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
        {/* CARRUSEL INTERACTIVO / DRAG-TO-SCROLL + TOUCH + AUTO CONTINUO */}
        {honorItems.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Aún no hay logros publicados.</p>
        ) : (
          <div
            ref={honorWrapRef}
            className="relative w-full overflow-hidden py-4 -my-4 honor-marquee-container [perspective:1000px] select-none cursor-grab active:cursor-grabbing"
            id="honor-marquee-wrapper"
            title="Arrastra o desliza para explorar libremente"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
            }}
          >
            {/* Gradient masks on sides for elegant fade-in/fade-out appearance */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-20"></div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-20"></div>
            {/* Interactive Moving Track: la lista se duplica para el bucle infinito
                continuo de Stitch (SET 1 + SET 2 clon). */}
            <div ref={honorTrackRef} className="flex gap-space-lg items-stretch will-change-transform" id="honor-cards-track">
              {[...honorItems, ...honorItems].map((achievement, i) => {
                const student = achievement.student ? withStudentPhoto(achievement.student) : {};
                const palette = HONOR_PALETTES[i % HONOR_PALETTES.length];
                const dimmed = honorFilter !== 'Todos' && achievement.category !== honorFilter;
                return (
                  <TiltCard
                    key={`${achievement.id}-${i}`}
                    dimmed={dimmed}
                    className={`group relative w-[310px] sm:w-[340px] shrink-0 bg-surface-container/70 backdrop-blur-xl rounded-2xl p-space-lg flex flex-col justify-between transition-all duration-300 ${palette.hoverShadow} border border-outline-variant/30`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent ${palette.topLine} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    <div>
                      {/* Top Row: Semester & Distinction Pin */}
                      <div className="flex items-center justify-between mb-space-md">
                        <span
                          className={`px-space-sm py-0.5 rounded-md bg-surface-container-highest font-code-badge text-code-badge ${palette.badge} font-semibold`}
                        >
                          {student.semester ? `${student.semester}° SEMESTRE` : 'ESTUDIANTE'}
                        </span>
                        <span
                          className={`material-symbols-outlined ${palette.text} text-[20px] transition-transform duration-300 group-hover:rotate-12`}
                          title={palette.iconTitle}
                        >
                          {palette.icon}
                        </span>
                      </div>
                      {/* Avatar with Glowing Ring */}
                      <div className="flex flex-col items-center text-center mb-space-md">
                        <div
                          className={`relative p-1 rounded-full bg-gradient-to-tr ${palette.ring} ${palette.ringShadow} mb-space-sm transition-transform duration-300 group-hover:scale-105`}
                        >
                          <div className="w-20 h-20 rounded-full overflow-hidden">
                            <Avatar student={student} />
                          </div>
                        </div>
                        <h3
                          className={`font-headline-sm text-headline-sm text-on-surface font-bold ${palette.groupHoverText} transition-colors`}
                        >
                          {student.publicName || 'Estudiante'}
                        </h3>
                        <p className={`font-label-md text-label-md ${palette.text} mt-0.5`}>{achievement.title}</p>
                      </div>
                      {/* Description */}
                      <p className="font-body-md text-body-md text-on-surface-variant text-center line-clamp-3 mb-space-md">
                        {achievement.description || achievement.category}
                      </p>
                      {/* Badges: habilidades reales del estudiante. Stitch mostraba
                          badges inventados ("9.96 GPA", "TensorFlow"...): sin GPA en
                          la BD, solo van skills reales. */}
                      <div className="flex flex-wrap justify-center gap-1.5 mb-space-lg">
                        {(student.skills || []).slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 rounded-full bg-surface-container-high font-code-badge text-code-badge text-on-surface-variant transition-colors ${palette.hoverText}`}
                          >
                            {skill}
                          </span>
                        ))}
                        <span
                          className={`px-2 py-0.5 rounded-full bg-surface-container-high font-code-badge text-code-badge text-on-surface-variant transition-colors ${palette.hoverText}`}
                        >
                          {achievement.category}
                        </span>
                      </div>
                    </div>
                    {/* Action Links */}
                    <div className="flex items-center gap-space-xs pt-space-md bg-surface-container-low/50 rounded-xl px-space-sm border border-outline-variant/15">
                      <Link
                        to={`/estudiantes/${student.id}`}
                        className={`flex-1 py-space-xs text-center font-label-md text-label-md text-on-surface ${palette.hoverText} transition-colors font-semibold cursor-pointer`}
                      >
                        Ver Perfil
                      </Link>
                      <div className="w-px h-4 bg-outline-variant/30"></div>
                      {achievement.evidenceUrl ? (
                        <a
                          href={achievement.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 py-space-xs text-center font-label-md text-label-md ${palette.text} hover:brightness-125 transition-colors font-semibold flex items-center justify-center gap-1 cursor-pointer`}
                        >
                          <span className="">Evidencia</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                        </a>
                      ) : (
                        <Link
                          to={`/estudiantes/${student.id}/cv`}
                          className={`flex-1 py-space-xs text-center font-label-md text-label-md ${palette.text} hover:brightness-125 transition-colors font-semibold flex items-center justify-center gap-1 cursor-pointer`}
                        >
                          <span className="">Ver CV</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                        </Link>
                      )}
                    </div>
                  </TiltCard>
                );
              })}
            </div>
            <button
              ref={honorPrevRef}
              type="button"
              aria-label="Tarjeta anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface hover:text-secondary border border-outline-variant/30 backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
              id="honor-prev-btn"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <button
              ref={honorNextRef}
              type="button"
              aria-label="Siguiente tarjeta"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface hover:text-secondary border border-outline-variant/30 backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
              id="honor-next-btn"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
        )}
        {/* Centered History Button */}
        <div className="flex justify-center mt-12">
          <Link
            to="/cuadro-de-honor"
            className="neon-elastic-btn group inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-title-md text-title-md font-semibold border border-outline-variant/30 shadow-md cursor-pointer"
          >
            <span className="">Ver Cuadro de Honor Completo</span>
            <span className="material-symbols-outlined text-secondary text-[22px] transition-transform duration-300 group-hover:translate-x-2">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>

      <section id="logros-recientes" className="px-gutter mx-auto max-w-[1440px] w-full py-12 relative z-20">
        {/* Header with live feed indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-10">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high/80 border border-outline-variant/30 backdrop-blur-md w-fit shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span className="font-code-badge text-code-badge text-secondary font-semibold uppercase tracking-wider">
                Feed Oficial • Contenido Destacado &amp; Excelencia
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl font-extrabold tracking-tight bg-gradient-to-r from-on-surface via-secondary to-primary bg-clip-text text-transparent">
              Logros{' '}
              <span className="bg-gradient-to-r from-secondary via-secondary-fixed to-primary bg-clip-text text-transparent">
                Recientes
              </span>
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Logros y distinciones sobresalientes obtenidos por estudiantes de alto mérito académico, fruto de su
              dedicación, talento y compromiso con la excelencia tecnológica.
            </p>
          </div>
          {/* Live status pill */}
          <div className="inline-flex items-center gap-2 px-space-md py-1.5 rounded-full bg-surface-container-lowest/80 border border-outline-variant/30 backdrop-blur-md text-on-surface-variant font-code-badge text-code-badge shrink-0 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(69,223,164,0.8)]"></span>
            <span className="">Actualizado hoy • Registro CONAIC</span>
          </div>
        </div>
        {/* 3 Achievement Cards Grid */}
        {recentAchievements.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Aún no hay logros publicados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {recentAchievements.map((achievement, i) => {
              const palette = RECENT_PALETTES[i % RECENT_PALETTES.length];
              const student = achievement.student || {};
              /* Stitch: "Acreditado CONAIC • Folio 2025-084", "Indexado Scopus /
                 IEEE Q1", "Aval Oficial OMI Universitario". La BD no tiene folios
                 ni indexaciones: se muestra la institución o el evento relacionado
                 reales. */
              const verification = achievement.institution || achievement.relatedEvent || 'Logro verificado';
              return (
                <TiltCard
                  key={achievement.id}
                  className={`group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl border border-outline-variant/30 ${palette.hoverBorder} p-space-lg shadow-xl transition-all duration-300 ${palette.hoverShadow} flex flex-col justify-between overflow-hidden`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent ${palette.topLine} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-space-sm py-0.5 rounded-md ${palette.badgeBg} font-code-badge text-code-badge font-semibold uppercase tracking-wide border`}
                      >
                        {achievement.category}
                      </span>
                      <span className="font-code-badge text-code-badge text-on-surface-variant font-mono">
                        {fmtShort(achievement.date)}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono text-tertiary mb-space-sm">
                      <span className="material-symbols-outlined text-[14px] transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">{palette.icon}</span>
                      <span className="">{verification}</span>
                    </div>
                    <h3
                      className={`font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs ${palette.groupHoverText} transition-colors`}
                    >
                      {achievement.title}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed line-clamp-3 mb-space-lg">
                      {achievement.description}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-sm pt-space-md border-t border-outline-variant/20 mb-space-md">
                      <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ${palette.ring} shadow-sm`}>
                        <Avatar student={student} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-title-md text-[14px] text-on-surface font-semibold truncate">
                          {student.publicName || 'Estudiante'}
                        </span>
                        <span className="font-code-badge text-code-badge text-on-surface-variant truncate">
                          {achievement.relatedEvent || achievement.category}
                        </span>
                      </div>
                    </div>
                    {achievement.evidenceUrl ? (
                      <a
                        href={achievement.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center justify-between w-full px-space-md py-space-xs rounded-xl bg-surface-container-high/60 hover:bg-surface-container-highest ${palette.text} font-label-md text-label-md font-semibold transition-all duration-200 border border-outline-variant/20 ${palette.btnBorder} cursor-pointer`}
                      >
                        <span className="">Ver Evidencia / Certificado</span>
                        <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover:translate-x-1">
                          arrow_outward
                        </span>
                      </a>
                    ) : (
                      <Link
                        to="/cuadro-de-honor"
                        className={`inline-flex items-center justify-between w-full px-space-md py-space-xs rounded-xl bg-surface-container-high/60 hover:bg-surface-container-highest ${palette.text} font-label-md text-label-md font-semibold transition-all duration-200 border border-outline-variant/20 ${palette.btnBorder} cursor-pointer`}
                      >
                        <span className="">Ver en Cuadro de Honor</span>
                        <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover:translate-x-1">
                          arrow_outward
                        </span>
                      </Link>
                    )}
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 4. CARRUSEL / GRID MULTIMEDIA DESTACADO (CON MOVIMIENTO SUAVE KEN BURNS / AUTO-PANNING) ================= */}
      <section className="px-gutter mx-auto max-w-[1440px] w-full py-16">
        {/* Section Title */}
        <div className="flex flex-col gap-space-xs mb-10">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high w-fit border border-outline-variant/20">
            <span className="material-symbols-outlined text-tertiary text-[16px]">photo_camera</span>
            <span className="font-code-badge text-code-badge text-tertiary font-semibold uppercase">
              Vida Universitaria &amp; Hitos
            </span>
          </div>
          <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl font-extrabold tracking-tight text-on-surface mt-1 mb-2">
            <span className="text-on-surface">Galería Institucional y</span>{' '}
            <span className="bg-gradient-to-r from-secondary via-secondary-fixed to-primary-fixed bg-clip-text text-transparent">
              Eventos
            </span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Plataforma oficial de la Licenciatura en Informática de la Universidad Mexiquense del Bicentenario
            dedicada a proyectar el talento estudiantil, gestionar eventos académicos y tecnológicos, difundir
            memorias multimedia y consolidar un currículum vitae digital con el historial verificable de logros y
            reconocimientos de nuestra comunidad.
          </p>
        </div>
        {/* Bento de Galería con teselas FIJAS (sin movimiento, decisión de Axel).
            Las 4 fotos de ejemplo de Stitch (hackathon, graduación, laboratorio, simposio) se sustituyen por
            mediaApi.list() real: solo se publican los 4 primeros medios con consentimiento. Los textos
            inventados de Stitch ("48 Horas Ininterrumpidas • 360 Participantes", "Galería 32 Fotos",
            "Lab Tour 360°", "Simposio Internacional") se sustituyen por tipo y fecha reales del medio.
            VIDEO y LINK no tienen miniatura en la BD: se muestran con el póster
            temático local de Stitch (homePosterFor) y su icono encima. */}
        {galleryItems.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Aún no hay contenido multimedia.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md auto-rows-[280px]">
            {galleryItems.map((item, i) => {
              const typeLabel = MEDIA_TYPE_LABEL[item.type] || item.type;
              const isExternal = item.type === 'VIDEO' || item.type === 'LINK';
              const slotClass =
                i === 0
                  ? 'md:col-span-8 md:row-span-2'
                  : i === 3
                    ? 'md:col-span-12'
                    : 'md:col-span-4 md:row-span-1';
              const tileWrapClass = `${slotClass} relative rounded-3xl`;
              const tileClass = 'relative rounded-3xl overflow-hidden group shadow-xl bg-surface-container-low cursor-pointer border border-outline-variant/25 h-full w-full';
              const visual =
                item.type === 'IMAGE' ? (
                  <img
                    className="w-full h-full object-cover"
                    src={item.url}
                    alt={item.title}
                  />
                ) : (
                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      className="absolute inset-0 w-full h-full object-cover"
                      src={homePosterFor(item)}
                      alt=""
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-container/50 via-surface-container-high/60 to-tertiary-container/40 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[64px]">
                        {item.type === 'VIDEO' ? 'play_circle' : 'link'}
                      </span>
                    </div>
                  </div>
                );

              if (i === 0) {
                const tile = (
                  <>
                    {visual}
                    {/* Scrim with smooth opacity transition */}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/50 to-transparent transition-opacity duration-500 group-hover:opacity-90"></div>
                    {/* Badges on top */}
                    <div className="absolute top-6 left-6 flex items-center gap-space-xs z-10">
                      <span className="relative inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-tertiary-container text-on-tertiary font-code-badge text-code-badge font-bold uppercase shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-tertiary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-on-tertiary"></span>
                        </span>
                        Nuevo
                      </span>
                      <span className="px-space-md py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface font-code-badge text-code-badge font-mono border border-outline-variant/20">
                        {fmtMonthYear(item.date)}
                      </span>
                    </div>
                    <div className="absolute top-6 right-6 z-10">
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-secondary shadow-md transition-all duration-300 group-hover:bg-secondary group-hover:text-on-secondary">
                        <span className="material-symbols-outlined text-[20px]">
                          {item.type === 'VIDEO' ? 'play_arrow' : item.type === 'LINK' ? 'link' : 'photo_camera'}
                        </span>
                      </div>
                    </div>
                    {/* Bottom Content */}
                    <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-secondary font-code-badge text-code-badge">
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                        <span className="">
                          {typeLabel} • {fmtMonthYear(item.date)}
                        </span>
                      </div>
                      <h3 className="font-headline-lg text-headline-md md:text-headline-lg text-on-surface font-bold group-hover:text-secondary-fixed transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-xl line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </>
                );
                return isExternal ? (
                  <div key={item.id} className={tileWrapClass}>
                    <a href={item.url} target="_blank" rel="noreferrer" className={tileClass}>
                      {tile}
                    </a>
                  </div>
                ) : (
                  <div key={item.id} className={tileWrapClass}>
                    <Link to="/galeria" className={tileClass}>
                      {tile}
                    </Link>
                  </div>
                );
              }

              if (i === 3) {
                const tile = (
                  <>
                    {visual}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end md:justify-center md:max-w-xl">
                      <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-secondary/20 text-secondary w-fit mb-space-xs border border-secondary/30">
                        <span className="material-symbols-outlined text-[16px]">campaign</span>
                        <span className="font-code-badge text-code-badge uppercase font-bold">{typeLabel}</span>
                      </div>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-space-xs group-hover:text-secondary transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center gap-space-sm bg-surface-container-high/80 backdrop-blur-md px-space-lg py-space-md rounded-2xl text-on-surface group-hover:text-secondary group-hover:bg-surface-bright/90 transition-all duration-300 border border-outline-variant/30">
                      <span className="font-label-md text-label-md font-semibold">Ver Resumen Multimedia</span>
                      <span className="material-symbols-outlined text-[18px].5">
                        arrow_forward
                      </span>
                    </div>
                  </>
                );
                return isExternal ? (
                  <div key={item.id} className={tileWrapClass}>
                    <a href={item.url} target="_blank" rel="noreferrer" className={tileClass}>
                      {tile}
                    </a>
                  </div>
                ) : (
                  <div key={item.id} className={tileWrapClass}>
                    <Link to="/galeria" className={tileClass}>
                      {tile}
                    </Link>
                  </div>
                );
              }

              const accent = i === 1 ? 'text-primary' : 'text-tertiary';
              const tile = (
                <>
                  {visual}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent"></div>
                  <div className="absolute top-5 left-5">
                    <span
                      className={`px-space-sm py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md ${accent} font-code-badge text-code-badge font-semibold border border-outline-variant/20`}
                    >
                      {typeLabel} • {fmtMonthYear(item.date)}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className={`font-code-badge text-code-badge ${accent} font-mono`}>
                      {fmtShort(item.date)}
                    </span>
                    <h4
                      className={`font-title-md text-title-md text-on-surface font-bold line-clamp-1 ${
                        i === 1 ? 'group-hover:text-primary' : 'group-hover:text-tertiary'
                      } transition-colors`}
                    >
                      {item.title}
                    </h4>
                  </div>
                </>
              );
              return isExternal ? (
                <div key={item.id} className={tileWrapClass}>
                  <a href={item.url} target="_blank" rel="noreferrer" className={tileClass}>
                    {tile}
                  </a>
                </div>
              ) : (
                <div key={item.id} className={tileWrapClass}>
                  <Link to="/galeria" className={tileClass}>
                    {tile}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 4.5. PREVIA DE CERTÁMENES & EVENTOS ================= */}
      <section className="px-gutter mx-auto max-w-[1440px] w-full pb-16">
        <div className="flex flex-wrap items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <span className="font-code-badge text-code-badge text-secondary font-semibold uppercase tracking-wider">
              Certámenes &amp; Agenda Institucional
            </span>
            <h2 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface font-extrabold tracking-tight">
              Certámenes y <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Eventos</span>
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              El Certamen LI 2025 y los encuentros tecnológicos de la Licenciatura en Informática.
            </p>
          </div>
          <Link
            to="/eventos"
            className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold shadow-sm transition-colors"
          >
            Ver todos los certámenes
            <span className="material-symbols-outlined text-[18px] text-secondary">arrow_forward</span>
          </Link>
        </div>
        {previewEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {previewEvents.map((event) => (
              <Link
                key={event.id}
                to={`/eventos/${event.id}`}
                className="group relative flex flex-col rounded-2xl bg-surface-container-low/90 backdrop-blur-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative w-full h-44 overflow-hidden bg-surface-container-lowest">
                  {event.imageUrl ? (
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      alt={event.title}
                      src={event.imageUrl}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-container/60 via-surface-container-high to-surface-container-lowest" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full font-code-badge text-code-badge font-bold shadow-sm ${event.category === 'Certamen' ? 'bg-secondary text-surface-container-lowest' : 'bg-tertiary-container/90 text-on-tertiary-container'}`}>
                      {event.category === 'Certamen' ? '★ CERTAMEN DESTACADO' : (event.status === 'UPCOMING' ? 'PRÓXIMO' : 'REALIZADO')}
                    </span>
                  </div>
                </div>
                <div className="p-space-md flex-1 flex flex-col gap-space-xs">
                  <span className="font-code-badge text-code-badge text-tertiary font-bold">
                    {fmtShort(event.date)}
                    {event.place ? ` • ${event.place}` : ''}
                  </span>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <span className="inline-flex items-center gap-1 font-headline-sm text-body-md font-semibold text-secondary mt-auto pt-space-xs">
                    Ver detalles <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ================= 5. SECCIÓN DE CONVOCATORIAS & CTA ================= */}
      <section className="px-gutter mx-auto max-w-[1440px] w-full py-16 mb-20">
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high p-8 sm:p-12 lg:p-16 shadow-2xl border border-outline-variant/30">
          {/* Specular Top Rim */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent"></div>
          {/* Accent Orbs Behind CTA */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-secondary/10 blur-[90px] pointer-events-none ambient-glow-1"></div>
          <div className="absolute left-1/3 -top-24 w-80 h-80 rounded-full bg-primary/10 blur-[80px] pointer-events-none ambient-glow-2"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-space-xl">
            {/* Text Block */}
            <div className="flex flex-col gap-space-md max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-highest w-fit mx-auto lg:mx-0 border border-outline-variant/20">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                <span className="font-code-badge text-code-badge text-secondary font-semibold uppercase">
                  {upcomingCertamen ? `Convocatoria Abierta • ${fmtMonthYear(upcomingCertamen.date)}` : 'Convocatoria Abierta • Periodo 2025-1'}
                </span>
              </div>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-extrabold tracking-tight leading-tight">
                {upcomingCertamen
                  ? `¿Tienes un proyecto para el ${upcomingCertamen.title.split(' de Investigación')[0]}?`
                  : '¿Tienes un Proyecto Innovador o Promedio Sobresaliente?'}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed line-clamp-3">
                {upcomingCertamen
                  ? upcomingCertamen.description
                  : 'Logros y distinciones sobresalientes obtenidos por estudiantes de alto mérito académico, fruto de su dedicación, talento y compromiso con la excelencia tecnológica.'}
              </p>
              {upcomingCertamen && (
                <p className="font-body-md text-body-md text-tertiary font-semibold">
                  Evaluación: {fmtShort(upcomingCertamen.date)}
                  {upcomingCertamen.time ? `, ${upcomingCertamen.time}` : ''}
                  {upcomingCertamen.place ? ` · ${upcomingCertamen.place}` : ''}
                </p>
              )}
              {/* Requirements mini list */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-space-md pt-space-xs text-on-surface font-label-md text-label-md">
                <div className="flex items-center gap-1.5 transition-transform duration-200 hover:scale-105">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                  <span className="">{upcomingCertamen ? '8 tecnologías por explorar' : 'Promedio ≥ 9.5 o Proyecto Valorado'}</span>
                </div>
                <div className="flex items-center gap-1.5 transition-transform duration-200 hover:scale-105">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                  <span className="">{upcomingCertamen ? 'Escuelas invitadas' : 'Aval de Docente Tutor'}</span>
                </div>
                <div className="flex items-center gap-1.5 transition-transform duration-200 hover:scale-105">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                  <span className="">{upcomingCertamen ? 'Premiación 1º, 2º y 3º lugar' : 'Código / Evidencia Verificable'}</span>
                </div>
              </div>
            </div>
            {/* Action Box with Magnetic Shimmer and Elastic Buttons.
                Stitch apuntaba a "convocatorias" y "proyectos" (rutas que no
                existen en localhost): se mapean a las rutas reales que ya usaba
                el Home anterior (/estudiantes para postularse y /cuadro-de-honor
                para las bases). */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-space-md shrink-0 w-full sm:w-auto">
              <MagneticLink
                to={upcomingCertamen ? `/eventos/${upcomingCertamen.id}` : '/estudiantes'}
                className="shimmer-effect w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md rounded-full bg-gradient-to-r from-secondary to-primary-container text-on-primary font-title-md text-title-md font-bold transition-all duration-300 hover:shadow-[0_0_40px_rgba(93,230,255,0.45)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px] transition-transform duration-300 group-hover:translate-x-1 anim-send">
                  send
                </span>
                <span className="relative z-10">{upcomingCertamen ? 'Ver convocatoria' : 'Postularme'}</span>
              </MagneticLink>
              <Link
                to={upcomingCertamen ? '/eventos' : '/cuadro-de-honor'}
                className="neon-elastic-btn w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-space-lg py-space-md rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface font-title-md text-title-md font-semibold border border-outline-variant/30 cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                <span className="">{upcomingCertamen ? 'Ver certámenes' : 'Ver Bases y Requisitos'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
