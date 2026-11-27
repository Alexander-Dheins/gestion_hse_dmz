import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';
import { useStore, can, nombreUnidad } from '../store.jsx';
import { Card, PageHeader, Badge } from '../components/ui.jsx';
import { Lineas, BarrasH, Kpi, SERIE } from '../components/charts.jsx';
import { MESES, MESES_C, ANIO, MES_ACTUAL } from '../data/seed3.js';
import { indicadores, trabajadoresMes, diasSinLti, ultimoMesCerrado, rango, fmtN } from '../lib/sgsst.js';

// Elemento 4.3 del SGSST: estadísticas e indicadores de seguridad
export default function Estadisticas() {
  const { db, user, visibleUnits, update } = useStore();
  const [tab, setTab] = useState('ind');
  const editor = can(user, 'estadisticas.editar');
  const est = db.estadisticas;
  const ult = ultimoMesCerrado(db);
  const meses = rango(0, ult);
  const ytd = indicadores(db, { sedes: visibleUnits, meses, anio: ANIO });
  const ytdAnt = ult > 0 ? indicadores(db, { sedes: visibleUnits, meses: rango(0, ult - 1), anio: ANIO }) : null;
  const porMes = meses.map((m) => ({ m, mes: indicadores(db, { sedes: visibleUnits, meses: [m], anio: ANIO }), acum: indicadores(db, { sedes: visibleUnits, meses: rango(0, m), anio: ANIO }) }));
  const sinLti = diasSinLti(db, visibleUnits);
  const sedes = visibleUnits.filter((s) => est.hht[s]);
  const porSede = sedes.map((s) => ({ s, ...indicadores(db, { sedes: [s], meses, anio: ANIO }) }));
  const f2 = (v) => fmtN(v, 2);

  const setHht = (s, m, campo, v) => update((d) => { d.estadisticas[campo][s][m] = v === '' ? null : Math.max(0, Number(v)); });

  return (
    <>
      <PageHeader title="Estadísticas de seguridad" subtitle={`Indicadores ${ANIO} acumulados a ${MESES[ult].toLowerCase()} (último mes con horas hombre registradas).`}
        actions={<Link to="/reporte-mensual" className="btn btn-primary"><FileBarChart size={15} /> Reporte mensual</Link>} />
      <div className="tabs tabs-main">
        <button className={tab === 'ind' ? 'active' : ''} onClick={() => setTab('ind')}>Indicadores</button>
        <button className={tab === 'hht' ? 'active' : ''} onClick={() => setTab('hht')}>Horas hombre y personal</button>
      </div>
      {tab === 'ind' && (
        <>
          <div className="kpi-row">
            <Kpi titulo="IF" sub="Índice de frecuencia" valor={ytd.IF} previo={ytdAnt?.IF} meta={est.metas.IF} formato={f2} alerta={ytd.IF > est.metas.IF} />
            <Kpi titulo="IG" sub="Índice de gravedad" valor={ytd.IG} previo={ytdAnt?.IG} formato={f2} />
            <Kpi titulo="LTIR" sub="Lesiones con tiempo perdido" valor={ytd.LTIR} previo={ytdAnt?.LTIR} formato={f2} />
            <Kpi titulo="TRIR" sub="Incidentes registrables" valor={ytd.TRIR} previo={ytdAnt?.TRIR} meta={est.metas.TRIR} formato={f2} alerta={ytd.TRIR > est.metas.TRIR} />
            <Kpi titulo="Días sin LTI" sub="Desde el último accidente con tiempo perdido" valor={sinLti ?? 0} formato={(v) => v} menorEsMejor={false} />
            <Kpi titulo="HHT acumuladas" sub={`${trabajadoresMes(db, visibleUnits, ult)} trabajadores en ${MESES[ult].toLowerCase()}`} valor={ytd.hht} formato={(v) => fmtN(v, 0)} />
          </div>
          <div className="grid-2">
            <Card title="TRIR acumulado por mes">
              <Lineas etiquetas={meses.map((m) => MESES_C[m])} series={[{ nombre: 'TRIR acumulado', color: SERIE[0], valores: porMes.map((x) => Math.round(x.acum.TRIR * 100) / 100) }]} meta={est.metas.TRIR} formato={f2} />
            </Card>
            <Card title="TRIR por operación · acumulado">
              <BarrasH datos={porSede.map((x) => ({ etiqueta: nombreUnidad(db, x.s), valor: Math.round(x.TRIR * 100) / 100 }))} formato={f2} meta={est.metas.TRIR} color={SERIE[0]} />
              <p className="muted small">La línea marca la meta de TRIR ({est.metas.TRIR}).</p>
            </Card>
          </div>
          <Card title="Indicadores por mes">
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>Mes</th><th className="right">HHT</th><th className="right">Trab.</th><th className="center">LTI</th><th className="center">WRC</th><th className="center">MTC</th><th className="center">FAC</th><th className="right">Días perd.</th><th className="right">IF mes</th><th className="right">IG mes</th><th className="right">TRIR mes</th><th className="right">IF acum.</th><th className="right">LTIR acum.</th><th className="right">TRIR acum.</th></tr></thead>
                <tbody>
                  {porMes.map(({ m, mes, acum }) => (
                    <tr key={m}>
                      <td>{MESES[m]}</td><td className="right">{fmtN(mes.hht, 0)}</td><td className="right">{trabajadoresMes(db, visibleUnits, m)}</td>
                      <td className="center">{mes.lti || ''}</td><td className="center">{mes.wrc || ''}</td><td className="center">{mes.mtc || ''}</td><td className="center">{mes.fac || ''}</td><td className="right">{mes.dias || ''}</td>
                      <td className="right">{f2(mes.IF)}</td><td className="right">{f2(mes.IG)}</td><td className="right">{f2(mes.TRIR)}</td>
                      <td className="right">{f2(acum.IF)}</td><td className="right">{f2(acum.LTIR)}</td>
                      <td className="right"><Badge tone={acum.TRIR > est.metas.TRIR ? 'bad' : 'ok'}>{f2(acum.TRIR)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Indicadores por operación (acumulado)">
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>Unidad minera / taller</th><th className="right">HHT</th><th className="center">Registrables</th><th className="center">LTI</th><th className="right">Días perd.</th><th className="right">IF</th><th className="right">IG</th><th className="right">LTIR</th><th className="right">TRIR</th></tr></thead>
                <tbody>
                  {porSede.map((x) => (
                    <tr key={x.s}><td>{nombreUnidad(db, x.s)}</td><td className="right">{fmtN(x.hht, 0)}</td><td className="center">{x.registrables}</td><td className="center">{x.lti}</td><td className="right">{x.dias}</td><td className="right">{f2(x.IF)}</td><td className="right">{f2(x.IG)}</td><td className="right">{f2(x.LTIR)}</td><td className="right"><Badge tone={x.TRIR > est.metas.TRIR ? 'bad' : 'ok'}>{f2(x.TRIR)}</Badge></td></tr>
                  ))}
                  <tr className="tr-total"><td>DMZ Corp.</td><td className="right">{fmtN(ytd.hht, 0)}</td><td className="center">{ytd.registrables}</td><td className="center">{ytd.lti}</td><td className="right">{ytd.dias}</td><td className="right">{f2(ytd.IF)}</td><td className="right">{f2(ytd.IG)}</td><td className="right">{f2(ytd.LTIR)}</td><td className="right">{f2(ytd.TRIR)}</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Fórmulas">
            <ul className="formulas">
              <li><strong>IF</strong> (índice de frecuencia) = N.º de accidentes incapacitantes y mortales × 1 000 000 ÷ HHT. Meta {est.metas.IF}.</li>
              <li><strong>IG</strong> (índice de gravedad) = días perdidos × 1 000 000 ÷ HHT.</li>
              <li><strong>LTIR</strong> = N.º de LTI × 200 000 ÷ HHT.</li>
              <li><strong>TRIR</strong> = (mortales + LTI + WRC + MTC) × 200 000 ÷ HHT. Meta {est.metas.TRIR}.</li>
              <li>Los primeros auxilios (FAC), daños (PD), cuasi accidentes y HPH se registran y analizan, pero no suman a estos índices.</li>
            </ul>
          </Card>
        </>
      )}
      {tab === 'hht' && (
        <Card title={`Horas hombre trabajadas y personal · ${ANIO}`}>
          <p className="muted small" style={{ marginTop: 0 }}>{editor ? 'Registra las HHT y el número de trabajadores de cada sede al cierre de mes. Los indicadores se recalculan al instante.' : 'Solo la gerencia y el analista HSE pueden editar estas cifras.'}</p>
          <div className="table-wrap">
            <table className="table compact hht-table">
              <thead><tr><th>Sede</th>{MESES_C.slice(0, MES_ACTUAL + 1).map((m) => <th key={m} className="center">{m}</th>)}<th className="right">Total HHT</th></tr></thead>
              <tbody>
                {sedes.map((s) => (
                  <tr key={s}>
                    <td><strong>{nombreUnidad(db, s)}</strong><div className="muted small">HHT / trabajadores</div></td>
                    {rango(0, MES_ACTUAL).map((m) => (
                      <td key={m} className="center">
                        <input type="number" min="0" step="10" disabled={!editor} value={est.hht[s][m] ?? ''} onChange={(e) => setHht(s, m, 'hht', e.target.value)} aria-label={`HHT ${nombreUnidad(db, s)} ${MESES[m]}`} />
                        <input type="number" min="0" disabled={!editor} value={est.trabajadores[s][m] ?? ''} onChange={(e) => setHht(s, m, 'trabajadores', e.target.value)} aria-label={`Trabajadores ${nombreUnidad(db, s)} ${MESES[m]}`} className="sm" />
                      </td>
                    ))}
                    <td className="right"><strong>{fmtN(est.hht[s].reduce((a, v) => a + (v || 0), 0), 0)}</strong></td>
                  </tr>
                ))}
                <tr className="tr-total"><td>Total</td>{rango(0, MES_ACTUAL).map((m) => <td key={m} className="center">{fmtN(sedes.reduce((a, s) => a + (est.hht[s][m] || 0), 0), 0)}</td>)}<td className="right">{fmtN(sedes.reduce((a, s) => a + est.hht[s].reduce((b, v) => b + (v || 0), 0), 0), 0)}</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
