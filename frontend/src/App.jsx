import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
import Detalle from './pages/Detalle';
import Publicar from './pages/Publicar';
import { Login, Registro } from './pages/Acceso';
import { Favoritos, MisPropiedades } from './pages/Listas';

function Privada({ roles, children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

const DUENIOS = ['propietario', 'admin'];

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/propiedades/:id" element={<Detalle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/favoritos" element={<Privada><Favoritos /></Privada>} />
          <Route path="/mis-propiedades" element={<Privada roles={DUENIOS}><MisPropiedades /></Privada>} />
          <Route path="/publicar" element={<Privada roles={DUENIOS}><Publicar /></Privada>} />
          <Route path="/propiedades/:id/editar" element={<Privada roles={DUENIOS}><Publicar /></Privada>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Chat />
    </div>
  );
}
