import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtEpp } from '../formatos.jsx';
import { useStore, can, fmtFecha, nombreUnidad, nombrePersonal, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';

const ITEMS = ['Casco con barbiquejo', 'Lentes de seguridad', 'Guantes de impacto', 'Respirador media cara + cartuchos P100', 'Protector auditivo tipo copa', 'Arnés de cuerpo entero', 'Careta de soldar', 'Zapatos de seguridad dieléctricos'];

export default function Epp() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [nueva, setNueva] = useState(null);
  const [formato, setFormato] = useState(null);
  const lista = db.epp.filter((e) => inScope(e.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const guardar = () => {
    update((d) => { d.epp.push({ id: nextId(d.epp, 'EPP'), ...nueva, fecha: hoy(), firmado: false }); }, 'Entrega de EPP registrada, pendiente de firma del trabajador');
    setNueva(null);
  };
  const firmar = (e) => update((d) => { d.epp.find((x) => x.id === e.id).firmado = true; }, 'Entrega firmada');
  return (
    <>
      <PageHeader title="Equipos de protección personal" subtitle="Entregas firmadas por el trabajador y control de renovación."
        actions={<><button className="btn" onClick={() => setFormato(fmtEpp(db, visibleUnits[0]))}><FileText size={16} /> Formato del mes</button>{can(user, 'epp.crear') && <button className="btn btn-primary" onClick={() => { const w = db.personal.find((p) => visibleUnits.includes(p.unidad)); setNueva({ unidad: w?.unidad, personalId: w?.id, item: ITEMS[0] }); }}><Plus size={16} /> Registrar entrega</button>}</>} />
      <Card>
        {lista.length === 0 && <Empty>Sin entregas registradas.</Empty>}
        <table className="table">
          <thead><tr><th>N.º</th><th>Trabajador</th><th>EPP</th><th>Unidad</th><th>Fecha</th><th>Firma</th></tr></thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td><td>{nombrePersonal(db, e.personalId)}</td><td>{e.item}</td><td>{nombreUnidad(db, e.unidad)}</td><td>{fmtFecha(e.fecha)}</td>
                <td>{e.firmado ? <Badge tone="ok">Firmado</Badge> : <button className="btn btn-sm" onClick={() => firmar(e)}>Firmar en tablet</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {nueva && (
        <Modal title="Registrar entrega de EPP" onClose={() => setNueva(null)}
          footer={<><button className="btn" onClick={() => setNueva(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
          <Field label="Trabajador">
            <select value={nueva.personalId} onChange={(e) => { const w = db.personal.find((p) => p.id === e.target.value); setNueva({ ...nueva, personalId: w.id, unidad: w.unidad }); }}>
              {db.personal.filter((p) => visibleUnits.includes(p.unidad)).map((p) => <option key={p.id} value={p.id}>{p.nombre} · {nombreUnidad(db, p.unidad)}</option>)}
            </select>
          </Field>
          <Field label="EPP"><select value={nueva.item} onChange={(e) => setNueva({ ...nueva, item: e.target.value })}>{ITEMS.map((i) => <option key={i}>{i}</option>)}</select></Field>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
