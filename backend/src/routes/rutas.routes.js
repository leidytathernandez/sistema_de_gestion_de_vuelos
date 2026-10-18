import { Router } from "express";
import {
  obtenerRed,
  obtenerAeropuertos,
  obtenerAeropuerto,
  agregarAeropuerto,
  obtenerRutas,
  agregarRuta,
  eliminarRuta,
  calcularRutaMasCorta,
  buscarRutasConEscalas,
  obtenerEstadisticasRed,
  reiniciarRed,
} from "../services/rutas.service.js";
import { dbConectada, query } from "../db.js";

const router = Router();

/**
 * GET /api/rutas
 * Obtiene la topología completa de la red de rutas aéreas
 */
router.get("/", (req, res) => {
  try {
    const red = obtenerRed();
    res.json(red);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rutas/listado
 * Obtiene la lista plana de todas las rutas aéreas directas
 */
router.get("/listado", (req, res) => {
  try {
    const rutas = obtenerRutas();
    res.json(rutas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rutas/aeropuertos
 * Obtiene todos los aeropuertos registrados en el grafo
 */
router.get("/aeropuertos", (req, res) => {
  try {
    const aeropuertos = obtenerAeropuertos();
    res.json(aeropuertos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rutas/aeropuertos/:codigo
 * Obtiene los detalles de un aeropuerto por código IATA
 */
router.get("/aeropuertos/:codigo", (req, res) => {
  try {
    const { codigo } = req.params;
    const aeropuerto = obtenerAeropuerto(codigo);
    if (!aeropuerto) {
      return res.status(404).json({ error: `Aeropuerto '${codigo}' no encontrado.` });
    }
    res.json(aeropuerto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rutas/aeropuertos
 * Registra un nuevo aeropuerto (vértice)
 * Si hay base de datos conectada, persiste con consulta parametrizada
 */
router.post("/aeropuertos", async (req, res) => {
  try {
    const { codigo, nombre, ciudad, pais } = req.body ?? {};
    if (!codigo || !nombre) {
      return res.status(400).json({ error: "codigo y nombre son obligatorios." });
    }
    const nuevo = agregarAeropuerto({ codigo, nombre, ciudad, pais });

    if (dbConectada()) {
      await query(
        `INSERT INTO aeropuertos (codigo, nombre, ciudad, pais)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (codigo) DO UPDATE
         SET nombre = EXCLUDED.nombre, ciudad = EXCLUDED.ciudad, pais = EXCLUDED.pais`,
        [nuevo.id, nuevo.nombre, nuevo.ciudad || null, nuevo.pais || null]
      );
    }

    res.status(201).json({ mensaje: "Aeropuerto registrado con éxito", aeropuerto: nuevo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/rutas
 * Registra una nueva conexión aérea (arista)
 * Si hay base de datos conectada, persiste con consulta parametrizada ($1, $2, ...)
 */
router.post("/", async (req, res) => {
  try {
    const { origen, destino, distancia, precio, duracion, aerolinea, vuelo, bidireccional } = req.body ?? {};
    if (!origen || !destino || distancia === undefined) {
      return res.status(400).json({ error: "origen, destino y distancia son obligatorios." });
    }

    const nuevaRuta = agregarRuta({
      origen,
      destino,
      distancia,
      precio,
      duracion,
      aerolinea,
      vuelo,
      bidireccional,
    });

    if (dbConectada()) {
      await query(
        `INSERT INTO rutas (origen, destino, distancia, precio, duracion, aerolinea, vuelo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          nuevaRuta.origen,
          nuevaRuta.destino,
          nuevaRuta.distancia,
          nuevaRuta.precio,
          nuevaRuta.duracion,
          nuevaRuta.aerolinea,
          nuevaRuta.vuelo,
        ]
      );

      if (nuevaRuta.bidireccional) {
        await query(
          `INSERT INTO rutas (origen, destino, distancia, precio, duracion, aerolinea, vuelo)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            nuevaRuta.destino,
            nuevaRuta.origen,
            nuevaRuta.distancia,
            nuevaRuta.precio,
            nuevaRuta.duracion,
            nuevaRuta.aerolinea,
            `${nuevaRuta.destino}-${nuevaRuta.origen}`,
          ]
        );
      }
    }

    res.status(201).json({ mensaje: "Ruta agregada exitosamente", ruta: nuevaRuta });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/rutas/:origen/:destino
 * Elimina una conexión entre aeropuertos
 */
router.delete("/:origen/:destino", async (req, res) => {
  try {
    const { origen, destino } = req.params;
    const resultado = eliminarRuta(origen, destino);
    if (!resultado.eliminado) {
      return res.status(404).json({ error: `La ruta entre ${origen} y ${destino} no existía.` });
    }

    if (dbConectada()) {
      await query("DELETE FROM rutas WHERE origen = $1 AND destino = $2", [
        resultado.origen,
        resultado.destino,
      ]);
    }

    res.json({ mensaje: "Ruta eliminada con éxito", ...resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rutas/corta
 * Calcula la ruta óptima usando Dijkstra
 * Parámetros query:
 *   - origen: ej. BOG (obligatorio)
 *   - destino: ej. JFK (obligatorio)
 *   - criterio: 'distancia' | 'precio' | 'duracion' (opcional, defecto 'distancia')
 */
router.get("/corta", (req, res) => {
  try {
    const { origen, destino, criterio = "distancia" } = req.query;

    if (!origen || !destino) {
      return res.status(400).json({
        error: "Los parámetros de consulta 'origen' y 'destino' son obligatorios (ej: /corta?origen=BOG&destino=JFK).",
      });
    }

    const resultado = calcularRutaMasCorta(origen, destino, criterio);
    if (!resultado.encontrado) {
      return res.status(404).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/rutas/escalas
 * Encuentra todas las alternativas de vuelos (directos y con escalas) mediante BFS
 * Parámetros query:
 *   - origen: ej. BOG (obligatorio)
 *   - destino: ej. MAD (obligatorio)
 *   - maxEscalas: número máximo de escalas (opcional, defecto 2)
 */
router.get("/escalas", (req, res) => {
  try {
    const { origen, destino, maxEscalas = 2 } = req.query;

    if (!origen || !destino) {
      return res.status(400).json({
        error: "Los parámetros de consulta 'origen' y 'destino' son obligatorios (ej: /escalas?origen=BOG&destino=MAD).",
      });
    }

    const resultado = buscarRutasConEscalas(origen, destino, maxEscalas);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/rutas/estadisticas
 * Muestra el análisis de conectividad y grado de nodos de la red
 */
router.get("/estadisticas", (req, res) => {
  try {
    const stats = obtenerEstadisticasRed();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rutas/reiniciar
 * Restaura la red de rutas a la configuración predeterminada
 */
router.post("/reiniciar", (req, res) => {
  try {
    const resultado = reiniciarRed();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
