import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { esperarBase, crearTablas } from './db.js';
import { cargarDatosDePrueba } from './seed.js';
import { BARRIOS } from './barrios.js';
import authRoutes from './routes/auth.js';
import propiedadesRoutes, { UPLOADS_DIR } from './routes/propiedades.js';
import favoritosRoutes from './routes/favoritos.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

app.get('/api/salud', (req, res) => res.json({ ok: true }));
app.get('/api/barrios', (req, res) => res.json(BARRIOS));
app.use('/api/auth', authRoutes);
app.use('/api/propiedades', propiedadesRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const mensajes = {
      LIMIT_FILE_SIZE: 'Cada foto puede pesar hasta 5 MB',
      LIMIT_FILE_COUNT: 'Podés subir hasta 10 fotos',
    };
    return res.status(400).json({ error: mensajes[err.code] || err.message });
  }
  if (err.message?.startsWith('Solo se aceptan')) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

await esperarBase();
await crearTablas();
if (process.env.SEED !== 'false') await cargarDatosDePrueba();

app.listen(PORT, () => console.log(`API de Zaguán escuchando en el puerto ${PORT}`));
