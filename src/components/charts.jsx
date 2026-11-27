import { useEffect, useRef, useState } from 'react';

// Ancho real del contenedor: el gráfico se dibuja a escala 1:1 para que el texto no se agrande
function useAncho(def = 640) {
  const ref = useRef(null);
  const [w, setW] = useState(def);
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => { const x = Math.round(e.contentRect.width); if (x > 0) setW(x); });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// Paleta categórica (orden fijo, validada para daltonismo) y colores por clase de evento.
// El color sigue a la entidad, nunca a su posición.
export const SERIE = ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac', '#008a17', '#6a4ce2', '#ec4647'];
export const COLOR_CLASE = { LTI: '#ec4647', WRC: '#f47230', MTC: '#6a4ce2', FAC: '#f2a600', PD: '#257de0', NM: '#ee7fac', HPH: '#008a17', FAT: '#5b2333', INC: '#00b894', MA: '#00b894', PP: '#00b894', NWR: '#98a2b3', EO: '#98a2b3', ENR: '#98a2b3' };
export const COLOR_ESTADO = { ok: '#15803d', warn: '#d97706', bad: '#c0262d', info: '#257de0', muted: '#98a2b3' };

const fmtDef = (v) => (Math.round(v * 100) / 100).toLocaleString('es-PE');

function Tip({ tip }) {
  if (!tip) return null;
  return (
    <div className="ch-tip" style={{ left: tip.x, top: tip.y }}>
      {tip.titulo && <strong>{tip.titulo}</strong>}
      {tip.filas.map((f, i) => (
        <div key={i}>{f.color && <i style={{ background: f.color }} />}<span>{f.label}</span><b>{f.valor}</b></div>
      ))}
    </div>
  );
}

export function Leyenda({ items }) {
  return (
    <div className="ch-legend">
      {items.map((i) => <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>)}
    </div>
  );
}

const escala = (max) => {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const p = 10 ** Math.floor(Math.log10(max));
  const paso = [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => max / k <= 5) || 10 * p;
  const top = Math.ceil(max / paso) * paso;
  return { top, ticks: Array.from({ length: Math.round(top / paso) + 1 }, (_, i) => i * paso) };
};

// Barras verticales (simples o apiladas). series: [{ nombre, color, valores[] }]
export function Barras({ etiquetas, series, alto = 220, formato = fmtDef, meta, etiquetaMeta = 'Meta', mostrarValores = true, maxFijo }) {
  const [tip, setTip] = useState(null);
  const [ref, W] = useAncho();
  const H = alto; const pl = 36; const pb = 34; const pt = 14;
  const totales = etiquetas.map((_, i) => series.reduce((s, se) => s + (se.valores[i] || 0), 0));
  const { top, ticks } = escala(Math.max(maxFijo || 0, ...totales, meta || 0));
  const ancho = (W - pl - 8) / etiquetas.length;
  const bw = Math.min(46, ancho * 0.62);
  const y = (v) => pt + (H - pt - pb) * (1 - v / top);
  return (
    <div className="ch" ref={ref} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {ticks.map((t) => <g key={t}><line x1={pl} x2={W - 4} y1={y(t)} y2={y(t)} className="ch-grid" /><text x={pl - 6} y={y(t) + 4} className="ch-ax" textAnchor="end">{formato(t)}</text></g>)}
        {etiquetas.map((e, i) => {
          let acc = 0;
          const cx = pl + ancho * i + ancho / 2;
          const segs = series.map((se) => { const v = se.valores[i] || 0; const r = { se, v, y0: acc }; acc += v; return r; }).filter((s) => s.v > 0);
          return (
            <g key={e} onMouseMove={(ev) => {
              const b = ev.currentTarget.ownerSVGElement.getBoundingClientRect();
              setTip({ x: ev.clientX - b.left + 12, y: ev.clientY - b.top - 10, titulo: e, filas: series.filter((s) => s.valores[i]).map((s) => ({ label: s.nombre, valor: formato(s.valores[i]), color: series.length > 1 ? s.color : null })) });
            }}>
              <rect x={pl + ancho * i} y={pt} width={ancho} height={H - pt - pb} fill="transparent" />
              {segs.map((s, k) => {
                const ya = y(s.y0 + s.v); const h = y(s.y0) - ya;
                const ultimo = k === segs.length - 1;
                return <rect key={s.se.nombre} x={cx - bw / 2} y={ya + (k ? 0 : 0)} width={bw} height={Math.max(0, h - (ultimo ? 0 : 2))} rx={ultimo ? 4 : 0} fill={s.se.color} />;
              })}
              {mostrarValores && totales[i] > 0 && <text x={cx} y={y(totales[i]) - 5} className="ch-val" textAnchor="middle">{formato(totales[i])}</text>}
              <text x={cx} y={H - pb + 16} className="ch-ax" textAnchor="middle">{e.length > Math.max(4, Math.floor(ancho / 6.5)) ? e.slice(0, Math.max(3, Math.floor(ancho / 6.5) - 1)) + '…' : e}</text>
            </g>
          );
        })}
        {meta != null && <g><line x1={pl} x2={W - 4} y1={y(meta)} y2={y(meta)} className="ch-meta" /><text x={W - 6} y={y(meta) - 5} className="ch-meta-t" textAnchor="end">{etiquetaMeta} {formato(meta)}</text></g>}
      </svg>
      {series.length > 1 && <Leyenda items={series.map((s) => ({ label: s.nombre, color: s.color }))} />}
      <Tip tip={tip} />
    </div>
  );
}

// Barras horizontales: datos [{ etiqueta, valor, color? }]
export function BarrasH({ datos, formato = fmtDef, color = SERIE[0], max, meta }) {
  const tope = max || Math.max(...datos.map((d) => d.valor), meta || 0, 1);
  return (
    <div className="ch-h">
      {datos.map((d) => (
        <div key={d.etiqueta} className="ch-h-row" title={`${d.etiqueta}: ${formato(d.valor)}`}>
          <span className="ch-h-l">{d.etiqueta}</span>
          <div className="ch-h-track">
            <div className="ch-h-bar" style={{ width: `${Math.min(100, (d.valor / tope) * 100)}%`, background: d.color || color }} />
            {meta != null && <i className="ch-h-meta" style={{ left: `${Math.min(100, (meta / tope) * 100)}%` }} />}
          </div>
          <b className="ch-h-v">{formato(d.valor)}</b>
        </div>
      ))}
    </div>
  );
}

// Líneas: series [{ nombre, color, valores[] (null = sin dato) }]
export function Lineas({ etiquetas, series, alto = 220, formato = fmtDef, meta, etiquetaMeta = 'Meta', min0 = true }) {
  const [hover, setHover] = useState(null);
  const [ref, W] = useAncho();
  const H = alto; const pl = 40; const pb = 30; const pt = 16; const pr = 12;
  const vals = series.flatMap((s) => s.valores.filter((v) => v != null));
  const { top, ticks } = escala(Math.max(...vals, meta || 0, min0 ? 0 : 1));
  const x = (i) => pl + ((W - pl - pr) * i) / Math.max(1, etiquetas.length - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - v / top);
  return (
    <div className="ch" ref={ref} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        onMouseMove={(ev) => {
          const b = ev.currentTarget.getBoundingClientRect();
          const px = ((ev.clientX - b.left) / b.width) * W;
          const i = Math.max(0, Math.min(etiquetas.length - 1, Math.round(((px - pl) / (W - pl - pr)) * (etiquetas.length - 1))));
          setHover({ i, x: ev.clientX - b.left + 12, y: ev.clientY - b.top - 10 });
        }}>
        {ticks.map((t) => <g key={t}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="ch-grid" /><text x={pl - 6} y={y(t) + 4} className="ch-ax" textAnchor="end">{formato(t)}</text></g>)}
        {etiquetas.map((e, i) => <text key={e} x={x(i)} y={H - 10} className="ch-ax" textAnchor="middle">{e}</text>)}
        {meta != null && <g><line x1={pl} x2={W - pr} y1={y(meta)} y2={y(meta)} className="ch-meta" /><text x={pl + 6} y={y(meta) - 5} className="ch-meta-t">{etiquetaMeta} {formato(meta)}</text></g>}
        {hover && <line x1={x(hover.i)} x2={x(hover.i)} y1={pt} y2={H - pb} className="ch-cross" />}
        {series.map((s) => {
          const pts = s.valores.map((v, i) => (v == null ? null : [x(i), y(v)]));
          const d = pts.reduce((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? 'L' : 'M'}${p[0]},${p[1]}` : acc), '');
          const ult = pts.map((p, i) => (p ? i : -1)).filter((i) => i >= 0).pop();
          return (
            <g key={s.nombre}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r={hover?.i === i ? 5 : 3.5} fill={s.color} stroke="#fff" strokeWidth="2" />)}
              {ult != null && series.length === 1 && <text x={pts[ult][0]} y={pts[ult][1] - 10} className="ch-val" textAnchor="middle">{formato(s.valores[ult])}</text>}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && <Leyenda items={series.map((s) => ({ label: s.nombre, color: s.color }))} />}
      {hover && <Tip tip={{ x: hover.x, y: hover.y, titulo: etiquetas[hover.i], filas: series.filter((s) => s.valores[hover.i] != null).map((s) => ({ label: s.nombre, valor: formato(s.valores[hover.i]), color: s.color })) }} />}
    </div>
  );
}

// Dona: datos [{ etiqueta, valor, color }]
export function Dona({ datos, centro, subcentro, tam = 170 }) {
  const [hover, setHover] = useState(null);
  const total = datos.reduce((s, d) => s + d.valor, 0) || 1;
  const r = 70; const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="ch-dona">
      <svg viewBox="0 0 180 180" width={tam} height={tam} role="img">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#eef1f5" strokeWidth="22" />
        {datos.filter((d) => d.valor > 0).map((d) => {
          const len = (d.valor / total) * c;
          const el = (
            <circle key={d.etiqueta} cx="90" cy="90" r={r} fill="none" stroke={d.color} strokeWidth={hover === d.etiqueta ? 26 : 22}
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`} strokeDashoffset={-acc} transform="rotate(-90 90 90)"
              onMouseEnter={() => setHover(d.etiqueta)} onMouseLeave={() => setHover(null)}>
              <title>{`${d.etiqueta}: ${d.valor} (${Math.round((d.valor / total) * 100)}%)`}</title>
            </circle>
          );
          acc += len;
          return el;
        })}
        <text x="90" y="86" textAnchor="middle" className="ch-dona-n">{centro}</text>
        <text x="90" y="106" textAnchor="middle" className="ch-dona-s">{subcentro}</text>
      </svg>
      <div className="ch-dona-leg">
        {datos.map((d) => (
          <div key={d.etiqueta} className={hover === d.etiqueta ? 'on' : ''} onMouseEnter={() => setHover(d.etiqueta)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: d.color }} /><span>{d.etiqueta}</span><b>{d.valor}</b><em>{Math.round((d.valor / total) * 100)}%</em>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tarjeta de indicador con comparación contra el periodo anterior
export function Kpi({ titulo, sub, valor, previo, formato = fmtDef, menorEsMejor = true, meta, alerta }) {
  const delta = previo == null ? null : valor - previo;
  const mejora = delta == null || delta === 0 ? null : menorEsMejor ? delta < 0 : delta > 0;
  return (
    <div className={`kpi ${alerta ? 'alerta' : ''}`}>
      <span className="kpi-t">{titulo}</span>
      {sub && <span className="kpi-s">{sub}</span>}
      <strong>{formato(valor)}{delta != null && delta !== 0 && <em className={mejora ? 'up-ok' : 'up-bad'}>{delta > 0 ? '▲' : '▼'}</em>}</strong>
      {meta != null && <span className="kpi-m">Meta {formato(meta)}</span>}
      {previo != null && <span className="kpi-p">Mes anterior: {formato(previo)}</span>}
    </div>
  );
}
