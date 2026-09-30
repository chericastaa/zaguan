import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-esto-en-produccion';

export function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Tenés que iniciar sesión' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión vencida, volvé a ingresar' });
  }
}

export function authOpcional(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.usuario = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {}
  }
  next();
}

export function permitir(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ error: 'No tenés permiso para hacer esto' });
    }
    next();
  };
}
