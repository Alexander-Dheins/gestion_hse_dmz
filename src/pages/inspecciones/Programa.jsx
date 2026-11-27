import { Fragment, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useStore, can } from '../../store.jsx';
import { Card, Badge } from '../../components/ui.jsx';
import { Lineas, BarrasH, SERIE } from '../../components/charts.jsx';
import { SEDES_PROGRAMA, MESES_C, MESES, MES_ACTUAL } from '../../data/seed3.js';
import { cumplimientoPrograma, valoracion, VALORACIONES, rango } from '../../lib/sgsst.js';

const pc = (v) => `${v.toFixed(1)}%`;

export default function Programa() {
  const { db, user, update, todas, scopeUnits } = useStore();
  const prog = db.programaInsp;
  const sedesVis = SEDES_PROGRAMA.filter((s) => todas || scopeUnits.includes(s.id));
  const [sede, setSede] = useState(sedesVis.length > 1 ? 'todas' : sedesVis[0]?.id);
  const editor = can(user, 'programa.editar');
  const ids = sede === 'todas' ? sedesVis.map((s) => s.id) : [sede];
  const hastaHoy = rango(0, MES_ACTUAL);
  const acum = cumplimientoPrograma(prog, { sedes: ids, meses: hastaHoy });
  const anual = cumplimientoPrograma(prog, { sedes: ids, meses: rango(0, 11) });
  const mesAnt = Math.max(0, MES_ACTUAL - 1);
  const delMes = cumplimientoPrograma(prog, { sedes: ids, meses: [mesAnt] });
  const val = valoracion(acum.pct);
  const actividades = prog.actividades.filter((a) => a.sedes.some((s) => ids.includes(s)));
  const categorias = [...new Set(actividades.map((a) => a.categoria))];

  const toggle = (a, s, m) => {
    if (!editor || m > MES_ACTUAL) return;
    update((d) => {
      const x = d.programaInsp.actividades.find((y) => y.id === a.id);
      x.ejec[s][m] = !x.ejec[s][m];
      d.programaInsp.actualizado = new Date().toISOString().slice(0, 10);
    }, `${a.nombre} · ${MESES[m]}: ${a.ejec[s][m] ? 'marcada como no ejecutada' : 'ejecutada'}`);
  };

  const celda = (a, m) => {
    const sedesA = a.sedes.filter((s) => ids.includes(s));
    if (sede !== 'todas') {
      const s = sedesA[0];
      if (!s) return <td key={m} />;
      const p = a.plan[s][m]; const e = a.ejec[s][m];
      if (!p && !e) return <td key={m} className="pg-c vacio" onClick={() => editor && m <= MES_ACTUAL && toggle(a, s, m)} />;
      const cls = e ? (p ? 'ok' : 'extra') : m < MES_ACTUAL ? 'falta' : 'pend';
      return (
        <td key={m} className={`pg-c ${cls} ${editor && m <= MES_ACTUAL ? 'clic' : ''}`} onClick={() => toggle(a, s, m)}
          title={`${MESES[m]}: ${p ? 'programada' : 'no programada'}${e ? ' · ejecutada' : ''}`}>
          {e ? <Check size={13} /> : cls === 'falta' ? <X size={13} /> : 'P'}
        </td>
      );
    }
    const p = sedesA.filter((s) => a.plan[s][m]).length;
    const e = sedesA.filter((s) => a.ejec[s][m]).length;
    if (!p && !e) return <td key={m} className="pg-c vacio" />;
    const cls = m > MES_ACTUAL ? 'pend' : e >= p ? 'ok' : m < MES_ACTUAL ? 'falta' : 'pend';
    return <td key={m} className={`pg-c ${cls}`} title={`${MESES[m]}: ${e} de ${p} ejecutadas`}>{m <= MES_ACTUAL ? `${e}/${p}` : p}</td>;
  };

  const porMes = rango(0, 11).map((m) => cumplimientoPrograma(prog, { sedes: ids, meses: [m] }));
  return (
    <>
      <div className="tab-intro">
        <p className="muted">Programa anual de inspecciones {prog.anio} · meta {prog.meta} % de ejecución · actualizado el {prog.actualizado}{editor ? ' · haz clic en una celda para marcarla como ejecutada' : ''}</p>
        <div className="tabs" style={{ margin: 0 }}>
          {sedesVis.length > 1 && <button className={sede === 'todas' ? 'active' : ''} onClick={() => setSede('todas')}>Consolidado DMZ</button>}
          {sedesVis.map((s) => <button key={s.id} className={sede === s.id ? 'active' : ''} onClick={() => setSede(s.id)}>{s.nombre}</button>)}
        </div>
      </div>
      <div className="kpi-row">
        <div className="kpi"><span className="kpi-t">Cumplimiento acumulado</span><strong className={`${val.tono}-t`}>{pc(acum.pct)}</strong><span className="kpi-p">{acum.ejec} de {acum.prog} programadas a la fecha</span></div>
        <div className="kpi"><span className="kpi-t">Valoración (indicador I03)</span><strong className={`${val.tono}-t`}>{val.nombre}</strong><span className="kpi-p">{val.desc}</span></div>
        <div className="kpi"><span className="kpi-t">Cumplimiento de {MESES[mesAnt].toLowerCase()}</span><strong>{pc(delMes.pct)}</strong><span className="kpi-p">{delMes.ejec} de {delMes.prog}</span></div>
        <div className="kpi"><span className="kpi-t">Avance del programa anual</span><strong>{pc(anual.pct)}</strong><span className="kpi-p">{anual.prog - anual.ejec} inspecciones por ejecutar</span></div>
      </div>
      <div className="grid-2">
        <Card title="Cumplimiento mensual del programa">
          <Lineas etiquetas={hastaHoy.map((m) => MESES_C[m])} series={[{ nombre: '% ejecutado', color: SERIE[0], valores: hastaHoy.map((m) => (porMes[m].prog ? Math.round(porMes[m].pct * 10) / 10 : null)) }]} meta={prog.meta} formato={(v) => `${Math.round(v)}%`} />
        </Card>
        <Card title={`Cumplimiento por sede · acumulado a ${MESES[MES_ACTUAL].toLowerCase()}`}>
          <BarrasH datos={sedesVis.map((s) => ({ etiqueta: s.nombre, valor: Math.round(cumplimientoPrograma(prog, { sedes: [s.id], meses: hastaHoy }).pct * 10) / 10 }))} formato={(v) => `${v}%`} max={100} meta={prog.meta}
            color={SERIE[0]} />
          <p className="muted small">La línea marca la meta del {prog.meta} %.</p>
        </Card>
      </div>
      <Card title="Seguimiento del programa anual">
        <div className="table-wrap">
          <table className="table compact pg-table">
            <thead>
              <tr><th>Actividad</th><th>Frecuencia</th>{MESES_C.map((m, i) => <th key={m} className={`center ${i === MES_ACTUAL ? 'pg-hoy' : ''}`}>{m}</th>)}<th className="right">Prog.</th><th className="right">Ejec.</th><th className="right">%</th><th>Responsable</th></tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <Fragment key={c}>
                  <tr className="pg-cat"><td colSpan={19}>{c}</td></tr>
                  {actividades.filter((a) => a.categoria === c).map((a) => {
                    const r = cumplimientoPrograma({ actividades: [a] }, { sedes: ids, meses: hastaHoy });
                    return (
                      <tr key={a.id}>
                        <td><strong>{a.nombre}</strong><div className="muted small">{a.sedes.filter((s) => ids.includes(s)).map((s) => SEDES_PROGRAMA.find((x) => x.id === s).nombre).join(', ')} · {a.area}</div></td>
                        <td className="small">{a.frecuencia}</td>
                        {rango(0, 11).map((m) => celda(a, m))}
                        <td className="right">{r.prog}</td><td className="right">{r.ejec}</td>
                        <td className="right"><Badge tone={valoracion(r.pct).tono}>{Math.round(r.pct)}%</Badge></td>
                        <td className="small">{a.inspector}</td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
              <tr className="tr-total"><td colSpan={2}>Programado mensual</td>{porMes.map((x, m) => <td key={m} className="center">{x.prog}</td>)}<td className="right">{acum.prog}</td><td /><td /><td /></tr>
              <tr className="tr-total"><td colSpan={2}>Ejecutado mensual</td>{porMes.map((x, m) => <td key={m} className="center">{m <= MES_ACTUAL ? x.ejec : ''}</td>)}<td /><td className="right">{acum.ejec}</td><td /><td /></tr>
              <tr className="tr-total"><td colSpan={2}>% cumplimiento mensual</td>{porMes.map((x, m) => <td key={m} className="center">{m <= MES_ACTUAL && x.prog ? `${Math.round(x.pct)}%` : ''}</td>)}<td /><td /><td className="right">{Math.round(acum.pct)}%</td><td /></tr>
            </tbody>
          </table>
        </div>
        <div className="pg-leyenda">
          <span><i className="pg-c ok"><Check size={11} /></i> Ejecutada</span><span><i className="pg-c extra"><Check size={11} /></i> Ejecutada sin programar</span>
          <span><i className="pg-c falta"><X size={11} /></i> Programada no ejecutada</span><span><i className="pg-c pend">P</i> Programada pendiente</span>
        </div>
      </Card>
      <Card title="Criterios de valoración del cumplimiento">
        <table className="table compact">
          <thead><tr><th>Rango</th><th>Valoración</th><th>Descripción</th></tr></thead>
          <tbody>{VALORACIONES.map((v, i) => <tr key={v.nombre}><td>{i === 0 ? '95 % – 100 %' : i === 4 ? '< 50 %' : `${v.min} % – ${VALORACIONES[i - 1].min - 1} %`}</td><td><Badge tone={v.tono}>{v.nombre}</Badge></td><td>{v.desc}</td></tr>)}</tbody>
        </table>
        <p className="muted small">Fórmula: (N.º de actividades ejecutadas ÷ N.º de actividades programadas) × 100. Meta: {prog.meta} %.</p>
      </Card>
    </>
  );
}
