import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pool, query } from '../db.js';
import { auth, authOpcional, permitir } from '../middleware/auth.js';
import { buscarPropiedades, obtenerPropiedad } from '../busqueda.js';
import { BARRIOS } from '../barrios.js';

export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve('uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se aceptan imágenes JPG, PNG o WEBP'));
  },
});

const router = Router();

function validar(body) {
  const datos = {
    titulo: body.titulo?.trim(),
    descripcion: body.descripcion?.trim() || null,
    barrio: body.barrio,
    direccion: body.direccion?.trim() || null,
    precio: Number(body.precio),
    expensas: Number(body.expensas || 0),
    ambientes: Number(body.ambientes),
    superficie: body.superficie ? Number(body.superficie) : null,
    mascotas: body.mascotas === true || body.mascotas === 'true',
    lat: body.lat ? Number(body.lat) : null,
    lng: body.lng ? Number(body.lng) : null,
  };
  if (!datos.titulo) return { error: 'Falta el título' };
  if (!BARRIOS.includes(datos.barrio)) return { error: 'Elegí un barrio válido' };
  if (!(datos.precio > 0)) return { error: 'El precio tiene que ser mayor a 0' };
  if (!(datos.ambientes > 0)) return { error: 'Indicá la cantidad de ambientes' };
  return { datos };
}

function borrarArchivos(files = []) {
  for (const f of files) fs.rm(f.path, { force: true }, () => {});
}

async function puedeEditar(req, id) {
  const { rows } = await query('SELECT propietario_id FROM propiedades WHERE id = $1', [id]);
  if (!rows[0]) return { status: 404, error: 'La propiedad no existe' };
  if (req.usuario.rol !== 'admin' && rows[0].propietario_id !== req.usuario.id) {
    return { status: 403, error: 'Solo podés modificar tus propias propiedades' };
  }
  return {};
}

router.get('/', authOpcional, async (req, res, next) => {
  try {
    const filtros = { ...req.query };
    if (req.query.mias === 'true' && req.usuario) filtros.propietarioId = req.usuario.id;
    res.json(await buscarPropiedades(filtros, req.usuario?.id));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authOpcional, async (req, res, next) => {
  try {
    const propiedad = await obtenerPropiedad(Number(req.params.id), req.usuario?.id);
    if (!propiedad) return res.status(404).json({ error: 'La propiedad no existe' });
    res.json(propiedad);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, permitir('propietario', 'admin'), upload.array('fotos', 10), async (req, res, next) => {
  const { datos, error } = validar(req.body);
  if (error) {
    borrarArchivos(req.files);
    return res.status(400).json({ error });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO propiedades (propietario_id, titulo, descripcion, barrio, direccion, precio, expensas, ambientes, superficie, mascotas, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [req.usuario.id, datos.titulo, datos.descripcion, datos.barrio, datos.direccion, datos.precio,
       datos.expensas, datos.ambientes, datos.superficie, datos.mascotas, datos.lat, datos.lng]
    );
    const id = rows[0].id;
    for (const [i, f] of (req.files || []).entries()) {
      await client.query('INSERT INTO fotos (propiedad_id, url, orden) VALUES ($1, $2, $3)', [
        id, `/uploads/${f.filename}`, i,
      ]);
    }
    await client.query('COMMIT');
    res.status(201).json(await obtenerPropiedad(id, req.usuario.id));
  } catch (err) {
    await client.query('ROLLBACK');
    borrarArchivos(req.files);
    next(err);
  } finally {
    client.release();
  }
});

router.put('/:id', auth, permitir('propietario', 'admin'), upload.array('fotos', 10), async (req, res, next) => {
  const id = Number(req.params.id);
  const permiso = await puedeEditar(req, id).catch(next);
  if (!permiso) return;
  if (permiso.error) {
    borrarArchivos(req.files);
    return res.status(permiso.status).json({ error: permiso.error });
  }
  const { datos, error } = validar(req.body);
  if (error) {
    borrarArchivos(req.files);
    return res.status(400).json({ error });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE propiedades SET titulo = $1, descripcion = $2, barrio = $3, direccion = $4, precio = $5,
         expensas = $6, ambientes = $7, superficie = $8, mascotas = $9, lat = $10, lng = $11
       WHERE id = $12`,
      [datos.titulo, datos.descripcion, datos.barrio, datos.direccion, datos.precio, datos.expensas,
       datos.ambientes, datos.superficie, datos.mascotas, datos.lat, datos.lng, id]
    );

    const quitar = [].concat(req.body.quitarFotos || []).map(Number).filter(Boolean);
    if (quitar.length) {
      const { rows } = await client.query(
        'DELETE FROM fotos WHERE propiedad_id = $1 AND id = ANY($2) RETURNING url',
        [id, quitar]
      );
      for (const r of rows) fs.rm(path.join(UPLOADS_DIR, path.basename(r.url)), { force: true }, () => {});
    }

    const { rows: max } = await client.query(
      'SELECT COALESCE(MAX(orden), -1) AS m FROM fotos WHERE propiedad_id = $1', [id]
    );
    for (const [i, f] of (req.files || []).entries()) {
      await client.query('INSERT INTO fotos (propiedad_id, url, orden) VALUES ($1, $2, $3)', [
        id, `/uploads/${f.filename}`, max[0].m + 1 + i,
      ]);
    }
    await client.query('COMMIT');
    res.json(await obtenerPropiedad(id, req.usuario.id));
  } catch (err) {
    await client.query('ROLLBACK');
    borrarArchivos(req.files);
    next(err);
  } finally {
    client.release();
  }
});

router.delete('/:id', auth, permitir('propietario', 'admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const permiso = await puedeEditar(req, id);
    if (permiso.error) return res.status(permiso.status).json({ error: permiso.error });
    const { rows } = await query('SELECT url FROM fotos WHERE propiedad_id = $1', [id]);
    await query('DELETE FROM propiedades WHERE id = $1', [id]);
    for (const r of rows) fs.rm(path.join(UPLOADS_DIR, path.basename(r.url)), { force: true }, () => {});
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
