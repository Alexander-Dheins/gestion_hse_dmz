import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario } from '../store.jsx';
import { Badge, Card, PageHeader, Progress, Modal, Field, Empty } from '../components/ui.jsx';

export default function Paradas() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [filtro, setFiltro] = useState('todas');
  const [nueva, setNueva] = useState(null);
  const lista = db.paradas
    .filter((p) => inScope(p.unidad))
    .filter((p) => filtro === 'todas' || p.estado === filtro)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  const guardar = () => {
    if (!nueva.equipo.trim()) return;
    update((d) => {
      const n = Math.max(...d.paradas.map((p) => parseInt(p.id.split('-')[2], 10))) + 1;
      d.paradas.push({
        id: `P-2026-${String(n).padStart(3, '0')}`, unidad: nueva.unidad, equipo: nueva.equipo, tipo: nueva.tipo, inicio: nueva.inicio, fin: nueva.fin,
        estado: 'Planificada', avance: 0, jefe: user.rol === 'sup_mant' ? user.id : 'u7', hse: null, cuadrilla: [],
        tareas: nueva.tareas.split('\n').map((t) => t.trim()).filter(Boolean),
        checklist: ['Personal acreditado y con EMO vigente', 'IPERC de la parada aprobado', 'Matriz de bloqueo (LOTO) validada por planta', 'Plan de izaje crítico firmado', 'Monitoreo de gases calibrado', 'Rescate en espacio confinado coordinado'].map((item) => ({ item, ok: false })),
      });
    }, `Parada planificada: ${nueva.equipo}`);
    setNueva(null);
  };

  return (
    <>
      <PageHeader title="Paradas de planta" subtitle="Planificación HSE de cada parada: cuadrilla acreditada, tareas críticas, permisos y checklist de inicio."
        actions={can(user, 'parada.crear') && <button className="btn btn-primary" onClick={() => setNueva({ unidad: visibleUnits[0], equipo: '', tipo: '', inicio: new Date().toISOString().slice(0, 10), fin: new Date().toISOString().slice(0, 10), tareas: 'Bloqueo de energías\nIzaje de componentes' })}><Plus size={16} /> Planificar parada</button>} />
      <div className="tabs">
        {['todas', 'En curso', 'Planificada', 'Cerrada'].map((t) => (
          <button key={t} className={filtro === t ? 'active' : ''} onClick={() => setFiltro(t)}>{t === 'todas' ? 'Todas' : t}</button>
        ))}
      </div>
      <Card>
        {lista.length === 0 && <Empty>No hay paradas para mostrar.</Empty>}
        <table className="table">
          <thead><tr><th>Código</th><th>Equipo y trabajo</th><th>Unidad</th><th>Fechas</th><th>Avance</th><th>Estado</th></tr></thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/paradas/${p.id}`} className="link">{p.id}</Link></td>
                <td><strong>{p.equipo}</strong><div className="muted small">{p.tipo} · Resp. {nombreUsuario(db, p.jefe)}</div></td>
                <td>{nombreUnidad(db, p.unidad)}</td>
                <td className="nowrap">{fmtFecha(p.inicio)} – {fmtFecha(p.fin)}</td>
                <td style={{ minWidth: 110 }}><Progress value={p.avance} /><span className="small muted">{p.avance}%</span></td>
                <td><Badge>{p.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {nueva && (
        <Modal title="Planificar parada" onClose={() => setNueva(null)}
          footer={<><button className="btn" onClick={() => setNueva(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
          <Field label="Unidad minera">
            <select value={nueva.unidad} onChange={(e) => setNueva({ ...nueva, unidad: e.target.value })}>
              {visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}
            </select>
          </Field>
          <Field label="Equipo"><input value={nueva.equipo} onChange={(e) => setNueva({ ...nueva, equipo: e.target.value })} placeholder="Molino de bolas 16'x24' (ML-02)" /></Field>
          <Field label="Trabajo a realizar"><input value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })} placeholder="Cambio de lainas" /></Field>
          <div className="form-2">
            <Field label="Inicio"><input type="date" value={nueva.inicio} onChange={(e) => setNueva({ ...nueva, inicio: e.target.value })} /></Field>
            <Field label="Fin"><input type="date" value={nueva.fin} onChange={(e) => setNueva({ ...nueva, fin: e.target.value })} /></Field>
          </div>
          <Field label="Tareas críticas (una por línea)"><textarea rows={4} value={nueva.tareas} onChange={(e) => setNueva({ ...nueva, tareas: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}
