-- 1. Tabla de Clientes: Registra el estado general y el candado de seguridad.
CREATE TABLE IF NOT EXISTS clientes (
    telefono TEXT PRIMARY KEY,
    nombre TEXT,
    ultimo_mensaje_bot TIMESTAMP,
    ultima_interaccion_cliente TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Productos: Base para el análisis de categorías y alternativas.
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    precio REAL NOT NULL
);

-- 3. Tabla de Interacciones: El motor del retargeting.
CREATE TABLE IF NOT EXISTS interacciones (
    id SERIAL PRIMARY KEY,
    telefono TEXT,
    producto_id INTEGER,
    tipo_evento TEXT CHECK(tipo_evento IN ('CONSULTA', 'COMPRA')),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seguimiento_completado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (telefono) REFERENCES clientes(telefono),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
