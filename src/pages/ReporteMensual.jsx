import { useState } from 'react';
import { Printer, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore, nombreUnidad, fmtFecha } from '../store.jsx';
import { PageHeader, Empty } from '../components/ui.jsx';
import { Barras, BarrasH, Lineas, Dona, Kpi, COLOR_CLASE, COLOR_ESTADO, SERIE } from '../components/charts.jsx';
import { MESES, MESES_C, ANIO, CLASES_EVENTO, SEDES_PROGRAMA } from '../data/seed3.js';
import { indicadores, trabajadoresMes, ultimoMesCerrado, rango, fmtN, mesDe, diasEntre, planesInvestigacion, cumplimientoPrograma, estadoHallazgo, estadoNc } from '../lib/sgsst.js';

const CLASES_REPORTE = ['LTI', 'WRC', 'MTC', 'FAC', 'PD', 'NM', 'HPH'];
const f2 = (v) => fmtN(v, 2);
const nombreCorto = (db, s) => nombreUnidad(db, s).replace('U.M. ', '').replace('DMZ ', '');
const tend = (a, b, menorMejor = true) => (b == null || a === b ? 'se mantiene' : (a < b) === menorMejor ? 'mejora' : 'empeora');

// Reporte mensual de seguridad: se arma solo con los datos del sistema (eventos, HHT, planes, inspecciones, cartillas)
export default function ReporteMensual() {
  const { db, user, visibleUnits } = useStore();
  const ult = ultimoMesCerrado(db);
  const [mes, setMes] = useState(ult);
  const ant = mes - 1;
  const sedes = visibleUnits.filter((s) => db.estadisticas.hht[s]);
  const ytd = indicadores(db, { sedes, meses: rango(0, mes), anio: ANIO });
  const ytdAnt = ant >= 0 ? indicadores(db, { sedes, meses: rango(0, ant), anio: ANIO }) : null;
  const delMes = indicadores(db, { sedes, meses: [mes], anio: ANIO });
  const mesAnt = ant >= 0 ? indicadores(db, { sedes, meses: [ant], anio: ANIO }) : null;
  const metas = db.estadisticas.metas;
  const finMes = new Date(Date.UTC(ANIO, mes + 1, 0)).toISOString().slice(0, 10);
  const ltis = db.incidentes.filter((e) => ['LTI', 'FAT'].includes(e.clase) && sedes.includes(e.unidad) && e.fecha <= finMes).map((e) => e.fecha).sort();
  const sinLti = ltis.length ? diasEntre(ltis[ltis.length - 1], finMes) : null;
  const sinLtiAnt = ltis.filter((f) => f <= new Date(Date.UTC(ANIO, mes, 0)).toISOString().slice(0, 10));
  const porSede = sedes.map((s) => ({ s, act: indicadores(db, { sedes: [s], meses: rango(0, mes), anio: ANIO }), ant: ant >= 0 ? indicadores(db, { sedes: [s], meses: rango(0, ant), anio: ANIO }) : null }));
  const conTrir = porSede.filter((x) => x.act.registrables > 0);
  const evYtd = ytd.eventos;
  const evMes = delMes.eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const n = (lista, c) => lista.filter((e) => e.clase === c).length;
  const sedesEv = [...new Set(evYtd.map((e) => e.unidad))];
  const planes = planesInvestigacion(db, visibleUnits);
  const est = (e) => planes.filter((p) => p.estadoSeg === e).length;
  const sedesPl = [...new Set(planes.map((p) => p.unidad))];
  const pctCierre = sedesPl.map((s) => { const l = planes.filter((p) => p.unidad === s); return { s, pct: Math.round((l.filter((p) => p.estadoSeg === 'Cerrado').length / l.length) * 100), retraso: Math.max(0, ...l.map((p) => p.retraso)) }; });
  const prog = db.programaInsp;
  const sedesProg = SEDES_PROGRAMA.filter((s) => visibleUnits.includes(s.id) || (['RESP', 'CSST'].includes(s.id) && visibleUnits.length > 3));
  const progIds = sedesProg.map((s) => s.id);
  const inspMes = cumplimientoPrograma(prog, { sedes: progIds, meses: [mes] });
  const inspMesAnt = ant >= 0 ? cumplimientoPrograma(prog, { sedes: progIds, meses: [ant] }) : null;
  const inspAcum = cumplimientoPrograma(prog, { sedes: progIds, meses: rango(0, mes) });
  const passo = Math.round((db.passo.reduce((s, x) => s + x.ejecutado, 0) / db.passo.reduce((s, x) => s + x.meta, 0)) * 1000) / 10;
  const hz = db.hallazgos.filter((h) => visibleUnits.includes(h.sede) && h.fecha <= finMes);
  const sedesHz = [...new Set(hz.map((h) => h.sede))];
  const cartillas = db.cartillas.filter((c) => c.mes === mes && visibleUnits.includes(c.sede));
  const ncAbiertas = db.noConformidades.filter((x) => visibleUnits.includes(x.sede) && estadoNc(x) !== 'Cerrado');

  if (!sedes.length) return <><PageHeader title="Reporte mensual de seguridad" /><Empty>No hay horas hombre registradas para tu alcance.</Empty></>;

  // Mensajes automáticos (se escriben a partir de los números)
  const bulletsKpi = [
    `${MESES[mes]} cierra con IF ${f2(ytd.IF)} e IG ${f2(ytd.IG)} acumulados${delMes.lti ? `; se registró ${delMes.lti} accidente con tiempo perdido en el mes.` : ', sin nuevos accidentes incapacitantes en el mes.'}`,
    ytdAnt && `El LTIR ${tend(ytd.LTIR, ytdAnt.LTIR)} (${f2(ytdAnt.LTIR)} → ${f2(ytd.LTIR)}) y el TRIR ${tend(ytd.TRIR, ytdAnt.TRIR)} (${f2(ytdAnt.TRIR)} → ${f2(ytd.TRIR)}); la meta de TRIR es ${metas.TRIR}.`,
    sinLti != null && `La organización acumula ${sinLti} días consecutivos sin accidentes con tiempo perdido al cierre del mes.`,
    mesAnt && `Las HHT del mes suman ${fmtN(delMes.hht, 0)}, frente a ${fmtN(mesAnt.hht, 0)} del mes anterior; considerar la exposición al leer los indicadores.`,
  ].filter(Boolean);
  const mejoran = conTrir.filter((x) => x.ant && x.act.TRIR < x.ant.TRIR);
  const empeoran = conTrir.filter((x) => x.ant && x.act.TRIR > x.ant.TRIR);
  const peorRetraso = [...pctCierre].sort((a, b) => b.retraso - a.retraso).filter((x) => x.retraso > 0);
  const hzFuera = sedesHz.map((s) => ({ s, n: hz.filter((h) => h.sede === s && estadoHallazgo(h, finMes) === 'Abierto fuera del plazo').length })).sort((a, b) => b.n - a.n);

  return (
    <div className="reporte">
      <PageHeader title="Reporte mensual de seguridad" subtitle="Se genera con los datos registrados en el sistema. Elige el mes y descárgalo en PDF."
        actions={<>
          <select className="sel" value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="Mes del reporte">{rango(0, ult).map((m) => <option key={m} value={m}>{MESES[m]} {ANIO}</option>)}</select>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={15} /> Imprimir / PDF</button>
        </>} />

      <section className="rp-portada">
        <img src="/logo-dimarza.png" alt="DMZ Corp." />
        <div>
          <span>Reporte mensual de seguridad</span>
          <h1>{MESES[mes]} {ANIO}</h1>
          <p>DIMARZA S.A.C. · {visibleUnits.length > 3 ? 'Consolidado DMZ Corp.' : visibleUnits.map((s) => nombreUnidad(db, s)).join(', ')} · Elaborado por: {user.nombre}</p>
        </div>
      </section>

      <section className="rp-sec">
        <h2><span>1</span>Estadísticas de seguridad (IF, IG, LTIR, TRIR)</h2>
        <div className="kpi-row">
          <Kpi titulo="IF" sub="Índice de frecuencia" valor={ytd.IF} previo={ytdAnt?.IF} meta={metas.IF} formato={f2} alerta={ytd.IF > metas.IF} />
          <Kpi titulo="IG" sub="Índice de gravedad" valor={ytd.IG} previo={ytdAnt?.IG} formato={f2} />
          <Kpi titulo="LTIR" sub="Lesiones con tiempo perdido" valor={ytd.LTIR} previo={ytdAnt?.LTIR} formato={f2} />
          <Kpi titulo="TRIR" sub="Incidentes registrables" valor={ytd.TRIR} previo={ytdAnt?.TRIR} meta={metas.TRIR} formato={f2} alerta={ytd.TRIR > metas.TRIR} />
          <Kpi titulo="Días sin LTI" sub="Al cierre del mes" valor={sinLti ?? 0} previo={sinLtiAnt.length ? diasEntre(sinLtiAnt[sinLtiAnt.length - 1], new Date(Date.UTC(ANIO, mes, 0)).toISOString().slice(0, 10)) : null} formato={(v) => v} menorEsMejor={false} />
          <Kpi titulo="HHT del mes" sub={`${trabajadoresMes(db, sedes, mes)} trabajadores`} valor={delMes.hht} previo={mesAnt?.hht} formato={(v) => fmtN(v, 0)} menorEsMejor={false} />
        </div>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">Índice de frecuencia por mes</h4>
            <Barras etiquetas={rango(0, mes).map((m) => MESES_C[m])} series={[{ nombre: 'IF', color: SERIE[0], valores: rango(0, mes).map((m) => Math.round(indicadores(db, { sedes, meses: [m], anio: ANIO }).IF * 100) / 100) }]} formato={f2} alto={190} meta={metas.IF} />
          </div>
          <div className="rp-analisis"><h4><AlertTriangle size={15} /> Análisis de KPIs</h4><ul>{bulletsKpi.map((b) => <li key={b}>{b}</li>)}</ul></div>
        </div>
      </section>

      <section className="rp-sec">
        <h2><span>2</span>TRIR y LTIR por operación</h2>
        <div className="rp-ops">
          {porSede.map(({ s, act, ant: a }) => (
            <div key={s} className={`rp-op ${act.TRIR > metas.TRIR ? 'mal' : ''}`}>
              <span>{nombreCorto(db, s)}</span>
              <strong>{f2(act.TRIR)}{a && act.TRIR !== a.TRIR && (act.TRIR < a.TRIR ? <TrendingDown size={15} className="ok-t" /> : <TrendingUp size={15} className="bad-t" />)}</strong>
              <em>{a ? `vs. ${MESES_C[ant]}: ${f2(a.TRIR)}` : ''}</em>
            </div>
          ))}
        </div>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">TRIR acumulado DMZ Corp.</h4>
            <Lineas etiquetas={rango(0, mes).map((m) => MESES_C[m])} series={[{ nombre: 'TRIR', color: SERIE[0], valores: rango(0, mes).map((m) => Math.round(indicadores(db, { sedes, meses: rango(0, m), anio: ANIO }).TRIR * 100) / 100) }]} meta={metas.TRIR} formato={f2} alto={190} />
          </div>
          <div className="rp-analisis"><h4><AlertTriangle size={15} /> Mensaje clave</h4>
            <ul>
              {ytdAnt && <li>El TRIR corporativo {tend(ytd.TRIR, ytdAnt.TRIR)}: pasa de {f2(ytdAnt.TRIR)} a {f2(ytd.TRIR)} (meta {metas.TRIR}).</li>}
              {mejoran.length > 0 && <li>Mejoran respecto al mes anterior: {mejoran.map((x) => `${nombreCorto(db, x.s)} (${f2(x.ant.TRIR)} → ${f2(x.act.TRIR)})`).join(', ')}.</li>}
              {empeoran.length > 0 && <li>Empeoran: {empeoran.map((x) => `${nombreCorto(db, x.s)} (${f2(x.ant.TRIR)} → ${f2(x.act.TRIR)})`).join(', ')}.</li>}
              {conTrir.filter((x) => x.act.TRIR > metas.TRIR).length > 0 && <li>Por encima de la meta: {conTrir.filter((x) => x.act.TRIR > metas.TRIR).map((x) => nombreCorto(db, x.s)).join(', ')}.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="rp-sec">
        <h2><span>3</span>Eventos y accidentabilidad</h2>
        <div className="rp-clases">
          {CLASES_REPORTE.map((c) => {
            const v = n(evMes, c); const p = mesAnt ? n(mesAnt.eventos, c) : null;
            return <div key={c} className="rp-clase" style={{ '--c': COLOR_CLASE[c] }}><span>{c}</span><strong>{String(v).padStart(2, '0')}{p != null && v !== p && <em className={v > p ? 'bad-t' : 'ok-t'}>{v > p ? '▲' : '▼'}</em>}</strong><em>vs. {MESES_C[ant] || '—'}: {p ?? '—'}</em></div>;
          })}
        </div>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">Eventos por tipo · YTD {ANIO}</h4>
            <Dona centro={evYtd.length} subcentro="eventos" tam={150} datos={CLASES_EVENTO.filter((c) => n(evYtd, c.id)).map((c) => ({ etiqueta: c.id, valor: n(evYtd, c.id), color: COLOR_CLASE[c.id] }))} />
          </div>
          <div className="rp-chart"><h4 className="h4">Eventos por unidad minera y talleres · YTD</h4>
            <Barras etiquetas={sedesEv.map((s) => nombreCorto(db, s))} alto={200} series={CLASES_EVENTO.filter((c) => n(evYtd, c.id)).map((c) => ({ nombre: c.id, color: COLOR_CLASE[c.id], valores: sedesEv.map((s) => evYtd.filter((e) => e.unidad === s && e.clase === c.id).length) }))} />
          </div>
        </div>
        <div className="rp-chart"><h4 className="h4">N.º de eventos por mes</h4>
          <Lineas etiquetas={rango(0, mes).map((m) => MESES_C[m])} series={[{ nombre: 'Eventos', color: SERIE[0], valores: rango(0, mes).map((m) => evYtd.filter((e) => mesDe(e.fecha) === m).length) }]} formato={(v) => Math.round(v)} alto={160} />
        </div>
        <h4 className="h4">Eventos de {MESES[mes].toLowerCase()} {ANIO}</h4>
        {evMes.length ? (
          <table className="table compact rp-tabla">
            <thead><tr><th>Fecha</th><th>Unidad minera / taller</th><th>Clasificación</th><th>Nombre del evento</th></tr></thead>
            <tbody>{evMes.map((e) => <tr key={e.id}><td className="nowrap">{fmtFecha(e.fecha)}</td><td>{nombreUnidad(db, e.unidad)}</td><td><span className="ev-clase"><i style={{ background: COLOR_CLASE[e.clase] }} />{e.clase}</span></td><td>{e.descripcion}</td></tr>)}</tbody>
          </table>
        ) : <p className="muted">No se registraron eventos en el mes.</p>}
      </section>

      <section className="rp-sec">
        <h2><span>4</span>Seguimiento a planes de acción de investigaciones</h2>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">N.º de planes de acción</h4>
            <Dona centro={planes.length} subcentro="planes" tam={150} datos={[{ etiqueta: 'Cerrado', valor: est('Cerrado'), color: COLOR_ESTADO.ok }, { etiqueta: 'Abierto fuera de fecha', valor: est('Abierto fuera de fecha'), color: COLOR_ESTADO.bad }, { etiqueta: 'En proceso', valor: est('En proceso'), color: COLOR_ESTADO.warn }]} />
          </div>
          <div className="rp-chart"><h4 className="h4">% de cierre de planes de acción por sede</h4>
            <BarrasH datos={pctCierre.sort((a, b) => b.pct - a.pct).map((x) => ({ etiqueta: nombreCorto(db, x.s), valor: x.pct, color: x.pct >= 80 ? COLOR_ESTADO.ok : x.pct >= 50 ? COLOR_ESTADO.warn : COLOR_ESTADO.bad }))} formato={(v) => `${v}%`} max={100} />
          </div>
        </div>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">Mayor número de días de retraso</h4>
            {peorRetraso.length ? <BarrasH datos={peorRetraso.slice(0, 5).map((x) => ({ etiqueta: nombreCorto(db, x.s), valor: x.retraso }))} formato={(v) => `${v} d`} color={SERIE[7]} /> : <p className="muted">Sin planes vencidos.</p>}
          </div>
          <div className="rp-analisis"><h4><AlertTriangle size={15} /> Alertas clave</h4>
            <ul>
              <li>De {planes.length} planes de acción, {est('Cerrado')} están cerrados ({Math.round((est('Cerrado') / (planes.length || 1)) * 100)}%); {est('Abierto fuera de fecha')} siguen abiertos fuera de fecha y {est('En proceso')} en proceso.</li>
              {peorRetraso[0] && <li>{nombreCorto(db, peorRetraso[0].s)} acumula el mayor retraso ({peorRetraso[0].retraso} días){peorRetraso[1] ? `, seguido de ${nombreCorto(db, peorRetraso[1].s)} (${peorRetraso[1].retraso} días)` : ''}.</li>}
              {pctCierre.filter((x) => x.pct < 50).length > 0 && <li>Requieren intervención prioritaria por su bajo cierre: {pctCierre.filter((x) => x.pct < 50).map((x) => `${nombreCorto(db, x.s)} (${x.pct}%)`).join(', ')}.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="rp-sec">
        <h2><span>5</span>Gestión preventiva · cumplimiento de controles operacionales</h2>
        <div className="kpi-row">
          <div className="kpi"><span className="kpi-t">Cumplimiento anual PASSO</span><strong>{passo}%</strong><span className="kpi-p">Avance de actividades del programa anual</span></div>
          <div className="kpi"><span className="kpi-t">Programa de inspecciones · {MESES_C[mes]}</span><strong className={inspMes.pct >= prog.meta ? 'ok-t' : 'bad-t'}>{fmtN(inspMes.pct, 1)}%</strong><span className="kpi-p">{inspMesAnt ? `vs. ${MESES_C[ant]}: ${fmtN(inspMesAnt.pct, 1)}%` : ''}</span></div>
          <div className="kpi"><span className="kpi-t">Programa de inspecciones · acumulado</span><strong>{fmtN(inspAcum.pct, 1)}%</strong><span className="kpi-p">Meta {prog.meta}%</span></div>
          <div className="kpi"><span className="kpi-t">SAC abiertas</span><strong>{ncAbiertas.length}</strong><span className="kpi-p">{ncAbiertas.filter((x) => estadoNc(x) === 'Vencido').length} con acciones vencidas</span></div>
        </div>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">Cumplimiento de inspecciones · {MESES[mes].toLowerCase()}</h4>
            <BarrasH datos={sedesProg.filter((s) => cumplimientoPrograma(prog, { sedes: [s.id], meses: [mes] }).prog > 0).map((s) => ({ etiqueta: s.nombre, valor: Math.round(cumplimientoPrograma(prog, { sedes: [s.id], meses: [mes] }).pct * 10) / 10 }))} formato={(v) => `${v}%`} meta={prog.meta} max={Math.max(100, ...sedesProg.map((s) => cumplimientoPrograma(prog, { sedes: [s.id], meses: [mes] }).pct))} />
          </div>
          <div className="rp-chart"><h4 className="h4">Programa anual de inspecciones · % ejecutado por mes</h4>
            <Lineas etiquetas={rango(0, mes).map((m) => MESES_C[m])} series={[{ nombre: '% ejecutado', color: SERIE[0], valores: rango(0, mes).map((m) => Math.round(cumplimientoPrograma(prog, { sedes: progIds, meses: [m] }).pct * 10) / 10) }]} meta={prog.meta} formato={(v) => `${Math.round(v)}%`} alto={190} />
          </div>
        </div>
        <div className="grid-2">
          <div className="rp-chart"><h4 className="h4">% status de observaciones por ubicación</h4>
            <Barras etiquetas={sedesHz.map((s) => nombreCorto(db, s))} alto={190} formato={(v) => `${v}%`}
              series={[{ nombre: 'Abierto fuera del plazo', color: COLOR_ESTADO.bad, valores: sedesHz.map((s) => Math.round((hz.filter((h) => h.sede === s && estadoHallazgo(h, finMes) === 'Abierto fuera del plazo').length / (hz.length || 1)) * 100)) },
                { nombre: 'Cerrado', color: COLOR_ESTADO.ok, valores: sedesHz.map((s) => Math.round((hz.filter((h) => h.sede === s && estadoHallazgo(h, finMes) === 'Cerrado').length / (hz.length || 1)) * 100)) }]} />
          </div>
          <div className="rp-analisis"><h4><AlertTriangle size={15} /> Alertas clave</h4>
            <ul>
              <li>El programa de inspecciones cumple {fmtN(inspMes.pct, 1)}% en {MESES[mes].toLowerCase()}{inspMesAnt ? ` (${fmtN(inspMesAnt.pct, 1)}% el mes anterior)` : ''} y {fmtN(inspAcum.pct, 1)}% acumulado, frente a la meta del {prog.meta}%.</li>
              {sedesProg.filter((s) => cumplimientoPrograma(prog, { sedes: [s.id], meses: rango(0, mes) }).pct < prog.meta).length > 0 && <li>Por debajo de la meta en el acumulado: {sedesProg.filter((s) => cumplimientoPrograma(prog, { sedes: [s.id], meses: rango(0, mes) }).pct < prog.meta).map((s) => `${s.nombre} (${fmtN(cumplimientoPrograma(prog, { sedes: [s.id], meses: rango(0, mes) }).pct, 1)}%)`).join(', ')}.</li>}
              {hzFuera[0]?.n > 0 && <li>{nombreCorto(db, hzFuera[0].s)} concentra más observaciones abiertas fuera de plazo ({hzFuera[0].n}).</li>}
            </ul>
          </div>
        </div>
      </section>

      {cartillas.length > 0 && (
        <section className="rp-sec">
          <h2><span>6</span>Cartillas de observación conductual</h2>
          <table className="table compact rp-tabla">
            <thead><tr><th>Unidad minera</th><th className="right">Programadas</th><th className="right">Ejecutadas</th><th className="right">Cumplimiento</th><th className="right">Observadores</th><th className="right">Conductas seguras</th></tr></thead>
            <tbody>
              {cartillas.map((c) => <tr key={c.sede}><td>{nombreUnidad(db, c.sede)}</td><td className="right">{c.programadas}</td><td className="right">{c.ejecutadas}</td><td className="right">{Math.round((c.ejecutadas / c.programadas) * 100)}%</td><td className="right">{c.observadores}</td><td className="right">{c.seguras}%</td></tr>)}
              <tr className="tr-total"><td>Total del mes</td><td className="right">{cartillas.reduce((s, c) => s + c.programadas, 0)}</td><td className="right">{cartillas.reduce((s, c) => s + c.ejecutadas, 0)}</td><td className="right">{Math.round((cartillas.reduce((s, c) => s + c.ejecutadas, 0) / cartillas.reduce((s, c) => s + c.programadas, 0)) * 100)}%</td><td /><td /></tr>
            </tbody>
          </table>
          <p className="muted small">Valoración: bueno 80–100 % · regular 60–79 % · bajo &lt; 60 %.</p>
        </section>
      )}
      <p className="rp-pie muted small">Fuente: sistema SSOMA DMZ · generado el {new Date().toLocaleDateString('es-PE')} · Fórmulas: IF e IG por 1 000 000 HHT; LTIR y TRIR por 200 000 HHT.</p>
    </div>
  );
}

