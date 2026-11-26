import { useState } from 'react';
import { Plus, Paperclip } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';

export default function Planes() {
  const { db, user, inScope, visibleUnits, update, notify } = useStore();
  const [filtro, setFiltro] = useState('abiertos');
  const [nuevo, setNuevo] = useState(null);
  const [evid, setEvid] = useState(null);
  const base = db.planes.filter((p) => inScope(p.unidad));
  const lista = base.filter((p) => {
    if (filtro === 'abiertos') return p.estado !== 'Cerrado';
    if (filtro === 'vencidos') return p.estado !== 'Cerrado' && p.vence < hoy();
    if (filtro === 'mios') return p.responsable === user.id;
    if (filtro === 'cerrados') return p.estado === 'Cerrado';
    return true;
  }).sort((a, b) => a.vence.localeCompare(b.vence));
  const responsables = db.usuarios.filter((u) => u.rol !== 'trabajador' && (!u.unidad || visibleUnits.includes(u.unidad)));

  const guardar = () => {
    if (!nuevo.descripcion.trim()) return;
    update((d) => { d.planes.push({ id: nextId(d.planes, 'PA'), ...nuevo, estado: 'Abierto' }); }, 'Plan de acción creado');
    setNuevo(null);
  };
  const enProceso = (p) => update((d) => { d.planes.find((x) => x.id === p.id).estado = 'En proceso'; }, `${p.id} en proceso`);
  const subirEvidencia = () => {
    if (!evid.nombre.trim()) return;
    update((d) => { const x = d.planes.find((y) => y.id === evid.id); x.evidencia = evid.nombre.trim(); x.estado = x.estado === 'Abierto' ? 'En proceso' : x.estado; }, 'Evidencia adjuntada');
    setEvid(null);
  };
  const cerrar = (p) => {
    if (!p.evidencia) { notify('Para cerrar se necesita evidencia adjunta'); return; }
    update((d) => { d.planes.find((x) => x.id === p.id).estado = 'Cerrado'; }, `${p.id} cerrado`);
  };

  return (
    <>
      <PageHeader title="Planes de acción" subtitle="Todo hallazgo de inspecciones, incidentes o auditorías con responsable, fecha y evidencia de cierre."
        actions={can(user, 'plan.crear') && <button className="btn btn-primary" onClick={() => setNuevo({ unidad: visibleUnits[0], origen: 'Manual', descripcion: '', responsable: responsables[0]?.id, vence: hoy() })}><Plus size={16} /> Nuevo plan</button>} />
      <div className="tabs">
        {[['abiertos', 'Abiertos'], ['vencidos', 'Vencidos'], ['mios', 'Asignados a mí'], ['cerrados', 'Cerrados'], ['todos', 'Todos']].map(([k, l]) => (
          <button key={k} className={filtro === k ? 'active' : ''} onClick={() => setFiltro(k)}>{l}</button>
        ))}
      </div>
      <Card>
        {lista.length === 0 && <Empty>Nada por aquí.</Empty>}
        <table className="table">
          <thead><tr><th>N.º</th><th>Acción</th><th>Origen</th><th>Responsable</th><th>Vence</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.map((p) => {
              const vencido = p.estado !== 'Cerrado' && p.vence < hoy();
              const esResp = p.responsable === user.id;
              return (
                <tr key={p.id}>
                  <td><strong>{p.id}</strong></td>
                  <td>{p.descripcion}<div className="muted small">{nombreUnidad(db, p.unidad)}{p.evidencia ? ' · ' : ''}{p.evidencia && <span className="evid"><Paperclip size={12} /> {p.evidencia}</span>}</div></td>
                  <td className="nowrap">{p.origen}</td>
                  <td>{nombreUsuario(db, p.responsable)}</td>
                  <td className="nowrap">{vencido ? <Badge tone="bad">{fmtFecha(p.vence)}</Badge> : fmtFecha(p.vence)}</td>
                  <td><Badge>{p.estado}</Badge></td>
                  <td className="actions-cell">
                    {esResp && p.estado === 'Abierto' && <button className="btn btn-sm" onClick={() => enProceso(p)}>Iniciar</button>}
                    {(esResp || can(user, 'plan.cerrar')) && p.estado !== 'Cerrado' && <button className="btn btn-sm" onClick={() => setEvid({ id: p.id, nombre: '' })}>Evidencia</button>}
                    {can(user, 'plan.cerrar') && p.estado !== 'Cerrado' && <button className="btn btn-sm btn-primary" onClick={() => cerrar(p)}>Cerrar</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {nuevo && (
        <Modal title="Nuevo plan de acción" onClose={() => setNuevo(null)}
          footer={<><button className="btn" onClick={() => setNuevo(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
          <Field label="Acción a realizar"><textarea rows={3} value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} /></Field>
          <div className="form-2">
            <Field label="Unidad"><select value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Origen"><input value={nuevo.origen} onChange={(e) => setNuevo({ ...nuevo, origen: e.target.value })} /></Field>
            <Field label="Responsable"><select value={nuevo.responsable} onChange={(e) => setNuevo({ ...nuevo, responsable: e.target.value })}>{responsables.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></Field>
            <Field label="Fecha límite"><input type="date" value={nuevo.vence} onChange={(e) => setNuevo({ ...nuevo, vence: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {evid && (
        <Modal title={`Evidencia de ${evid.id}`} onClose={() => setEvid(null)}
          footer={<><button className="btn" onClick={() => setEvid(null)}>Cancelar</button><button className="btn btn-primary" onClick={subirEvidencia}>Adjuntar</button></>}>
          <Field label="Archivo de evidencia">
            <input type="file" onChange={(e) => setEvid({ ...evid, nombre: e.target.files?.[0]?.name || '' })} />
          </Field>
          <p className="muted small">En la demo solo se registra el nombre del archivo.</p>
        </Modal>
      )}
    </>
  );
}
