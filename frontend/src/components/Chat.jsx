import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { MiniTarjeta } from './PropiedadCard';

const SUGERENCIAS = [
  'Un 2 ambientes en Palermo hasta 600 mil',
  'Algo que acepte mascotas en Caballito',
  'El monoambiente más barato',
];

const BIENVENIDA = {
  rol: 'asistente',
  texto: '¡Hola! Soy el asistente de Zaguán. Contame qué estás buscando: barrio, ambientes, presupuesto, si tenés mascota… y te recomiendo opciones.',
};

export default function Chat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([BIENVENIDA]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const fin = useRef(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, pensando, abierto]);

  const enviar = async (contenido) => {
    const limpio = contenido.trim();
    if (!limpio || pensando) return;
    const nuevos = [...mensajes, { rol: 'usuario', texto: limpio }];
    setMensajes(nuevos);
    setTexto('');
    setPensando(true);
    try {
      const historial = nuevos.slice(1).map(({ rol, texto }) => ({ rol, texto }));
      const data = await api('/chat', { method: 'POST', body: { mensajes: historial } });
      setMensajes((m) => [...m, { rol: 'asistente', texto: data.respuesta, propiedades: data.propiedades }]);
    } catch (err) {
      setMensajes((m) => [...m, { rol: 'asistente', texto: err.message, error: true }]);
    } finally {
      setPensando(false);
    }
  };

  return (
    <>
      {abierto && (
        <section className="chat" aria-label="Asistente con IA">
          <header className="chat__cabecera">
            <span className="avatar"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
            <div>
              <strong>Asistente Zaguán</strong>
              <small>En línea · IA</small>
            </div>
            <button className="icono-boton" onClick={() => setMensajes([BIENVENIDA])} title="Nueva charla" aria-label="Nueva charla">
              <i className="fa-solid fa-rotate-right"></i>
            </button>
            <button className="icono-boton" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>

          <div className="chat__mensajes">
            {mensajes.map((m, i) => (
              <div key={i} className="chat__resultados">
                <p className={`burbuja ${m.rol === 'usuario' ? 'burbuja--usuario' : ''} ${m.error ? 'burbuja--error' : ''}`}>
                  {m.texto}
                </p>
                {m.propiedades?.slice(0, 3).map((p) => (
                  <div key={p.id} onClick={() => setAbierto(false)}>
                    <MiniTarjeta propiedad={p} />
                  </div>
                ))}
              </div>
            ))}
            {mensajes.length === 1 && (
              <div className="chat__sugerencias">
                {SUGERENCIAS.map((s) => (
                  <button key={s} className="sugerencia" onClick={() => enviar(s)}>{s}</button>
                ))}
              </div>
            )}
            {pensando && <p className="burbuja burbuja--pensando">Buscando propiedades…</p>}
            <div ref={fin} />
          </div>

          <form
            className="chat__form"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
          >
            <label htmlFor="chat-texto" className="oculto-visual">Mensaje</label>
            <input
              id="chat-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej: 3 ambientes en Belgrano"
              maxLength={300}
              autoComplete="off"
            />
            <button disabled={pensando || !texto.trim()} aria-label="Enviar">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </section>
      )}

      <button className="chat-boton" onClick={() => setAbierto(!abierto)} aria-label="Asistente con IA">
        <i className={`fa-solid ${abierto ? 'fa-xmark' : 'fa-wand-magic-sparkles'}`}></i>
        <span>{abierto ? 'Cerrar' : 'Preguntale a la IA'}</span>
      </button>
    </>
  );
}
