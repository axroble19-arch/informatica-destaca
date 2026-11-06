import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, studentsApi, eventsApi, achievementsApi, participationsApi, mediaApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CountUp from '../components/CountUp';
import TiltCard from '../components/TiltCard';
import { ADMIN_PORTRAIT, withStudentPhoto } from '../data/stitchImages';

const emptyStudent = { publicName: '', semester: '', generation: '', academicStatus: 'Activo', bio: '', interests: '', skills: '', consentToPublish: true };
const emptyEvent = { title: '', description: '', date: '2026-11-16T10:00', time: '10:00 - 18:00', place: '', modality: 'Presencial', organizer: '', category: 'Hackathon', status: 'UPCOMING', imageUrl: '' };
const emptyAchievement = { studentId: '', category: 'Académico', title: '', description: '', date: '2026-11-05', institution: '', evidenceUrl: '' };
const emptyParticipation = { studentId: '', eventId: '', type: 'ATTENDEE', description: '', result: '', evidenceUrl: '' };
const emptyMedia = { title: '', url: '', type: 'LINK', eventId: '', studentId: '', achievementId: '', consentToPublish: true };
const emptyUser = { name: '', email: '', password: '', role: 'CONTENT_MANAGER' };

const fieldCls = 'bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-space-sm py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30';
const labelCls = 'font-code-badge text-code-badge text-on-surface-variant';
const submitCls = 'mt-space-sm w-full py-2.5 rounded-lg bg-gradient-to-r from-inverse-primary to-secondary-container text-on-primary font-label-md text-label-md font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5';

const avatarColors = ['bg-secondary/20 text-secondary', 'bg-primary/20 text-primary', 'bg-tertiary/20 text-tertiary', 'bg-surface-variant text-on-surface'];

const initialsOf = (name) => (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const eventStatusMeta = {
  UPCOMING: { label: 'PRÓXIMO', cls: 'bg-secondary/15 text-secondary' },
  COMPLETED: { label: 'CONCLUIDO', cls: 'bg-tertiary/15 text-tertiary' },
  CANCELLED: { label: 'CANCELADO', cls: 'bg-error/15 text-error' },
};

const participationTypeLabels = {
  ATTENDEE: 'Asistente',
  SPEAKER: 'Ponente',
  CONTESTANT: 'Concursante',
  ORGANIZER: 'Organizador',
  COLLABORATOR: 'Colaborador',
  OTHER: 'Otro',
};

function Toast({ toast, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 10);
    const t2 = setTimeout(() => onClose(toast.id), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const conf = {
    success: { cls: 'border-tertiary/40', icon: 'check_circle', iconCls: 'text-tertiary' },
    error: { cls: 'border-error/40', icon: 'error', iconCls: 'text-error' },
    info: { cls: 'border-secondary/40', icon: 'info', iconCls: 'text-secondary' },
  }[toast.type] || { cls: 'border-secondary/40', icon: 'info', iconCls: 'text-secondary' };
  return (
    <div className={`pointer-events-auto flex items-center gap-space-sm px-space-md py-space-sm rounded-lg shadow-2xl backdrop-blur-xl border transition-all duration-300 transform max-w-md bg-surface-container/95 text-on-surface ${conf.cls} ${show ? '' : 'translate-x-full opacity-0'}`}>
      <span className={`material-symbols-outlined ${conf.iconCls} text-[20px]`}>{conf.icon}</span>
      <span className="font-body-md text-body-md">{toast.message}</span>
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('aprobaciones');
  const [pending, setPending] = useState({ achievements: [], participations: [] });
  const [pendingErr, setPendingErr] = useState('');
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [media, setMedia] = useState([]);
  const [users, setUsers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEventId, setEditingEventId] = useState(null);
  const [achievementForm, setAchievementForm] = useState(emptyAchievement);
  const [editingAchievementId, setEditingAchievementId] = useState(null);
  const [participationForm, setParticipationForm] = useState(emptyParticipation);
  const [editingParticipationId, setEditingParticipationId] = useState(null);
  const [mediaForm, setMediaForm] = useState(emptyMedia);
  const [mediaFile, setMediaFile] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [mounted, setMounted] = useState(false);

  const pushToast = (type, message) => setToasts((t) => [...t, { id: Date.now() + Math.random(), type, message }]);
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const fail = (e, fallback) => pushToast('error', e?.response?.data?.error || e?.message || fallback);

  const load = () => {
    adminApi.pending()
      .then((p) => { setPending(p); setPendingErr(''); })
      .catch((e) => setPendingErr(e?.response?.data?.error || 'No se pudieron cargar las solicitudes pendientes.'));
    studentsApi.list().then((list) => setStudents(list.map(withStudentPhoto))).catch(() => {});
    eventsApi.list().then(setEvents).catch(() => {});
    achievementsApi.list().then(setAchievements).catch(() => {});
    participationsApi.list().then(setParticipations).catch(() => {});
    adminApi.media().then(setMedia).catch(() => {});
    // La lista de usuarios es solo ADMIN (el endpoint responde 403 para
    // CONTENT_MANAGER); en ese caso la pestaña ni se muestra.
    if (user?.role === 'ADMIN') adminApi.users().then(setUsers).catch(() => {});
    if (user?.role === 'ADMIN') adminApi.evaluations().then(setEvaluations).catch(() => {});
  };
  useEffect(load, []);
  // La lista de usuarios es solo ADMIN: se recarga cuando el rol ya está
  // resuelto (el load() inicial puede correr antes de que useAuth lo tenga).
  useEffect(() => {
    if (user?.role === 'ADMIN') adminApi.users().then(setUsers).catch(() => {});
    if (user?.role === 'ADMIN') adminApi.evaluations().then(setEvaluations).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);

  const pendingTotal = pending.achievements.length + pending.participations.length;

  const approve = async (kind, id) => {
    try {
      if (kind === 'achievement') await adminApi.approveAchievement(id);
      else await adminApi.approveParticipation(id);
      pushToast('success', 'Solicitud aprobada y publicada en las secciones públicas.');
      load();
    } catch (e) { fail(e, 'No se pudo aprobar.'); }
  };
  const reject = async (kind, id) => {
    try {
      if (kind === 'achievement') await adminApi.rejectAchievement(id);
      else await adminApi.rejectParticipation(id);
      pushToast('success', 'Solicitud rechazada y devuelta a aclaración.');
      load();
    } catch (e) { fail(e, 'No se pudo rechazar.'); }
  };
  const approveAll = async () => {
    let ok = 0;
    let bad = 0;
    let lastErr = '';
    for (const a of pending.achievements) {
      try { await adminApi.approveAchievement(a.id); ok++; } catch (e) { bad++; lastErr = e?.response?.data?.error || 'No se pudo aprobar.'; }
    }
    for (const p of pending.participations) {
      try { await adminApi.approveParticipation(p.id); ok++; } catch (e) { bad++; lastErr = e?.response?.data?.error || 'No se pudo aprobar.'; }
    }
    if (ok) pushToast('success', `${ok} ${ok === 1 ? 'solicitud aprobada' : 'solicitudes aprobadas'} y publicadas con sello digital CONAIC.`);
    if (bad) pushToast('error', lastErr);
    load();
  };

  const studentPayload = () => ({
    ...studentForm,
    semester: studentForm.semester ? Number(studentForm.semester) : null,
    interests: studentForm.interests.split(',').map((s) => s.trim()).filter(Boolean),
    skills: studentForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
  });
  const saveStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await studentsApi.update(editingStudentId, studentPayload());
        pushToast('success', 'Estudiante actualizado en el padrón.');
        setEditingStudentId(null);
      } else {
        await studentsApi.create(studentPayload());
        pushToast('success', 'Estudiante incorporado con éxito al padrón.');
      }
      setStudentForm(emptyStudent);
      load();
    } catch (err2) { fail(err2, 'No se pudo guardar al estudiante.'); }
  };
  const startEditStudent = (s) => {
    setStudentForm({
      publicName: s.publicName || '',
      semester: s.semester != null ? String(s.semester) : '',
      generation: s.generation || '',
      academicStatus: s.academicStatus || 'Activo',
      bio: s.bio || '',
      interests: (s.interests || []).join(', '),
      skills: (s.skills || []).join(', '),
      consentToPublish: !!s.consentToPublish,
    });
    setEditingStudentId(s.id);
  };
  const removeStudent = (s) => {
    if (!window.confirm(`¿Eliminar a ${s.publicName}?`)) return;
    studentsApi.remove(s.id).then(() => { pushToast('success', 'Estudiante eliminado.'); load(); }).catch((e2) => fail(e2, 'No se pudo eliminar.'));
  };

  const eventPayload = () => ({ ...eventForm, date: new Date(eventForm.date).toISOString() });
  const saveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        await eventsApi.update(editingEventId, eventPayload());
        pushToast('success', 'Evento actualizado en la agenda.');
        setEditingEventId(null);
      } else {
        await eventsApi.create(eventPayload());
        pushToast('success', `Evento institucional '${eventForm.title}' publicado en la agenda de la UMB.`);
      }
      setEventForm(emptyEvent);
      load();
    } catch (err2) { fail(err2, 'No se pudo guardar el evento.'); }
  };
  const startEditEvent = (ev) => {
    setEventForm({
      title: ev.title || '',
      description: ev.description || '',
      date: toLocalInput(ev.date),
      time: ev.time || '',
      place: ev.place || '',
      modality: ev.modality || 'Presencial',
      organizer: ev.organizer || '',
      category: ev.category || 'Hackathon',
      status: ev.status || 'UPCOMING',
      imageUrl: ev.imageUrl || '',
    });
    setEditingEventId(ev.id);
  };
  const removeEvent = (ev) => {
    if (!window.confirm(`¿Eliminar el evento "${ev.title}"?`)) return;
    eventsApi.remove(ev.id).then(() => { pushToast('success', 'Evento eliminado.'); load(); }).catch((e2) => fail(e2, 'No se pudo eliminar.'));
  };

  const achievementPayload = () => ({
    ...achievementForm,
    studentId: Number(achievementForm.studentId),
    date: new Date(`${achievementForm.date}T12:00:00`).toISOString(),
  });
  const saveAchievement = async (e) => {
    e.preventDefault();
    try {
      if (editingAchievementId) {
        await achievementsApi.update(editingAchievementId, achievementPayload());
        pushToast('success', 'Logro actualizado.');
        setEditingAchievementId(null);
      } else {
        await achievementsApi.create(achievementPayload());
        pushToast('success', 'Logro registrado. Queda en PENDING hasta que un ADMIN lo apruebe.');
      }
      setAchievementForm(emptyAchievement);
      load();
    } catch (err2) { fail(err2, 'No se pudo guardar el logro.'); }
  };
  const startEditAchievement = (a) => {
    setAchievementForm({
      studentId: a.studentId != null ? String(a.studentId) : (a.student?.id != null ? String(a.student.id) : ''),
      category: a.category || 'Académico',
      title: a.title || '',
      description: a.description || '',
      date: a.date ? a.date.slice(0, 10) : '',
      institution: a.institution || '',
      evidenceUrl: a.evidenceUrl || '',
    });
    setEditingAchievementId(a.id);
  };
  const removeAchievement = (a) => {
    if (!window.confirm(`¿Eliminar el logro "${a.title}"?`)) return;
    achievementsApi.remove(a.id).then(() => { pushToast('success', 'Logro eliminado.'); load(); }).catch((e2) => fail(e2, 'No se pudo eliminar.'));
  };

  const participationPayload = () => ({
    ...participationForm,
    studentId: Number(participationForm.studentId),
    eventId: Number(participationForm.eventId),
  });
  const saveParticipation = async (e) => {
    e.preventDefault();
    try {
      if (editingParticipationId) {
        await participationsApi.update(editingParticipationId, participationPayload());
        pushToast('success', 'Participación actualizada.');
        setEditingParticipationId(null);
      } else {
        await participationsApi.create(participationPayload());
        pushToast('success', 'Participación registrada. Queda en PENDING hasta su aprobación.');
      }
      setParticipationForm(emptyParticipation);
      load();
    } catch (err2) { fail(err2, 'No se pudo guardar la participación.'); }
  };
  const startEditParticipation = (p) => {
    setParticipationForm({
      studentId: p.studentId != null ? String(p.studentId) : (p.student?.id != null ? String(p.student.id) : ''),
      eventId: p.eventId != null ? String(p.eventId) : (p.event?.id != null ? String(p.event.id) : ''),
      type: p.type || 'ATTENDEE',
      description: p.description || '',
      result: p.result || '',
      evidenceUrl: p.evidenceUrl || '',
    });
    setEditingParticipationId(p.id);
  };
  const removeParticipation = (p) => {
    if (!window.confirm(`¿Eliminar la participación de ${p.student?.publicName || 'este estudiante'} en ${p.event?.title || 'este evento'}?`)) return;
    participationsApi.remove(p.id).then(() => { pushToast('success', 'Participación eliminada.'); load(); }).catch((e2) => fail(e2, 'No se pudo eliminar.'));
  };

  // --- Multimedia: subir archivo (dos pasos: /upload y luego el registro)
  // o registrar un enlace. La lista muestra todo el catálogo (no solo lo
  // publicado) y eliminar es solo ADMIN (el backend responde 403 si no).
  const uploadMediaFile = async (e) => {
    e.preventDefault();
    if (!mediaFile) { pushToast('error', 'Selecciona un archivo primero.'); return; }
    if (!mediaForm.title.trim()) { pushToast('error', 'El título es obligatorio.'); return; }
    try {
      const { url } = await mediaApi.upload(mediaFile);
      const type = mediaFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      await mediaApi.create({
        title: mediaForm.title.trim(),
        url,
        type,
        eventId: mediaForm.eventId ? Number(mediaForm.eventId) : null,
        studentId: mediaForm.studentId ? Number(mediaForm.studentId) : null,
        achievementId: mediaForm.achievementId ? Number(mediaForm.achievementId) : null,
        consentToPublish: mediaForm.consentToPublish,
      });
      setMediaForm(emptyMedia);
      setMediaFile(null);
      pushToast('success', 'Archivo subido y registrado en la galería.');
      load();
    } catch (err2) { fail(err2, 'No se pudo subir el archivo.'); }
  };
  const createMediaLink = async (e) => {
    e.preventDefault();
    try {
      await mediaApi.create({
        ...mediaForm,
        url: mediaForm.url.trim(),
        eventId: mediaForm.eventId ? Number(mediaForm.eventId) : null,
        studentId: mediaForm.studentId ? Number(mediaForm.studentId) : null,
        achievementId: mediaForm.achievementId ? Number(mediaForm.achievementId) : null,
      });
      setMediaForm(emptyMedia);
      pushToast('success', 'Enlace registrado en la galería.');
      load();
    } catch (err2) { fail(err2, 'No se pudo registrar el enlace.'); }
  };
  const removeMedia = (m) => {
    if (!window.confirm(`¿Eliminar "${m.title}" de la galería?`)) return;
    mediaApi.remove(m.id).then(() => { pushToast('success', 'Elemento eliminado de la galería.'); load(); }).catch((e2) => fail(e2, 'No se pudo eliminar.'));
  };

  // --- Usuarios: alta solo ADMIN (el endpoint POST /auth/register es
  // solo ADMIN). No existe ruta para eliminar usuarios: no se inventa.
  const createUser = async (e) => {
    e.preventDefault();
    try {
      await authApi.register({ ...userForm });
      setUserForm(emptyUser);
      pushToast('success', `Usuario ${userForm.email} creado.`);
      load();
    } catch (err2) { fail(err2, 'No se pudo crear el usuario.'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };


  const tabBtn = (id, icon, label, badge, badgeCls) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`tab-button inline-flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md transition-all shrink-0 ${tab === id ? 'font-semibold bg-secondary/15 text-secondary border border-secondary/30 shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
    >
      <span className={`material-symbols-outlined text-[18px] ${id === 'aprobaciones' && pendingTotal > 0 ? 'animate-pulse' : ''}`}>{icon}</span>
      <span>{label}</span>
      {badge != null && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-code-badge font-semibold ${badgeCls}`}>{badge}</span>}
    </button>
  );

  const modalRows = () => {
    if (!modal) return [];
    if (modal.kind === 'student') {
      const s = modal.item;
      return [
        ['NOMBRE', s.publicName],
        ['SEMESTRE', s.semester != null ? `${s.semester}° Semestre` : 'Sin asignar'],
        ['GENERACIÓN', s.generation || 'Sin registrar'],
        ['ESTADO ACADÉMICO', s.academicStatus || 'Sin registrar'],
        ['INTERESES', (s.interests || []).join(', ') || 'Sin registrar'],
        ['HABILIDADES', (s.skills || []).join(', ') || 'Sin registrar'],
        ['AUTORIZACIÓN DE PUBLICACIÓN', s.consentToPublish ? 'Sí' : 'No'],
      ];
    }
    if (modal.kind === 'achievement') {
      const a = modal.item;
      return [
        ['TÍTULO', a.title],
        ['ESTUDIANTE', a.student?.publicName || 'Sin asignar'],
        ['CATEGORÍA', a.category],
        ['INSTITUCIÓN', a.institution || 'Sin registrar'],
        ['FECHA', a.date ? new Date(a.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin registrar'],
        ['ESTADO', a.status === 'APPROVED' ? 'Validado' : a.status === 'PENDING' ? 'Pendiente de dictamen' : 'Rechazado'],
        ['EVIDENCIA', a.evidenceUrl || 'Sin evidencia adjunta'],
      ];
    }
    const p = modal.item;
    return [
      ['ESTUDIANTE', p.student?.publicName || 'Sin asignar'],
      ['EVENTO', p.event?.title || 'Sin asignar'],
      ['ROL DESEMPEÑADO', participationTypeLabels[p.type] || p.type],
      ['RESULTADO', p.result || 'Sin resultado registrado'],
      ['FECHA', p.date ? new Date(p.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin registrar'],
      ['ESTADO', p.status === 'APPROVED' ? 'Acreditado' : p.status === 'PENDING' ? 'Pendiente de dictamen' : 'Rechazado'],
    ];
  };
  const modalStatus = () => {
    if (!modal) return '';
    if (modal.kind === 'student') return modal.item.academicStatus || 'Sin registrar';
    if (modal.kind === 'achievement') return modal.item.status === 'APPROVED' ? 'VALIDADO' : modal.item.status === 'PENDING' ? 'PENDIENTE DE DICTAMEN' : 'RECHAZADO';
    return modal.item.status === 'APPROVED' ? 'ACREDITADO' : modal.item.status === 'PENDING' ? 'PENDIENTE DE DICTAMEN' : 'RECHAZADO';
  };
  const modalTitle = () => {
    if (!modal) return '';
    if (modal.kind === 'student') return modal.item.publicName;
    if (modal.kind === 'achievement') return modal.item.title;
    return `${modal.item.student?.publicName || 'Estudiante'} — ${modal.item.event?.title || 'Evento'}`;
  };

  return (
    <main className="w-full pt-20 bg-surface flex-1">
      <div className="flex flex-col w-full">
        {/* Toast Floating Notification Center */}
        <div className="fixed top-24 right-6 z-50 flex flex-col gap-space-sm pointer-events-none">
          {toasts.map((t) => <Toast key={t.id} toast={t} onClose={dismissToast} />)}
        </div>
        {/* Modal Backdrop for Student Form & Detail Views */}
        {modal && (
          <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-gutter transition-all duration-300">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl max-w-2xl w-full p-space-lg shadow-2xl relative">
              <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/20">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[24px]">verified_user</span>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">Expediente Digital Auditado</h4>
                    <p className="font-code-badge text-code-badge text-on-surface-variant">CONAIC VALIDATION SUITE • REGISTRO ACTIVO</p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors" onClick={() => setModal(null)}>
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="py-space-md flex flex-col gap-space-md font-body-md text-body-md text-on-surface-variant">
                <div className="grid grid-cols-2 gap-space-md">
                  <div className="bg-surface-container p-space-sm rounded-lg">
                    <span className="font-code-badge text-code-badge text-secondary block">REGISTRO DEL EXPEDIENTE</span>
                    <span className="font-code-badge text-[12px] text-on-surface select-all">{modalTitle()}</span>
                  </div>
                  <div className="bg-surface-container p-space-sm rounded-lg">
                    <span className="font-code-badge text-code-badge text-tertiary block">ESTADO DEL REGISTRO</span>
                    <span className="font-label-md text-label-md text-tertiary flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" /> {modalStatus()}
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container p-space-sm rounded-lg flex flex-col gap-1">
                  {modalRows().map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-space-md py-0.5">
                      <span className="font-code-badge text-code-badge text-on-surface-variant shrink-0">{k}</span>
                      <span className="font-body-md text-body-md text-on-surface text-right">{v}</span>
                    </div>
                  ))}
                </div>
                {(modal.item.bio || modal.item.description) && (
                  <p className="leading-relaxed">{modal.item.bio || modal.item.description}</p>
                )}
                {modal.kind === 'achievement' && modal.item.evidenceUrl && (
                  <a className="font-code-badge text-[11px] text-secondary hover:underline flex items-center gap-0.5" href={modal.item.evidenceUrl} target="_blank" rel="noreferrer">
                    <span className="material-symbols-outlined text-[14px]">attachment</span> Ver evidencia adjunta
                  </a>
                )}
                <p className="leading-relaxed">Expediente consultado desde el padrón institucional de la Licenciatura en Informática (UES Ixtlahuaca).</p>
                <div className="flex items-center gap-space-sm justify-end pt-space-sm">
                  <button className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" onClick={() => setModal(null)}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Root Hero & Administrative Header */}
        <section className="relative w-full px-gutter lg:px-margin pt-space-md pb-space-lg overflow-hidden border-b border-outline-variant/20">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
          {/* Audit Breadcrumb & Telemetry Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm pb-space-md">
            <div className="flex items-center flex-wrap gap-space-xs font-code-badge text-code-badge text-on-surface-variant">
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-semibold">MOD-07</span>
              <span className="text-outline">::</span>
              <span className="tracking-wider uppercase">Panel de Administración y Control de Calidad</span>
              <span className="text-outline">//</span>
              <span className="text-primary font-semibold">CONAIC ROOT LEVEL 2025</span>
            </div>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-low max-w-fit shadow-inner">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="font-code-badge text-code-badge text-tertiary font-bold tracking-wide">SISTEMA SEGURO // TLS 1.3 // SESIÓN CONAIC ROOT</span>
            </div>
          </div>
          {/* Title & Admin Session Info */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-center pt-space-xs">
            <div className="xl:col-span-8 flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[36px] text-secondary">admin_panel_settings</span>
                <h1 className="font-headline-xl text-headline-xl font-extrabold text-on-surface tracking-tight">
                  Panel de Administración &amp; Gobierno Académico
                </h1>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                Gestión centralizada de postulaciones, validación curricular SATCA/CONAIC y auditoría de talento de la Licenciatura en Informática (UES Ixtlahuaca).
              </p>
              <p className="font-code-badge text-code-badge text-on-surface-variant">Sesión como {user?.name} ({user?.role}). Solo ADMIN puede aprobar o rechazar.</p>
            </div>
            {/* Root Administrator Profile Widget */}
            <div className="xl:col-span-4 flex items-center justify-start xl:justify-end">
              <div className="bg-surface-container/70 backdrop-blur-xl border border-secondary/20 rounded-xl p-space-md shadow-xl flex items-center gap-space-md w-full sm:w-auto">
                <div className="relative shrink-0">
                  <img className="w-14 h-14 rounded-full object-cover border-2 border-secondary shadow-[0_0_15px_rgba(93,230,255,0.4)]" alt="Retrato de perfil del administrador académico" src={ADMIN_PORTRAIT} />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-tertiary border-2 border-surface" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-title-md text-title-md font-bold text-on-surface truncate">{user?.name || 'Admin CONAIC'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-code-badge bg-primary/20 text-primary font-bold">{user?.role || 'ROOT'}</span>
                  </div>
                  <span className="font-code-badge text-code-badge text-secondary truncate">{user?.email || 'coordinacion.conaic@umb.mx'}</span>
                  <div className="flex items-center gap-space-xs mt-1">
                    <button className="font-code-badge text-[10px] text-tertiary hover:underline flex items-center gap-0.5" onClick={() => { load(); pushToast('info', 'Sesión resincronizada con el repositorio central UMB.'); }}>
                      <span className="material-symbols-outlined text-[12px]">sync</span> Sincronizado
                    </button>
                    <span className="text-outline text-[10px]">•</span>
                    <button className="font-code-badge text-[10px] text-error hover:underline flex items-center gap-0.5" onClick={handleLogout}>
                      <span className="material-symbols-outlined text-[12px]">logout</span> Salir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Live Operational KPIs & Metric Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mt-space-lg">
            {/* KPI 1 */}
            <TiltCard className="bg-surface-container/60 stat-card-glow-1 hover:bg-surface-container/90 transition-[background-color,border-color,box-shadow] duration-300 p-space-md rounded-xl border border-white/5 shadow-md flex items-center justify-between group cursor-default">
              <div className="flex flex-col">
                <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Estudiantes Registrados</span>
                <span className="font-display-lg text-[36px] font-black text-on-surface mt-1 group-hover:text-primary transition-colors"><CountUp target={students.length} /></span>
                <span className="font-code-badge text-[11px] text-tertiary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">trending_up</span> Padrón institucional activo
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <span className="material-symbols-outlined text-[26px] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_currentColor]">school</span>
              </div>
            </TiltCard>
            {/* KPI 2 */}
            <TiltCard className="bg-surface-container/60 stat-card-glow-2 hover:bg-surface-container/90 transition-[background-color,border-color,box-shadow] duration-300 p-space-md rounded-xl border border-white/5 shadow-md flex items-center justify-between group cursor-default">
              <div className="flex flex-col">
                <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Eventos Auditados</span>
                <span className="font-display-lg text-[36px] font-black text-on-surface mt-1 group-hover:text-secondary transition-colors"><CountUp target={events.length} /></span>
                <span className="font-code-badge text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">done_all</span> Agenda institucional UMB
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <span className="material-symbols-outlined text-[26px] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_currentColor]">event_available</span>
              </div>
            </TiltCard>
            {/* KPI 3 */}
            <TiltCard className="bg-surface-container/60 stat-card-glow-3 hover:bg-surface-container/90 transition-[background-color,border-color,box-shadow] duration-300 p-space-md rounded-xl border border-white/5 shadow-md flex items-center justify-between group cursor-default">
              <div className="flex flex-col">
                <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Logros Acreditados</span>
                <span className="font-display-lg text-[36px] font-black text-on-surface mt-1 group-hover:text-tertiary transition-colors"><CountUp target={achievements.length} /></span>
                <span className="font-code-badge text-[11px] text-tertiary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">workspace_premium</span> Validados y publicados
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <span className="material-symbols-outlined text-[26px] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_currentColor]">military_tech</span>
              </div>
            </TiltCard>
            {/* KPI 4 */}
            <TiltCard className="bg-surface-container/60 stat-card-glow-4 hover:bg-surface-container/90 transition-[background-color,border-color,box-shadow] duration-300 p-space-md rounded-xl border border-white/5 shadow-md flex items-center justify-between group cursor-default">
              <div className="flex flex-col">
                <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider">Solicitudes Pendientes</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display-lg text-[36px] font-black text-error"><CountUp target={pendingTotal} /></span>
                  {pendingTotal > 0 && <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />}
                </div>
                <span className="font-code-badge text-[11px] text-error flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">warning</span> Requieren dictamen
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center text-error transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <span className="material-symbols-outlined text-[26px] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_currentColor]">notifications_active</span>
              </div>
            </TiltCard>
          </div>
        </section>
        {/* Interactive Control Strip: Section Tabs (el buscador global vive solo en el Navbar) */}
        <section className="sticky top-20 z-40 bg-surface/90 backdrop-blur-xl px-gutter lg:px-margin py-space-sm border-b border-outline-variant/20">
          <div className="flex items-center justify-start">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {tabBtn('aprobaciones', 'verified', 'Aprobación y Validación', `${pendingTotal} Pendientes`, 'bg-error/20 text-error border border-error/30 animate-pulse')}
              {tabBtn('estudiantes', 'group', 'Estudiantes', String(students.length), 'bg-primary/20 text-primary')}
              {tabBtn('eventos', 'terminal', 'Eventos y Hackathons', String(events.length), 'bg-secondary/20 text-secondary')}
              {tabBtn('logros', 'emoji_events', 'Logros y Distinciones', String(achievements.length), 'bg-tertiary/20 text-tertiary')}
              {tabBtn('participaciones', 'diversity_3', 'Participaciones y Premios', String(participations.length), 'bg-primary-container/20 text-primary-container')}
              {tabBtn('multimedia', 'photo_library', 'Multimedia', String(media.length), 'bg-secondary/20 text-secondary')}
              {user?.role === 'ADMIN' && tabBtn('usuarios', 'manage_accounts', 'Usuarios', String(users.length), 'bg-tertiary/20 text-tertiary')}
              {user?.role === 'ADMIN' && tabBtn('evaluaciones', 'grading', 'Evaluaciones', String(evaluations.length), 'bg-amber-400/20 text-amber-300')}
            </div>
          </div>
        </section>

        {/* Main Administrative Tab Panes */}
        <div className="w-full px-gutter lg:px-margin py-space-lg flex-1">
          {/* TAB 1: Aprobación y Validación (Default Active) */}
          {tab === 'aprobaciones' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container/50 border border-white/5 p-space-md rounded-xl backdrop-blur-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-3 h-3 rounded-full bg-error animate-ping" />
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Bandeja de Dictaminación en Espera</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Revisión de certificados probatorios y validación de méritos para emisión de sello digital CONAIC.</p>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 rounded-lg bg-tertiary-container/30 border border-tertiary/40 text-tertiary font-label-md text-label-md hover:bg-tertiary-container/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1" onClick={approveAll} disabled={pendingTotal === 0}>
                    <span className="material-symbols-outlined text-[16px]">done_all</span> Aprobar Todos los Validados
                  </button>
                </div>
              </div>
              {pendingErr && (
                <div className="bg-error/10 border border-error/40 rounded-xl p-space-md flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-error text-[20px]">error</span>
                  <span className="font-body-md text-body-md text-on-surface">{pendingErr}</span>
                </div>
              )}
              {/* Pending Approval Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
                {pending.achievements.map((a, idx) => {
                  const s = a.student || {};
                  const photo = s.photoUrl || s.avatarUrl;
                  return (
                    <TiltCard key={`ach-${a.id}`} style={{ transitionDelay: `${idx * 60}ms` }} className={`bg-surface-container/70 border border-white/10 hover:border-secondary/40 rounded-xl p-space-md flex flex-col justify-between transition-[opacity,border-color,box-shadow] duration-500 shadow-lg group ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex flex-col gap-space-sm">
                        <div className="flex items-start justify-between">
                          <span className="px-2 py-0.5 rounded font-code-badge text-code-badge bg-secondary/15 text-secondary border border-secondary/30 font-semibold">LOGRO • PENDIENTE</span>
                          <span className="font-code-badge text-[11px] text-outline">{timeAgo(a.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-space-sm">
                          {photo ? (
                            <img className="w-12 h-12 rounded-lg object-cover border border-outline-variant/30" alt={`Foto de ${s.publicName}`} src={photo} />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center font-bold border border-outline-variant/30">{initialsOf(s.publicName)}</div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-title-md text-title-md font-bold text-on-surface">{s.publicName || 'Sin asignar'}</span>
                            <span className="font-code-badge text-code-badge text-on-surface-variant">Categoría: {a.category}</span>
                          </div>
                        </div>
                        <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                          <span className="font-label-md text-label-md text-secondary font-semibold">{a.title}</span>
                          <p className="font-body-md text-[13px] text-on-surface-variant line-clamp-2">{a.description || 'Sin descripción.'}</p>
                          <div className="flex items-center justify-between pt-1">
                            {a.evidenceUrl ? (
                              <a className="font-code-badge text-[11px] text-secondary hover:underline flex items-center gap-0.5" href={a.evidenceUrl} target="_blank" rel="noreferrer">
                                <span className="material-symbols-outlined text-[14px]">attachment</span> Ver evidencia
                              </a>
                            ) : (
                              <button className="font-code-badge text-[11px] text-secondary hover:underline flex items-center gap-0.5" onClick={() => setModal({ kind: 'achievement', item: a })}>
                                <span className="material-symbols-outlined text-[14px]">visibility</span> Ver expediente
                              </button>
                            )}
                            <span className="font-code-badge text-[11px] text-tertiary">Estado: Pendiente</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm pt-space-md mt-space-sm border-t border-outline-variant/20">
                        <button className="flex-1 py-2 px-space-sm rounded-lg bg-tertiary/20 hover:bg-tertiary/30 hover:scale-[1.02] active:scale-[0.98] text-tertiary border border-tertiary/40 font-label-md text-label-md font-bold flex items-center justify-center gap-1 transition-all shadow-[0_0_15px_rgba(69,223,164,0.15)]" onClick={() => approve('achievement', a.id)}>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span> Aprobar y Certificar
                        </button>
                        <button className="py-2 px-3 rounded-lg bg-error/15 hover:bg-error/25 text-error border border-error/30 font-label-md text-label-md transition-all" onClick={() => reject('achievement', a.id)} aria-label="Rechazar">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </TiltCard>
                  );
                })}
                {pending.participations.map((p, idx) => {
                  const s = p.student || {};
                  const photo = s.photoUrl || s.avatarUrl;
                  return (
                    <TiltCard key={`part-${p.id}`} style={{ transitionDelay: `${(pending.achievements.length + idx) * 60}ms` }} className={`bg-surface-container/70 border border-white/10 hover:border-secondary/40 rounded-xl p-space-md flex flex-col justify-between transition-[opacity,border-color,box-shadow] duration-500 shadow-lg group ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex flex-col gap-space-sm">
                        <div className="flex items-start justify-between">
                          <span className="px-2 py-0.5 rounded font-code-badge text-code-badge bg-primary/15 text-primary border border-primary/30 font-semibold">PARTICIPACIÓN • PENDIENTE</span>
                          <span className="font-code-badge text-[11px] text-outline">{timeAgo(p.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-space-sm">
                          {photo ? (
                            <img className="w-12 h-12 rounded-lg object-cover border border-outline-variant/30" alt={`Foto de ${s.publicName}`} src={photo} />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold border border-outline-variant/30">{initialsOf(s.publicName)}</div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-title-md text-title-md font-bold text-on-surface">{s.publicName || 'Sin asignar'}</span>
                            <span className="font-code-badge text-code-badge text-on-surface-variant">{p.event?.title || 'Evento sin asignar'}</span>
                          </div>
                        </div>
                        <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                          <span className="font-label-md text-label-md text-primary font-semibold">Participación: {participationTypeLabels[p.type] || p.type}</span>
                          <p className="font-body-md text-[13px] text-on-surface-variant line-clamp-2">{p.description || (p.result ? `Resultado: ${p.result}` : 'Sin descripción.')}</p>
                          <div className="flex items-center justify-between pt-1">
                            {p.evidenceUrl ? (
                              <a className="font-code-badge text-[11px] text-primary hover:underline flex items-center gap-0.5" href={p.evidenceUrl} target="_blank" rel="noreferrer">
                                <span className="material-symbols-outlined text-[14px]">attachment</span> Ver evidencia
                              </a>
                            ) : (
                              <button className="font-code-badge text-[11px] text-primary hover:underline flex items-center gap-0.5" onClick={() => setModal({ kind: 'participation', item: p })}>
                                <span className="material-symbols-outlined text-[14px]">visibility</span> Ver expediente
                              </button>
                            )}
                            <span className="font-code-badge text-[11px] text-tertiary">Estado: Pendiente</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm pt-space-md mt-space-sm border-t border-outline-variant/20">
                        <button className="flex-1 py-2 px-space-sm rounded-lg bg-tertiary/20 hover:bg-tertiary/30 hover:scale-[1.02] active:scale-[0.98] text-tertiary border border-tertiary/40 font-label-md text-label-md font-bold flex items-center justify-center gap-1 transition-all shadow-[0_0_15px_rgba(69,223,164,0.15)]" onClick={() => approve('participation', p.id)}>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span> Aprobar y Certificar
                        </button>
                        <button className="py-2 px-3 rounded-lg bg-error/15 hover:bg-error/25 text-error border border-error/30 font-label-md text-label-md transition-all" onClick={() => reject('participation', p.id)} aria-label="Rechazar">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </TiltCard>
                  );
                })}
              </div>
              {pendingTotal === 0 && !pendingErr && (
                <div className="bg-surface-container/70 border border-white/10 rounded-xl p-space-lg flex flex-col items-center gap-space-sm text-center">
                  <span className="material-symbols-outlined text-tertiary text-[36px]">verified</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Sin solicitudes pendientes de dictamen</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Todos los logros y participaciones registrados ya cuentan con dictamen.</p>
                </div>
              )}
            </div>
          )}
          {/* TAB 2: Estudiantes & Padrón */}
          {tab === 'estudiantes' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Students Directory Table (8 Cols) */}
                <div className="xl:col-span-8 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Padrón de Estudiantes Acreditados</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">Licenciatura en Informática • Sistema de Mérito UMB</p>
                    </div>
                    <span className="font-code-badge text-code-badge text-secondary bg-secondary/10 px-space-sm py-1 rounded border border-secondary/20">Total: {students.length} Alumnos</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 font-code-badge text-code-badge text-on-surface-variant">
                          <th className="py-space-sm px-space-xs">ESTUDIANTE</th>
                          <th className="py-space-sm px-space-xs">SEMESTRE</th>
                          <th className="py-space-sm px-space-xs">GENERACIÓN</th>
                          <th className="py-space-sm px-space-xs">ESTADO</th>
                          <th className="py-space-sm px-space-xs text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md">
                        {students.map((s, i) => (
                          <tr key={s.id} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-sm px-space-xs flex items-center gap-space-xs">
                              {(s.photoUrl || s.avatarUrl) ? (
                                <img className="w-8 h-8 rounded-full object-cover shrink-0" alt={`Foto de ${s.publicName}`} src={s.photoUrl || s.avatarUrl} />
                              ) : (
                                <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-bold text-xs shrink-0`}>{initialsOf(s.publicName)}</div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">{s.publicName}</span>
                                <span className="font-code-badge text-[11px] text-outline">{(s.skills || []).slice(0, 3).join(' • ') || 'Sin habilidades registradas'}</span>
                              </div>
                            </td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{s.semester != null ? `${s.semester}° Semestre` : 'Sin asignar'}</td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge text-secondary">{s.generation || '—'}</td>
                            <td className="py-space-sm px-space-xs">
                              <span className="inline-flex items-center gap-1 font-code-badge text-[11px] text-tertiary">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> {s.academicStatus || 'Sin registrar'}
                              </span>
                            </td>
                            <td className="py-space-sm px-space-xs text-right">
                              <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-secondary" onClick={() => setModal({ kind: 'student', item: s })} aria-label="Ver expediente"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                              <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-primary" onClick={() => startEditStudent(s)} aria-label="Editar"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                              {user?.role === 'ADMIN' && (
                                <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-error" onClick={() => removeStudent(s)} aria-label="Eliminar"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {students.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant py-space-md text-center">Sin estudiantes registrados.</p>}
                  </div>
                </div>
                {/* Student Registration Form (4 Cols) */}
                <TiltCard max={6} scale={1.01} className="xl:col-span-4 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[22px]">person_add</span>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">{editingStudentId ? 'Editar Estudiante' : 'Registrar Estudiante'}</h3>
                  </div>
                  <form className="flex flex-col gap-space-sm" onSubmit={saveStudent}>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>NOMBRE COMPLETO</label>
                      <input className={fieldCls} placeholder="Ej. Ana Lucía Domínguez" required type="text" value={studentForm.publicName} onChange={(e) => setStudentForm({ ...studentForm, publicName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>SEMESTRE</label>
                        <select className={fieldCls} value={studentForm.semester} onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}>
                          <option value="">Sin asignar</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}° Semestre</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>GENERACIÓN</label>
                        <input className={fieldCls} placeholder="2023-2027" type="text" value={studentForm.generation} onChange={(e) => setStudentForm({ ...studentForm, generation: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>ESTADO ACADÉMICO</label>
                      <select className={fieldCls} value={studentForm.academicStatus} onChange={(e) => setStudentForm({ ...studentForm, academicStatus: e.target.value })}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Egresado">Egresado</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>PRESENTACIÓN PERSONAL</label>
                      <textarea className={fieldCls} placeholder="Trayectoria, intereses académicos y enfoque profesional..." rows="3" value={studentForm.bio} onChange={(e) => setStudentForm({ ...studentForm, bio: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>INTERESES (SEPARADOS POR COMA)</label>
                      <input className={fieldCls} placeholder="Ej. Ciberseguridad, IA, Cloud" type="text" value={studentForm.interests} onChange={(e) => setStudentForm({ ...studentForm, interests: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>HABILIDADES (SEPARADAS POR COMA)</label>
                      <input className={fieldCls} placeholder="Ej. React, Python, Redes" type="text" value={studentForm.skills} onChange={(e) => setStudentForm({ ...studentForm, skills: e.target.value })} />
                    </div>
                    <label className="font-body-md text-body-md text-on-surface-variant flex gap-2 items-center">
                      <input type="checkbox" checked={studentForm.consentToPublish} onChange={(e) => setStudentForm({ ...studentForm, consentToPublish: e.target.checked })} /> Autorización para publicar
                    </label>
                    <button className={submitCls} type="submit">
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span> {editingStudentId ? 'Guardar Cambios' : 'Registrar en el Padrón'}
                    </button>
                    {editingStudentId && (
                      <button className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" type="button" onClick={() => { setEditingStudentId(null); setStudentForm(emptyStudent); }}>
                        Cancelar edición
                      </button>
                    )}
                  </form>
                </TiltCard>
              </div>
            </div>
          )}

          {/* TAB 3: Eventos y Hackathons */}
          {tab === 'eventos' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Events List (8 Cols) */}
                <div className="xl:col-span-8 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Eventos y Simposios Registrados</h3>
                    <span className="font-code-badge text-code-badge text-secondary bg-secondary/10 px-space-sm py-1 rounded">{events.length} Eventos Registrados</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {events.map((ev) => {
                      const meta = eventStatusMeta[ev.status] || eventStatusMeta.UPCOMING;
                      return (
                        <TiltCard key={ev.id} className="bg-surface-container/70 border border-white/10 hover:border-secondary/40 rounded-xl p-space-md flex flex-col justify-between shadow-lg transition-[border-color,box-shadow] duration-300">
                          <div className="flex flex-col gap-space-xs">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded font-code-badge text-code-badge font-bold ${meta.cls}`}>{meta.label}</span>
                              <span className="font-code-badge text-[11px] text-outline">{ev.date ? new Date(ev.date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : 'Sin fecha'}</span>
                            </div>
                            <h4 className="font-title-md text-title-md font-bold text-on-surface">{ev.title}</h4>
                            <p className="font-body-md text-[13px] text-on-surface-variant">{ev.description || 'Sin descripción.'}</p>
                            <div className="flex flex-col gap-1 font-code-badge text-[11px] text-on-surface-variant pt-2">
                              <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-secondary">location_on</span> {ev.place || 'Sede por confirmar'}{ev.time ? ` • ${ev.time}` : ''}</div>
                              <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-primary">groups</span> {ev.organizer || 'Organizador por confirmar'}{ev.category ? ` • ${ev.category}` : ''}</div>
                            </div>
                          </div>
                          <div className="pt-space-md mt-space-sm border-t border-outline-variant/10 flex items-center justify-between">
                            <span className="font-code-badge text-[10px] text-outline">MOD: {ev.modality || 'Por definir'}</span>
                            <div className="flex items-center gap-1">
                              <button className="font-code-badge text-code-badge text-secondary hover:underline flex items-center gap-0.5" onClick={() => startEditEvent(ev)}>
                                Editar <span className="material-symbols-outlined text-[12px]">edit</span>
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button className="font-code-badge text-code-badge text-error hover:underline flex items-center gap-0.5" onClick={() => removeEvent(ev)}>
                                  Eliminar <span className="material-symbols-outlined text-[12px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </TiltCard>
                      );
                    })}
                  </div>
                  {events.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant py-space-md text-center">Sin eventos registrados.</p>}
                </div>
                {/* Event Registration Form (4 Cols) */}
                <TiltCard max={6} scale={1.01} className="xl:col-span-4 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[22px]">calendar_add_on</span>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">{editingEventId ? 'Editar Evento Institucional' : 'Registrar Evento Institucional'}</h3>
                  </div>
                  <form className="flex flex-col gap-space-sm" onSubmit={saveEvent}>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>TÍTULO DEL EVENTO</label>
                      <input className={fieldCls} placeholder="Ej. Datathon de Modelado Predictivo" required type="text" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>FECHA Y HORA</label>
                        <input className={fieldCls} required type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>MODALIDAD</label>
                        <select className={fieldCls} value={eventForm.modality} onChange={(e) => setEventForm({ ...eventForm, modality: e.target.value })}>
                          <option value="Presencial">Presencial</option>
                          <option value="Virtual">Virtual</option>
                          <option value="Híbrida">Híbrida</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>CATEGORÍA</label>
                        <select className={fieldCls} value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
                          <option value="Hackathon">Hackathon</option>
                          <option value="Simposio">Simposio</option>
                          <option value="Certamen">Certamen</option>
                          <option value="Taller">Taller</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>SEDE / LUGAR</label>
                        <input className={fieldCls} placeholder="Auditorio B / Online" required type="text" value={eventForm.place} onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>HORARIO</label>
                        <input className={fieldCls} placeholder="10:00 - 18:00" type="text" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>ESTADO</label>
                        <select className={fieldCls} value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}>
                          <option value="UPCOMING">Próximo</option>
                          <option value="COMPLETED">Realizado</option>
                          <option value="CANCELLED">Cancelado</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>ORGANIZADOR</label>
                      <input className={fieldCls} placeholder="Coordinación de la Licenciatura" type="text" value={eventForm.organizer} onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>IMAGEN REPRESENTATIVA (URL)</label>
                      <input className={fieldCls} placeholder="https://... o /images/eventos/..." type="text" value={eventForm.imageUrl} onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>DESCRIPCIÓN OPERATIVA</label>
                      <textarea className={fieldCls} placeholder="Objetivos académicos, alcance SATCA y competencias técnicas..." required rows="3" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                    </div>
                    <button className={submitCls} type="submit">
                      <span className="material-symbols-outlined text-[18px]">campaign</span> {editingEventId ? 'Guardar Cambios' : 'Publicar en Agenda'}
                    </button>
                    {editingEventId && (
                      <button className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" type="button" onClick={() => { setEditingEventId(null); setEventForm(emptyEvent); }}>
                        Cancelar edición
                      </button>
                    )}
                  </form>
                </TiltCard>
              </div>
            </div>
          )}
          {/* TAB 4: Logros y Distinciones */}
          {tab === 'logros' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Achievements Table (8 Cols) */}
                <div className="xl:col-span-8 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Catálogo de Distinciones y Reconocimientos</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">Registro avalado ante la Dirección de Carrera y CONAIC</p>
                    </div>
                    <span className="font-code-badge text-code-badge text-tertiary bg-tertiary/10 px-space-sm py-1 rounded">{achievements.length} Acreditados</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 font-code-badge text-code-badge text-on-surface-variant">
                          <th className="py-space-sm px-space-xs">ESTUDIANTE</th>
                          <th className="py-space-sm px-space-xs">TÍTULO DEL LOGRO</th>
                          <th className="py-space-sm px-space-xs">CATEGORÍA</th>
                          <th className="py-space-sm px-space-xs">INSTITUCIÓN</th>
                          <th className="py-space-sm px-space-xs">FECHA</th>
                          <th className="py-space-sm px-space-xs">ESTADO</th>
                          <th className="py-space-sm px-space-xs text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md">
                        {achievements.map((a) => (
                          <tr key={a.id} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-sm px-space-xs font-semibold text-on-surface">{a.student?.publicName || 'Sin asignar'}</td>
                            <td className="py-space-sm px-space-xs">
                              <span className="font-bold text-secondary">{a.title}</span>
                              {a.description && <span className="block font-code-badge text-[11px] text-on-surface-variant">{a.description}</span>}
                            </td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{a.category}</td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{a.institution || '—'}</td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{a.date ? new Date(a.date).toLocaleDateString('es-MX') : '—'}</td>
                            <td className="py-space-sm px-space-xs">
                              <span className="px-2 py-0.5 rounded font-code-badge text-[11px] bg-tertiary/15 text-tertiary font-semibold">Validado</span>
                            </td>
                            <td className="py-space-sm px-space-xs text-right">
                              <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-secondary" onClick={() => setModal({ kind: 'achievement', item: a })} aria-label="Ver expediente"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                              <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-primary" onClick={() => startEditAchievement(a)} aria-label="Editar"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                              {user?.role === 'ADMIN' && (
                                <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-error" onClick={() => removeAchievement(a)} aria-label="Eliminar"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {achievements.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant py-space-md text-center">Sin logros acreditados.</p>}
                  </div>
                </div>
                {/* Achievement Registration Form (4 Cols) */}
                <TiltCard max={6} scale={1.01} className="xl:col-span-4 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[22px]">military_tech</span>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">{editingAchievementId ? 'Editar Logro Institucional' : 'Registrar Logro Institucional'}</h3>
                  </div>
                  <form className="flex flex-col gap-space-sm" onSubmit={saveAchievement}>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>ESTUDIANTE GALARDONADO</label>
                      <select className={fieldCls} required value={achievementForm.studentId} onChange={(e) => setAchievementForm({ ...achievementForm, studentId: e.target.value })}>
                        <option value="">Selecciona un estudiante *</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.publicName}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>TÍTULO DE LA DISTINCIÓN</label>
                      <input className={fieldCls} placeholder="Ej. Campeón Regional Hackathon IoT 2025" required type="text" value={achievementForm.title} onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>CATEGORÍA</label>
                        <select className={fieldCls} value={achievementForm.category} onChange={(e) => setAchievementForm({ ...achievementForm, category: e.target.value })}>
                          {['Académico', 'Concurso', 'Investigación', 'Innovación', 'Certificación'].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>FECHA ADJUDICACIÓN</label>
                        <input className={fieldCls} required type="date" value={achievementForm.date} onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>INSTITUCIÓN / CONCURSO RELACIONADO</label>
                      <input className={fieldCls} placeholder="Ej. CONAIC, IEEE, OMI" type="text" value={achievementForm.institution} onChange={(e) => setAchievementForm({ ...achievementForm, institution: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>DESCRIPCIÓN</label>
                      <textarea className={fieldCls} placeholder="Descripción breve del logro..." rows="3" value={achievementForm.description} onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>EVIDENCIA (URL)</label>
                      <input className={fieldCls} placeholder="URL de imagen, video o enlace" type="text" value={achievementForm.evidenceUrl} onChange={(e) => setAchievementForm({ ...achievementForm, evidenceUrl: e.target.value })} />
                    </div>
                    <button className={submitCls} type="submit">
                      <span className="material-symbols-outlined text-[18px]">verified</span> {editingAchievementId ? 'Guardar Cambios' : 'Registrar Logro'}
                    </button>
                    {editingAchievementId && (
                      <button className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" type="button" onClick={() => { setEditingAchievementId(null); setAchievementForm(emptyAchievement); }}>
                        Cancelar edición
                      </button>
                    )}
                  </form>
                </TiltCard>
              </div>
            </div>
          )}
          {/* TAB 5: Participaciones y Premios */}
          {tab === 'participaciones' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Participations Table (8 Cols) */}
                <div className="xl:col-span-8 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Historial de Participaciones y Desempeño</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">Seguimiento de comitivas en certámenes tecnológicos interinstitucionales</p>
                    </div>
                    <span className="font-code-badge text-code-badge text-primary-container bg-primary-container/10 px-space-sm py-1 rounded">{participations.length} Registros</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 font-code-badge text-code-badge text-on-surface-variant">
                          <th className="py-space-sm px-space-xs">ESTUDIANTE</th>
                          <th className="py-space-sm px-space-xs">EVENTO ASOCIADO</th>
                          <th className="py-space-sm px-space-xs">ROL ASIGNADO</th>
                          <th className="py-space-sm px-space-xs">RESULTADO</th>
                          <th className="py-space-sm px-space-xs">ESTADO</th>
                          <th className="py-space-sm px-space-xs text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md">
                        {participations.map((p) => (
                          <tr key={p.id} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-sm px-space-xs font-semibold text-on-surface">
                              <button className="hover:text-secondary hover:underline text-left" onClick={() => setModal({ kind: 'participation', item: p })}>{p.student?.publicName || 'Sin asignar'}</button>
                            </td>
                            <td className="py-space-sm px-space-xs">{p.event?.title || 'Sin asignar'}</td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge text-secondary">{participationTypeLabels[p.type] || p.type}</td>
                            <td className="py-space-sm px-space-xs">
                              <span className="font-bold text-tertiary">{p.result || '—'}</span>
                            </td>
                            <td className="py-space-sm px-space-xs">
                              <span className={`px-2 py-0.5 rounded font-code-badge text-[11px] ${p.status === 'APPROVED' ? 'bg-tertiary/15 text-tertiary' : p.status === 'PENDING' ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error'}`}>
                                {p.status === 'APPROVED' ? 'Acreditado' : p.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                              </span>
                            </td>
                            <td className="py-space-sm px-space-xs text-right">
                              <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-primary" onClick={() => startEditParticipation(p)} aria-label="Editar"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                              {user?.role === 'ADMIN' && (
                                <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-error" onClick={() => removeParticipation(p)} aria-label="Eliminar"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {participations.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant py-space-md text-center">Sin participaciones registradas.</p>}
                  </div>
                </div>
                {/* Participation Registration Form (4 Cols) */}
                <TiltCard max={6} scale={1.01} className="xl:col-span-4 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[22px]">assignment_turned_in</span>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">{editingParticipationId ? 'Editar Participación' : 'Registrar Participación'}</h3>
                  </div>
                  <form className="flex flex-col gap-space-sm" onSubmit={saveParticipation}>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>ESTUDIANTE</label>
                      <select className={fieldCls} required value={participationForm.studentId} onChange={(e) => setParticipationForm({ ...participationForm, studentId: e.target.value })}>
                        <option value="">Selecciona un estudiante *</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.publicName}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>EVENTO ASOCIADO</label>
                      <select className={fieldCls} required value={participationForm.eventId} onChange={(e) => setParticipationForm({ ...participationForm, eventId: e.target.value })}>
                        <option value="">Selecciona un evento *</option>
                        {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>ROL DESEMPEÑADO</label>
                        <select className={fieldCls} value={participationForm.type} onChange={(e) => setParticipationForm({ ...participationForm, type: e.target.value })}>
                          {Object.entries(participationTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>RESULTADO ACREDITADO</label>
                        <select className={fieldCls} value={participationForm.result} onChange={(e) => setParticipationForm({ ...participationForm, result: e.target.value })}>
                          <option value="">Sin resultado</option>
                          <option value="1er Lugar">1er Lugar (Oro)</option>
                          <option value="2do Lugar">2do Lugar (Plata)</option>
                          <option value="3er Lugar">3er Lugar (Bronce)</option>
                          <option value="Mención Honorífica">Mención Honorífica</option>
                          <option value="Participación Destacada">Participación Destacada</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>DESCRIPCIÓN DE LA ACTIVIDAD</label>
                      <textarea className={fieldCls} placeholder="Descripción de la actividad desempeñada..." rows="3" value={participationForm.description} onChange={(e) => setParticipationForm({ ...participationForm, description: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>EVIDENCIA (URL)</label>
                      <input className={fieldCls} placeholder="URL de imagen, video o enlace de la evidencia" type="text" value={participationForm.evidenceUrl} onChange={(e) => setParticipationForm({ ...participationForm, evidenceUrl: e.target.value })} />
                    </div>
                    <button className={submitCls} type="submit">
                      <span className="material-symbols-outlined text-[18px]">verified</span> {editingParticipationId ? 'Guardar Cambios' : 'Registrar Participación'}
                    </button>
                    {editingParticipationId && (
                      <button className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" type="button" onClick={() => { setEditingParticipationId(null); setParticipationForm(emptyParticipation); }}>
                        Cancelar edición
                      </button>
                    )}
                  </form>
                </TiltCard>
              </div>
            </div>
          )}
          {/* TAB 6: Multimedia y Galería */}
          {tab === 'multimedia' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Media Catalog Table (8 Cols) */}
                <div className="xl:col-span-8 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Catálogo Multimedia de la Galería</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">Fotos, videos y enlaces publicados en la Galería Multimedia</p>
                    </div>
                    <span className="font-code-badge text-code-badge text-secondary bg-secondary/10 px-space-sm py-1 rounded">{media.length} Elementos</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 font-code-badge text-code-badge text-on-surface-variant">
                          <th className="py-space-sm px-space-xs">MEDIO</th>
                          <th className="py-space-sm px-space-xs">TIPO</th>
                          <th className="py-space-sm px-space-xs">FECHA</th>
                          <th className="py-space-sm px-space-xs">PUBLICADO</th>
                          <th className="py-space-sm px-space-xs text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md">
                        {media.map((m) => (
                          <tr key={m.id} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-sm px-space-xs flex items-center gap-space-xs">
                              {m.type === 'IMAGE' ? (
                                <img className="w-12 h-9 rounded object-cover border border-outline-variant/30 shrink-0" alt={m.title} src={m.url} />
                              ) : (
                                <div className="w-12 h-9 rounded bg-secondary/15 text-secondary flex items-center justify-center border border-outline-variant/30 shrink-0">
                                  <span className="material-symbols-outlined text-[20px]">{m.type === 'VIDEO' ? 'play_circle' : 'link'}</span>
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-on-surface truncate">{m.title}</span>
                                <span className="font-code-badge text-[11px] text-outline truncate">
                                  {m.event?.title || m.student?.publicName || m.achievement?.title || 'Sin asociar'}
                                </span>
                              </div>
                            </td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{m.type === 'IMAGE' ? 'Imagen' : m.type === 'VIDEO' ? 'Video' : 'Enlace'}</td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{m.date ? new Date(m.date).toLocaleDateString('es-MX') : '—'}</td>
                            <td className="py-space-sm px-space-xs">
                              <span className={`px-2 py-0.5 rounded font-code-badge text-[11px] ${m.consentToPublish ? 'bg-tertiary/15 text-tertiary' : 'bg-secondary/15 text-secondary'}`}>
                                {m.consentToPublish ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="py-space-sm px-space-xs text-right">
                              <a className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-secondary inline-block" href={m.url} target="_blank" rel="noreferrer" aria-label="Abrir"><span className="material-symbols-outlined text-[18px]">open_in_new</span></a>
                              {user?.role === 'ADMIN' && (
                                <button className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-error" onClick={() => removeMedia(m)} aria-label="Eliminar"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {media.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant py-space-md text-center">Sin elementos multimedia registrados.</p>}
                  </div>
                </div>
                {/* Media Registration Forms (4 Cols) */}
                <div className="xl:col-span-4 flex flex-col gap-space-lg">
                  <TiltCard max={6} scale={1.01} className="bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[22px]">upload</span>
                      <h3 className="font-title-md text-title-md font-bold text-on-surface">Subir Archivo (Imagen / Video)</h3>
                    </div>
                    <form className="flex flex-col gap-space-sm" onSubmit={uploadMediaFile}>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>TÍTULO</label>
                        <input className={fieldCls} placeholder="Ej. Premiación Certamen LI 2025" required type="text" value={mediaForm.title} onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>ARCHIVO (MÁX. 10 MB)</label>
                        <input className={fieldCls} required type="file" accept="image/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                      </div>
                      <button className={submitCls} type="submit">
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span> Subir y Registrar
                      </button>
                    </form>
                  </TiltCard>
                  <TiltCard max={6} scale={1.01} className="bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[22px]">add_link</span>
                      <h3 className="font-title-md text-title-md font-bold text-on-surface">Registrar Enlace</h3>
                    </div>
                    <form className="flex flex-col gap-space-sm" onSubmit={createMediaLink}>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>TÍTULO</label>
                        <input className={fieldCls} placeholder="Ej. Video de la premiación" required type="text" value={mediaForm.title} onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>URL DEL ENLACE</label>
                        <input className={fieldCls} placeholder="https://youtube.com/..." required type="text" value={mediaForm.url} onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>ASOCIAR A EVENTO (OPCIONAL)</label>
                        <select className={fieldCls} value={mediaForm.eventId} onChange={(e) => setMediaForm({ ...mediaForm, eventId: e.target.value })}>
                          <option value="">Sin asociar</option>
                          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelCls}>ASOCIAR A ESTUDIANTE (OPCIONAL)</label>
                        <select className={fieldCls} value={mediaForm.studentId} onChange={(e) => setMediaForm({ ...mediaForm, studentId: e.target.value })}>
                          <option value="">Sin asociar</option>
                          {students.map((s) => <option key={s.id} value={s.id}>{s.publicName}</option>)}
                        </select>
                      </div>
                      <label className="font-body-md text-body-md text-on-surface-variant flex gap-2 items-center">
                        <input type="checkbox" checked={mediaForm.consentToPublish} onChange={(e) => setMediaForm({ ...mediaForm, consentToPublish: e.target.checked })} /> Autorización para publicar en la galería
                      </label>
                      <button className={submitCls} type="submit">
                        <span className="material-symbols-outlined text-[18px]">link</span> Registrar Enlace
                      </button>
                    </form>
                  </TiltCard>
                </div>
              </div>
            </div>
          )}
          {/* TAB 7: Usuarios (solo ADMIN) */}
          {tab === 'usuarios' && user?.role === 'ADMIN' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Users Table (8 Cols) */}
                <div className="xl:col-span-8 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Usuarios del Portal</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">Cuentas con acceso al portal y sus permisos. No existe eliminación de usuarios en el sistema.</p>
                    </div>
                    <span className="font-code-badge text-code-badge text-tertiary bg-tertiary/10 px-space-sm py-1 rounded">{users.length} Usuarios</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 font-code-badge text-code-badge text-on-surface-variant">
                          <th className="py-space-sm px-space-xs">USUARIO</th>
                          <th className="py-space-sm px-space-xs">EMAIL</th>
                          <th className="py-space-sm px-space-xs">ROL</th>
                          <th className="py-space-sm px-space-xs">REGISTRO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md">
                        {users.map((u, i) => (
                          <tr key={u.id} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-sm px-space-xs flex items-center gap-space-xs">
                              <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-bold text-xs shrink-0`}>{initialsOf(u.name)}</div>
                              <span className="font-semibold text-on-surface">{u.name}</span>
                            </td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{u.email}</td>
                            <td className="py-space-sm px-space-xs">
                              <span className={`px-2 py-0.5 rounded font-code-badge text-[11px] font-semibold ${u.role === 'ADMIN' ? 'bg-error/15 text-error' : u.role === 'CONTENT_MANAGER' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
                                {u.role === 'ADMIN' ? 'Administrador' : u.role === 'CONTENT_MANAGER' ? 'Contenido' : 'Estudiante'}
                              </span>
                            </td>
                            <td className="py-space-sm px-space-xs font-code-badge text-code-badge">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-MX') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {users.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant py-space-md text-center">Sin usuarios registrados.</p>}
                  </div>
                </div>
                {/* User Registration Form (4 Cols) */}
                <TiltCard max={6} scale={1.01} className="xl:col-span-4 bg-surface-container/70 border border-white/10 rounded-xl p-space-md shadow-xl backdrop-blur-xl flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[22px]">person_add</span>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">Crear Usuario</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">Solo un ADMIN puede crear cuentas. El nuevo usuario entra con el rol elegido.</p>
                  <form className="flex flex-col gap-space-sm" onSubmit={createUser}>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>NOMBRE COMPLETO</label>
                      <input className={fieldCls} placeholder="Ej. María González" required type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>EMAIL INSTITUCIONAL</label>
                      <input className={fieldCls} placeholder="usuario@informatica.edu" required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>CONTRASEÑA (MÍN. 8 CARACTERES)</label>
                      <input className={fieldCls} placeholder="••••••••" required minLength={8} type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>ROL</label>
                      <select className={fieldCls} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="CONTENT_MANAGER">Responsable de contenido</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="STUDENT">Estudiante</option>
                        <option value="EVALUATOR">Evaluador del certamen</option>
                      </select>
                    </div>
                    <button className={submitCls} type="submit">
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span> Crear Usuario
                    </button>
                  </form>
                </TiltCard>
              </div>
            </div>
          )}

          {/* TAB 8: Evaluaciones de Certámenes (solo ADMIN, lista de cotejo 4.5) */}
          {tab === 'evaluaciones' && user?.role === 'ADMIN' && (
            <div className="tab-pane flex flex-col gap-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container/50 border border-white/5 p-space-md rounded-xl backdrop-blur-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-300">
                    <span className="material-symbols-outlined text-[22px]">grading</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Evaluaciones de Certámenes</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Consulta restringida al administrador. Las calificaciones no se publican en las vistas del portal.</p>
                  </div>
                </div>
                <span className="font-code-badge text-code-badge text-amber-300 bg-amber-400/10 px-space-sm py-1 rounded">{evaluations.length} Evaluaciones</span>
              </div>
              {evaluations.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter">
                  <div className="p-space-md rounded-xl bg-surface-container/80 shadow-md">
                    <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Promedio general</span>
                    <div className="font-display-lg text-headline-xl font-extrabold text-on-surface">{(evaluations.reduce((a, e) => a + Number(e.score || 0), 0) / evaluations.length).toFixed(1)} / 10</div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container/80 shadow-md">
                    <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Proyectos evaluados</span>
                    <div className="font-display-lg text-headline-xl font-extrabold text-on-surface">{new Set(evaluations.map((e) => e.participationId)).size}</div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container/80 shadow-md">
                    <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Evaluadores activos</span>
                    <div className="font-display-lg text-headline-xl font-extrabold text-on-surface">{new Set(evaluations.map((e) => e.evaluatorId)).size}</div>
                  </div>
                </div>
              )}
              {evaluations.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">Aún no hay evaluaciones registradas. Los evaluadores califican desde la Plataforma de Evaluadores.</p>
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
                          <td className="px-4 py-3 text-on-surface-variant">{e.updatedAt ? new Date(e.updatedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
