// Datos 100% ficticios para la demo. Ninguna persona, unidad ni empresa es real.
import { buildIpercContinuo, buildMonitoreos, buildResiduos, buildDerrames, buildAspectos, buildPasso, buildActas, buildRequisitos, buildAuditorias, buildCambios } from './seed2.js';
import {
  TALLERES, buildHallazgos, buildProgramaInspecciones, buildNoConformidades, buildEventos, buildPlanesEventos,
  buildHht, buildCartillas, buildDocumentosSgsst, CLASE_INCIDENTES_PREVIOS, tipoDeClase,
} from './seed3.js';

const DAY = 86400000;
export const iso = (offsetDays = 0) => {
  const t = new Date(Date.now() + offsetDays * DAY);
  return t.toISOString().slice(0, 10);
};

// Generador pseudoaleatorio determinístico (misma data en cada carga inicial)
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20261125);
const pick = (arr) => arr[Math.floor(r() * arr.length)];
const between = (a, b) => Math.floor(a + r() * (b - a + 1));

export const ROLES = {
  gerente: { nombre: 'Gerente de Seguridad', alcance: 'Todas las unidades', todas: true },
  lider: { nombre: 'Líder HSE de unidad', alcance: 'Su unidad', todas: false },
  supervisor: { nombre: 'Supervisor HSE', alcance: 'Su unidad / turno', todas: false },
  asistente: { nombre: 'Asistente HSE', alcance: 'Su unidad', todas: false },
  analista: { nombre: 'Analista HSE', alcance: 'Todas las unidades', todas: true },
  sup_mant: { nombre: 'Supervisor de mantenimiento', alcance: 'Su parada', todas: false },
  medico: { nombre: 'Médico ocupacional', alcance: 'Todas las unidades', todas: true },
  trabajador: { nombre: 'Trabajador', alcance: 'Lo propio', todas: false },
};

export const UNIDADES = [
  { id: 'UM1', nombre: 'U.M. Cerro Azul', titular: 'Minera Andes del Sur S.A.A. (ficticia)', region: 'Arequipa', planta: 'Concentradora Cerro Azul · 48 000 tpd', formato: 'RD-HSE-CA-01', contacto: 'Ing. Raúl Pinto (SSO del titular)', estandares: 34 },
  { id: 'UM2', nombre: 'U.M. Pampa Roja', titular: 'Compañía Minera Pampa Roja S.A. (ficticia)', region: 'Moquegua', planta: 'Concentradora Pampa Roja · 60 000 tpd', formato: 'F-SSO-PR-112', contacto: 'Ing. Sonia Valdez', estandares: 41 },
  { id: 'UM3', nombre: 'U.M. Kallpa Norte', titular: 'Kallpa Mining S.A.C. (ficticia)', region: 'Áncash', planta: 'Planta Kallpa · 22 000 tpd', formato: 'KN-HSE-DIA', contacto: 'Ing. Marco Ríos', estandares: 28 },
  { id: 'UM4', nombre: 'U.M. Antaccasa', titular: 'Sociedad Minera Antaccasa S.A. (ficticia)', region: 'Apurímac', planta: 'Concentradora Antaccasa · 35 000 tpd', formato: 'ANT-SSO-07', contacto: 'Ing. Lucía Ortega', estandares: 30 },
  { id: 'UM5', nombre: 'U.M. Rumi Wasi', titular: 'Rumi Wasi Resources S.A. (ficticia)', region: 'Junín', planta: 'Planta Rumi Wasi · 9 000 tpd', formato: 'RW-REP-HSE', contacto: 'Ing. Hugo Paredes', estandares: 22 },
  { id: 'UM6', nombre: 'U.M. Llamac', titular: 'Minera Llamac S.A.A. (ficticia)', region: 'Pasco', planta: 'Concentradora Llamac · 12 500 tpd', formato: 'LL-SSOMA-02', contacto: 'Ing. Pilar Cano', estandares: 25 },
  { id: 'UM7', nombre: 'U.M. Qori Pata', titular: 'Qori Pata Gold S.A. (ficticia)', region: 'Cusco', planta: 'Planta Qori Pata · 15 000 tpd', formato: 'QP-HSE-D', contacto: 'Ing. Elmer Soto', estandares: 27 },
];

export const USUARIOS = [
  { id: 'u1', nombre: 'Carla Mendoza', rol: 'gerente', unidad: null, cargo: 'Gerente Corporativo de Seguridad' },
  { id: 'u2', nombre: 'Jorge Quispe', rol: 'lider', unidad: 'UM1', cargo: 'Líder HSE – Cerro Azul' },
  { id: 'u3', nombre: 'Rosa Huamán', rol: 'lider', unidad: 'UM2', cargo: 'Líder HSE – Pampa Roja' },
  { id: 'u4', nombre: 'Luis Torres', rol: 'supervisor', unidad: 'UM1', cargo: 'Supervisor HSE de campo' },
  { id: 'u5', nombre: 'Milagros Rojas', rol: 'asistente', unidad: 'UM1', cargo: 'Asistente HSE' },
  { id: 'u6', nombre: 'Diego Salas', rol: 'analista', unidad: null, cargo: 'Analista HSE' },
  { id: 'u7', nombre: 'Pedro Ccori', rol: 'sup_mant', unidad: 'UM1', cargo: 'Supervisor de mantenimiento' },
  { id: 'u8', nombre: 'Dra. Ana Villanueva', rol: 'medico', unidad: null, cargo: 'Médico ocupacional' },
  { id: 'u9', nombre: 'Juan Mamani', rol: 'trabajador', unidad: 'UM1', cargo: 'Técnico mecánico', personalId: 'T-001' },
];

const NOMBRES = ['Juan', 'Carlos', 'Luis', 'Miguel', 'José', 'Pedro', 'Víctor', 'Raúl', 'Edwin', 'Wilber', 'Freddy', 'Elvis', 'Hugo', 'Javier', 'Ronald', 'Marco', 'Yesenia', 'Karina', 'Liliana', 'Gladys'];
const APELLIDOS = ['Mamani', 'Quispe', 'Huamán', 'Condori', 'Flores', 'Ccahua', 'Rojas', 'Chávez', 'Vargas', 'Apaza', 'Choque', 'Ramos', 'Cruz', 'Torres', 'Salazar', 'Huanca', 'Paucar', 'Laura', 'Mendoza', 'Ticona'];
const CARGOS = ['Técnico mecánico', 'Mecánico de molinos', 'Soldador homologado', 'Rigger', 'Operador de grúa', 'Electricista', 'Vigía de espacio confinado', 'Ayudante mecánico', 'Técnico de lainas', 'Capataz'];

export function buildPersonal() {
  const lista = [];
  const unidadesConPersonal = ['UM1', 'UM1', 'UM1', 'UM2', 'UM2', 'UM3', 'UM4', 'UM5', 'UM6', 'UM7'];
  for (let i = 1; i <= 48; i++) {
    const id = 'T-' + String(i).padStart(3, '0');
    const unidad = i <= 12 ? 'UM1' : i <= 18 ? 'UM2' : pick(unidadesConPersonal);
    const nombre = i === 1 ? 'Juan Mamani Condori' : `${pick(NOMBRES)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
    const cargo = i === 1 ? 'Técnico mecánico' : pick(CARGOS);
    // la mayoría vigente, algunos por vencer o vencidos
    const vto = () => {
      const x = r();
      if (i === 1) return iso(between(120, 300));
      if (x < 0.1) return iso(-between(1, 40));
      if (x < 0.22) return iso(between(1, 25));
      return iso(between(40, 330));
    };
    const aptRand = r();
    lista.push({
      id, nombre, cargo, unidad,
      emoVence: i === 7 ? iso(-3) : vto(),
      sctrVence: vto(),
      induccionVence: i === 12 ? iso(-10) : vto(),
      aptitud: aptRand < 0.08 ? 'Apto con restricciones' : aptRand < 0.1 ? 'No apto' : 'Apto',
      restriccion: aptRand < 0.08 ? 'No trabajos en altura mayor a 1.8 m' : '',
      diagnostico: aptRand < 0.08 ? 'Hipoacusia leve (dato confidencial)' : 'Sin hallazgos relevantes',
      telefono: '9' + between(10000000, 99999999),
    });
  }
  return lista;
}

export function buildParadas() {
  return [
    { id: 'P-2026-031', unidad: 'UM1', equipo: "Molino de bolas 16'x24' (ML-02)", tipo: 'Cambio de lainas y revisión de piñón', inicio: iso(-2), fin: iso(3), estado: 'En curso', avance: 46, jefe: 'u7', hse: 'u4', cuadrilla: ['T-001', 'T-002', 'T-003', 'T-004', 'T-005', 'T-006', 'T-007', 'T-008'],
      tareas: ['Bloqueo de energías del molino y motor principal', 'Ingreso a interior del molino (espacio confinado)', 'Retiro de lainas con manipulador', 'Izaje de piñón (8.5 t) con grúa de 60 t', 'Soldadura de pernos de lainas'],
      checklist: [
        { item: 'Personal acreditado y con EMO vigente', ok: false },
        { item: 'IPERC de la parada aprobado', ok: true },
        { item: 'Plan de izaje crítico firmado', ok: true },
        { item: 'Matriz de bloqueo (LOTO) validada por planta', ok: true },
        { item: 'Monitoreo de gases calibrado', ok: true },
        { item: 'Rescate en espacio confinado coordinado', ok: false },
      ] },
    { id: 'P-2026-032', unidad: 'UM1', equipo: "Molino de bolas 13'x20' (ML-04)", tipo: 'Mantenimiento preventivo de chumaceras', inicio: iso(9), fin: iso(12), estado: 'Planificada', avance: 0, jefe: 'u7', hse: 'u4', cuadrilla: ['T-002', 'T-009', 'T-010', 'T-011', 'T-012'],
      tareas: ['Bloqueo de energías', 'Izaje de tapas de chumacera', 'Inspección de metal antifricción'],
      checklist: [
        { item: 'Personal acreditado y con EMO vigente', ok: false },
        { item: 'IPERC de la parada aprobado', ok: false },
        { item: 'Matriz de bloqueo (LOTO) validada por planta', ok: false },
      ] },
    { id: 'P-2026-027', unidad: 'UM2', equipo: "Molino SAG 32'x15' (SAG-01)", tipo: 'Cambio de parrillas y lifters', inicio: iso(-18), fin: iso(-12), estado: 'Cerrada', avance: 100, jefe: 'u7', hse: 'u3', cuadrilla: [], tareas: ['Bloqueo de energías', 'Ingreso a molino', 'Izaje con manipulador de lainas'], checklist: [] },
    { id: 'P-2026-033', unidad: 'UM2', equipo: "Molino de bolas 18'x30' (MB-01)", tipo: 'Overhaul de reductor', inicio: iso(-1), fin: iso(5), estado: 'En curso', avance: 22, jefe: 'u7', hse: 'u3', cuadrilla: [], tareas: ['Bloqueo de energías', 'Izaje de reductor (14 t)', 'Trabajo en caliente en base'], checklist: [] },
    { id: 'P-2026-029', unidad: 'UM3', equipo: 'Chancadora cónica HP-500', tipo: 'Cambio de mantos y cóncavos', inicio: iso(-9), fin: iso(-7), estado: 'Cerrada', avance: 100, jefe: 'u7', hse: null, cuadrilla: [], tareas: ['Bloqueo', 'Izaje de manto'], checklist: [] },
    { id: 'P-2026-034', unidad: 'UM4', equipo: "Molino de bolas 14'x22' (ML-01)", tipo: 'Cambio de lainas', inicio: iso(15), fin: iso(19), estado: 'Planificada', avance: 0, jefe: 'u7', hse: null, cuadrilla: [], tareas: ['Bloqueo', 'Espacio confinado', 'Izaje'], checklist: [] },
    { id: 'P-2026-030', unidad: 'UM5', equipo: 'Faja transportadora CV-05', tipo: 'Cambio de polines y empalme', inicio: iso(-5), fin: iso(-4), estado: 'Cerrada', avance: 100, jefe: 'u7', hse: null, cuadrilla: [], tareas: ['Bloqueo', 'Trabajo en caliente (vulcanizado)'], checklist: [] },
    { id: 'P-2026-035', unidad: 'UM7', equipo: "Molino de bolas 12'x18' (MB-02)", tipo: 'Alineamiento de corona', inicio: iso(1), fin: iso(4), estado: 'Planificada', avance: 0, jefe: 'u7', hse: null, cuadrilla: [], tareas: ['Bloqueo', 'Izaje', 'Trabajo en altura'], checklist: [] },
  ];
}

export const TIPOS_PERMISO = {
  LOTO: 'Bloqueo y etiquetado (LOTO)',
  EC: 'PETAR – Espacio confinado',
  TC: 'PETAR – Trabajo en caliente',
  IZ: 'PETAR – Izaje crítico',
  TA: 'PETAR – Trabajo en altura',
};

// Secuencia de firmas por tipo (configurable por unidad en el sistema real)
export const FLUJO_FIRMAS = ['trabajador', 'sup_mant', 'supervisor', 'lider'];
export const ETIQUETA_FIRMA = {
  trabajador: 'Ejecutante',
  sup_mant: 'Responsable del trabajo',
  supervisor: 'Supervisor HSE',
  lider: 'Aprobación jefe HSE',
};

const firma = (rol, userId, dias) => ({ rol, userId, fecha: userId ? iso(dias) + ' ' + pick(['06:40', '07:05', '07:20', '07:45', '13:10']) : null });

export function buildPermisos() {
  return [
    { id: 'PT-1041', tipo: 'LOTO', paradaId: 'P-2026-031', unidad: 'UM1', tarea: 'Bloqueo de motor principal y embrague neumático del ML-02', fecha: iso(-2), estado: 'Aprobado',
      puntos: [{ equipo: 'Motor principal 4 500 HP', energia: 'Eléctrica 4.16 kV', candado: 'C-118', verificado: true }, { equipo: 'Embrague neumático', energia: 'Neumática', candado: 'C-119', verificado: true }, { equipo: 'Sistema de lubricación', energia: 'Hidráulica', candado: 'C-120', verificado: true }],
      firmas: [firma('trabajador', 'u9', -2), firma('sup_mant', 'u7', -2), firma('supervisor', 'u4', -2), firma('lider', 'u2', -2)] },
    { id: 'PT-1042', tipo: 'EC', paradaId: 'P-2026-031', unidad: 'UM1', tarea: 'Ingreso al interior del molino ML-02 para retiro de lainas', fecha: iso(0), estado: 'Pendiente firmas',
      gases: { o2: '20.8 %', lel: '0 %', co: '2 ppm', h2s: '0 ppm' }, vigia: 'T-007',
      firmas: [firma('trabajador', 'u9', 0), firma('sup_mant', 'u7', 0), firma('supervisor', null), firma('lider', null)] },
    { id: 'PT-1043', tipo: 'IZ', paradaId: 'P-2026-031', unidad: 'UM1', tarea: 'Izaje de piñón 8.5 t con grúa telescópica 60 t', fecha: iso(1), estado: 'Pendiente firmas',
      izaje: { carga: '8.5 t', capacidad: '60 t', radio: '9 m', porcentaje: '62 %' },
      firmas: [firma('trabajador', null), firma('sup_mant', null), firma('supervisor', null), firma('lider', null)] },
    { id: 'PT-1038', tipo: 'TC', paradaId: 'P-2026-031', unidad: 'UM1', tarea: 'Soldadura de pernos de lainas en casco', fecha: iso(-1), estado: 'Cerrado',
      firmas: [firma('trabajador', 'u9', -1), firma('sup_mant', 'u7', -1), firma('supervisor', 'u4', -1), firma('lider', 'u2', -1)] },
    { id: 'PT-2210', tipo: 'LOTO', paradaId: 'P-2026-033', unidad: 'UM2', tarea: 'Bloqueo de reductor y motor del MB-01', fecha: iso(-1), estado: 'Aprobado',
      puntos: [{ equipo: 'Motor 3 800 HP', energia: 'Eléctrica', candado: 'C-301', verificado: true }],
      firmas: [firma('trabajador', null, -1), firma('sup_mant', 'u7', -1), firma('supervisor', 'u3', -1), firma('lider', 'u3', -1)] },
    { id: 'PT-2211', tipo: 'IZ', paradaId: 'P-2026-033', unidad: 'UM2', tarea: 'Izaje de reductor 14 t', fecha: iso(0), estado: 'Pendiente firmas',
      firmas: [firma('trabajador', null), firma('sup_mant', 'u7', 0), firma('supervisor', null), firma('lider', null)] },
    { id: 'PT-2212', tipo: 'TC', paradaId: 'P-2026-033', unidad: 'UM2', tarea: 'Corte y soldadura en base de reductor', fecha: iso(1), estado: 'Borrador',
      firmas: [firma('trabajador', null), firma('sup_mant', null), firma('supervisor', null), firma('lider', null)] },
    { id: 'PT-3105', tipo: 'TA', paradaId: 'P-2026-035', unidad: 'UM7', tarea: 'Trabajo en plataforma de corona a 4 m', fecha: iso(1), estado: 'Borrador',
      firmas: [firma('trabajador', null), firma('sup_mant', null), firma('supervisor', null), firma('lider', null)] },
  ];
}

export function buildIperc() {
  return [
    { id: 'IP-01', unidad: 'UM1', tarea: 'Ingreso al interior del molino', peligro: 'Atmósfera deficiente de oxígeno', riesgo: 'Asfixia', p: 3, s: 5, control: 'Monitoreo continuo de gases, ventilación forzada, vigía y plan de rescate', pr: 1, sr: 5 },
    { id: 'IP-02', unidad: 'UM1', tarea: 'Ingreso al interior del molino', peligro: 'Giro inesperado del molino', riesgo: 'Atrapamiento, muerte', p: 2, s: 5, control: 'LOTO de todas las energías, prueba de arranque en cero, candado personal', pr: 1, sr: 5 },
    { id: 'IP-03', unidad: 'UM1', tarea: 'Retiro de lainas', peligro: 'Caída de lainas sueltas', riesgo: 'Golpe, aplastamiento', p: 3, s: 4, control: 'Uso de manipulador, zona de exclusión, inspección previa', pr: 2, sr: 3 },
    { id: 'IP-04', unidad: 'UM1', tarea: 'Izaje de piñón', peligro: 'Carga suspendida', riesgo: 'Aplastamiento', p: 3, s: 5, control: 'Plan de izaje crítico, rigger certificado, aparejos inspeccionados', pr: 1, sr: 4 },
    { id: 'IP-05', unidad: 'UM1', tarea: 'Soldadura de pernos', peligro: 'Chispas y material incandescente', riesgo: 'Quemaduras, incendio', p: 3, s: 3, control: 'PETAR de trabajo en caliente, extintor, vigía contra incendio', pr: 2, sr: 2 },
    { id: 'IP-06', unidad: 'UM1', tarea: 'Manipulación de herramientas de torque', peligro: 'Ruido > 85 dB', riesgo: 'Hipoacusia', p: 4, s: 3, control: 'Protección auditiva doble, rotación de personal', pr: 2, sr: 2 },
    { id: 'IP-07', unidad: 'UM2', tarea: 'Izaje de reductor', peligro: 'Falla de aparejos', riesgo: 'Aplastamiento', p: 2, s: 5, control: 'Aparejos con certificado vigente, prueba de carga', pr: 1, sr: 4 },
    { id: 'IP-08', unidad: 'UM2', tarea: 'Trabajos en base de reductor', peligro: 'Superficies resbaladizas por aceite', riesgo: 'Caída a nivel', p: 4, s: 2, control: 'Limpieza, paños absorbentes, orden y limpieza', pr: 2, sr: 1 },
  ];
}

export function buildInspecciones() {
  return [
    { id: 'IN-0581', tipo: 'Inspección planeada de área', unidad: 'UM1', paradaId: 'P-2026-031', fecha: iso(-1), inspector: 'u4', cumplimiento: 86, hallazgos: 2, estado: 'Con hallazgos' },
    { id: 'IN-0582', tipo: 'Observación de comportamiento', unidad: 'UM1', paradaId: 'P-2026-031', fecha: iso(-1), inspector: 'u4', cumplimiento: 92, hallazgos: 1, estado: 'Con hallazgos' },
    { id: 'IN-0583', tipo: 'Inspección de aparejos de izaje', unidad: 'UM1', paradaId: 'P-2026-031', fecha: iso(0), inspector: 'u4', cumplimiento: 100, hallazgos: 0, estado: 'Conforme' },
    { id: 'IN-0575', tipo: 'Inspección de EPP', unidad: 'UM1', paradaId: null, fecha: iso(-6), inspector: 'u5', cumplimiento: 78, hallazgos: 3, estado: 'Con hallazgos' },
    { id: 'IN-0612', tipo: 'Inspección planeada de área', unidad: 'UM2', paradaId: 'P-2026-033', fecha: iso(0), inspector: 'u3', cumplimiento: 81, hallazgos: 2, estado: 'Con hallazgos' },
    { id: 'IN-0598', tipo: 'Inspección de herramientas eléctricas', unidad: 'UM2', paradaId: null, fecha: iso(-8), inspector: 'u3', cumplimiento: 95, hallazgos: 1, estado: 'Con hallazgos' },
    { id: 'IN-0701', tipo: 'Inspección planeada de área', unidad: 'UM3', paradaId: 'P-2026-029', fecha: iso(-8), inspector: 'u6', cumplimiento: 90, hallazgos: 1, estado: 'Con hallazgos' },
    { id: 'IN-0802', tipo: 'Inspección de extintores', unidad: 'UM4', paradaId: null, fecha: iso(-12), inspector: 'u6', cumplimiento: 100, hallazgos: 0, estado: 'Conforme' },
    { id: 'IN-0903', tipo: 'Observación de comportamiento', unidad: 'UM5', paradaId: 'P-2026-030', fecha: iso(-5), inspector: 'u6', cumplimiento: 88, hallazgos: 1, estado: 'Con hallazgos' },
  ];
}

export const CHECKLIST_BASE = [
  'Área señalizada y delimitada',
  'Personal con EPP completo y en buen estado',
  'Permisos de trabajo visibles y firmados',
  'Candados y tarjetas LOTO colocados',
  'Herramientas inspeccionadas (cinta de color del mes)',
  'Orden y limpieza del área',
  'Extintor operativo a menos de 10 m',
  'Vías de evacuación libres',
];

export function buildIncidentes() {
  return [
    { id: 'INC-0093', tipo: 'Incidente', unidad: 'UM1', paradaId: 'P-2026-031', fecha: iso(-1), descripcion: 'Perno de laina cae desde 1.5 m durante desmontaje; zona estaba delimitada, sin lesionados.', estado: 'En investigación', diasPerdidos: 0, reportadoPor: 'u4' },
    { id: 'INC-0088', tipo: 'Accidente leve', unidad: 'UM2', paradaId: 'P-2026-027', fecha: iso(-15), descripcion: 'Corte superficial en mano derecha al manipular laina sin guante de impacto.', estado: 'Cerrado', diasPerdidos: 0, reportadoPor: 'u3' },
    { id: 'INC-0081', tipo: 'Accidente incapacitante', unidad: 'UM2', paradaId: null, fecha: iso(-48), descripcion: 'Atrapamiento de dedo en polea de faja durante limpieza; trabajador sin bloqueo personal.', estado: 'Cerrado', diasPerdidos: 12, reportadoPor: 'u3' },
    { id: 'INC-0090', tipo: 'Incidente peligroso', unidad: 'UM3', paradaId: 'P-2026-029', fecha: iso(-8), descripcion: 'Eslinga con desgaste detectada durante izaje de manto; maniobra detenida a tiempo.', estado: 'Cerrado', diasPerdidos: 0, reportadoPor: 'u6' },
    { id: 'INC-0091', tipo: 'Incidente', unidad: 'UM5', paradaId: 'P-2026-030', fecha: iso(-5), descripcion: 'Conato de amago de fuego por chispa en vulcanizado; controlado con extintor.', estado: 'Cerrado', diasPerdidos: 0, reportadoPor: 'u6' },
  ];
}

export function buildPlanes() {
  return [
    { id: 'PA-0410', origen: 'IN-0581', unidad: 'UM1', descripcion: 'Reponer señalización de zona de exclusión bajo el molino ML-02', responsable: 'u7', vence: iso(1), estado: 'En proceso' },
    { id: 'PA-0411', origen: 'IN-0581', unidad: 'UM1', descripcion: 'Retirar herramienta sin cinta de inspección del mes', responsable: 'u7', vence: iso(-1), estado: 'Abierto' },
    { id: 'PA-0412', origen: 'IN-0582', unidad: 'UM1', descripcion: 'Charla de refuerzo sobre línea de fuego en retiro de lainas', responsable: 'u4', vence: iso(2), estado: 'Abierto' },
    { id: 'PA-0413', origen: 'INC-0093', unidad: 'UM1', descripcion: 'Implementar bandeja colectora de pernos durante desmontaje', responsable: 'u2', vence: iso(4), estado: 'Abierto' },
    { id: 'PA-0401', origen: 'IN-0575', unidad: 'UM1', descripcion: 'Renovar respiradores con cartuchos vencidos (6 und.)', responsable: 'u5', vence: iso(-3), estado: 'Cerrado', evidencia: 'Acta de entrega EPP-UM1-221.pdf' },
    { id: 'PA-0402', origen: 'IN-0575', unidad: 'UM1', descripcion: 'Capacitar en inspección de arnés antes del uso', responsable: 'u5', vence: iso(-2), estado: 'Abierto' },
    { id: 'PA-0520', origen: 'IN-0612', unidad: 'UM2', descripcion: 'Instalar baranda temporal en plataforma de reductor', responsable: 'u7', vence: iso(1), estado: 'En proceso' },
    { id: 'PA-0521', origen: 'INC-0088', unidad: 'UM2', descripcion: 'Dotar guantes de impacto a toda la cuadrilla de lainas', responsable: 'u3', vence: iso(-10), estado: 'Cerrado', evidencia: 'Registro de entrega 0921.xlsx' },
    { id: 'PA-0522', origen: 'INC-0081', unidad: 'UM2', descripcion: 'Reentrenamiento en bloqueo personal a cuadrillas de fajas', responsable: 'u3', vence: iso(-30), estado: 'Cerrado', evidencia: 'Lista de asistencia.pdf' },
    { id: 'PA-0601', origen: 'INC-0090', unidad: 'UM3', descripcion: 'Dar de baja eslingas con desgaste y registrar en inventario', responsable: 'u6', vence: iso(-5), estado: 'Cerrado', evidencia: 'Acta de baja.pdf' },
    { id: 'PA-0602', origen: 'IN-0701', unidad: 'UM3', descripcion: 'Actualizar PETS de cambio de mantos', responsable: 'u6', vence: iso(6), estado: 'Abierto' },
    { id: 'PA-0901', origen: 'INC-0091', unidad: 'UM5', descripcion: 'Incluir manta ignífuga en kit de vulcanizado', responsable: 'u6', vence: iso(-1), estado: 'Abierto' },
  ];
}

export function buildCapacitaciones() {
  return [
    { id: 'CAP-120', tema: 'Bloqueo y etiquetado (LOTO)', unidad: 'UM1', fecha: iso(-4), horas: 4, asistentes: 18, estado: 'Ejecutada' },
    { id: 'CAP-121', tema: 'Espacios confinados y rescate', unidad: 'UM1', fecha: iso(-3), horas: 8, asistentes: 12, estado: 'Ejecutada' },
    { id: 'CAP-122', tema: 'Rigger y señalero – recertificación', unidad: 'UM1', fecha: iso(6), horas: 8, asistentes: 0, estado: 'Programada' },
    { id: 'CAP-130', tema: 'Inducción de la unidad (Anexo 4)', unidad: 'UM2', fecha: iso(-1), horas: 8, asistentes: 9, estado: 'Ejecutada' },
    { id: 'CAP-131', tema: 'Trabajos en caliente', unidad: 'UM2', fecha: iso(3), horas: 4, asistentes: 0, estado: 'Programada' },
    { id: 'CAP-140', tema: 'Primeros auxilios', unidad: 'UM3', fecha: iso(10), horas: 4, asistentes: 0, estado: 'Programada' },
  ];
}

export function buildEpp() {
  return [
    { id: 'EPP-221', unidad: 'UM1', personalId: 'T-003', item: 'Respirador media cara + cartuchos P100', fecha: iso(-3), firmado: true },
    { id: 'EPP-222', unidad: 'UM1', personalId: 'T-004', item: 'Guantes de impacto', fecha: iso(-2), firmado: true },
    { id: 'EPP-223', unidad: 'UM1', personalId: 'T-001', item: 'Arnés de cuerpo entero', fecha: iso(-1), firmado: true },
    { id: 'EPP-224', unidad: 'UM1', personalId: 'T-006', item: 'Careta de soldar', fecha: iso(0), firmado: false },
    { id: 'EPP-301', unidad: 'UM2', personalId: 'T-015', item: 'Protector auditivo tipo copa', fecha: iso(-5), firmado: true },
  ];
}

// ---------- Repositorio de archivos ----------
// Niveles: ninguno < ver < subir < editar < admin
// acl: permisos por rol en esa carpeta (si no se define, hereda del padre)
// usuarios: excepciones por persona
// unidad: si la carpeta pertenece a una unidad, solo la ven usuarios de esa unidad o con alcance total
export function buildCarpetas() {
  const c = [];
  const add = (id, nombre, parentId, extra = {}) => c.push({ id, nombre, parentId, acl: null, usuarios: {}, unidad: null, ...extra });

  add('root', 'Repositorio SSOMA', null, {
    acl: { gerente: 'admin', lider: 'ver', supervisor: 'ver', asistente: 'ver', analista: 'ver', sup_mant: 'ver', medico: 'ver', trabajador: 'ver' },
  });
  add('f01', '01 Gestión SSOMA', 'root', { acl: { gerente: 'admin', lider: 'ver', supervisor: 'ver', asistente: 'subir', analista: 'editar', sup_mant: 'ver', medico: 'ver', trabajador: 'ninguno' } });
  add('f01a', 'Política y objetivos', 'f01');
  add('f01b', 'PASSO 2026', 'f01');
  add('f01c', 'Reglamento interno SSO', 'f01');
  add('f01d', 'Actas del Comité SSO', 'f01', { acl: { trabajador: 'ninguno', sup_mant: 'ninguno' } });

  add('f02', '02 Unidades mineras', 'root', { acl: { gerente: 'admin', lider: 'editar', supervisor: 'subir', asistente: 'editar', analista: 'ver', sup_mant: 'ver', medico: 'ninguno', trabajador: 'ninguno' } });
  UNIDADES.forEach((u, i) => {
    const base = 'u' + (i + 1);
    add(base, u.nombre, 'f02', { unidad: u.id, acl: { lider: 'admin' } });
    add(base + 'a', 'Estándares y requisitos de la unidad', base);
    add(base + 'b', 'Reportes diarios', base);
    add(base + 'c', 'Paradas', base);
    add(base + 'd', 'Inspecciones y hallazgos', base);
  });
  add('u1c1', 'P-2026-031 · ML-02 Cambio de lainas', 'u1c');
  add('u1c1a', 'Permisos firmados', 'u1c1');
  add('u1c1b', 'Fotos antes / después', 'u1c1');
  add('u1c2', 'P-2026-032 · ML-04 Chumaceras', 'u1c');
  add('u2c1', 'P-2026-033 · MB-01 Overhaul de reductor', 'u2c');

  add('f03', '03 Procedimientos (PETS)', 'root', { acl: { gerente: 'admin', lider: 'editar', supervisor: 'ver', asistente: 'ver', analista: 'editar', sup_mant: 'ver', medico: 'ninguno', trabajador: 'ver' } });
  add('f03a', 'Mantenimiento de molinos', 'f03');
  add('f03b', 'Izajes', 'f03');
  add('f03c', 'Bloqueo y etiquetado', 'f03');

  add('f04', '04 Salud ocupacional (confidencial)', 'root', { acl: { gerente: 'ver', lider: 'ninguno', supervisor: 'ninguno', asistente: 'ninguno', analista: 'ninguno', sup_mant: 'ninguno', medico: 'admin', trabajador: 'ninguno' } });
  add('f04a', 'EMO – Resultados', 'f04', { acl: { gerente: 'ninguno' } });
  add('f04b', 'Monitoreos de agentes', 'f04');

  add('f05', '05 Capacitaciones', 'root', { acl: { gerente: 'admin', lider: 'editar', supervisor: 'subir', asistente: 'editar', analista: 'ver', sup_mant: 'ver', medico: 'ver', trabajador: 'ver' } });
  add('f05a', 'Listas de asistencia', 'f05');
  add('f05b', 'Material de cursos', 'f05');

  add('f06', '06 Auditorías', 'root', { acl: { gerente: 'admin', lider: 'ver', supervisor: 'ninguno', asistente: 'ninguno', analista: 'editar', sup_mant: 'ninguno', medico: 'ninguno', trabajador: 'ninguno' } });
  add('f06a', 'Auditorías internas 2026', 'f06');
  add('f06b', 'Auditorías del titular minero', 'f06');

  add('f08', '08 Formatos registrados', 'root', { acl: { gerente: 'admin', lider: 'editar', supervisor: 'subir', asistente: 'editar', analista: 'editar', sup_mant: 'ver', medico: 'ver', trabajador: 'ninguno' } });
  add('f07', '07 Formatos y plantillas', 'root', { acl: { gerente: 'admin', lider: 'ver', supervisor: 'ver', asistente: 'ver', analista: 'editar', sup_mant: 'ver', medico: 'ver', trabajador: 'ver' } });
  return c;
}

export function buildArchivos() {
  const a = [];
  let n = 1;
  const add = (folderId, nombre, kb, autor, dias, version = 1) => a.push({ id: 'A' + n++, folderId, nombre, kb, autor, actualizado: iso(-dias), version });
  add('f01a', 'Política SSOMA 2026 firmada.pdf', 412, 'u1', 120, 2);
  add('f01a', 'Objetivos y metas SSOMA 2026.xlsx', 88, 'u6', 95);
  add('f01b', 'PASSO 2026 – Programa anual.xlsx', 356, 'u6', 30, 4);
  add('f01b', 'Avance PASSO – octubre.pdf', 640, 'u6', 26);
  add('f01c', 'RISSO v3.pdf', 1820, 'u1', 200, 3);
  add('f01d', 'Acta Comité SSO – sesión 10.pdf', 230, 'u5', 20);
  add('f01d', 'Acta Comité SSO – sesión 11.pdf', 244, 'u5', 2);
  UNIDADES.forEach((u, i) => {
    const base = 'u' + (i + 1);
    add(base + 'a', `Estándar de ingreso – ${u.nombre}.pdf`, between(300, 900), 'u2', between(40, 160));
    add(base + 'a', `Formato ${u.formato}.xlsx`, between(40, 120), 'u2', between(40, 160));
    add(base + 'b', `Reporte diario HSE ${iso(-1)}.pdf`, between(150, 400), 'u4', 1);
  });
  add('u1b', `Reporte diario HSE ${iso(-2)}.pdf`, 210, 'u4', 2);
  add('u1c1', 'IPERC de la parada P-2026-031.xlsx', 154, 'u2', 4, 2);
  add('u1c1', 'Plan de izaje crítico – piñón.pdf', 980, 'u7', 3);
  add('u1c1', 'Matriz LOTO ML-02.pdf', 320, 'u4', 3);
  add('u1c1a', 'PT-1041 LOTO firmado.pdf', 512, 'u4', 2);
  add('u1c1a', 'PT-1038 Trabajo en caliente.pdf', 498, 'u4', 1);
  add('u1c1b', 'Lainas desgastadas – antes 01.jpg', 2840, 'u7', 2);
  add('u1c1b', 'Lainas nuevas – después 01.jpg', 3120, 'u7', 0);
  add('u1d', 'IN-0581 Inspección planeada.pdf', 380, 'u4', 1);
  add('u2c1', 'Plan de izaje reductor 14 t.pdf', 1102, 'u7', 1);
  add('f03a', 'PETS-MOL-01 Cambio de lainas.pdf', 760, 'u6', 60, 3);
  add('f03a', 'PETS-MOL-02 Mantenimiento de chumaceras.pdf', 610, 'u6', 90, 2);
  add('f03b', 'PETS-IZ-01 Izaje crítico.pdf', 540, 'u6', 75, 2);
  add('f03c', 'PETS-LOTO-01 Bloqueo y etiquetado.pdf', 488, 'u6', 45, 5);
  add('f04a', 'Consolidado EMO 2026 (confidencial).xlsx', 1250, 'u8', 7, 6);
  add('f04b', 'Monitoreo de ruido – Cerro Azul.pdf', 920, 'u8', 33);
  add('f04b', 'Monitoreo de polvo respirable – Pampa Roja.pdf', 860, 'u8', 41);
  add('f05a', 'Asistencia CAP-120 LOTO.pdf', 140, 'u5', 4);
  add('f05a', 'Asistencia CAP-121 Espacios confinados.pdf', 152, 'u5', 3);
  add('f05b', 'Curso LOTO – presentación.pptx', 6400, 'u2', 15);
  add('f06a', 'Informe auditoría interna Q3.pdf', 2200, 'u6', 50);
  add('f06b', 'Observaciones auditoría titular – Pampa Roja.pdf', 760, 'u3', 22);
  add('f07', 'Formato PETAR genérico.docx', 96, 'u6', 80);
  add('f07', 'Formato inspección planeada.xlsx', 64, 'u6', 80);
  add('f07', 'Formato reporte de incidente.docx', 72, 'u6', 80);
  return a;
}

export function buildSeed() {
  const eventos = [
    ...buildIncidentes().map((i) => ({ ...i, ...CLASE_INCIDENTES_PREVIOS[i.id], tipo: tipoDeClase(CLASE_INCIDENTES_PREVIOS[i.id]?.clase || 'INC') })),
    ...buildEventos(),
  ];
  return {
    version: 3,
    // unidades mineras (clientes) + talleres propios de DMZ
    unidades: [...UNIDADES.map((u) => ({ ...u, tipo: 'um' })), ...TALLERES],
    usuarios: USUARIOS,
    personal: buildPersonal(),
    paradas: buildParadas(),
    permisos: buildPermisos(),
    iperc: buildIperc(),
    inspecciones: buildInspecciones(),
    incidentes: eventos,
    planes: [...buildPlanes(), ...buildPlanesEventos(eventos.filter((e) => !CLASE_INCIDENTES_PREVIOS[e.id]))],
    capacitaciones: buildCapacitaciones(),
    epp: buildEpp(),
    carpetas: buildCarpetas(),
    archivos: buildArchivos(),
    // carpeta del repositorio asociada a cada sección (la define el administrador)
    vinculos: {},
    // Horas hombre del año por unidad (para IF / IS / IA)
    hh: { UM1: 412000, UM2: 356000, UM3: 128000, UM4: 154000, UM5: 64000, UM6: 82000, UM7: 97000 },
    ipercContinuo: buildIpercContinuo(),
    monitoreos: buildMonitoreos(),
    residuos: buildResiduos(),
    derrames: buildDerrames(),
    aspectos: buildAspectos(),
    passo: buildPasso(),
    actas: buildActas(),
    requisitos: buildRequisitos(),
    auditorias: buildAuditorias(),
    cambios: buildCambios(),
    // integración con los documentos del SGSST
    hallazgos: buildHallazgos(),
    programaInsp: buildProgramaInspecciones(),
    noConformidades: buildNoConformidades(),
    estadisticas: buildHht(),
    cartillas: buildCartillas(),
    sgsstDocs: buildDocumentosSgsst(),
    bitacora: [],
  };
}
