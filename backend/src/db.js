import pg from "pg";

const { Pool } = pg;

let pool = null;

export function dbConectada() {
  return pool !== null;
}

export function query(texto, parametros) {
  return pool.query(texto, parametros);
}

export async function conectarDB() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL no está definida: la API corre solo en memoria");
    return;
  }

  pool = new Pool({ connectionString: url });
  await pool.query("SELECT 1"); // comprueba que la conexión funciona

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pasajeros (
      id_fila INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      vuelo TEXT NOT NULL,
      llegada TIMESTAMPTZ NOT NULL,
      estado TEXT NOT NULL DEFAULT 'en_fila'
        CHECK (estado IN ('en_fila', 'atendido'))
    )
  `);

  console.log("Conectado a PostgreSQL");
}