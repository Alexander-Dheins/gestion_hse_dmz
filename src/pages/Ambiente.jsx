import { useState } from 'react';
import { FileText, Plus, Droplets } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Stat, Modal, Field, Empty } from '../components/ui.jsx';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtResiduos, fmtDerrame } from '../formatos.jsx';

export default function Ambiente() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [tab, setTab] = useState('residuos');
  const [formato, setFormato] = useState(null);
  const [nuevoRes, setNuevoRes] = useState(null);
  const [nuevoDer, setNuevoDer] = useState(null);
  const puede = can(user, 'ambiente.crear');

  const residuos = db.residuos.filter((r) => inScope(r.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const derrames = db.derrames.filter((r) => inScope(r.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const kgPel = residuos.filter((r) => r.tipo === 'Peligroso' && r.medida === 'kg').reduce((s, r) => s + r.cantidad, 0);
  const kgNo = residuos.filter((r) => r.tipo === 'No peligroso' && r.medida === 'kg').reduce((s, r) => s + r.cantidad, 0);
  const litros = residuos.filter((r) => r.medida === 'L').reduce((s, r) => s + r.cantidad, 0);

  const guardarRes = () => {
    update((d) => { d.residuos.push({ ...nuevoRes, id: nextId(d.residuos, 'RS'), cantidad: +nuevoRes.cantidad, fecha: hoy() }); }, 'Residuo registrado');
    setNuevoRes(null);
  };
  const guardarDer = () => {
    const rec = { ...nuevoDer, id: nextId(db.derrames, 'DE'), fecha: hoy(), estado: 'En seguimiento' };
    update((d) => { d.derrames.push(rec); }, 'Derrame reportado · se avisó a la unidad');
    setNuevoDer(null);
    setFormato(fmtDerrame(db, rec));
  };

  return (
    <>
      <PageHeader title="Medio ambiente" subtitle="Residuos, derrames y aspectos ambientales de los trabajos en planta, con sus registros para la unidad." />
      <div className="tabs">
        {[['residuos', 'Residuos'], ['derrames', 'Derrames'], ['aspectos', 'Aspectos e impactos']].map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'residuos' && (
        <>
          <div className="stats">
            <Stat label="Peligrosos" value={`${kgPel.toLocaleString('es-PE')} kg`} tone="warn" hint={`+ ${litros} L de aceite usado`} />
            <Stat label="No peligrosos" value={`${kgNo.toLocaleString('es-PE')} kg`} />
            <Stat label="Registros del periodo" value={residuos.length} />
          </div>
          <Card title="Registro de residuos" actions={<>
            {puede && <button className="btn btn-sm" onClick={() => setNuevoRes({ unidad: visibleUnits[0], tipo: 'Peligroso', residuo: '', cantidad: '', medida: 'kg', contenedor: 'Rojo', disposicion: 'EO-RS autorizada (ficticia)', manifiesto: '' })}><Plus size={14} /> Registrar</button>}
            <button className="btn btn-sm btn-primary" onClick={() => setFormato(fmtResiduos(db, residuos[0]?.unidad || visibleUnits[0]))}><FileText size={14} /> Formato</button>
          </>}>
            {residuos.length === 0 && <Empty>Sin registros.</Empty>}
            <table className="table">
              <thead><tr><th>N.º</th><th>Residuo</th><th>Tipo</th><th>Cantidad</th><th>Contenedor</th><th>Disposición</th><th>Unidad</th><th>Fecha</th></tr></thead>
              <tbody>
                {residuos.map((r) => (
                  <tr key={r.id}><td>{r.id}</td><td><strong>{r.residuo}</strong>{r.manifiesto !== '—' && r.manifiesto && <div className="small muted">Manifiesto {r.manifiesto}</div>}</td><td><Badge tone={r.tipo === 'Peligroso' ? 'warn' : 'ok'}>{r.tipo}</Badge></td><td>{r.cantidad} {r.medida}</td><td>{r.contenedor}</td><td>{r.disposicion}</td><td>{nombreUnidad(db, r.unidad)}</td><td className="nowrap">{fmtFecha(r.fecha)}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'derrames' && (
        <Card title="Derrames reportados" actions={puede && <button className="btn btn-sm btn-danger" onClick={() => setNuevoDer({ unidad: visibleUnits[0], sustancia: '', volumen: '', superficie: '', contencion: '', causa: '' })}><Droplets size={14} /> Reportar derrame</button>}>
          {derrames.length === 0 && <Empty>Sin derrames reportados.</Empty>}
          <table className="table">
            <thead><tr><th>N.º</th><th>Sustancia</th><th>Volumen</th><th>Superficie</th><th>Contención</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {derrames.map((d) => (
                <tr key={d.id}><td>{d.id}<div className="small muted">{fmtFecha(d.fecha)}</div></td><td><strong>{d.sustancia}</strong><div className="small muted">{nombreUnidad(db, d.unidad)}</div></td><td>{d.volumen}</td><td>{d.superficie}</td><td className="small">{d.contencion}</td><td><Badge tone={d.estado === 'Cerrado' ? 'ok' : 'warn'}>{d.estado}</Badge></td>
                  <td><button className="btn btn-sm" onClick={() => setFormato(fmtDerrame(db, d))}><FileText size={14} /> Formato</button></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'aspectos' && (
        <Card title="Matriz de aspectos e impactos ambientales">
          <table className="table">
            <thead><tr><th>Actividad</th><th>Aspecto</th><th>Impacto</th><th>Significancia</th><th>Control</th></tr></thead>
            <tbody>
              {db.aspectos.map((a) => (
                <tr key={a.id}><td><strong>{a.actividad}</strong></td><td>{a.aspecto}</td><td>{a.impacto}</td><td><span className={`risk ${a.significancia === 'Alta' ? 'risk-high' : a.significancia === 'Media' ? 'risk-mid' : 'risk-low'}`}>{a.significancia}</span></td><td className="small">{a.control}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {nuevoRes && (
        <Modal title="Registrar residuo" onClose={() => setNuevoRes(null)}
          footer={<><button className="btn" onClick={() => setNuevoRes(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarRes} disabled={!nuevoRes.residuo || !nuevoRes.cantidad}>Guardar</button></>}>
          <div className="form-2">
            <Field label="Unidad"><select value={nuevoRes.unidad} onChange={(e) => setNuevoRes({ ...nuevoRes, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Tipo"><select value={nuevoRes.tipo} onChange={(e) => setNuevoRes({ ...nuevoRes, tipo: e.target.value, contenedor: e.target.value === 'Peligroso' ? 'Rojo' : 'Verde' })}><option>Peligroso</option><option>No peligroso</option></select></Field>
          </div>
          <Field label="Residuo"><input value={nuevoRes.residuo} onChange={(e) => setNuevoRes({ ...nuevoRes, residuo: e.target.value })} placeholder="Ej.: trapos con grasa" /></Field>
          <div className="form-3">
            <Field label="Cantidad"><input type="number" value={nuevoRes.cantidad} onChange={(e) => setNuevoRes({ ...nuevoRes, cantidad: e.target.value })} /></Field>
            <Field label="Medida"><select value={nuevoRes.medida} onChange={(e) => setNuevoRes({ ...nuevoRes, medida: e.target.value })}><option>kg</option><option>L</option><option>m³</option></select></Field>
            <Field label="Manifiesto"><input value={nuevoRes.manifiesto} onChange={(e) => setNuevoRes({ ...nuevoRes, manifiesto: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {nuevoDer && (
        <Modal title="Reportar derrame" onClose={() => setNuevoDer(null)}
          footer={<><button className="btn" onClick={() => setNuevoDer(null)}>Cancelar</button><button className="btn btn-danger" onClick={guardarDer} disabled={!nuevoDer.sustancia}>Reportar y generar formato</button></>}>
          <div className="form-2">
            <Field label="Unidad"><select value={nuevoDer.unidad} onChange={(e) => setNuevoDer({ ...nuevoDer, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Sustancia"><input value={nuevoDer.sustancia} onChange={(e) => setNuevoDer({ ...nuevoDer, sustancia: e.target.value })} /></Field>
            <Field label="Volumen"><input value={nuevoDer.volumen} onChange={(e) => setNuevoDer({ ...nuevoDer, volumen: e.target.value })} placeholder="Ej.: 5 L" /></Field>
            <Field label="Superficie afectada"><input value={nuevoDer.superficie} onChange={(e) => setNuevoDer({ ...nuevoDer, superficie: e.target.value })} /></Field>
          </div>
          <Field label="Acciones de contención"><textarea rows={2} value={nuevoDer.contencion} onChange={(e) => setNuevoDer({ ...nuevoDer, contencion: e.target.value })} /></Field>
          <Field label="Causa"><input value={nuevoDer.causa} onChange={(e) => setNuevoDer({ ...nuevoDer, causa: e.target.value })} /></Field>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
