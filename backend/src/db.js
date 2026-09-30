import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://zaguan:zaguan@localhost:5432/zaguan',
});

export const query = (text, params) => pool.query(text, params);

export async function esperarBase(intentos = 20) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (i === intentos) throw err;
      console.log(`Esperando la base de datos (${i}/${intentos})...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function crearTablas() {
  const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await pool.query(sql);
}
