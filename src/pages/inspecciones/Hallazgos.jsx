import { useMemo, useState } from 'react';
import { Plus, Search, Download, Upload, Repeat, AlertTriangle } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad } from '../../store.jsx';
import { Badge, Card, Modal, Field, Empty, Progress, Stat } from '../../components/ui.jsx';
import { ACTOS, CONDICIONES } from '../../data/catalogos.js';
import { RIESGOS, TIPOS_INSPECCION, MESES, ANIO } from '../../data/seed3.js';
import { estadoHallazgo, diasRetraso, rangoAntiguedad, recurrencias, kpisHallazgos, TONO_HZ, ESTADOS_HZ, hoyIso, mesDe } from '../../lib/sgsst.js';
import ImportarHallazgos from './ImportarHallazgos.jsx';
import { SelectorAdjuntos, ListaAdjuntos, EvidenciasModal, BotonAdjuntos, subirAdjuntos, registrarAdjuntos } from '../../components/Adjuntos.jsx';

const TONO_RIESGO = { Alto: 'bad', Medio: 'warn', Bajo: 'muted' };
const plazoSugerido = (fecha, riesgo) => {
  const d = new Date(fecha + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + (riesgo === 'Alto' ? 3 : riesgo === 'Medio' ? 7 : 15));
  return d.toISOString().slice(0, 10);
};

export default function Hallazgos() {
  const { db, user, inScope, visibleUnits, update, notify } = useStore();
  const [estado, setEstado] = useState('todos');
  const [q, setQ] = useState('');
  const [sede, setSede] = useState('');
  const [riesgo, setRiesgo] = useState('');
  const [clas, setClas] = useState('');
  const [mes, setMes] = useState('');
  const [nuevo, setNuevo] = useState(null);
  const [edit, setEdit] = useState(null);
  const [importar, setImportar] = useState(false);
  const [archivosNuevo, setArchivosNuevo] = useState([]);
  const [archivosEdit, setArchivosEdit] = useState([]);
  const [evid, setEvid] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const hoy = hoyIso();

  const base = useMemo(() => db.hallazgos.filter((h) => inScope(h.sede)), [db.hallazgos, inScope]);
  const esRec = useMemo(() => recurrencias(base), [base]);
  const k = kpisHallazgos(base, hoy);
  const lista = base.filter((h) => {
    const e = estadoHallazgo(h, hoy);
    if (estado === 'abiertos' && e === 'Cerrado') return false;
    if (estado !== 'todos' && estado !== 'abiertos' && e !== estado) return false;
    if (sede && h.sede !== sede) return false;
    if (riesgo && h.riesgo !== riesgo) return false;
    if (clas && h.clasificacion !== clas) return false;
    if (mes !== '' && mesDe(h.fecha) !== Number(mes)) return false;
    if (q && !`${h.id} ${h.descripcion} ${h.accion} ${h.responsable} ${h.subtipo} ${h.area}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  const sedesH = [...new Set(base.map((h) => h.sede))];
  const editor = can(user, 'hallazgo.gestionar');

  const abrir = () => {
    const s = visibleUnits.find((u) => u.startsWith('T')) || visibleUnits[0];
    setNuevo({ fecha: hoy, sede: s, area: '', tipoInspeccion: user.rol === 'trabajador' ? 'Inopinada' : 'Planeada', inspector: user.nombre, clasificacion: 'Condición', subtipo: CONDICIONES[0], descripcion: '', riesgo: 'Medio', accion: '', responsable: '', plazo: plazoSugerido(hoy, 'Medio') });
  };
  const guardar = async () => {
    const n = db.hallazgos.filter((h) => h.id.startsWith(`HZ-${ANIO}`)).length + 1;
    const rec = { ...nuevo, id: `HZ-${ANIO}-${String(n).padStart(3, '0')}`, avance: 0, fechaCierre: null, evidencia: null };
    setGuardando(true);
    const items = await subirAdjuntos(archivosNuevo, user);
    update((d) => { d.hallazgos.push({ ...rec, adjuntos: registrarAdjuntos(d, 'hallazgos', rec.id, items) }); }, `Hallazgo ${rec.id} registrado${items.length ? ` con ${items.length} archivo(s)` : ''}${nuevo.riesgo === 'Alto' ? ' · alerta de riesgo alto enviada al líder HSE' : ''}`);
    setGuardando(false);
    setArchivosNuevo([]);
    setNuevo(null);
  };
  const okNuevo = nuevo && nuevo.descripcion.trim().length > 5 && nuevo.fecha <= hoy && nuevo.plazo >= nuevo.fecha && (user.rol === 'trabajador' || nuevo.responsable.trim());

  const guardarAvance = async () => {
    const tieneEvidencia = edit.adjuntos?.length || edit.evidencia || archivosEdit.length;
    if (edit.avance >= 100 && !tieneEvidencia) { notify('Para cerrar el hallazgo adjunta la evidencia'); return; }
    setGuardando(true);
    const items = await subirAdjuntos(archivosEdit, user);
    update((d) => {
      const h = d.hallazgos.find((x) => x.id === edit.id);
      Object.assign(h, { accion: edit.accion, responsable: edit.responsable, plazo: edit.plazo, avance: Number(edit.avance), fechaCierre: Number(edit.avance) >= 100 ? (h.fechaCierre || hoy) : null });
      h.adjuntos = [...(h.adjuntos || []), ...registrarAdjuntos(d, 'hallazgos', h.id, items)];
    }, Number(edit.avance) >= 100 ? `Hallazgo ${edit.id} cerrado` : `Avance de ${edit.id} actualizado`);
    setGuardando(false);
    setArchivosEdit([]);
    setEdit(null);
  };

  const exportar = async () => {
    const { default: writeExcelFile } = await import('write-excel-file/browser');
    const cab = ['Mes', 'N°', 'Fecha', 'Tipo de inspección', 'Ubicación', 'Ubicación detallada', 'Descripción del hallazgo', 'Nivel de riesgo', 'Plan de acción', 'Responsable', 'Fecha de plazo', 'Días de retraso', 'Rango de antigüedad', '% de avance', 'Status', 'Clasificación', 'Tipo', 'Reincidente'];
    const filas = lista.map((h) => [MESES[mesDe(h.fecha)], h.id, h.fecha, h.tipoInspeccion, nombreUnidad(db, h.sede), h.area, h.descripcion, h.riesgo, h.accion, h.responsable, h.plazo, diasRetraso(h, hoy), rangoAntiguedad(h, hoy), h.avance / 100, estadoHallazgo(h, hoy), h.clasificacion === 'Acto' ? 'Acto subestándar' : 'Condición subestándar', h.subtipo, esRec(h) ? 'Sí' : 'No']);
    const data = [cab.map((value) => ({ value, fontWeight: 'bold', backgroundColor: '#0E2A4D', color: '#FFFFFF', wrap: true })), ...filas.map((r) => r.map((value, i) => ({ value, type: i === 13 ? Number : i === 11 ? Number : String, format: i === 13 ? '0%' : undefined })))];
    await writeExcelFile(data, { columns: [10, 13, 11, 13, 16, 20, 50, 10, 46, 18, 12, 10, 12, 9, 22, 20, 36, 10].map((width) => ({ width })), sheet: 'Análisis de inspecciones' }).toFile(`analisis_inspecciones_${hoy}.xlsx`);
  };

  return (
    <>
      <div className="stats">
        <Stat label="Hallazgos registrados" value={k.total} hint={`${k.actos} actos · ${k.condiciones} condiciones`} />
        <Stat label="Cerrados" value={`${Math.round(k.pctCerrados * 100)}%`} tone={k.pctCerrados >= 0.8 ? 'ok' : 'warn'} hint={`${k.cerrados} de ${k.total}`} />
        <Stat label="Abiertos fuera de plazo" value={k.fuera} tone={k.fuera ? 'bad' : ''} hint={`${Math.round(k.pctFuera * 100)}% del total`} />
        <Stat label="Alto riesgo abiertos" value={k.altoAbiertos} tone={k.altoAbiertos ? 'bad' : ''} hint={k.altoSinPlan ? `${k.altoSinPlan} sin plan de acción` : 'Todos con plan'} />
        <Stat label="Parte de un patrón recurrente" value={k.recurrentes} hint="Mismo tipo y sede, 3 o más veces" />
      </div>
      <div className="tab-intro">
        <div className="tabs" style={{ margin: 0 }}>
          {[['todos', 'Todos'], ['abiertos', 'Abiertos'], ...ESTADOS_HZ.map((e) => [e, e])].map(([key, l]) => (
            <button key={key} className={estado === key ? 'active' : ''} onClick={() => setEstado(key)}>{l}</button>
          ))}
        </div>
        <div className="page-actions">
          {editor && <button className="btn" onClick={() => setImportar(true)}><Upload size={15} /> Importar Excel</button>}
          <button className="btn" onClick={exportar}><Download size={15} /> Exportar Excel</button>
          {can(user, 'inspeccion.crear') && <button className="btn btn-primary" onClick={abrir}><Plus size={16} /> {user.rol === 'trabajador' ? 'Reportar acto o condición' : 'Nuevo hallazgo'}</button>}
        </div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={15} /><input placeholder="Buscar en descripción, plan, responsable…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {sedesH.length > 1 && <select value={sede} onChange={(e) => setSede(e.target.value)} aria-label="Sede"><option value="">Todas las sedes</option>{sedesH.map((s) => <option key={s} value={s}>{nombreUnidad(db, s)}</option>)}</select>}
        <select value={riesgo} onChange={(e) => setRiesgo(e.target.value)} aria-label="Nivel de riesgo"><option value="">Todo riesgo</option>{RIESGOS.map((r) => <option key={r}>{r}</option>)}</select>
        <select value={clas} onChange={(e) => setClas(e.target.value)} aria-label="Clasificación"><option value="">Actos y condiciones</option><option>Acto</option><option>Condición</option></select>
        <select value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mes"><option value="">Todo el año</option>{MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
        <span className="muted small">{lista.length} hallazgos</span>
      </div>
      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>N.º / fecha</th><th>Sede</th><th style={{ minWidth: 210 }}>Hallazgo</th><th>Riesgo</th><th style={{ minWidth: 170 }}>Plan de acción</th><th>Plazo</th><th style={{ width: 80 }}>Avance</th><th>Status</th><th /></tr></thead>
            <tbody>
              {lista.slice(0, 200).map((h) => {
                const e = estadoHallazgo(h, hoy);
                const ret = diasRetraso(h, hoy);
                return (
                  <tr key={h.id}>
                    <td className="nowrap"><strong>{h.id}</strong><div className="muted small">{fmtFecha(h.fecha)} · {h.tipoInspeccion}</div></td>
                    <td>{nombreUnidad(db, h.sede)}<div className="muted small">{h.area}</div></td>
                    <td>{h.descripcion}<div className="hz-tags"><span className={`hz-clas ${h.clasificacion === 'Acto' ? 'acto' : ''}`}>{h.clasificacion}</span><span className="muted small">{h.subtipo}</span>{esRec(h) && <span className="hz-rec" title="Mismo tipo de hallazgo 3 o más veces en esta sede"><Repeat size={11} /> Recurrente</span>}</div></td>
                    <td><Badge tone={TONO_RIESGO[h.riesgo]}>{h.riesgo}</Badge></td>
                    <td>{h.accion ? h.accion : <span className="cell-err"><AlertTriangle size={12} /> Sin plan de acción</span>}<div className="muted small">{h.responsable}</div></td>
                    <td className="nowrap">{fmtFecha(h.plazo)}{ret > 0 && <div className="cell-err">{ret} días de retraso</div>}</td>
                    <td><Progress value={h.avance} /><span className="small muted">{h.avance}%</span></td>
                    <td className="hz-st"><Badge tone={TONO_HZ[e]}>{e}</Badge><div className="muted small">{rangoAntiguedad(h, hoy)}</div></td>
                    <td className="actions-cell"><BotonAdjuntos registro={h} onClick={() => setEvid(h)} />{e !== 'Cerrado' && (editor || h.responsable === user.nombre) && <button className="btn btn-sm" onClick={() => { setArchivosEdit([]); setEdit({ ...h }); }}>Actualizar</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!lista.length && <Empty>No hay hallazgos con estos filtros.</Empty>}
          {lista.length > 200 && <p className="muted small">Se muestran 200 de {lista.length}. Usa los filtros o exporta a Excel para ver todo.</p>}
        </div>
      </Card>

      {nuevo && (
        <Modal wide title={user.rol === 'trabajador' ? 'Reportar acto o condición subestándar' : 'Nuevo hallazgo de inspección'} onClose={() => { setNuevo(null); setArchivosNuevo([]); }}
          footer={<><button className="btn" onClick={() => { setNuevo(null); setArchivosNuevo([]); }}>Cancelar</button><button className="btn btn-primary" disabled={!okNuevo || guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Registrar'}</button></>}>
          <div className="form-3">
            <Field label="Fecha"><input type="date" value={nuevo.fecha} max={hoy} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value, plazo: plazoSugerido(e.target.value, nuevo.riesgo) })} /></Field>
            <Field label="Sede"><select value={nuevo.sede} onChange={(e) => setNuevo({ ...nuevo, sede: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Ubicación detallada"><input value={nuevo.area} onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })} placeholder="Ej.: zona de soldadura" /></Field>
            <Field label="Tipo de inspección"><select value={nuevo.tipoInspeccion} onChange={(e) => setNuevo({ ...nuevo, tipoInspeccion: e.target.value })}>{TIPOS_INSPECCION.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Clasificación">
              <div className="seg">{['Condición', 'Acto'].map((c) => <button key={c} className={nuevo.clasificacion === c ? 'on' : ''} onClick={() => setNuevo({ ...nuevo, clasificacion: c, subtipo: (c === 'Acto' ? ACTOS : CONDICIONES)[0] })}>{c} subestándar</button>)}</div>
            </Field>
            <Field label="Nivel de riesgo">
              <div className="seg">{RIESGOS.map((r) => <button key={r} className={nuevo.riesgo === r ? `on ${r === 'Alto' ? 'no' : ''}` : ''} onClick={() => setNuevo({ ...nuevo, riesgo: r, plazo: plazoSugerido(nuevo.fecha, r) })}>{r}</button>)}</div>
            </Field>
          </div>
          <Field label="Tipo de acto / condición"><select value={nuevo.subtipo} onChange={(e) => setNuevo({ ...nuevo, subtipo: e.target.value })}>{(nuevo.clasificacion === 'Acto' ? ACTOS : CONDICIONES).map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Descripción del hallazgo"><textarea rows={3} value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Qué se observó y dónde" /></Field>
          {user.rol !== 'trabajador' && (
            <>
              <Field label="Conclusiones y recomendaciones (plan de acción)"><textarea rows={2} value={nuevo.accion} onChange={(e) => setNuevo({ ...nuevo, accion: e.target.value })} /></Field>
              <div className="form-2">
                <Field label="Responsable"><input value={nuevo.responsable} onChange={(e) => setNuevo({ ...nuevo, responsable: e.target.value })} placeholder="Nombre del responsable" /></Field>
                <Field label={`Fecha de plazo (sugerido por riesgo ${nuevo.riesgo.toLowerCase()})`}><input type="date" value={nuevo.plazo} min={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, plazo: e.target.value })} /></Field>
              </div>
            </>
          )}
          <SelectorAdjuntos seccion="hallazgos" nuevos={archivosNuevo} setNuevos={setArchivosNuevo} etiqueta="Fotos o documentos del hallazgo" />
          {nuevo.riesgo === 'Alto' && <p className="note"><AlertTriangle size={15} /> Riesgo alto: plazo de 3 días y aviso inmediato al líder HSE.</p>}
        </Modal>
      )}

      {edit && (
        <Modal title={`Actualizar ${edit.id}`} onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn btn-primary" disabled={guardando} onClick={guardarAvance}>{Number(edit.avance) >= 100 ? 'Cerrar hallazgo' : 'Guardar avance'}</button></>}>
          <p className="muted" style={{ marginTop: 0 }}>{edit.descripcion}</p>
          <Field label="Plan de acción"><textarea rows={2} value={edit.accion} onChange={(e) => setEdit({ ...edit, accion: e.target.value })} disabled={!editor} /></Field>
          <div className="form-2">
            <Field label="Responsable"><input value={edit.responsable} onChange={(e) => setEdit({ ...edit, responsable: e.target.value })} disabled={!editor} /></Field>
            <Field label="Fecha de plazo"><input type="date" value={edit.plazo} min={edit.fecha} onChange={(e) => setEdit({ ...edit, plazo: e.target.value })} disabled={!editor} /></Field>
          </div>
          <Field label={`Avance: ${edit.avance}%`}>
            <div className="seg">{[0, 25, 50, 75, 100].map((v) => <button key={v} className={Number(edit.avance) === v ? 'on' : ''} onClick={() => setEdit({ ...edit, avance: v })}>{v === 100 ? 'Cerrado' : `${v}%`}</button>)}</div>
          </Field>
          <span className="lbl-up">Evidencias registradas</span>
          <ListaAdjuntos ids={edit.adjuntos} legado={edit.evidencia} vacio="Aún no hay evidencias." />
          <SelectorAdjuntos seccion="hallazgos" nuevos={archivosEdit} setNuevos={setArchivosEdit} etiqueta="Agregar evidencia (foto o documento)" />
        </Modal>
      )}
      {evid && <EvidenciasModal seccion="hallazgos" coleccion="hallazgos" registro={evid} titulo={`Evidencias · ${evid.id}`} onClose={() => setEvid(null)} />}
      {importar && <ImportarHallazgos onClose={() => setImportar(false)} />}
    </>
  );
}
