import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { MapaSelector } from '../components/Mapa';

const VACIO = {
  titulo: '', descripcion: '', barrio: '', direccion: '', precio: '', expensas: '',
  ambientes: '2', superficie: '', mascotas: false, lat: null, lng: null,
};

export default function Publicar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(VACIO);
  const [barrios, setBarrios] = useState([]);
  const [fotosActuales, setFotosActuales] = useState([]);
  const [quitar, setQuitar] = useState([]);
  const [nuevas, setNuevas] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api('/barrios').then(setBarrios);
    if (id) {
      api(`/propiedades/${id}`).then((p) => {
        setForm(Object.fromEntries(Object.keys(VACIO).map((k) => [k, p[k] ?? VACIO[k]])));
        setFotosActuales(p.fotos);
      });
    }
  }, [id]);

  const previews = useRef([]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const agregarFotos = (e) => {
    const archivos = [...e.target.files].map((file) => ({ file, preview: URL.createObjectURL(file) }));
    previews.current.push(...archivos.map((a) => a.preview));
    setNuevas((n) => [...n, ...archivos].slice(0, 10));
    e.target.value = '';
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const datos = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== null && v !== '' && datos.append(k, v));
    nuevas.forEach((f) => datos.append('fotos', f.file));
    quitar.forEach((fid) => datos.append('quitarFotos', fid));
    try {
      const p = await api(id ? `/propiedades/${id}` : '/propiedades', { method: id ? 'PUT' : 'POST', form: datos });
      navigate(`/propiedades/${p.id}`);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="contenedor pagina">
      <div className="formulario">
        <div className="pagina__cabecera">
          <div>
            <h1>{id ? 'Editar propiedad' : 'Publicá tu propiedad'}</h1>
            <p>Completá los datos y sumá fotos para que se destaque.</p>
          </div>
        </div>

        {error && <p className="alerta">{error}</p>}

        <form onSubmit={enviar} className="formulario">
          <section className="bloque">
            <h2><i className="fa-solid fa-house"></i> Datos principales</h2>
            <div className="grid-campos">
              <div className="campo completo">
                <label htmlFor="titulo">Título</label>
                <input id="titulo" name="titulo" required maxLength={150} value={form.titulo} onChange={cambiar} placeholder="Ej: 2 ambientes luminoso con balcón" />
              </div>
              <div className="campo">
                <label htmlFor="barrio">Barrio</label>
                <select id="barrio" name="barrio" required value={form.barrio} onChange={cambiar}>
                  <option value="">Elegí un barrio</option>
                  {barrios.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="direccion">Dirección</label>
                <input id="direccion" name="direccion" value={form.direccion} onChange={cambiar} placeholder="Calle y altura" />
              </div>
              <div className="campo">
                <label htmlFor="precio">Alquiler mensual ($)</label>
                <input id="precio" name="precio" type="number" min="1" required value={form.precio} onChange={cambiar} />
              </div>
              <div className="campo">
                <label htmlFor="expensas">Expensas ($)</label>
                <input id="expensas" name="expensas" type="number" min="0" value={form.expensas} onChange={cambiar} />
              </div>
              <div className="campo">
                <label htmlFor="ambientes">Ambientes</label>
                <input id="ambientes" name="ambientes" type="number" min="1" max="20" required value={form.ambientes} onChange={cambiar} />
              </div>
              <div className="campo">
                <label htmlFor="superficie">Superficie (m²)</label>
                <input id="superficie" name="superficie" type="number" min="1" value={form.superficie} onChange={cambiar} />
              </div>
              <label className="check completo">
                <input type="checkbox" name="mascotas" checked={form.mascotas} onChange={cambiar} />
                Acepta mascotas
              </label>
              <div className="campo completo">
                <label htmlFor="descripcion">Descripción</label>
                <textarea id="descripcion" name="descripcion" rows={5} value={form.descripcion} onChange={cambiar} />
              </div>
            </div>
          </section>

          <section className="bloque">
            <h2><i className="fa-regular fa-images"></i> Fotos</h2>
            <p>Hasta 10 fotos JPG, PNG o WEBP de 5 MB cada una.</p>
            <div className="fotos-grid">
              {fotosActuales.filter((f) => !quitar.includes(f.id)).map((f) => (
                <div key={f.id} className="foto-mini">
                  <img src={f.url} alt="" />
                  <button type="button" className="foto-mini__quitar" onClick={() => setQuitar([...quitar, f.id])} aria-label="Quitar foto">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
              {nuevas.map((f, i) => (
                <div key={f.preview} className="foto-mini foto-mini--nueva">
                  <img src={f.preview} alt="" />
                  <button type="button" className="foto-mini__quitar" onClick={() => setNuevas(nuevas.filter((_, j) => j !== i))} aria-label="Quitar foto">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
              <label className="foto-agregar">
                <i className="fa-solid fa-camera"></i>
                Agregar
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={agregarFotos} hidden />
              </label>
            </div>
          </section>

          <section className="bloque">
            <h2><i className="fa-solid fa-map-location-dot"></i> Ubicación</h2>
            <p>Hacé click en el mapa para marcar dónde está la propiedad.</p>
            <MapaSelector valor={form} onElegir={({ lat, lng }) => setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))} />
          </section>

          <div className="formulario__acciones">
            <button type="button" onClick={() => navigate(-1)} className="btn btn--borde">Cancelar</button>
            <button className="btn btn--primario" disabled={enviando}>
              {enviando ? 'Guardando…' : id ? 'Guardar cambios' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
