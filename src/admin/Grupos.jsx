import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, GraduationCap, ShieldCheck, UsersRound, Check, Minus } from 'lucide-react';
import { useAcceso, CAP_ROL } from '../acceso/db.jsx';
import { PageHeader, Card, Modal, Field } from '../components/ui.jsx';
import { permisosTexto } from './comun.jsx';

const COLORES = ['#c0262d', '#0b5cad', '#2370b8', '#5b8fd1', '#ea7a12', '#15803d', '#7c3aed', '#0f766e', '#667085'];

export default function Grupos() {
  const { db, update, notify } = useAcceso();
  const [edit, setEdit] = useState(null);
  const [borrar, setBorrar] = useState(null);
  const miembros = (g) => db.trabajadores.filter((t) => t.grupos.includes(g.id)).length;

  return (
    <>
      <PageHeader title="Grupos" subtitle="Cada grupo define a qué módulos entra y con qué rol. Al cargar trabajadores de forma masiva puedes asignarlos directamente a un grupo."
        actions={<button className="btn btn-primary" onClick={() => setEdit({ id: null, nombre: '', desc: '', color: COLORES[6], permisos: { cap: null, ssoma: false, admin: false } })}><Plus size={15} /> Nuevo grupo</button>} />

      <Card title="Matriz de permisos">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Grupo</th><th>Capacitaciones</th><th>SSOMA DMZ</th><th>Administración de accesos</th><th className="right">Personas</th></tr></thead>
            <tbody>
              {db.grupos.map((g) => (
                <tr key={g.id}>
                  <td><span className="chip-g" style={{ '--c': g.color }}>{g.nombre}</span></td>
                  <td>{g.permisos.cap ? <strong>{CAP_ROL[g.permisos.cap]}</strong> : <Minus size={15} color="#98a2b3" />}</td>
                  <td>{g.permisos.ssoma ? <Check size={17} color="#15803d" /> : <Minus size={15} color="#98a2b3" />}</td>
                  <td>{g.permisos.admin ? <Check size={17} color="#15803d" /> : <Minus size={15} color="#98a2b3" />}</td>
                  <td className="right">{miembros(g)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>Roles de Capacitaciones: <strong>Participante</strong> lleva sus cursos · <strong>Supervisor</strong> ve el avance y las fechas de su área · <strong>Administrador</strong> gestiona cursos, programación y certificados de toda la empresa.</p>
      </Card>

      <div className="cards">
        {db.grupos.map((g) => (
          <div key={g.id} style={{ '--c': g.color }}><Card className="grupo-card" title={g.nombre} actions={<>
            <button className="icon-btn" title="Editar" aria-label="Editar" onClick={() => setEdit(structuredClone(g))}><Pencil size={15} /></button>
            <button className="icon-btn" title="Eliminar" aria-label="Eliminar" onClick={() => setBorrar(g)}><Trash2 size={15} /></button>
          </>}>
            <p>{g.desc}</p>
            <div className="acc-tags" style={{ marginBottom: 10 }}>
              {g.permisos.cap && <span className="acc-tag cap">Capacitaciones · {CAP_ROL[g.permisos.cap]}</span>}
              {g.permisos.ssoma && <span className="acc-tag ssoma">SSOMA DMZ</span>}
              {g.permisos.admin && <span className="acc-tag admin">Admin accesos</span>}
            </div>
            <Link className="link small" to={`/trabajadores?g=${g.id}`}><Users size={13} /> {miembros(g)} personas</Link>
          </Card></div>
        ))}
      </div>

      {edit && <EditarGrupo g={edit} onClose={() => setEdit(null)} onSave={(g) => {
        update((d) => {
          if (g.id) d.grupos = d.grupos.map((x) => (x.id === g.id ? g : x));
          else d.grupos.push({ ...g, id: `g-${Date.now().toString(36)}` });
        });
        notify(g.id ? 'Grupo actualizado: los accesos de sus miembros cambiaron' : 'Grupo creado');
        setEdit(null);
      }} />}
      {borrar && (
        <Modal title="Eliminar grupo" onClose={() => setBorrar(null)} footer={<>
          <button className="btn" onClick={() => setBorrar(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => {
            update((d) => { d.grupos = d.grupos.filter((x) => x.id !== borrar.id); d.trabajadores.forEach((t) => { t.grupos = t.grupos.filter((x) => x !== borrar.id); }); });
            notify('Grupo eliminado'); setBorrar(null);
          }}>Eliminar</button>
        </>}>
          <p>Se eliminará <strong>{borrar.nombre}</strong>. Sus {miembros(borrar)} miembros dejarán de tener los accesos que les daba este grupo ({permisosTexto(borrar.permisos)}), salvo que otro grupo se los dé.</p>
        </Modal>
      )}
    </>
  );
}

function EditarGrupo({ g, onClose, onSave }) {
  const [f, setF] = useState(g);
  const p = f.permisos;
  const setP = (k, v) => setF({ ...f, permisos: { ...p, [k]: v } });
  return (
    <Modal title={g.id ? 'Editar grupo' : 'Nuevo grupo'} onClose={onClose} wide footer={<>
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={f.nombre.trim().length < 3} onClick={() => onSave({ ...f, nombre: f.nombre.trim() })}>Guardar</button>
    </>}>
      <div className="form-2">
        <Field label="Nombre del grupo"><input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej.: Mantenimiento · Cerro Azul" /></Field>
        <Field label="Color">
          <div className="swatches">{COLORES.map((c) => <button key={c} type="button" className={f.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setF({ ...f, color: c })} aria-label={`Color ${c}`} />)}</div>
        </Field>
      </div>
      <Field label="Descripción"><input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Para qué es este grupo" /></Field>
      <span className="lbl-up">Permisos</span>
      <div className="perm-grid">
        <div className="perm">
          <h4><GraduationCap size={16} /> Capacitaciones</h4>
          {[[null, 'Sin acceso'], ['participante', 'Participante'], ['supervisor', 'Supervisor'], ['admin', 'Administrador']].map(([v, l]) => (
            <label key={l}><input type="radio" name="cap" checked={p.cap === v} onChange={() => setP('cap', v)} /> {l}</label>
          ))}
        </div>
        <div className="perm">
          <h4><ShieldCheck size={16} /> SSOMA DMZ</h4>
          <label><input type="radio" name="ssoma" checked={!p.ssoma} onChange={() => setP('ssoma', false)} /> Sin acceso</label>
          <label><input type="radio" name="ssoma" checked={p.ssoma} onChange={() => setP('ssoma', true)} /> Con acceso</label>
          <p className="muted small" style={{ margin: '6px 0 0' }}>El rol dentro de SSOMA (gerente, supervisor, médico…) se define en ese módulo.</p>
        </div>
        <div className="perm">
          <h4><UsersRound size={16} /> Administración de accesos</h4>
          <label><input type="radio" name="adm" checked={!p.admin} onChange={() => setP('admin', false)} /> Sin acceso</label>
          <label><input type="radio" name="adm" checked={p.admin} onChange={() => setP('admin', true)} /> Puede gestionar usuarios y grupos</label>
        </div>
      </div>
      <p className="note" style={{ marginTop: 14 }}>Este grupo dará: {permisosTexto(p)}</p>
    </Modal>
  );
}
