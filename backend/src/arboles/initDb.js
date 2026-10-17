// Ejecuta sql/schema.sql contra Neon: npm run db:init
import { readFileSync } from 'node:fs';
import { pool } from './db.js';

const sql = readFileSync(new URL('../../sql/schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('Tablas creadas y datos de ejemplo cargados.');
await pool.end();
