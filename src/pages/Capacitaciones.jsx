import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtAsistencia } from '../formatos.jsx';
import { useStore, can, fmtFecha, nombreUnidad, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';

export default function Capacitaciones() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [nueva, setNueva] = useState(null);
  const [formato, setFormato] = useState(null);
  const lista = db.capacitaciones.filter((c) => inScope(c.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const guardar = () => {
    if (!nueva.tema.trim()) return;
    update((d) => { d.capacitaciones.push({ id: nextId(d.capacitaciones, 'CAP'), ...nueva, horas: +nueva.horas, asistentes: 0, estado: 'Programada' }); }, 'Capacitación programada');
    setNueva(null);
  };
  const ejecutar = (c) => update((d) => { const x = d.capacitaciones.find((y) => y.id === c.id); x.estado = 'Ejecutada'; x.asistentes = 10 + Math.floor(Math.random() * 10); }, `${c.tema}: asistencia registrada`);
  return (
    <>
      <PageHeader title="Capacitaciones" subtitle="Programa anual, asistencia y vigencias por unidad. Cada capacitación genera su registro de asistencia."
        actions={can(user, 'capacitacion.crear') && <button className="btn btn-primary" onClick={() => setNueva({ tema: '', unidad: visibleUnits[0], fecha: hoy(), horas: 4 })}><Plus size={16} /> Programar</button>} />
      <Card>
        {lista.length === 0 && <Empty>Sin capacitaciones.</Empty>}
        <table className="table">
          <thead><tr><th>Código</th><th>Tema</th><th>Unidad</th><th>Fecha</th><th>Horas</th><th>Asistentes</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td><td><strong>{c.tema}</strong></td><td>{nombreUnidad(db, c.unidad)}</td><td>{fmtFecha(c.fecha)}</td><td>{c.horas}</td><td>{c.asistentes}</td><td><Badge>{c.estado}</Badge></td>
                <td className="actions-cell">{c.estado === 'Programada' && can(user, 'capacitacion.crear') && <button className="btn btn-sm" onClick={() => ejecutar(c)}>Registrar asistencia</button>}<button className="btn btn-sm" onClick={() => setFormato(fmtAsistencia(db, c))}><FileText size={14} /> Formato</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {nueva && (
        <Modal title="Programar capacitación" onClose={() => setNueva(null)}
          footer={<><button className="btn" onClick={() => setNueva(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
          <Field label="Tema"><input value={nueva.tema} onChange={(e) => setNueva({ ...nueva, tema: e.target.value })} /></Field>
          <div className="form-3">
            <Field label="Unidad"><select value={nueva.unidad} onChange={(e) => setNueva({ ...nueva, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Fecha"><input type="date" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} /></Field>
            <Field label="Horas"><input type="number" min="1" value={nueva.horas} onChange={(e) => setNueva({ ...nueva, horas: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
