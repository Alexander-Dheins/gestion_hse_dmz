import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Camera, WifiOff, FileText } from 'lucide-react';
import { FormatoModal } from '../../components/Formato.jsx';
import { fmtInspeccion } from '../../formatos.jsx';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, nextId, hoy } from '../../store.jsx';
import { Badge, Card, Modal, Field, Empty } from '../../components/ui.jsx';
import { CHECKLIST_BASE } from '../../data/seed.js';

const TIPOS = ['Inspección planeada de área', 'Observación de comportamiento', 'Inspección de aparejos de izaje', 'Inspección de EPP', 'Inspección de herramientas eléctricas', 'Inspección de extintores'];

export default function Checklists() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [params, setParams] = useSearchParams();
  const [nueva, setNueva] = useState(null);
  const [formato, setFormato] = useState(null);
  const lista = db.inspecciones.filter((x) => inScope(x.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const responsables = db.usuarios.filter((u) => u.rol !== 'trabajador' && (!u.unidad || visibleUnits.includes(u.unidad)));

  const abrir = () => {
    const unidad = visibleUnits[0];
    setNueva({
      tipo: user.rol === 'trabajador' ? 'Observación de comportamiento' : TIPOS[0], unidad,
      paradaId: db.paradas.find((p) => p.unidad === unidad && p.estado === 'En curso')?.id || '',
      items: CHECKLIST_BASE.map((item) => ({ item, r: 'cumple', obs: '', resp: 'u7' })),
    });
  };
  useEffect(() => {
    if (params.get('nuevo') && can(user, 'inspeccion.crear')) { abrir(); setParams({}, { replace: true }); }
  }, [params]); // eslint-disable-line

  const setItem = (i, k, v) => setNueva({ ...nueva, items: nueva.items.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });

  const guardar = () => {
    const evaluados = nueva.items.filter((x) => x.r !== 'na');
    const ok = evaluados.filter((x) => x.r === 'cumple').length;
    const hallazgos = nueva.items.filter((x) => x.r === 'no');
    const cumplimiento = evaluados.length ? Math.round((ok / evaluados.length) * 100) : 100;
    const id = nextId(db.inspecciones, 'IN');
    const rec = { id, tipo: nueva.tipo, unidad: nueva.unidad, paradaId: nueva.paradaId || null, fecha: hoy(), inspector: user.id, cumplimiento, hallazgos: hallazgos.length, estado: hallazgos.length ? 'Con hallazgos' : 'Conforme', items: nueva.items.map(({ item, r, obs }) => ({ item, r, obs })) };
    const planesNuevos = [];
    hallazgos.forEach((h) => {
      planesNuevos.push({ id: nextId([...db.planes, ...planesNuevos], 'PA'), origen: id, unidad: nueva.unidad, descripcion: `${h.item}${h.obs ? ': ' + h.obs : ''}`, responsable: h.resp, vence: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), estado: 'Abierto' });
    });
    update((d) => {
      d.inspecciones.push(rec);
      d.planes.push(...planesNuevos);
    }, hallazgos.length ? `Inspección registrada · ${hallazgos.length} planes de acción creados` : 'Inspección registrada sin hallazgos');
    setNueva(null);
    setFormato(fmtInspeccion({ ...db, planes: [...db.planes, ...planesNuevos] }, rec));
  };

  return (
    <>
      <div className="tab-intro">
        <p className="muted">Checklists de campo en las unidades mineras y paradas, desde el celular y sin señal. Cada ítem que no cumple crea un plan de acción.</p>
        {can(user, 'inspeccion.crear') && <button className="btn btn-primary" onClick={abrir}><Plus size={16} /> Nueva inspección de campo</button>}
      </div>
      <Card>
        {lista.length === 0 && <Empty>Sin inspecciones registradas.</Empty>}
        <table className="table">
          <thead><tr><th>N.º</th><th>Tipo</th><th>Unidad / parada</th><th>Fecha</th><th>Inspector</th><th>Cumplimiento</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.map((x) => (
              <tr key={x.id}>
                <td><strong>{x.id}</strong></td>
                <td>{x.tipo}</td>
                <td>{nombreUnidad(db, x.unidad)}<div className="muted small">{x.paradaId || 'Sin parada'}</div></td>
                <td className="nowrap">{fmtFecha(x.fecha)}</td>
                <td>{nombreUsuario(db, x.inspector)}</td>
                <td><span className={`pct-chip ${x.cumplimiento >= 90 ? 'ok' : x.cumplimiento >= 80 ? 'warn' : 'bad'}`}>{x.cumplimiento}%</span></td>
                <td><Badge>{x.estado}</Badge>{x.hallazgos > 0 && <span className="small muted"> {x.hallazgos} hallazgos</span>}</td>
                <td><button className="btn btn-sm" onClick={() => setFormato(fmtInspeccion(db, x))}><FileText size={14} /> Formato</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {nueva && (
        <Modal wide title="Nueva inspección" onClose={() => setNueva(null)}
          footer={<><span className="muted small grow"><WifiOff size={14} /> En la app móvil se guarda sin señal y se sincroniza después.</span><button className="btn" onClick={() => setNueva(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><FileText size={15} /> Registrar y generar formato</button></>}>
          <div className="form-3">
            <Field label="Tipo">
              <select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })} disabled={user.rol === 'trabajador'}>
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Unidad">
              <select value={nueva.unidad} onChange={(e) => setNueva({ ...nueva, unidad: e.target.value, paradaId: '' })}>
                {visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}
              </select>
            </Field>
            <Field label="Parada (opcional)">
              <select value={nueva.paradaId} onChange={(e) => setNueva({ ...nueva, paradaId: e.target.value })}>
                <option value="">Sin parada</option>
                {db.paradas.filter((p) => p.unidad === nueva.unidad && p.estado !== 'Cerrada').map((p) => <option key={p.id} value={p.id}>{p.id} · {p.equipo}</option>)}
              </select>
            </Field>
          </div>
          <table className="table compact checklist-table">
            <thead><tr><th>Ítem</th><th>Resultado</th><th>Observación / responsable</th></tr></thead>
            <tbody>
              {nueva.items.map((x, i) => (
                <tr key={i} className={x.r === 'no' ? 'row-bad' : ''}>
                  <td>{x.item}</td>
                  <td className="nowrap">
                    <div className="seg">
                      {[['cumple', 'Cumple'], ['no', 'No cumple'], ['na', 'N/A']].map(([k, l]) => (
                        <button key={k} className={x.r === k ? `on ${k}` : ''} onClick={() => setItem(i, 'r', k)}>{l}</button>
                      ))}
                    </div>
                  </td>
                  <td>
                    {x.r === 'no' && (
                      <div className="inline-form">
                        <input placeholder="Describe el hallazgo" value={x.obs} onChange={(e) => setItem(i, 'obs', e.target.value)} />
                        <select value={x.resp} onChange={(e) => setItem(i, 'resp', e.target.value)}>
                          {responsables.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                        <button className="icon-btn" title="Adjuntar foto (demo)"><Camera size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
