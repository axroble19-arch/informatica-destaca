import { Link, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import HonorBoard from './pages/HonorBoard.jsx';
import Students from './pages/Students.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import Events from './pages/Events.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Gallery from './pages/Gallery.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import CV from './pages/CV.jsx';
import Privacy from './pages/Privacy.jsx';
import Evaluators from './pages/Evaluators.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cuadro-de-honor" element={<HonorBoard />} />
          <Route path="/estudiantes" element={<Students />} />
          <Route path="/estudiantes/:id" element={<StudentProfile />} />
          <Route path="/estudiantes/:id/cv" element={<CV />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/eventos/:id" element={<EventDetail />} />
          <Route path="/evaluadores" element={<Evaluators />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/aviso-de-privacidad" element={<Privacy />} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'CONTENT_MANAGER']}><Admin /></ProtectedRoute>} />
          <Route path="*" element={<p className="pt-20 p-8 text-center text-on-surface-variant">Página no encontrada.</p>} />
        </Routes>
      </div>
      {/* Footer de Stitch (Home), verbatim */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface-variant print:hidden">
        <div className="max-w-[1440px] mx-auto px-gutter py-margin">
          <div className="grid grid-cols-1 gap-space-xl grid-cols-3">
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[26px]">terminal</span>
                <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">Informática Destaca</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Plataforma institucional de distinción, producción científica y excelencia técnica para la comunidad académica de la Licenciatura en Informática.</p>
              {/* Escudo de la Licenciatura en Informática junto al logo UMB.
                  El escudo es JPG con fondo blanco: va en una tarjeta blanca
                  (sello) para que se lea bien sobre el tema oscuro. */}
              <div className="flex items-center gap-space-md mt-1">
                <img
                  src="/images/umb-logo-dark.png"
                  alt="Universidad Mexiquense del Bicentenario"
                  className="w-48 h-auto object-contain"
                />
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="bg-white rounded-2xl p-1.5 shadow-lg">
                    <img
                      src="/images/escudo-licenciatura-informatica.jpg"
                      alt="Escudo de la Licenciatura en Informática"
                      className="w-24 h-24 object-contain rounded-xl"
                    />
                  </div>
                  <span className="font-code-badge text-code-badge text-on-surface-variant uppercase tracking-wider text-center leading-tight">
                    Licenciatura en<br />Informática
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-space-md items-center">
              <h3 className="font-title-md text-title-md text-on-surface font-semibold tracking-tight">Enlaces Rápidos</h3>
              <ul className="flex flex-col gap-space-sm font-body-md text-body-md items-center">
                <li className="hover:text-secondary transition-colors">
                  <Link className="flex items-center gap-space-xs" to="/cuadro-de-honor">
                    <span className="material-symbols-outlined text-[16px]">military_tech</span>Cuadro de Honor
                  </Link>
                </li>
                <li className="hover:text-secondary transition-colors">
                  <Link className="flex items-center gap-space-xs" to="/estudiantes">
                    <span className="material-symbols-outlined text-[16px]">code_blocks</span>Perfil de Estudiantes
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-space-md">
              <h3 className="font-title-md text-title-md text-on-surface font-semibold tracking-tight">Contacto Institucional</h3>
              <ul className="flex flex-col gap-space-sm font-body-md text-body-md">
                <li className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 anim-building">apartment</span>
                  <span>UNIVERSIDAD MEXIQUENSE DEL BICENTENARIO IXTLAHUACA</span>
                </li>
                <li className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 anim-mail">mail</span>
                  <span>informatica.destaca@universidad.edu</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-margin pt-space-md border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-space-md font-body-md text-body-md text-on-surface-variant">
            <p>© 2026 Licenciatura en Informática. Todos los derechos reservados.</p>
            <div className="flex items-center gap-space-lg">
              <Link className="hover:text-secondary transition-colors" to="/aviso-de-privacidad">Aviso de Privacidad</Link>
              <a className="hover:text-secondary transition-colors" href="#">Términos de Servicio</a>
              <a className="hover:text-secondary transition-colors" href="#">Código de Ética Técnica</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
