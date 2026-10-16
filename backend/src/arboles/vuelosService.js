// Une las estructuras en memoria (AVL + Heap) con Postgres (Neon).
// Postgres es la persistencia; las búsquedas y la prioridad las resuelven los árboles.
import { pool } from './db.js';
import { AVLTree } from './estructuras/AVLTree.js';
import { MinHeap } from './estructuras/MinHeap.js';

const porCodigo = new AVLTree(); // clave: código de vuelo
const porSalida = new AVLTree(); // clave: fecha de salida ISO + código (permite búsqueda por rango)
const colaTorre = new MinHeap(
  (a, b) => a.prioridad - b.prioridad || a.creada_en - b.creada_en || a.id - b.id // menor prioridad primero; empate: el más antiguo
);

const claveSalida = (v) => `${new Date(v.salida).toISOString()}|${v.codigo}`;

function indexar(vuelo) {
  porCodigo.insertar(vuelo.codigo, vuelo);
  porSalida.insertar(claveSalida(vuelo), vuelo); // mismo objeto en ambos árboles
}

// ---------- Carga inicial (al arrancar el servidor) ----------
export async function cargarEstructuras() {
  porCodigo.limpiar();
  porSalida.limpiar();
  const { rows } = await pool.query('SELECT * FROM vuelos');
  rows.forEach(indexar);
  await cargarCola();
}

async function cargarCola() {
  colaTorre.limpiar();
  const { rows } = await pool.query(
    `SELECT s.id, s.tipo, s.prioridad, s.creada_en, v.codigo AS vuelo_codigo
       FROM solicitudes_torre s JOIN vuelos v ON v.id = s.vuelo_id
      WHERE s.estado = 'pendiente'`
  );
  rows.forEach((s) => colaTorre.insertar(s));
}

// ---------- Buscador (AVL) ----------
export const listarVuelos = () => porCodigo.enOrden();
export const buscarVuelo = (codigo) => porCodigo.buscar(codigo);
export const vuelosEntre = (desde, hasta) =>
  porSalida.rango(new Date(desde).toISOString(), new Date(hasta).toISOString() + '~'); // '~' incluye códigos de esa fecha exacta
export const arbolVuelos = () => porCodigo.aArbol();

export async function crearVuelo({ codigo, origen, destino, salida, llegada }) {
  const { rows } = await pool.query(
    `INSERT INTO vuelos (codigo, origen, destino, salida, llegada)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [codigo, origen, destino, salida, llegada]
  );
  indexar(rows[0]);
  return rows[0];
}

export async function eliminarVuelo(codigo) {
  const vuelo = porCodigo.buscar(codigo);
  if (!vuelo) return null;
  await pool.query('DELETE FROM vuelos WHERE codigo = $1', [codigo]);
  porCodigo.eliminar(codigo);
  porSalida.eliminar(claveSalida(vuelo));
  await cargarCola(); // el ON DELETE CASCADE pudo borrar solicitudes pendientes
  return vuelo;
}

// ---------- Torre de control (Heap) ----------
export const verCola = () => [...colaTorre.datos].sort(
  (a, b) => a.prioridad - b.prioridad || a.creada_en - b.creada_en || a.id - b.id
);
export const arbolCola = () => colaTorre.aArbol();

export async function solicitar(codigo, tipo, prioridad) {
  const vuelo = porCodigo.buscar(codigo);
  if (!vuelo) throw new Error(`El vuelo ${codigo} no existe`);
  const { rows } = await pool.query(
    `INSERT INTO solicitudes_torre (vuelo_id, tipo, prioridad)
     VALUES ($1, $2, $3) RETURNING id, tipo, prioridad, creada_en`,
    [vuelo.id, tipo, prioridad]
  );
  const solicitud = { ...rows[0], vuelo_codigo: codigo };
  colaTorre.insertar(solicitud);
  return solicitud;
}

// Atiende la solicitud de mayor prioridad. Las dos actualizaciones van en una TRANSACCIÓN.
export async function atenderSiguiente() {
  const sol = colaTorre.verMin();
  if (!sol) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("UPDATE solicitudes_torre SET estado = 'atendida' WHERE id = $1", [sol.id]);
    const nuevoEstado = sol.tipo === 'despegue' ? 'en_vuelo' : 'aterrizado';
    await client.query('UPDATE vuelos SET estado = $1 WHERE codigo = $2', [nuevoEstado, sol.vuelo_codigo]);
    await client.query('COMMIT');

    colaTorre.extraer(); // solo se saca del heap si la transacción fue exitosa
    const vuelo = porCodigo.buscar(sol.vuelo_codigo);
    if (vuelo) vuelo.estado = nuevoEstado;
    return { ...sol, nuevoEstado };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
