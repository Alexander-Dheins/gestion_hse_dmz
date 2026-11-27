import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Send, UserPlus, UserMinus, Upload, Power } from 'lucide-react';
import { useAcceso, accesosDe, iniciales, pinAleatorio, passAleatoria, SSOMA_PERFILES } from '../acceso/db.jsx';
import { AREAS, UNIDADES } from '../acceso/seed.js';
import { PageHeader, Card, Modal, Field, Empty } from '../components/ui.jsx';
import { AccTags, GrupoChip, fechaHora, aplicarEnvio, credencialesNuevas } from './comun.jsx';

const FILTROS = [
  ['todos', 'Todos'], ['ambos', 'Capacitaciones + SSOMA'], ['cap', 'Solo Capacitaciones'], ['ssoma', 'Solo SSOMA'],
  ['cap-admin', 'Admin. de capacitaciones'], ['sin', 'Sin acceso'], ['sin-envio', 'Acceso sin enviar'], ['inactivos', 'Desactivados'],
];

export default function Trabajadores() {
  const { db, update, notify } = useAcceso();
  const [params, setParams] = useSearchParams();
  const f = params.get('f') || 'todos';
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [grupo, setGrupo] = useState(params.get('g') || '');
  const [sel, setSel] = useState([]);
  const [nuevo, setNuevo] = useState(false);
  const [bulkGrupo, setBulkGrupo] = useState('');

  const lista = useMemo(() => db.trabajadores.filter((t) => {
    const a = accesosDe(db, t);
    if (f === 'inactivos' ? t.activo : !t.activo) return false;
    if (f === 'ambos' && !(a.cap && a.ssoma)) return false;
    if (f === 'cap' && !(a.cap && !a.ssoma)) return false;
    if (f === 'ssoma' && !(a.ssoma && !a.cap)) return false;
    if (f === 'cap-admin' && a.cap !== 'admin') return false;
    if (f === 'sin' && (a.cap || a.ssoma || a.admin)) return false;
    if (f === 'sin-envio' && !(t.grupos.length && !t.envios.length)) return false;
    if (area && t.area !== area) return false;
    if (grupo && !t.grupos.includes(grupo)) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!`${t.nombre} ${t.dni} ${t.cargo} ${t.correo}`.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [db, f, q, area, grupo]);

  const todos = lista.length > 0 && lista.every((t) => sel.includes(t.dni));
  const toggle = (dni) => setSel((s) => (s.includes(dni) ? s.filter((x) => x !== dni) : [...s, dni]));

  const masivo = (fn, msg) => {
    update((d) => { d.trabajadores.filter((t) => sel.includes(t.dni)).forEach((t) => fn(t, d)); });
    notify(msg);
    setSel([]);
  };
  const gNom = db.grupos.find((g) => g.id === bulkGrupo)?.nombre;

  return (
    <>
      <PageHeader title="Trabajadores" subtitle="Asigna grupos para definir a qué módulos entra cada persona y envíale su usuario y PIN."
        actions={<>
          <Link to="/carga" className="btn"><Upload size={15} /> Carga masiva</Link>
          <button className="btn btn-primary" onClick={() => setNuevo(true)}><Plus size={15} /> Nuevo trabajador</button>
        </>} />
      <div className="tabs">
        {FILTROS.map(([k, l]) => <button key={k} className={f === k ? 'active' : ''} onClick={() => { setParams(k === 'todos' ? {} : { f: k }); setSel([]); }}>{l}</button>)}
      </div>
      <div className="toolbar">
        <div className="search"><Search size={15} /><input placeholder="Buscar por nombre, DNI, cargo o correo" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área"><option value="">Todas las áreas</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
        <select value={grupo} onChange={(e) => setGrupo(e.target.value)} aria-label="Grupo"><option value="">Todos los grupos</option>{db.grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select>
        <span className="muted small">{lista.length} personas</span>
      </div>

      {sel.length > 0 && (
        <div className="bulkbar">
          <strong>{sel.length} seleccionados</strong>
          <select value={bulkGrupo} onChange={(e) => setBulkGrupo(e.target.value)} aria-label="Grupo para la acción masiva">
            <option value="">Elegir grupo…</option>
            {db.grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
          <button className="btn btn-sm" disabled={!bulkGrupo} onClick={() => masivo((t) => { if (!t.grupos.includes(bulkGrupo)) t.grupos.push(bulkGrupo); }, `${sel.length} agregados a ${gNom}`)}><UserPlus size={14} /> Agregar al grupo</button>
          <button className="btn btn-sm" disabled={!bulkGrupo} onClick={() => masivo((t) => { t.grupos = t.grupos.filter((g) => g !== bulkGrupo); }, `${sel.length} quitados de ${gNom}`)}><UserMinus size={14} /> Quitar del grupo</button>
          <button className="btn btn-sm" onClick={() => masivo((t, d) => aplicarEnvio(t, ['Correo', 'WhatsApp'], credencialesNuevas(accesosDe(d, t), pinAleatorio, passAleatoria)), `Accesos temporales enviados a ${sel.length} personas`)}><Send size={14} /> Enviar acceso</button>
          <button className="btn btn-sm" onClick={() => masivo((t) => { t.activo = !t.activo; }, f === 'inactivos' ? 'Usuarios reactivados' : 'Usuarios desactivados')}><Power size={14} /> {f === 'inactivos' ? 'Reactivar' : 'Desactivar'}</button>
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto', color: '#fff' }} onClick={() => setSel([])}>Cancelar</button>
        </div>
      )}

      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="chk"><input type="checkbox" checked={todos} onChange={() => setSel(todos ? [] : lista.map((t) => t.dni))} aria-label="Seleccionar todos" /></th>
                <th>Trabajador</th><th>Área y cargo</th><th>Grupos</th><th>Accesos</th><th>Último envío</th><th />
              </tr>
            </thead>
            <tbody>
              {lista.map((t) => (
                <tr key={t.dni} className={sel.includes(t.dni) ? 'sel' : ''}>
                  <td className="chk"><input type="checkbox" checked={sel.includes(t.dni)} onChange={() => toggle(t.dni)} aria-label={`Seleccionar ${t.nombre}`} /></td>
                  <td><div className="person"><div className="avatar">{iniciales(t.nombre)}</div><div><strong>{t.nombre}</strong><span>DNI {t.dni} · {t.correo}</span></div></div></td>
                  <td>{t.area}<div className="muted small">{t.cargo} · {t.unidad}</div></td>
                  <td>{t.grupos.length ? t.grupos.map((g) => <GrupoChip key={g} g={db.grupos.find((x) => x.id === g)} />) : <span className="muted small">Sin grupo</span>}</td>
                  <td><AccTags acc={accesosDe(db, t)} /></td>
                  <td className="small">{t.envios[0] ? <>{fechaHora(t.envios[0].fecha)}<div className="muted">{t.envios[0].canales.join(' y ')}</div></> : <span className="muted">No enviado</span>}</td>
                  <td className="right"><Link className="btn btn-sm" to={`/trabajadores/${t.dni}`}>Gestionar</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!lista.length && <Empty>No hay trabajadores con estos filtros.</Empty>}
        </div>
      </Card>
      {nuevo && <NuevoTrabajador onClose={() => setNuevo(false)} />}
    </>
  );
}

function NuevoTrabajador({ onClose }) {
  const { db, update, notify } = useAcceso();
  const [f, setF] = useState({ dni: '', nombre: '', cargo: '', area: AREAS[0], unidad: UNIDADES[1], correo: '', whatsapp: '+51 ', grupos: [], ssomaPerfil: 'u9' });
  const correoUsado = f.correo && db.trabajadores.some((t) => t.correo.toLowerCase() === f.correo.toLowerCase());
  const existe = db.trabajadores.some((t) => t.dni === f.dni);
  const ok = /^\d{8}$/.test(f.dni) && !existe && !correoUsado && f.nombre.trim().length > 3;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const guardar = () => {
    update((d) => { d.trabajadores.unshift({ ...f, nombre: f.nombre.trim(), pin: '', pinTemporal: true, password: '', passTemporal: true, activo: true, envios: [] }); });
    notify(`${f.nombre} agregado. Envíale su acceso desde su ficha.`);
    onClose();
  };
  return (
    <Modal title="Nuevo trabajador" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={!ok} onClick={guardar}>Guardar</button></>}>
      <div className="form-2">
        <Field label="DNI (será su usuario)"><input value={f.dni} maxLength={8} onChange={(e) => setF({ ...f, dni: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Nombres y apellidos"><input value={f.nombre} onChange={set('nombre')} /></Field>
        <Field label="Área"><select value={f.area} onChange={set('area')}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Cargo"><input value={f.cargo} onChange={set('cargo')} /></Field>
        <Field label="Unidad / sede"><select value={f.unidad} onChange={set('unidad')}>{UNIDADES.map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Correo"><input type="email" value={f.correo} onChange={set('correo')} /></Field>
        <Field label="WhatsApp"><input value={f.whatsapp} onChange={set('whatsapp')} /></Field>
        <Field label="Rol en SSOMA DMZ (si tiene acceso)"><select value={f.ssomaPerfil} onChange={set('ssomaPerfil')}>{SSOMA_PERFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
      </div>
      {existe && <p className="cell-err">Ya existe un trabajador con ese DNI.</p>}
      {correoUsado && <p className="cell-err">Ese correo ya lo usa otro trabajador.</p>}
      <span className="lbl-up">Grupos</span>
      <div className="opt-list">
        {db.grupos.map((g) => {
          const on = f.grupos.includes(g.id);
          return (
            <label key={g.id} className={`opt ${on ? 'on' : ''}`}>
              <input type="checkbox" checked={on} onChange={() => setF({ ...f, grupos: on ? f.grupos.filter((x) => x !== g.id) : [...f.grupos, g.id] })} />
              <div><strong>{g.nombre}</strong><span>{g.desc}</span></div>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
