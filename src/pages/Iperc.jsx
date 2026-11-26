import { useState } from 'react';
import { Plus, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { useStore, can, nombreUnidad, nombreUsuario, fmtFecha, acreditacion, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtIpercBase, fmtIpercContinuo } from '../formatos.jsx';

const nivel = (p, s) => {
  const v = p * s;
  if (v >= 15) return { v, t: 'Alto', c: 'risk-high' };
  if (v >= 8) return { v, t: 'Medio', c: 'risk-mid' };
  return { v, t: 'Bajo', c: 'risk-low' };
};
const Risk = ({ p, s }) => { const n = nivel(+p, +s); return <span className={`risk ${n.c}`}>{n.v} · {n.t}</span>; };

const PELIGROS_COMUNES = [
  ['Energía eléctrica / mecánica residual', 'Atrapamiento, electrocución'],
  ['Atmósfera interior del molino', 'Asfixia, intoxicación'],
  ['Carga suspendida', 'Aplastamiento'],
  ['Lainas o pernos sueltos', 'Golpe, aplastamiento'],
  ['Chispas y escoria de soldadura', 'Quemaduras, incendio'],
  ['Ruido de herramientas', 'Hipoacusia'],
  ['Trabajo sobre 1.8 m', 'Caída a distinto nivel'],
  ['Superficies con aceite', 'Caída al mismo nivel'],
];

export default function Iperc() {
  const { db, user, inScope, visibleUnits, update, notify } = useStore();
  const [tab, setTab] = useState('continuo');
  const [nuevo, setNuevo] = useState(null);
  const [nuevoBase, setNuevoBase] = useState(null);
  const [formato, setFormato] = useState(null);
  const filas = db.iperc.filter((x) => inScope(x.unidad));
  const registros = db.ipercContinuo.filter((x) => inScope(x.unidad)).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const unidadBase = visibleUnits[0];

  // ----- IPERC continuo -----
  const abrirNuevo = () => {
    const unidad = user.unidad || visibleUnits[0];
    const par = db.paradas.find((p) => p.unidad === unidad && p.estado === 'En curso');
    setNuevo({
      unidad, paradaId: par?.id || '', area: par ? `Planta – ${par.equipo}` : '', tarea: '', hora: new Date().toTimeString().slice(0, 5),
      peligros: [{ peligro: '', riesgo: '', p: 3, s: 3, medidas: '', pr: 1, sr: 3 }],
      trabajadores: user.personalId ? [user.personalId] : [],
    });
  };
  const setP = (i, k, v) => setNuevo({ ...nuevo, peligros: nuevo.peligros.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
  const toggleW = (id) => setNuevo({ ...nuevo, trabajadores: nuevo.trabajadores.includes(id) ? nuevo.trabajadores.filter((x) => x !== id) : [...nuevo.trabajadores, id] });

  const guardarContinuo = () => {
    const peligros = nuevo.peligros.filter((p) => p.peligro.trim());
    if (!nuevo.tarea.trim() || !peligros.length || !nuevo.trabajadores.length) {
      notify('Completa la tarea, al menos un peligro y los trabajadores');
      return;
    }
    const sinControl = peligros.find((p) => nivel(+p.pr, +p.sr).t === 'Alto');
    if (sinControl) { notify(`"${sinControl.peligro}" sigue en riesgo alto: refuerza los controles o pide PETAR`); return; }
    const rec = {
      id: nextId(db.ipercContinuo, 'IC'), unidad: nuevo.unidad, paradaId: nuevo.paradaId || null, fecha: hoy(), hora: nuevo.hora, area: nuevo.area, tarea: nuevo.tarea.trim(),
      peligros: peligros.map((p) => ({ ...p, p: +p.p, s: +p.s, pr: +p.pr, sr: +p.sr })),
      trabajadores: nuevo.trabajadores, supervisor: db.usuarios.find((u) => u.rol === 'supervisor' && u.unidad === nuevo.unidad)?.id || 'u4',
      responsable: user.rol === 'sup_mant' ? user.id : 'u7', estado: user.rol === 'supervisor' ? 'Validado' : 'Pendiente de validación',
    };
    update((d) => { d.ipercContinuo.push(rec); }, `IPERC continuo ${rec.id} registrado`);
    setNuevo(null);
    setFormato(fmtIpercContinuo(db, rec));
  };
  const validar = (r) => update((d) => { d.ipercContinuo.find((x) => x.id === r.id).estado = 'Validado'; }, `${r.id} validado por el supervisor HSE`);

  // ----- IPERC base -----
  const guardarBase = () => {
    if (!nuevoBase.tarea.trim() || !nuevoBase.peligro.trim()) return;
    update((d) => {
      d.iperc.push({ ...nuevoBase, id: 'IP-' + String(d.iperc.length + 1).padStart(2, '0'), p: +nuevoBase.p, s: +nuevoBase.s, pr: +nuevoBase.pr, sr: +nuevoBase.sr });
    }, 'Fila agregada al IPERC base');
    setNuevoBase(null);
  };

  const personalUnidad = nuevo ? db.personal.filter((w) => w.unidad === nuevo.unidad) : [];

  return (
    <>
      <PageHeader title="IPERC" subtitle="Identificación de peligros, evaluación de riesgos y controles. Al registrar, el sistema genera el formato listo para presentar a la unidad minera y en auditorías."
        actions={<>
          {tab === 'continuo' && can(user, 'ipercc.crear') && <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={16} /> Nuevo IPERC continuo</button>}
          {tab === 'base' && can(user, 'iperc.editar') && <button className="btn" onClick={() => setNuevoBase({ unidad: visibleUnits[0], tarea: '', peligro: '', riesgo: '', p: 3, s: 3, control: '', pr: 1, sr: 3 })}><Plus size={16} /> Agregar peligro</button>}
          {tab === 'base' && <button className="btn btn-primary" onClick={() => setFormato(fmtIpercBase(db, unidadBase))}><FileText size={16} /> Generar formato IPERC base</button>}
        </>} />
      <div className="tabs">
        <button className={tab === 'continuo' ? 'active' : ''} onClick={() => setTab('continuo')}>IPERC continuo ({registros.length})</button>
        <button className={tab === 'base' ? 'active' : ''} onClick={() => setTab('base')}>IPERC línea base ({filas.length})</button>
      </div>

      {tab === 'continuo' && (
        <Card>
          {registros.length === 0 && <Empty>Sin registros de IPERC continuo.</Empty>}
          <table className="table">
            <thead><tr><th>N.º</th><th>Tarea</th><th>Unidad / área</th><th>Fecha</th><th>Peligros</th><th>Mayor riesgo residual</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {registros.map((r) => {
                const peor = r.peligros.reduce((m, p) => (p.pr * p.sr > m.pr * m.sr ? p : m), r.peligros[0]);
                return (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>{r.tarea}<div className="muted small">{r.trabajadores.length} trabajadores · resp. {nombreUsuario(db, r.responsable)}</div></td>
                    <td>{nombreUnidad(db, r.unidad)}<div className="muted small">{r.area}</div></td>
                    <td className="nowrap">{fmtFecha(r.fecha)} {r.hora}</td>
                    <td className="center">{r.peligros.length}</td>
                    <td><Risk p={peor.pr} s={peor.sr} /></td>
                    <td><Badge tone={r.estado === 'Validado' ? 'ok' : 'warn'}>{r.estado}</Badge></td>
                    <td className="actions-cell">
                      {r.estado !== 'Validado' && user.rol === 'supervisor' && <button className="btn btn-sm" onClick={() => validar(r)}><CheckCircle2 size={14} /> Validar</button>}
                      <button className="btn btn-sm" onClick={() => setFormato(fmtIpercContinuo(db, r))}><FileText size={14} /> Formato</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'base' && (
        <>
          <div className="legend">
            <span className="risk-low">Bajo 1–7</span><span className="risk-mid">Medio 8–14</span><span className="risk-high">Alto 15–25</span>
          </div>
          <Card>
            {filas.length === 0 && <Empty>No hay IPERC registrado para esta unidad.</Empty>}
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Tarea</th><th>Peligro</th><th>Riesgo</th><th>Inicial</th><th>Controles</th><th>Residual</th></tr></thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.tarea}</strong><div className="muted small">{nombreUnidad(db, f.unidad)}</div></td>
                      <td>{f.peligro}</td><td>{f.riesgo}</td><td><Risk p={f.p} s={f.s} /></td><td className="small">{f.control}</td><td><Risk p={f.pr} s={f.sr} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {nuevo && (
        <Modal wide title="Nuevo IPERC continuo" onClose={() => setNuevo(null)}
          footer={<><span className="muted small grow">Al guardar se genera el formato DMZ-SSO-F-02 para imprimir o enviar a la unidad.</span><button className="btn" onClick={() => setNuevo(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarContinuo}><FileText size={15} /> Guardar y generar formato</button></>}>
          <div className="form-3">
            <Field label="Unidad"><select value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value, paradaId: '', trabajadores: [] })} disabled={!!user.unidad}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Parada">
              <select value={nuevo.paradaId} onChange={(e) => { const p = db.paradas.find((x) => x.id === e.target.value); setNuevo({ ...nuevo, paradaId: e.target.value, area: p ? `Planta – ${p.equipo}` : nuevo.area }); }}>
                <option value="">Sin parada</option>
                {db.paradas.filter((p) => p.unidad === nuevo.unidad && p.estado !== 'Cerrada').map((p) => <option key={p.id} value={p.id}>{p.id} · {p.equipo}</option>)}
              </select>
            </Field>
            <Field label="Hora de inicio"><input type="time" value={nuevo.hora} onChange={(e) => setNuevo({ ...nuevo, hora: e.target.value })} /></Field>
          </div>
          <div className="form-2">
            <Field label="Área / lugar"><input value={nuevo.area} onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })} /></Field>
            <Field label="Tarea a realizar"><input value={nuevo.tarea} onChange={(e) => setNuevo({ ...nuevo, tarea: e.target.value })} placeholder="Ej.: Ajuste de pernos de lainas" /></Field>
          </div>

          <h4 className="h4">Peligros y controles</h4>
          <div className="table-wrap">
            <table className="table compact form-table">
              <thead><tr><th style={{ minWidth: 200 }}>Peligro</th><th style={{ minWidth: 150 }}>Riesgo</th><th>P</th><th>S</th><th>Nivel</th><th style={{ minWidth: 220 }}>Medidas de control</th><th>P</th><th>S</th><th>Residual</th><th /></tr></thead>
              <tbody>
                {nuevo.peligros.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <input list="peligros-comunes" value={p.peligro} onChange={(e) => {
                        const v = e.target.value; const c = PELIGROS_COMUNES.find(([a]) => a === v);
                        setNuevo({ ...nuevo, peligros: nuevo.peligros.map((x, j) => (j === i ? { ...x, peligro: v, riesgo: c && !x.riesgo ? c[1] : x.riesgo } : x)) });
                      }} placeholder="Escribe o elige" />
                    </td>
                    <td><input value={p.riesgo} onChange={(e) => setP(i, 'riesgo', e.target.value)} /></td>
                    <td><select value={p.p} onChange={(e) => setP(i, 'p', e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></td>
                    <td><select value={p.s} onChange={(e) => setP(i, 's', e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></td>
                    <td><Risk p={p.p} s={p.s} /></td>
                    <td><input value={p.medidas} onChange={(e) => setP(i, 'medidas', e.target.value)} placeholder="Eliminar, sustituir, ingeniería, administrativo, EPP" /></td>
                    <td><select value={p.pr} onChange={(e) => setP(i, 'pr', e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></td>
                    <td><select value={p.sr} onChange={(e) => setP(i, 'sr', e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></td>
                    <td><Risk p={p.pr} s={p.sr} /></td>
                    <td>{nuevo.peligros.length > 1 && <button className="icon-btn" onClick={() => setNuevo({ ...nuevo, peligros: nuevo.peligros.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="peligros-comunes">{PELIGROS_COMUNES.map(([a]) => <option key={a} value={a} />)}</datalist>
          <button className="btn btn-sm" onClick={() => setNuevo({ ...nuevo, peligros: [...nuevo.peligros, { peligro: '', riesgo: '', p: 3, s: 3, medidas: '', pr: 1, sr: 3 }] })}><Plus size={14} /> Agregar peligro</button>

          <h4 className="h4">Trabajadores que participan ({nuevo.trabajadores.length})</h4>
          <div className="worker-pick">
            {personalUnidad.map((w) => {
              const bloq = acreditacion(w) === 'bloqueado';
              return (
                <label key={w.id} className={`worker-chip ${nuevo.trabajadores.includes(w.id) ? 'on' : ''} ${bloq ? 'blocked' : ''}`} title={bloq ? 'Bloqueado: documentos vencidos' : ''}>
                  <input type="checkbox" disabled={bloq} checked={nuevo.trabajadores.includes(w.id)} onChange={() => toggleW(w.id)} />
                  {w.nombre.split(' ').slice(0, 2).join(' ')}{bloq ? ' (bloqueado)' : ''}
                </label>
              );
            })}
          </div>
        </Modal>
      )}

      {nuevoBase && (
        <Modal title="Agregar peligro al IPERC base" onClose={() => setNuevoBase(null)}
          footer={<><button className="btn" onClick={() => setNuevoBase(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarBase}>Guardar</button></>}>
          <Field label="Unidad"><select value={nuevoBase.unidad} onChange={(e) => setNuevoBase({ ...nuevoBase, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
          <Field label="Tarea"><input value={nuevoBase.tarea} onChange={(e) => setNuevoBase({ ...nuevoBase, tarea: e.target.value })} /></Field>
          <div className="form-2">
            <Field label="Peligro"><input value={nuevoBase.peligro} onChange={(e) => setNuevoBase({ ...nuevoBase, peligro: e.target.value })} /></Field>
            <Field label="Riesgo"><input value={nuevoBase.riesgo} onChange={(e) => setNuevoBase({ ...nuevoBase, riesgo: e.target.value })} /></Field>
          </div>
          <div className="form-4">
            {[['p', 'Probabilidad'], ['s', 'Severidad'], ['pr', 'Prob. residual'], ['sr', 'Sev. residual']].map(([k, l]) => (
              <Field key={k} label={l}><input type="number" min="1" max="5" value={nuevoBase[k]} onChange={(e) => setNuevoBase({ ...nuevoBase, [k]: e.target.value })} /></Field>
            ))}
          </div>
          <Field label="Controles"><textarea rows={3} value={nuevoBase.control} onChange={(e) => setNuevoBase({ ...nuevoBase, control: e.target.value })} /></Field>
        </Modal>
      )}

      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
