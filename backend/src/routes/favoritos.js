import { Router } from 'express';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';
import { obtenerPropiedad } from '../busqueda.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT propiedad_id FROM favoritos WHERE usuario_id = $1 ORDER BY creado_en DESC',
      [req.usuario.id]
    );
    const propiedades = await Promise.all(rows.map((r) => obtenerPropiedad(r.propiedad_id, req.usuario.id)));
    res.json(propiedades.filter(Boolean));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const propiedadId = Number(req.body.propiedadId);
    const existe = await query('SELECT 1 FROM propiedades WHERE id = $1', [propiedadId]);
    if (!existe.rowCount) return res.status(404).json({ error: 'La propiedad no existe' });
    await query(
      'INSERT INTO favoritos (usuario_id, propiedad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.usuario.id, propiedadId]
    );
    res.status(201).json({ propiedadId });
  } catch (err) {
    next(err);
  }
});

router.delete('/:propiedadId', async (req, res, next) => {
  try {
    await query('DELETE FROM favoritos WHERE usuario_id = $1 AND propiedad_id = $2', [
      req.usuario.id,
      Number(req.params.propiedadId),
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
