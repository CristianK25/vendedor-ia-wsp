-- === SCRIPT DE INICIALIZACIÓN ===
-- Borrar tablas existentes para empezar de cero (útil si se corre manualmente)
DROP TABLE IF EXISTS ventas CASCADE;

DROP TABLE IF EXISTS promociones CASCADE;

DROP TABLE IF EXISTS interacciones CASCADE;

DROP TABLE IF EXISTS citas CASCADE;

DROP TABLE IF EXISTS trabajadores CASCADE;

DROP TABLE IF EXISTS vehiculo_imagenes CASCADE;

DROP TABLE IF EXISTS vehiculos CASCADE;

DROP TABLE IF EXISTS mensajes_programados CASCADE;

DROP TABLE IF EXISTS clientes CASCADE;

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    telefono TEXT PRIMARY KEY,
    nombre TEXT,
    ultimo_mensaje_bot TIMESTAMP,
    ultima_interaccion_cliente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad_compras INTEGER DEFAULT 0,
    estado_conversacion TEXT DEFAULT 'NORMAL',
    id_mensaje_esperado INTEGER DEFAULT NULL
);

-- 2. Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    modelo TEXT NOT NULL,
    precio REAL NOT NULL,
    kilometraje INTEGER NOT NULL,
    detalle_interior TEXT,
    detalle_exterior TEXT,
    informacion_extra TEXT,
    anio INTEGER NOT NULL,
    transmision TEXT NOT NULL,
    patente TEXT UNIQUE NOT NULL,
    estado TEXT DEFAULT 'disponible' CHECK (
        estado IN ('disponible', 'vendido', 'reservado')
    )
);

-- 2.1. Tabla de Imágenes de Vehículos
CREATE TABLE IF NOT EXISTS vehiculo_imagenes (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER NOT NULL,
    ruta TEXT NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id) ON DELETE CASCADE
);

-- 3. Tabla de Trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    rol TEXT DEFAULT 'vendedor',
    recibe_notificaciones BOOLEAN DEFAULT TRUE
);

-- 4. Tabla de Citas
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    cliente_telefono TEXT NOT NULL,
    vehiculo_id INTEGER,
    fecha TIMESTAMP NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'confirmada' CHECK (
        estado IN (
            'confirmada',
            'cancelada'
        )
    ),
    FOREIGN KEY (cliente_telefono) REFERENCES clientes (telefono),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
);

-- REGLA: Un cliente solo puede tener una cita por día
CREATE UNIQUE INDEX idx_unica_cita_por_dia ON citas (
    cliente_telefono,
    (fecha::DATE)
);

-- 5. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER NOT NULL,
    cliente_telefono TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    precio_final REAL NOT NULL,
    metodo_pago TEXT DEFAULT 'Efectivo',
    notas TEXT,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
    FOREIGN KEY (cliente_telefono) REFERENCES clientes (telefono)
);

-- 6. Tabla de Promociones
CREATE TABLE IF NOT EXISTS promociones (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    estado TEXT DEFAULT 'activa' CHECK (
        estado IN ('activa', 'inactiva')
    )
);

-- 7. Tabla de Mensajes Programados
CREATE TABLE IF NOT EXISTS mensajes_programados (
    id SERIAL PRIMARY KEY,
    cliente_telefono TEXT NOT NULL,
    tipo_mensaje TEXT NOT NULL CHECK (
        tipo_mensaje IN ('RECORDATORIO_PAGO', 'CALIDAD_RESEÑA', 'CROSS_SELLING', 'SALUDO_FESTIVO')
    ),
    fecha_programada TIMESTAMP NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (
        estado IN ('PENDIENTE', 'ENVIADO', 'RESPONDIDO', 'CANCELADO')
    ),
    contexto_json JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_telefono) REFERENCES clientes (telefono) ON DELETE CASCADE
);