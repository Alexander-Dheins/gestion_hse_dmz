import { useMemo, useState } from 'react';
import { useStore, nombreUnidad, fmtFecha } from '../../store.jsx';
import { Card, Badge, Empty } from '../../components/ui.jsx';
import { Barras, BarrasH, Dona, COLOR_ESTADO, SERIE } from '../../components/charts.jsx';
import { MESES_C, MESES, MES_ACTUAL } from '../../data/seed3.js';
import { estadoHallazgo, kpisHallazgos, recurrencias, diasRetraso, ESTADOS_HZ, hoyIso, mesDe } from '../../lib/sgsst.js';

const COLOR_EST = { Cerrado: COLOR_ESTADO.ok, 'En proceso': COLOR_ESTADO.info, 'Abierto dentro del plazo': COLOR_ESTADO.warn, 'Abierto fuera del plazo': COLOR_ESTADO.bad };
const pc = (v) => `${Math.round(v * 100)}%`;

export default function KpiHallazgos() {
  const { db, inScope } = useStore();
  const [mes, setMes] = useState('');
  const hoy = hoyIso();
  const todos = useMemo(() => db.hallazgos.filter((h) => inScope(h.sede)), [db.hallazgos, inScope]);
  const base = mes === '' ? todos : todos.filter((h) => mesDe(h.fecha) === Number(mes));
  const k = kpisHallazgos(base, hoy);
  const sedes = [...new Set(todos.map((h) => h.sede))];
  const porSede = sedes.map((s) => {
    const l = base.filter((h) => h.sede === s);
    const e = (x) => l.filter((h) => estadoHallazgo(h, hoy) === x).length;
    return { s, total: l.length, cerrados: e('Cerrado'), fuera: e('Abierto fuera del plazo'), dentro: e('Abierto dentro del plazo') + e('En proceso') };
  });
  const meses = Array.from({ length: MES_ACTUAL + 1 }, (_, i) => i);
  const esRec = recurrencias(todos);
  const tipos = {};
  base.forEach((h) => { tipos[h.subtipo] = (tipos[h.subtipo] || 0) + 1; });
  const topTipos = Object.entries(tipos).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const alto = base.filter((h) => h.riesgo === 'Alto' && estadoHallazgo(h, hoy) !== 'Cerrado').sort((a, b) => diasRetraso(b, hoy) - diasRetraso(a, hoy));

  if (!todos.length) return <Empty>No hay hallazgos en tu alcance.</Empty>;
  return (
    <>
      <div className="tab-intro">
        <p className="muted">Panel de KPIs de la gestión de hallazgos: estado de cierre, cumplimiento por sede, tendencia mensual y focos de riesgo.</p>
        <select className="sel" value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Periodo"><option value="">Acumulado del año</option>{meses.map((m) => <option key={m} value={m}>{MESES[m]}</option>)}</select>
      </div>
      <div className="kpi-row">
        <div className="kpi"><span className="kpi-t">Total de hallazgos</span><strong>{k.total}</strong><span className="kpi-p">{k.actos} actos · {k.condiciones} condiciones</span></div>
        <div className="kpi"><span className="kpi-t">% cerrados</span><strong className={k.pctCerrados >= 0.8 ? 'ok-t' : 'warn-t'}>{pc(k.pctCerrados)}</strong><span className="kpi-p">{k.cerrados} cerrados</span></div>
        <div className="kpi"><span className="kpi-t">% abiertos fuera de plazo</span><strong className={k.pctFuera > 0.1 ? 'bad-t' : ''}>{pc(k.pctFuera)}</strong><span className="kpi-p">{k.fuera} hallazgos</span></div>
        <div className="kpi"><span className="kpi-t">% abiertos dentro de plazo</span><strong>{pc((k.dentro + k.enProceso) / (k.total || 1))}</strong><span className="kpi-p">{k.dentro + k.enProceso} hallazgos</span></div>
        <div className="kpi alerta"><span className="kpi-t">Alto riesgo abiertos</span><strong className={k.altoAbiertos ? 'bad-t' : ''}>{k.altoAbiertos}</strong><span className="kpi-p">{k.altoSinPlan} sin plan de acción</span></div>
        <div className="kpi"><span className="kpi-t">En patrón recurrente</span><strong>{k.recurrentes}</strong><span className="kpi-p">mismo tipo y sede ≥ 3 veces</span></div>
      </div>

      <div className="grid-2">
        <Card title="Cumplimiento por ubicación">
          <table className="table compact">
            <thead><tr><th>Ubicación</th><th className="right">Total</th><th className="right">Cerrados</th><th className="right">Fuera de plazo</th><th className="right">Dentro de plazo</th><th className="right">% cerrado</th></tr></thead>
            <tbody>
              {porSede.map((r) => (
                <tr key={r.s}><td>{nombreUnidad(db, r.s)}</td><td className="right">{r.total}</td><td className="right">{r.cerrados}</td><td className="right">{r.fuera}</td><td className="right">{r.dentro}</td>
                  <td className="right"><Badge tone={r.total && r.cerrados / r.total >= 0.8 ? 'ok' : r.total && r.cerrados / r.total >= 0.6 ? 'warn' : 'bad'}>{r.total ? pc(r.cerrados / r.total) : '—'}</Badge></td></tr>
              ))}
              <tr className="tr-total"><td>Total general</td><td className="right">{k.total}</td><td className="right">{k.cerrados}</td><td className="right">{k.fuera}</td><td className="right">{k.dentro + k.enProceso}</td><td className="right">{pc(k.pctCerrados)}</td></tr>
            </tbody>
          </table>
          <h4 className="h4" style={{ marginTop: 16 }}>% de status de observaciones por ubicación</h4>
          <Barras etiquetas={porSede.map((r) => nombreUnidad(db, r.s).replace('DMZ ', ''))} alto={200}
            series={ESTADOS_HZ.map((e) => ({ nombre: e, color: COLOR_EST[e], valores: porSede.map((r) => base.filter((h) => h.sede === r.s && estadoHallazgo(h, hoy) === e).length) }))} />
        </Card>
        <Card title="Tendencia mensual">
          <Barras etiquetas={meses.map((m) => MESES_C[m])} alto={240}
            series={ESTADOS_HZ.map((e) => ({ nombre: e, color: COLOR_EST[e], valores: meses.map((m) => todos.filter((h) => mesDe(h.fecha) === m && estadoHallazgo(h, hoy) === e).length) }))} />
          <p className="muted small">Hallazgos encontrados cada mes según su status actual.</p>
        </Card>
      </div>

      <div className="grid-3">
        <Card title="Actos vs. condiciones">
          <Dona centro={k.total} subcentro="hallazgos" datos={[{ etiqueta: 'Condiciones subestándar', valor: k.condiciones, color: SERIE[0] }, { etiqueta: 'Actos subestándar', valor: k.actos, color: SERIE[1] }]} />
        </Card>
        <Card title="Por nivel de riesgo">
          <Dona centro={k.total} subcentro="hallazgos" datos={[['Alto', SERIE[7]], ['Medio', SERIE[3]], ['Bajo', SERIE[2]]].map(([r, c]) => ({ etiqueta: r, valor: base.filter((h) => h.riesgo === r).length, color: c }))} />
        </Card>
        <Card title="Por tipo de inspección">
          <Dona centro={k.total} subcentro="hallazgos" datos={[['Planeada', SERIE[0]], ['Inopinada', SERIE[1]], ['Gerencial', SERIE[2]], ['Comité SST', SERIE[3]]].map(([r, c]) => ({ etiqueta: r, valor: base.filter((h) => h.tipoInspeccion === r).length, color: c }))} />
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Tipos de hallazgo más frecuentes">
          <BarrasH datos={topTipos.map(([t, v]) => ({ etiqueta: t, valor: v }))} formato={(v) => v} />
        </Card>
        <Card title="Alto riesgo abiertos (prioridad)">
          {alto.slice(0, 7).map((h) => (
            <div key={h.id} className="row-link static">
              <Badge tone="bad">{h.id}</Badge>
              <div className="grow"><strong>{h.descripcion}</strong><span className="muted small">{nombreUnidad(db, h.sede)} · {h.responsable || 'sin responsable'} · plazo {fmtFecha(h.plazo)}{esRec(h) ? ' · recurrente' : ''}</span></div>
              {diasRetraso(h, hoy) > 0 ? <Badge tone="bad">{diasRetraso(h, hoy)} d</Badge> : <Badge tone="warn">En plazo</Badge>}
              {!h.accion && <Badge tone="bad">Sin plan</Badge>}
            </div>
          ))}
          {!alto.length && <Empty>No hay hallazgos de alto riesgo abiertos.</Empty>}
        </Card>
      </div>
    </>
  );
}
