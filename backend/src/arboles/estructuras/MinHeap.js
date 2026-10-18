// Min-Heap (├írbol binario completo guardado en un arreglo).
// Se usa como cola de prioridad de la torre de control.
export class MinHeap {
  constructor(comparar = (a, b) => a - b) {
    this.datos = [];
    this.comparar = comparar;
  }

  get tamano() { return this.datos.length; }

  limpiar() { this.datos = []; }

  verMin() { return this.datos[0] ?? null; }

  insertar(x) {
    this.datos.push(x);
    this._subir(this.datos.length - 1);
  }

  extraer() {
    if (this.datos.length === 0) return null;
    const min = this.datos[0];
    const ultimo = this.datos.pop();
    if (this.datos.length > 0) {
      this.datos[0] = ultimo;
      this._bajar(0);
    }
    return min;
  }

  _intercambiar(i, j) {
    [this.datos[i], this.datos[j]] = [this.datos[j], this.datos[i]];
  }

  _subir(i) {
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (this.comparar(this.datos[i], this.datos[padre]) >= 0) break;
      this._intercambiar(i, padre);
      i = padre;
    }
  }

  _bajar(i) {
    const n = this.datos.length;
    while (true) {
      let menor = i;
      const izq = 2 * i + 1;
      const der = 2 * i + 2;
      if (izq < n && this.comparar(this.datos[izq], this.datos[menor]) < 0) menor = izq;
      if (der < n && this.comparar(this.datos[der], this.datos[menor]) < 0) menor = der;
      if (menor === i) break;
      this._intercambiar(i, menor);
      i = menor;
    }
  }

  // Estructura anidada para dibujar el heap en el frontend
  aArbol(i = 0) {
    if (i >= this.datos.length) return null;
    return { valor: this.datos[i], izq: this.aArbol(2 * i + 1), der: this.aArbol(2 * i + 2) };
  }
}
