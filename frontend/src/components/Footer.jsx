import { Link } from 'react-router-dom';
import { useDolar } from '../hooks/useDolar';
import { pesos } from '../api';
import { Logo } from './Navbar';

const BARRIOS = ['Palermo', 'Belgrano', 'Recoleta', 'Caballito', 'Villa Crespo'];

export default function Footer() {
  const dolar = useDolar();

  return (
    <footer className="pie">
      <div className="contenedor">
        <div className="pie__columnas">
          <div>
            <Logo />
            <p>Alquileres en la Ciudad de Buenos Aires, con un asistente de IA que te ayuda a encontrar tu lugar.</p>
          </div>

          <div>
            <h4>Barrios populares</h4>
            <ul className="pie__lista">
              {BARRIOS.map((b) => (
                <li key={b}>
                  <Link to={`/?barrio=${encodeURIComponent(b)}`}>Alquileres en {b}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Zaguán</h4>
            <ul className="pie__lista">
              <li><Link to="/">Explorar propiedades</Link></li>
              <li><Link to="/registro">Publicá tu propiedad</Link></li>
              <li><Link to="/login">Ingresar</Link></li>
              <li><Link to="/favoritos">Mis favoritos</Link></li>
            </ul>
          </div>

          <div className="dolar">
            <h4><i className="fa-solid fa-money-bill-trend-up"></i> Dólar blue hoy</h4>
            {dolar ? (
              <>
                <div className="dolar__valores">
                  <div>
                    <small>Compra</small>
                    <strong>{pesos(dolar.compra)}</strong>
                  </div>
                  <div>
                    <small>Venta</small>
                    <strong>{pesos(dolar.venta)}</strong>
                  </div>
                </div>
                <p>Fuente: DolarApi.com · {new Date(dolar.fechaActualizacion).toLocaleString('es-AR')}</p>
              </>
            ) : (
              <p>No pudimos cargar la cotización.</p>
            )}
          </div>
        </div>

        <div className="pie__legal">
          <span>© {new Date().getFullYear()} Zaguán · Seminario de Profundización y Actualización · IFTS N°16</span>
          <div className="redes">
            <a href="https://github.com/chericastaa" target="_blank" rel="noreferrer" aria-label="GitHub">
              <i className="fa-brands fa-github"></i>
            </a>
            <a href="https://www.linkedin.com/in/cheri-castañeda" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
