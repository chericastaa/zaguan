import { query } from './db.js';

const aNumero = (v) => {
  const n = Number(v);
  return v !== undefined && v !== null && v !== '' && Number.isFinite(n) ? n : null;
};

export async function buscarPropiedades(filtros = {}, usuarioId = null, limite = 60) {
  const where = [];
  const params = [];
  const agregar = (sql, valor) => {
    params.push(valor);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };

  if (filtros.barrio) agregar('unaccent_lower(p.barrio) = unaccent_lower(?)', filtros.barrio);
  if (aNumero(filtros.precioMin) !== null) agregar('p.precio >= ?', aNumero(filtros.precioMin));
  if (aNumero(filtros.precioMax) !== null) agregar('p.precio <= ?', aNumero(filtros.precioMax));
  if (aNumero(filtros.ambientes) !== null) {
    const amb = aNumero(filtros.ambientes);
    agregar(amb >= 4 ? 'p.ambientes >= ?' : 'p.ambientes = ?', amb);
  }
  if (filtros.mascotas === true || filtros.mascotas === 'true') where.push('p.mascotas = TRUE');
  if (aNumero(filtros.propietarioId) !== null) agregar('p.propietario_id = ?', aNumero(filtros.propietarioId));
  if (filtros.texto) {
    agregar("(p.titulo ILIKE '%' || ? || '%' OR p.descripcion ILIKE '%' || ? || '%')", filtros.texto);
  }

  const orden = {
    'precio-asc': 'p.precio ASC',
    'precio-desc': 'p.precio DESC',
  }[filtros.orden] || 'p.creado_en DESC';

  params.push(usuarioId);
  const favParam = `$${params.length}`;
  params.push(limite);

  const { rows } = await query(
    `SELECT p.*, u.nombre AS propietario_nombre,
       COALESCE((SELECT json_agg(json_build_object('id', f.id, 'url', f.url) ORDER BY f.orden, f.id)
                 FROM fotos f WHERE f.propiedad_id = p.id), '[]') AS fotos,
       EXISTS (SELECT 1 FROM favoritos fa WHERE fa.propiedad_id = p.id AND fa.usuario_id = ${favParam}) AS es_favorito
     FROM propiedades p
     JOIN usuarios u ON u.id = p.propietario_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY ${orden}
     LIMIT $${params.length}`,
    params
  );
  return rows.map(normalizar);
}

export async function obtenerPropiedad(id, usuarioId = null) {
  const { rows } = await query(
    `SELECT p.*, u.nombre AS propietario_nombre, u.email AS propietario_email,
       COALESCE((SELECT json_agg(json_build_object('id', f.id, 'url', f.url) ORDER BY f.orden, f.id)
                 FROM fotos f WHERE f.propiedad_id = p.id), '[]') AS fotos,
       EXISTS (SELECT 1 FROM favoritos fa WHERE fa.propiedad_id = p.id AND fa.usuario_id = $2) AS es_favorito
     FROM propiedades p
     JOIN usuarios u ON u.id = p.propietario_id
     WHERE p.id = $1`,
    [id, usuarioId]
  );
  return rows[0] ? normalizar(rows[0]) : null;
}

function normalizar(p) {
  return {
    ...p,
    lat: p.lat !== null ? Number(p.lat) : null,
    lng: p.lng !== null ? Number(p.lng) : null,
  };
}
