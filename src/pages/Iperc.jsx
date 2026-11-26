import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore, can, nombreUnidad } from '../store.jsx';
import { Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';

const nivel = (p, s) => {
  const v = p * s;
  if (v >= 15) return { v, t: 'Alto', c: 'risk-high' };
  if (v >= 8) return { v, t: 'Medio', c: 'risk-mid' };
  return { v, t: 'Bajo', c: 'risk-low' };
};

export default function Iperc() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [nuevo, setNuevo] = useState(null);
  const filas = db.iperc.filter((x) => inScope(x.unidad));

  const guardar = () => {
    if (!nuevo.tarea.trim() || !nuevo.peligro.trim()) return;
    update((d) => {
      d.iperc.push({ ...nuevo, id: 'IP-' + String(d.iperc.length + 1).padStart(2, '0'), p: +nuevo.p, s: +nuevo.s, pr: +nuevo.pr, sr: +nuevo.sr });
    }, 'Fila agregada al IPERC');
    setNuevo(null);
  };

  return (
    <>
      <PageHeader title="IPERC" subtitle="Identificación de peligros, evaluación de riesgos y controles. Nivel = probabilidad × severidad (1 a 25)."
        actions={can(user, 'iperc.editar') && <button className="btn btn-primary" onClick={() => setNuevo({ unidad: visibleUnits[0], tarea: '', peligro: '', riesgo: '', p: 3, s: 3, control: '', pr: 1, sr: 3 })}><Plus size={16} /> Agregar peligro</button>} />
      <div className="legend">
        <span className="risk-low">Bajo 1–7</span><span className="risk-mid">Medio 8–14</span><span className="risk-high">Alto 15–25</span>
      </div>
      <Card>
        {filas.length === 0 && <Empty>No hay IPERC registrado para esta unidad.</Empty>}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Tarea</th><th>Peligro</th><th>Riesgo</th><th>Inicial</th><th>Controles</th><th>Residual</th></tr></thead>
            <tbody>
              {filas.map((f) => {
                const a = nivel(f.p, f.s); const b = nivel(f.pr, f.sr);
                return (
                  <tr key={f.id}>
                    <td><strong>{f.tarea}</strong><div className="muted small">{nombreUnidad(db, f.unidad)}</div></td>
                    <td>{f.peligro}</td>
                    <td>{f.riesgo}</td>
                    <td><span className={`risk ${a.c}`}>{a.v} · {a.t}</span></td>
                    <td className="small">{f.control}</td>
                    <td><span className={`risk ${b.c}`}>{b.v} · {b.t}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {nuevo && (
        <Modal title="Agregar peligro al IPERC" onClose={() => setNuevo(null)}
          footer={<><button className="btn" onClick={() => setNuevo(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
          <Field label="Unidad"><select value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
          <Field label="Tarea"><input value={nuevo.tarea} onChange={(e) => setNuevo({ ...nuevo, tarea: e.target.value })} /></Field>
          <div className="form-2">
            <Field label="Peligro"><input value={nuevo.peligro} onChange={(e) => setNuevo({ ...nuevo, peligro: e.target.value })} /></Field>
            <Field label="Riesgo"><input value={nuevo.riesgo} onChange={(e) => setNuevo({ ...nuevo, riesgo: e.target.value })} /></Field>
          </div>
          <div className="form-4">
            <Field label="Probabilidad"><input type="number" min="1" max="5" value={nuevo.p} onChange={(e) => setNuevo({ ...nuevo, p: e.target.value })} /></Field>
            <Field label="Severidad"><input type="number" min="1" max="5" value={nuevo.s} onChange={(e) => setNuevo({ ...nuevo, s: e.target.value })} /></Field>
            <Field label="Prob. residual"><input type="number" min="1" max="5" value={nuevo.pr} onChange={(e) => setNuevo({ ...nuevo, pr: e.target.value })} /></Field>
            <Field label="Sev. residual"><input type="number" min="1" max="5" value={nuevo.sr} onChange={(e) => setNuevo({ ...nuevo, sr: e.target.value })} /></Field>
          </div>
          <Field label="Controles"><textarea rows={3} value={nuevo.control} onChange={(e) => setNuevo({ ...nuevo, control: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}
