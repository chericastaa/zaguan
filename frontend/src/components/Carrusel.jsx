import { useRef, useState } from 'react';
import { SinFoto } from './Foto';

export default function Carrusel({ fotos = [], alt = '', grande = false, onCambio }) {
  const [rotas, setRotas] = useState([]);
  const [actual, setActual] = useState(0);
  const toque = useRef(null);

  const visibles = fotos.filter((f) => !rotas.includes(f.url));
  if (!visibles.length) return <SinFoto />;

  const indice = Math.min(actual, visibles.length - 1);

  const ir = (e, i) => {
    e?.preventDefault();
    e?.stopPropagation();
    const nuevo = (i + visibles.length) % visibles.length;
    setActual(nuevo);
    onCambio?.(nuevo);
  };

  const finToque = (e) => {
    if (toque.current === null) return;
    const dx = e.changedTouches[0].clientX - toque.current;
    if (Math.abs(dx) > 40) ir(null, indice + (dx < 0 ? 1 : -1));
    toque.current = null;
  };

  return (
    <div
      className={`carrusel ${grande ? 'carrusel--grande' : ''}`}
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={finToque}
    >
      <div className="carrusel__pista" style={{ transform: `translateX(-${indice * 100}%)` }}>
        {visibles.map((f, i) => (
          <img
            key={f.url}
            src={f.url}
            alt={`${alt} foto ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            onError={() => setRotas((r) => [...r, f.url])}
          />
        ))}
      </div>

      {visibles.length > 1 && (
        <>
          {indice > 0 && (
            <button className="carrusel__flecha carrusel__flecha--izq" onClick={(e) => ir(e, indice - 1)} aria-label="Foto anterior">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}
          {indice < visibles.length - 1 && (
            <button className="carrusel__flecha carrusel__flecha--der" onClick={(e) => ir(e, indice + 1)} aria-label="Foto siguiente">
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}
          <div className="carrusel__puntos">
            {visibles.map((f, i) => (
              <button
                key={f.url}
                className={i === indice ? 'activo' : ''}
                onClick={(e) => ir(e, i)}
                aria-label={`Ver foto ${i + 1}`}
              ></button>
            ))}
          </div>
          {grande && (
            <span className="carrusel__contador">
              {indice + 1} / {visibles.length}
            </span>
          )}
        </>
      )}
    </div>
  );
}
