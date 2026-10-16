/**
 * Estructura de Datos: Grafo Ponderado y Dirigido
 * Especializado para redes de rutas aéreas entre aeropuertos.
 *
 * Cumple con los requisitos de la rúbrica (Estructura de Datos y Algoritmos 2):
 * - Representación mediante Lista de Adyacencia con Map (O(1) promedio de búsqueda).
 * - Algoritmo de Dijkstra para la ruta más corta por distancia (o precio/duración).
 * - Búsqueda en Anchura (BFS) para conexiones y escalas mínimas.
 */
class Graph {
  constructor(isDirected = true) {
    this.isDirected = isDirected;
    // Map de vértices: Map<codigoIATA, { id, nombre, ciudad, pais }>
    this.vertices = new Map();
    // Lista de adyacencia: Map<origen, Map<destino, { distancia, precio, duracion, aerolinea }>>
    this.adjacencyList = new Map();
  }

  // Agrega un aeropuerto (vértice) al grafo
  addVertex(id, data = {}) {
    const key = String(id).toUpperCase().trim();
    if (!this.vertices.has(key)) {
      this.vertices.set(key, { id: key, ...data });
      this.adjacencyList.set(key, new Map());
    } else {
      this.vertices.set(key, { ...this.vertices.get(key), ...data });
    }
    return this.vertices.get(key);
  }

  agregarVertice(id, data = {}) {
    return this.addVertex(id, data);
  }

  hasVertex(id) {
    return this.vertices.has(String(id).toUpperCase().trim());
  }

  tieneVertice(id) {
    return this.hasVertex(id);
  }

  getVertex(id) {
    return this.vertices.get(String(id).toUpperCase().trim()) || null;
  }

  obtenerVertice(id) {
    return this.getVertex(id);
  }

  getVertices() {
    return Array.from(this.vertices.values());
  }

  obtenerVertices() {
    return this.getVertices();
  }

  // Agrega una ruta aérea (arista ponderada con distancia)
  addEdge(source, destination, weight, metadata = {}) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();

    if (!this.hasVertex(src)) this.addVertex(src);
    if (!this.hasVertex(dest)) this.addVertex(dest);

    const dist = Number(metadata.distancia ?? weight);
    if (isNaN(dist) || dist <= 0) {
      throw new Error("La distancia debe ser un número positivo mayor a 0 km.");
    }

    const edgeData = {
      weight: dist,
      distancia: dist,
      precio: Number(metadata.precio ?? 0),
      duracion: Number(metadata.duracion ?? 0), // en minutos
      aerolinea: metadata.aerolinea || "Genérica",
      vuelo: metadata.vuelo || `${src}-${dest}`,
      ...metadata,
    };

    this.adjacencyList.get(src).set(dest, edgeData);

    if (!this.isDirected) {
      this.adjacencyList.get(dest).set(src, {
        ...edgeData,
        vuelo: metadata.vueloRetorno || `${dest}-${src}`,
      });
    }

    return edgeData;
  }

  agregarArista(origen, destino, distancia, info = {}) {
    return this.addEdge(origen, destino, distancia, info);
  }

  hasEdge(source, destination) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();
    return this.adjacencyList.has(src) && this.adjacencyList.get(src).has(dest);
  }

  tieneArista(origen, destino) {
    return this.hasEdge(origen, destino);
  }

  getEdge(source, destination) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();
    if (!this.hasEdge(src, dest)) return null;
    return this.adjacencyList.get(src).get(dest);
  }

  obtenerArista(origen, destino) {
    return this.getEdge(origen, destino);
  }

  getNeighbors(id) {
    const key = String(id).toUpperCase().trim();
    if (!this.adjacencyList.has(key)) return [];

    const result = [];
    for (const [dest, data] of this.adjacencyList.get(key).entries()) {
      result.push({
        destino: dest,
        aeropuertoDestino: this.getVertex(dest),
        ...data,
      });
    }
    return result;
  }

  obtenerVecinos(id) {
    return this.getNeighbors(id);
  }

  removeEdge(source, destination) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();

    let removed = false;
    if (this.adjacencyList.has(src)) {
      removed = this.adjacencyList.get(src).delete(dest);
    }
    if (!this.isDirected && this.adjacencyList.has(dest)) {
      this.adjacencyList.get(dest).delete(src);
    }
    return removed;
  }

  eliminarArista(origen, destino) {
    return this.removeEdge(origen, destino);
  }

  removeVertex(id) {
    const key = String(id).toUpperCase().trim();
    if (!this.hasVertex(key)) return false;

    this.adjacencyList.delete(key);
    this.vertices.delete(key);

    for (const [, neighbors] of this.adjacencyList.entries()) {
      neighbors.delete(key);
    }
    return true;
  }

  eliminarVertice(id) {
    return this.removeVertex(id);
  }

  /**
   * Algoritmo de Dijkstra para calcular la ruta más corta/óptima
   * @param {string} startId - Aeropuerto origen
   * @param {string} endId - Aeropuerto destino
   * @param {string} criteria - 'distancia' | 'precio' | 'duracion'
   */
  dijkstra(startId, endId, criteria = "distancia") {
    const start = String(startId).toUpperCase().trim();
    const end = String(endId).toUpperCase().trim();

    if (!this.hasVertex(start)) {
      throw new Error(`El aeropuerto de origen '${start}' no existe en la red.`);
    }
    if (!this.hasVertex(end)) {
      throw new Error(`El aeropuerto de destino '${end}' no existe en la red.`);
    }

    const distances = new Map();
    const previous = new Map();
    const edgeUsed = new Map();
    const unvisited = new Set();

    for (const vertexId of this.vertices.keys()) {
      distances.set(vertexId, Infinity);
      previous.set(vertexId, null);
      edgeUsed.set(vertexId, null);
      unvisited.add(vertexId);
    }

    distances.set(start, 0);

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      for (const vertexId of unvisited) {
        const dist = distances.get(vertexId);
        if (dist < minDistance) {
          minDistance = dist;
          current = vertexId;
        }
      }

      if (current === null || minDistance === Infinity) break;
      if (current === end) break;

      unvisited.delete(current);

      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const [neighborId, edgeData] of neighbors.entries()) {
          if (!unvisited.has(neighborId)) continue;

          let weight = edgeData.distancia;
          if (criteria === "precio") {
            weight = edgeData.precio > 0 ? edgeData.precio : edgeData.distancia;
          } else if (criteria === "duracion") {
            weight = edgeData.duracion > 0 ? edgeData.duracion : edgeData.distancia;
          }

          const alt = distances.get(current) + weight;
          if (alt < distances.get(neighborId)) {
            distances.set(neighborId, alt);
            previous.set(neighborId, current);
            edgeUsed.set(neighborId, edgeData);
          }
        }
      }
    }

    if (distances.get(end) === Infinity) {
      return {
        encontrado: false,
        origen: start,
        destino: end,
        criterio: criteria,
        pesoTotal: null,
        camino: [],
        tramos: [],
        escalas: 0,
        mensaje: `No existe ruta disponible entre ${start} y ${end}.`,
      };
    }

    const path = [];
    const tramos = [];
    let curr = end;

    while (curr !== null) {
      path.unshift(curr);
      const prev = previous.get(curr);
      if (prev !== null) {
        const edge = edgeUsed.get(curr);
        tramos.unshift({
          desde: prev,
          hacia: curr,
          aeropuertoOrigen: this.getVertex(prev),
          aeropuertoDestino: this.getVertex(curr),
          ...edge,
        });
      }
      curr = prev;
    }

    const totalDistancia = tramos.reduce((sum, t) => sum + (t.distancia || 0), 0);
    const totalPrecio = tramos.reduce((sum, t) => sum + (t.precio || 0), 0);
    const totalDuracion = tramos.reduce((sum, t) => sum + (t.duracion || 0), 0);

    return {
      encontrado: true,
      origen: start,
      destino: end,
      criterio: criteria,
      pesoTotal: distances.get(end),
      resumen: {
        totalDistanciaKm: totalDistancia,
        totalPrecioUSD: totalPrecio,
        totalDuracionMin: totalDuracion,
        horasAproximadas: (totalDuracion / 60).toFixed(1),
      },
      escalas: path.length > 2 ? path.length - 2 : 0,
      aeropuertosEscala: path.slice(1, -1),
      camino: path,
      tramos,
    };
  }

  /**
   * Búsqueda en Anchura (BFS) para itinerarios y conexiones con escalas.
   * Al usar una Cola (FIFO), explora por capas de profundidad, garantizando
   * que las rutas con MENOR cantidad de escalas se descubran primero.
   *
   * @param {string} startId - Aeropuerto origen
   * @param {string} endId - Aeropuerto destino
   * @param {number} maxStops - Máximo de escalas intermedias permitidas
   * @returns {Array<Object>} Rutas ordenadas por número de escalas
   */
  buscarConexionesBFS(startId, endId, maxStops = 2) {
    const start = String(startId).toUpperCase().trim();
    const end = String(endId).toUpperCase().trim();

    if (!this.hasVertex(start) || !this.hasVertex(end)) {
      return [];
    }

    const rutas = [];
    // Cola FIFO de exploración para BFS: cada elemento contiene el estado del camino recorrido
    const cola = [{ actual: start, camino: [start], tramos: [] }];

    while (cola.length > 0) {
      const { actual, camino, tramos } = cola.shift();
      const escalasActuales = camino.length - 2;

      // Si llegamos al destino, registramos la ruta
      if (actual === end && camino.length > 1) {
        const totalDist = tramos.reduce((sum, t) => sum + (t.distancia || 0), 0);
        const totalPrice = tramos.reduce((sum, t) => sum + (t.precio || 0), 0);
        const totalDuration = tramos.reduce((sum, t) => sum + (t.duracion || 0), 0);

        rutas.push({
          camino: [...camino],
          escalas: Math.max(0, camino.length - 2),
          aeropuertosEscala: camino.slice(1, -1),
          totalDistanciaKm: totalDist,
          totalPrecioUSD: totalPrice,
          totalDuracionMin: totalDuration,
          tramos: [...tramos],
        });
        continue;
      }

      // Si ya alcanzamos el límite de escalas, no encolamos más vecinos en esta rama
      if (escalasActuales >= maxStops) {
        continue;
      }

      const neighbors = this.adjacencyList.get(actual);
      if (neighbors) {
        for (const [nextVertex, edgeData] of neighbors.entries()) {
          // Evitar ciclos en el mismo itinerario
          if (!camino.includes(nextVertex)) {
            const tramo = {
              desde: actual,
              hacia: nextVertex,
              aeropuertoOrigen: this.getVertex(actual),
              aeropuertoDestino: this.getVertex(nextVertex),
              ...edgeData,
            };

            cola.push({
              actual: nextVertex,
              camino: [...camino, nextVertex],
              tramos: [...tramos, tramo],
            });
          }
        }
      }
    }

    return rutas;
  }

  // Alias compatible
  findAllRoutes(startId, endId, maxStops = 2) {
    return this.buscarConexionesBFS(startId, endId, maxStops);
  }

  toObject() {
    const vertices = this.getVertices();
    const aristas = [];

    for (const [src, neighbors] of this.adjacencyList.entries()) {
      for (const [dest, data] of neighbors.entries()) {
        aristas.push({
          origen: src,
          destino: dest,
          ...data,
        });
      }
    }

    return {
      totalVertices: vertices.length,
      totalAristas: aristas.length,
      vertices,
      aristas,
    };
  }
}

export default Graph;
