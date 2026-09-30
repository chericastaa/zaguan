import { useEffect, useState } from 'react';

let pedido = null;

function traerDolar() {
  if (!pedido) {
    pedido = fetch('https://dolarapi.com/v1/dolares/blue')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return pedido;
}

export function useDolar() {
  const [dolar, setDolar] = useState(null);
  useEffect(() => {
    traerDolar().then(setDolar);
  }, []);
  return dolar;
}

export const aDolares = (pesos, dolar) =>
  dolar?.venta ? `US$ ${Math.round(pesos / dolar.venta).toLocaleString('es-AR')}` : null;
