import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import PropiedadCard from '../components/PropiedadCard';

function Lista({ titulo, subtitulo, ruta, vacio, accion, quitarAlDesmarcar }) {
  const [propiedades, setPropiedades] = useState(null);

  useEffect(() => {
    api(ruta).then(setPropiedades).catch(() => setPropiedades([]));
  }, [ruta]);

  return (
    <div className="contenedor pagina">
      <div className="pagina__cabecera">
        <div>
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
        </div>
        {accion}
      </div>
      {propiedades === null && <p className="cargando">Cargando…</p>}
      {propiedades?.length === 0 && <div className="vacio">{vacio}</div>}
      <div className="grilla">
        {propiedades?.map((p) => (
          <PropiedadCard
            key={p.id}
            propiedad={p}
            onFavorito={(activo) => quitarAlDesmarcar && !activo && setPropiedades((ps) => ps.filter((x) => x.id !== p.id))}
          />
        ))}
      </div>
    </div>
  );
}

export function Favoritos() {
  return (
    <Lista
      titulo="Favoritos"
      subtitulo="Las propiedades que guardaste para ver después."
      ruta="/favoritos"
      quitarAlDesmarcar
      vacio={
        <>
          <i className="fa-regular fa-heart"></i>
          <h3>Todavía no guardaste propiedades</h3>
          <p>Tocá el corazón de una publicación para guardarla acá.</p>
          <Link to="/" className="btn btn--oscuro">Empezar a buscar</Link>
        </>
      }
    />
  );
}

export function MisPropiedades() {
  const { usuario } = useAuth();
  const admin = usuario.rol === 'admin';
  return (
    <Lista
      titulo={admin ? 'Todas las publicaciones' : 'Mis propiedades'}
      subtitulo={admin ? 'Como admin podés editar o dar de baja cualquier publicación.' : 'Administrá lo que tenés publicado.'}
      ruta={admin ? '/propiedades' : '/propiedades?mias=true'}
      accion={
        <Link to="/publicar" className="btn btn--primario">
          <i className="fa-solid fa-plus"></i> Publicar propiedad
        </Link>
      }
      vacio={
        <>
          <i className="fa-solid fa-house-chimney"></i>
          <h3>Todavía no publicaste nada</h3>
          <p>Subí tu primera propiedad con fotos en un par de minutos.</p>
        </>
      }
    />
  );
}
