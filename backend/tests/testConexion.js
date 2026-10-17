import { pool } from '../src/arboles/db.js';

const { rows } = await pool.query('SELECT codigo, origen, destino FROM vuelos LIMIT 5');
console.log(rows);
await pool.end();