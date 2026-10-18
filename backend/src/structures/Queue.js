// Cola (FIFO): el primer pasajero en llegar es el primero en ser atendido.
class Queue {
  constructor() {
    this.items = [];
  }

  // Un pasajero entra al final de la fila.
  enqueue(item) {
    this.items.push(item);
  }

  // Atiende y saca al primero de la fila.
  dequeue() {
    return this.items.length > 0 ? this.items.shift() : null;
  }

  // Consulta qui├®n sigue sin sacarlo de la fila.
  peek() {
    return this.items.length > 0 ? this.items[0] : null;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  // Devuelve una copia de la fila, ├║til para mostrarla en el frontend.
  toArray() {
    return [...this.items];
  }
}

export default Queue;
