import { Link } from 'react-router-dom';
import { pesos } from '../api';
import { aDolares, useDolar } from '../hooks/useDolar';
import { Imagen } from './Foto';
import BotonFavorito from './BotonFavorito';
import Carrusel from './Carrusel';

const ambientes = (n) => (n === 1 ? 'Monoambiente' : `${n} ambientes`);

export function MiniTarjeta({ propiedad: p }) {
  return (
    <Link to={`/propiedades/${p.id}`} className="mini-tarjeta">
      <div className="mini-tarjeta__foto">
        <Imagen src={p.fotos?.[0]?.url} alt={p.titulo} />
      </div>
      <div>
        <strong>{pesos(p.precio)}</strong>
        <span>{p.titulo}</span>
        <span>
          {p.barrio} · {ambientes(p.ambientes)}
          {p.mascotas && ' · '}
          {p.mascotas && <i className="fa-solid fa-paw"></i>}
        </span>
      </div>
    </Link>
  );
}

export default function PropiedadCard({ propiedad: p, onFavorito }) {
  const dolar = useDolar();
  const usd = aDolares(p.precio, dolar);

  return (
    <Link to={`/propiedades/${p.id}`} className="tarjeta">
      <div className="tarjeta__foto">
        <Carrusel fotos={p.fotos} alt={p.titulo} />
        {p.mascotas && (
          <span className="tarjeta__etiqueta">
            <i className="fa-solid fa-paw"></i> Pet friendly
          </span>
        )}
        <BotonFavorito propiedad={p} onCambio={onFavorito} />
      </div>
      <div className="tarjeta__cuerpo">
        <h3>{p.barrio}, CABA</h3>
        <p>{p.titulo}</p>
        <p>
          {ambientes(p.ambientes)}
          {p.superficie ? ` · ${p.superficie} m²` : ''}
        </p>
        <p className="tarjeta__precio">
          <strong>{pesos(p.precio)}</strong> /mes
        </p>
        {usd && <span className="tarjeta__usd">≈ {usd}</span>}
      </div>
    </Link>
  );
}
