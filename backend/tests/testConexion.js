import { pool } from './db.js';

const { rows } = await pool.query('SELECT codigo, origen, destino FROM vuelos LIMIT 5');
console.log(rows);
await pool.end();