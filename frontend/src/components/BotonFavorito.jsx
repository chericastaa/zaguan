import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function BotonFavorito({ propiedad, onCambio, grande = false }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [activo, setActivo] = useState(propiedad.es_favorito);
  const [enviando, setEnviando] = useState(false);

  const alternar = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario) return navigate('/login');
    setEnviando(true);
    try {
      if (activo) await api(`/favoritos/${propiedad.id}`, { method: 'DELETE' });
      else await api('/favoritos', { method: 'POST', body: { propiedadId: propiedad.id } });
      setActivo(!activo);
      onCambio?.(!activo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <button
      onClick={alternar}
      disabled={enviando}
      aria-label={activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`favorito ${activo ? 'favorito--activo' : ''} ${grande ? 'favorito--grande' : ''}`}
    >
      <i className={`${activo ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
    </button>
  );
}
