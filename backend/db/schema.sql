CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('inquilino', 'propietario', 'admin')),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS propiedades (
  id SERIAL PRIMARY KEY,
  propietario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  barrio VARCHAR(60) NOT NULL,
  direccion VARCHAR(150),
  precio INTEGER NOT NULL CHECK (precio > 0),
  expensas INTEGER NOT NULL DEFAULT 0,
  ambientes INTEGER NOT NULL CHECK (ambientes > 0),
  superficie INTEGER,
  mascotas BOOLEAN NOT NULL DEFAULT FALSE,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fotos (
  id SERIAL PRIMARY KEY,
  propiedad_id INTEGER NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  propiedad_id INTEGER NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, propiedad_id)
);

CREATE OR REPLACE FUNCTION unaccent_lower(t TEXT) RETURNS TEXT AS $$
  SELECT translate(lower(t), 'áéíóúüñ', 'aeiouun')
$$ LANGUAGE SQL IMMUTABLE;

CREATE INDEX IF NOT EXISTS idx_propiedades_barrio ON propiedades (barrio);
CREATE INDEX IF NOT EXISTS idx_propiedades_precio ON propiedades (precio);
