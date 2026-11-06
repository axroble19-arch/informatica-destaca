// ---------------------------------------------------------------------------
// Imágenes locales de Stitch (autoalojadas en client/public/images/stitch/).
// ---------------------------------------------------------------------------
// El diseño original de Stitch cargaba sus imágenes desde servidores
// externos. Para que el portal funcione SIN internet, las 60
// imágenes se descargaron a public/images/stitch/. NINGUNA imagen de
// esta app se carga ya desde fuera. (Las 4 fotos de ejemplo del seed
// se eliminaron el 2026-11-06: la Galería solo muestra fotos de Drive
// y fotos proporcionadas por Axel.)
//
// Origen de cada archivo: el code.html de Stitch del que se extrajo (ver
// alt / sección). Las fotos de personas son TODAS ficticias (datos de
// demostración del propio Stitch, sin personas reales): por eso se mapean
// por POSICIÓN/ORDEN y no por identidad — el retrato N se asigna al
// estudiante/evento N según su id, de forma determinista, así cada
// estudiante muestra siempre la misma foto en todas las pantallas.
//
// 2 URLs de Stitch NO se pudieron descargar (su enlace exige iniciar sesión
// en Google: redirigen a accounts.google.com):
//  - el logo del header ("Informática Destaca Símbolo"): se usa el emblema
//    en su lugar, que es la misma insignia según su texto alternativo
//    ("Modern glowing tech emblem for 'Informática Destaca'...").
//  - el emblema alternativo de Perfiles: se usa el emblema principal.
// ---------------------------------------------------------------------------

// Logo del header y emblema del portal (misma insignia de Stitch).
export const LOGO = '/images/stitch/emblema-informatica-destaca-85d532.png';
export const EMBLEM = '/images/stitch/emblema-informatica-destaca-85d532.png';

// Retrato del widget de administrador (Admin, "Retrato de perfil del
// administrador académico").
export const ADMIN_PORTRAIT =
  '/images/stitch/admin-panel-de-administracion-gobierno-academico-0ec762.jpg';

// Retrato de la tarjeta destacada del hero (Home): en Stitch es el retrato
// cinematográfico de la estudiante destacada ("Estudiante del Mes").
export const HERO_PORTRAIT =
  '/images/stitch/home-impulsando-el-talento-que-transforma-la-tecno-099c45.jpg';

// Retratos por orden del Cuadro de Honor de Stitch (1.º a 11.º). Los
// estudiantes reales no tienen foto en la BD, así que el retrato N se asigna
// al estudiante con id N (módulo 11). Todas son personas ficticias de Stitch.
export const PORTRAITS = [
  '/images/stitch/perfiles-sofia-alarcon-rivas-3ff0db.jpg', // 1.ª Sofia Alarcón Rivas
  '/images/stitch/perfiles-mateo-villalobos-05d7f0.jpg', // 2.º Mateo Villalobos
  '/images/stitch/perfiles-valeria-mendoza-cruz-d2b151.jpg', // 3.ª Valeria Mendoza Cruz
  '/images/stitch/perfiles-camila-v-arismendi-215b34.jpg', // 4.ª Camila V. Arismendi
  '/images/stitch/perfiles-carlos-daniel-soto-148c60.jpg', // 5.º Carlos Daniel Soto
  '/images/stitch/perfiles-diego-emiliano-ramos-803b05.jpg', // 6.º Diego Emiliano Ramos
  '/images/stitch/honor-andrea-ximena-morales-9ef8d0.jpg', // 7.ª Andrea Ximena Morales
  '/images/stitch/honor-mariana-lizbeth-fuentes-a20447.jpg', // 8.ª Mariana Lizbeth Fuentes
  '/images/stitch/honor-rodrigo-sebastian-cruz-3bb9bf.jpg', // 9.º Rodrigo Sebastián Cruz
  '/images/stitch/honor-leonardo-gael-sanchez-b06c97.jpg', // 10.º Leonardo Gael Sánchez
  '/images/stitch/honor-brenda-paulina-estrada-f796c7.jpg', // 11.ª Brenda Paulina Estrada
];

// Foto real del estudiante si la tiene (photoUrl/avatarUrl de la BD);
// si no, retrato de Stitch por id (determinista en todas las pantallas).
export function portraitForStudent(student, index = 0) {
  if (student?.photoUrl) return student.photoUrl;
  if (student?.avatarUrl) return student.avatarUrl;
  const id = typeof student?.id === 'number' ? student.id : index + 1;
  return PORTRAITS[(id - 1) % PORTRAITS.length];
}

// Devuelve una copia del estudiante con photoUrl local garantizado.
export function withStudentPhoto(student, index = 0) {
  if (!student) return student;
  return { ...student, photoUrl: portraitForStudent(student, index) };
}

// Portadas de eventos en el orden de la parrilla de Eventos de Stitch
// (Hackathon, Simposio, Ceremonia, Taller Qiskit, OMI, CardioScan-AI,
// Feria IoT, y la imagen institucional como 8.ª). Los eventos reales no
// tienen imageUrl en la BD: la portada N se asigna al evento con id N.
export const EVENT_COVERS = [
  '/images/stitch/eventos-hackathon-anual-de-informatica-2024-95a879.jpg', // 1 Hackathon Anual
  '/images/stitch/eventos-simposio-internacional-de-ciberseguridad-y-re-b51dba.jpg', // 2 Simposio de Ciberseguridad
  '/images/stitch/eventos-ceremonia-de-entrega-de-medallas-al-merito-ac-139901.jpg', // 3 Ceremonia de Medallas
  '/images/stitch/eventos-taller-de-computacion-cuantica-con-qiskit-9ad908.jpg', // 4 Taller de Computación Cuántica
  '/images/stitch/eventos-olimpiada-mexicana-de-informatica-fase-region-be294f.jpg', // 5 Olimpiada Mexicana de Informática
  '/images/stitch/eventos-conferencia-magistral-cardioscan-ai-e82d36.jpg', // 6 Conferencia CardioScan-AI
  '/images/stitch/eventos-feria-universitaria-de-proyectos-iot-y-roboti-8f3ed2.jpg', // 7 Feria de Proyectos IoT
  '/images/stitch/eventos-eventos-institucionales-encuentros-tecnologic-6e5a75.jpg', // 8 Imagen institucional de Eventos
];

// Imagen real del evento si la tiene (imageUrl de la BD); si no, portada
// de Stitch por id (determinista en todas las pantallas).
export function coverForEvent(event, index = 0) {
  if (event?.imageUrl) return event.imageUrl;
  const id = typeof event?.id === 'number' ? event.id : index + 1;
  return EVENT_COVERS[(id - 1) % EVENT_COVERS.length];
}

// Devuelve una copia del evento con imageUrl local garantizado.
export function withEventCover(event, index = 0) {
  if (!event) return event;
  return { ...event, imageUrl: coverForEvent(event, index) };
}

// Pósteres temáticos de la Galería de Stitch (sus 12 piezas no traían URL
// de imagen — data-src="placeholder" — así que se reutiliza la imagen de
// Stitch del mismo tema). Se usan para las piezas VIDEO/LINK, que no tienen
// miniatura propia en la BD.
const GALLERY_POSTERS_BY_KEYWORD = [
  [['hackathon'], '/images/stitch/galeria-hackathon-anual-de-informatica-2024-820044.jpg'],
  [['cardioscan', 'inteligencia artificial', 'ia -', 'ia ', 'visión'], '/images/stitch/galeria-cardioscan-ai-demo-5a7fbd.jpg'],
  [['feria', 'iot', 'robótica', 'robot'], '/images/stitch/galeria-feria-de-proyectos-iot-dfbb31.jpg'],
  [['laboratorio', 'lab ', 'nube', 'infraestructura'], '/images/stitch/galeria-lab-de-robotica-y-nube-8ab4b3.jpg'],
  [['olimpiada', 'omi', 'competencia', 'concurso', 'programación'], '/images/stitch/galeria-olimpiada-omi-fase-regional-1c5974.jpg'],
  [['simposio', 'ciberseguridad', 'seguridad'], '/images/stitch/galeria-simposio-ciberseguridad-f1ee55.jpg'],
  [['medalla', 'ceremonia', 'graduación', 'premiación', 'premio'], '/images/stitch/galeria-medallas-al-merito-2024-e03027.jpg'],
  [['taller', 'cuántica', 'qiskit'], '/images/stitch/galeria-taller-de-computacion-cuantica-77fe68.jpg'],
  [['entrevista', 'sofia', 'alarcón'], '/images/stitch/galeria-entrevista-sofia-alarcon-rivas-2581d4.jpg'],
  [['conferencia', 'carlos', 'defcon'], '/images/stitch/galeria-conferencia-carlos-daniel-soto-e1a7f4.jpg'],
  [['camila', 'estudiante del mes'], '/images/stitch/galeria-camila-v-arismendi-estudiante-del-mes-12e821.jpg'],
  [['memoria', 'dossier', 'técnica', 'documento'], '/images/stitch/galeria-memoria-tecnica-hackathon-5ea86d.jpg'],
];
const GALLERY_POSTER_DEFAULT = '/images/stitch/galeria-hackathon-anual-de-informatica-2024-820044.jpg';

export function galleryPosterFor(media) {
  const text = `${media?.title || ''} ${media?.description || ''}`.toLowerCase();
  for (const [keywords, src] of GALLERY_POSTERS_BY_KEYWORD) {
    if (keywords.some((k) => text.includes(k))) return src;
  }
  return GALLERY_POSTER_DEFAULT;
}

// Pósteres del bento de la Galería del Home de Stitch (sus 4 fotos:
// hackathon, graduación, laboratorio y simposio). Se usan para las piezas
// VIDEO/LINK del bento del Home, que no tienen miniatura propia en la BD.
const HOME_POSTERS_BY_KEYWORD = [
  [['hackathon', 'concurso', 'competencia', 'olimpiada', 'omi'], '/images/stitch/home-galeria-institucional-y-eventos-f67ecd.jpg'],
  [['ceremonia', 'medalla', 'graduación', 'premiación', 'premio', 'semana'], '/images/stitch/home-hackathon-anual-de-informatica-2024-2b81d2.jpg'],
  [['laboratorio', 'lab ', 'robótica', 'robot', 'nube', 'feria', 'iot'], '/images/stitch/home-lab-de-robotica-y-computo-nube-f23978.jpg'],
  [['simposio', 'ciberseguridad', 'seguridad', 'conferencia', 'charla', 'inteligencia artificial', 'ia '], '/images/stitch/home-entrega-de-medallas-al-merito-692bec.jpg'],
];
const HOME_POSTER_DEFAULT = '/images/stitch/home-galeria-institucional-y-eventos-f67ecd.jpg';

export function homePosterFor(media) {
  const text = `${media?.title || ''} ${media?.description || ''}`.toLowerCase();
  for (const [keywords, src] of HOME_POSTERS_BY_KEYWORD) {
    if (keywords.some((k) => text.includes(k))) return src;
  }
  return HOME_POSTER_DEFAULT;
}

// Evidencia fotográfica del detalle de evento de Stitch (4 fotos de su
// modal "Evidencia Multimedia y Registro Fotográfico"). Descargadas y
// disponibles; sin hueco propio en el port, que muestra la media real del
// evento.
export const DETAIL_EVIDENCE = [
  '/images/stitch/eventos-photo-library-evidencia-multimedia-y-registro-20aff2.jpg',
  '/images/stitch/eventos-photo-library-evidencia-multimedia-y-registro-39519c.jpg',
  '/images/stitch/eventos-photo-library-evidencia-multimedia-y-registro-43d4c9.jpg',
  '/images/stitch/eventos-photo-library-evidencia-multimedia-y-registro-ac3769.jpg',
];

// Imágenes de Stitch descargadas sin hueco propio en el port (quedan
// disponibles en public/images/stitch/ para uso futuro): banner del podio,
// héroes de Perfiles y Eventos, estado vacío de Eventos, avatares de la
// bandeja de Admin, imagen estática del lightbox y retratos alternos del
// carrusel del Home.
export const STITCH_SPARES = [
  '/images/stitch/honor-podio-de-honor-maximas-distinciones-ac9bff.jpg',
  '/images/stitch/perfiles-perfiles-tecnicos-expedientes-digitales-verif-4ac41c.jpg',
  '/images/stitch/eventos-eventos-institucionales-encuentros-tecnologic-6e5a75.jpg',
  '/images/stitch/eventos-no-se-encontraron-eventos-con-los-criterios-s-826571.jpg',
  '/images/stitch/admin-bandeja-de-dictaminacion-en-espera-278ee9.jpg',
  '/images/stitch/admin-bandeja-de-dictaminacion-en-espera-530114.jpg',
  '/images/stitch/admin-bandeja-de-dictaminacion-en-espera-bfcc5f.jpg',
  '/images/stitch/galeria-visualizacion-ampliada-de-la-pieza-4d63ef.jpg',
  '/images/stitch/home-cuadro-de-honor-destacado-f6cacc.jpg',
  '/images/stitch/home-carlos-daniel-soto-a61694.jpg',
  '/images/stitch/home-mateo-villalobos-a7b993.jpg',
  '/images/stitch/home-sofia-alarcon-rivas-7daea2.jpg',
];
