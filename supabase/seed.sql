-- Limpiar datos anteriores y reiniciar secuencias
TRUNCATE TABLE recomendaciones, productos, categorias RESTART IDENTITY CASCADE;

-- Categorías para UPIITA
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Electrónica', 'Componentes electrónicos, microcontroladores y sensores'),
  ('Herramientas', 'Equipos de medición y herramientas de laboratorio'),
  ('Cómputo', 'Cables, memorias USB, adaptadores y periféricos'),
  ('Libros y Apuntes', 'Manuales técnicos, libros de texto y guías de estudio'),
  ('Papelería Técnica', 'Material de dibujo técnico y papelería especializada'),
  ('Mecatrónica', 'Motores, servos, engranes y partes mecánicas');

-- Productos para estudiantes de ingeniería UPIITA
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
  -- Electrónica
  ('Arduino UNO R3', 'Microcontrolador ATmega328P, ideal para proyectos de electrónica y automatización. Incluye cable USB.', 189.00, 30, 1),
  ('Raspberry Pi 4 Model B 4GB', 'Mini computadora de placa única con 4GB RAM, WiFi y Bluetooth. Perfecta para proyectos de IoT y visión computacional.', 1250.00, 10, 1),
  ('Protoboard 830 puntos', 'Tablero de pruebas sin soldadura con 830 puntos de conexión. Esencial para laboratorios de circuitos.', 65.00, 80, 1),
  ('Kit 400 componentes electrónicos', 'Incluye resistencias, capacitores, LEDs, transistores, diodos y más. Para prácticas de circuitos analógicos y digitales.', 149.00, 25, 1),
  ('Sensor ultrasónico HC-SR04', 'Sensor de distancia por ultrasonido, rango 2cm a 400cm. Usado en robótica y sistemas embebidos.', 45.00, 60, 1),
  ('Módulo Bluetooth HC-05', 'Módulo de comunicación inalámbrica Bluetooth para Arduino. Usado en proyectos de control remoto.', 89.00, 40, 1),
  ('ESP32 DevKit V1', 'Microcontrolador con WiFi y Bluetooth integrados. Ideal para proyectos de IoT y conectividad inalámbrica.', 129.00, 35, 1),
  ('Display LCD 16x2 con I2C', 'Pantalla LCD de 16 caracteres por 2 líneas con módulo I2C. Para proyectos de interfaz de usuario.', 75.00, 45, 1),

  -- Herramientas
  ('Multímetro digital Fluke 107', 'Multímetro digital portátil para medición de voltaje, corriente y resistencia. Uso en laboratorios de electricidad.', 890.00, 15, 2),
  ('Soldador de estaño 40W', 'Soldador de punta fina 40W con base de apoyo. Incluye estaño y esponja limpiadora.', 185.00, 20, 2),
  ('Pinzas de punta fina (juego 5 piezas)', 'Set de 5 pinzas de precisión para electrónica: plana, punta fina, curva, diagonal y universal.', 120.00, 30, 2),
  ('Fuente de poder regulable 0-30V 5A', 'Fuente de alimentación DC ajustable para laboratorio con display digital de voltaje y corriente.', 750.00, 8, 2),
  ('Osciloscopio digital DSO138', 'Osciloscopio digital de bolsillo, ideal para estudiantes. Rango 0-200KHz, pantalla TFT 2.4".', 480.00, 12, 2),

  -- Cómputo
  ('Cable USB-C a USB-A 2m', 'Cable de transferencia de datos y carga rápida de 2 metros. Compatible con Arduino, Raspberry Pi y laptops.', 89.00, 100, 3),
  ('Memoria USB 32GB Kingston', 'Memoria USB 3.0 de 32GB para transferencia rápida de datos y proyectos.', 120.00, 50, 3),
  ('Adaptador HDMI a VGA', 'Adaptador para conectar laptop a proyectores y monitores VGA. Esencial en presentaciones y laboratorios.', 99.00, 40, 3),
  ('Hub USB 4 puertos 3.0', 'Concentrador USB 3.0 de 4 puertos con cable de 30cm. Para conectar múltiples dispositivos.', 149.00, 35, 3),
  ('Tarjeta SD 32GB Clase 10', 'Tarjeta microSD de 32GB Clase 10 para Raspberry Pi y proyectos de almacenamiento.', 95.00, 60, 3),

  -- Libros
  ('Fundamentos de Circuitos Eléctricos - Sadiku', 'Texto fundamental para las materias de Circuitos I y II. 5ta edición en español con ejercicios resueltos.', 420.00, 15, 4),
  ('Sistemas de Control Automático - Ogata', 'Libro de referencia para Control Automático. Incluye análisis en el dominio del tiempo y frecuencia.', 380.00, 12, 4),
  ('El Arte de Programar en C - Jeri Váldes', 'Guía práctica de programación en C para ingeniería. Incluye ejemplos de microcontroladores.', 210.00, 20, 4),
  ('Álgebra Lineal con Aplicaciones - Grossman', 'Texto recomendado para Álgebra Lineal. Enfocado en aplicaciones de ingeniería con ejercicios paso a paso.', 350.00, 10, 4),

  -- Papelería Técnica
  ('Juego de escuadras 30/60 y 45°', 'Escuadras de acrílico transparente de 30cm para dibujo técnico y trazo de planos.', 85.00, 40, 5),
  ('Compás de precisión metálico', 'Compás de metal para dibujo técnico con ajuste fino. Incluye portaminas y extensión.', 120.00, 25, 5),
  ('Papel bond A3 (paquete 50 hojas)', 'Papel bond 90g tamaño A3 para planos y dibujos técnicos.', 75.00, 50, 5),
  ('Plumones para pizarrón (set 4 colores)', 'Marcadores para pizarrón de borrado en seco: negro, azul, rojo y verde.', 65.00, 70, 5),

  -- Mecatrónica
  ('Motor paso a paso NEMA 17', 'Motor de pasos para CNC y robótica. Torque 4.4 kg-cm, 1.8° por paso. Incluye conector.', 220.00, 20, 6),
  ('Servomotor SG90 9g', 'Micro servo de 9g con torque 1.8 kg-cm. Ideal para robots y proyectos de control de posición.', 55.00, 50, 6),
  ('Driver L298N para motores DC', 'Módulo puente H para controlar 2 motores DC o 1 motor paso a paso desde Arduino.', 75.00, 45, 6),
  ('Chasis robot 4WD con motores', 'Kit de chasis para robot de 4 ruedas con 4 motores DC y reductores. Plataforma de aluminio.', 340.00, 15, 6);

-- Recomendaciones destacadas
INSERT INTO recomendaciones (producto_id, tipo, orden)
SELECT id, 'destacado', 1 FROM productos WHERE nombre = 'Arduino UNO R3';
INSERT INTO recomendaciones (producto_id, tipo, orden)
SELECT id, 'nuevo', 2 FROM productos WHERE nombre = 'ESP32 DevKit V1';
INSERT INTO recomendaciones (producto_id, tipo, orden)
SELECT id, 'oferta', 3 FROM productos WHERE nombre = 'Kit 400 componentes electrónicos';
INSERT INTO recomendaciones (producto_id, tipo, orden)
SELECT id, 'destacado', 4 FROM productos WHERE nombre = 'Multímetro digital Fluke 107';
INSERT INTO recomendaciones (producto_id, tipo, orden)
SELECT id, 'nuevo', 5 FROM productos WHERE nombre = 'Raspberry Pi 4 Model B 4GB';
