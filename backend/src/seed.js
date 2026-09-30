import bcrypt from 'bcryptjs';
import { query } from './db.js';

const PROPIEDADES = [
  ['Luminoso 2 ambientes con balcón', 'Palermo', 'Gorriti 4800', 520000, 85000, 2, 48, true, -34.5889, -58.4306, 'Departamento al frente, muy luminoso, cocina integrada y balcón corrido. A dos cuadras de Plaza Serrano.'],
  ['Monoambiente a estrenar', 'Palermo', 'Soler 5600', 380000, 60000, 1, 30, false, -34.5801, -58.4352, 'Edificio nuevo con amenities: laundry, SUM y terraza con parrilla.'],
  ['3 ambientes con patio', 'Villa Crespo', 'Thames 300', 610000, 70000, 3, 72, true, -34.5941, -58.4344, 'PH al fondo con patio propio, ideal para mascotas. Cerca del subte B.'],
  ['2 ambientes reciclado', 'Almagro', 'Medrano 900', 430000, 55000, 2, 45, true, -34.6034, -58.4205, 'Reciclado a nuevo, pisos de madera, a una cuadra de Av. Corrientes.'],
  ['Semipiso con vista al río', 'Belgrano', 'Av. del Libertador 5500', 1150000, 220000, 4, 120, false, -34.5620, -58.4480, 'Semipiso con cochera, dependencia y vista abierta. Seguridad 24 h.'],
  ['2 ambientes cerca de Barrancas', 'Belgrano', 'Juramento 1900', 560000, 90000, 2, 50, true, -34.5610, -58.4540, 'Contrafrente silencioso, a tres cuadras de las Barrancas de Belgrano.'],
  ['Monoambiente para estudiantes', 'Recoleta', 'Uriburu 1100', 400000, 75000, 1, 28, false, -34.5930, -58.3990, 'A metros de la Facultad de Medicina y el subte D.'],
  ['3 ambientes clásico francés', 'Recoleta', 'Arenales 2100', 890000, 160000, 3, 95, false, -34.5935, -58.3960, 'Edificio de estilo francés, techos altos y molduras originales.'],
  ['Casa con terraza', 'Caballito', 'Rosario 700', 750000, 0, 4, 110, true, -34.6180, -58.4320, 'Casa de dos plantas con terraza y parrilla. Sin expensas.'],
  ['2 ambientes frente al Parque Centenario', 'Caballito', 'Av. Díaz Vélez 4800', 490000, 65000, 2, 46, true, -34.6060, -58.4370, 'Vista al parque, balcón y cocina separada.'],
  ['Loft en San Telmo', 'San Telmo', 'Defensa 900', 470000, 50000, 1, 55, true, -34.6195, -58.3718, 'Loft con doble altura en casona antigua, a metros de la feria de San Telmo.'],
  ['4 ambientes en Villa Urquiza', 'Villa Urquiza', 'Monroe 5000', 820000, 120000, 4, 98, true, -34.5740, -58.4870, 'Tres dormitorios, dos baños y balcón aterrazado. Cerca de la estación Urquiza.'],
  ['2 ambientes en Núñez', 'Núñez', 'Av. Cabildo 3400', 540000, 80000, 2, 47, false, -34.5500, -58.4640, 'A dos cuadras del subte D, con amenities y gimnasio.'],
  ['Monoambiente en Balvanera', 'Balvanera', 'Av. Rivadavia 2400', 330000, 45000, 1, 27, true, -34.6100, -58.4020, 'Económico y bien conectado, a una cuadra de Plaza Miserere.'],
];

const FOTOS = {
  'Luminoso 2 ambientes con balcón': ['1665249934445-1de680641f50', '1693585576674-2e1b7166f583', '1560448075-57d0285fc59b'],
  'Monoambiente a estrenar': ['1522708323590-d24dbb6b0267', '1585128792103-0b591f96512e', '1610527003928-47afd5f470c6'],
  '3 ambientes con patio': ['1711098256574-7b497260cdc9', '1612419299101-6c294dc2901d', '1630699375019-c334927264df'],
  '2 ambientes reciclado': ['1629042306558-7d1e15cc02fa', '1630699144418-6ca9059f9a44', '1630699293259-0b6c08606c62'],
  'Semipiso con vista al río': ['1672082497059-1e6c0209eeeb', '1650137938625-11576502aecd', '1771287491132-4954b32210d6'],
  '2 ambientes cerca de Barrancas': ['1600493505873-cddd69453072', '1649068559107-e5d936141e44', '1630699144641-72fa7a6b8aa1'],
  'Monoambiente para estudiantes': ['1652882860938-f90aa298e644', '1652882860902-7c6b0f88ef23', '1630699293875-e56c25151c4b'],
  '3 ambientes clásico francés': ['1630699144867-37acec97df5a', '1502672260266-1c1ef2d93688', '1560448075-cbc16bb4af8e'],
  'Casa con terraza': ['1646083329522-f2dce8ed4063', '1560440021-33f9b867899d', '1612320582827-a95ab2596dbc'],
  '2 ambientes frente al Parque Centenario': ['1663756915301-2ba688e078cf', '1755624222023-621f7718950b', '1612320583049-eabe3c21bd94'],
  'Loft en San Telmo': ['1783990349147-906f62b882c1', '1505873242700-f289a29e1e0f', '1767706508383-097054618007'],
  '4 ambientes en Villa Urquiza': ['1654506012740-09321c969dc2', '1643913586401-c7c0b0f1b352', '1662454419716-c4c504728811'],
  '2 ambientes en Núñez': ['1613575831056-0acd5da8f085', '1702014861736-d62834317c5e', '1630699376167-3870469e7598'],
  'Monoambiente en Balvanera': ['1531835551805-16d864c8d311', '1702014857653-dcea938d51f0', '1630699376331-7d70d7a3e417'],
};

const urlFoto = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

async function cargarFotosDePrueba() {
  const { rows } = await query(
    `SELECT p.id, p.titulo,
       COALESCE(array_agg(f.url ORDER BY f.orden) FILTER (WHERE f.url LIKE 'https://images.unsplash.com/%'), '{}') AS urls
     FROM propiedades p
     JOIN usuarios u ON u.id = p.propietario_id
     LEFT JOIN fotos f ON f.propiedad_id = p.id
     WHERE u.email = 'propietario@zaguan.com' AND p.titulo = ANY($1)
     GROUP BY p.id`,
    [Object.keys(FOTOS)]
  );
  for (const { id, titulo, urls } of rows) {
    const esperadas = FOTOS[titulo].map(urlFoto);
    if (urls.join() === esperadas.join()) continue;
    await query("DELETE FROM fotos WHERE propiedad_id = $1 AND url LIKE 'https://images.unsplash.com/%'", [id]);
    for (const [orden, url] of esperadas.entries()) {
      await query('INSERT INTO fotos (propiedad_id, url, orden) VALUES ($1, $2, $3)', [id, url, orden]);
    }
  }
}

export async function cargarDatosDePrueba() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM usuarios');
  if (rows[0].n > 0) return cargarFotosDePrueba();

  const hash = await bcrypt.hash('zaguan123', 10);
  const usuarios = await query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
       ('Admin Zaguán', 'admin@zaguan.com', $1, 'admin'),
       ('Laura Propietaria', 'propietario@zaguan.com', $1, 'propietario'),
       ('Tomás Inquilino', 'inquilino@zaguan.com', $1, 'inquilino')
     RETURNING id, rol`,
    [hash]
  );
  const propietarioId = usuarios.rows.find((u) => u.rol === 'propietario').id;

  for (const [titulo, barrio, direccion, precio, expensas, ambientes, superficie, mascotas, lat, lng, descripcion] of PROPIEDADES) {
    await query(
      `INSERT INTO propiedades (propietario_id, titulo, descripcion, barrio, direccion, precio, expensas, ambientes, superficie, mascotas, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [propietarioId, titulo, descripcion, barrio, direccion, precio, expensas, ambientes, superficie, mascotas, lat, lng]
    );
  }
  await cargarFotosDePrueba();
  console.log('Datos de prueba cargados (contraseña de los usuarios demo: zaguan123)');
}
