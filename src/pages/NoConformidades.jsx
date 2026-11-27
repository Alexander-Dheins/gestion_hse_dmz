import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Paperclip, Trash2, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty, Stat } from '../components/ui.jsx';
import { FUENTES_NC, TIPOS_NC, ELEMENTOS_SGSST, ANIO } from '../data/seed3.js';
import { estadoNc, estadoAccion, atrasoAccion, hoyIso } from '../lib/sgsst.js';

const TONO = { Cerrado: 'ok', 'En proceso': 'info', Vencido: 'bad', Pendiente: 'warn' };
const TONO_TIPO = { 'No conformidad': 'bad', Observación: 'warn', 'Oportunidad de mejora': 'info' };
const PROCESOS = ['Seguridad y Medio Ambiente', 'Operaciones', 'Logística', 'Gestión del Talento Humano', 'Mantenimiento', 'Administración'];

// Elemento 4.5 del SGSST: no conformidades y solicitudes de acción correctiva (SAC)
export default function NoConformidades() {
  const { db, user, inScope, visibleUnits, update, notify } = useStore();
  const [filtro, setFiltro] = useState('abiertas');
  const [abierta, setAbierta] = useState(null);
  const [nueva, setNueva] = useState(null);
  const [cierre, setCierre] = useState(null);
  const [agregar, setAgregar] = useState(null);
  const hoy = hoyIso();
  const editor = can(user, 'nc.editar');
  const base = db.noConformidades.filter((n) => inScope(n.sede));
  const lista = base.filter((n) => {
    const e = estadoNc(n, hoy);
    if (filtro === 'abiertas') return e !== 'Cerrado';
    if (filtro === 'vencidas') return e === 'Vencido';
    if (filtro === 'cerradas') return e === 'Cerrado';
    return true;
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const acciones = base.flatMap((n) => n.acciones);
  const atrasos = acciones.map((a) => atrasoAccion(a, hoy)).filter((d) => d > 0);
  const elementoNombre = (c) => ELEMENTOS_SGSST.find((e) => e.codigo === c)?.nombre || '';

  const abrirNueva = () => setNueva({ tipo: 'No conformidad', fecha: hoy, fuente: FUENTES_NC[0], proceso: PROCESOS[0], sede: visibleUnits[0], elemento: '4.4', descripcion: '', causa: '', acciones: [{ accion: '', responsable: '', plazo: hoy }] });
  const guardarNueva = () => {
    const anio = nueva.fecha.slice(0, 4);
    const n = db.noConformidades.filter((x) => x.id.endsWith(`-${anio}-SAC`)).length + 1;
    const rec = { ...nueva, id: `${String(n).padStart(2, '0')}-${anio}-SAC`, acciones: nueva.acciones.filter((a) => a.accion.trim()).map((a) => ({ ...a, cierre: null, evidencia: null, avance: 0 })) };
    update((d) => { d.noConformidades.push(rec); }, `${rec.id} registrada · se notificó a los responsables`);
    setNueva(null);
    setAbierta(rec.id);
  };
  const okNueva = nueva && nueva.descripcion.trim().length > 10 && nueva.acciones.some((a) => a.accion.trim() && a.responsable.trim() && a.plazo);

  const cerrarAccion = () => {
    if (!cierre.evidencia) { notify('Adjunta la evidencia para cerrar la acción'); return; }
    update((d) => {
      const a = d.noConformidades.find((x) => x.id === cierre.nc).acciones[cierre.i];
      a.cierre = cierre.fecha; a.evidencia = cierre.evidencia; a.avance = 100;
    }, `Acción ${cierre.i + 1} de ${cierre.nc} cerrada`);
    setCierre(null);
  };

  const exportar = async () => {
    const { default: writeExcelFile } = await import('write-excel-file/browser');
    const cab = ['N°', 'Código', 'Tipo', 'Fecha de identificación', 'Área / Proceso', 'Fuente / Referencia', 'Ubicación', 'Elemento SGSST', 'Descripción del hallazgo', 'Acción correctiva / Plan de acción', 'Responsable', 'Fecha de plazo', 'Estado', 'Fecha de cierre real', '¿Vencido?', 'Días de atraso', 'Evidencia / Observaciones'];
    const filas = [];
    base.forEach((n, i) => n.acciones.forEach((a, j) => {
      const e = estadoAccion(a, hoy);
      filas.push([j ? '' : String(i + 1), j ? '' : n.id, j ? '' : n.tipo, j ? '' : n.fecha, j ? '' : n.proceso, j ? '' : n.fuente, j ? '' : nombreUnidad(db, n.sede), j ? '' : `${n.elemento} ${elementoNombre(n.elemento)}`, j ? '' : n.descripcion, a.accion, a.responsable, a.plazo, e, a.cierre || '', e === 'Vencido' ? 'Sí' : a.cierre && a.cierre > a.plazo ? 'Cerrado fuera de plazo' : 'No', atrasoAccion(a, hoy), a.evidencia || '']);
    }));
    const data = [cab.map((value) => ({ value, fontWeight: 'bold', backgroundColor: '#0E2A4D', color: '#FFFFFF', wrap: true })), ...filas.map((r) => r.map((value) => ({ value: typeof value === 'number' ? value : String(value), type: typeof value === 'number' ? Number : String })))];
    await writeExcelFile(data, { sheet: 'Registro Planes Acción', columns: [5, 14, 16, 13, 22, 18, 16, 20, 50, 50, 22, 12, 12, 13, 12, 10, 40].map((width) => ({ width })) }).toFile(`seguimiento_nc_planes_accion_${hoy}.xlsx`);
  };

  return (
    <>
      <PageHeader title="No conformidades y SAC" subtitle="Solicitudes de acción correctiva de auditorías, inspecciones, investigaciones y revisión por la dirección, con sus planes de acción hasta el cierre con evidencia."
        actions={<>
          <button className="btn" onClick={exportar}><Download size={15} /> Exportar Excel</button>
          {editor && <button className="btn btn-primary" onClick={abrirNueva}><Plus size={16} /> Nueva SAC</button>}
        </>} />
      <div className="stats">
        <Stat label="SAC registradas" value={base.length} hint={`${base.filter((n) => n.tipo === 'No conformidad').length} no conformidades`} />
        <Stat label="Abiertas" value={base.filter((n) => estadoNc(n, hoy) !== 'Cerrado').length} />
        <Stat label="Con acciones vencidas" value={base.filter((n) => estadoNc(n, hoy) === 'Vencido').length} tone={base.some((n) => estadoNc(n, hoy) === 'Vencido') ? 'bad' : ''} />
        <Stat label="Acciones cerradas" value={`${acciones.length ? Math.round((acciones.filter((a) => a.cierre).length / acciones.length) * 100) : 0}%`} hint={`${acciones.filter((a) => a.cierre).length} de ${acciones.length}`} />
        <Stat label="Atraso promedio" value={atrasos.length ? `${Math.round(atrasos.reduce((s, d) => s + d, 0) / atrasos.length)} d` : '0 d'} hint="Acciones vencidas o cerradas fuera de plazo" />
      </div>
      <div className="tabs">
        {[['abiertas', 'Abiertas'], ['vencidas', 'Con acciones vencidas'], ['cerradas', 'Cerradas'], ['todas', 'Todas']].map(([k, l]) => <button key={k} className={filtro === k ? 'active' : ''} onClick={() => setFiltro(k)}>{l}</button>)}
      </div>
      {!lista.length && <Card><Empty>No hay SAC en este filtro.</Empty></Card>}
      {lista.map((n) => {
        const e = estadoNc(n, hoy);
        const ab = abierta === n.id;
        const cerradas = n.acciones.filter((a) => a.cierre).length;
        return (
          <Card key={n.id} className="nc-card">
            <button className="nc-head" onClick={() => setAbierta(ab ? null : n.id)}>
              {ab ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <div className="grow">
                <div className="nc-tit"><strong>{n.id}</strong><Badge tone={TONO_TIPO[n.tipo]}>{n.tipo}</Badge><Badge tone={TONO[e]}>{e}</Badge></div>
                <p>{n.descripcion}</p>
                <span className="muted small">{fmtFecha(n.fecha)} · {n.fuente} · {n.proceso} · {nombreUnidad(db, n.sede)}</span>
              </div>
              <div className="nc-prog"><strong>{cerradas}/{n.acciones.length}</strong><span className="muted small">acciones cerradas</span></div>
            </button>
            {ab && (
              <div className="nc-body">
                <div className="nc-meta">
                  <span>Elemento del SGSST: <Link className="link" to="/sgsst">{n.elemento} · {elementoNombre(n.elemento)}</Link></span>
                  {n.causa && <span>Causa raíz: {n.causa}</span>}
                </div>
                <table className="table compact">
                  <thead><tr><th>#</th><th>Acción correctiva / plan de acción</th><th>Responsable</th><th>Plazo</th><th>Estado</th><th>Cierre real</th><th>Atraso</th><th>Evidencia</th><th /></tr></thead>
                  <tbody>
                    {n.acciones.map((a, i) => {
                      const ea = estadoAccion(a, hoy); const at = atrasoAccion(a, hoy);
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{a.accion}</td>
                          <td>{a.responsable}</td>
                          <td className="nowrap">{fmtFecha(a.plazo)}</td>
                          <td><Badge tone={TONO[ea]}>{ea}</Badge></td>
                          <td className="nowrap">{a.cierre ? fmtFecha(a.cierre) : '—'}</td>
                          <td>{at > 0 ? <span className="cell-err">{at} d</span> : '—'}</td>
                          <td className="small">{a.evidencia ? <span className="evid"><Paperclip size={12} /> {a.evidencia}</span> : '—'}</td>
                          <td>{!a.cierre && editor && <button className="btn btn-sm" onClick={() => setCierre({ nc: n.id, i, fecha: hoy, evidencia: '' })}><CheckCircle2 size={13} /> Cerrar</button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {editor && e !== 'Cerrado' && <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setAgregar({ nc: n.id, accion: '', responsable: '', plazo: hoy })}><Plus size={13} /> Agregar acción</button>}
              </div>
            )}
          </Card>
        );
      })}

      {nueva && (
        <Modal wide title="Nueva solicitud de acción correctiva (SAC)" onClose={() => setNueva(null)}
          footer={<><button className="btn" onClick={() => setNueva(null)}>Cancelar</button><button className="btn btn-primary" disabled={!okNueva} onClick={guardarNueva}>Registrar SAC</button></>}>
          <div className="form-3">
            <Field label="Tipo"><select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}>{TIPOS_NC.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Fecha de identificación"><input type="date" value={nueva.fecha} max={hoy} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} /></Field>
            <Field label="Fuente / referencia"><select value={nueva.fuente} onChange={(e) => setNueva({ ...nueva, fuente: e.target.value })}>{FUENTES_NC.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Área / proceso"><select value={nueva.proceso} onChange={(e) => setNueva({ ...nueva, proceso: e.target.value })}>{PROCESOS.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Ubicación"><select value={nueva.sede} onChange={(e) => setNueva({ ...nueva, sede: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Elemento del SGSST"><select value={nueva.elemento} onChange={(e) => setNueva({ ...nueva, elemento: e.target.value })}>{ELEMENTOS_SGSST.map((el) => <option key={el.codigo} value={el.codigo}>{el.codigo} · {el.nombre}</option>)}</select></Field>
          </div>
          <Field label="Descripción del hallazgo"><textarea rows={3} value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} placeholder="Qué requisito no se cumple y la evidencia encontrada" /></Field>
          <Field label="Causa raíz (opcional)"><input value={nueva.causa} onChange={(e) => setNueva({ ...nueva, causa: e.target.value })} /></Field>
          <span className="lbl-up">Acciones correctivas</span>
          {nueva.acciones.map((a, i) => (
            <div key={i} className="nc-accion">
              <input placeholder="Acción" value={a.accion} onChange={(e) => setNueva({ ...nueva, acciones: nueva.acciones.map((x, j) => (j === i ? { ...x, accion: e.target.value } : x)) })} />
              <input placeholder="Responsable / cargo" value={a.responsable} onChange={(e) => setNueva({ ...nueva, acciones: nueva.acciones.map((x, j) => (j === i ? { ...x, responsable: e.target.value } : x)) })} />
              <input type="date" value={a.plazo} min={nueva.fecha} onChange={(e) => setNueva({ ...nueva, acciones: nueva.acciones.map((x, j) => (j === i ? { ...x, plazo: e.target.value } : x)) })} />
              {nueva.acciones.length > 1 && <button className="icon-btn" aria-label="Quitar acción" onClick={() => setNueva({ ...nueva, acciones: nueva.acciones.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>}
            </div>
          ))}
          <button className="btn btn-sm" onClick={() => setNueva({ ...nueva, acciones: [...nueva.acciones, { accion: '', responsable: '', plazo: hoy }] })}><Plus size={13} /> Otra acción</button>
          <p className="muted small" style={{ marginTop: 10 }}>El código se genera solo con el formato NN-{ANIO}-SAC.</p>
        </Modal>
      )}
      {cierre && (
        <Modal title={`Cerrar acción ${cierre.i + 1} de ${cierre.nc}`} onClose={() => setCierre(null)}
          footer={<><button className="btn" onClick={() => setCierre(null)}>Cancelar</button><button className="btn btn-primary" onClick={cerrarAccion}>Cerrar acción</button></>}>
          <Field label="Fecha de cierre real"><input type="date" value={cierre.fecha} max={hoy} onChange={(e) => setCierre({ ...cierre, fecha: e.target.value })} /></Field>
          <Field label="Evidencia"><input type="file" onChange={(e) => setCierre({ ...cierre, evidencia: e.target.files?.[0]?.name || '' })} /></Field>
          <p className="muted small">En la demo solo se registra el nombre del archivo.</p>
        </Modal>
      )}
      {agregar && (
        <Modal title={`Agregar acción a ${agregar.nc}`} onClose={() => setAgregar(null)}
          footer={<><button className="btn" onClick={() => setAgregar(null)}>Cancelar</button><button className="btn btn-primary" disabled={!agregar.accion.trim() || !agregar.responsable.trim()} onClick={() => {
            update((d) => { d.noConformidades.find((x) => x.id === agregar.nc).acciones.push({ accion: agregar.accion.trim(), responsable: agregar.responsable.trim(), plazo: agregar.plazo, cierre: null, evidencia: null, avance: 0 }); }, 'Acción agregada');
            setAgregar(null);
          }}>Agregar</button></>}>
          <Field label="Acción"><textarea rows={2} value={agregar.accion} onChange={(e) => setAgregar({ ...agregar, accion: e.target.value })} /></Field>
          <div className="form-2">
            <Field label="Responsable"><input value={agregar.responsable} onChange={(e) => setAgregar({ ...agregar, responsable: e.target.value })} /></Field>
            <Field label="Plazo"><input type="date" value={agregar.plazo} min={hoy} onChange={(e) => setAgregar({ ...agregar, plazo: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}
