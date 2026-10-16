import Queue from "../structures/Queue.js";
import Stack from "../structures/Stack.js";

let cola = new Queue(); // fila de check-in (FIFO)
const historial = new Stack(); // operaciones para deshacer (LIFO)
let siguienteId = 1;

// Un pasajero llega y entra al final de la fila
export function registrarPasajero({ nombre, vuelo }) {
  const pasajero = {
    id: siguienteId++,
    nombre,
    vuelo,
    llegada: new Date().toISOString(),
  };
  cola.enqueue(pasajero);
  historial.push({ tipo: "registrar", pasajero });
  return { pasajero, posicion: cola.size() };
}

export function verCola() {
  return cola.toArray();
}

// Se atiende al primero de la fila
export function atenderSiguiente() {
  const pasajero = cola.dequeue();
  if (!pasajero) return null;
  historial.push({ tipo: "atender", pasajero });
  return pasajero;
}

// Operación más reciente primero
export function verHistorial() {
  return historial.toArray();
}

// Saca la última operación del historial y la revierte
export function deshacer() {
  const operacion = historial.pop();
  if (!operacion) return null;

  const enFila = cola.toArray();
  cola = new Queue();

  if (operacion.tipo === "registrar") {
    // se cancela el registro: el pasajero sale de la fila
    enFila
      .filter((p) => p.id !== operacion.pasajero.id)
      .forEach((p) => cola.enqueue(p));
  } else if (operacion.tipo === "atender") {
    // el pasajero atendido vuelve al frente de la fila
    cola.enqueue(operacion.pasajero);
    enFila.forEach((p) => cola.enqueue(p));
  }

  return operacion;
}

// Reconstruye la fila al arrancar con los pasajeros guardados en la base de datos
export function restaurarFila(enFila, ultimoId) {
  cola = new Queue();
  enFila.forEach((p) =>
    cola.enqueue({
      id: p.idFila,
      nombre: p.nombre,
      vuelo: p.vuelo,
      llegada: new Date(p.llegada).toISOString(),
    })
  );
  siguienteId = ultimoId + 1;
}