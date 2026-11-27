import { useState } from 'react';
import { Printer, Save } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, acreditacion, hoy } from '../store.jsx';
import { Card, PageHeader, Field, Locked, Badge } from '../components/ui.jsx';
import { TIPOS_PERMISO, UNIDADES } from '../data/seed.js';

export default function Reportes() {
  const { db, user, visibleUnits, update } = useStore();
  const [unidad, setUnidad] = useState(visibleUnits.find((x) => !x.startsWith('T')) || visibleUnits[0]);
  const [fecha, setFecha] = useState(hoy());
  const [obs, setObs] = useState('Sin observaciones adicionales. Se reforzó la charla de 5 minutos sobre línea de fuego.');
  if (!can(user, 'reporte.ver')) return <Locked />;
  const u = db.unidades.find((x) => x.id === unidad) || db.unidades[0];

  const paradas = db.paradas.filter((p) => p.unidad === u.id && p.estado === 'En curso');
  const enPlanta = [...new Set(paradas.flatMap((p) => p.cuadrilla))].map((id) => db.personal.find((w) => w.id === id)).filter(Boolean);
  const permisos = db.permisos.filter((p) => p.unidad === u.id && p.fecha === fecha);
  const insp = db.inspecciones.filter((x) => x.unidad === u.id && x.fecha === fecha);
  const inc = db.incidentes.filter((x) => x.unidad === u.id && x.fecha === fecha);
  const abiertos = db.planes.filter((p) => p.unidad === u.id && p.estado !== 'Cerrado');
  const hhDia = enPlanta.length * 12;

  const guardar = () => {
    const idx = UNIDADES.findIndex((x) => x.id === u.id);
    const folder = db.carpetas.find((c) => c.parentId === (idx >= 0 ? 'u' + (idx + 1) : '') && c.nombre === 'Reportes diarios')
      || db.carpetas.find((c) => c.nombre === 'Reportes diarios' && db.carpetas.find((p) => p.id === c.parentId)?.unidad === u.id);
    if (!folder) return;
    update((d) => {
      d.archivos.push({ id: 'A' + Date.now(), folderId: folder.id, nombre: `${u.formato} Reporte diario HSE ${fecha}.pdf`, kb: 240, autor: user.id, actualizado: hoy(), version: 1 });
    }, `Reporte guardado en ${u.nombre} / Reportes diarios`);
  };

  return (
    <>
      <PageHeader title="Reportes a la unidad" subtitle="El reporte diario HSE se genera solo con lo registrado en el día, en el formato que exige cada unidad."
        actions={<>
          <button className="btn" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
          <button className="btn btn-primary" onClick={guardar}><Save size={16} /> Guardar en repositorio</button>
        </>} />
      <div className="form-3 no-print">
        <Field label="Unidad"><select value={unidad} onChange={(e) => setUnidad(e.target.value)}>{visibleUnits.filter((x) => !x.startsWith('T')).map((x) => <option key={x} value={x}>{nombreUnidad(db, x)}</option>)}</select></Field>
        <Field label="Fecha"><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Formato de la unidad"><input value={u.formato} readOnly /></Field>
      </div>

      <Card className="report">
        <div className="report-head">
          <div>
            <strong>REPORTE DIARIO DE SEGURIDAD Y SALUD OCUPACIONAL</strong>
            <span>{u.nombre} · {u.titular}</span>
          </div>
          <div className="report-code">
            <span>Código: <b>{u.formato}</b></span>
            <span>Fecha: <b>{fmtFecha(fecha)}</b></span>
            <span>Contratista: <b>DMZ (demo)</b></span>
          </div>
        </div>
        <table className="table compact report-kv">
          <tbody>
            <tr><th>Personal en planta</th><td>{enPlanta.length}</td><th>Horas hombre del día</th><td>{hhDia}</td></tr>
            <tr><th>Personal bloqueado retirado</th><td>{enPlanta.filter((w) => acreditacion(w) === 'bloqueado').length}</td><th>Paradas en curso</th><td>{paradas.length}</td></tr>
            <tr><th>Incidentes / accidentes</th><td>{inc.length}</td><th>Hallazgos abiertos</th><td>{abiertos.length}</td></tr>
          </tbody>
        </table>

        <h4 className="h4">Paradas en curso</h4>
        <table className="table compact">
          <thead><tr><th>Código</th><th>Equipo</th><th>Trabajo</th><th>Avance</th></tr></thead>
          <tbody>{paradas.length ? paradas.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.equipo}</td><td>{p.tipo}</td><td>{p.avance}%</td></tr>) : <tr><td colSpan="4" className="muted">Sin paradas en curso</td></tr>}</tbody>
        </table>

        <h4 className="h4">Permisos de alto riesgo del día</h4>
        <table className="table compact">
          <thead><tr><th>N.º</th><th>Tipo</th><th>Tarea</th><th>Estado</th></tr></thead>
          <tbody>{permisos.length ? permisos.map((p) => <tr key={p.id}><td>{p.id}</td><td>{TIPOS_PERMISO[p.tipo]}</td><td>{p.tarea}</td><td><Badge>{p.estado}</Badge></td></tr>) : <tr><td colSpan="4" className="muted">Sin permisos en la fecha</td></tr>}</tbody>
        </table>

        <h4 className="h4">Inspecciones del día</h4>
        <table className="table compact">
          <thead><tr><th>N.º</th><th>Tipo</th><th>Inspector</th><th>Cumplimiento</th><th>Hallazgos</th></tr></thead>
          <tbody>{insp.length ? insp.map((x) => <tr key={x.id}><td>{x.id}</td><td>{x.tipo}</td><td>{nombreUsuario(db, x.inspector)}</td><td>{x.cumplimiento}%</td><td>{x.hallazgos}</td></tr>) : <tr><td colSpan="5" className="muted">Sin inspecciones en la fecha</td></tr>}</tbody>
        </table>

        <h4 className="h4">Incidentes</h4>
        <table className="table compact">
          <tbody>{inc.length ? inc.map((x) => <tr key={x.id}><td>{x.id}</td><td>{x.tipo}</td><td>{x.descripcion}</td></tr>) : <tr><td className="muted">Sin incidentes en la fecha</td></tr>}</tbody>
        </table>

        <h4 className="h4">Observaciones</h4>
        <textarea className="report-obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />

        <div className="report-sign">
          <div><span>Elaborado por</span><strong>{user.nombre}</strong><em>{user.cargo}</em></div>
          <div><span>Revisado por</span><strong>{nombreUsuario(db, db.usuarios.find((x) => x.rol === 'lider' && x.unidad === u.id)?.id)}</strong><em>Líder HSE de la unidad</em></div>
        </div>
      </Card>
    </>
  );
}
