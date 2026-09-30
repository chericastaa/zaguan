import { Router } from 'express';
import { authOpcional } from '../middleware/auth.js';
import { buscarPropiedades } from '../busqueda.js';
import { BARRIOS } from '../barrios.js';

const router = Router();

const IA = {
  url: (process.env.AI_BASE_URL || '').replace(/\/$/, ''),
  modelo: process.env.AI_MODEL || 'qwen2.5:3b',
  key: process.env.AI_API_KEY || '',
};

const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function preguntarIA(mensajes, json = false) {
  const res = await fetch(`${IA.url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(IA.key && { Authorization: `Bearer ${IA.key}` }),
    },
    body: JSON.stringify({
      model: IA.modelo,
      messages: mensajes,
      temperature: json ? 0 : 0.6,
      ...(json && { response_format: { type: 'json_object' } }),
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`IA respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function parsearMonto(texto) {
  const m = texto.match(/([\d.,]+)\s*(mil|k|millon|millones|m)?\b/);
  if (!m) return null;
  let n = Number(m[1].replace(/\./g, '').replace(',', '.'));
  if (m[2] === 'mil' || m[2] === 'k') n *= 1000;
  if (m[2] && m[2].startsWith('millon')) n *= 1000000;
  if (m[2] === 'm' && n < 100) n *= 1000000;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function filtrosPorReglas(texto) {
  const t = sinTildes(texto);
  const filtros = {};

  const barrio = [...BARRIOS]
    .sort((a, b) => b.length - a.length)
    .find((b) => t.includes(sinTildes(b)));
  if (barrio) filtros.barrio = barrio;

  const amb = t.match(/(\d+|un|uno|dos|tres|cuatro)\s*(ambientes?|amb\b)/);
  if (amb) {
    const palabras = { un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4 };
    filtros.ambientes = palabras[amb[1]] || Number(amb[1]);
  } else if (/monoambiente/.test(t)) {
    filtros.ambientes = 1;
  }

  const hasta = t.match(/(?:hasta|maximo|menos de|no mas de|tope)\s*\$?\s*([\d.,]+\s*(?:mil|k|millones|millon|m)?)/);
  if (hasta) filtros.precioMax = parsearMonto(hasta[1]);
  const desde = t.match(/(?:desde|minimo|mas de)\s*\$?\s*([\d.,]+\s*(?:mil|k|millones|millon|m)?)/);
  if (desde) filtros.precioMin = parsearMonto(desde[1]);

  if (/mascota|perro|gato/.test(t)) filtros.mascotas = true;
  return filtros;
}

async function filtrosPorIA(historial) {
  const conversacion = historial.map((m) => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.texto}`).join('\n');
  const respuesta = await preguntarIA(
    [
      {
        role: 'system',
        content:
          'Extraés filtros de búsqueda de alquileres en CABA a partir de una conversación. ' +
          'Respondé SOLO un JSON con estas claves (usá null si no se mencionan): ' +
          '{"barrio": string|null, "precioMin": number|null, "precioMax": number|null, "ambientes": number|null, "mascotas": boolean|null}. ' +
          'Los precios son en pesos argentinos por mes, "500 mil" es 500000. ' +
          'Si el último mensaje cambia un filtro anterior, usá el valor nuevo. Si pide algo "más barato" bajá el precioMax un 20%. ' +
          `El barrio tiene que ser exactamente uno de esta lista: ${BARRIOS.join(', ')}.`,
      },
      { role: 'user', content: conversacion },
    ],
    true
  );
  const json = JSON.parse(respuesta.match(/\{[\s\S]*\}/)?.[0] || '{}');
  const filtros = {};
  if (BARRIOS.includes(json.barrio)) filtros.barrio = json.barrio;
  for (const k of ['precioMin', 'precioMax', 'ambientes']) {
    if (Number(json[k]) > 0) filtros[k] = Number(json[k]);
  }
  if (json.mascotas === true) filtros.mascotas = true;
  return filtros;
}

const pesos = (n) => `$${Number(n).toLocaleString('es-AR')}`;

function describirFiltros(f) {
  const partes = [];
  if (f.ambientes) partes.push(f.ambientes === 1 ? 'monoambiente' : `${f.ambientes} ambientes`);
  if (f.barrio) partes.push(`en ${f.barrio}`);
  if (f.precioMin) partes.push(`desde ${pesos(f.precioMin)}`);
  if (f.precioMax) partes.push(`hasta ${pesos(f.precioMax)}`);
  if (f.mascotas) partes.push('que acepte mascotas');
  return partes.join(' ');
}

function respuestaSimple(filtros, propiedades) {
  const busqueda = describirFiltros(filtros);
  if (!propiedades.length) {
    return `No encontré propiedades ${busqueda || 'con eso'}. Probá con otro barrio o subiendo un poco el precio.`;
  }
  const n = propiedades.length;
  return `Encontré ${n} ${n === 1 ? 'opción' : 'opciones'}${busqueda ? ` (${busqueda})` : ''}. Te las dejo acá abajo 👇`;
}

async function respuestaIA(historial, filtros, propiedades) {
  const resumen = propiedades.length
    ? propiedades
        .map((p) => `- ${p.titulo} (${p.barrio}, ${p.ambientes} amb, ${pesos(p.precio)}/mes${p.mascotas ? ', acepta mascotas' : ''})`)
        .join('\n')
    : 'Ninguna propiedad coincide.';
  return preguntarIA([
    {
      role: 'system',
      content:
        'Sos el asistente de Zaguán, una app de alquileres en CABA. Hablás en español rioplatense, cálido y breve (máximo 3 oraciones). ' +
        'Solo recomendás propiedades de la lista que te pasan, nunca inventes otras. ' +
        'Las tarjetas con las propiedades ya se muestran debajo de tu mensaje, así que no repitas todos los datos: destacá la más conveniente o por qué encajan. ' +
        'Si no hay resultados, sugerí cambiar barrio, precio o ambientes.',
    },
    ...historial.slice(-6).map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto })),
    {
      role: 'system',
      content: `Filtros entendidos: ${describirFiltros(filtros) || 'ninguno'}\nResultados:\n${resumen}`,
    },
  ]);
}

router.post('/', authOpcional, async (req, res, next) => {
  try {
    const historial = (Array.isArray(req.body.mensajes) ? req.body.mensajes : [])
      .filter((m) => m && typeof m.texto === 'string' && m.texto.trim())
      .slice(-10);
    const ultimo = historial.filter((m) => m.rol === 'usuario').at(-1);
    if (!ultimo) return res.status(400).json({ error: 'Escribí qué estás buscando' });

    let filtros;
    let usoIA = false;
    if (IA.url) {
      try {
        filtros = await filtrosPorIA(historial);
        usoIA = true;
      } catch (err) {
        console.error('Fallo la IA al extraer filtros:', err.message);
      }
    }
    if (!filtros) {
      filtros = historial
        .filter((m) => m.rol === 'usuario')
        .reduce((acc, m) => ({ ...acc, ...filtrosPorReglas(m.texto) }), {});
    }

    const propiedades = await buscarPropiedades({ ...filtros, orden: 'precio-asc' }, req.usuario?.id, 6);

    let respuesta = null;
    if (usoIA) {
      try {
        respuesta = await respuestaIA(historial, filtros, propiedades);
      } catch (err) {
        console.error('Fallo la IA al responder:', err.message);
      }
    }

    res.json({
      respuesta: respuesta || respuestaSimple(filtros, propiedades),
      filtros,
      propiedades,
      ia: Boolean(respuesta),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
