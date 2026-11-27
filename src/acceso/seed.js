// Datos ficticios del control de accesos (trabajadores, grupos).
// Ninguna persona es real.

export const AREAS = ['Mantenimiento', 'Seguridad (SSOMA)', 'Operaciones', 'Logística', 'Administración'];
export const UNIDADES = ['Sede Lima', 'U.M. Cerro Azul', 'U.M. Pampa Roja', 'U.M. Kallpa Norte', 'U.M. Antaccasa', 'U.M. Rumi Wasi', 'U.M. Llamac', 'U.M. Qori Pata'];

// Permisos que otorga cada grupo. El acceso final de una persona es la suma de sus grupos.
//   cap:   null | 'participante' | 'supervisor' | 'admin'   (Capacitaciones)
//   ssoma: true/false                                          (SSOMA DMZ)
//   admin: true/false                                          (este panel de accesos)
export const GRUPOS_SEED = [
  { id: 'g-ti', nombre: 'Administradores de la plataforma', desc: 'Área de TI. Gestionan usuarios, grupos y accesos a todos los módulos.', color: '#c0262d', permisos: { cap: 'admin', ssoma: true, admin: true } },
  { id: 'g-cap-admin', nombre: 'Capacitaciones · Administradores', desc: 'Crean y programan cursos, ven el avance de todos y emiten certificados.', color: '#0b5cad', permisos: { cap: 'admin', ssoma: false, admin: false } },
  { id: 'g-cap-sup', nombre: 'Capacitaciones · Supervisores', desc: 'Ven el avance y las fechas de su área y envían recordatorios.', color: '#2370b8', permisos: { cap: 'supervisor', ssoma: false, admin: false } },
  { id: 'g-cap', nombre: 'Capacitaciones · Participantes', desc: 'Llevan sus cursos, rinden evaluaciones y descargan certificados.', color: '#5b8fd1', permisos: { cap: 'participante', ssoma: false, admin: false } },
  { id: 'g-ssoma', nombre: 'SSOMA DMZ · Usuarios', desc: 'Acceso al sistema de gestión HSE (el rol dentro de SSOMA se define allí).', color: '#ea7a12', permisos: { cap: null, ssoma: true, admin: false } },
  { id: 'g-todo', nombre: 'Acceso completo', desc: 'Capacitaciones como participante y SSOMA DMZ.', color: '#15803d', permisos: { cap: 'participante', ssoma: true, admin: false } },
];

const NOMBRES = ['Luis', 'Rosa', 'Miguel', 'Ana', 'Jorge', 'Carmen', 'Pedro', 'Lucía', 'Víctor', 'Elena', 'Raúl', 'Patricia', 'César', 'Gladys', 'Hugo', 'Marisol', 'Edwin', 'Karina', 'Wilmer', 'Diana', 'Óscar', 'Yeni', 'Fredy', 'Norma', 'Iván', 'Sonia', 'Alfredo', 'Milagros', 'Rubén', 'Flor', 'Henry', 'Liliana'];
const APELLIDOS = ['Torres', 'Huamán', 'Quispe', 'Mamani', 'Flores', 'Chávez', 'Rojas', 'Vargas', 'Condori', 'Ramos', 'Cárdenas', 'Salazar', 'Paredes', 'Ccori', 'Huanca', 'Apaza', 'Soto', 'Medina', 'Castillo', 'Gutiérrez'];
const CARGOS = {
  Mantenimiento: ['Técnico mecánico', 'Técnico electricista', 'Soldador', 'Mecánico de molinos', 'Rigger', 'Supervisor de mantenimiento'],
  'Seguridad (SSOMA)': ['Supervisor HSE', 'Asistente SSOMA', 'Analista HSE'],
  Operaciones: ['Operador de grúa', 'Operador de equipo pesado', 'Jefe de guardia'],
  Logística: ['Almacenero', 'Asistente de logística', 'Conductor'],
  Administración: ['Asistente administrativo', 'Analista de RR. HH.', 'Contador'],
};

function rnd(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function seedAcceso() {
  const r = rnd(42);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const fijos = [
    { dni: '10000001', nombre: 'Admin TI', cargo: 'Analista de sistemas', area: 'Administración', unidad: 'Sede Lima', grupos: ['g-ti'] },
    { dni: '45872103', nombre: 'Jhonatan Ramírez Quispe', cargo: 'Técnico mecánico', area: 'Mantenimiento', unidad: 'U.M. Cerro Azul', grupos: ['g-todo'] },
    { dni: '40221587', nombre: 'Carlos Mendoza Ríos', cargo: 'Supervisor de mantenimiento', area: 'Mantenimiento', unidad: 'U.M. Cerro Azul', grupos: ['g-cap-sup', 'g-todo'] },
    { dni: '41556790', nombre: 'Andrea Salas Vega', cargo: 'Coordinadora de capacitación', area: 'Seguridad (SSOMA)', unidad: 'Sede Lima', grupos: ['g-cap-admin', 'g-ssoma'] },
    { dni: '46120934', nombre: 'Luis Torres Huamán', cargo: 'Soldador', area: 'Mantenimiento', unidad: 'U.M. Pampa Roja', grupos: ['g-cap'] },
    { dni: '43987015', nombre: 'Rosa Paredes Cano', cargo: 'Supervisor HSE', area: 'Seguridad (SSOMA)', unidad: 'U.M. Pampa Roja', grupos: ['g-ssoma'] },
  ];
  const lista = fijos.map((p) => ({ ...p }));
  const usados = new Set(lista.map((p) => p.dni));
  for (let i = 0; i < 40; i++) {
    const area = i < 20 ? 'Mantenimiento' : pick(AREAS);
    let dni;
    do { dni = String(40000000 + Math.floor(r() * 9999999)); } while (usados.has(dni));
    usados.add(dni);
    const nom = pick(NOMBRES);
    const ap = `${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
    const gr = area === 'Seguridad (SSOMA)' ? ['g-todo'] : r() < 0.25 ? ['g-todo'] : r() < 0.85 ? ['g-cap'] : [];
    lista.push({ dni, nombre: `${nom} ${ap}`, cargo: pick(CARGOS[area]), area, unidad: pick(UNIDADES.slice(1)), grupos: gr });
  }
  const trabajadores = lista.map((p, i) => {
    const user = p.nombre.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const ap = (p.nombre.split(' ')[1] || 'dmz').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const enviado = i < 30 && p.grupos.length > 0;
    return {
      ...p,
      correo: `${user[0]}${ap}@dimarza.com.pe`,
      whatsapp: `+51 9${String(10000000 + ((i * 7919) % 89999999)).padStart(8, '0')}`,
      pin: '1234',
      pinTemporal: false,
      activo: true,
      envios: enviado ? [{ fecha: new Date(Date.now() - (i + 2) * 86400000).toISOString(), canales: ['Correo', 'WhatsApp'], estado: 'Entregado' }] : [],
    };
  });
  return { version: 1, grupos: GRUPOS_SEED.map((g) => ({ ...g, permisos: { ...g.permisos } })), trabajadores };
}
