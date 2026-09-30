import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, pesos } from '../api';
import { useAuth } from '../auth';
import { aDolares, useDolar } from '../hooks/useDolar';
import Carrusel from '../components/Carrusel';
import BotonFavorito from '../components/BotonFavorito';
import { MapaPropiedades } from '../components/Mapa';

export default function Detalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const dolar = useDolar();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/propiedades/${id}`).then(setP).catch((e) => setError(e.message));
  }, [id, usuario]);

  if (error) {
    return (
      <div className="contenedor pagina">
        <div className="vacio">
          <i className="fa-solid fa-house-circle-exclamation"></i>
          <h3>{error}</h3>
          <Link to="/" className="btn btn--oscuro">Volver a buscar</Link>
        </div>
      </div>
    );
  }
  if (!p) return <p className="cargando">Cargando…</p>;

  const esDuenio = usuario && (usuario.rol === 'admin' || usuario.id === p.propietario_id);
  const usd = aDolares(p.precio, dolar);

  const eliminar = async () => {
    if (!window.confirm('¿Seguro que querés eliminar esta propiedad?')) return;
    await api(`/propiedades/${p.id}`, { method: 'DELETE' });
    navigate('/mis-propiedades');
  };

  const caracteristicas = [
    ['Tipo', p.ambientes === 1 ? 'Monoambiente' : `Departamento de ${p.ambientes} ambientes`],
    ['Barrio', p.barrio],
    ['Dirección', p.direccion || 'A consultar'],
    ['Superficie', p.superficie ? `${p.superficie} m²` : 'Sin datos'],
    ['Alquiler mensual', pesos(p.precio)],
    ['Expensas', p.expensas ? pesos(p.expensas) : 'Sin expensas'],
    ['Mascotas', p.mascotas ? 'Se aceptan' : 'No se aceptan'],
    ['Publicado', new Date(p.creado_en).toLocaleDateString('es-AR')],
  ];

  return (
    <div className="contenedor detalle">
      <Link to="/" className="volver">
        <i className="fa-solid fa-chevron-left"></i> Volver a la búsqueda
      </Link>

      <div className="detalle__encabezado">
        <div>
          <h1>{p.titulo}</h1>
          <p>
            <i className="fa-solid fa-location-dot"></i> {[p.direccion, p.barrio, 'CABA'].filter(Boolean).join(', ')}
          </p>
        </div>
        <BotonFavorito propiedad={p} grande />
      </div>

      <Carrusel fotos={p.fotos} alt={p.titulo} grande />

      <div className="detalle__cuerpo">
        <div>
          <section className="detalle__seccion">
            <ul className="destacados">
              <li>
                <i className="fa-solid fa-door-open"></i>
                <div><strong>{p.ambientes === 1 ? 'Monoambiente' : `${p.ambientes} ambientes`}</strong><small>Distribución</small></div>
              </li>
              {p.superficie && (
                <li>
                  <i className="fa-solid fa-ruler-combined"></i>
                  <div><strong>{p.superficie} m²</strong><small>Superficie</small></div>
                </li>
              )}
              <li>
                <i className="fa-solid fa-paw"></i>
                <div><strong>{p.mascotas ? 'Pet friendly' : 'Sin mascotas'}</strong><small>Mascotas</small></div>
              </li>
            </ul>
          </section>

          {p.descripcion && (
            <section className="detalle__seccion">
              <h2>Sobre este lugar</h2>
              <p>{p.descripcion}</p>
            </section>
          )}

          <section className="detalle__seccion">
            <h2>Características</h2>
            <table className="tabla">
              <tbody>
                {caracteristicas.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {p.lat && p.lng && (
            <section className="detalle__seccion">
              <h2>Dónde vas a estar</h2>
              <MapaPropiedades propiedades={[p]} />
            </section>
          )}
        </div>

        <aside>
          <div className="panel-precio">
            <p className="panel-precio__monto">
              {pesos(p.precio)} <span>/mes</span>
            </p>
            {usd && (
              <span className="panel-precio__usd">
                <i className="fa-solid fa-dollar-sign"></i> ≈ {usd} al dólar blue
              </span>
            )}

            <ul className="panel-precio__desglose">
              <li><span>Alquiler</span><span>{pesos(p.precio)}</span></li>
              <li><span>Expensas</span><span>{pesos(p.expensas || 0)}</span></li>
              <li><span>Total mensual</span><span>{pesos(p.precio + (p.expensas || 0))}</span></li>
            </ul>

            <div className="anfitrion">
              <span className="avatar">{p.propietario_nombre[0]}</span>
              <div>
                <small>Publicado por</small>
                <strong>{p.propietario_nombre}</strong>
              </div>
            </div>

            {usuario ? (
              <a
                href={`mailto:${p.propietario_email}?subject=${encodeURIComponent(`Consulta por: ${p.titulo}`)}`}
                className="btn btn--primario btn--bloque"
              >
                <i className="fa-regular fa-envelope"></i> Contactar al propietario
              </a>
            ) : (
              <Link to="/login" state={{ desde: `/propiedades/${p.id}` }} className="btn btn--primario btn--bloque">
                Ingresá para contactar
              </Link>
            )}

            {esDuenio && (
              <div className="panel-precio__acciones">
                <Link to={`/propiedades/${p.id}/editar`} className="btn btn--borde">
                  <i className="fa-solid fa-pen"></i> Editar
                </Link>
                <button onClick={eliminar} className="btn btn--peligro">
                  <i className="fa-regular fa-trash-can"></i> Eliminar
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
