# Zaguán · Frontend

Interfaz de Zaguán, una app de alquileres en CABA. Toma como referencia la estética de los portales de alquiler temporario (buscador en forma de píldora, categorías con íconos, tarjetas con foto grande) y la adapta a alquileres tradicionales en Buenos Aires.

![Vista de Zaguán](public/img/sample.png)

## Tecnologías

- React + Vite + React Router
- CSS propio en `src/css/styles.css`, sin frameworks
- Font Awesome para los íconos
- Google Fonts: Plus Jakarta Sans y Fraunces
- Leaflet + OpenStreetMap para los mapas
- API REST pública: [DolarApi](https://dolarapi.com) para mostrar la cotización del dólar blue y el precio aproximado en dólares de cada propiedad

## Estructura

```
frontend/
├── index.html
├── public/
│   └── img/
│       ├── logo.svg
│       ├── icon.svg
│       └── sample.png
└── src/
    ├── css/
    │   └── styles.css
    ├── components/
    ├── pages/
    ├── hooks/
    │   └── useDolar.js
    ├── api.js
    ├── auth.jsx
    ├── App.jsx
    └── main.jsx
```

## Qué pide la consigna y dónde está

| Requisito | Dónde |
|---|---|
| Flex y grid | Cabecera, buscador y tarjetas con flex. Grilla de propiedades, galería y pie con grid |
| Unidades relativas | Contenedor con `width: 90%`, alturas en `px`/`vh`, tipografía en `rem` que se achica en mobile |
| Box model | Márgenes, bordes y padding en tarjetas, paneles y formularios |
| Centrado | `margin: 0 auto` en `.contenedor`, `text-align: center` en la portada y flex en los botones |
| Fuentes | Plus Jakarta Sans para el texto y Fraunces para los títulos |
| Íconos | Font Awesome en el menú, categorías, botones, chat y pie |
| Pseudoclases de enlaces | `a:link`, `a:visited`, `a:hover`, `a:active` en ajustes generales |
| Combinadores | Descendiente (`.campo input`, `.tarjeta:hover h3`) y directo (`.app > main`, `.campo > label`, `.vacio > .btn`) |
| Menú con lista | `<nav>` con `<ul class="menu__lista">` horizontal y `list-style-type: none` |
| Tabla con filas alternadas | Tabla de características en el detalle con `tr:nth-child(even)` y `tr:nth-child(odd)` |
| z-index | Texto de la portada encima de la foto, cabecera fija, corazón y flechas sobre el carrusel, y chat |
| Opacidad | Capa oscura de la portada (`opacity: 0.5`), flechas y puntos del carrusel |
| Responsive | Cuatro media queries: 1080px, 768px, 480px y 375px |
| API REST pública | `src/hooks/useDolar.js` consume DolarApi |
| Deploy | Corre en Linux con Docker y Nginx (ver README principal) |

## Correrlo en desarrollo

```bash
npm install
npm run dev
```

Queda en http://localhost:5173 y le pasa las llamadas `/api` al back en el puerto 3000.
