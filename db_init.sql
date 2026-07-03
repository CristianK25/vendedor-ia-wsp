-- 1. Tabla de Clientes: Registra el estado general y el candado de seguridad.
CREATE TABLE IF NOT EXISTS clientes (
    telefono TEXT PRIMARY KEY,
    nombre TEXT,
    ultimo_mensaje_bot TIMESTAMP,
    ultima_interaccion_cliente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad_compras INTEGER DEFAULT 0
);

-- 2. Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    modelo TEXT NOT NULL,
    precio REAL NOT NULL,
    kilometraje INTEGER NOT NULL,
    imagenes TEXT, -- Podría ser un JSON de URLs o un string separado por comas
    detalle_interior TEXT,
    detalle_exterior TEXT,
    informacion_extra TEXT,
    estado TEXT DEFAULT 'disponible' CHECK(estado IN ('disponible', 'vendido'))
);

-- 3. Tabla de Trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    rol TEXT DEFAULT 'vendedor'
);

-- 4. Tabla de Citas
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    cliente_telefono TEXT NOT NULL,
    trabajador_id INTEGER NOT NULL,
    fecha TIMESTAMP NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'confirmada', 'cancelada')),
    FOREIGN KEY (cliente_telefono) REFERENCES clientes(telefono),
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
);

-- 5. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER NOT NULL,
    cliente_telefono TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    precio_final REAL NOT NULL,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (cliente_telefono) REFERENCES clientes(telefono)
);

-- 6. Tabla de Promociones
CREATE TABLE IF NOT EXISTS promociones (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'inactiva'))
);

-- 7. Tabla de Interacciones: El motor del retargeting (para n8n/spam)
CREATE TABLE IF NOT EXISTS interacciones (
    id SERIAL PRIMARY KEY,
    telefono TEXT,
    vehiculo_id INTEGER,
    tipo_evento TEXT CHECK(tipo_evento IN ('CONSULTA', 'COMPRA', 'CITA')),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seguimiento_completado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (telefono) REFERENCES clientes(telefono),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);
