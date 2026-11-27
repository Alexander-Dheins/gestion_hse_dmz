import { CAP_ROL } from '../acceso/db.jsx';

export function AccTags({ acc }) {
  const tags = [];
  if (acc.cap) tags.push(<span key="c" className="acc-tag cap">Capacitaciones · {CAP_ROL[acc.cap]}</span>);
  if (acc.ssoma) tags.push(<span key="s" className="acc-tag ssoma">SSOMA DMZ</span>);
  if (acc.admin) tags.push(<span key="a" className="acc-tag admin">Admin accesos</span>);
  if (!tags.length) tags.push(<span key="n" className="acc-tag none">Sin acceso</span>);
  return <div className="acc-tags">{tags}</div>;
}

export function GrupoChip({ g }) {
  if (!g) return null;
  return <span className="chip-g" style={{ '--c': g.color }}>{g.nombre}</span>;
}

export function fechaHora(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

export function permisosTexto(p) {
  const x = [];
  if (p.cap) x.push(`Capacitaciones (${CAP_ROL[p.cap].toLowerCase()})`);
  if (p.ssoma) x.push('SSOMA DMZ');
  if (p.admin) x.push('Administración de accesos');
  return x.length ? x.join(' + ') : 'Sin permisos';
}

// Simula el envío de usuario y PIN temporal (en producción: correo + API de WhatsApp)
export function aplicarEnvio(t, canales, pin) {
  t.pin = pin;
  t.pinTemporal = true;
  t.envios = [{ fecha: new Date().toISOString(), canales, estado: 'Enviado' }, ...(t.envios || [])];
}

export function mensajeAcceso(t, acc, pin) {
  const mods = [acc.cap && 'Capacitaciones', acc.ssoma && 'SSOMA DMZ', acc.admin && 'Administración de accesos'].filter(Boolean);
  return `Hola ${t.nombre.split(' ')[0]}, ya tienes acceso a ${mods.length ? mods.join(' y ') : '(sin módulos habilitados)'}.\n\nUsuario: ${t.dni}\nPIN temporal: ${pin}\nIngresa en: gestionhsedmz.vercel.app\n\nAl entrar por primera vez te pediremos crear tu propio PIN. No compartas este mensaje.`;
}
