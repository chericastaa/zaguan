import { Router } from 'express';
import { authOpcional } from '../middleware/auth.js';
import { buscarPropiedades } from '../busqueda.js';
import { BARRIOS } from '../barrios.js';
import { GUIA, BARRIOS_INFO } from '../conocimiento.js';

const router = Router();

const IA = {
  url: (process.env.AI_BASE_URL || '').replace(/\/$/, ''),
  modelo: process.env.AI_MODEL || 'qwen2.5:1.5b',
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

async function analizarConIA(historial) {
  const conversacion = historial.map((m) => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.texto}`).join('\n');
  const respuesta = await preguntarIA(
    [
      {
        role: 'system',
        content:
          'Analizás una conversación de una app de alquileres en CABA. ' +
          'Respondé SOLO un JSON con estas claves: ' +
          '{"tipo": "busqueda"|"consulta"|"ambos"|"charla", "barrio": string|null, "precioMin": number|null, "precioMax": number|null, "ambientes": number|null, "mascotas": boolean|null}. ' +
          '"busqueda" si el último mensaje pide propiedades; "consulta" si hace una pregunta sobre alquilar, contratos, garantías o cómo es un barrio; ' +
          '"ambos" si pregunta algo y además pide propiedades; "charla" si es un saludo u otra cosa. ' +
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
  const tipo = ['busqueda', 'consulta', 'ambos', 'charla'].includes(json.tipo) ? json.tipo : 'busqueda';
  return { tipo, filtros };
}

const PREGUNTAS = [
  [/garant/, 'Las garantías más comunes son la propietaria (un familiar pone un inmueble a su nombre como respaldo) y el seguro de caución, que contratás con una aseguradora y se acepta casi en todos lados. Algunos propietarios también aceptan garantes con recibo de sueldo.'],
  [/requisit|que piden|papeles|documentacion/, 'Normalmente te piden DNI, comprobantes de ingresos y una garantía. Al firmar se suele pagar el primer mes por adelantado y un depósito de un mes.'],
  [/expensa/, 'Las expensas son los gastos del edificio. Las ordinarias suelen pagarlas el inquilino y las extraordinarias el propietario. Siempre preguntá cuánto son antes de decidir.'],
  [/comision/, 'En CABA hay una ley que dice que la comisión inmobiliaria la paga el propietario. Igual confirmalo con la inmobiliaria antes de firmar.'],
  [/contrato|duracion|aumento|actualiza/, 'Hoy la duración y la actualización del precio se acuerdan en el contrato. Si no se fija duración, para vivienda son 2 años. Leelo bien y ante dudas consultá con un abogado.'],
  [/deposito/, 'El depósito suele ser de un mes y te lo devuelven al terminar el contrato si el departamento queda bien. Sacale fotos el día que entrás.'],
];

function analizarPorReglas(historial) {
  const ultimo = sinTildes(historial.filter((m) => m.rol === 'usuario').at(-1).texto);
  const filtros = historial
    .filter((m) => m.rol === 'usuario')
    .reduce((acc, m) => ({ ...acc, ...filtrosPorReglas(m.texto) }), {});
  const pregunta = PREGUNTAS.find(([re]) => re.test(ultimo));
  const pideBarrio = /como es|que tal|vivir en/.test(ultimo) && filtros.barrio;
  if (pregunta || pideBarrio) {
    const texto = pregunta ? pregunta[1] : `${filtros.barrio}: ${BARRIOS_INFO[filtros.barrio] || 'es un barrio de CABA.'}`;
    return { tipo: pideBarrio ? 'ambos' : 'consulta', filtros, texto };
  }
  if (!Object.keys(filtrosPorReglas(ultimo)).length && !/busc|alquil|depto|departamento|propiedad|ambiente/.test(ultimo)) {
    return { tipo: 'charla', filtros };
  }
  return { tipo: 'busqueda', filtros };
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

function respuestaSimple(analisis, propiedades) {
  const { tipo, filtros, texto } = analisis;
  if (tipo === 'charla') {
    return '¡Hola! Puedo buscarte propiedades (por ejemplo "2 ambientes en Caballito hasta 600 mil") o responderte dudas sobre alquilar: garantías, requisitos, expensas o cómo es cada barrio.';
  }
  if (tipo === 'consulta') return texto;
  const busqueda = describirFiltros(filtros);
  const intro = texto ? `${texto}\n\n` : '';
  if (!propiedades.length) {
    return `${intro}No encontré propiedades ${busqueda || 'con eso'}. Probá con otro barrio o subiendo un poco el precio.`;
  }
  const n = propiedades.length;
  return `${intro}Encontré ${n} ${n === 1 ? 'opción' : 'opciones'}${busqueda ? ` (${busqueda})` : ''}. Te las dejo acá abajo 👇`;
}

async function respuestaIA(historial, analisis, propiedades) {
  const { tipo, filtros } = analisis;
  const conPropiedades = tipo === 'busqueda' || tipo === 'ambos';
  const resumen = propiedades.length
    ? propiedades
        .map((p) => `- ${p.titulo} (${p.barrio}, ${p.ambientes} amb, ${pesos(p.precio)}/mes${p.mascotas ? ', acepta mascotas' : ''})`)
        .join('\n')
    : 'Ninguna propiedad coincide.';
  const barrio = filtros.barrio && BARRIOS_INFO[filtros.barrio] ? `\n\nSOBRE ${filtros.barrio.toUpperCase()}: ${BARRIOS_INFO[filtros.barrio]}` : '';

  return preguntarIA([
    {
      role: 'system',
      content:
        'Sos el asistente de Zaguán, una app de alquileres en CABA. Hablás en español rioplatense, cálido y claro, en 2 a 5 oraciones. ' +
        'Ayudás a encontrar propiedades y respondés dudas sobre alquilar en Buenos Aires: requisitos, garantías, contratos, expensas y barrios. ' +
        'Usá la guía de abajo como fuente principal y no inventes datos legales, montos ni porcentajes. Si algo no está en la guía, respondé de forma general y sugerí confirmarlo. ' +
        'Si te preguntan algo que no tiene que ver con alquilar o vivir en CABA, respondé amablemente que solo podés ayudar con eso. ' +
        (conPropiedades
          ? 'Solo recomendás propiedades de la lista que te pasan, nunca inventes otras. Las tarjetas ya se muestran debajo de tu mensaje: no repitas todos los datos, destacá la más conveniente. Si no hay resultados, sugerí cambiar barrio, precio o ambientes.'
          : 'En esta respuesta no muestres ni inventes propiedades; al final podés ofrecer buscar opciones.') +
        `\n\nGUÍA DE ALQUILERES:\n${GUIA}${barrio}`,
    },
    ...historial.slice(-6).map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto })),
    ...(conPropiedades
      ? [{ role: 'system', content: `Filtros entendidos: ${describirFiltros(filtros) || 'ninguno'}\nResultados:\n${resumen}` }]
      : []),
  ]);
}

router.post('/', authOpcional, async (req, res, next) => {
  try {
    const historial = (Array.isArray(req.body.mensajes) ? req.body.mensajes : [])
      .filter((m) => m && typeof m.texto === 'string' && m.texto.trim())
      .slice(-10);
    const ultimo = historial.filter((m) => m.rol === 'usuario').at(-1);
    if (!ultimo) return res.status(400).json({ error: 'Escribí qué estás buscando' });

    let analisis = null;
    let usoIA = false;
    if (IA.url) {
      try {
        analisis = await analizarConIA(historial);
        usoIA = true;
      } catch (err) {
        console.error('Fallo la IA al analizar:', err.message);
      }
    }
    if (!analisis) analisis = analizarPorReglas(historial);

    const conPropiedades = analisis.tipo === 'busqueda' || analisis.tipo === 'ambos';
    const propiedades = conPropiedades
      ? await buscarPropiedades({ ...analisis.filtros, orden: 'precio-asc' }, req.usuario?.id, 6)
      : [];

    let respuesta = null;
    if (usoIA) {
      try {
        respuesta = await respuestaIA(historial, analisis, propiedades);
      } catch (err) {
        console.error('Fallo la IA al responder:', err.message);
      }
    }

    res.json({
      respuesta: respuesta || respuestaSimple(analisis, propiedades),
      tipo: analisis.tipo,
      filtros: analisis.filtros,
      propiedades,
      ia: Boolean(respuesta),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
