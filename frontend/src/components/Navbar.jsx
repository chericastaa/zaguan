import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function Logo() {
  return (
    <Link to="/" className="logo">
      <img src="/img/logo.svg" alt="" />
      <span>zaguán</span>
    </Link>
  );
}

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => setAbierto(false);

  const salir = () => {
    logout();
    cerrar();
    navigate('/');
  };

  const esDuenio = ['propietario', 'admin'].includes(usuario?.rol);

  return (
    <header className="cabecera">
      <div className="contenedor cabecera__interior">
        <Logo />

        <button className="boton-menu" onClick={() => setAbierto(!abierto)} aria-label="Abrir menú">
          <i className={`fa-solid ${abierto ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        <nav className={`menu ${abierto ? 'menu--abierto' : ''}`}>
          <ul className="menu__lista">
            <li>
              <NavLink to="/" end onClick={cerrar}>
                <i className="fa-solid fa-magnifying-glass"></i> Explorar
              </NavLink>
            </li>
            {usuario && (
              <li>
                <NavLink to="/favoritos" onClick={cerrar}>
                  <i className="fa-regular fa-heart"></i> Favoritos
                </NavLink>
              </li>
            )}
            {esDuenio && (
              <li>
                <NavLink to="/mis-propiedades" onClick={cerrar}>
                  <i className="fa-solid fa-house-chimney"></i>
                  {usuario.rol === 'admin' ? 'Publicaciones' : 'Mis propiedades'}
                </NavLink>
              </li>
            )}
            {!usuario && (
              <li>
                <NavLink to="/login" onClick={cerrar}>
                  <i className="fa-regular fa-user"></i> Ingresar
                </NavLink>
              </li>
            )}
          </ul>

          {usuario ? (
            <div className="usuario-chip">
              <div className="usuario-chip__texto">
                <strong>{usuario.nombre}</strong>
                <small>{usuario.rol}</small>
              </div>
              <span className="avatar">{usuario.nombre[0].toUpperCase()}</span>
              <button className="icono-boton" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <Link to="/registro" className="btn btn--oscuro" onClick={cerrar}>
              Publicá tu propiedad
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
