// Datos de la integración con los documentos del SGSST (inspecciones internas, NC/SAC,
// eventos, estadísticas y estructura documental). La ESTRUCTURA sigue los archivos de DIMARZA;
// los DATOS son ficticios.
import { ACTOS, CONDICIONES } from './catalogos.js';

const DIA = 86400000;
const HOY = new Date();
export const ANIO = HOY.getFullYear();
export const MES_ACTUAL = HOY.getMonth(); // 0 = enero
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

const f = (m, d) => new Date(Date.UTC(ANIO, m, Math.min(d, 28))).toISOString().slice(0, 10);
const mas = (iso, n) => new Date(new Date(iso + 'T00:00:00Z').getTime() + n * DIA).toISOString().slice(0, 10);
const hoyIso = () => new Date().toISOString().slice(0, 10);

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Sedes propias (talleres DMZ) ----------
export const TALLERES = [
  { id: 'T1', tipo: 'taller', nombre: 'DMZ Taller 01', detalle: 'Oficinas y almacén', titular: 'DIMARZA S.A.C. (sede propia)', region: 'Arequipa', planta: 'Oficinas administrativas y almacén central', formato: 'DMZ-SSO-F-12', contacto: 'Jefe de taller', estandares: 18 },
  { id: 'T2', tipo: 'taller', nombre: 'DMZ Taller 02', detalle: 'Transporte', titular: 'DIMARZA S.A.C. (sede propia)', region: 'Arequipa', planta: 'Taller de transporte y mantenimiento de flota', formato: 'DMZ-SSO-F-12', contacto: 'Jefe de taller', estandares: 18 },
  { id: 'T4', tipo: 'taller', nombre: 'DMZ Taller 04', detalle: 'Fabricación', titular: 'DIMARZA S.A.C. (sede propia)', region: 'Arequipa', planta: 'Taller de fabricación, soldadura y maestranza', formato: 'DMZ-SSO-F-12', contacto: 'Jefe de taller', estandares: 18 },
];

// ---------- Inspecciones internas: hallazgos ----------
export const RIESGOS = ['Alto', 'Medio', 'Bajo'];
export const TIPOS_INSPECCION = ['Planeada', 'Inopinada', 'Gerencial', 'Comité SST'];
const INSPECTORES = { T1: 'Hernán Quispe', T2: 'Milagros Ccahuana', T4: 'Wilber Chambi', UM1: 'Diego Salinas' };
const RESPONSABLES = {
  T1: ['Óscar Valdez', 'Karen Tito'],
  T2: ['Milagros Ccahuana', 'Pedro Llerena', 'Iván Benavides'],
  T4: ['Wilber Chambi', 'Ronald Apaza'],
  UM1: ['Jorge Quispe', 'Diego Salinas'],
};
const AREAS_SEDE = {
  T1: ['Oficinas', 'Almacén central', 'Patio', 'SS.HH.', 'Archivo'],
  T2: ['Zona de mantenimiento de flota', 'Lavadero', 'Estacionamiento', 'Almacén de lubricantes', 'Oficina de taller', 'SS.HH.'],
  T4: ['Zona de soldadura', 'Zona de corte y esmerilado', 'Almacén de consumibles', 'Pañol de herramientas', 'Zona de pintura', 'Puente grúa'],
  UM1: ['Molino de bolas ML-02', 'Chancado secundario', 'Fajas transportadoras', 'Taller de campo'],
};
// [A|C, índice en el catálogo, descripción, acción, riesgo]
const POOL = [
  ['C', 0, 'Retazos de plancha y viruta acumulados alrededor del banco de trabajo.', 'Orden y limpieza del área; retirar retazos al contenedor de chatarra.', 'Bajo'],
  ['C', 0, 'Cajas y material excedente apilados en el pasillo de la zona de trabajo.', 'Retirar material excedente y reubicarlo en el almacén.', 'Bajo'],
  ['C', 1, 'Esmeril angular con guarda floja y cable con empalme.', 'Retirar de uso, reparar o dar de baja; reforzar inspección pre-uso.', 'Medio'],
  ['C', 1, 'Carrito de herramientas con ruedas dañadas.', 'Gestionar el cambio o reparación del carrito.', 'Bajo'],
  ['C', 2, 'Luminaria inoperativa en la zona de trabajo nocturno.', 'Reemplazar luminaria y verificar el circuito.', 'Medio'],
  ['C', 5, 'Escalera de acceso al altillo sin pasamanos.', 'Instalar pasamanos en la escalera de acceso.', 'Medio'],
  ['C', 6, 'Soldadura en espacio sin extracción local de humos.', 'Instalar extractor portátil y evaluar monitoreo de humos metálicos.', 'Alto'],
  ['C', 7, 'Galones de combustible almacenados fuera del gabinete de inflamables.', 'Almacenar en gabinete de inflamables y colocar rótulo.', 'Medio'],
  ['C', 7, 'Productos químicos sin bandeja de contención.', 'Colocar bandeja antiderrame y actualizar inventario de químicos.', 'Medio'],
  ['C', 8, 'Señalización de ruta de evacuación desprendida.', 'Reponer la señalética de evacuación.', 'Bajo'],
  ['C', 9, 'Demarcación del paso peatonal borrosa.', 'Repintar demarcación peatonal y difundir rutas.', 'Medio'],
  ['C', 10, 'Estantes del almacén sin anclaje a la pared.', 'Anclar estanterías para evitar volcamiento.', 'Medio'],
  ['C', 12, 'Trabajos de soldadura sin biombos que protejan al personal cercano.', 'Implementar biombos o mantas ignífugas en la zona de soldadura.', 'Medio'],
  ['C', 13, 'Careta de soldar con visor rajado.', 'Reemplazar careta y revisar el stock de EPP.', 'Medio'],
  ['C', 15, 'Zona de armado congestionada por estructuras y equipos.', 'Redistribuir el layout y definir zonas de acopio.', 'Bajo'],
  ['C', 16, 'Cilindro de gas comprimido sin cadena de sujeción.', 'Asegurar el cilindro con cadena y capuchón.', 'Alto'],
  ['C', 17, 'Tablero eléctrico sin dispositivo de bloqueo durante mantenimiento.', 'Implementar bloqueo y tarjeta; capacitar en LOTO.', 'Alto'],
  ['C', 19, 'Planchas con bordes cortantes expuestos en la zona de tránsito.', 'Proteger bordes y almacenar planchas en rack.', 'Medio'],
  ['C', 21, 'Piso del lavadero con desniveles y empozamiento de agua.', 'Nivelar el piso y mejorar el drenaje.', 'Medio'],
  ['C', 25, 'Presencia de roedores en el almacén de archivo.', 'Programar control de plagas y sellar accesos.', 'Bajo'],
  ['C', 26, 'Extintor PQS obstruido y con tarjeta de inspección vencida.', 'Liberar el acceso al extintor y realizar su recarga e inspección.', 'Medio'],
  ['C', 26, 'Lavaojos sin agua y sin registro de inspección.', 'Habilitar el lavaojos y registrar la inspección mensual.', 'Medio'],
  ['C', 28, 'Material acopiado en altura sin asegurar en el estante superior.', 'Bajar el material o asegurarlo; definir carga máxima por nivel.', 'Medio'],
  ['C', 29, 'Vía peatonal obstruida con conos y pasacables.', 'Liberar la vía y almacenar los dispositivos en su lugar.', 'Bajo'],
  ['C', 30, 'Envases de solvente trasvasado sin rótulo.', 'Rotular envases según SGA y retirar los no identificados.', 'Medio'],
  ['C', 31, 'Compresora sin registro de mantenimiento vigente.', 'Programar mantenimiento y archivar el registro.', 'Bajo'],
  ['C', 32, 'EPP y papeles guardados dentro de la cabina del vehículo.', 'Designar un lugar para el almacenamiento del EPP.', 'Bajo'],
  ['C', 34, 'Silla de oficina con base dañada y sin regulación de altura.', 'Reparar o cambiar la silla; evaluar ergonomía del puesto.', 'Bajo'],
  ['C', 35, 'Camioneta sin tacos ni conos de seguridad.', 'Dotar de tacos y conos a la unidad y verificar en el check list pre-uso.', 'Medio'],
  ['C', 36, 'Zona segura de evacuación obstruida con material.', 'Liberar la zona segura y señalizarla.', 'Medio'],
  ['C', 37, 'Cableado eléctrico expuesto con conexiones hechizas.', 'Ordenar el cableado en canaletas con un electricista calificado.', 'Alto'],
  ['C', 38, 'Cables cruzando el pasillo sin pasacables.', 'Instalar pasacables en los cruces peatonales.', 'Bajo'],
  ['A', 0, 'Soldador realizando trabajos con careta en mal estado y sin escarpines.', 'Retroalimentar al trabajador y reemplazar el EPP.', 'Alto'],
  ['A', 0, 'Personal esmerilando sin careta facial.', 'Detener la tarea, retroalimentar y verificar el EPP específico.', 'Medio'],
  ['A', 1, 'Uso de llave como martillo durante el desmontaje.', 'Charla sobre uso correcto de herramientas.', 'Bajo'],
  ['A', 3, 'Levantamiento manual de carga pesada sin ayuda mecánica.', 'Capacitar en manipulación de cargas y usar ayuda mecánica.', 'Medio'],
  ['A', 12, 'Herramientas dejadas sobre la mesa del esmeril al terminar la tarea.', 'Retroalimentar y reforzar el orden al finalizar la tarea.', 'Bajo'],
  ['A', 18, 'Inicio de trabajo en caliente sin PETAR firmado.', 'Detener el trabajo, completar el PETAR y retroalimentar al supervisor.', 'Alto'],
  ['A', 22, 'Personal trabajando en área con derrame de aceite sin limpiar.', 'Limpiar el derrame con kit y retroalimentar.', 'Medio'],
  ['A', 28, 'Residuos peligrosos (trapos con aceite) en el contenedor de comunes.', 'Retroalimentar sobre segregación de residuos.', 'Bajo'],
];
// distribución mensual y por sede (similar a la del archivo de análisis)
const POR_MES = [7, 18, 35, 12, 24, 27, 6, 6, 13, 25, 7, 4];
const SEDES_H = [['T4', 0.38], ['T2', 0.35], ['T1', 0.2], ['UM1', 0.07]];
const CIERRE = { T4: 0.97, T2: 0.45, T1: 0.7, UM1: 0.6 };

export function buildHallazgos() {
  const r = rng(2026);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const sede = () => { let x = r(); for (const [s, p] of SEDES_H) { if ((x -= p) <= 0) return s; } return 'T4'; };
  const lista = [];
  let n = 0;
  for (let m = 0; m <= MES_ACTUAL; m++) {
    const cant = m === MES_ACTUAL ? Math.min(POR_MES[m], Math.max(2, Math.round(POR_MES[m] * HOY.getDate() / 30))) : POR_MES[m];
    // cada mes las inspecciones se hacen en 2 o 3 fechas
    const dias = [5 + Math.floor(r() * 6), 13 + Math.floor(r() * 6), 22 + Math.floor(r() * 5)];
    for (let i = 0; i < cant; i++) {
      const s = sede();
      const p = pick(POOL);
      let fecha = f(m, pick(dias));
      if (fecha > hoyIso()) fecha = hoyIso();
      const riesgo = p[4];
      const plazo = mas(fecha, riesgo === 'Alto' ? 3 : riesgo === 'Medio' ? 7 + Math.floor(r() * 8) : 15 + Math.floor(r() * 16));
      const vencido = plazo < hoyIso();
      const cierra = r() < CIERRE[s] || (riesgo === 'Alto' && r() < 0.6);
      let avance = 0; let fechaCierre = null; let evidencia = null;
      if (vencido && cierra) {
        avance = 100;
        fechaCierre = mas(fecha, Math.max(1, Math.floor((new Date(plazo) - new Date(fecha)) / DIA * (0.4 + r() * 0.9))));
        if (fechaCierre > hoyIso()) fechaCierre = hoyIso();
        evidencia = `Registro fotográfico ${s}-${String(n + 1).padStart(3, '0')}.jpg`;
      } else if (!vencido && r() < 0.35) {
        avance = [25, 50, 75][Math.floor(r() * 3)];
      } else if (vencido) {
        avance = [0, 0, 25, 50][Math.floor(r() * 4)];
      }
      n++;
      lista.push({
        id: `HZ-${ANIO}-${String(n).padStart(3, '0')}`,
        fecha, sede: s, area: pick(AREAS_SEDE[s]),
        tipoInspeccion: r() < 0.7 ? 'Planeada' : r() < 0.6 ? 'Inopinada' : r() < 0.5 ? 'Gerencial' : 'Comité SST',
        inspector: INSPECTORES[s],
        clasificacion: p[0] === 'A' ? 'Acto' : 'Condición',
        subtipo: p[0] === 'A' ? ACTOS[p[1]] : CONDICIONES[p[1]],
        descripcion: p[2], accion: p[3], riesgo,
        responsable: pick(RESPONSABLES[s]), plazo, avance, fechaCierre, evidencia,
      });
    }
  }
  // un par de hallazgos de alto riesgo sin plan de acción definido
  lista.filter((h) => h.riesgo === 'Alto' && !h.fechaCierre).slice(0, 2).forEach((h) => { h.accion = ''; });
  return lista;
}

// ---------- Programa anual de inspecciones ----------
// sedes del programa: talleres + inspecciones por responsabilidad (gerencias) + comité SST
export const SEDES_PROGRAMA = [
  { id: 'T1', nombre: 'Taller 01' }, { id: 'T2', nombre: 'Taller 02' }, { id: 'T4', nombre: 'Taller 04' },
  { id: 'RESP', nombre: 'Por responsabilidad (gerencias)' }, { id: 'CSST', nombre: 'Comité SST' },
];
const ACTIVIDADES = [
  ['Equipos de respuesta a emergencias', 'Inspección de extintores', 'Operativo-Administrativo', 'Mensual', ['T1', 'T2', 'T4'], 'Brigadista de sede'],
  ['Equipos de respuesta a emergencias', 'Inspección de estación de emergencia (camilla)', 'Operativo-Administrativo', 'Mensual', ['T1', 'T2', 'T4'], 'Brigadista de sede'],
  ['Equipos de respuesta a emergencias', 'Inspección de botiquines en vehículos de transporte', 'Operativo-Administrativo', 'Mensual', ['T2'], 'Jefe de transporte'],
  ['Equipos de respuesta a emergencias', 'Inspección de kit antiderrames en talleres', 'Operativo', 'Mensual', ['T1', 'T2', 'T4'], 'Supervisor de taller'],
  ['Equipos de respuesta a emergencias', 'Inspección de kit antiderrames en vehículos', 'Operativo', 'Mensual', ['T2'], 'Jefe de transporte'],
  ['Equipos de respuesta a emergencias', 'Inspección de luces de emergencia', 'Operativo-Administrativo', 'Mensual', ['T2', 'T4'], 'Electricista de sede'],
  ['Equipos de respuesta a emergencias', 'Inspección de lavaojos', 'Operativo-Administrativo', 'Mensual', ['T1', 'T2', 'T4'], 'Supervisor de taller'],
  ['Inspecciones locativas', 'Inspección de oficinas', 'Operativo', 'Mensual', ['T1', 'T2'], 'Analista HSE'],
  ['Inspecciones locativas', 'Inspección de almacenes', 'Operativo', 'Mensual', ['T1', 'T4'], 'Jefe de almacén'],
  ['Inspecciones locativas', 'Inspección de taller de fabricación', 'Operativo', 'Mensual', ['T4'], 'Supervisor de taller'],
  ['Inspecciones locativas', 'Inspección de servicios higiénicos', 'Operativo-Administrativo', 'Mensual', ['T1', 'T2', 'T4'], 'Analista HSE'],
  ['Inspecciones locativas', 'Inspección de productos químicos', 'Operativo', 'Mensual', ['T1', 'T2', 'T4'], 'Analista HSE'],
  ['Inspecciones locativas', 'Inspección de señalización', 'Operativo', 'Mensual', ['T1', 'T2', 'T4'], 'Analista HSE'],
  ['Equipos y herramientas', 'Inspección de herramientas eléctricas portátiles', 'Operativo', 'Mensual', ['T2', 'T4'], 'Supervisor de taller'],
  ['Equipos y herramientas', 'Inspección de equipos de soldadura y oxicorte', 'Operativo', 'Mensual', ['T4'], 'Supervisor de taller'],
  ['Equipos y herramientas', 'Inspección de equipos de izaje y puente grúa', 'Operativo', 'Mensual', ['T4'], 'Rigger certificado'],
  ['Equipos y herramientas', 'Inspección pre-uso de vehículos (consolidado)', 'Operativo', 'Mensual', ['T2'], 'Jefe de transporte'],
  ['Inspección por responsabilidad', 'Inspección gerencial / alta dirección', 'Operativo-Administrativo', 'Trimestral', ['RESP'], 'Gerencia general'],
  ['Inspección por responsabilidad', 'Inspección gerencial de seguridad y salud ocupacional', 'Operativo-Administrativo', 'Trimestral', ['RESP'], 'Gerencia HSE'],
  ['Inspección por responsabilidad', 'Inspección gerencial de operaciones', 'Operativo-Administrativo', 'Trimestral', ['RESP'], 'Gerencia de operaciones'],
  ['Comité SST', 'Inspección del Comité de Seguridad y Salud en el Trabajo', 'Operativo-Administrativo', 'Mensual', ['CSST'], 'Miembros del Comité SST'],
];
const EJEC = { T1: 0.5, T2: 0.93, T4: 0.98, RESP: 0.75, CSST: 0.75 };

export function buildProgramaInspecciones() {
  const r = rng(77);
  return {
    anio: ANIO,
    meta: 90,
    actualizado: hoyIso(),
    actividades: ACTIVIDADES.map(([categoria, nombre, area, frecuencia, sedes, inspector], i) => {
      const plan = {}; const ejec = {};
      sedes.forEach((s) => {
        plan[s] = Array.from({ length: 12 }, (_, m) => (frecuencia === 'Trimestral' ? [3, 7, 11].includes(m) : true));
        ejec[s] = plan[s].map((p, m) => {
          if (!p && frecuencia === 'Trimestral' && m < MES_ACTUAL && [2, 4, 5].includes(m) && r() < 0.5) return true; // ejecutadas fuera del mes programado
          if (!p || m > MES_ACTUAL) return false;
          if (m === MES_ACTUAL) return HOY.getDate() > 20 && r() < EJEC[s];
          return r() < EJEC[s];
        });
      });
      return { id: `ACT-${String(i + 1).padStart(2, '0')}`, categoria, nombre, area, frecuencia, sedes, inspector, plan, ejec };
    }),
  };
}

// ---------- No conformidades y SAC ----------
export const FUENTES_NC = ['Auditoría interna', 'Auditoría externa', 'Auditoría del cliente', 'Inspección', 'Investigación de incidente', 'Revisión por la dirección', 'Fiscalización'];
export const TIPOS_NC = ['No conformidad', 'Observación', 'Oportunidad de mejora'];
export function buildNoConformidades() {
  const a = (accion, responsable, plazo, cierre, evidencia) => ({ accion, responsable, plazo, cierre: cierre || null, evidencia: evidencia || null, avance: cierre ? 100 : 0 });
  const y = ANIO; const py = ANIO - 1;
  return [
    { id: `01-${py}-SAC`, tipo: 'No conformidad', fecha: `${py}-02-19`, proceso: 'Seguridad y Medio Ambiente', fuente: 'Auditoría interna', sede: 'T1', elemento: '5.1',
      descripcion: 'No se evidencia la revisión anual del SGSST del año anterior por parte de la alta dirección.',
      acciones: [
        a('Revisar y actualizar la matriz de requisitos legales de SST.', 'Encargado SIG', `${py}-04-26`, `${py}-05-26`, 'Matriz de requisitos legales actualizada.pdf'),
        a('Difundir la matriz de requisitos legales a gerencias y jefaturas.', 'Analista HSE', `${py}-04-30`, `${py}-11-25`, 'Cargos de recepción por gerencia.pdf'),
        a('Elaborar el informe de revisión anual del SGSST para la alta dirección.', 'Jefe de HSE', `${py}-04-23`, `${py}-04-23`, 'Informe de revisión por la dirección.pdf'),
        a('Presentar el informe a la alta dirección y registrar sus acuerdos.', 'Jefe de HSE', `${py}-04-25`, `${py}-04-25`, 'Acta de revisión firmada.pdf'),
      ] },
    { id: `02-${py}-SAC`, tipo: 'No conformidad', fecha: `${py}-01-08`, proceso: 'Seguridad y Medio Ambiente', fuente: 'Auditoría interna', sede: 'T1', elemento: '4.3',
      descripcion: 'No se cuenta con registros que evidencien la trazabilidad del cumplimiento de la gestión de SST.',
      acciones: [a('Cubrir la posición de analista HSE para el seguimiento de registros del SGSST.', 'Jefe de HSE', `${py}-01-20`, `${py}-01-18`, 'Comunicado de ingreso de analista HSE.pdf')] },
    { id: `03-${py}-SAC`, tipo: 'No conformidad', fecha: `${py}-04-09`, proceso: 'Seguridad y Medio Ambiente', fuente: 'Auditoría interna', sede: 'T1', elemento: '2.5',
      descripcion: 'No se evidencia la remisión del Programa Anual de SSO a las entidades fiscalizadoras correspondientes.',
      acciones: [a(`Presentar el PASSO ${y} a las entidades fiscalizadoras.`, 'Gerencia HSE', `${py}-12-22`, `${py}-12-22`, 'Cargo de presentación.pdf')] },
    { id: `01-${y}-SAC`, tipo: 'No conformidad', fecha: `${y}-03-12`, proceso: 'Operaciones', fuente: 'Auditoría del cliente', sede: 'UM1', elemento: '3.2',
      descripcion: 'PETAR de trabajo en altura sin firma del supervisor del titular minero en dos frentes de la parada.',
      acciones: [
        a('Actualizar el flujo de firmas del PETAR incluyendo al supervisor del titular.', 'Líder HSE de unidad', `${y}-03-31`, `${y}-03-29`, 'Procedimiento PETAR rev. 04.pdf'),
        a('Capacitar a supervisores de mantenimiento en el nuevo flujo.', 'Líder HSE de unidad', `${y}-04-15`, `${y}-04-20`, 'Lista de asistencia.pdf'),
      ] },
    { id: `02-${y}-SAC`, tipo: 'Observación', fecha: `${y}-05-06`, proceso: 'Logística', fuente: 'Inspección', sede: 'T4', elemento: '3.4',
      descripcion: 'No existe una matriz de EPP por puesto que sustente la dotación entregada al personal del taller.',
      acciones: [
        a('Elaborar la matriz de EPP por puesto y tarea.', 'Analista HSE', `${y}-06-30`, `${y}-07-10`, 'Matriz de EPP por puesto.xlsx'),
        a('Difundir la matriz a jefes de taller y almacén.', 'Analista HSE', `${y}-07-31`),
      ] },
    { id: `03-${y}-SAC`, tipo: 'No conformidad', fecha: `${y}-06-18`, proceso: 'Seguridad y Medio Ambiente', fuente: 'Auditoría interna', sede: 'T2', elemento: '3.7',
      descripcion: 'No se evidencian simulacros ejecutados en el Taller 02 durante el semestre.',
      acciones: [
        a('Programar y ejecutar simulacro de sismo e incendio en Taller 02.', 'Jefe de taller', `${y}-08-15`, `${y}-08-14`, 'Informe de simulacro.pdf'),
        a('Conformar y capacitar la brigada de emergencia del taller.', 'Jefe de taller', `${y}-09-30`),
      ] },
    { id: `04-${y}-SAC`, tipo: 'No conformidad', fecha: `${y}-08-22`, proceso: 'Operaciones', fuente: 'Investigación de incidente', sede: 'T4', elemento: '4.2',
      descripcion: 'Las acciones correctivas de investigaciones de incidentes no tienen seguimiento ni verificación de eficacia.',
      acciones: [
        a('Registrar todos los planes de acción de investigaciones en el sistema con responsable y plazo.', 'Analista HSE', `${y}-09-15`, `${y}-09-12`, 'Reporte del sistema.pdf'),
        a('Verificar la eficacia de las acciones cerradas a los 30 días.', 'Jefe de HSE', `${y}-11-30`),
      ] },
    { id: `05-${y}-SAC`, tipo: 'Oportunidad de mejora', fecha: `${y}-09-30`, proceso: 'Seguridad y Medio Ambiente', fuente: 'Revisión por la dirección', sede: 'T1', elemento: '3.9',
      descripcion: 'Los documentos del SGSST se mantienen en carpetas personales y no hay una lista maestra vigente.',
      acciones: [a('Centralizar los documentos en el repositorio del sistema y emitir la lista maestra.', 'Encargado SIG', `${y}-12-15`)] },
    { id: `06-${y}-SAC`, tipo: 'No conformidad', fecha: `${y}-10-14`, proceso: 'Seguridad y Medio Ambiente', fuente: 'Inspección', sede: 'T1', elemento: '4.1',
      descripcion: 'El cumplimiento del programa de inspecciones del Taller 01 está por debajo de la meta del 90 %.',
      acciones: [
        a('Designar responsable de inspecciones del Taller 01 y reprogramar las pendientes.', 'Jefe de taller', `${y}-10-31`, `${y}-10-30`, 'Memorando de designación.pdf'),
        a('Ejecutar las inspecciones reprogramadas y registrar en el sistema.', 'Jefe de taller', `${y}-11-20`),
      ] },
  ];
}

// ---------- Eventos: clasificación (panel de control de accidentes / incidentes) ----------
export const CLASES_EVENTO = [
  { id: 'FAT', nombre: 'Accidente mortal', grupo: 'lesion', registrable: true, incapacitante: true },
  { id: 'LTI', nombre: 'Accidente con tiempo perdido (LTI)', grupo: 'lesion', registrable: true, incapacitante: true },
  { id: 'WRC', nombre: 'Restricción de trabajo (WRC)', grupo: 'lesion', registrable: true },
  { id: 'MTC', nombre: 'Tratamiento médico (MTC)', grupo: 'lesion', registrable: true },
  { id: 'FAC', nombre: 'Primeros auxilios (FAC)', grupo: 'lesion' },
  { id: 'MA', nombre: 'Medio ambiente', grupo: 'incidente' },
  { id: 'PD', nombre: 'Daño al equipo / pérdida de la propiedad (PD)', grupo: 'incidente' },
  { id: 'PP', nombre: 'Pérdida en el proceso', grupo: 'incidente' },
  { id: 'INC', nombre: 'Incidente', grupo: 'incidente' },
  { id: 'NWR', nombre: 'Evento no relacionado al trabajo (NWR)', grupo: 'otro' },
  { id: 'EO', nombre: 'Enfermedad ocupacional', grupo: 'enfermedad', registrable: true },
  { id: 'ENR', nombre: 'Enfermedad no relacionada al trabajo', grupo: 'enfermedad' },
  { id: 'NM', nombre: 'Cuasi accidente (near miss)', grupo: 'incidente' },
  { id: 'HPH', nombre: 'Peligro de alto potencial (HPH)', grupo: 'incidente' },
];
export const AREAS_EVENTO = ['Operaciones', 'Transportes', 'Mantenimiento', 'Almacén', 'Logística', 'HSE', 'Administración', 'GTH'];
export const PARTES_CUERPO = ['Cabeza y cuello', 'Extremidades superiores', 'Manos y dedos', 'Tronco', 'Extremidades inferiores', 'Pies', 'Sistémico'];
export const GRUPOS_EDAD = ['18-25', '26-35', '36-45', '46 y más'];
export const ANTIGUEDADES = ['Menos de 1 año', '1 a 5 años', '6 a 10 años', 'Más de 10 años'];
export const TURNOS = ['Día', 'Noche'];
export const GENEROS = ['Hombre', 'Mujer'];
// tipo heredado de la versión anterior (para formatos e indicadores antiguos)
export const tipoDeClase = (c) => (['FAT', 'LTI'].includes(c) ? 'Accidente incapacitante' : ['WRC', 'MTC', 'FAC'].includes(c) ? 'Accidente leve' : ['HPH', 'NM'].includes(c) ? 'Incidente peligroso' : 'Incidente');

const DESC_EVENTO = {
  LTI: ['Atrapamiento de mano entre la laina y el casco del molino durante el retiro.', 'Caída a nivel con fractura de muñeca al bajar de la plataforma.'],
  WRC: ['Lumbalgia al levantar una pieza sin ayuda mecánica.', 'Esguince de tobillo al pisar un desnivel en el patio.'],
  MTC: ['Corte en el antebrazo con borde de plancha que requirió sutura.', 'Proyección de partícula al ojo que requirió atención en clínica.'],
  FAC: ['Quemadura de primer grado en la palma de la mano al manipular pieza caliente.', 'Partícula extraña en el ojo derecho durante el esmerilado.', 'Contusión leve en la rodilla al golpearse con la estructura.', 'Corte superficial en el dedo al retirar viruta.'],
  PD: ['Retroceso de camioneta impacta poste de alumbrado en el estacionamiento.', 'Montacargas golpea estantería del almacén.', 'Daño al parachoques de la unidad durante maniobra en el patio.'],
  NM: ['Caída de herramienta desde andamio en zona delimitada, sin personas expuestas.'],
  HPH: ['Trabajador realiza labores en altura sin protección contra caídas.', 'Ingreso de personal a plataforma de andamio no liberada.', 'Abertura en el piso sin barrera rígida.', 'Manguera neumática presurizada sin seguro ni sistema anti látigo.', 'Uso inadecuado de escalera telescópica para trabajo en altura.'],
};
// [mes, clase, sede, dias perdidos]
const EVENTOS_BASE = [
  [0, 'FAC', 'T1'], [0, 'FAC', 'T2'], [0, 'PD', 'UM2'], [0, 'HPH', 'T4'],
  [1, 'LTI', 'UM2', 14], [1, 'WRC', 'UM2'],
  [2, 'LTI', 'T4', 21], [2, 'WRC', 'UM2'], [2, 'FAC', 'T4'],
  [3, 'PD', 'UM3'], [3, 'PD', 'UM3'], [3, 'PD', 'UM1'], [3, 'PD', 'T2'], [3, 'HPH', 'UM1'], [3, 'FAC', 'T2'],
  [4, 'FAC', 'T2'], [4, 'PD', 'T1'],
  [5, 'FAC', 'UM1'], [5, 'PD', 'T2'], [5, 'PD', 'UM3'], [5, 'HPH', 'UM1'], [5, 'HPH', 'T2'],
  [6, 'PD', 'T2'], [6, 'PD', 'UM1'], [6, 'PD', 'T1'], [6, 'NM', 'UM2'], [6, 'HPH', 'UM1'], [6, 'HPH', 'UM1'], [6, 'MTC', 'T2'],
  [7, 'HPH', 'UM1'], [7, 'HPH', 'UM1'], [7, 'HPH', 'UM1'],
  [9, 'FAC', 'UM1'], [9, 'FAC', 'UM1'], [9, 'HPH', 'UM1'], [9, 'HPH', 'UM1'], [9, 'HPH', 'UM1'], [9, 'HPH', 'UM1'], [9, 'HPH', 'UM1'], [9, 'FAC', 'T4'], [9, 'FAC', 'T4'], [9, 'HPH', 'UM1'],
  [10, 'FAC', 'T2'], [10, 'PD', 'UM3'],
];
const AREA_SEDE_EV = { T1: ['Almacén', 'Administración'], T2: ['Transportes', 'Transportes', 'Mantenimiento'], T4: ['Operaciones', 'Mantenimiento'], UM1: ['Operaciones'], UM2: ['Operaciones'], UM3: ['Operaciones', 'Logística'] };

export function buildEventos() {
  const r = rng(4410);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const cuentas = {};
  return EVENTOS_BASE.filter(([m]) => m <= MES_ACTUAL).map(([m, clase, sede, dias], i) => {
    cuentas[clase] = (cuentas[clase] || 0) + 1;
    const c = CLASES_EVENTO.find((x) => x.id === clase);
    const lesion = c.grupo === 'lesion';
    let fecha = f(m, 2 + Math.floor(r() * 26));
    if (fecha > hoyIso()) fecha = hoyIso();
    const pool = DESC_EVENTO[clase];
    return {
      id: `INC-${String(i + 1).padStart(4, '0')}`, clase, tipo: tipoDeClase(clase), unidad: sede, paradaId: null, fecha,
      descripcion: pool[(cuentas[clase] - 1) % pool.length],
      estado: fecha < mas(hoyIso(), -20) ? 'Cerrado' : 'En investigación',
      diasPerdidos: dias || 0, reportadoPor: sede.startsWith('T') ? 'u6' : 'u4',
      area: pick(AREA_SEDE_EV[sede]), turno: r() < 0.9 ? 'Día' : 'Noche',
      parteCuerpo: lesion ? (r() < 0.55 ? 'Manos y dedos' : r() < 0.5 ? 'Extremidades inferiores' : r() < 0.6 ? 'Cabeza y cuello' : 'Tronco') : null,
      edad: r() < 0.25 ? null : pick(['18-25', '26-35', '26-35', '26-35', '36-45', '46 y más']),
      antiguedad: r() < 0.3 ? null : pick(['Menos de 1 año', '1 a 5 años', '1 a 5 años', '6 a 10 años']),
      genero: r() < 0.94 ? 'Hombre' : 'Mujer',
    };
  });
}

// clase y datos del panel para los incidentes que ya existían en la demo
export const CLASE_INCIDENTES_PREVIOS = {
  'INC-0093': { clase: 'NM', area: 'Mantenimiento', turno: 'Día' },
  'INC-0088': { clase: 'FAC', area: 'Mantenimiento', turno: 'Día', parteCuerpo: 'Manos y dedos', edad: '26-35', antiguedad: '1 a 5 años', genero: 'Hombre' },
  'INC-0081': { clase: 'LTI', area: 'Operaciones', turno: 'Noche', parteCuerpo: 'Manos y dedos', edad: '36-45', antiguedad: '6 a 10 años', genero: 'Hombre' },
  'INC-0090': { clase: 'HPH', area: 'Mantenimiento', turno: 'Día' },
  'INC-0091': { clase: 'INC', area: 'Mantenimiento', turno: 'Noche' },
};

// ---------- Horas hombre trabajadas (HHT) y personal por sede y mes ----------
const HHT_BASE = { UM1: 21000, UM2: 16500, UM3: 9800, UM4: 11200, UM5: 4200, UM6: 5100, UM7: 6300, T1: 8600, T2: 13800, T4: 21500 };
export function buildHht() {
  const r = rng(91);
  const hht = {}; const trabajadores = {};
  Object.entries(HHT_BASE).forEach(([s, base]) => {
    hht[s] = Array.from({ length: 12 }, (_, m) => (m < MES_ACTUAL ? Math.round(base * (0.82 + r() * 0.36) / 10) * 10 : null));
    trabajadores[s] = Array.from({ length: 12 }, (_, m) => (m < MES_ACTUAL ? Math.round(base / 230 * (0.9 + r() * 0.2)) : null));
  });
  return { anio: ANIO, hht, trabajadores, metas: { IF: 0.6, TRIR: 4.72 } };
}

// ---------- Cartillas de observación conductual ----------
export function buildCartillas() {
  const r = rng(5);
  const out = [];
  for (let m = Math.max(0, MES_ACTUAL - 3); m < MES_ACTUAL; m++) {
    [['UM1', 45], ['UM2', 82]].forEach(([s, prog]) => {
      const ejec = Math.round(prog * (0.8 + r() * 0.2));
      out.push({ mes: m, sede: s, programadas: prog, ejecutadas: ejec, observadores: Math.round(prog / 6), seguras: Math.round(920 + r() * 70) / 10 });
    });
  }
  return out;
}

// ---------- Estructura documental del SGSST (5 procesos, 27 elementos, 55 documentos) ----------
export const PROCESOS_SGSST = [
  { id: 1, nombre: 'Compromiso, política y organización' },
  { id: 2, nombre: 'Planificación' },
  { id: 3, nombre: 'Implementación y operación' },
  { id: 4, nombre: 'Verificación' },
  { id: 5, nombre: 'Revisión y mejora continua' },
];
// código, elemento, módulo del sistema que lo soporta
export const ELEMENTOS_SGSST = [
  ['1.1', 'Política y compromiso', '/gestion'], ['1.2', 'Política y compromiso', '/gestion'], ['1.3', 'Organización', '/roles'], ['1.4', 'Organización', '/gestion'],
  ['1.5', 'Organización', '/archivos'], ['1.6', 'Participación', '/inspecciones'],
  ['2.1', 'Diagnóstico', '/sgsst'], ['2.2', 'Riesgos', '/iperc'], ['2.3', 'Requisitos legales', '/gestion'], ['2.4', 'Planificación', '/gestion'], ['2.5', 'Planificación', '/gestion'],
  ['3.1', 'Control operacional', '/permisos'], ['3.2', 'Control operacional', '/permisos'], ['3.3', 'Control operacional', '/iperc'], ['3.4', 'Control operacional', '/epp'],
  ['3.5', 'Capacitación', '/capacitaciones'], ['3.6', 'Salud ocupacional', '/salud'], ['3.7', 'Emergencias', '/archivos'], ['3.8', 'Clientes', '/paradas'], ['3.9', 'Control documentario', '/archivos'],
  ['4.1', 'Inspecciones', '/inspecciones'], ['4.2', 'Accidentes', '/incidentes'], ['4.3', 'Estadísticas', '/estadisticas'], ['4.4', 'Auditoría', '/gestion'], ['4.5', 'SAC', '/no-conformidades'],
  ['5.1', 'Revisión por la dirección', '/reporte-mensual'], ['5.2', 'Mejora continua', '/planes'],
].map(([codigo, nombre, modulo]) => ({ codigo, nombre, modulo, proceso: Number(codigo[0]) }));

export const SITUACIONES = ['Existente (validar)', 'Por verificar si existe', 'Por crear', 'Validado'];
const D = (elemento, documento, tipo, aplicacion, situacion) => ({ elemento, documento, tipo, aplicacion, situacion });
export function buildDocumentosSgsst() {
  return [
    D('1.1', 'Política de SST', 'Política', 'Se exhibe y se difunde en cada sede y UM', 'Por verificar si existe'),
    D('1.1', 'Cargo de difusión de la política', 'Formato', 'Cada sede y UM envía el cargo', 'Por crear'),
    D('1.2', 'Objetivos y metas de SST', 'Programa', 'Cada sede/UM conoce y aporta a las metas', 'Existente (validar)'),
    D('1.2', 'Manual del SGSST', 'Manual', 'Talleres y UM lo aplican', 'Existente (validar)'),
    D('1.3', 'Organigrama SST y alcance del SGSST', 'Documento', 'Cada sede designa su coordinador o responsable local', 'Existente (validar)'),
    D('1.3', 'Funciones y responsabilidades SST por cargo', 'Documento', 'Se entrega a todo el personal en la inducción', 'Existente (validar)'),
    D('1.4', 'Reglamento del Comité de SST y acta de instalación', 'Documento', 'Talleres en el comité central. UM: subcomité o supervisor según corresponda', 'Por verificar si existe'),
    D('1.4', 'Actas mensuales e informes del Comité', 'Registro', 'Los subcomités envían sus actas', 'Por verificar si existe'),
    D('1.5', 'Reglamento Interno de SST (RISST)', 'Reglamento', 'Se entrega a cada trabajador con constancia', 'Por verificar si existe'),
    D('1.5', 'Constancia de entrega del RISST', 'Formato', 'Cada sede envía el cargo', 'Por crear'),
    D('1.6', 'Procedimiento y tarjeta de reporte de actos y condiciones', 'Procedimiento', 'Todo el personal reporta; la sede consolida', 'Por crear'),
    D('1.6', 'Registro de reportes y sugerencias', 'Registro', 'La base consolida', 'Por crear'),
    D('2.1', 'Estudio de línea base del SGSST', 'Informe', 'Se aplica por sede/UM', 'Existente (validar)'),
    D('2.2', 'Procedimiento de IPERC', 'Procedimiento', 'Talleres adoptan. En UM se compara con el IPERC del cliente', 'Por verificar si existe'),
    D('2.2', 'IPERC línea base por puesto y tarea', 'Matriz', 'Talleres completan lo local. UM completa con riesgos del servicio', 'Existente (validar)'),
    D('2.2', 'IPERC continuo y de servicio', 'Formato', 'UM lo llena por servicio y lo entrega al cierre', 'Por crear'),
    D('2.2', 'Mapa de riesgos', 'Plano', 'Cada taller lo exhibe. UM según el frente', 'Por verificar si existe'),
    D('2.3', 'Matriz de requisitos legales', 'Matriz', 'La base la mantiene; sedes reportan cambios', 'Existente (validar)'),
    D('2.3', 'Matriz de requisitos por cliente (UM)', 'Matriz', 'Cada unidad minera la mantiene al día', 'Por crear'),
    D('2.3', 'Evaluación de cumplimiento legal', 'Registro', 'La base evalúa; sedes aportan evidencias', 'Por crear'),
    D('2.4', 'Planificación de actividades preventivas', 'Plan', 'Sedes proponen actividades', 'Por verificar si existe'),
    D('2.5', 'Programa Anual de SST', 'Programa', 'Cada sede aporta sus actividades y reporta cumplimiento', 'Existente (validar)'),
    D('3.1', 'Estándares de trabajos de alto riesgo', 'Estándar', 'Talleres adoptan. UM aplica el del cliente si es más exigente', 'Existente (validar)'),
    D('3.1', 'PETS por tarea típica', 'PETS', 'Sede o UM lo ajusta al equipo y condiciones', 'Existente (validar)'),
    D('3.1', 'Mapa de procesos SST', 'Documento', 'Referencia para todas las sedes', 'Existente (validar)'),
    D('3.2', 'Procedimiento de permisos de trabajo de alto riesgo (PETAR) y ATS', 'Procedimiento', 'UM usa el del cliente y entrega copia. Talleres usan el de DMZ', 'Existente (validar)'),
    D('3.2', 'Formatos PETAR (altura, espacios confinados, caliente, energías, izaje), ATS, OPT, VFL', 'Formato', 'UM entrega el escaneado por servicio', 'Existente (validar)'),
    D('3.3', 'Matriz de controles críticos', 'Matriz', 'Sedes verifican; base consolida', 'Por crear'),
    D('3.4', 'Matriz de EPP por puesto y tarea', 'Matriz', 'Talleres y UM la aplican', 'Por crear'),
    D('3.4', 'Registro de entrega de EPP y de equipos de emergencia', 'Registro', 'Sede llena; base consolida', 'Por crear'),
    D('3.5', 'Programa anual de capacitación y matriz por puesto', 'Programa', 'Sede ejecuta; base consolida', 'Existente (validar)'),
    D('3.5', 'Procedimiento de inducción', 'Procedimiento', 'UM exige inducción del cliente y del taller', 'Por verificar si existe'),
    D('3.5', 'Formatos de asistencia, evaluación y encuesta', 'Formato', 'Todas las sedes', 'Existente (validar)'),
    D('3.6', 'Programa de vigilancia de la salud', 'Programa', 'La base coordina; sedes remiten aptitud', 'Por verificar si existe'),
    D('3.6', 'Registro de exámenes médicos ocupacionales', 'Registro', 'La base custodia; UM exige aptitud vigente', 'Por verificar si existe'),
    D('3.6', 'Programa de monitoreo ocupacional', 'Programa', 'Extender a todos los talleres y UM', 'Existente (validar)'),
    D('3.6', 'Registro de monitoreo de agentes', 'Registro', 'La base consolida', 'Por verificar si existe'),
    D('3.7', 'Plan de respuesta a emergencias por sede/UM', 'Plan', 'Plan marco de la base. Cada taller y UM completa el anexo local', 'Existente (validar)'),
    D('3.7', 'Brigadas y competencias', 'Registro', 'Cada sede tiene su brigada', 'Existente (validar)'),
    D('3.7', 'Programa de simulacros y formatos', 'Programa', 'Todas las sedes', 'Existente (validar)'),
    D('3.8', 'Procedimiento de ingreso y coordinación con la unidad minera', 'Procedimiento', 'Cada UM lo aplica con su cliente', 'Por crear'),
    D('3.8', 'Expediente de servicio o parada', 'Registro', 'UM lo entrega al cierre de cada servicio', 'Por crear'),
    D('3.9', 'Procedimiento y lista maestra de documentos', 'Procedimiento', 'Las sedes usan solo lo vigente', 'Por verificar si existe'),
    D('4.1', 'Procedimiento de inspecciones', 'Procedimiento', 'Todas las sedes', 'Por verificar si existe'),
    D('4.1', 'Formatos y registros de inspección', 'Formato', 'Todas las sedes', 'Por crear'),
    D('4.2', 'Procedimiento de investigación de accidentes, incidentes y enfermedades', 'Procedimiento', 'Sede reporta, base investiga', 'Por verificar si existe'),
    D('4.2', 'Formatos y registros de eventos', 'Formato', 'Todas las sedes', 'Por crear'),
    D('4.3', 'Procedimiento de estadísticas e indicadores', 'Procedimiento', 'Sedes reportan según calendario', 'Por crear'),
    D('4.3', 'Registro semanal y consolidado de estadísticas', 'Registro', 'Sedes reportan; base consolida', 'Existente (validar)'),
    D('4.4', 'Programa y procedimiento de auditoría', 'Programa', 'Cada sede se audita en el ciclo', 'Por verificar si existe'),
    D('4.4', 'Informe de auditoría y registro de auditorías', 'Registro', 'Sede responde hallazgos', 'Por verificar si existe'),
    D('4.5', 'Procedimiento de SAC', 'Procedimiento', 'Todas las sedes', 'Por crear'),
    D('4.5', 'Formato SAC y matriz de seguimiento', 'Formato', 'Todas las sedes', 'Por crear'),
    D('5.1', 'Procedimiento e informe de revisión por la dirección', 'Informe', 'Sedes aportan sus resultados', 'Por crear'),
    D('5.2', 'Plan de mejora continua', 'Plan', 'Sedes proponen', 'Por crear'),
  ].map((d, i) => ({ id: `DOC-${String(i + 1).padStart(2, '0')}`, ...d, archivo: null }));
}

// ---------- Planes de acción derivados de las investigaciones de eventos ----------
const ACCIONES_EVENTO = {
  lesion: ['Retroalimentar a la cuadrilla sobre el peligro identificado (charla de 5 minutos).', 'Actualizar el PETS de la tarea con el control faltante.', 'Verificar la dotación y el estado del EPP específico de la tarea.'],
  PD: ['Reforzar la inspección pre-uso del equipo y la señalización del área de maniobra.', 'Implementar vigía para maniobras de retroceso.'],
  HPH: ['Detener la tarea y verificar controles críticos antes de reiniciar.', 'Incluir el peligro en el IPERC continuo del frente.', 'Instalar barrera rígida o protección colectiva.'],
  otro: ['Registrar y difundir la lección aprendida del evento.'],
};
const RESP_SEDE = { T1: 'u6', T2: 'u6', T4: 'u6', UM1: 'u2', UM2: 'u3', UM3: 'u6', UM4: 'u6', UM5: 'u6', UM6: 'u6', UM7: 'u6' };
export function buildPlanesEventos(eventos) {
  const r = rng(303);
  const planes = [];
  let n = 1;
  eventos.forEach((e) => {
    const g = CLASES_EVENTO.find((c) => c.id === e.clase)?.grupo;
    const pool = g === 'lesion' ? ACCIONES_EVENTO.lesion : e.clase === 'PD' ? ACCIONES_EVENTO.PD : e.clase === 'HPH' ? ACCIONES_EVENTO.HPH : ACCIONES_EVENTO.otro;
    const cant = Math.min(pool.length, 1 + Math.floor(r() * pool.length));
    for (let i = 0; i < cant; i++) {
      const vence = mas(e.fecha, 7 + Math.floor(r() * 23));
      const vencido = vence < hoyIso();
      // el Taller 01 casi no cierra sus planes (como en el reporte); el resto cierra la mayoría
      const pCierre = e.unidad === 'T1' ? 0.05 : e.unidad === 'T2' ? 0.7 : 0.88;
      const cerrado = vencido ? r() < pCierre : r() < 0.2;
      planes.push({
        id: `PA-${String(n++).padStart(4, '0')}`, origen: e.id, unidad: e.unidad, descripcion: pool[i],
        responsable: RESP_SEDE[e.unidad] || 'u6', vence,
        estado: cerrado ? 'Cerrado' : (!vencido && r() < 0.5) ? 'En proceso' : 'Abierto',
        ...(cerrado ? { evidencia: `Evidencia ${e.id}-${i + 1}.pdf` } : {}),
      });
    }
  });
  return planes;
}
