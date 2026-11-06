import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EMBLEM } from '../data/stitchImages';

// Cuentas semilla reales (server/prisma/seed) que autocompleta el selector de rol.
const ROLES = [
  {
    key: 'estudiante',
    label: 'Estudiante',
    email: 'estudiante@informatica.edu',
    password: 'Estudiante123!',
    indicator: 'ROL ACTIVO: ESTUDIANTE',
    domainHint: 'Dominio: @alumnos.umb.mx',
  },
  {
    key: 'editor',
    label: 'Responsable de contenido',
    email: 'contenido@informatica.edu',
    password: 'Contenido123!',
    indicator: 'ROL ACTIVO: RESPONSABLE DE CONTENIDO',
    domainHint: 'Dominio: @umb.mx [Editor]',
  },
  {
    key: 'admin',
    label: 'Administrador',
    email: 'admin@informatica.edu',
    password: 'Admin123!',
    indicator: 'ROL ACTIVO: ADMINISTRADOR CONAIC',
    domainHint: 'Dominio: @umb.mx [Auditor/Root]',
  },
  {
    key: 'evaluador',
    label: 'Evaluador',
    email: 'evaluador@informatica.edu',
    password: 'Evaluador123!',
    indicator: 'ROL ACTIVO: EVALUADOR',
    domainHint: 'Dominio: @umb.mx [Evaluador]',
  },
];

const SELECTED_SHADOW = { boxShadow: 'inset 0 0 0 1.5px rgba(93, 230, 255, 0.7), 0 0 16px rgba(93, 230, 255, 0.15)' };
const UNSELECTED_SHADOW = { boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)' };

export default function Login() {
  const [role, setRole] = useState('estudiante');
  const [email, setEmail] = useState('estudiante@informatica.edu');
  const [password, setPassword] = useState('Estudiante123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);
  const { login } = useAuth();
  const navigate = useNavigate();

  const activeRole = ROLES.find((r) => r.key === role) || ROLES[0];
  const emailValid = email.includes('@') && email.includes('.');

  const pickRole = (key) => {
    const r = ROLES.find((item) => item.key === key);
    if (!r) return;
    setRole(r.key);
    setEmail(r.email);
    setPassword(r.password);
    setError('');
    setSuccess(false);
    setNotice('');
  };

  // Atajo del panel sandbox de Stitch: aplica el rol y autocompleta sus credenciales.
  const fillCredential = (key) => pickRole(key);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess(false);
    setNotice('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate(user.role === 'STUDENT' ? '/' : user.role === 'EVALUATOR' ? '/evaluadores' : '/admin');
      }, 900);
    } catch (err) {
      setLoading(false);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Correo o contraseña incorrectos';
      setError(msg);
    }
  };

  const roleBtnClass = (key) =>
    `role-btn text-left p-space-sm sm:p-space-md rounded-xl transition-all duration-200 cursor-pointer relative group flex flex-col justify-between gap-space-xs ${
      role === key
        ? 'bg-surface-container-high/90 shadow-md'
        : 'bg-surface-container/70 shadow-sm hover:bg-surface-container-high/60'
    }`;

  return (
    <div className="w-full bg-surface flex-1 pt-20">
      <div className="flex flex-col w-full relative overflow-hidden">
        {/* Dynamic Ambient Glow Clusters */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-tr from-inverse-primary/20 via-secondary-container/15 to-transparent blur-[120px] rounded-full"></div>
        <div className="pointer-events-none absolute top-1/3 -right-32 w-[520px] h-[520px] bg-primary-container/10 blur-[130px] rounded-full"></div>
        <div className="pointer-events-none absolute bottom-10 -left-28 w-[460px] h-[460px] bg-tertiary/10 blur-[110px] rounded-full"></div>
        {/* Top Audited Identity Breadcrumb Banner */}
        <div className="w-full px-gutter lg:px-margin pt-space-lg pb-space-sm relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm px-space-md py-space-sm rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center gap-space-xs font-code-badge text-code-badge text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container text-secondary font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                MOD-01
              </span>
              <span className="text-outline">/</span>
              <span className="text-on-surface font-semibold tracking-wide">ACCESO SEGURO &amp; IDENTIDAD DIGITAL</span>
              <span className="text-outline">/</span>
              <span className="text-secondary-fixed-dim">CONAIC AUDITED 2025</span>
              <span className="hidden sm:inline text-outline">•</span>
              <span className="hidden sm:inline text-outline text-[10px]">AUTH_SESSION_KEY_0x7FE4B9</span>
            </div>
            <div className="flex items-center gap-space-sm font-code-badge text-code-badge">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary shadow-[0_0_12px_rgba(69,223,164,0.25)]">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="font-semibold uppercase tracking-wider text-[10px]">SISTEMA ACTIVO // TLS 1.3</span>
              </div>
              <span className="text-outline select-none hidden lg:inline">SYNC: 12ms</span>
            </div>
          </div>
        </div>
        {/* Main Interactive Auth Section */}
        <div className="w-full px-gutter lg:px-margin py-space-md relative z-10 flex flex-col items-center">
          <div className="w-full max-w-2xl relative">
            {/* Glow Perimeter Aura */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-inverse-primary/30 via-secondary/20 to-primary-container/30 rounded-2xl blur-xl opacity-75"></div>
            {/* Core Glassmorphic Authentication Card: panel fijo, sin tilt, para
                que el formulario no se mueva mientras se escriben los datos. */}
            <div className={`w-full rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-space-md sm:p-space-xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-space-lg transition-opacity duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Header: Emblem, Badge & Page Distinction */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md pb-space-sm">
                <div className="flex items-center gap-space-md">
                  <div className={`relative shrink-0 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-inverse-primary to-secondary blur-sm opacity-60"></div>
                    <img alt="Emblema tecnológico de Informática Destaca UMB" className="anim-float relative w-14 h-14 rounded-xl object-contain bg-surface-container-lowest p-1.5 shadow-lg" src={EMBLEM} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-code-badge font-semibold tracking-wider bg-surface-container-high text-secondary">PORTAL OFICIAL</span>
                      <span className="font-code-badge text-[11px] text-outline">UMB IXTLAHUACA</span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-0.5">Iniciar Sesión</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">Acceso institucional autenticado al portal Informática Destaca</p>
                  </div>
                </div>
                {/* Academic Status Chip */}
                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
                  <span className="px-2.5 py-1 rounded-full font-code-badge text-code-badge bg-surface-container-high text-primary-fixed-dim">
                    CONAIC-PE-INFO-2023-088
                  </span>
                  <span className="font-code-badge text-[10px] text-tertiary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span> Servidor Criptográfico
                  </span>
                </div>
              </div>
              {/* Role Selector Switcher */}
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">badge</span>
                    Selecciona tu Perfil Institucional
                  </label>
                  <span className="font-code-badge text-[10px] text-outline" id="roleSelectedIndicator">{activeRole.indicator}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-1" id="roleGrid">
                  {/* Role 1: Estudiante */}
                  <button className={roleBtnClass('estudiante')} data-role="estudiante" style={role === 'estudiante' ? SELECTED_SHADOW : UNSELECTED_SHADOW} type="button" onClick={() => pickRole('estudiante')}>
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                      </div>
                      <span className={role === 'estudiante' ? 'check-pill inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-surface-container-lowest text-[12px] font-bold' : 'check-pill hidden inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-surface-container-lowest text-[12px] font-bold'}>✓</span>
                    </div>
                    <div>
                      <span className="font-title-md text-[15px] leading-tight font-bold text-on-surface block">Estudiante</span>
                      <span className="font-body-md text-[12px] leading-snug text-on-surface-variant line-clamp-2 mt-0.5">Perfil, CV digital y postulaciones al Cuadro de Honor</span>
                    </div>
                    <span className="font-code-badge text-[9px] text-secondary uppercase tracking-wider font-semibold">@alumnos.umb.mx</span>
                  </button>
                  {/* Role 2: Responsable de Contenido */}
                  <button className={roleBtnClass('editor')} data-role="editor" style={role === 'editor' ? SELECTED_SHADOW : UNSELECTED_SHADOW} type="button" onClick={() => pickRole('editor')}>
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                      </div>
                      <span className={role === 'editor' ? 'check-pill inline-flex items-center justify-center w-5 h-5 rounded-full bg-tertiary text-surface-container-lowest text-[12px] font-bold' : 'check-pill hidden inline-flex items-center justify-center w-5 h-5 rounded-full bg-tertiary text-surface-container-lowest text-[12px] font-bold'}>✓</span>
                    </div>
                    <div>
                      <span className="font-title-md text-[15px] leading-tight font-bold text-on-surface block">Contenido</span>
                      <span className="font-body-md text-[12px] leading-snug text-on-surface-variant line-clamp-2 mt-0.5">Gestión de eventos, logros y galería multimedia</span>
                    </div>
                    <span className="font-code-badge text-[9px] text-tertiary uppercase tracking-wider font-semibold">@umb.mx [Editor]</span>
                  </button>
                  {/* Role 3: Administrador */}
                  <button className={roleBtnClass('admin')} data-role="admin" style={role === 'admin' ? SELECTED_SHADOW : UNSELECTED_SHADOW} type="button" onClick={() => pickRole('admin')}>
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-fixed group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      </div>
                      <span className={role === 'admin' ? 'check-pill inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-surface-container-lowest text-[12px] font-bold' : 'check-pill hidden inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-surface-container-lowest text-[12px] font-bold'}>✓</span>
                    </div>
                    <div>
                      <span className="font-title-md text-[15px] leading-tight font-bold text-on-surface block">Administrador</span>
                      <span className="font-body-md text-[12px] leading-snug text-on-surface-variant line-clamp-2 mt-0.5">Control global, auditorías CONAIC y gestión docente</span>
                    </div>
                    <span className="font-code-badge text-[9px] text-primary-fixed uppercase tracking-wider font-semibold">@umb.mx [Root]</span>
                  </button>
                  {/* Role 4: Evaluador */}
                  <button className={roleBtnClass('evaluador')} data-role="evaluador" style={role === 'evaluador' ? SELECTED_SHADOW : UNSELECTED_SHADOW} type="button" onClick={() => pickRole('evaluador')}>
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">grading</span>
                      </div>
                      <span className={role === 'evaluador' ? 'check-pill inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-surface-container-lowest text-[12px] font-bold' : 'check-pill hidden inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-surface-container-lowest text-[12px] font-bold'}>✓</span>
                    </div>
                    <div>
                      <span className="font-title-md text-[15px] leading-tight font-bold text-on-surface block">Evaluador</span>
                      <span className="font-body-md text-[12px] leading-snug text-on-surface-variant line-clamp-2 mt-0.5">Calificar proyectos del certamen y registrar observaciones</span>
                    </div>
                    <span className="font-code-badge text-[9px] text-amber-300 uppercase tracking-wider font-semibold">@umb.mx [Evaluador]</span>
                  </button>
                </div>
              </div>
              {/* Feedback Alerts (antes: simulación de Stitch; ahora: resultado real del login) */}
              {success && (
                <div className="flex items-start gap-space-sm p-space-md rounded-xl bg-tertiary-container/30 text-on-tertiary shadow-[0_0_24px_rgba(69,223,164,0.3)]" id="alertSuccess">
                  <span className="material-symbols-outlined text-tertiary text-[22px] shrink-0">check_circle</span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-tertiary">Autenticación Exitosa // Token Criptográfico Emitido</span>
                    <span className="font-body-md text-body-md text-on-surface">Credenciales validadas ante el Directorio Académico UMB. Redirigiendo a tu espacio de trabajo...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-space-sm p-space-md rounded-xl bg-error-container/40 text-on-error-container shadow-[0_0_24px_rgba(255,180,171,0.25)]" id="alertError">
                  <span className="material-symbols-outlined text-error text-[22px] shrink-0">warning</span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-error">Fallo de Validación // Acceso Denegado</span>
                    <span className="font-body-md text-body-md text-on-surface">{error}</span>
                  </div>
                </div>
              )}
              {/* Auth Form */}
              <form className="flex flex-col gap-space-md" id="authLoginForm" onSubmit={onSubmit}>
                {/* Field 1: Correo Electrónico Institucional */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5" htmlFor="inputEmail">
                      <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                      Correo Electrónico Institucional
                    </label>
                    <span className="font-code-badge text-[10px] text-outline" id="emailDomainHint">{activeRole.domainHint}</span>
                  </div>
                  <div className="relative flex items-center w-full rounded-xl bg-surface-container-lowest/90 px-space-md py-3 shadow-inner group transition-all" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)' }}>
                    <span className="material-symbols-outlined text-outline text-[20px] mr-space-sm select-none group-focus-within:text-secondary transition-colors">terminal</span>
                    <input autoComplete="username" className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline outline-none" id="inputEmail" placeholder="nombre.apellido@alumnos.umb.mx" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    {emailValid && (
                      <div className="flex items-center text-tertiary shrink-0 ml-2" id="emailValidationBadge" title="Formato Institucional Válido">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                    )}
                  </div>
                  <span className="font-code-badge text-[10px] text-on-surface-variant">Usa las credenciales emitidas por la Coordinación de Carrera UES Ixtlahuaca.</span>
                </div>
                {/* Field 2: Contraseña de Acceso */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5" htmlFor="inputPassword">
                      <span className="material-symbols-outlined text-[16px] text-secondary">key</span>
                      Contraseña de Acceso Institucional
                    </label>
                    <button className="font-label-md text-[11px] text-secondary hover:text-primary transition-colors hover:underline" type="button" id="linkForgotPassword" onClick={() => setNotice('Para restablecer tu acceso, contacta a la Coordinación de la Licenciatura en Informática.')}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative flex items-center w-full rounded-xl bg-surface-container-lowest/90 px-space-md py-3 shadow-inner group transition-all" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)' }}>
                    <span className="material-symbols-outlined text-outline text-[20px] mr-space-sm select-none group-focus-within:text-secondary transition-colors">lock</span>
                    <input autoComplete="current-password" className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline outline-none tracking-wider" id="inputPassword" placeholder="••••••••••••••••" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="flex items-center text-outline hover:text-on-surface transition-colors shrink-0 ml-2 focus:outline-none" id="btnTogglePassword" title="Mostrar/Ocultar contraseña" type="button" onClick={() => setShowPassword((v) => !v)}>
                      <span className="material-symbols-outlined text-[20px]" id="iconEye">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                {/* Aviso honesto (sin flujo falso de recuperación ni de solicitud de acceso) */}
                {notice && (
                  <div className="flex items-start gap-space-sm p-space-md rounded-xl bg-secondary-container/20 text-on-surface" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)' }}>
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">info</span>
                    <p className="font-body-md text-body-md text-on-surface">{notice}</p>
                  </div>
                )}
                {/* Extra Options & Integrity Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded bg-surface-container-highest text-inverse-primary focus:ring-0 cursor-pointer accent-inverse-primary" id="chkRememberMe" type="checkbox" />
                    <span className="font-body-md text-[13px] text-on-surface-variant">Recordar sesión en este equipo seguro</span>
                  </label>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high/60 font-code-badge text-[10px] text-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[13px] text-tertiary">lock_reset</span>
                    <span>SHA-256 HMAC ACTIVO</span>
                  </div>
                </div>
                {/* Main Actions */}
                <div className="flex flex-col gap-space-sm pt-2">
                  <button className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-inverse-primary via-primary-container to-secondary-container p-0.5 shadow-[0_0_28px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(34,211,238,0.5)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70" id="btnSubmitLogin" type="submit" disabled={loading}>
                    <div className="w-full h-full bg-surface-container-lowest/30 group-hover:bg-transparent rounded-[10px] px-space-lg py-3.5 flex items-center justify-center gap-space-sm transition-colors">
                      <span className={loading ? 'font-headline-sm text-[16px] font-bold text-white tracking-wide hidden items-center gap-2' : 'font-headline-sm text-[16px] font-bold text-white tracking-wide flex items-center gap-2'} id="btnLoginText">
                        <span>Iniciar Sesión en el Portal</span>
                        <span className="material-symbols-outlined text-[18px] animate-pulse group-hover:translate-x-1 transition-transform">login</span>
                      </span>
                      {/* Hidden Holographic Spinner */}
                      <div className={loading ? 'flex items-center gap-2 text-white font-code-badge text-code-badge' : 'hidden items-center gap-2 text-white font-code-badge text-code-badge'} id="btnLoginSpinner">
                        <svg className="animate-spin h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                        </svg>
                        <span>AUTENTICANDO ACCESO INSTITUCIONAL...</span>
                      </div>
                    </div>
                  </button>
                  {/* Secondary Alternative Action */}
                  <button className="w-full py-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-semibold text-center transition-all flex items-center justify-center gap-1.5" type="button" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)' }} onClick={() => setNotice('Para solicitar acceso institucional o validar tu matrícula UMB, contacta a la Coordinación de la Licenciatura en Informática.')}>
                    <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                    <span>Solicitar acceso institucional o validar matrícula UMB</span>
                  </button>
                </div>
              </form>
              {/* Divider Strip */}
              <div className="relative flex items-center justify-center my-0.5">
                <div className="w-full h-px bg-surface-variant"></div>
                <span className="absolute bg-surface-container-low px-space-md font-code-badge text-[10px] text-outline uppercase tracking-wider">
                  Acceso Rápido de Prueba // Sandbox Demo
                </span>
              </div>
              {/* Sandbox Quick-Switch Credentials Panel */}
              <div className="flex flex-col gap-space-xs p-space-md rounded-xl bg-surface-container-lowest/80 shadow-inner" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-md text-[11px] font-semibold text-on-surface flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[15px]">touch_app</span>
                    Clic para autocompletar credenciales de evaluación:
                  </span>
                  <span className="font-code-badge text-[10px] text-tertiary">3 PERFILES CARGADOS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
                  <button className="flex flex-col items-start p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left group" type="button" onClick={() => fillCredential('estudiante')}>
                    <span className="font-code-badge text-[10px] font-bold text-secondary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Estudiante (GPA 9.94)
                    </span>
                    <span className="font-code-badge text-[10px] text-on-surface-variant truncate w-full">estudiante@informatica.edu</span>
                  </button>
                  <button className="flex flex-col items-start p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left group" type="button" onClick={() => fillCredential('editor')}>
                    <span className="font-code-badge text-[10px] font-bold text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Editor Multimedia
                    </span>
                    <span className="font-code-badge text-[10px] text-on-surface-variant truncate w-full">contenido@informatica.edu</span>
                  </button>
                  <button className="flex flex-col items-start p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left group" type="button" onClick={() => fillCredential('admin')}>
                    <span className="font-code-badge text-[10px] font-bold text-primary-fixed flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span> Admin CONAIC
                    </span>
                    <span className="font-code-badge text-[10px] text-on-surface-variant truncate w-full">admin@informatica.edu</span>
                  </button>
                </div>
              </div>
              {/* System Telemetry Micro-Pillars */}
              <div className="grid grid-cols-3 gap-space-xs pt-1 border-t border-surface-variant/40">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container/40 text-center">
                  <span className="font-code-badge text-[13px] font-bold text-tertiary">99.98%</span>
                  <span className="font-code-badge text-[9px] text-on-surface-variant uppercase">Uptime SSO UMB</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container/40 text-center">
                  <span className="font-code-badge text-[13px] font-bold text-secondary">AES-256</span>
                  <span className="font-code-badge text-[9px] text-on-surface-variant uppercase">Cifrado Integral</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container/40 text-center">
                  <span className="font-code-badge text-[13px] font-bold text-primary-fixed">CONAIC</span>
                  <span className="font-code-badge text-[9px] text-on-surface-variant uppercase">Audit Vigente</span>
                </div>
              </div>
              {/* Privacy & Legal Notice Footer in Card */}
              <div className="flex items-start gap-space-xs pt-2 text-on-surface-variant/80">
                <span className="material-symbols-outlined text-[15px] text-outline shrink-0 mt-0.5">policy</span>
                <p className="font-body-md text-[11px] leading-relaxed">
                  Tus datos están protegidos conforme al <Link className="text-primary hover:underline font-semibold" to="/aviso-de-privacidad">Aviso de Privacidad Integral de la Universidad Mexiquense del Bicentenario</Link> y no se comparten con terceros. Acceso institucional auditado bajo el Registro CONAIC-PE-INFO-2023-088.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Educational Trust & Institutional Infrastructure Strip */}
        <div className="w-full px-gutter lg:px-margin pt-space-xl pb-space-lg relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {/* Node 1 */}
            <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-lg" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)' }}>
              <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-[15px] font-bold text-on-surface">Validación Académica Automática</span>
                <p className="font-body-md text-[13px] text-on-surface-variant mt-1 leading-normal">
                  Sincronización directa con el Kardex Institucional de la UES Ixtlahuaca para acreditación inmediata en el Cuadro de Honor.
                </p>
              </div>
            </div>
            {/* Node 2 */}
            <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-lg" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)' }}>
              <div className="w-10 h-10 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-[24px]">shield</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-[15px] font-bold text-on-surface">Tokens Efímeros de Sesión</span>
                <p className="font-body-md text-[13px] text-on-surface-variant mt-1 leading-normal">
                  Arquitectura OAuth 2.0 y JWT con expiración estricta para garantizar la seguridad de expedientes y portfolios digitales.
                </p>
              </div>
            </div>
            {/* Node 3 */}
            <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-lg" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)' }}>
              <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-fixed shrink-0">
                <span className="material-symbols-outlined text-[24px]">hub</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-[15px] font-bold text-on-surface">Integración Google Workspace</span>
                <p className="font-body-md text-[13px] text-on-surface-variant mt-1 leading-normal">
                  Soporta autenticación federada UMB con tu cuenta de correo asignada al ingresar a la Licenciatura en Informática.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
