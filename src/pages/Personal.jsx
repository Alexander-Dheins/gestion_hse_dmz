import { useState } from 'react';
import { Search, Plus, Lock } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, acreditacion, estadoFecha, motivosBloqueo, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';

const Fecha = ({ f }) => <span className="nowrap"><Badge>{estadoFecha(f)}</Badge> <span className="small">{fmtFecha(f)}</span></span>;

export default function Personal() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [edit, setEdit] = useState(null);
  const verDetalle = can(user, 'emo.detalle');
  const editable = can(user, 'personal.editar') || verDetalle;

  let lista = db.personal.filter((p) => inScope(p.unidad));
  if (user.rol === 'trabajador') lista = lista.filter((p) => p.id === user.personalId);
  const conteo = { bloqueado: 0, 'por vencer': 0, habilitado: 0 };
  lista.forEach((p) => { conteo[acreditacion(p)]++; });
  lista = lista
    .filter((p) => filtro === 'todos' || acreditacion(p) === filtro)
    .filter((p) => !q || (p.nombre + p.cargo + p.id).toLowerCase().includes(q.toLowerCase()));

  const guardar = () => {
    update((d) => {
      if (edit.nuevo) {
        d.personal.push({ ...edit.data, id: 'T-' + String(d.personal.length + 1).padStart(3, '0') });
      } else {
        Object.assign(d.personal.find((x) => x.id === edit.data.id), edit.data);
      }
    }, edit.nuevo ? 'Trabajador registrado' : `Vigencias de ${edit.data.nombre} actualizadas`);
    setEdit(null);
  };
  const set = (k, v) => setEdit({ ...edit, data: { ...edit.data, [k]: v } });

  return (
    <>
      <PageHeader title="Personal y acreditación" subtitle="Nadie entra a planta con EMO, SCTR o inducción vencidos: el sistema lo bloquea automáticamente para paradas y permisos."
        actions={can(user, 'personal.editar') && <button className="btn btn-primary" onClick={() => setEdit({ nuevo: true, data: { nombre: '', cargo: '', unidad: visibleUnits[0], emoVence: hoy(), sctrVence: hoy(), induccionVence: hoy(), aptitud: 'Apto', restriccion: '', diagnostico: '' } })}><Plus size={16} /> Registrar trabajador</button>} />
      {user.rol !== 'trabajador' && (
        <div className="tabs">
          {[['todos', `Todos (${conteo.bloqueado + conteo['por vencer'] + conteo.habilitado})`], ['bloqueado', `Bloqueados (${conteo.bloqueado})`], ['por vencer', `Por vencer (${conteo['por vencer']})`], ['habilitado', `Habilitados (${conteo.habilitado})`]].map(([k, l]) => (
            <button key={k} className={filtro === k ? 'active' : ''} onClick={() => setFiltro(k)}>{l}</button>
          ))}
          <div className="search"><Search size={15} /><input placeholder="Buscar por nombre, cargo o código" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
      )}
      <Card>
        {lista.length === 0 && <Empty>Sin resultados.</Empty>}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Trabajador</th><th>Unidad</th><th>EMO (aptitud)</th><th>SCTR</th><th>Inducción</th><th>Estado</th>{editable && <th />}</tr></thead>
            <tbody>
              {lista.map((p) => {
                const a = acreditacion(p);
                return (
                  <tr key={p.id} className={a === 'bloqueado' ? 'row-bad' : ''}>
                    <td><strong>{p.nombre}</strong><div className="muted small">{p.id} · {p.cargo}</div></td>
                    <td>{nombreUnidad(db, p.unidad)}</td>
                    <td>
                      <Fecha f={p.emoVence} />
                      <div className="small">{p.aptitud}{p.restriccion && <span className="muted"> · {p.restriccion}</span>}</div>
                      {verDetalle ? <div className="small txt-info">{p.diagnostico}</div> : <div className="small muted"><Lock size={11} /> Detalle médico solo para el área médica</div>}
                    </td>
                    <td><Fecha f={p.sctrVence} /></td>
                    <td><Fecha f={p.induccionVence} /></td>
                    <td>{a === 'bloqueado' ? <><Badge tone="bad">Bloqueado</Badge><div className="small muted">{motivosBloqueo(p).join(', ')}</div></> : <Badge>{a === 'habilitado' ? 'Habilitado' : 'Por vencer'}</Badge>}</td>
                    {editable && <td><button className="btn btn-sm" onClick={() => setEdit({ nuevo: false, data: { ...p } })}>Actualizar</button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <Modal title={edit.nuevo ? 'Registrar trabajador' : `Actualizar · ${edit.data.nombre}`} onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
          {can(user, 'personal.editar') && (
            <>
              {edit.nuevo && (
                <div className="form-2">
                  <Field label="Nombre completo"><input value={edit.data.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
                  <Field label="Cargo"><input value={edit.data.cargo} onChange={(e) => set('cargo', e.target.value)} /></Field>
                  <Field label="Unidad"><select value={edit.data.unidad} onChange={(e) => set('unidad', e.target.value)}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
                </div>
              )}
              <div className="form-3">
                <Field label="Vence EMO"><input type="date" value={edit.data.emoVence} onChange={(e) => set('emoVence', e.target.value)} /></Field>
                <Field label="Vence SCTR"><input type="date" value={edit.data.sctrVence} onChange={(e) => set('sctrVence', e.target.value)} /></Field>
                <Field label="Vence inducción"><input type="date" value={edit.data.induccionVence} onChange={(e) => set('induccionVence', e.target.value)} /></Field>
              </div>
            </>
          )}
          {verDetalle && (
            <>
              <div className="form-2">
                <Field label="Aptitud"><select value={edit.data.aptitud} onChange={(e) => set('aptitud', e.target.value)}>{['Apto', 'Apto con restricciones', 'No apto'].map((x) => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Restricción"><input value={edit.data.restriccion} onChange={(e) => set('restriccion', e.target.value)} /></Field>
              </div>
              <Field label="Diagnóstico (confidencial)"><textarea rows={2} value={edit.data.diagnostico} onChange={(e) => set('diagnostico', e.target.value)} /></Field>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
