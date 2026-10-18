// ├ürbol AVL (ABB autobalanceado). Se usa como ├¡ndice del buscador de vuelos.
class Nodo {
  constructor(clave, valor) {
    this.clave = clave;
    this.valor = valor;
    this.izq = null;
    this.der = null;
    this.altura = 1;
  }
}

const altura = (n) => (n ? n.altura : 0);
const actualizar = (n) => { n.altura = 1 + Math.max(altura(n.izq), altura(n.der)); };
const balance = (n) => altura(n.izq) - altura(n.der);

function rotarDerecha(y) {
  const x = y.izq;
  y.izq = x.der;
  x.der = y;
  actualizar(y);
  actualizar(x);
  return x;
}

function rotarIzquierda(x) {
  const y = x.der;
  x.der = y.izq;
  y.izq = x;
  actualizar(x);
  actualizar(y);
  return y;
}

function rebalancear(n) {
  actualizar(n);
  const b = balance(n);
  if (b > 1) {                                   // pesado a la izquierda
    if (balance(n.izq) < 0) n.izq = rotarIzquierda(n.izq); // caso izq-der
    return rotarDerecha(n);
  }
  if (b < -1) {                                  // pesado a la derecha
    if (balance(n.der) > 0) n.der = rotarDerecha(n.der);   // caso der-izq
    return rotarIzquierda(n);
  }
  return n;
}

export class AVLTree {
  constructor() {
    this.raiz = null;
    this.tamano = 0;
  }

  limpiar() {
    this.raiz = null;
    this.tamano = 0;
  }

  insertar(clave, valor) {
    this.raiz = this._insertar(this.raiz, clave, valor);
  }

  _insertar(n, clave, valor) {
    if (!n) { this.tamano++; return new Nodo(clave, valor); }
    if (clave < n.clave) n.izq = this._insertar(n.izq, clave, valor);
    else if (clave > n.clave) n.der = this._insertar(n.der, clave, valor);
    else { n.valor = valor; return n; }          // clave repetida: actualiza
    return rebalancear(n);
  }

  buscar(clave) {
    let n = this.raiz;
    while (n) {
      if (clave === n.clave) return n.valor;
      n = clave < n.clave ? n.izq : n.der;
    }
    return null;
  }

  eliminar(clave) {
    this.raiz = this._eliminar(this.raiz, clave);
  }

  _eliminar(n, clave) {
    if (!n) return null;
    if (clave < n.clave) n.izq = this._eliminar(n.izq, clave);
    else if (clave > n.clave) n.der = this._eliminar(n.der, clave);
    else {
      if (!n.izq || !n.der) { this.tamano--; return n.izq || n.der; }
      let sucesor = n.der;                       // menor del sub├írbol derecho
      while (sucesor.izq) sucesor = sucesor.izq;
      n.clave = sucesor.clave;
      n.valor = sucesor.valor;
      n.der = this._eliminar(n.der, sucesor.clave);
    }
    return rebalancear(n);
  }

  // Recorrido inorden: valores ordenados por clave
  enOrden() {
    const res = [];
    const rec = (n) => { if (!n) return; rec(n.izq); res.push(n.valor); rec(n.der); };
    rec(this.raiz);
    return res;
  }

  // Valores con clave entre [min, max]; poda ramas que no sirven
  rango(min, max) {
    const res = [];
    const rec = (n) => {
      if (!n) return;
      if (min < n.clave) rec(n.izq);
      if (min <= n.clave && n.clave <= max) res.push(n.valor);
      if (max > n.clave) rec(n.der);
    };
    rec(this.raiz);
    return res;
  }

  // Estructura anidada para dibujar el ├írbol en el frontend
  aArbol(n = this.raiz) {
    if (!n) return null;
    return { clave: n.clave, altura: n.altura, izq: this.aArbol(n.izq), der: this.aArbol(n.der) };
  }
}
