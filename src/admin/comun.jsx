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

// Simula el envío de credenciales temporales (en producción: correo + API de WhatsApp).
// Capacitaciones usa DNI + PIN; SSOMA DMZ y Administración usan correo + contraseña.
export function aplicarEnvio(t, canales, cred) {
  if (cred.pin) { t.pin = cred.pin; t.pinTemporal = true; }
  if (cred.pass) { t.password = cred.pass; t.passTemporal = true; }
  t.envios = [{ fecha: new Date().toISOString(), canales, estado: 'Enviado' }, ...(t.envios || [])];
}

export function credencialesNuevas(acc, pinAleatorio, passAleatoria) {
  return { pin: acc.cap ? pinAleatorio() : null, pass: acc.ssoma || acc.admin ? passAleatoria() : null };
}

export function mensajeAcceso(t, acc, cred) {
  const partes = [`Hola ${t.nombre.split(' ')[0]}, estos son tus accesos:`];
  if (acc.cap) partes.push(`CAPACITACIONES\nUsuario (DNI): ${t.dni}\nPIN temporal: ${cred.pin || '••••'}`);
  if (acc.ssoma) partes.push(`SSOMA DMZ\nCorreo: ${t.correo}\nContraseña temporal: ${cred.pass || '••••••••'}`);
  if (acc.admin) partes.push(`ADMINISTRACIÓN DE ACCESOS\nUsa el mismo correo y contraseña.`);
  if (!acc.cap && !acc.ssoma && !acc.admin) partes.push('(Todavía no tienes módulos habilitados.)');
  partes.push('Ingresa en: gestionhsedmz.vercel.app\nEn tu primer ingreso te pediremos cambiar el PIN o la contraseña. No compartas este mensaje.');
  return partes.join('\n\n');
}
