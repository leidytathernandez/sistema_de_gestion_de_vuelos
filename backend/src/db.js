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
  await pool.query("SELECT 1"); // Comprueba conexión a Neon

  // 1. Tabla de aeropuertos (Vértices del Grafo)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS aeropuertos (
      codigo VARCHAR(3) PRIMARY KEY,
      nombre TEXT NOT NULL,
      ciudad TEXT,
      pais TEXT
    )
  `);

  // 2. Tabla de rutas aéreas (Aristas del Grafo)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rutas (
      id SERIAL PRIMARY KEY,
      origen VARCHAR(3) NOT NULL,
      destino VARCHAR(3) NOT NULL,
      distancia INTEGER NOT NULL,
      precio NUMERIC(10, 2) DEFAULT 0,
      duracion INTEGER DEFAULT 0,
      aerolinea VARCHAR(100) DEFAULT 'Genérica',
      vuelo VARCHAR(50)
    )
  `);

  console.log("Conectado exitosamente a PostgreSQL en Neon");
}
