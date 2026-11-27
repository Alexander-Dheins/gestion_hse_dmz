import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Paperclip, Building2, Factory } from 'lucide-react';
import { useStore, can } from '../store.jsx';
import { Card, PageHeader, Badge, Empty, Progress } from '../components/ui.jsx';
import { PROCESOS_SGSST, ELEMENTOS_SGSST, SITUACIONES } from '../data/seed3.js';
import { NAV } from '../components/Layout.jsx';

const TONO = { Validado: 'ok', 'Existente (validar)': 'info', 'Por verificar si existe': 'warn', 'Por crear': 'bad' };
const etiquetaModulo = (ruta) => NAV.flatMap((g) => g.items).find((i) => i.to === ruta)?.label || ruta;

// Arquitectura documental del SGSST de DIMARZA: proceso → elemento → documento → ámbito (talleres y UM)
export default function Sgsst() {
  const { db, user, update } = useStore();
  const [proc, setProc] = useState(null);
  const [elem, setElem] = useState(null);
  const [q, setQ] = useState('');
  const [sit, setSit] = useState('');
  const editor = can(user, 'sgsst.editar');
  const docs = db.sgsstDocs;
  const cuenta = (s, lista = docs) => lista.filter((d) => d.situacion === s).length;
  const avanceEl = (codigo) => {
    const l = docs.filter((d) => d.elemento === codigo);
    return l.length ? Math.round((l.filter((d) => d.situacion === 'Validado').length / l.length) * 100) : 0;
  };
  const lista = docs.filter((d) => (!elem || d.elemento === elem) && (!proc || d.elemento.startsWith(`${proc}.`)) && (!sit || d.situacion === sit)
    && (!q || `${d.documento} ${d.tipo} ${d.aplicacion}`.toLowerCase().includes(q.toLowerCase())));
  const elSel = ELEMENTOS_SGSST.find((e) => e.codigo === elem);

  const setSituacion = (id, v) => update((d) => { d.sgsstDocs.find((x) => x.id === id).situacion = v; }, 'Situación del documento actualizada');
  const vincular = (id, nombre) => nombre && update((d) => { d.sgsstDocs.find((x) => x.id === id).archivo = nombre; }, 'Documento vinculado');

  return (
    <>
      <PageHeader title="Sistema de gestión (SGSST)" subtitle="Estructura documental del SGSST de DIMARZA: 5 procesos, 27 elementos y 55 documentos, con su aplicación en talleres y unidades mineras y el módulo del sistema que los soporta." />
      <div className="stats">
        <div className="stat"><span className="stat-label">Documentos del SGSST</span><strong className="stat-value">{docs.length}</strong><span className="stat-hint">{ELEMENTOS_SGSST.length} elementos en 5 procesos</span></div>
        {SITUACIONES.slice().reverse().map((s) => (
          <button key={s} className={`stat stat-btn ${sit === s ? 'on' : ''}`} onClick={() => setSit(sit === s ? '' : s)}>
            <span className="stat-label">{s}</span><strong className={`stat-value ${TONO[s]}-t`}>{cuenta(s)}</strong><span className="stat-hint">{Math.round((cuenta(s) / docs.length) * 100)}% del inventario · {sit === s ? 'quitar filtro' : 'filtrar'}</span>
          </button>
        ))}
      </div>

      <div className="sg-mapa">
        {PROCESOS_SGSST.map((p) => (
          <div key={p.id} className={`sg-proc ${proc === p.id ? 'on' : ''}`}>
            <button className="sg-proc-h" onClick={() => { setProc(proc === p.id ? null : p.id); setElem(null); }}>
              <span>Proceso {p.id}</span><strong>{p.nombre}</strong>
            </button>
            <div className="sg-els">
              {ELEMENTOS_SGSST.filter((e) => e.proceso === p.id).map((e) => (
                <button key={e.codigo} className={`sg-el ${elem === e.codigo ? 'on' : ''}`} onClick={() => { setElem(elem === e.codigo ? null : e.codigo); setProc(null); }}>
                  <b>{e.codigo}</b><span>{e.nombre}</span><em style={{ '--v': `${avanceEl(e.codigo)}%` }} title={`${avanceEl(e.codigo)}% de documentos validados`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="muted small">Jerarquía: SGSST DIMARZA → proceso → elemento → documento → ámbito de aplicación (talleres y UM). La barra de cada elemento muestra el % de sus documentos validados.</p>

      {elSel && (
        <div className="sg-elinfo">
          <div><span className="muted small">Elemento {elSel.codigo}</span><strong>{elSel.nombre}</strong></div>
          <span className="grow" />
          <Link to={elSel.modulo} className="btn btn-primary">Ir al módulo: {elSel.modulo === '/sgsst' ? 'este mapa' : etiquetaModulo(elSel.modulo)} <ArrowRight size={15} /></Link>
        </div>
      )}

      <Card title={elSel ? `Documentos del elemento ${elSel.codigo}` : proc ? `Documentos del proceso ${proc}` : 'Inventario documental'} actions={
        <div className="search"><Search size={15} /><input placeholder="Buscar documento" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      }>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Elemento</th><th>Documento a preparar</th><th>Tipo</th><th>Talleres y UM: aplicación</th><th>Situación</th><th>Archivo</th><th>Módulo</th></tr></thead>
            <tbody>
              {lista.map((d) => {
                const el = ELEMENTOS_SGSST.find((e) => e.codigo === d.elemento);
                return (
                  <tr key={d.id}>
                    <td className="nowrap"><strong>{d.elemento}</strong><div className="muted small">{el?.nombre}</div></td>
                    <td><strong>{d.documento}</strong></td>
                    <td><Badge tone="muted">{d.tipo}</Badge></td>
                    <td className="small"><span className="sg-ambito">{/UM|unidad|cliente/i.test(d.aplicacion) ? <Building2 size={13} /> : <Factory size={13} />}{d.aplicacion}</span></td>
                    <td>{editor
                      ? <select className={`sel-sit ${TONO[d.situacion]}`} value={d.situacion} onChange={(e) => setSituacion(d.id, e.target.value)} aria-label={`Situación de ${d.documento}`}>{SITUACIONES.map((s) => <option key={s}>{s}</option>)}</select>
                      : <Badge tone={TONO[d.situacion]}>{d.situacion}</Badge>}</td>
                    <td className="small">{d.archivo ? <span className="evid"><Paperclip size={12} /> {d.archivo}</span> : editor ? <label className="link sg-sub">Vincular<input type="file" hidden onChange={(e) => vincular(d.id, e.target.files?.[0]?.name)} /></label> : '—'}</td>
                    <td className="small"><Link className="link" to={el?.modulo || '/'}>{el?.modulo === '/sgsst' ? '—' : etiquetaModulo(el?.modulo)}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!lista.length && <Empty>No hay documentos con este filtro.</Empty>}
        </div>
      </Card>

      <Card title="Avance documental por proceso">
        {PROCESOS_SGSST.map((p) => {
          const l = docs.filter((d) => d.elemento.startsWith(`${p.id}.`));
          const val = cuenta('Validado', l); const ex = cuenta('Existente (validar)', l);
          return (
            <div key={p.id} className="sg-avance">
              <span><strong>{p.id}.</strong> {p.nombre}</span>
              <Progress value={Math.round(((val + ex * 0.5) / l.length) * 100)} />
              <span className="muted small">{l.length} docs · {val} validados · {ex} por validar · {cuenta('Por verificar si existe', l)} por verificar · {cuenta('Por crear', l)} por crear</span>
            </div>
          );
        })}
        <p className="muted small">«Situación» es el estado del levantamiento documental (de la pestaña «Paquete documental»), no el estado de aprobación del documento. El avance cuenta los validados al 100 % y los existentes por validar al 50 %.</p>
      </Card>
    </>
  );
}
