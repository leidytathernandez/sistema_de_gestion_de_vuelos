-- Tabla de vuelos (compartida con el resto del equipo: coordinar columnas)
CREATE TABLE IF NOT EXISTS vuelos (
  id      SERIAL PRIMARY KEY,
  codigo  VARCHAR(10) UNIQUE NOT NULL,
  origen  VARCHAR(60) NOT NULL,
  destino VARCHAR(60) NOT NULL,
  salida  TIMESTAMPTZ NOT NULL,
  llegada TIMESTAMPTZ NOT NULL,
  estado  VARCHAR(20) NOT NULL DEFAULT 'programado'
);

-- Cola de prioridad de la torre de control (1 = emergencia, 2 = retraso, 3 = normal)
CREATE TABLE IF NOT EXISTS solicitudes_torre (
  id        SERIAL PRIMARY KEY,
  vuelo_id  INT NOT NULL REFERENCES vuelos(id) ON DELETE CASCADE,
  tipo      VARCHAR(12) NOT NULL CHECK (tipo IN ('despegue', 'aterrizaje')),
  prioridad SMALLINT NOT NULL CHECK (prioridad BETWEEN 1 AND 3),
  estado    VARCHAR(12) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida')),
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Datos de ejemplo (solo se insertan si la tabla está vacía)
INSERT INTO vuelos (codigo, origen, destino, salida, llegada)
SELECT * FROM (VALUES
  ('AV101', 'Cali',     'Bogotá',    '2026-11-01 08:00-05'::timestamptz, '2026-11-01 09:00-05'::timestamptz),
  ('AV205', 'Bogotá',   'Medellín',  '2026-11-01 10:30-05'::timestamptz, '2026-11-01 11:30-05'::timestamptz),
  ('LA330', 'Cali',     'Cartagena', '2026-11-01 07:15-05'::timestamptz, '2026-11-01 08:55-05'::timestamptz),
  ('AV412', 'Medellín', 'Cali',      '2026-11-01 14:00-05'::timestamptz, '2026-11-01 15:00-05'::timestamptz),
  ('LA518', 'Bogotá',   'Cali',      '2026-11-01 12:45-05'::timestamptz, '2026-11-01 13:45-05'::timestamptz),
  ('AV609', 'Cali',     'Pereira',   '2026-11-01 17:20-05'::timestamptz, '2026-11-01 18:00-05'::timestamptz)
) AS t(codigo, origen, destino, salida, llegada)
WHERE NOT EXISTS (SELECT 1 FROM vuelos);
