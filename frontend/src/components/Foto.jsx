import { useState } from 'react';

export function SinFoto() {
  return (
    <div className="sin-foto">
      <i className="fa-regular fa-image"></i>
      Sin fotos
    </div>
  );
}

export function Imagen({ src, alt = '' }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return <SinFoto />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setRota(true)} />;
}
