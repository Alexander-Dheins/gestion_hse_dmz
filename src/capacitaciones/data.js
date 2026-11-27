// Cursos de la demo de Capacitaciones (contenido ficticio de referencia).
// Cada módulo es un video con 3 preguntas que se habilitan al llegar al minuto indicado.

const q = (p, ops, ok) => ({ p, ops, ok });
const R = {
  pdf: (n, t) => ({ nombre: n, tipo: 'PDF', tam: t }),
  ppt: (n, t, l) => ({ nombre: n, tipo: 'PPT', tam: `${t} · ${l} láminas` }),
};

export const CURSOS = [
  {
    id: 'ind', codigo: 'IND', nombre: 'Inducción General SSOMA', color: '#2370B8', vigencia: 12,
    areas: ['Mantenimiento', 'Seguridad (SSOMA)', 'Operaciones', 'Logística', 'Administración'],
    desc: 'Política SSOMA, reglamento interno, identificación de peligros y respuesta ante emergencias.',
    modulos: [
      { id: 'm1', titulo: 'Política y reglamento SSOMA', min: 10, recursos: [R.pdf('Reglamento interno SSOMA', '1,8 MB')], preguntas: [
        q('¿Quién es responsable de la seguridad en el trabajo?', ['Solo el supervisor HSE', 'Todos los trabajadores', 'Solo la unidad minera'], 1),
        q('Si detectas una condición insegura, ¿qué haces primero?', ['Reportarla y detener el trabajo si hay riesgo', 'Esperar a terminar el turno', 'Comentarlo en el almuerzo'], 0),
        q('El derecho a negarse a un trabajo inseguro…', ['No existe', 'Solo aplica a supervisores', 'Lo tiene todo trabajador'], 2),
      ] },
      { id: 'm2', titulo: 'Identificación de peligros (IPERC)', min: 14, recursos: [R.pdf('Formato IPERC continuo', '420 KB')], preguntas: [
        q('¿Qué es un peligro?', ['La probabilidad de un accidente', 'Una fuente con potencial de causar daño', 'Un accidente ocurrido'], 1),
        q('¿Cuándo se llena el IPERC continuo?', ['Antes de iniciar cada tarea', 'Una vez al mes', 'Solo si hubo un incidente'], 0),
        q('El control más efectivo es…', ['El EPP', 'La señalización', 'Eliminar el peligro'], 2),
      ] },
      { id: 'm3', titulo: 'EPP básico', min: 8, recursos: [R.pdf('Matriz de EPP por puesto', '310 KB')], preguntas: [
        q('¿Cuándo se inspecciona el EPP?', ['Antes de cada uso', 'Cada seis meses', 'Cuando se rompe'], 0),
        q('Si tu casco tiene una fisura…', ['Lo sigues usando con cinta', 'Lo cambias de inmediato', 'Lo usas solo en oficina'], 1),
        q('El EPP es…', ['La primera barrera de control', 'La última barrera de control', 'Opcional en planta'], 1),
      ] },
      { id: 'm4', titulo: 'Respuesta ante emergencias', min: 12, recursos: [R.ppt('Plan de respuesta a emergencias', '3,2 MB', 18)], preguntas: [
        q('Al escuchar la alarma de evacuación…', ['Terminas tu tarea', 'Vas al punto de reunión por la ruta señalizada', 'Esperas instrucciones en tu puesto'], 1),
        q('¿Qué número llamas ante una emergencia en la unidad?', ['El de tu familia', 'El de la central de emergencias de la unidad', 'Ninguno'], 1),
        q('Un extintor PQS sirve para fuegos tipo…', ['A, B y C', 'Solo A', 'Solo metales'], 0),
      ] },
    ],
  },
  {
    id: 'ta', codigo: 'TA', nombre: 'Trabajo en Altura', color: '#C8102E', vigencia: 12,
    areas: ['Mantenimiento', 'Operaciones'],
    desc: 'Arnés, línea de vida, puntos de anclaje y rescate para trabajos a más de 1,8 m.',
    modulos: [
      { id: 'm1', titulo: 'Qué es trabajo en altura', min: 12, recursos: [R.pdf('Estándar de trabajo en altura', '1,1 MB')], preguntas: [
        q('Se considera trabajo en altura a partir de…', ['1,0 m', '1,8 m', '3,0 m'], 1),
        q('¿Qué documento se necesita antes de trabajar en altura?', ['PETAR de trabajo en altura', 'Solo el IPERC', 'Ninguno'], 0),
        q('¿Quién puede trabajar en altura?', ['Cualquier trabajador', 'Personal capacitado, apto médicamente y autorizado', 'Solo el supervisor'], 1),
      ] },
      { id: 'm2', titulo: 'Arnés y línea de vida', min: 18, recursos: [R.pdf('Manual de uso del arnés', '2,4 MB'), R.ppt('Presentación del módulo', '5,1 MB', 14), R.pdf('Checklist de inspección', '380 KB')], preguntas: [
        q('¿Qué debes hacer siempre antes de ponerte el arnés?', ['Inspeccionar costuras, hebillas y argollas', 'Solo revisarlo si es nuevo', 'Pedir que lo revise un compañero al final del turno'], 0),
        q('El arnés se ajusta…', ['Holgado para moverse mejor', 'Firme, que entren dos dedos bajo las correas', 'Solo en las piernas'], 1),
        q('La línea de vida con absorbedor se conecta a…', ['La argolla dorsal del arnés', 'El cinturón', 'La argolla lateral'], 0),
      ] },
      { id: 'm3', titulo: 'Puntos de anclaje', min: 14, recursos: [R.pdf('Tabla de puntos de anclaje', '520 KB')], preguntas: [
        q('Un punto de anclaje debe resistir al menos…', ['500 kg', '1 000 kg', '2 268 kg (5 000 lb)'], 2),
        q('El anclaje debe estar…', ['Por encima del hombro', 'A la altura de los pies', 'Donde sea más cómodo'], 0),
        q('¿Puedes anclarte a una tubería de agua?', ['Sí, siempre', 'No, salvo que esté certificada como anclaje', 'Solo si es metálica'], 1),
      ] },
      { id: 'm4', titulo: 'Rescate y emergencia', min: 22, recursos: [R.ppt('Plan de rescate en altura', '4,0 MB', 20)], preguntas: [
        q('Tras una caída, el trauma por suspensión puede aparecer en…', ['Pocos minutos', 'Varias horas', 'Nunca'], 0),
        q('¿Cuándo se define el plan de rescate?', ['Después de la caída', 'Antes de iniciar el trabajo', 'Solo en auditorías'], 1),
        q('Un arnés que detuvo una caída…', ['Se sigue usando', 'Se retira de servicio', 'Se lava y se reutiliza'], 1),
      ] },
    ],
  },
  {
    id: 'loto', codigo: 'LOTO', nombre: 'Bloqueo y Etiquetado', color: '#B45309', vigencia: 12,
    areas: ['Mantenimiento', 'Operaciones'],
    desc: 'Control de energías peligrosas antes de intervenir equipos (molinos, fajas, chancadoras).',
    modulos: [
      { id: 'm1', titulo: 'Energías peligrosas', min: 11, recursos: [R.pdf('Estándar LOTO', '900 KB')], preguntas: [
        q('¿Cuál NO es una energía peligrosa?', ['Eléctrica', 'Hidráulica', 'La luz del día'], 2),
        q('La energía residual es…', ['La que queda almacenada después de apagar', 'La que sobra del turno', 'Un tipo de corriente'], 0),
        q('Un molino detenido puede tener energía…', ['Ninguna', 'Gravitacional por la carga', 'Solo eléctrica'], 1),
      ] },
      { id: 'm2', titulo: 'Pasos del bloqueo', min: 15, recursos: [R.pdf('Tarjeta de pasos LOTO', '210 KB')], preguntas: [
        q('¿Cuántos candados pone cada trabajador?', ['Uno por grupo', 'Uno personal por cada trabajador', 'Ninguno si hay supervisor'], 1),
        q('La llave del candado personal la tiene…', ['El supervisor', 'El dueño del candado', 'El almacén'], 1),
        q('Antes de bloquear se debe…', ['Avisar a los involucrados y apagar el equipo', 'Retirar las guardas', 'Firmar la salida'], 0),
      ] },
      { id: 'm3', titulo: 'Verificación de energía cero', min: 9, recursos: [R.pdf('Checklist de energía cero', '180 KB')], preguntas: [
        q('¿Cómo verificas energía cero?', ['Intentando arrancar el equipo y midiendo', 'Mirando el tablero', 'Preguntando al operador'], 0),
        q('Si la verificación falla…', ['Se trabaja con cuidado', 'Se detiene y se revisa el bloqueo', 'Se avisa al final'], 1),
        q('¿Quién retira tu candado?', ['Tú mismo', 'Cualquiera del turno', 'El operador'], 0),
      ] },
    ],
  },
  {
    id: 'sq', codigo: 'SQ', nombre: 'Sustancias Químicas', color: '#7C3AED', vigencia: 24,
    areas: ['Mantenimiento', 'Seguridad (SSOMA)', 'Operaciones', 'Logística'],
    desc: 'Hojas de seguridad (SDS), rotulado, almacenamiento y atención de derrames.',
    modulos: [
      { id: 'm1', titulo: 'Hojas de datos de seguridad (SDS)', min: 10, recursos: [R.pdf('Cómo leer una SDS', '640 KB')], preguntas: [
        q('¿Cuántas secciones tiene una SDS?', ['8', '16', '24'], 1),
        q('¿Dónde está el EPP requerido en la SDS?', ['Sección 8', 'Sección 1', 'No aparece'], 0),
        q('La SDS debe estar…', ['Disponible donde se usa el producto', 'Solo en Lima', 'Con el proveedor'], 0),
      ] },
      { id: 'm2', titulo: 'Rotulado y almacenamiento', min: 12, recursos: [R.pdf('Matriz de compatibilidad', '350 KB')], preguntas: [
        q('El rombo NFPA rojo indica…', ['Salud', 'Inflamabilidad', 'Reactividad'], 1),
        q('¿Se pueden guardar ácidos junto a bases?', ['Sí', 'No, son incompatibles', 'Solo de noche'], 1),
        q('Un envase sin rótulo…', ['Se usa igual', 'Se reporta y no se usa', 'Se huele para identificarlo'], 1),
      ] },
      { id: 'm3', titulo: 'Atención de derrames', min: 13, recursos: [R.ppt('Kit antiderrames', '2,2 MB', 9)], preguntas: [
        q('Lo primero ante un derrame es…', ['Limpiar con trapo', 'Aislar el área y avisar', 'Echar agua'], 1),
        q('El material absorbente usado se dispone como…', ['Residuo peligroso', 'Basura común', 'Reciclable'], 0),
        q('El kit antiderrames debe estar…', ['Cerca del punto de uso', 'En la oficina', 'En el campamento'], 0),
      ] },
    ],
  },
  {
    id: 'pa', codigo: 'PA', nombre: 'Primeros Auxilios', color: '#15803D', vigencia: 24,
    areas: ['Mantenimiento', 'Seguridad (SSOMA)', 'Operaciones', 'Logística', 'Administración'],
    desc: 'Evaluación de la víctima, RCP básico, hemorragias y fracturas.',
    modulos: [
      { id: 'm1', titulo: 'Evaluación de la víctima', min: 9, recursos: [R.pdf('Guía rápida de primeros auxilios', '1,2 MB')], preguntas: [
        q('Lo primero al llegar a una emergencia es…', ['Verificar que la escena sea segura', 'Mover a la víctima', 'Dar agua'], 0),
        q('Si la víctima no responde…', ['Pides ayuda y verificas respiración', 'Esperas', 'La sientas'], 0),
        q('¿Debes mover a una víctima con posible lesión de columna?', ['Sí, siempre', 'Solo si hay peligro inminente', 'Sí, para que esté cómoda'], 1),
      ] },
      { id: 'm2', titulo: 'RCP básico', min: 15, recursos: [R.ppt('RCP paso a paso', '3,6 MB', 12)], preguntas: [
        q('Frecuencia de compresiones en adultos:', ['60 por minuto', '100 a 120 por minuto', '200 por minuto'], 1),
        q('Profundidad de compresión en adultos:', ['1 cm', '5 a 6 cm', '10 cm'], 1),
        q('Si hay un DEA disponible…', ['Se usa lo antes posible', 'Solo lo usa un médico', 'Se usa al final'], 0),
      ] },
      { id: 'm3', titulo: 'Hemorragias y fracturas', min: 11, recursos: [R.pdf('Inmovilización de fracturas', '780 KB')], preguntas: [
        q('Ante una hemorragia externa, primero…', ['Presión directa sobre la herida', 'Torniquete siempre', 'Lavar con alcohol'], 0),
        q('Una fractura se inmoviliza…', ['Incluyendo articulaciones arriba y abajo', 'Solo en el punto de dolor', 'No se inmoviliza'], 0),
        q('¿Se debe acomodar un hueso expuesto?', ['Sí', 'No, se cubre y se inmoviliza', 'Solo si duele'], 1),
      ] },
    ],
  },
  {
    id: 'ec', codigo: 'EC', nombre: 'Espacios Confinados', color: '#0F766E', vigencia: 12,
    areas: ['Mantenimiento'],
    desc: 'Riesgos atmosféricos, permiso de ingreso, vigía y rescate en espacios confinados.',
    modulos: [
      { id: 'm1', titulo: 'Riesgos atmosféricos', min: 12, recursos: [R.pdf('Límites de gases', '260 KB')], preguntas: [
        q('Rango seguro de oxígeno:', ['15 % a 18 %', '19,5 % a 23,5 %', '25 % a 30 %'], 1),
        q('¿Cuándo se mide la atmósfera?', ['Antes de ingresar y de forma continua', 'Solo al salir', 'Una vez al día'], 0),
        q('El interior de un molino detenido…', ['Nunca es espacio confinado', 'Puede ser espacio confinado', 'Es zona libre'], 1),
      ] },
      { id: 'm2', titulo: 'Permiso de ingreso y vigía', min: 13, recursos: [R.pdf('PETAR de espacio confinado', '410 KB')], preguntas: [
        q('El vigía…', ['Ingresa a ayudar', 'Permanece afuera en todo momento', 'Puede retirarse un rato'], 1),
        q('El PETAR de espacio confinado lo firma…', ['Solo el trabajador', 'Los responsables definidos antes del ingreso', 'Nadie'], 1),
        q('¿Cuántas personas mínimo hay en un ingreso?', ['1', '2 (entrante y vigía)', 'No importa'], 1),
      ] },
      { id: 'm3', titulo: 'Rescate en espacios confinados', min: 16, recursos: [R.ppt('Equipos de rescate', '4,4 MB', 16)], preguntas: [
        q('Si el entrante se desvanece, el vigía…', ['Entra a sacarlo', 'Activa el rescate sin ingresar', 'Espera'], 1),
        q('El trípode de rescate se instala…', ['Antes del ingreso', 'Después del incidente', 'Solo en auditorías'], 0),
        q('El equipo de rescate debe estar…', ['Disponible e inspeccionado', 'En almacén central', 'Opcional'], 0),
      ] },
    ],
  },
];

export const NOTA_MIN = 14;
export const INTENTOS_MAX = 3;

export const curso = (id) => CURSOS.find((c) => c.id === id);
export const durSeg = (m) => m.min * 60;
export const pregEn = (m) => Math.max(30, m.min * 60 - 90);
export const totalPreguntas = (c) => c.modulos.reduce((a, m) => a + m.preguntas.length, 0);

export const fmtMMSS = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
