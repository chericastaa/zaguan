import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Logo } from '../components/Navbar';

function Tarjeta({ titulo, subtitulo, children }) {
  return (
    <div className="contenedor acceso">
      <div className="acceso__tarjeta">
        <Logo />
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.desde || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta titulo="Te damos la bienvenida" subtitulo="Ingresá para guardar favoritos y contactar propietarios.">
      <form onSubmit={enviar} className="acceso__form">
        <div className="campo">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="alerta">{error}</p>}
        <button className="btn btn--primario btn--bloque" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="acceso__pie">
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </Tarjeta>
  );
}

const ROLES = [
  ['inquilino', 'fa-magnifying-glass-location', 'Busco alquilar', 'Guardá favoritos y contactá propietarios'],
  ['propietario', 'fa-key', 'Quiero publicar', 'Subí tus propiedades con fotos'],
];

export function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'inquilino' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const u = await registro(form);
      navigate(u.rol === 'propietario' ? '/mis-propiedades' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta titulo="Creá tu cuenta" subtitulo="Es gratis y tarda menos de un minuto.">
      <form onSubmit={enviar} className="acceso__form">
        <div className="roles">
          {ROLES.map(([valor, icono, titulo, desc]) => (
            <button
              type="button"
              key={valor}
              onClick={() => setForm({ ...form, rol: valor })}
              className={`rol ${form.rol === valor ? 'rol--activo' : ''}`}
            >
              <i className={`fa-solid ${icono}`}></i>
              <strong>{titulo}</strong>
              <small>{desc}</small>
            </button>
          ))}
        </div>
        <div className="campo">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="alerta">{error}</p>}
        <button className="btn btn--primario btn--bloque" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="acceso__pie">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </Tarjeta>
  );
}
