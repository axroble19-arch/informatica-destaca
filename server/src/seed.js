// Seed con datos ficticios coherentes con el contexto universitario.
// Uso: npm run seed  (requiere la base de datos levantada y las migraciones aplicadas)
// Usuarios de prueba:
//   admin@informatica.edu / Admin123!           (ADMIN)
//   contenido@informatica.edu / Contenido123!   (CONTENT_MANAGER)
//   estudiante@informatica.edu / Estudiante123! (STUDENT, vinculado a Ana Ruiz)
//   evaluador@informatica.edu / Evaluador123!   (EVALUATOR, plataforma de evaluadores)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function main() {
  console.log('Limpiando datos anteriores...');
  await prisma.evaluation.deleteMany();
  await prisma.media.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.event.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash('Admin123!', 10);
  const contentPass = await bcrypt.hash('Contenido123!', 10);
  const studentPass = await bcrypt.hash('Estudiante123!', 10);
  const evaluatorPass = await bcrypt.hash('Evaluador123!', 10);

  const [admin, contentManager, studentUser, evaluatorUser] = await Promise.all([
    prisma.user.create({ data: { name: 'Administradora General', email: 'admin@informatica.edu', passwordHash: adminPass, role: 'ADMIN' } }),
    prisma.user.create({ data: { name: 'Responsable de Contenido', email: 'contenido@informatica.edu', passwordHash: contentPass, role: 'CONTENT_MANAGER' } }),
    prisma.user.create({ data: { name: 'Ana Ruiz', email: 'estudiante@informatica.edu', passwordHash: studentPass, role: 'STUDENT' } }),
    prisma.user.create({ data: { name: 'Evaluador del Certamen', email: 'evaluador@informatica.edu', passwordHash: evaluatorPass, role: 'EVALUATOR' } }),
  ]);
  console.log('Usuarios creados:', admin.email, contentManager.email, studentUser.email, evaluatorUser.email);

  const studentsData = [
    { publicName: 'Ana Ruiz', semester: 7, generation: '2023-2027', academicStatus: 'Activa', bio: 'Estudiante de Informática enfocada en desarrollo web y ciencia de datos.', interests: ['Desarrollo web', 'Ciencia de datos'], skills: ['JavaScript', 'React', 'Python', 'SQL'], consentToPublish: true, userId: studentUser.id },
    { publicName: 'Carlos Méndez', semester: 5, generation: '2024-2028', academicStatus: 'Activo', bio: 'Apasionado por la ciberseguridad y las redes.', interests: ['Ciberseguridad', 'Redes'], skills: ['Linux', 'Python', 'Wireshark'], consentToPublish: true },
    { publicName: 'Lucía Fernández', semester: 9, generation: '2022-2026', academicStatus: 'Egresada', bio: 'Interesada en inteligencia artificial y visión por computadora.', interests: ['Inteligencia artificial', 'Machine learning'], skills: ['Python', 'TensorFlow', 'OpenCV'], consentToPublish: true },
    { publicName: 'Diego Torres', semester: 3, generation: '2025-2029', academicStatus: 'Activo', bio: 'Desarrollador móvil en formación, le gusta el diseño de interfaces.', interests: ['Desarrollo móvil', 'Diseño UI'], skills: ['Flutter', 'Figma', 'Dart'], consentToPublish: true },
    { publicName: 'Mariana López', semester: 7, generation: '2023-2027', academicStatus: 'Activa', bio: 'Enfocada en bases de datos y análisis de información.', interests: ['Bases de datos', 'Analítica'], skills: ['PostgreSQL', 'Power BI', 'SQL'], consentToPublish: true },
    { publicName: 'Jorge Sánchez', semester: 8, generation: '2022-2026', academicStatus: 'Egresado', bio: 'Le interesa la robótica y los sistemas embebidos.', interests: ['Robótica', 'IoT'], skills: ['C++', 'Arduino', 'Raspberry Pi'], consentToPublish: true },
    { publicName: 'Luis Damián García Martínez', semester: 7, generation: '2023-2027', academicStatus: 'Activo', bio: 'Estudiante de Informática interesado en la informática forense y las plataformas de aprendizaje en línea.', interests: ['Informática forense', 'E-Learning'], skills: ['Análisis forense', 'Plataformas E-Learning'], photoUrl: '/images/students/luis-damian-garcia-martinez.png', consentToPublish: true },
    { publicName: 'Orlando Suárez Miramar', semester: 7, generation: '2023-2027', academicStatus: 'Activo', bio: 'Estudiante de Informática interesado en la informática forense y las plataformas de aprendizaje en línea.', interests: ['Informática forense', 'E-Learning'], skills: ['Análisis forense', 'Plataformas E-Learning'], photoUrl: '/images/students/orlando-suarez-miramar.png', consentToPublish: true },
    { publicName: 'Nestor Axel Robledo Garduño', semester: 9, generation: '2022-2026', academicStatus: 'Activo', bio: 'Estudiante de Informática enfocado en realidad virtual y preservación cultural.', interests: ['Realidad virtual', 'Cultura mazahua'], skills: ['Realidad virtual', 'Unity', 'Modelado 3D'], photoUrl: '/images/students/nestor-axel-robledo-garduno.png', consentToPublish: true },
    { publicName: 'Perla Máximo Ramírez', semester: 9, generation: '2022-2026', academicStatus: 'Activa', bio: 'Estudiante de Informática enfocada en realidad virtual y preservación cultural.', interests: ['Realidad virtual', 'Cultura mazahua'], skills: ['Realidad virtual', 'Unity', 'Modelado 3D'], photoUrl: '/images/students/perla-maximo-ramirez.png', consentToPublish: true },
    { publicName: 'Citlalli Cuevas Sámano', semester: 7, generation: '2023-2027', academicStatus: 'Activa', bio: 'Estudiante de Informática interesada en la inteligencia artificial aplicada a la salud.', interests: ['Inteligencia artificial', 'Salud'], skills: ['Python', 'Machine Learning', 'Inteligencia artificial'], photoUrl: '/images/students/citlalli-cuevas-samano.png', consentToPublish: true },
  ];

  const students = [];
  for (const s of studentsData) {
    students.push(await prisma.student.create({ data: s }));
  }
  const [ana, carlos, lucia, diego, mariana, jorge, luis, orlando, nestor, perla, citlalli] = students;
  console.log('Estudiantes creados:', students.length);

  const events = await Promise.all([
    prisma.event.create({ data: { title: 'Hackathon Universitario 2026', description: 'Competencia de 24 horas para crear soluciones tecnológicas con impacto social.', date: new Date('2026-03-14T09:00:00'), time: '09:00', place: 'Auditorio Central', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Hackathon', status: 'COMPLETED' } }),
    prisma.event.create({ data: { title: 'Semana de la Informática', description: 'Conferencias, talleres y exposiciones de proyectos estudiantiles.', date: new Date('2026-11-16T10:00:00'), time: '10:00 - 18:00', place: 'Facultad de Informática', modality: 'Presencial', organizer: 'Coordinación de Informática', category: 'Académico', status: 'UPCOMING' } }),
    prisma.event.create({ data: { title: 'Concurso Nacional de Programación', description: 'Eliminatoria regional del concurso nacional de programación competitiva.', date: new Date('2026-05-20T08:00:00'), time: '08:00 - 14:00', place: 'Laboratorio de Cómputo 2', modality: 'Presencial', organizer: 'ACM Capítulo Estudiantil', category: 'Concurso', status: 'COMPLETED' } }),
    prisma.event.create({ data: { title: 'Feria de Proyectos Tecnológicos', description: 'Exposición de proyectos finales de los estudiantes de la licenciatura.', date: new Date('2026-12-03T11:00:00'), time: '11:00 - 17:00', place: 'Explanada principal', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Feria', status: 'UPCOMING' } }),
    prisma.event.create({ data: { title: '4.º Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2025', description: 'Certamen de investigación, innovación, desarrollo tecnológico y emprendimiento de la Licenciatura en Informática. Proyectos estudiantiles evaluados por un panel de 6 especialistas de TESJo, UNRC, UPA, UES Jiquipilco y UAEM Temascaltepec. Primer lugar: Iñemani, Realidad Virtual para la Preservación de la Cultura Mazahua.', date: new Date('2025-12-05T09:00:00'), place: 'UES Ixtlahuaca', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Certamen', imageUrl: '/images/events/certamen-li-2025-flyer.jpg', status: 'COMPLETED' } }),
    prisma.event.create({ data: { title: '1.er Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2022', description: 'Primer certamen de investigación, innovación, desarrollo tecnológico y emprendimiento de la Licenciatura en Informática. Registro fotográfico completo en la Galería Multimedia.', date: new Date('2022-12-05T09:00:00'), place: 'UES Ixtlahuaca', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Certamen', imageUrl: '/images/gallery/certamen2022/convocatoria-2022.jpg', status: 'COMPLETED' } }),
    prisma.event.create({ data: { title: '2.º Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2023', description: 'Segundo certamen de investigación, innovación, desarrollo tecnológico y emprendimiento de la Licenciatura en Informática. Registro fotográfico completo en la Galería Multimedia.', date: new Date('2023-12-05T09:00:00'), place: 'UES Ixtlahuaca', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Certamen', imageUrl: '/images/gallery/certamen2023/convocatoria-2023.jpg', status: 'COMPLETED' } }),
    prisma.event.create({ data: { title: '3.er Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2024', description: 'Tercer certamen de investigación, innovación, desarrollo tecnológico y emprendimiento de la Licenciatura en Informática. Registro fotográfico completo en la Galería Multimedia.', date: new Date('2024-12-05T09:00:00'), place: 'UES Ixtlahuaca', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Certamen', imageUrl: '/images/gallery/ano2024/convocatoria-2024.jpg', status: 'COMPLETED' } }),
    // 5.ª edición: convocatoria VIGENTE (lista de cotejo 3.3). Sin imagen de
    // flyer todavía: la portada la asigna withEventCover en el cliente.
    prisma.event.create({ data: { title: '5.º Certamen Interinstitucional de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento de la Licenciatura en Informática 2026', description: 'Convocatoria vigente del 5.º Certamen Interinstitucional LI 2026. Fecha del evento: viernes 4 de diciembre de 2026, UES Ixtlahuaca. Tecnologías por explorar: Inteligencia Artificial, Realidad Aumentada, Realidad Virtual, Ciencias de Datos, Procesamiento de Imágenes, Desarrollo Web, Robótica y Tecnologías de la Industria 4.0. Evaluadores de prestigio del ámbito académico, profesional y tecnológico. Participan escuelas de Nivel Superior y Media Superior invitadas. Premiación: primer, segundo y tercer lugar. Registro y convocatoria completa: escanea el código QR del cartel oficial.', date: new Date('2026-12-04T09:00:00'), place: 'UES Ixtlahuaca', modality: 'Presencial', organizer: 'Licenciatura en Informática', category: 'Certamen', imageUrl: '/images/events/certamen-li-2026-convocatoria.jpg', status: 'UPCOMING' } }),
  ]);
  const [hackathon, semana, concurso, feria, certamen, certamen2022, certamen2023, certamen2024, certamen2026] = events;
  console.log('Eventos creados:', events.length);

  const achievementsData = [
    { studentId: ana.id, category: 'Académico', title: 'Primer lugar en Hackathon Universitario 2026', description: 'Ganó el primer lugar con una plataforma de tutorías entre estudiantes.', date: new Date('2026-03-15'), relatedEvent: 'Hackathon Universitario 2026', institution: 'Licenciatura en Informática', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: lucia.id, category: 'Investigación', title: 'Mejor ponencia en Congreso de IA', description: 'Ponencia sobre clasificación de imágenes médicas con redes neuronales.', date: new Date('2026-04-22'), relatedEvent: 'Congreso Nacional de Inteligencia Artificial', institution: 'Sociedad Mexicana de IA', evidenceType: 'LINK', status: 'APPROVED' },
    { studentId: carlos.id, category: 'Concurso', title: 'Segundo lugar en Concurso Nacional de Programación', description: 'Resolvió 8 de 10 problemas en la eliminatoria regional.', date: new Date('2026-05-20'), relatedEvent: 'Concurso Nacional de Programación', institution: 'ACM', evidenceType: 'LINK', status: 'APPROVED' },
    { studentId: mariana.id, category: 'Académico', title: 'Reconocimiento a la excelencia académica', description: 'Promedio de 9.8 en el semestre y mejor proyecto de bases de datos.', date: new Date('2026-06-10'), institution: 'Licenciatura en Informática', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: jorge.id, category: 'Innovación', title: 'Prototipo de robot seguidor de línea premiado', description: 'Primer lugar en la feria de robótica con un robot autónomo.', date: new Date('2026-02-18'), relatedEvent: 'Feria de Robótica 2026', institution: 'Facultad de Ingeniería', evidenceType: 'VIDEO', status: 'APPROVED' },
    { studentId: diego.id, category: 'Académico', title: 'Mejor aplicación móvil del semestre', description: 'App de horarios y avisos para estudiantes, elegida por votación.', date: new Date('2026-06-25'), institution: 'Licenciatura en Informática', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: ana.id, category: 'Certificación', title: 'Certificación en desarrollo web full-stack', description: 'Certificación externa completada con proyecto final.', date: new Date('2026-07-01'), institution: 'Plataforma de cursos en línea', evidenceType: 'LINK', status: 'APPROVED' },
    { studentId: luis.id, category: 'Concurso', title: 'Segundo lugar: Aprendizaje Forense mediante una Plataforma E-Learning', description: 'Segundo lugar con una plataforma E-Learning para el aprendizaje forense.', date: new Date('2026-10-15'), relatedEvent: 'FECIEM 2026', institution: 'Licenciatura en Informática', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: orlando.id, category: 'Concurso', title: 'Segundo lugar: Aprendizaje Forense mediante una Plataforma E-Learning', description: 'Segundo lugar con una plataforma E-Learning para el aprendizaje forense.', date: new Date('2026-10-15'), relatedEvent: 'FECIEM 2026', institution: 'Licenciatura en Informática', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: nestor.id, category: 'Innovación', title: 'Primer lugar: Iñemani, Realidad Virtual para la Preservación de la Cultura Mazahua', description: 'Primer lugar en el 4.º Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2025 con un proyecto de realidad virtual para preservar la cultura mazahua.', date: new Date('2025-12-05'), relatedEvent: '4.º Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2025', institution: 'UES Ixtlahuaca', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: perla.id, category: 'Innovación', title: 'Primer lugar: Iñemani, Realidad Virtual para la Preservación de la Cultura Mazahua', description: 'Primer lugar en el 4.º Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2025 con un proyecto de realidad virtual para preservar la cultura mazahua.', date: new Date('2025-12-05'), relatedEvent: '4.º Certamen de Investigación, Innovación, Desarrollo Tecnológico y Emprendimiento LI 2025', institution: 'UES Ixtlahuaca', evidenceType: 'IMAGE', status: 'APPROVED' },
    { studentId: citlalli.id, category: 'Investigación', title: 'Segundo lugar: Inteligencia Artificial para la detección oportuna y prevención del cáncer de mama', description: 'Segundo lugar en FECIEM 2026 con un proyecto de inteligencia artificial para la detección oportuna y prevención del cáncer de mama.', date: new Date('2026-10-15'), relatedEvent: 'FECIEM 2026', institution: 'Licenciatura en Informática', evidenceType: 'IMAGE', status: 'APPROVED' },
    // En PENDING para probar la aprobación en el panel de administración.
    { studentId: carlos.id, category: 'Concurso', title: 'Finalista en CTF de ciberseguridad', description: 'Llegó a la final del torneo universitario de captura de bandera.', date: new Date('2026-10-28'), relatedEvent: 'CTF Universitario 2026', institution: 'Club de Ciberseguridad', evidenceType: 'LINK', status: 'PENDING' },
  ];
  const achievements = [];
  for (const a of achievementsData) {
    achievements.push(await prisma.achievement.create({ data: a }));
  }
  console.log('Logros creados:', achievements.length);

  const participationsData = [
    { studentId: ana.id, eventId: hackathon.id, date: new Date('2026-03-14'), type: 'CONTESTANT', description: 'Desarrolló una plataforma de tutorías entre estudiantes.', result: 'Primer lugar', status: 'APPROVED' },
    { studentId: carlos.id, eventId: concurso.id, date: new Date('2026-05-20'), type: 'CONTESTANT', description: 'Participó en la eliminatoria regional de programación.', result: 'Segundo lugar', status: 'APPROVED' },
    { studentId: lucia.id, eventId: semana.id, date: new Date('2026-11-16'), type: 'SPEAKER', description: 'Conferencia sobre visión por computadora.', result: 'Ponencia aceptada', status: 'APPROVED' },
    { studentId: mariana.id, eventId: feria.id, date: new Date('2026-12-03'), type: 'ORGANIZER', description: 'Coordinación de la exposición de proyectos.', result: 'En curso', status: 'APPROVED' },
    { studentId: jorge.id, eventId: hackathon.id, date: new Date('2026-03-14'), type: 'COLLABORATOR', description: 'Apoyó en la integración de hardware al proyecto.', result: 'Proyecto finalista', status: 'APPROVED' },
    // En PENDING para probar la aprobación.
    { studentId: diego.id, eventId: semana.id, date: new Date('2026-11-16'), type: 'ATTENDEE', description: 'Asistencia a talleres de desarrollo móvil.', result: 'Por validar', status: 'PENDING' },
    { studentId: nestor.id, eventId: certamen.id, date: new Date('2025-12-05'), type: 'CONTESTANT', description: 'Proyecto Iñemani: Realidad Virtual para la Preservación de la Cultura Mazahua.', result: 'Primer lugar', status: 'APPROVED' },
    { studentId: perla.id, eventId: certamen.id, date: new Date('2025-12-05'), type: 'CONTESTANT', description: 'Proyecto Iñemani: Realidad Virtual para la Preservación de la Cultura Mazahua.', result: 'Primer lugar', status: 'APPROVED' },
    // Ganadores de las ediciones anteriores (lista de cotejo 3.4): cada
    // edición queda con premiación, resultados y participantes consultables.
    // Son registros de ejemplo del seed; sustituir por los ganadores reales
    // de cada año cuando se cuente con el dato.
    { studentId: ana.id, eventId: certamen2022.id, date: new Date('2022-12-05'), type: 'CONTESTANT', description: 'Proyecto ganador del 1.er Certamen LI 2022.', result: 'Primer lugar', status: 'APPROVED' },
    { studentId: carlos.id, eventId: certamen2022.id, date: new Date('2022-12-05'), type: 'CONTESTANT', description: 'Proyecto finalista del 1.er Certamen LI 2022.', result: 'Segundo lugar', status: 'APPROVED' },
    { studentId: mariana.id, eventId: certamen2022.id, date: new Date('2022-12-05'), type: 'CONTESTANT', description: 'Proyecto finalista del 1.er Certamen LI 2022.', result: 'Tercer lugar', status: 'APPROVED' },
    { studentId: lucia.id, eventId: certamen2023.id, date: new Date('2023-12-05'), type: 'CONTESTANT', description: 'Proyecto ganador del 2.º Certamen LI 2023.', result: 'Primer lugar', status: 'APPROVED' },
    { studentId: diego.id, eventId: certamen2023.id, date: new Date('2023-12-05'), type: 'CONTESTANT', description: 'Proyecto finalista del 2.º Certamen LI 2023.', result: 'Segundo lugar', status: 'APPROVED' },
    { studentId: jorge.id, eventId: certamen2023.id, date: new Date('2023-12-05'), type: 'CONTESTANT', description: 'Proyecto finalista del 2.º Certamen LI 2023.', result: 'Tercer lugar', status: 'APPROVED' },
    { studentId: carlos.id, eventId: certamen2024.id, date: new Date('2024-12-05'), type: 'CONTESTANT', description: 'Proyecto ganador del 3.er Certamen LI 2024.', result: 'Primer lugar', status: 'APPROVED' },
    { studentId: ana.id, eventId: certamen2024.id, date: new Date('2024-12-05'), type: 'CONTESTANT', description: 'Proyecto finalista del 3.er Certamen LI 2024.', result: 'Segundo lugar', status: 'APPROVED' },
    { studentId: mariana.id, eventId: certamen2024.id, date: new Date('2024-12-05'), type: 'CONTESTANT', description: 'Proyecto finalista del 3.er Certamen LI 2024.', result: 'Tercer lugar', status: 'APPROVED' },
  ];
  const participations = [];
  for (const p of participationsData) {
    participations.push(await prisma.participation.create({ data: p }));
  }
  console.log('Participaciones creadas:', participationsData.length);

  // Evaluaciones de ejemplo (lista de cotejo 4.5): el evaluador del seed ya
  // calificó los dos proyectos del 4.º Certamen LI 2025.
  const partNestor2025 = participations.find((p) => p.studentId === nestor.id && p.eventId === certamen.id);
  const partPerla2025 = participations.find((p) => p.studentId === perla.id && p.eventId === certamen.id);
  await Promise.all([
    prisma.evaluation.create({ data: { evaluatorId: evaluatorUser.id, participationId: partNestor2025.id, score: 9.5, observations: 'Proyecto sobresaliente: realidad virtual aplicada con rigor y pertinencia cultural. Presentación clara y prototipo funcional.' } }),
    prisma.evaluation.create({ data: { evaluatorId: evaluatorUser.id, participationId: partPerla2025.id, score: 9.2, observations: 'Muy buen dominio del tema y evidencia completa. Se sugiere documentar el proceso de validación con usuarios.' } }),
  ]);
  console.log('Evaluaciones creadas: 2');

  await Promise.all([
    prisma.project.create({ data: { studentId: ana.id, title: 'Plataforma de tutorías', description: 'Web para conectar estudiantes que dan y reciben tutorías.', url: 'https://example.com/tutorias', technologies: ['React', 'Node.js', 'PostgreSQL'] } }),
    prisma.project.create({ data: { studentId: lucia.id, title: 'Clasificador de imágenes médicas', description: 'Modelo de IA para apoyar el diagnóstico por imagen.', technologies: ['Python', 'TensorFlow'] } }),
    prisma.project.create({ data: { studentId: diego.id, title: 'App de horarios', description: 'Aplicación móvil con horarios, avisos y mapa del campus.', technologies: ['Flutter', 'Firebase'] } }),
    prisma.project.create({ data: { studentId: jorge.id, title: 'Robot seguidor de línea', description: 'Robot autónomo con sensores infrarrojos y control PID.', technologies: ['C++', 'Arduino'] } }),
  ]);

  await Promise.all([
    prisma.certification.create({ data: { studentId: ana.id, title: 'Desarrollo web full-stack', issuer: 'Plataforma de cursos en línea', date: new Date('2026-07-01') } }),
    prisma.certification.create({ data: { studentId: carlos.id, title: 'Fundamentos de ciberseguridad', issuer: 'Academia de redes', date: new Date('2026-05-05') } }),
    prisma.certification.create({ data: { studentId: lucia.id, title: 'Machine Learning con Python', issuer: 'Plataforma de cursos en línea', date: new Date('2026-03-30') } }),
    prisma.certification.create({ data: { studentId: mariana.id, title: 'Análisis de datos con SQL', issuer: 'Academia de datos', date: new Date('2026-06-15') } }),
  ]);

  await Promise.all([
    prisma.media.create({ data: { title: 'Luis Damián García Martínez - retrato', description: 'Foto autorizada para el Cuadro de Honor.', type: 'IMAGE', url: '/images/students/luis-damian-garcia-martinez.png', studentId: luis.id, date: new Date('2026-10-15T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Orlando Suárez Miramar - retrato', description: 'Foto autorizada para el Cuadro de Honor.', type: 'IMAGE', url: '/images/students/orlando-suarez-miramar.png', studentId: orlando.id, date: new Date('2026-10-15T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Nestor Axel Robledo Garduño - retrato', description: 'Foto autorizada para el Cuadro de Honor.', type: 'IMAGE', url: '/images/students/nestor-axel-robledo-garduno.png', studentId: nestor.id, date: new Date('2025-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Perla Máximo Ramírez - retrato', description: 'Foto autorizada para el Cuadro de Honor.', type: 'IMAGE', url: '/images/students/perla-maximo-ramirez.png', studentId: perla.id, date: new Date('2025-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Citlalli Cuevas Sámano - retrato', description: 'Foto autorizada para el Cuadro de Honor.', type: 'IMAGE', url: '/images/students/citlalli-cuevas-samano.png', studentId: citlalli.id, date: new Date('2026-10-15T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen LI 2025 - flyer de invitación', description: 'Flyer oficial del 4.º Certamen LI 2025, 5 de diciembre.', type: 'IMAGE', url: '/images/events/certamen-li-2025-flyer.jpg', eventId: certamen.id, date: new Date('2025-11-04T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen LI 2026 - cartel de convocatoria', description: 'Cartel oficial del 5.º Certamen Interinstitucional LI 2026, 4 de diciembre. Fuente: UES Ixtlahuaca en Facebook, 27 de octubre de 2026.', type: 'IMAGE', url: '/images/events/certamen-li-2026-convocatoria.jpg', eventId: certamen2026.id, date: new Date('2026-10-27T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen LI 2025 - evaluadores', description: 'Panel de evaluadores del 4.º Certamen LI 2025.', type: 'IMAGE', url: '/images/events/certamen-li-2025-evaluadores.jpg', eventId: certamen.id, date: new Date('2025-12-01T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Imagen del evento 4', description: 'Registro fotográfico del Certamen 2024 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/ano2024/imagen-del-evento4.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Imagen del evento 3', description: 'Registro fotográfico del Certamen 2024 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/ano2024/imagen-del-evento3.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Imagen del evento 2', description: 'Registro fotográfico del Certamen 2024 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/ano2024/imagen-del-evento2.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Imagen del evento 1', description: 'Registro fotográfico del Certamen 2024 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/ano2024/imagen-del-evento1.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Evaluadores 2', description: 'Panel de evaluadores del Certamen 2024.', type: 'IMAGE', url: '/images/gallery/ano2024/evaluadores-2.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Evaluadores 1', description: 'Panel de evaluadores del Certamen 2024.', type: 'IMAGE', url: '/images/gallery/ano2024/evaluadores-1.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2024 - Convocatoria 2024', description: 'Convocatoria oficial del Certamen 2024.', type: 'IMAGE', url: '/images/gallery/ano2024/convocatoria-2024.jpg', eventId: certamen2024.id, date: new Date('2024-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 13', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento13.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 12', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento12.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 11', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento11.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 10', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento10.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 9', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento9.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 8', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento8.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 7', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento7.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 6', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento6.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 5', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento5.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 4', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento4.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 3', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento3.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Imagen del evento 1', description: 'Registro fotográfico del Certamen 2022 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2022/imagen-del-evento1.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Segundo lugar', description: 'Premiación del Certamen 2022.', type: 'IMAGE', url: '/images/gallery/certamen2022/segundo-lugar.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Primer lugar', description: 'Premiación del Certamen 2022.', type: 'IMAGE', url: '/images/gallery/certamen2022/primer-lugar.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Evaluadores 2', description: 'Panel de evaluadores del Certamen 2022.', type: 'IMAGE', url: '/images/gallery/certamen2022/evaluadores-2.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Evaluadores 1', description: 'Panel de evaluadores del Certamen 2022.', type: 'IMAGE', url: '/images/gallery/certamen2022/evaluadores-1.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2022 - Convocatoria 2022', description: 'Convocatoria oficial del Certamen 2022.', type: 'IMAGE', url: '/images/gallery/certamen2022/convocatoria-2022.jpg', eventId: certamen2022.id, date: new Date('2022-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2023 - Imagenes del evento 4', description: 'Registro fotográfico del Certamen 2023 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2023/imagenes-del-evento-4.jpg', eventId: certamen2023.id, date: new Date('2023-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2023 - Imagenes del evento 3', description: 'Registro fotográfico del Certamen 2023 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2023/imagenes-del-evento-3.jpg', eventId: certamen2023.id, date: new Date('2023-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2023 - Imagenes del evento 2', description: 'Registro fotográfico del Certamen 2023 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2023/imagenes-del-evento-2.jpg', eventId: certamen2023.id, date: new Date('2023-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2023 - Imagenes del evento 1', description: 'Registro fotográfico del Certamen 2023 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2023/imagenes-del-evento-1.jpg', eventId: certamen2023.id, date: new Date('2023-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2023 - Evaluadores 2023', description: 'Panel de evaluadores del Certamen 2023.', type: 'IMAGE', url: '/images/gallery/certamen2023/evaluadores-2023.jpg', eventId: certamen2023.id, date: new Date('2023-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2023 - Convocatoria 2023', description: 'Convocatoria oficial del Certamen 2023.', type: 'IMAGE', url: '/images/gallery/certamen2023/convocatoria-2023.jpg', eventId: certamen2023.id, date: new Date('2023-12-05T12:00:00'), consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 10', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-10.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 9', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-9.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 8', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-8.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 7', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-7.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 6', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-6.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 5', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-5.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 4', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-4.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 3', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-3.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 2', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-2.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Imagen del evento 1', description: 'Registro fotográfico del Certamen 2025 en la UES Ixtlahuaca.', type: 'IMAGE', url: '/images/gallery/certamen2025/imagen-del-evento-1.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - 2do lugar', description: 'Premiación del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/2do-lugar.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - 3er lugar', description: 'Premiación del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/3er-lugar.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Evaluadores 2', description: 'Panel de evaluadores del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/evaluadores2.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Evaluadores 1', description: 'Panel de evaluadores del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/evaluadores1.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Primer lugar', description: 'Premiación del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/primer-lugar.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Primer lugar (2)', description: 'Premiación del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/primer-lugar-2.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Mención especial', description: 'Premiación del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/mencion-especial.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
    prisma.media.create({ data: { title: 'Certamen 2025 - Convocatoria', description: 'Convocatoria oficial del Certamen 2025.', type: 'IMAGE', url: '/images/gallery/certamen2025/convocatoria.jpg', date: new Date('2025-12-05T12:00:00'), eventId: certamen.id, consentToPublish: true } }),
  ]);
  console.log('Seed completado.');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
