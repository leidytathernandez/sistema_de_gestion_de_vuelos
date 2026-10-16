import Graph from "../structures/Graph.js";

// Instancia única del grafo de rutas en memoria (desacoplada para pruebas)
let redRutas = new Graph(true);

// Datos iniciales de aeropuertos de prueba (Hubs nacionales e internacionales)
const AEROPUERTOS_INICIALES = [
  { codigo: "BOG", nombre: "Aeropuerto Internacional El Dorado", ciudad: "Bogotá", pais: "Colombia" },
  { codigo: "MDE", nombre: "Aeropuerto Internacional José María Córdova", ciudad: "Medellín", pais: "Colombia" },
  { codigo: "CLO", nombre: "Aeropuerto Internacional Alfonso Bonilla Aragón", ciudad: "Cali", pais: "Colombia" },
  { codigo: "CTG", nombre: "Aeropuerto Internacional Rafael Núñez", ciudad: "Cartagena", pais: "Colombia" },
  { codigo: "BAQ", nombre: "Aeropuerto Internacional Ernesto Cortissoz", ciudad: "Barranquilla", pais: "Colombia" },
  { codigo: "PTY", nombre: "Aeropuerto Internacional de Tocumen", ciudad: "Ciudad de Panamá", pais: "Panamá" },
  { codigo: "MIA", nombre: "Aeropuerto Internacional de Miami", ciudad: "Miami", pais: "Estados Unidos" },
  { codigo: "JFK", nombre: "Aeropuerto Internacional John F. Kennedy", ciudad: "Nueva York", pais: "Estados Unidos" },
  { codigo: "MAD", nombre: "Aeropuerto Adolfo Suárez Madrid-Barajas", ciudad: "Madrid", pais: "España" },
  { codigo: "MEX", nombre: "Aeropuerto Internacional Benito Juárez", ciudad: "Ciudad de México", pais: "México" },
];

// Datos iniciales de rutas aéreas (con distancia en km, precio en USD, duración en minutos)
const RUTAS_INICIALES = [
  // Rutas Nacionales
  { origen: "BOG", destino: "MDE", distancia: 240, precio: 65, duracion: 55, aerolinea: "Avianca", vuelo: "AV9201" },
  { origen: "MDE", destino: "BOG", distancia: 240, precio: 65, duracion: 55, aerolinea: "Avianca", vuelo: "AV9202" },

  { origen: "BOG", destino: "CLO", distancia: 300, precio: 70, duracion: 60, aerolinea: "LATAM", vuelo: "LA4030" },
  { origen: "CLO", destino: "BOG", distancia: 300, precio: 70, duracion: 60, aerolinea: "LATAM", vuelo: "LA4031" },

  { origen: "BOG", destino: "CTG", distancia: 650, precio: 85, duracion: 85, aerolinea: "Avianca", vuelo: "AV8520" },
  { origen: "CTG", destino: "BOG", distancia: 650, precio: 85, duracion: 85, aerolinea: "Avianca", vuelo: "AV8521" },

  { origen: "MDE", destino: "CTG", distancia: 460, precio: 60, duracion: 65, aerolinea: "Wingo", vuelo: "P57022" },
  { origen: "CTG", destino: "MDE", distancia: 460, precio: 60, duracion: 65, aerolinea: "Wingo", vuelo: "P57023" },

  { origen: "BOG", destino: "BAQ", distancia: 700, precio: 80, duracion: 90, aerolinea: "Avianca", vuelo: "AV8534" },
  { origen: "BAQ", destino: "BOG", distancia: 700, precio: 80, duracion: 90, aerolinea: "Avianca", vuelo: "AV8535" },

  // Rutas Internacionales desde Hubs
  { origen: "BOG", destino: "PTY", distancia: 760, precio: 190, duracion: 105, aerolinea: "Copa Airlines", vuelo: "CM622" },
  { origen: "PTY", destino: "BOG", distancia: 760, precio: 190, duracion: 105, aerolinea: "Copa Airlines", vuelo: "CM623" },

  { origen: "BOG", destino: "MIA", distancia: 2430, precio: 320, duracion: 240, aerolinea: "Avianca", vuelo: "AV008" },
  { origen: "MIA", destino: "BOG", distancia: 2430, precio: 320, duracion: 240, aerolinea: "Avianca", vuelo: "AV009" },

  { origen: "PTY", destino: "MIA", distancia: 1860, precio: 220, duracion: 180, aerolinea: "Copa Airlines", vuelo: "CM430" },
  { origen: "MIA", destino: "PTY", distancia: 1860, precio: 220, duracion: 180, aerolinea: "Copa Airlines", vuelo: "CM431" },

  { origen: "MIA", destino: "JFK", distancia: 1750, precio: 150, duracion: 185, aerolinea: "American Airlines", vuelo: "AA1240" },
  { origen: "JFK", destino: "MIA", distancia: 1750, precio: 150, duracion: 185, aerolinea: "American Airlines", vuelo: "AA1241" },

  { origen: "BOG", destino: "MAD", distancia: 8020, precio: 850, duracion: 590, aerolinea: "Iberia", vuelo: "IB6586" },
  { origen: "MAD", destino: "BOG", distancia: 8020, precio: 850, duracion: 620, aerolinea: "Iberia", vuelo: "IB6585" },

  { origen: "MIA", destino: "MAD", distancia: 7110, precio: 680, duracion: 510, aerolinea: "Air Europa", vuelo: "UX098" },
  { origen: "MAD", destino: "MIA", distancia: 7110, precio: 680, duracion: 540, aerolinea: "Air Europa", vuelo: "UX097" },

  { origen: "BOG", destino: "MEX", distancia: 3170, precio: 310, duracion: 290, aerolinea: "Aeroméxico", vuelo: "AM708" },
  { origen: "MEX", destino: "BOG", distancia: 3170, precio: 310, duracion: 290, aerolinea: "Aeroméxico", vuelo: "AM709" },

  { origen: "PTY", destino: "MEX", distancia: 2410, precio: 260, duracion: 235, aerolinea: "Copa Airlines", vuelo: "CM136" },
  { origen: "MEX", destino: "PTY", distancia: 2410, precio: 260, duracion: 235, aerolinea: "Copa Airlines", vuelo: "CM137" },

  { origen: "MEX", destino: "JFK", distancia: 3360, precio: 340, duracion: 300, aerolinea: "Delta", vuelo: "DL480" },
  { origen: "JFK", destino: "MEX", distancia: 3360, precio: 340, duracion: 300, aerolinea: "Delta", vuelo: "DL481" },
];

/**
 * Inicializa la red con los datos por defecto
 */
export function inicializarRed() {
  redRutas = new Graph(true);

  for (const aero of AEROPUERTOS_INICIALES) {
    redRutas.addVertex(aero.codigo, aero);
  }

  for (const ruta of RUTAS_INICIALES) {
    redRutas.addEdge(ruta.origen, ruta.destino, ruta.distancia, {
      precio: ruta.precio,
      duracion: ruta.duracion,
      aerolinea: ruta.aerolinea,
      vuelo: ruta.vuelo,
    });
  }

  return redRutas;
}

// Inicializar red al cargar el servicio
inicializarRed();

/**
 * Reconstruye el grafo en memoria a partir de los registros de PostgreSQL
 */
export function restaurarRedDesdeDB(aeropuertosDB = [], rutasDB = []) {
  redRutas = new Graph(true);

  for (const a of aeropuertosDB) {
    redRutas.addVertex(a.codigo, {
      nombre: a.nombre,
      ciudad: a.ciudad,
      pais: a.pais,
    });
  }

  for (const r of rutasDB) {
    redRutas.addEdge(r.origen, r.destino, Number(r.distancia), {
      precio: Number(r.precio) || 0,
      duracion: Number(r.duracion) || 0,
      aerolinea: r.aerolinea || "Genérica",
      vuelo: r.vuelo || `${r.origen}-${r.destino}`,
    });
  }

  return redRutas;
}

/**
 * Retorna la red completa en formato serializable
 */
export function obtenerRed() {
  return redRutas.toObject();
}

/**
 * Retorna la lista de aeropuertos registrados
 */
export function obtenerAeropuertos() {
  return redRutas.getVertices();
}

/**
 * Busca un aeropuerto por su código IATA
 */
export function obtenerAeropuerto(codigo) {
  return redRutas.getVertex(codigo);
}

/**
 * Registra un nuevo aeropuerto
 */
export function agregarAeropuerto({ codigo, nombre, ciudad, pais }) {
  if (!codigo || !nombre) {
    throw new Error("El código IATA y el nombre del aeropuerto son obligatorios.");
  }
  const cleanCode = String(codigo).toUpperCase().trim();
  if (redRutas.hasVertex(cleanCode)) {
    throw new Error(`El aeropuerto con código '${cleanCode}' ya existe.`);
  }

  return redRutas.addVertex(cleanCode, {
    nombre: nombre.trim(),
    ciudad: ciudad ? ciudad.trim() : "",
    pais: pais ? pais.trim() : "",
  });
}

/**
 * Retorna todas las rutas directas registradas
 */
export function obtenerRutas() {
  return redRutas.toObject().aristas;
}

/**
 * Registra una nueva ruta de vuelo
 */
export function agregarRuta({
  origen,
  destino,
  distancia,
  precio = 0,
  duracion = 0,
  aerolinea = "Genérica",
  vuelo = null,
  bidireccional = false,
}) {
  if (!origen || !destino) {
    throw new Error("El aeropuerto de origen y destino son obligatorios.");
  }
  if (!distancia || Number(distancia) <= 0) {
    throw new Error("La distancia debe ser un número positivo mayor a 0 km.");
  }

  const orig = String(origen).toUpperCase().trim();
  const dest = String(destino).toUpperCase().trim();

  if (orig === dest) {
    throw new Error("El aeropuerto de origen no puede ser igual al de destino.");
  }

  const ruta = redRutas.addEdge(orig, dest, Number(distancia), {
    distancia: Number(distancia),
    precio: Number(precio) || 0,
    duracion: Number(duracion) || 0,
    aerolinea,
    vuelo: vuelo || `${orig}-${dest}`,
  });

  if (bidireccional) {
    redRutas.addEdge(dest, orig, Number(distancia), {
      distancia: Number(distancia),
      precio: Number(precio) || 0,
      duracion: Number(duracion) || 0,
      aerolinea,
      vuelo: `${dest}-${orig}`,
    });
  }

  return {
    origen: orig,
    destino: dest,
    ...ruta,
    bidireccional,
  };
}

/**
 * Elimina una ruta directa
 */
export function eliminarRuta(origen, destino) {
  const orig = String(origen).toUpperCase().trim();
  const dest = String(destino).toUpperCase().trim();
  const eliminado = redRutas.removeEdge(orig, dest);
  return { origen: orig, destino: dest, eliminado };
}

/**
 * Calcula la ruta más corta/óptima usando Dijkstra
 */
export function calcularRutaMasCorta(origen, destino, criterio = "distancia") {
  return redRutas.dijkstra(origen, destino, criterio);
}

/**
 * Busca todas las opciones de rutas con escalas mediante Búsqueda en Anchura (BFS)
 */
export function buscarRutasConEscalas(origen, destino, maxEscalas = 2) {
  const limite = Math.max(0, parseInt(maxEscalas, 10) || 2);
  const rutas = redRutas.buscarConexionesBFS(origen, destino, limite);

  return {
    origen: String(origen).toUpperCase().trim(),
    destino: String(destino).toUpperCase().trim(),
    maxEscalasPermitidas: limite,
    totalRutasEncontradas: rutas.length,
    rutas,
  };
}

/**
 * Estadísticas y métricas de conectividad de la red aérea
 */
export function obtenerEstadisticasRed() {
  const red = redRutas.toObject();
  const aeropuertos = red.vertices;
  const rutas = red.aristas;

  const conectividad = {};
  for (const aero of aeropuertos) {
    conectividad[aero.id] = {
      ...aero,
      rutasSalientes: 0,
      rutasEntrantes: 0,
    };
  }

  for (const ruta of rutas) {
    if (conectividad[ruta.origen]) {
      conectividad[ruta.origen].rutasSalientes += 1;
    }
    if (conectividad[ruta.destino]) {
      conectividad[ruta.destino].rutasEntrantes += 1;
    }
  }

  const ranking = Object.values(conectividad).sort(
    (a, b) => b.rutasSalientes + b.rutasEntrantes - (a.rutasSalientes + a.rutasEntrantes)
  );

  return {
    totalAeropuertos: aeropuertos.length,
    totalRutasDirectas: rutas.length,
    aeropuertoMasConectado: ranking[0] || null,
    rankingConectividad: ranking,
  };
}

/**
 * Reinicia la red a su estado de datos iniciales
 */
export function reiniciarRed() {
  inicializarRed();
  return { mensaje: "Red de rutas reiniciada a los valores iniciales por defecto." };
}
