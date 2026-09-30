import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { auth, firmarToken } from '../middleware/auth.js';

const router = Router();

const publico = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol });

router.post('/registro', async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Completá nombre, email y contraseña' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña tiene que tener al menos 6 caracteres' });
    }
    if (!['inquilino', 'propietario'].includes(rol)) {
      return res.status(400).json({ error: 'El rol tiene que ser inquilino o propietario' });
    }
    const existe = await query('SELECT 1 FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existe.rowCount) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre.trim(), email.toLowerCase().trim(), hash, rol]
    );
    res.status(201).json({ token: firmarToken(rows[0]), usuario: publico(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query('SELECT * FROM usuarios WHERE email = $1', [
      (email || '').toLowerCase().trim(),
    ]);
    const usuario = rows[0];
    if (!usuario || !(await bcrypt.compare(password || '', usuario.password_hash))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    res.json({ token: firmarToken(usuario), usuario: publico(usuario) });
  } catch (err) {
    next(err);
  }
});

router.get('/yo', auth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(publico(rows[0]));
  } catch (err) {
    next(err);
  }
});

export default router;
