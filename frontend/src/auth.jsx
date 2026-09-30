import { createContext, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return setCargando(false);
    api('/auth/yo')
      .then(setUsuario)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setCargando(false));
  }, []);

  const guardarSesion = ({ token, usuario }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUsuario(usuario);
    return usuario;
  };

  const login = (email, password) =>
    api('/auth/login', { method: 'POST', body: { email, password } }).then(guardarSesion);

  const registro = (datos) => api('/auth/registro', { method: 'POST', body: datos }).then(guardarSesion);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
