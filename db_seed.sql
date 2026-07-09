-- === SCRIPT DE DATOS DE PRUEBA (SEED) ===
-- Limpiar datos previos antes de insertar
TRUNCATE TABLE mensajes_programados, ventas, citas, vehiculo_imagenes, vehiculos, clientes, trabajadores, promociones RESTART IDENTITY CASCADE;

-- 1. Insertar Clientes
INSERT INTO clientes (telefono, nombre, ultimo_mensaje_bot, ultima_interaccion_cliente, cantidad_compras) VALUES
('+5491123456789', 'Juan Pérez', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '12 hours', 1),
('+5491134567890', 'María Rodríguez', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 2),
('+5491145678901', 'Carlos González', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', 0),
('+5491156789012', 'Ana Martínez', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '9 days', 1),
('+5491167890123', 'Luis Fernández', CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours', 0),
('+5491178901234', 'Laura Gómez', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 1),
('+5491189012345', 'Diego Díaz', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 0),
('+5491190123456', 'Sofía Álvarez', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 0),
('+5491101234567', 'Martín Romero', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '14 days', 3),
('+5491112345678', 'Lucía Alonso', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days', 1),
('+5491199999999', 'Roberto Sánchez', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '19 days', 0),
('+5491188888888', 'Elena Torres', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '11 days', 2);

-- 2. Insertar Vehículos
INSERT INTO vehiculos (id, modelo, precio, kilometraje, detalle_interior, detalle_exterior, informacion_extra, estado) VALUES
(1, 'Toyota Corolla 1.8 SEG', 22500, 45000, 'Asientos de cuero, Pantalla táctil 9", Climatizador bi-zona', 'Color Gris Plata, Llantas de aleación 17", Luces LED', 'Único dueño, todos los servicios oficiales', 'disponible'),
(2, 'Honda Civic 2.0 EXL', 24000, 38000, 'Tapizado en cuero negro, Techo solar corredizo, Apple CarPlay', 'Color Negro Cristal, Faros antiniebla, Excelente pintura', 'Garantía vigente de fábrica', 'disponible'),
(3, 'Toyota Hilux 2.8 SRX 4x4', 42000, 75000, 'Interior premium, Butacas eléctricas ventiladas', 'Color Blanco Perlado, Estribos, Barra antivuelco', 'Ideal para trabajo o recreación rural', 'disponible'),
(4, 'Volkswagen Golf GTI 2.0 TSI', 29500, 60000, 'Volante deportivo, Butacas con diseño tartán, Cockpit digital', 'Color Rojo Tornado, Doble salida de escape, Llantas Milton Keynes', 'Stage 1 conservador, excelente estado mecánico', 'disponible'),
(5, 'Ford Ranger 3.2 Limited 4x4', 38500, 89000, 'Sistema SYNC 3, Navegador satelital, Asistente pre-colisión', 'Color Azul Belice, Cobertor de caja, Lona marítima', 'Services al día oficiales', 'disponible'),
(6, 'Peugeot 208 1.6 Feline', 16800, 22000, 'Techo panorámico, Tablero i-Cockpit 3D, Tapizado alcántara', 'Color Gris Grafito, Firma lumínica LED garras de león', 'Ideal para ciudad, muy bajo consumo', 'disponible'),
(7, 'Chevrolet Cruze 1.4T Premier', 19200, 51000, 'Cargador inalámbrico de celular, Wi-Fi nativo, Asiento conductor eléctrico', 'Color Blanco Summit, Detalles cromados', 'Sedán espacioso con gran baúl', 'disponible'),
(8, 'Jeep Compass 1.3T Series', 31000, 15000, 'Audio Beats premium, Techo solar panorámico doble', 'Color Gris Granite, Llantas oscurecidas 19"', 'Poco uso, prácticamente nuevo', 'disponible'),
(9, 'BMW 320i ActiveFlex', 37000, 65000, 'Interior Sensatec beige, Modos de conducción Sport/Comfort', 'Color Azul Imperial, Faros Bi-Xenón', 'Impecable andar y cuidado obsesivo', 'vendido'),
(10, 'Hyundai Tucson 2.0 GL', 25500, 82000, 'Interior amplio de tela negra, Control de descenso', 'Color Plata Metalizado, Auxilio con llanta original', 'Muy familiar, cómoda y segura', 'vendido');

-- Reiniciar la secuencia de IDs de vehículos para futuros inserts
SELECT setval('vehiculos_id_seq', (SELECT MAX(id) FROM vehiculos));

-- 2.1. Insertar Imágenes de Vehículos (URLs públicas para el front)
INSERT INTO vehiculo_imagenes (vehiculo_id, ruta, es_principal, orden) VALUES
(1, 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(1, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80', FALSE, 1),
(2, 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(3, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(4, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(5, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(6, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(7, 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(8, 'https://images.unsplash.com/photo-1611245803212-ea88656d0d21?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(9, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80', TRUE, 0),
(10, 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=600&q=80', TRUE, 0);

-- 3. Insertar Trabajadores
INSERT INTO trabajadores (nombre, telefono, rol, recibe_notificaciones) VALUES
('Juan Delgado', '+5491112121212', 'administrador', TRUE),
('Ricardo Gómez', '+5491123232323', 'vendedor', TRUE),
('Sofía Ramos', '+5491134343434', 'vendedor', TRUE),
('Andrés Castro', '+5491145454545', 'vendedor', FALSE),
('Luciana Beltrán', '+5491156565656', 'vendedor', TRUE),
('Martín Palermo', '+5491167676767', 'vendedor', TRUE),
('Mariana López', '+5491178787878', 'vendedor', FALSE),
('Nicolás González', '+5491189898989', 'vendedor', TRUE),
('Florencia Díaz', '+5491190909090', 'vendedor', TRUE),
('Bautista Romero', '+5491109090909', 'vendedor', FALSE);

-- 4. Insertar Citas (Fechas distribuidas en el mes actual para poblar el Calendario)
-- Se usan funciones para generar fechas dinámicas relativas a hoy para que siempre sea visible en el calendario
INSERT INTO citas (cliente_telefono, fecha, estado) VALUES
('+5491123456789', CURRENT_DATE + TIME '10:00:00', 'confirmada'),
('+5491134567890', CURRENT_DATE + TIME '15:30:00', 'pendiente'),
('+5491145678901', CURRENT_DATE + INTERVAL '1 day' + TIME '11:00:00', 'confirmada'),
('+5491156789012', CURRENT_DATE + INTERVAL '1 day' + TIME '16:00:00', 'pendiente'),
('+5491167890123', CURRENT_DATE + INTERVAL '2 days' + TIME '09:30:00', 'pendiente'),
('+5491178901234', CURRENT_DATE + INTERVAL '2 days' + TIME '14:00:00', 'confirmada'),
('+5491189012345', CURRENT_DATE - INTERVAL '1 day' + TIME '10:30:00', 'confirmada'),
('+5491190123456', CURRENT_DATE - INTERVAL '2 days' + TIME '16:30:00', 'confirmada'),
('+5491101234567', CURRENT_DATE + INTERVAL '3 days' + TIME '12:00:00', 'pendiente'),
('+5491112345678', CURRENT_DATE + INTERVAL '4 days' + TIME '15:00:00', 'pendiente'),
('+5491199999999', CURRENT_DATE + INTERVAL '5 days' + TIME '10:00:00', 'pendiente'),
('+5491188888888', CURRENT_DATE + INTERVAL '6 days' + TIME '11:30:00', 'confirmada'),
('+5491123456789', CURRENT_DATE + INTERVAL '7 days' + TIME '14:30:00', 'pendiente'),
('+5491134567890', CURRENT_DATE - INTERVAL '3 days' + TIME '11:00:00', 'confirmada'),
('+5491145678901', CURRENT_DATE - INTERVAL '4 days' + TIME '09:00:00', 'cancelada');

-- 5. Insertar Ventas
INSERT INTO ventas (vehiculo_id, cliente_telefono, fecha, precio_final) VALUES
(9, '+5491123456789', CURRENT_TIMESTAMP - INTERVAL '15 days', 36500),
(10, '+5491134567890', CURRENT_TIMESTAMP - INTERVAL '10 days', 25000),
(1, '+5491156789012', CURRENT_TIMESTAMP - INTERVAL '30 days', 22000),
(2, '+5491178901234', CURRENT_TIMESTAMP - INTERVAL '25 days', 23800),
(3, '+5491101234567', CURRENT_TIMESTAMP - INTERVAL '5 days', 41500),
(4, '+5491112345678', CURRENT_TIMESTAMP - INTERVAL '8 days', 29000),
(5, '+5491188888888', CURRENT_TIMESTAMP - INTERVAL '12 days', 38000),
(6, '+5491134567890', CURRENT_TIMESTAMP - INTERVAL '2 days', 16500),
(7, '+5491101234567', CURRENT_TIMESTAMP - INTERVAL '22 days', 19000),
(8, '+5491101234567', CURRENT_TIMESTAMP - INTERVAL '45 days', 30500);

-- 6. Insertar Promociones
INSERT INTO promociones (titulo, descripcion, fecha_inicio, fecha_fin, estado) VALUES
('Bono Especial Invierno', 'Obtén €1,500 de descuento directo en modelos seleccionados tipo SUV.', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 'activa'),
('Tasa 0% Financiación', 'Financiación exclusiva a tasa 0% en pesos a 12 meses para el nuevo Toyota Corolla.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'activa'),
('Hot Week Automotor', 'Bonificación de hasta €2,000 en vehículos usados con menos de 50,000 km.', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'inactiva'),
('Mantenimiento Bonificado', 'Te regalamos el primer service oficial de los 10,000 km para compras este mes.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '25 days', 'activa'),
('Plan Canje Plus', 'Cotizamos tu vehículo usado un 10% por encima del valor de mercado.', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '12 days', 'activa'),
('Súper Descuento Pick-ups', 'Bonificación de €3,000 para Toyota Hilux y Ford Ranger.', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '10 days', 'inactiva'),
('Seguro Incluido', 'Llevate tu vehículo con los primeros 3 meses de seguro contra todo riesgo gratis.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', 'activa'),
('Test Drive con Regalo', 'Vení a probar cualquier modelo y llevate un kit exclusivo de la marca.', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '9 days', 'activa'),
('Fin de Año Liquidación', 'Liquidamos todo el inventario restante del año anterior a precios de costo.', CURRENT_TIMESTAMP - INTERVAL '200 days', CURRENT_TIMESTAMP - INTERVAL '180 days', 'inactiva'),
('Cyber Car Promo', 'Descuentos exclusivos en reserva online a través de la web.', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '35 days', 'inactiva');

-- 7. Insertar Mensajes Programados (Cola de n8n)
INSERT INTO mensajes_programados (cliente_telefono, tipo_mensaje, fecha_programada, estado, contexto_json) VALUES
-- Cliente compró hace unos días, le toca reseña HOY (para que n8n lo recoja ya mismo)
('+5491123456789', 'CALIDAD_RESEÑA', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'PENDIENTE', '{"vehiculo_id": 9, "modelo": "BMW 320i ActiveFlex", "precio": 36500}'),
-- Cliente compró hace más tiempo, le toca cross-selling HOY
('+5491156789012', 'CROSS_SELLING', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'PENDIENTE', '{"vehiculo_id": 1, "modelo": "Toyota Corolla 1.8 SEG"}'),
-- Cliente tiene cita cancelada, recordatorio
('+5491145678901', 'RECORDATORIO_PAGO', CURRENT_TIMESTAMP + INTERVAL '1 day', 'PENDIENTE', '{"motivo": "Cita cancelada"}'),
-- Cliente cualquiera para saludo festivo HOY
('+5491189012345', 'SALUDO_FESTIVO', CURRENT_TIMESTAMP - INTERVAL '5 hours', 'PENDIENTE', '{"festividad": "Día del Amigo"}');
