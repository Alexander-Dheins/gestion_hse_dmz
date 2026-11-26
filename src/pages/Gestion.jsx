import { useState } from 'react';
import { FileText, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Stat, Modal, Field, Empty } from '../components/ui.jsx';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtActa, fmtAuditoria, fmtCambio } from '../formatos.jsx';

export default function Gestion() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [tab, setTab] = useState('passo');
  const [formato, setFormato] = useState(null);
  const [acta, setActa] = useState(null);
  const [cambio, setCambio] = useState(null);
  const editor = can(user, 'gestion.editar');

  const metaT = db.passo.reduce((s, x) => s + x.meta, 0);
  const ejeT = db.passo.reduce((s, x) => s + x.ejecutado, 0);
  const avance = Math.round((ejeT / metaT) * 100);
  const req = db.requisitos;
  const cumpleReq = Math.round(((req.filter((r) => r.cumple === 'Sí').length + req.filter((r) => r.cumple === 'Parcial').length * 0.5) / req.length) * 100);
  const auditorias = db.auditorias.filter((a) => inScope(a.unidad));
  const cambios = db.cambios.filter((c) => inScope(c.unidad));

  const guardarActa = () => {
    const rec = { id: nextId(db.actas, 'ACTA'), sesion: acta.sesion, fecha: hoy(), lugar: acta.lugar, asistentes: acta.asistentes, agenda: acta.agenda.split('\n').map((x) => x.trim()).filter(Boolean), acuerdos: acta.acuerdos.filter((a) => a.acuerdo.trim()) };
    update((d) => { d.actas.unshift(rec); }, `Acta ${rec.id} registrada`);
    setActa(null);
    setFormato(fmtActa(db, rec));
  };
  const guardarCambio = () => {
    const rec = { ...cambio, id: nextId(db.cambios, 'GC'), fecha: hoy(), estado: 'En evaluación', aprobador: null };
    update((d) => { d.cambios.push(rec); }, 'Solicitud de cambio registrada');
    setCambio(null);
  };
  const aprobarCambio = (c) => update((d) => { const x = d.cambios.find((y) => y.id === c.id); x.estado = 'Aprobado'; x.aprobador = user.id; }, `${c.id} aprobado`);

  return (
    <>
      <PageHeader title="PASSO, comité y auditorías" subtitle="La gestión del sistema: programa anual, comité SSO, requisitos legales, auditorías y gestión del cambio." />
      <div className="tabs">
        {[['passo', 'Programa anual (PASSO)'], ['comite', 'Comité SSO'], ['legal', 'Requisitos legales'], ['auditorias', 'Auditorías'], ['cambio', 'Gestión del cambio']].map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'passo' && (
        <>
          <div className="stats">
            <Stat label="Avance del PASSO 2026" value={`${avance}%`} tone={avance >= 85 ? 'ok' : 'warn'} hint={`${ejeT} de ${metaT} actividades`} />
            <Stat label="Actividades bajo 80 %" value={db.passo.filter((x) => x.ejecutado / x.meta < 0.8).length} tone="warn" />
          </div>
          <Card title="Avance por actividad">
            <div className="bars">
              {db.passo.map((x) => {
                const pct = Math.round((x.ejecutado / x.meta) * 100);
                return (
                  <div className="bar-row passo" key={x.id}>
                    <span className="bar-label">{x.actividad}<em className="muted small"> · {x.responsable}</em></span>
                    <div className="bar-track"><div className={`bar-fill ${pct < 80 ? 'warn' : 'ok'}`} style={{ width: `${pct}%` }} /></div>
                    <span className="bar-val">{pct}%</span>
                    <span className="muted small bar-extra">{x.ejecutado} / {x.meta}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {tab === 'comite' && (
        <Card title="Actas del comité" actions={editor && <button className="btn btn-sm btn-primary" onClick={() => setActa({ sesion: `Ordinaria N.° ${db.actas.length + 10}`, lugar: 'Sala de reuniones – Lima', asistentes: ['u1', 'u6'], agenda: 'Lectura del acta anterior\nIndicadores del mes', acuerdos: [{ acuerdo: '', responsable: 'u2', plazo: hoy() }] })}><Plus size={14} /> Nueva acta</button>}>
          {db.actas.map((a) => (
            <div key={a.id} className="row-link static">
              <div className="grow"><strong>{a.id} · {a.sesion}</strong><span className="muted small">{fmtFecha(a.fecha)} · {a.asistentes.length} asistentes · {a.acuerdos.length} acuerdos</span></div>
              <button className="btn btn-sm" onClick={() => setFormato(fmtActa(db, a))}><FileText size={14} /> Acta</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'legal' && (
        <>
          <div className="stats"><Stat label="Cumplimiento legal" value={`${cumpleReq}%`} tone={cumpleReq >= 90 ? 'ok' : 'warn'} hint="Sí = 1 · Parcial = 0.5" /></div>
          <Card title="Matriz de requisitos legales y de las unidades">
            <table className="table">
              <thead><tr><th>Norma</th><th>Artículo / tema</th><th>Requisito</th><th>Cumple</th><th>Evidencia</th></tr></thead>
              <tbody>{req.map((r) => <tr key={r.id}><td className="nowrap"><strong>{r.norma}</strong></td><td>{r.articulo}</td><td>{r.requisito}</td><td><Badge tone={r.cumple === 'Sí' ? 'ok' : r.cumple === 'Parcial' ? 'warn' : 'bad'}>{r.cumple}</Badge></td><td className="small">{r.evidencia}</td></tr>)}</tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'auditorias' && (
        <Card title="Auditorías">
          {auditorias.length === 0 && <Empty>Sin auditorías en esta unidad.</Empty>}
          <table className="table">
            <thead><tr><th>Código</th><th>Tipo</th><th>Unidad</th><th>Alcance</th><th>Resultado</th><th>Hallazgos abiertos</th><th /></tr></thead>
            <tbody>
              {auditorias.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.id}</strong><div className="small muted">{fmtFecha(a.fecha)}</div></td>
                  <td><Badge tone={a.tipo === 'Interna' ? 'info' : 'warn'}>{a.tipo}</Badge></td>
                  <td>{nombreUnidad(db, a.unidad)}</td><td className="small">{a.alcance}</td>
                  <td><span className={`pct-chip ${a.resultado >= 90 ? 'ok' : a.resultado >= 80 ? 'warn' : 'bad'}`}>{a.resultado}%</span></td>
                  <td className="center">{a.hallazgos.filter((h) => h.estado !== 'Cerrado').length} / {a.hallazgos.length}</td>
                  <td><button className="btn btn-sm" onClick={() => setFormato(fmtAuditoria(db, a))}><FileText size={14} /> Informe</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'cambio' && (
        <Card title="Solicitudes de gestión del cambio" actions={['lider', 'sup_mant', 'supervisor', 'gerente'].includes(user.rol) && <button className="btn btn-sm btn-primary" onClick={() => setCambio({ unidad: visibleUnits[0], cambio: '', tipo: 'Método', riesgos: '' })}><Plus size={14} /> Nueva solicitud</button>}>
          {cambios.length === 0 && <Empty>Sin solicitudes.</Empty>}
          <table className="table">
            <thead><tr><th>N.º</th><th>Cambio</th><th>Tipo</th><th>Riesgos</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {cambios.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}<div className="small muted">{fmtFecha(c.fecha)}</div></td><td><strong>{c.cambio}</strong><div className="small muted">{nombreUnidad(db, c.unidad)}</div></td><td>{c.tipo}</td><td className="small">{c.riesgos}</td>
                  <td><Badge tone={c.estado === 'Aprobado' ? 'ok' : 'warn'}>{c.estado}</Badge>{c.aprobador && <div className="small muted">{nombreUsuario(db, c.aprobador)}</div>}</td>
                  <td className="actions-cell">
                    {c.estado !== 'Aprobado' && ['lider', 'gerente'].includes(user.rol) && <button className="btn btn-sm" onClick={() => aprobarCambio(c)}><CheckCircle2 size={14} /> Aprobar</button>}
                    <button className="btn btn-sm" onClick={() => setFormato(fmtCambio(db, c))}><FileText size={14} /> Formato</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {acta && (
        <Modal wide title="Nueva acta del comité SSO" onClose={() => setActa(null)}
          footer={<><button className="btn" onClick={() => setActa(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarActa}><FileText size={15} /> Guardar y generar acta</button></>}>
          <div className="form-2">
            <Field label="Sesión"><input value={acta.sesion} onChange={(e) => setActa({ ...acta, sesion: e.target.value })} /></Field>
            <Field label="Lugar"><input value={acta.lugar} onChange={(e) => setActa({ ...acta, lugar: e.target.value })} /></Field>
          </div>
          <h4 className="h4">Asistentes</h4>
          <div className="worker-pick">
            {db.usuarios.filter((u) => u.rol !== 'trabajador').map((u) => (
              <label key={u.id} className={`worker-chip ${acta.asistentes.includes(u.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={acta.asistentes.includes(u.id)} onChange={() => setActa({ ...acta, asistentes: acta.asistentes.includes(u.id) ? acta.asistentes.filter((x) => x !== u.id) : [...acta.asistentes, u.id] })} />{u.nombre}
              </label>
            ))}
          </div>
          <Field label="Agenda (un punto por línea)"><textarea rows={3} value={acta.agenda} onChange={(e) => setActa({ ...acta, agenda: e.target.value })} /></Field>
          <h4 className="h4">Acuerdos</h4>
          {acta.acuerdos.map((a, i) => (
            <div key={i} className="inline-form">
              <input value={a.acuerdo} placeholder="Acuerdo" onChange={(e) => setActa({ ...acta, acuerdos: acta.acuerdos.map((x, j) => (j === i ? { ...x, acuerdo: e.target.value } : x)) })} />
              <select value={a.responsable} onChange={(e) => setActa({ ...acta, acuerdos: acta.acuerdos.map((x, j) => (j === i ? { ...x, responsable: e.target.value } : x)) })}>{db.usuarios.filter((u) => u.rol !== 'trabajador').map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select>
              <input type="date" style={{ flex: '0 0 150px', minWidth: 0 }} value={a.plazo} onChange={(e) => setActa({ ...acta, acuerdos: acta.acuerdos.map((x, j) => (j === i ? { ...x, plazo: e.target.value } : x)) })} />
              {acta.acuerdos.length > 1 && <button className="icon-btn" onClick={() => setActa({ ...acta, acuerdos: acta.acuerdos.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>}
            </div>
          ))}
          <button className="btn btn-sm" onClick={() => setActa({ ...acta, acuerdos: [...acta.acuerdos, { acuerdo: '', responsable: 'u2', plazo: hoy() }] })}><Plus size={14} /> Agregar acuerdo</button>
        </Modal>
      )}
      {cambio && (
        <Modal title="Solicitud de gestión del cambio" onClose={() => setCambio(null)}
          footer={<><button className="btn" onClick={() => setCambio(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarCambio} disabled={!cambio.cambio}>Enviar</button></>}>
          <div className="form-2">
            <Field label="Unidad"><select value={cambio.unidad} onChange={(e) => setCambio({ ...cambio, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Tipo"><select value={cambio.tipo} onChange={(e) => setCambio({ ...cambio, tipo: e.target.value })}>{['Método', 'Equipo', 'Material', 'Organización'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          </div>
          <Field label="¿Qué se quiere cambiar?"><textarea rows={2} value={cambio.cambio} onChange={(e) => setCambio({ ...cambio, cambio: e.target.value })} /></Field>
          <Field label="Riesgos que introduce"><textarea rows={2} value={cambio.riesgos} onChange={(e) => setCambio({ ...cambio, riesgos: e.target.value })} /></Field>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
