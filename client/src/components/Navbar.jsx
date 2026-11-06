import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Logo UMB adaptado al tema oscuro (fondo transparente, texto en blanco),
// autoalojado en public/images/ (la marca UMB es la insignia del header).
const LOGO_URL = '/images/umb-mark-dark.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // Ctrl+K / Cmd+K enfoca el buscador (como indica el kbd ⌘K de Stitch)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    setMenuOpen(false);
    navigate(term ? `/buscar?q=${encodeURIComponent(term)}` : '/buscar');
  };

  // "Logros Recientes" es un ancla dentro del Home de Stitch: baja al carrusel de honor
  const goLogros = () => {
    setMenuOpen(false);
    navigate('/');
    setTimeout(() => {
      document.getElementById('logros-recientes')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const navLinkCls = ({ isActive }) =>
    isActive
      ? 'px-space-md py-1.5 rounded-full transition-all text-secondary bg-surface-container-high font-semibold shadow-sm flex items-center gap-1.5 font-label-md text-label-md'
      : 'px-space-md py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all font-label-md text-label-md font-medium';

  const initials = user
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-outline-variant/30 print:hidden">
      <div className="h-20 max-w-[1440px] mx-auto px-gutter flex items-center justify-between gap-space-md">
        <Link to="/" className="flex items-center gap-space-md shrink-0">
          <img
            alt="UMB - Universidad Mexiquense del Bicentenario"
            className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
            src={LOGO_URL}
          />
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-on-surface tracking-tight leading-tight font-bold">Informática Destaca</span>
            <span className="font-code-badge text-code-badge text-secondary tracking-wider uppercase font-semibold">Licenciatura en Informática</span>
          </div>
        </Link>
        <form
          onSubmit={onSearch}
          role="search"
          className="hidden md:flex items-center relative rounded-full bg-surface-container-high/60 backdrop-blur-md border border-outline-variant/30 hover:border-secondary/40 transition-all duration-300 px-3 py-1.5 text-on-surface-variant focus-within:text-on-surface focus-within:border-secondary/60 focus-within:ring-1 focus-within:ring-secondary/30"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 select-none mr-2">search</span>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent border-0 p-0 text-label-md font-label-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-0 w-36 lg:w-48 transition-all"
            placeholder="Buscar en el portal... (Ctrl+K)"
            type="search"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 select-none shadow-sm">⌘K</kbd>
        </form>
        <nav className="hidden xl:flex items-center gap-1.5 p-1.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-xl border border-secondary/30 shadow-[0_0_20px_rgba(93,230,255,0.2)] ring-1 ring-secondary/20 transition-all duration-300 hover:border-secondary/50">
          <NavLink to="/" end className={navLinkCls}>
            {({ isActive }) => (
              <>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                <span>Inicio</span>
              </>
            )}
          </NavLink>
          <NavLink to="/cuadro-de-honor" className={navLinkCls}>
            {({ isActive }) => (
              <>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                <span>Cuadro de Honor</span>
              </>
            )}
          </NavLink>
          <NavLink to="/estudiantes" className={navLinkCls}>
            {({ isActive }) => (
              <>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                <span>Perfiles y CVs</span>
              </>
            )}
          </NavLink>
          <NavLink to="/eventos" className={navLinkCls}>
            {({ isActive }) => (
              <>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                <span>Certámenes</span>
              </>
            )}
          </NavLink>
          <NavLink to="/evaluadores" className={navLinkCls}>
            {({ isActive }) => (
              <>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                <span>Evaluadores</span>
              </>
            )}
          </NavLink>
          <NavLink to="/galeria" className={navLinkCls}>
            {({ isActive }) => (
              <>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                <span>Galería Multimedia</span>
              </>
            )}
          </NavLink>
          <button type="button" onClick={goLogros} className="px-space-md py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all font-label-md text-label-md font-medium">
            Logros Recientes
          </button>
        </nav>
        <div className="flex items-center gap-space-md shrink-0">
          {/* Botón hamburguesa: solo en móvil/tablet (el nav de escritorio es hidden xl:flex). */}
          <button
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="xl:hidden w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center justify-center hover:border-secondary/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">{menuOpen ? 'close' : 'menu'}</span>
          </button>
          {user ? (
            <>
              <span className="hidden lg:block font-body-md text-body-md text-on-surface-variant">
                {user.name} · <span className="font-code-badge text-code-badge text-secondary">{user.role}</span>
              </span>
              {(user.role === 'ADMIN' || user.role === 'CONTENT_MANAGER') && (
                <Link to="/admin" className="px-space-md py-1.5 rounded-full font-label-md text-label-md text-on-surface bg-surface-container-high border border-outline-variant/30 hover:border-secondary/40 transition-all">
                  Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="px-space-md py-1.5 rounded-full font-label-md text-label-md text-on-surface-variant bg-surface-container border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-high transition-all"
              >
                Salir
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-inner transition-transform duration-300 hover:scale-110 cursor-pointer">
                <span className="font-code-badge text-code-badge text-on-primary font-semibold">{initials}</span>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="magnetic-btn shimmer-effect relative group overflow-hidden px-space-lg py-space-xs rounded-full font-label-md text-label-md text-on-primary bg-gradient-to-r from-secondary to-primary-container hover:brightness-110 shadow-[0_0_20px_rgba(93,230,255,0.25)] transition-all flex items-center gap-space-xs font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-12">lock_open</span>
                <span>Iniciar Sesión</span>
              </Link>
              <Link
                to="/login"
                aria-label="Iniciar sesión"
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-inner transition-transform duration-300 hover:scale-110 cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Panel desplegable móvil: mismos enlaces del menú + buscador. */}
      {menuOpen && (
        <div className="xl:hidden border-t border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto px-gutter py-space-md flex flex-col gap-space-sm">
            <form
              onSubmit={onSearch}
              role="search"
              className="flex items-center rounded-full bg-surface-container-high/60 backdrop-blur-md border border-outline-variant/30 px-3 py-2 text-on-surface-variant focus-within:border-secondary/60"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 select-none mr-2">search</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent border-0 p-0 text-label-md font-label-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-0 flex-1"
                placeholder="Buscar en el portal..."
                type="search"
              />
              <button type="submit" className="text-secondary font-label-md text-label-md font-semibold shrink-0">Buscar</button>
            </form>
            <nav className="flex flex-col">
              <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Inicio</NavLink>
              <NavLink to="/cuadro-de-honor" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Cuadro de Honor</NavLink>
              <NavLink to="/estudiantes" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Perfiles y CVs</NavLink>
              <NavLink to="/eventos" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Certámenes</NavLink>
              <NavLink to="/evaluadores" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-amber-300 bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Evaluadores</NavLink>
              <NavLink to="/galeria" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Galería Multimedia</NavLink>
              <button type="button" onClick={goLogros} className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-left">Logros Recientes</button>
              {user && (user.role === 'ADMIN' || user.role === 'CONTENT_MANAGER') && (
                <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Panel de Administración</NavLink>
              )}
              {!user && (
                <NavLink to="/login" onClick={() => setMenuOpen(false)} className={({ isActive }) => `px-space-md py-2.5 rounded-lg font-label-md text-label-md ${isActive ? 'text-secondary bg-surface-container-high font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>Iniciar Sesión</NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
