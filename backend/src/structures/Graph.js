/**
 * Implementación de Estructura de Datos: Grafo Ponderado y Dirigido
 * Especializado para redes de rutas aéreas entre aeropuertos.
 *
 * Soporta:
 * - Vértices con metadatos (aeropuertos: código IATA, nombre, ciudad, país)
 * - Aristas ponderadas dirigidas (vuelos con distancia, precio, duración, aerolínea)
 * - Algoritmo de Dijkstra para la ruta óptima según criterio (distancia, precio, duración)
 * - Búsqueda de todas las rutas posibles con escalas (DFS con límite de profundidad)
 */
class Graph {
  constructor(isDirected = true) {
    this.isDirected = isDirected;
    // Map<vertexId, { id, ...data }>
    this.vertices = new Map();
    // Map<vertexId, Map<neighborId, { weight, ...metadata }>>
    this.adjacencyList = new Map();
  }

  /**
   * Agrega un vértice (aeropuerto) al grafo
   * @param {string} id - Código identificador (ej: 'BOG', 'MIA')
   * @param {Object} data - Metadatos (nombre, ciudad, país, etc.)
   */
  addVertex(id, data = {}) {
    const key = String(id).toUpperCase().trim();
    if (!this.vertices.has(key)) {
      this.vertices.set(key, { id: key, ...data });
      this.adjacencyList.set(key, new Map());
    } else {
      // Actualiza metadatos si ya existe
      this.vertices.set(key, { ...this.vertices.get(key), ...data });
    }
    return this.vertices.get(key);
  }

  /**
   * Verifica si existe un vértice
   * @param {string} id
   */
  hasVertex(id) {
    return this.vertices.has(String(id).toUpperCase().trim());
  }

  /**
   * Obtiene la información de un vértice
   * @param {string} id
   */
  getVertex(id) {
    return this.vertices.get(String(id).toUpperCase().trim()) || null;
  }

  /**
   * Obtiene todos los vértices registrados
   */
  getVertices() {
    return Array.from(this.vertices.values());
  }

  /**
   * Agrega una arista dirigida (ruta de vuelo) entre dos vértices
   * @param {string} source - Aeropuerto origen
   * @param {string} destination - Aeropuerto destino
   * @param {number} weight - Peso principal (por defecto distancia en km)
   * @param {Object} metadata - Datos adicionales (precio, duracion, aerolinea, vuelo)
   */
  addEdge(source, destination, weight, metadata = {}) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();

    if (!this.hasVertex(src)) {
      this.addVertex(src);
    }
    if (!this.hasVertex(dest)) {
      this.addVertex(dest);
    }

    const edgeData = {
      weight: Number(weight) || 0,
      distancia: Number(metadata.distancia ?? weight) || 0,
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

  /**
   * Verifica si existe una conexión directa de source a destination
   */
  hasEdge(source, destination) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();
    return this.adjacencyList.has(src) && this.adjacencyList.get(src).has(dest);
  }

  /**
   * Obtiene los datos de una ruta directa
   */
  getEdge(source, destination) {
    const src = String(source).toUpperCase().trim();
    const dest = String(destination).toUpperCase().trim();
    if (!this.hasEdge(src, dest)) return null;
    return this.adjacencyList.get(src).get(dest);
  }

  /**
   * Obtiene todos los vecinos salientes de un vértice
   * @param {string} id
   * @returns {Array<{ destino: string, datos: Object }>}
   */
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

  /**
   * Elimina una ruta entre dos aeropuertos
   */
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

  /**
   * Elimina un aeropuerto y todas sus rutas entrantes y salientes
   */
  removeVertex(id) {
    const key = String(id).toUpperCase().trim();
    if (!this.hasVertex(key)) return false;

    // Eliminar aristas salientes
    this.adjacencyList.delete(key);
    this.vertices.delete(key);

    // Eliminar aristas entrantes desde otros vértices
    for (const [, neighbors] of this.adjacencyList.entries()) {
      neighbors.delete(key);
    }
    return true;
  }

  /**
   * Algoritmo de Dijkstra para calcular la ruta más óptima
   * @param {string} startId - Aeropuerto de origen
   * @param {string} endId - Aeropuerto de destino
   * @param {string} criteria - 'distancia' | 'precio' | 'duracion'
   * @returns {Object} Resultado con la ruta, peso total y detalles
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

    // Distancias mínimas conocidas desde el origen
    const distances = new Map();
    // Predecesores para reconstruir el camino
    const previous = new Map();
    // Detalle de aristas usadas
    const edgeUsed = new Map();
    // Conjunto de nodos no visitados
    const unvisited = new Set();

    for (const vertexId of this.vertices.keys()) {
      distances.set(vertexId, Infinity);
      previous.set(vertexId, null);
      edgeUsed.set(vertexId, null);
      unvisited.add(vertexId);
    }

    distances.set(start, 0);

    while (unvisited.size > 0) {
      // Encontrar el vértice no visitado con menor distancia acumulada
      let current = null;
      let minDistance = Infinity;

      for (const vertexId of unvisited) {
        const dist = distances.get(vertexId);
        if (dist < minDistance) {
          minDistance = dist;
          current = vertexId;
        }
      }

      // Si no hay nodo alcanzable o llegamos al destino, terminamos
      if (current === null || minDistance === Infinity) {
        break;
      }

      if (current === end) {
        break;
      }

      unvisited.delete(current);

      // Relajar aristas a vecinos
      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const [neighborId, edgeData] of neighbors.entries()) {
          if (!unvisited.has(neighborId)) continue;

          // Seleccionar peso según el criterio solicitado
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

    // Reconstruir camino
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

    // Métricas totales del camino
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
   * Búsqueda de todas las rutas posibles entre origen y destino
   * mediante recorrido DFS con límite de escalas
   * @param {string} startId - Aeropuerto de origen
   * @param {string} endId - Aeropuerto de destino
   * @param {number} maxStops - Máximo de escalas intermedias permitidas
   * @returns {Array<Object>} Lista de rutas encontradas
   */
  findAllRoutes(startId, endId, maxStops = 3) {
    const start = String(startId).toUpperCase().trim();
    const end = String(endId).toUpperCase().trim();

    if (!this.hasVertex(start) || !this.hasVertex(end)) {
      return [];
    }

    const results = [];
    const visited = new Set();

    const dfs = (current, currentPath, currentTramos) => {
      // Si superó el número de escalas permitidas, podar rama
      const stops = currentPath.length - 2;
      if (stops > maxStops) return;

      if (current === end) {
        const totalDist = currentTramos.reduce((acc, t) => acc + (t.distancia || 0), 0);
        const totalPrice = currentTramos.reduce((acc, t) => acc + (t.precio || 0), 0);
        const totalDuration = currentTramos.reduce((acc, t) => acc + (t.duracion || 0), 0);

        results.push({
          camino: [...currentPath],
          escalas: Math.max(0, currentPath.length - 2),
          aeropuertosEscala: currentPath.slice(1, -1),
          totalDistanciaKm: totalDist,
          totalPrecioUSD: totalPrice,
          totalDuracionMin: totalDuration,
          tramos: [...currentTramos],
        });
        return;
      }

      visited.add(current);

      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const [nextVertex, edgeData] of neighbors.entries()) {
          if (!visited.has(nextVertex)) {
            const tramo = {
              desde: current,
              hacia: nextVertex,
              aeropuertoOrigen: this.getVertex(current),
              aeropuertoDestino: this.getVertex(nextVertex),
              ...edgeData,
            };

            currentPath.push(nextVertex);
            currentTramos.push(tramo);

            dfs(nextVertex, currentPath, currentTramos);

            currentPath.pop();
            currentTramos.pop();
          }
        }
      }

      visited.delete(current);
    };

    dfs(start, [start], []);

    // Ordenar rutas: primero las de menos escalas, luego menor distancia
    return results.sort((a, b) => {
      if (a.escalas !== b.escalas) return a.escalas - b.escalas;
      return a.totalDistanciaKm - b.totalDistanciaKm;
    });
  }

  /**
   * Exporta la estructura del grafo en formato serializable
   */
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
