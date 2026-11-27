import { useState } from 'react';
import { useStore, nombreUnidad } from '../../store.jsx';
import { Card, Empty } from '../../components/ui.jsx';
import { Barras, BarrasH, Dona, COLOR_CLASE, SERIE } from '../../components/charts.jsx';
import { CLASES_EVENTO, MESES_C, MESES, ANIO, MES_ACTUAL, PARTES_CUERPO, GRUPOS_EDAD, ANTIGUEDADES, AREAS_EVENTO } from '../../data/seed3.js';
import { mesDe, anioDe, rango } from '../../lib/sgsst.js';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const corto = (c) => CLASES_EVENTO.find((x) => x.id === c)?.nombre.replace(/ \(.*\)/, '') || c;

// Pareto: ordena de mayor a menor y calcula el % acumulado
function Pareto({ datos }) {
  const tot = datos.reduce((s, d) => s + d.valor, 0) || 1;
  let acc = 0;
  const filas = [...datos].sort((a, b) => b.valor - a.valor).map((d) => { acc += d.valor; return { ...d, pct: d.valor / tot, acum: acc / tot }; });
  return (
    <table className="table compact">
      <thead><tr><th>Clasificación</th><th className="right">Cantidad</th><th className="right">%</th><th className="right">% acumulado</th><th /></tr></thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.etiqueta} className={f.acum - f.pct < 0.8 ? 'pareto-vital' : ''}>
            <td><span className="ev-clase"><i style={{ background: f.color }} />{f.etiqueta}</span></td>
            <td className="right">{f.valor}</td><td className="right">{Math.round(f.pct * 1000) / 10}%</td><td className="right">{Math.round(f.acum * 1000) / 10}%</td>
            <td style={{ width: 90 }}><div className="pareto-bar"><i style={{ width: `${f.pct * 100}%`, background: f.color }} /></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PanelEventos() {
  const { db, inScope } = useStore();
  const [hasta, setHasta] = useState(MES_ACTUAL);
  const ev = db.incidentes.filter((e) => inScope(e.unidad) && anioDe(e.fecha) === ANIO && mesDe(e.fecha) <= hasta);
  if (!ev.length) return <Empty>No hay eventos registrados en el año.</Empty>;
  const presentes = CLASES_EVENTO.filter((c) => ev.some((e) => e.clase === c.id));
  const sedes = [...new Set(ev.map((e) => e.unidad))];
  const meses = rango(0, hasta);
  const cuenta = (fn) => ev.filter(fn).length;
  const lesiones = ev.filter((e) => CLASES_EVENTO.find((c) => c.id === e.clase)?.grupo === 'lesion');
  const serieClase = (cats, fn) => presentes.map((c) => ({ nombre: c.id, color: COLOR_CLASE[c.id], valores: cats.map((x) => cuenta((e) => e.clase === c.id && fn(e, x))) }));
  const porDia = ORDEN_DIAS.map((d) => ({ etiqueta: DIAS[d], valor: cuenta((e) => new Date(e.fecha + 'T12:00:00Z').getUTCDay() === d) }));
  const trimestres = [0, 1, 2, 3].map((t) => cuenta((e) => Math.floor(mesDe(e.fecha) / 3) === t));

  return (
    <>
      <div className="tab-intro">
        <p className="muted">Panel de control de accidentes e incidentes {ANIO}: {ev.length} eventos hasta {MESES[hasta].toLowerCase()}. Los colores identifican la clasificación en todos los gráficos.</p>
        <select className="sel" value={hasta} onChange={(e) => setHasta(Number(e.target.value))} aria-label="Hasta el mes">{rango(0, MES_ACTUAL).map((m) => <option key={m} value={m}>Hasta {MESES[m].toLowerCase()}</option>)}</select>
      </div>
      <div className="grid-2">
        <Card title={`Eventos por tipo · YTD ${ANIO}`}>
          <Dona centro={ev.length} subcentro="eventos" datos={presentes.map((c) => ({ etiqueta: `${c.id} · ${corto(c.id)}`, valor: cuenta((e) => e.clase === c.id), color: COLOR_CLASE[c.id] }))} />
        </Card>
        <Card title="Eventos por mes">
          <Barras etiquetas={meses.map((m) => MESES_C[m])} series={serieClase(meses, (e, m) => mesDe(e.fecha) === m)} alto={230} />
        </Card>
      </div>
      <Card title="Tipo de evento por unidad minera y talleres">
        <Barras etiquetas={sedes.map((s) => nombreUnidad(db, s).replace('U.M. ', '').replace('DMZ ', ''))} series={serieClase(sedes, (e, s) => e.unidad === s)} alto={240} />
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>Ubicación</th>{presentes.map((c) => <th key={c.id} className="center" title={c.nombre}>{c.id}</th>)}<th className="right">Total</th><th className="right">%</th></tr></thead>
            <tbody>
              {sedes.map((s) => {
                const t = cuenta((e) => e.unidad === s);
                return <tr key={s}><td>{nombreUnidad(db, s)}</td>{presentes.map((c) => <td key={c.id} className="center">{cuenta((e) => e.unidad === s && e.clase === c.id) || ''}</td>)}<td className="right"><strong>{t}</strong></td><td className="right">{Math.round((t / ev.length) * 100)}%</td></tr>;
              })}
              <tr className="tr-total"><td>Total</td>{presentes.map((c) => <td key={c.id} className="center">{cuenta((e) => e.clase === c.id)}</td>)}<td className="right">{ev.length}</td><td className="right">100%</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid-2">
        <Card title="Análisis de Pareto · eventos con lesión">
          {lesiones.length ? <Pareto datos={CLASES_EVENTO.filter((c) => c.grupo === 'lesion').map((c) => ({ etiqueta: corto(c.id), valor: cuenta((e) => e.clase === c.id), color: COLOR_CLASE[c.id] }))} /> : <Empty>Sin eventos con lesión.</Empty>}
        </Card>
        <Card title="Análisis de Pareto · incidentes y daños">
          <Pareto datos={CLASES_EVENTO.filter((c) => c.grupo === 'incidente').map((c) => ({ etiqueta: corto(c.id), valor: cuenta((e) => e.clase === c.id), color: COLOR_CLASE[c.id] }))} />
          <p className="muted small">Sombreadas: las clasificaciones que suman el primer 80 %.</p>
        </Card>
      </div>
      <div className="grid-3">
        <Card title="Casos por área">
          <BarrasH datos={AREAS_EVENTO.map((a) => ({ etiqueta: a, valor: cuenta((e) => e.area === a) })).filter((d) => d.valor).sort((a, b) => b.valor - a.valor)} formato={(v) => v} />
        </Card>
        <Card title="Accidentes por día de la semana">
          <BarrasH datos={porDia} formato={(v) => v} color={SERIE[0]} />
        </Card>
        <Card title="Por turno y trimestre">
          <BarrasH datos={[{ etiqueta: 'Día', valor: cuenta((e) => e.turno !== 'Noche') }, { etiqueta: 'Noche', valor: cuenta((e) => e.turno === 'Noche') }]} formato={(v) => `${v} (${Math.round((v / ev.length) * 100)}%)`} color={SERIE[6]} />
          <div style={{ height: 12 }} />
          <BarrasH datos={trimestres.map((v, i) => ({ etiqueta: `Trimestre ${i + 1}`, valor: v }))} formato={(v) => v} color={SERIE[2]} />
        </Card>
      </div>
      <Card title={`Perfil de los ${lesiones.length} eventos con lesión`}>
        <div className="grid-4">
          <div><h4 className="h4">Parte del cuerpo</h4><BarrasH datos={PARTES_CUERPO.map((p) => ({ etiqueta: p, valor: lesiones.filter((e) => e.parteCuerpo === p).length }))} formato={(v) => v} color={SERIE[7]} /></div>
          <div><h4 className="h4">Grupo de edad</h4><BarrasH datos={[...GRUPOS_EDAD, null].map((g) => ({ etiqueta: g || 'Sin datos', valor: lesiones.filter((e) => (e.edad || null) === g).length }))} formato={(v) => v} color={SERIE[0]} /></div>
          <div><h4 className="h4">Antigüedad</h4><BarrasH datos={[...ANTIGUEDADES, null].map((g) => ({ etiqueta: g || 'Sin datos', valor: lesiones.filter((e) => (e.antiguedad || null) === g).length }))} formato={(v) => v} color={SERIE[0]} /></div>
          <div><h4 className="h4">Género</h4><BarrasH datos={['Hombre', 'Mujer', null].map((g) => ({ etiqueta: g || 'Sin datos', valor: lesiones.filter((e) => (e.genero || null) === g).length }))} formato={(v) => v} color={SERIE[0]} /></div>
        </div>
        <p className="muted small">«Sin datos» muestra los registros incompletos: el formulario de reporte ahora pide estos campos para que el perfil sea confiable.</p>
      </Card>
    </>
  );
}
