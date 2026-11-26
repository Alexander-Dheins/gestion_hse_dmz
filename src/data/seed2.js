// Datos ficticios adicionales: IPERC continuo, salud, ambiente y gestión.
import { iso } from './seed.js';

export function buildIpercContinuo() {
  return [
    {
      id: 'IC-0215', unidad: 'UM1', paradaId: 'P-2026-031', fecha: iso(0), hora: '07:10', area: 'Molienda – ML-02', tarea: 'Retiro de lainas del casco con manipulador',
      peligros: [
        { peligro: 'Lainas sueltas sobre el casco', riesgo: 'Golpe / aplastamiento', p: 3, s: 4, medidas: 'Zona de exclusión, uso de manipulador, nadie bajo la carga', pr: 2, sr: 3 },
        { peligro: 'Atmósfera interior del molino', riesgo: 'Asfixia', p: 2, s: 5, medidas: 'Monitoreo de gases cada 2 h, ventilación forzada, vigía', pr: 1, sr: 5 },
        { peligro: 'Ruido de herramientas neumáticas', riesgo: 'Hipoacusia', p: 4, s: 2, medidas: 'Protección auditiva doble', pr: 2, sr: 2 },
      ],
      trabajadores: ['T-001', 'T-002', 'T-003', 'T-004'], supervisor: 'u4', responsable: 'u7', estado: 'Validado',
    },
    {
      id: 'IC-0214', unidad: 'UM1', paradaId: 'P-2026-031', fecha: iso(-1), hora: '19:05', area: 'Molienda – ML-02', tarea: 'Soldadura de pernos de lainas',
      peligros: [
        { peligro: 'Chispas y escoria', riesgo: 'Quemaduras / amago de incendio', p: 3, s: 3, medidas: 'Manta ignífuga, extintor PQS, vigía de fuego', pr: 1, sr: 3 },
        { peligro: 'Humos metálicos', riesgo: 'Intoxicación', p: 3, s: 3, medidas: 'Extractor portátil, respirador P100', pr: 2, sr: 2 },
      ],
      trabajadores: ['T-005', 'T-006'], supervisor: 'u4', responsable: 'u7', estado: 'Validado',
    },
  ];
}

export function buildMonitoreos() {
  return [
    { id: 'MO-031', unidad: 'UM1', agente: 'Ruido', puesto: 'Mecánico de molinos (interior de molino)', valor: 96, unidad_medida: 'dB(A)', lmp: 85, fecha: iso(-33), laboratorio: 'Laboratorio ficticio Andes S.A.C.' },
    { id: 'MO-032', unidad: 'UM1', agente: 'Polvo respirable', puesto: 'Técnico de lainas', valor: 2.1, unidad_medida: 'mg/m³', lmp: 3, fecha: iso(-33), laboratorio: 'Laboratorio ficticio Andes S.A.C.' },
    { id: 'MO-033', unidad: 'UM1', agente: 'Humos metálicos', puesto: 'Soldador homologado', valor: 4.2, unidad_medida: 'mg/m³', lmp: 5, fecha: iso(-33), laboratorio: 'Laboratorio ficticio Andes S.A.C.' },
    { id: 'MO-041', unidad: 'UM2', agente: 'Polvo respirable', puesto: 'Ayudante mecánico', valor: 3.4, unidad_medida: 'mg/m³', lmp: 3, fecha: iso(-41), laboratorio: 'Laboratorio ficticio Andes S.A.C.' },
    { id: 'MO-042', unidad: 'UM2', agente: 'Ruido', puesto: 'Rigger', valor: 84, unidad_medida: 'dB(A)', lmp: 85, fecha: iso(-41), laboratorio: 'Laboratorio ficticio Andes S.A.C.' },
    { id: 'MO-051', unidad: 'UM3', agente: 'Vibración mano-brazo', puesto: 'Técnico mecánico', valor: 3.1, unidad_medida: 'm/s²', lmp: 5, fecha: iso(-60), laboratorio: 'Laboratorio ficticio Andes S.A.C.' },
    { id: 'MO-061', unidad: 'UM5', agente: 'Estrés térmico (frío)', puesto: 'Técnico de fajas', valor: -6, unidad_medida: '°C', lmp: -10, fecha: iso(-20), laboratorio: 'Laboratorio ficticio Andes S.A.C.', inverso: true },
  ];
}

export function buildResiduos() {
  return [
    { id: 'RS-0120', unidad: 'UM1', fecha: iso(-1), tipo: 'Peligroso', residuo: 'Trapos y paños con grasa', cantidad: 38, medida: 'kg', contenedor: 'Rojo', disposicion: 'EO-RS autorizada (ficticia)', manifiesto: 'MR-2026-0412' },
    { id: 'RS-0121', unidad: 'UM1', fecha: iso(-1), tipo: 'No peligroso', residuo: 'Lainas de jebe desgastadas', cantidad: 2400, medida: 'kg', contenedor: 'Área de chatarra', disposicion: 'Comercialización', manifiesto: '—' },
    { id: 'RS-0122', unidad: 'UM1', fecha: iso(0), tipo: 'Peligroso', residuo: 'Aceite usado de chumaceras', cantidad: 120, medida: 'L', contenedor: 'Cilindro rotulado', disposicion: 'EO-RS autorizada (ficticia)', manifiesto: 'MR-2026-0413' },
    { id: 'RS-0201', unidad: 'UM2', fecha: iso(-2), tipo: 'Peligroso', residuo: 'Filtros de aceite', cantidad: 14, medida: 'kg', contenedor: 'Rojo', disposicion: 'EO-RS autorizada (ficticia)', manifiesto: 'MR-2026-0398' },
    { id: 'RS-0202', unidad: 'UM2', fecha: iso(-2), tipo: 'No peligroso', residuo: 'Madera de embalaje', cantidad: 180, medida: 'kg', contenedor: 'Verde', disposicion: 'Reaprovechamiento', manifiesto: '—' },
  ];
}

export function buildDerrames() {
  return [
    { id: 'DE-008', unidad: 'UM1', fecha: iso(-1), sustancia: 'Aceite hidráulico ISO 68', volumen: '6 L', superficie: 'Losa de concreto bajo ML-02', contencion: 'Paños absorbentes y kit antiderrame', estado: 'Cerrado', causa: 'Manguera del sistema de lubricación fisurada' },
    { id: 'DE-009', unidad: 'UM2', fecha: iso(-3), sustancia: 'Grasa de corona', volumen: '2 kg', superficie: 'Suelo natural', contencion: 'Retiro de suelo contaminado (0.2 m³)', estado: 'En seguimiento', causa: 'Bandeja colectora mal ubicada' },
  ];
}

export function buildAspectos() {
  return [
    { id: 'AS-01', actividad: 'Cambio de lainas', aspecto: 'Generación de residuos de jebe y acero', impacto: 'Contaminación del suelo', significancia: 'Media', control: 'Segregación y retiro a zona de chatarra' },
    { id: 'AS-02', actividad: 'Mantenimiento de chumaceras', aspecto: 'Fuga de aceite', impacto: 'Contaminación del suelo y agua', significancia: 'Alta', control: 'Bandejas colectoras, kit antiderrame, inspección de mangueras' },
    { id: 'AS-03', actividad: 'Soldadura', aspecto: 'Emisión de humos metálicos', impacto: 'Alteración de la calidad del aire', significancia: 'Baja', control: 'Extracción localizada' },
    { id: 'AS-04', actividad: 'Uso de grúa', aspecto: 'Consumo de combustible', impacto: 'Agotamiento de recursos y emisiones', significancia: 'Media', control: 'Mantenimiento preventivo y apagado en espera' },
  ];
}

export function buildPasso() {
  return [
    { id: 'PS-01', actividad: 'Inspecciones planeadas', meta: 96, ejecutado: 81, responsable: 'Líder HSE de unidad' },
    { id: 'PS-02', actividad: 'Observaciones de comportamiento', meta: 240, ejecutado: 226, responsable: 'Supervisor HSE' },
    { id: 'PS-03', actividad: 'Capacitaciones Anexo 6', meta: 48, ejecutado: 39, responsable: 'Asistente HSE' },
    { id: 'PS-04', actividad: 'Simulacros de emergencia', meta: 14, ejecutado: 10, responsable: 'Líder HSE de unidad' },
    { id: 'PS-05', actividad: 'Reuniones del comité SSO', meta: 12, ejecutado: 11, responsable: 'Gerente de Seguridad' },
    { id: 'PS-06', actividad: 'Auditorías internas', meta: 4, ejecutado: 3, responsable: 'Analista HSE' },
    { id: 'PS-07', actividad: 'Monitoreos de agentes', meta: 14, ejecutado: 9, responsable: 'Médico ocupacional' },
  ];
}

export function buildActas() {
  return [
    {
      id: 'ACTA-11', sesion: 'Ordinaria N.° 11', fecha: iso(-2), lugar: 'Sala de reuniones – Lima (virtual con unidades)',
      asistentes: ['u1', 'u2', 'u3', 'u6', 'u8'],
      agenda: ['Lectura del acta anterior', 'Indicadores de octubre', 'Incidente INC-0093 en ML-02', 'Avance del PASSO'],
      acuerdos: [
        { acuerdo: 'Implementar bandeja colectora de pernos en todas las paradas de molinos', responsable: 'u2', plazo: iso(14) },
        { acuerdo: 'Recertificar riggers de Cerro Azul antes de la parada P-2026-032', responsable: 'u5', plazo: iso(8) },
        { acuerdo: 'Consolidar monitoreo de polvo de Pampa Roja y definir controles', responsable: 'u8', plazo: iso(20) },
      ],
    },
    {
      id: 'ACTA-10', sesion: 'Ordinaria N.° 10', fecha: iso(-32), lugar: 'Sala de reuniones – Lima', asistentes: ['u1', 'u2', 'u3', 'u6'],
      agenda: ['Indicadores de setiembre', 'Programa de capacitaciones Q4'],
      acuerdos: [{ acuerdo: 'Programar curso de rescate en espacios confinados', responsable: 'u2', plazo: iso(-5) }],
    },
  ];
}

export function buildRequisitos() {
  return [
    { id: 'RL-01', norma: 'D.S. 024-2016-EM', articulo: 'Art. 95', requisito: 'Realizar IPERC continuo al inicio de cada tarea', cumple: 'Sí', evidencia: 'Registros IC-0214, IC-0215' },
    { id: 'RL-02', norma: 'D.S. 024-2016-EM', articulo: 'Art. 97', requisito: 'Actualizar el IPERC base anualmente y ante cambios', cumple: 'Sí', evidencia: 'IPERC base v2026' },
    { id: 'RL-03', norma: 'D.S. 024-2016-EM', articulo: 'Trabajos de alto riesgo', requisito: 'Contar con PETAR firmado antes de iniciar trabajos de alto riesgo', cumple: 'Parcial', evidencia: '2 permisos pendientes de firma en P-2026-033' },
    { id: 'RL-04', norma: 'D.S. 024-2016-EM', articulo: 'Exámenes médicos', requisito: 'Personal con examen médico ocupacional vigente', cumple: 'Parcial', evidencia: 'Hay personal bloqueado por EMO vencido' },
    { id: 'RL-05', norma: 'D.S. 024-2016-EM', articulo: 'Capacitación', requisito: 'Capacitación básica en SSO (Anexo 6) del personal', cumple: 'Sí', evidencia: 'Registro de asistencias 2026' },
    { id: 'RL-06', norma: 'Ley 29783', articulo: 'Comité SSO', requisito: 'Sesiones mensuales del comité con actas', cumple: 'Sí', evidencia: 'ACTA-10, ACTA-11' },
    { id: 'RL-07', norma: 'Estándar de la unidad', articulo: 'Cerro Azul · Ingreso', requisito: 'Inducción específica de la unidad vigente', cumple: 'Parcial', evidencia: '1 trabajador con inducción vencida' },
  ];
}

export function buildAuditorias() {
  return [
    {
      id: 'AUD-2026-03', tipo: 'Interna', unidad: 'UM1', fecha: iso(-50), auditor: 'u6', alcance: 'Permisos de alto riesgo y LOTO en paradas de molinos', resultado: 87,
      hallazgos: [
        { tipo: 'No conformidad menor', descripcion: 'Dos PETAR sin hora de cierre registrada', estado: 'Cerrado' },
        { tipo: 'Observación', descripcion: 'Tarjetas LOTO deterioradas en el tablero de lubricación', estado: 'Cerrado' },
        { tipo: 'Oportunidad de mejora', descripcion: 'Digitalizar el registro de candados personales', estado: 'En proceso' },
      ],
    },
    {
      id: 'AUD-T-2026-07', tipo: 'Del titular minero', unidad: 'UM2', fecha: iso(-22), auditor: 'u3', alcance: 'Auditoría de contratistas – gestión SSO', resultado: 82,
      hallazgos: [
        { tipo: 'No conformidad mayor', descripcion: 'Trabajador ingresó con SCTR vencido (caso aislado)', estado: 'Cerrado' },
        { tipo: 'No conformidad menor', descripcion: 'IPERC continuo sin firma del supervisor en 3 registros', estado: 'Cerrado' },
        { tipo: 'Observación', descripcion: 'Falta señalización de punto de reunión en taller', estado: 'Abierto' },
      ],
    },
  ];
}

export function buildCambios() {
  return [
    { id: 'GC-004', unidad: 'UM1', fecha: iso(-6), cambio: 'Uso de nuevo manipulador de lainas de 2 brazos', tipo: 'Equipo', riesgos: 'Nuevos puntos de atrapamiento; operadores sin experiencia', estado: 'Aprobado', aprobador: 'u2' },
    { id: 'GC-005', unidad: 'UM2', fecha: iso(-1), cambio: 'Cambio de secuencia de izaje del reductor', tipo: 'Método', riesgos: 'Mayor radio de giro de la grúa', estado: 'En evaluación', aprobador: null },
  ];
}
