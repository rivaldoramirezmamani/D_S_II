-- =========================================
-- ELIMINAR TODAS LAS TABLAS
-- =========================================

DROP TABLE IF EXISTS patrullaje CASCADE;
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS reporte CASCADE;
DROP TABLE IF EXISTS tipo_reporte CASCADE;
DROP TABLE IF EXISTS prediccion_riesgo CASCADE;
DROP TABLE IF EXISTS alerta CASCADE;
DROP TABLE IF EXISTS validacion_incidente CASCADE;
DROP TABLE IF EXISTS incidente CASCADE;
DROP TABLE IF EXISTS tipo_incidente CASCADE;
DROP TABLE IF EXISTS ubicacion CASCADE;
DROP TABLE IF EXISTS calle CASCADE;
DROP TABLE IF EXISTS zona CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS junta_vecinal CASCADE;
DROP TABLE IF EXISTS barrio CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- =========================================
-- RECREAR TABLAS
-- =========================================

CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

CREATE TABLE barrio (
    id_barrio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel_riesgo VARCHAR(50)
);

CREATE TABLE junta_vecinal (
    id_junta SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion DATE,
    id_barrio INT,
    CONSTRAINT fk_junta_barrio FOREIGN KEY (id_barrio) REFERENCES barrio(id_barrio)
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash TEXT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_rol INT,
    id_junta INT,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol),
    CONSTRAINT fk_usuario_junta FOREIGN KEY (id_junta) REFERENCES junta_vecinal(id_junta)
);

CREATE TABLE zona (
    id_zona SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    id_barrio INT,
    CONSTRAINT fk_zona_barrio FOREIGN KEY (id_barrio) REFERENCES barrio(id_barrio)
);

CREATE TABLE calle (
    id_calle SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    iluminacion VARCHAR(50),
    nivel_trafico VARCHAR(50),
    id_barrio INT,
    CONSTRAINT fk_calle_barrio FOREIGN KEY (id_barrio) REFERENCES barrio(id_barrio)
);

CREATE TABLE ubicacion (
    id_ubicacion SERIAL PRIMARY KEY,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    referencia TEXT,
    id_calle INT,
    CONSTRAINT fk_ubicacion_calle FOREIGN KEY (id_calle) REFERENCES calle(id_calle)
);

CREATE TABLE tipo_incidente (
    id_tipo_incidente SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    descripcion TEXT,
    gravedad_base VARCHAR(50)
);

CREATE TABLE incidente (
    id_incidente SERIAL PRIMARY KEY,
    descripcion TEXT,
    fecha_hora TIMESTAMP,
    estado VARCHAR(50),
    evidencia_url TEXT,
    id_tipo_incidente INT,
    id_usuario INT,
    id_ubicacion INT,
    CONSTRAINT fk_incidente_tipo FOREIGN KEY (id_tipo_incidente) REFERENCES tipo_incidente(id_tipo_incidente),
    CONSTRAINT fk_incidente_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_incidente_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicacion(id_ubicacion)
);

CREATE TABLE validacion_incidente (
    id_validacion SERIAL PRIMARY KEY,
    resultado VARCHAR(50),
    comentario TEXT,
    fecha_validacion TIMESTAMP,
    id_incidente INT,
    id_usuario INT,
    CONSTRAINT fk_validacion_incidente FOREIGN KEY (id_incidente) REFERENCES incidente(id_incidente),
    CONSTRAINT fk_validacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE alerta (
    id_alerta SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    mensaje TEXT,
    fecha TIMESTAMP,
    prioridad VARCHAR(50),
    canal VARCHAR(50),
    id_incidente INT,
    id_reporte INT,
    CONSTRAINT fk_alerta_incidente FOREIGN KEY (id_incidente) REFERENCES incidente(id_incidente),
    CONSTRAINT fk_alerta_reporte FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte)
);

CREATE TABLE prediccion_riesgo (
    id_prediccion SERIAL PRIMARY KEY,
    fecha_generacion TIMESTAMP,
    nivel_riesgo VARCHAR(50),
    probabilidad DECIMAL(5,2),
    factores_riesgo TEXT,
    recomendacion TEXT,
    id_barrio INT,
    CONSTRAINT fk_prediccion_barrio FOREIGN KEY (id_barrio) REFERENCES barrio(id_barrio)
);

CREATE TABLE tipo_reporte (
    id_tipo_reporte SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    descripcion TEXT
);

CREATE TABLE reporte (
    id_reporte SERIAL PRIMARY KEY,
    descripcion TEXT,
    fecha_reporte TIMESTAMP,
    estado VARCHAR(50),
    evidencia_url TEXT,
    id_tipo_reporte INT,
    id_usuario INT,
    id_ubicacion INT,
    CONSTRAINT fk_reporte_tipo FOREIGN KEY (id_tipo_reporte) REFERENCES tipo_reporte(id_tipo_reporte),
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_reporte_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicacion(id_ubicacion)
);

CREATE TABLE notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    mensaje TEXT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE,
    id_usuario INT,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE patrullaje (
    id_patrullaje SERIAL PRIMARY KEY,
    fecha DATE,
    hora_inicio TIME,
    hora_fin TIME,
    observaciones TEXT,
    estado VARCHAR(50),
    id_usuario INT,
    CONSTRAINT fk_patrullaje_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- =========================================
-- DESHABILITAR RLS
-- =========================================

ALTER TABLE rol DISABLE ROW LEVEL SECURITY;
ALTER TABLE barrio DISABLE ROW LEVEL SECURITY;
ALTER TABLE junta_vecinal DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE zona DISABLE ROW LEVEL SECURITY;
ALTER TABLE calle DISABLE ROW LEVEL SECURITY;
ALTER TABLE ubicacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_incidente DISABLE ROW LEVEL SECURITY;
ALTER TABLE incidente DISABLE ROW LEVEL SECURITY;
ALTER TABLE validacion_incidente DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerta DISABLE ROW LEVEL SECURITY;
ALTER TABLE prediccion_riesgo DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_reporte DISABLE ROW LEVEL SECURITY;
ALTER TABLE reporte DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE patrullaje DISABLE ROW LEVEL SECURITY;

-- =========================================
-- INSERT: ROL (sin tocar)
-- =========================================

INSERT INTO rol (nombre_rol) VALUES
('Administrador'),
('Vecino'),
('Policia'),
('Moderador');

-- =========================================
-- INSERT: BARRIO
-- =========================================

INSERT INTO barrio (nombre, descripcion, nivel_riesgo) VALUES
('San Pedro', 'Barrio residencial al norte de la ciudad', 'Medio'),
('Villa Primero de Mayo', 'Barrio popular con alta densidad', 'Alto'),
('Plan Tres Mil', 'Zona periférica con alto índice delictivo', 'Alto'),
('Equipetrol', 'Zona comercial y residencial de alto nivel', 'Bajo'),
('Hamacas', 'Barrio céntrico con actividad comercial', 'Medio');

-- =========================================
-- INSERT: JUNTA VECINAL
-- =========================================

INSERT INTO junta_vecinal (nombre, descripcion, fecha_creacion, id_barrio) VALUES
('Junta Vecinal San Pedro Norte', 'Agrupa a vecinos del sector norte de San Pedro', '2018-03-15', 1),
('Junta Vecinal Villa Mayo', 'Organización de vecinos de Villa 1ro de Mayo', '2015-06-20', 2),
('Junta Vecinal Plan 3000', 'Junta activa en Plan Tres Mil', '2012-09-10', 3),
('Junta Vecinal Equipetrol', 'Vecinos organizados de Equipetrol', '2020-01-05', 4),
('Junta Vecinal Hamacas Centro', 'Junta del sector Hamacas', '2017-11-30', 5);

-- =========================================
-- INSERT: USUARIO
-- =========================================

INSERT INTO usuario (nombres, apellidos, telefono, correo, contrasena_hash, id_rol, id_junta) VALUES
('Carlos', 'Mendoza Vaca', '76543210', 'carlos.mendoza@gmail.com', 'hash_pass_001', 1, 1),
('Ana', 'Rojas Peña', '75432109', 'ana.rojas@gmail.com', 'hash_pass_002', 2, 2),
('Luis', 'Gutierrez Suarez', '74321098', 'luis.gutierrez@gmail.com', 'hash_pass_003', 3, 3),
('Maria', 'Flores Vargas', '73210987', 'maria.flores@gmail.com', 'hash_pass_004', 4, 4),
('Jorge', 'Quispe Mamani', '72109876', 'jorge.quispe@gmail.com', 'hash_pass_005', 2, 5),
('Patricia', 'Salinas Torres', '71098765', 'patricia.salinas@gmail.com', 'hash_pass_006', 2, 1),
('Roberto', 'Chávez Lima', '70987654', 'roberto.chavez@gmail.com', 'hash_pass_007', 3, 2),
('Claudia', 'Morales Paz', '69876543', 'claudia.morales@gmail.com', 'hash_pass_008', 2, 3);

-- =========================================
-- INSERT: ZONA
-- =========================================

INSERT INTO zona (nombre, id_barrio) VALUES
('Zona Norte San Pedro', 1),
('Zona Sur San Pedro', 1),
('Zona Central Villa Mayo', 2),
('Zona Este Plan 3000', 3),
('Zona Comercial Equipetrol', 4),
('Zona Residencial Hamacas', 5);

-- =========================================
-- INSERT: CALLE
-- =========================================

INSERT INTO calle (nombre, iluminacion, nivel_trafico, id_barrio) VALUES
('Av. Monseñor Rivero', 'Buena', 'Alto', 1),
('Calle Murillo', 'Regular', 'Medio', 2),
('Av. Cristo Redentor', 'Mala', 'Alto', 3),
('Av. San Martín', 'Buena', 'Alto', 4),
('Calle Hamacas', 'Regular', 'Medio', 5),
('Av. Paragua', 'Mala', 'Bajo', 3),
('Calle Independencia', 'Buena', 'Medio', 1),
('Av. Roca y Coronado', 'Regular', 'Alto', 2);

-- =========================================
-- INSERT: UBICACION
-- =========================================

INSERT INTO ubicacion (latitud, longitud, referencia, id_calle) VALUES
(-17.78391200, -63.18201400, 'Frente al mercado San Pedro', 1),
(-17.79012300, -63.17654300, 'Esquina con calle Murillo', 2),
(-17.80234500, -63.16789000, 'A 100m del parque Cristo Redentor', 3),
(-17.77654300, -63.19012100, 'Galería San Martín piso 2', 4),
(-17.81234500, -63.15678900, 'Frente a la cancha municipal', 5),
(-17.82012300, -63.14567800, 'Entre Av. Paragua y calle 5', 6),
(-17.78901200, -63.18901200, 'Cerca de la iglesia', 7),
(-17.79876500, -63.17345600, 'Esquina Roca y Coronado', 8);

-- =========================================
-- INSERT: TIPO INCIDENTE
-- =========================================

INSERT INTO tipo_incidente (nombre, descripcion, gravedad_base) VALUES
('Robo', 'Robo en vía pública con o sin violencia', 'Alta'),
('Violencia', 'Peleas o agresiones físicas', 'Alta'),
('Vandalismo', 'Daños a propiedad pública o privada', 'Media'),
('Sospechoso', 'Persona con actitud sospechosa', 'Media'),
('Hurto', 'Hurto sin violencia', 'Media'),
('Otros', 'Otros tipos de incidentes', 'Baja');

-- =========================================
-- INSERT: INCIDENTE
-- =========================================

INSERT INTO incidente (descripcion, fecha_hora, estado, evidencia_url, id_tipo_incidente, id_usuario, id_ubicacion) VALUES
('Robo de celular a mano armada cerca del mercado', '2024-11-10 20:30:00', 'Validado', 'https://evidencias.com/foto1.jpg', 1, 2, 1),
('Pelea entre vecinos frente a calle Murillo', '2024-11-11 22:00:00', 'Pendiente', NULL, 2, 5, 2),
('Grafitis en pared del parque', '2024-11-12 08:15:00', 'Validado', 'https://evidencias.com/foto2.jpg', 3, 6, 3),
('Persona merodeando autos en estacionamiento', '2024-11-13 01:45:00', 'Rechazado', NULL, 4, 2, 4),
('Hurto de billetera en el bus', '2024-11-14 07:30:00', 'Validado', NULL, 5, 5, 5),
('Robo a domicilio en zona norte', '2024-11-15 03:00:00', 'Pendiente', 'https://evidencias.com/foto3.jpg', 1, 6, 6),
('Vandalismo en señales de tránsito', '2024-11-16 19:00:00', 'Validado', NULL, 3, 2, 7),
('Agresión verbal y física en cancha', '2024-11-17 18:30:00', 'Pendiente', NULL, 2, 5, 8);

-- =========================================
-- INSERT: VALIDACION INCIDENTE
-- =========================================

INSERT INTO validacion_incidente (resultado, comentario, fecha_validacion, id_incidente, id_usuario) VALUES
('Validado', 'El incidente fue verificado por patrulla policial', '2024-11-10 23:00:00', 1, 3),
('En revisión', 'Se están recopilando más testimonios', '2024-11-11 23:30:00', 2, 4),
('Validado', 'Grafitis verificados por moderador de zona', '2024-11-12 10:00:00', 3, 4),
('Rechazado', 'No se encontró evidencia suficiente', '2024-11-13 09:00:00', 4, 3),
('Validado', 'Hurto confirmado por cámaras del bus', '2024-11-14 12:00:00', 5, 1),
('En revisión', 'Se notificó a patrulla correspondiente', '2024-11-15 06:00:00', 6, 4),
('Validado', 'Vandalismo verificado por inspector municipal', '2024-11-16 20:00:00', 7, 1),
('En revisión', 'Testigos siendo contactados', '2024-11-17 20:00:00', 8, 3);

-- =========================================
-- INSERT: ALERTA
-- =========================================

INSERT INTO alerta (titulo, mensaje, fecha, prioridad, canal, id_incidente) VALUES
('Robo en San Pedro', 'Se reportó robo a mano armada cerca del mercado San Pedro. Tome precauciones.', '2024-11-10 21:00:00', 'Alta', 'SMS', 1),
('Pelea en Calle Murillo', 'Incidente de violencia registrado. Evite la zona.', '2024-11-11 22:30:00', 'Alta', 'App', 2),
('Grafitis en parque', 'Vandalismo detectado. Mantenimiento notificado.', '2024-11-12 09:00:00', 'Media', 'App', 3),
('Persona sospechosa en Equipetrol', 'Se avistó persona sospechosa en estacionamiento. Permanezca alerta.', '2024-11-13 02:00:00', 'Media', 'Email', 4),
('Hurto en transporte público', 'Se reportó hurto en línea de bus. Cuide sus pertenencias.', '2024-11-14 08:00:00', 'Media', 'SMS', 5),
('Robo domiciliario zona norte', 'Alerta por robo en zona norte. Se recomienda reforzar seguridad.', '2024-11-15 04:00:00', 'Alta', 'SMS', 6),
('Vandalismo en señales viales', 'Señales de tránsito vandalizadas. Municipalidad informada.', '2024-11-16 19:30:00', 'Baja', 'App', 7),
('Agresión en cancha municipal', 'Riña reportada en cancha. Policía en camino.', '2024-11-17 18:45:00', 'Alta', 'App', 8);

-- =========================================
-- INSERT: PREDICCION RIESGO
-- =========================================

INSERT INTO prediccion_riesgo (fecha_generacion, nivel_riesgo, probabilidad, factores_riesgo, recomendacion, id_barrio) VALUES
('2024-11-18 06:00:00', 'Medio', 62.50, 'Historial de robos, baja iluminación nocturna', 'Incrementar patrullaje nocturno', 1),
('2024-11-18 06:05:00', 'Alto', 85.00, 'Alta densidad poblacional, múltiples incidentes recientes', 'Reforzar presencia policial y cámaras', 2),
('2024-11-18 06:10:00', 'Alto', 90.00, 'Zona periférica, escasa iluminación, alto historial delictivo', 'Patrullaje permanente y alumbrado público', 3),
('2024-11-18 06:15:00', 'Bajo', 20.00, 'Zona comercial con vigilancia privada', 'Mantener coordinación con seguridad privada', 4),
('2024-11-18 06:20:00', 'Medio', 55.00, 'Tráfico vehicular alto, incidentes esporádicos', 'Aumentar señalización y cámaras', 5);

-- =========================================
-- INSERT: TIPO REPORTE
-- =========================================

INSERT INTO tipo_reporte (nombre, descripcion) VALUES
('Luminaria dañada', 'Poste o luz pública dañada o apagada'),
('Basura', 'Acumulación de basura en vía pública'),
('Ruido', 'Ruidos molestos de vecinos o establecimientos'),
('Inseguridad', 'Zona considerada insegura por los vecinos');

-- =========================================
-- INSERT: REPORTE
-- =========================================

INSERT INTO reporte (descripcion, fecha_reporte, estado, evidencia_url, id_tipo_reporte, id_usuario, id_ubicacion) VALUES
('Poste de luz apagado hace tres días frente al mercado', '2024-11-10 19:00:00', 'Pendiente', NULL, 1, 2, 1),
('Basura acumulada en esquina sin recolección semanal', '2024-11-11 08:30:00', 'En proceso', 'https://reportes.com/img1.jpg', 2, 5, 2),
('Música a alto volumen desde local comercial hasta madrugada', '2024-11-12 01:00:00', 'Pendiente', NULL, 3, 6, 3),
('Zona oscura y sin patrullaje, vecinos sienten inseguridad', '2024-11-13 20:00:00', 'Pendiente', NULL, 4, 2, 4),
('Luminaria parpadeante en avenida principal', '2024-11-14 21:00:00', 'Resuelto', NULL, 1, 5, 5),
('Microbasural formado en terreno baldío', '2024-11-15 10:00:00', 'En proceso', 'https://reportes.com/img2.jpg', 2, 6, 6),
('Fiestas con ruido excesivo los fines de semana', '2024-11-16 23:00:00', 'Pendiente', NULL, 3, 2, 7),
('Callejón sin luz ni vigilancia reportado por vecinos', '2024-11-17 22:00:00', 'Pendiente', NULL, 4, 5, 8);

-- =========================================
-- INSERT: NOTIFICACION
-- =========================================

INSERT INTO notificacion (titulo, mensaje, fecha_envio, leido, id_usuario) VALUES
('Nuevo incidente en tu zona', 'Se registró un robo cerca de tu ubicación habitual.', '2024-11-10 21:10:00', FALSE, 2),
('Alerta de violencia', 'Incidente de pelea reportado en Calle Murillo.', '2024-11-11 22:35:00', TRUE, 5),
('Reporte procesado', 'Tu reporte de basura fue recibido y está en proceso.', '2024-11-11 09:00:00', TRUE, 5),
('Validación completada', 'El incidente que reportaste fue confirmado.', '2024-11-12 10:30:00', FALSE, 6),
('Patrullaje programado', 'Se programó patrullaje nocturno en tu barrio.', '2024-11-13 15:00:00', FALSE, 2),
('Alerta de riesgo alto', 'Tu barrio tiene nivel de riesgo alto esta semana.', '2024-11-18 07:00:00', FALSE, 5),
('Incidente resuelto', 'El incidente de vandalismo en tu zona fue resuelto.', '2024-11-16 20:30:00', TRUE, 2),
('Recordatorio de patrullaje', 'Tienes un patrullaje asignado mañana a las 08:00.', '2024-11-17 18:00:00', FALSE, 3);

-- =========================================
-- INSERT: PATRULLAJE
-- =========================================

INSERT INTO patrullaje (fecha, hora_inicio, hora_fin, observaciones, estado, id_usuario) VALUES
('2024-11-10', '08:00:00', '12:00:00', 'Sin novedades en sector norte', 'Completado', 3),
('2024-11-11', '20:00:00', '00:00:00', 'Se atendió llamado por pelea en Calle Murillo', 'Completado', 7),
('2024-11-12', '06:00:00', '10:00:00', 'Revisión de grafitis en parques', 'Completado', 3),
('2024-11-13', '22:00:00', '02:00:00', 'Ronda nocturna sin incidentes', 'Completado', 7),
('2024-11-14', '07:00:00', '11:00:00', 'Apoyo en zona de hurtos frecuentes', 'Completado', 3),
('2024-11-15', '00:00:00', '04:00:00', 'Atención a robo domiciliario reportado', 'Completado', 7),
('2024-11-18', '08:00:00', '12:00:00', 'Patrullaje preventivo programado', 'Programado', 3),
('2024-11-19', '20:00:00', '00:00:00', 'Patrullaje nocturno zona de riesgo alto', 'Programado', 7);


-- =========================================
-- PERMISOS TOTALES PARA ANON Y AUTHENTICATED
-- =========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON SEQUENCES TO anon, authenticated;

select *from rol;


SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
