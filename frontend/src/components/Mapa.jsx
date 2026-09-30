import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { pesos } from '../api';

const CENTRO_CABA = [-34.6037, -58.4416];

const pin = L.divIcon({
  className: '',
  html: '<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#e4573d"/><circle cx="15" cy="15" r="6" fill="#ffffff"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

function Capa() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

export function MapaPropiedades({ propiedades, alto = false }) {
  const conUbicacion = propiedades.filter((p) => p.lat && p.lng);
  const centro = conUbicacion.length === 1 ? [conUbicacion[0].lat, conUbicacion[0].lng] : CENTRO_CABA;
  return (
    <MapContainer center={centro} zoom={conUbicacion.length === 1 ? 15 : 12} scrollWheelZoom={false} className={`mapa ${alto ? 'mapa--alto' : ''}`}>
      <Capa />
      {conUbicacion.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pin}>
          <Popup>
            <Link to={`/propiedades/${p.id}`}><strong>{p.titulo}</strong></Link>
            <br />
            {pesos(p.precio)}/mes
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function Clicks({ onElegir }) {
  useMapEvents({ click: (e) => onElegir({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export function MapaSelector({ valor, onElegir }) {
  const tiene = valor?.lat && valor?.lng;
  return (
    <MapContainer center={tiene ? [valor.lat, valor.lng] : CENTRO_CABA} zoom={tiene ? 15 : 12} className="mapa mapa--chico">
      <Capa />
      <Clicks onElegir={onElegir} />
      {tiene && <Marker position={[valor.lat, valor.lng]} icon={pin} />}
    </MapContainer>
  );
}
