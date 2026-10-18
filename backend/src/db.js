import pg from "pg";

const { Pool } = pg;

export let pool = null;

export function dbConectada() {
  return pool !== null;
}

export function query(texto, parametros) {
  if (!pool) throw new Error("Base de datos no inicializada");
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

  // 1. Tabla de aeropuertos (Grafo - Juan)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS aeropuertos (
      codigo VARCHAR(10) PRIMARY KEY,
      nombre TEXT NOT NULL,
      ciudad TEXT,
      pais TEXT
    )
  `);

  // 2. Tabla de rutas aéreas (Grafo - Juan)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rutas (
      id SERIAL PRIMARY KEY,
      origen VARCHAR(10) NOT NULL,
      destino VARCHAR(10) NOT NULL,
      distancia INTEGER NOT NULL,
      precio NUMERIC(10, 2) DEFAULT 0,
      duracion INTEGER DEFAULT 0,
      aerolinea VARCHAR(100) DEFAULT 'Genérica',
      vuelo VARCHAR(50)
    )
  `);

  // 3. Tabla de pasajeros (Cola / Pila - Leidy)
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

  // 4. Tabla de vuelos (Árbol AVL - Carlos)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vuelos (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(10) UNIQUE NOT NULL,
      origen VARCHAR(60) NOT NULL,
      destino VARCHAR(60) NOT NULL,
      salida TIMESTAMPTZ NOT NULL,
      llegada TIMESTAMPTZ NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'programado'
    )
  `);

  // 5. Tabla solicitudes_torre (Min-Heap - Carlos)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_torre (
      id SERIAL PRIMARY KEY,
      vuelo_id INT NOT NULL REFERENCES vuelos(id) ON DELETE CASCADE,
      tipo VARCHAR(12) NOT NULL CHECK (tipo IN ('despegue', 'aterrizaje')),
      prioridad SMALLINT NOT NULL CHECK (prioridad BETWEEN 1 AND 3),
      estado VARCHAR(12) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida')),
      creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Sembramos datos de ejemplo para vuelos si está vacía
  const { rows: vuelosExistentes } = await pool.query("SELECT COUNT(*) FROM vuelos");
  if (parseInt(vuelosExistentes[0].count, 10) === 0) {
    await pool.query(`
      INSERT INTO vuelos (codigo, origen, destino, salida, llegada) VALUES
      ('AV101', 'Cali',     'Bogotá',    '2026-11-01 08:00-05'::timestamptz, '2026-11-01 09:00-05'::timestamptz),
      ('AV205', 'Bogotá',   'Medellín',  '2026-11-01 10:30-05'::timestamptz, '2026-11-01 11:30-05'::timestamptz),
      ('LA330', 'Cali',     'Cartagena', '2026-11-01 07:15-05'::timestamptz, '2026-11-01 08:55-05'::timestamptz),
      ('AV412', 'Medellín', 'Cali',      '2026-11-01 14:00-05'::timestamptz, '2026-11-01 15:00-05'::timestamptz),
      ('LA518', 'Bogotá',   'Cali',      '2026-11-01 12:45-05'::timestamptz, '2026-11-01 13:45-05'::timestamptz),
      ('AV609', 'Cali',     'Pereira',   '2026-11-01 17:20-05'::timestamptz, '2026-11-01 18:00-05'::timestamptz)
    `);
    console.log("Vuelos semilla insertados en PostgreSQL.");
  }

  console.log("Conectado exitosamente a PostgreSQL en Neon (Esquema unificado)");
}
