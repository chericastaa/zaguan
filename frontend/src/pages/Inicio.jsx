import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import PropiedadCard from '../components/PropiedadCard';
import { MapaPropiedades } from '../components/Mapa';

const CAMPOS = ['barrio', 'ambientes', 'precioMin', 'precioMax', 'mascotas', 'orden'];

const CATEGORIAS = [
  { icono: 'fa-city', texto: 'Todas', filtros: {} },
  { icono: 'fa-tree', texto: 'Palermo', filtros: { barrio: 'Palermo' } },
  { icono: 'fa-train-subway', texto: 'Belgrano', filtros: { barrio: 'Belgrano' } },
  { icono: 'fa-landmark', texto: 'Recoleta', filtros: { barrio: 'Recoleta' } },
  { icono: 'fa-tree-city', texto: 'Caballito', filtros: { barrio: 'Caballito' } },
  { icono: 'fa-guitar', texto: 'San Telmo', filtros: { barrio: 'San Telmo' } },
  { icono: 'fa-mug-hot', texto: 'Villa Crespo', filtros: { barrio: 'Villa Crespo' } },
  { icono: 'fa-paw', texto: 'Pet friendly', filtros: { mascotas: 'true' } },
  { icono: 'fa-bed', texto: 'Monoambientes', filtros: { ambientes: '1' } },
  { icono: 'fa-people-roof', texto: 'Familias', filtros: { ambientes: '4' } },
];

export default function Inicio() {
  const [params, setParams] = useSearchParams();
  const [barrios, setBarrios] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('lista');
  const [form, setForm] = useState(() => Object.fromEntries(CAMPOS.map((c) => [c, params.get(c) || ''])));

  useEffect(() => {
    api('/barrios').then(setBarrios).catch(() => {});
  }, []);

  useEffect(() => {
    setForm(Object.fromEntries(CAMPOS.map((c) => [c, params.get(c) || ''])));
    setCargando(true);
    setError('');
    api(`/propiedades?${params.toString()}`)
      .then(setPropiedades)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params]);

  const aplicar = (valores) => setParams(Object.fromEntries(Object.entries(valores).filter(([, v]) => v)));

  const cambiar = (e) => {
    const { name, value } = e.target;
    const nuevo = { ...form, [name]: value };
    setForm(nuevo);
    if (name === 'orden') aplicar(nuevo);
  };

  const buscar = (e) => {
    e.preventDefault();
    aplicar(form);
  };

  const categoriaActiva = (c) => {
    const claves = Object.keys(c.filtros);
    if (!claves.length) return CAMPOS.every((k) => k === 'orden' || !params.get(k));
    return claves.every((k) => params.get(k) === c.filtros[k]);
  };

  return (
    <div className="contenedor">
      <section className="portada">
        <div className="portada__fondos" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="portada__capa"></div>
        <div className="portada__contenido">
          <h1>Encontrá tu lugar en Buenos Aires</h1>
          <p>Departamentos, PH y casas en alquiler en todos los barrios de CABA.</p>

          <form className="buscador" onSubmit={buscar}>
            <div className="buscador__campo">
              <label htmlFor="barrio">Barrio</label>
              <select id="barrio" name="barrio" value={form.barrio} onChange={cambiar}>
                <option value="">Todos los barrios</option>
                {barrios.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="buscador__campo">
              <label htmlFor="ambientes">Ambientes</label>
              <select id="ambientes" name="ambientes" value={form.ambientes} onChange={cambiar}>
                <option value="">Cualquiera</option>
                <option value="1">Monoambiente</option>
                <option value="2">2 ambientes</option>
                <option value="3">3 ambientes</option>
                <option value="4">4 o más</option>
              </select>
            </div>
            <div className="buscador__campo">
              <label htmlFor="precioMin">Desde</label>
              <input id="precioMin" name="precioMin" type="number" min="0" step="10000" placeholder="$ mínimo" value={form.precioMin} onChange={cambiar} />
            </div>
            <div className="buscador__campo">
              <label htmlFor="precioMax">Hasta</label>
              <input id="precioMax" name="precioMax" type="number" min="0" step="10000" placeholder="$ máximo" value={form.precioMax} onChange={cambiar} />
            </div>
            <button className="buscador__boton" aria-label="Buscar">
              <i className="fa-solid fa-magnifying-glass"></i> Buscar
            </button>
          </form>
        </div>
      </section>

      <div className="barra-filtros">
        <div className="categorias">
          {CATEGORIAS.map((c) => (
            <button
              key={c.texto}
              className={`categoria ${categoriaActiva(c) ? 'categoria--activa' : ''}`}
              onClick={() => aplicar({ ...c.filtros, orden: form.orden })}
            >
              <i className={`fa-solid ${c.icono}`}></i>
              {c.texto}
            </button>
          ))}
        </div>
        <div className="filtros-extra">
          <label htmlFor="orden" className="oculto-visual">Ordenar</label>
          <select id="orden" name="orden" value={form.orden} onChange={cambiar}>
            <option value="">Más recientes</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
          </select>
        </div>
      </div>

      <section className="resultados">
        <div className="resultados__cabecera">
          <div>
            <h2>{cargando ? 'Buscando…' : `${propiedades.length} ${propiedades.length === 1 ? 'propiedad' : 'propiedades'}`}</h2>
            <p>{params.get('barrio') ? `Alquileres en ${params.get('barrio')}` : 'Alquileres en toda la ciudad'}</p>
          </div>
          <div className="conmutador">
            <button className={vista === 'lista' ? 'activo' : ''} onClick={() => setVista('lista')}>
              <i className="fa-solid fa-table-cells-large"></i> Lista
            </button>
            <button className={vista === 'mapa' ? 'activo' : ''} onClick={() => setVista('mapa')}>
              <i className="fa-regular fa-map"></i> Mapa
            </button>
          </div>
        </div>

        {error && <p className="alerta">{error}</p>}

        {!cargando && !error && propiedades.length === 0 && (
          <div className="vacio">
            <i className="fa-solid fa-house-circle-xmark"></i>
            <h3>No encontramos propiedades</h3>
            <p>Probá con otro barrio o ampliá tu presupuesto.</p>
            <button className="btn btn--borde" onClick={() => aplicar({})}>Ver todas</button>
          </div>
        )}

        {vista === 'mapa' ? (
          <MapaPropiedades propiedades={propiedades} alto />
        ) : (
          <div className="grilla">
            {propiedades.map((p) => <PropiedadCard key={p.id} propiedad={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
