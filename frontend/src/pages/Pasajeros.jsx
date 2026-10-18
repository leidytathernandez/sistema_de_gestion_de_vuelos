import { useEffect, useState } from "react";
import "./Pasajeros.css";

const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/pasajeros`;

export default function Pasajeros() {
  const [fila, setFila] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [nombre, setNombre] = useState("");
  const [vuelo, setVuelo] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
    try {
      const [filaActual, historialActual] = await Promise.all([
        fetch(`${API}/checkin`).then((r) => r.json()),
        fetch(`${API}/historial`).then((r) => r.json()),
      ]);
      setFila(filaActual);
      setHistorial(historialActual);
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // Envía una acción al backend y vuelve a cargar la fila y el historial
  async function accion(ruta, cuerpo) {
    setMensaje("");
    const respuesta = await fetch(`${API}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
        if (!respuesta.ok) {
      let texto = "Ocurrió un error";
      try {
        texto = (await respuesta.json()).error ?? texto;
      } catch {
        // la respuesta no era JSON: se deja el mensaje por defecto
      }
      setMensaje(texto);
    }
    await cargar();
    return respuesta.ok;
  }

  async function registrar(evento) {
    evento.preventDefault();
    const ok = await accion("/checkin", { nombre, vuelo });
    if (ok) {
      setNombre("");
      setVuelo("");
    }
  }

  const etiqueta = { registrar: "Registró a", atender: "Atendió a" };

  return (
    <div className="pas-pagina">
      <h1>Check-in de pasajeros</h1>

      <form onSubmit={registrar} className="pas-formulario">
        <input
          placeholder="Nombre del pasajero"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          placeholder="Vuelo (ej: AV123)"
          value={vuelo}
          onChange={(e) => setVuelo(e.target.value)}
          required
        />
        <button type="submit">Registrar</button>
      </form>

      {mensaje && <p className="pas-error">{mensaje}</p>}

      <div className="pas-acciones">
        <button onClick={() => accion("/checkin/atender")}>Atender siguiente</button>
        <button className="pas-secundario" onClick={() => accion("/historial/deshacer")}>
          Deshacer última acción
        </button>
      </div>

      <h2>Fila de check-in (cola)</h2>
      <p className="pas-nota">El primero en llegar es el primero en ser atendido (FIFO).</p>
      <div className="pas-fila">
        {fila.length === 0 && <span className="pas-vacio">La fila está vacía</span>}
        {fila.map((p, i) => (
          <div key={p.id} className={`pas-tarjeta ${i === 0 ? "pas-siguiente" : ""}`}>
            <strong>{p.nombre}</strong>
            <span>{p.vuelo}</span>
            {i === 0 && <em>Siguiente</em>}
          </div>
        ))}
      </div>

      <h2>Historial (pila)</h2>
      <p className="pas-nota">La última acción es la primera que se deshace (LIFO).</p>
      <ul className="pas-historial">
        {historial.length === 0 && <li className="pas-vacio">Sin operaciones</li>}
        {historial.map((op, i) => (
          <li key={`${op.tipo}-${op.pasajero.id}-${i}`}>
            {etiqueta[op.tipo]} {op.pasajero.nombre} ({op.pasajero.vuelo})
          </li>
        ))}
      </ul>
    </div>
  );
}