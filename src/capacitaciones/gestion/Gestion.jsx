import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Bell, Plus, Download, Star, Users, BookOpen, Award, RotateCcw, CalendarPlus, FileText, Presentation, ChevronRight } from 'lucide-react';
import { useCap, participantes, estadoCurso, fFecha, diasHasta, addDias, cursosDe, correctasDe } from '../store.jsx';
import { CURSOS, curso as getCurso, totalPreguntas } from '../data.js';
import { accesosDe, iniciales } from '../../acceso/db.jsx';
import { AREAS } from '../../acceso/seed.js';
import { PageHeader, Card, Stat, Badge, Modal, Field, Empty, Progress } from '../../components/ui.jsx';
import Certificado from '../movil/Certificado.jsx';

const TONO = { Aprobado: 'ok', 'En curso': 'info', 'Sin empezar': 'muted', Vencido: 'bad', 'No aprobado': 'bad' };

// Personas que ve el usuario: el supervisor solo su área; el administrador, todas
export function useAlcance() {
  const { db, acc, persona, rol } = useCap();
  return useMemo(() => {
    const gente = participantes(acc).filter((t) => t.activo && (rol === 'admin' || t.area === persona.area) && t.dni !== persona.dni);
    const filas = gente.flatMap((t) => db.asignaciones.filter((a) => a.areas.includes(t.area)).map((a) => ({ t, ...estadoCurso(db, t.dni, a) })));
    const asig = db.asignaciones.filter((a) => rol === 'admin' || a.areas.includes(persona.area));
    return { gente, filas, asig };
  }, [db, acc, persona, rol]);
}

function resumenAsig(filas, a) {
  const f = filas.filter((x) => x.a.id === a.id);
  const ap = f.filter((x) => x.p.aprobado).length;
  return { f, n: f.length, ap, enc: f.filter((x) => x.estado === 'En curso').length, sin: f.filter((x) => x.estado === 'Sin empezar').length, pct: f.length ? Math.round(f.reduce((s, x) => s + x.avance, 0) / f.length) : 0 };
}

// ---------- Inicio ----------
export function GInicio() {
  const { persona, rol } = useCap();
  const { gente, filas, asig } = useAlcance();
  const activas = asig.filter((a) => diasHasta(a.cierre) >= -7).sort((a, b) => a.cierre.localeCompare(b.cierre));
  const porVencer = filas.filter((x) => x.p.cert && diasHasta(x.p.cert.vence) >= 0 && diasHasta(x.p.cert.vence) <= 30);
  const pendientes = filas.filter((x) => !x.p.aprobado);
  const atrasados = filas.filter((x) => x.estado === 'Vencido' || x.estado === 'No aprobado');
  const avance = filas.length ? Math.round(filas.reduce((s, x) => s + x.avance, 0) / filas.length) : 0;
  return (
    <>
      <PageHeader title={`Hola, ${persona.nombre.split(' ')[0]}`} subtitle={rol === 'admin' ? 'Avance de capacitación de toda la empresa.' : `Avance de capacitación de tu personal · ${persona.area}.`}
        actions={<Link to="/programacion" className="btn btn-primary"><CalendarPlus size={15} /> Programar</Link>} />
      <div className="stats">
        <Stat label={rol === 'admin' ? 'Personas con cursos' : 'Mi personal'} value={gente.length} />
        <Stat label="Avance general" value={`${avance}%`} tone={avance >= 70 ? 'ok' : 'warn'} hint="Promedio de todos los cursos asignados" />
        <Stat label="Cursos por terminar" value={pendientes.length} hint="Asignaciones sin aprobar" />
        <Stat label="Certificados por vencer" value={porVencer.length} tone={porVencer.length ? 'warn' : ''} hint="En los próximos 30 días" />
        <Stat label="Vencidos o no aprobados" value={atrasados.length} tone={atrasados.length ? 'bad' : ''} />
      </div>
      <Card title="Cursos en curso" actions={<Link className="link small" to="/cursos">Ver todos</Link>}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Curso</th><th>Personas</th><th>Aprobados</th><th>En curso</th><th>Sin empezar</th><th style={{ width: 180 }}>Avance</th><th>Cierre</th></tr></thead>
            <tbody>
              {activas.map((a) => {
                const r = resumenAsig(filas, a); const c = getCurso(a.cursoId); const d = diasHasta(a.cierre);
                return (
                  <tr key={a.id}>
                    <td><strong>{c.nombre}</strong><div className="muted small">{a.areas.length > 3 ? 'Todas las áreas' : a.areas.join(', ')}</div></td>
                    <td>{r.n}</td><td>{r.ap}</td><td>{r.enc}</td><td>{r.sin}</td>
                    <td><Progress value={r.pct} /><span className="small muted">{r.pct}%</span></td>
                    <td>{fFecha(a.cierre)}<div>{d < 0 ? <Badge tone="bad">Cerró</Badge> : <Badge tone={d <= 15 ? 'warn' : 'muted'}>{d} días</Badge>}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!activas.length && <Empty>No hay cursos en curso.</Empty>}
        </div>
      </Card>
      <div className="grid-2">
        <Card title="Certificados por vencer">
          {porVencer.slice(0, 6).map((x) => (
            <div key={x.t.dni + x.c.id} className="row-link static">
              <div className="person"><div className="avatar">{iniciales(x.t.nombre)}</div></div>
              <div className="grow"><strong>{x.t.nombre}</strong><span className="muted small">{x.c.nombre}</span></div>
              <Badge tone="warn">{diasHasta(x.p.cert.vence)} días</Badge>
            </div>
          ))}
          {!porVencer.length && <Empty>Ningún certificado vence en los próximos 30 días.</Empty>}
          {porVencer.length > 6 && <Link className="link small" to="/certificados?f=por-vencer">Ver los {porVencer.length}</Link>}
        </Card>
        <Card title="Avance por área">
          <div className="bars">
            {AREAS.filter((ar) => gente.some((t) => t.area === ar)).map((ar) => {
              const f = filas.filter((x) => x.t.area === ar);
              const v = f.length ? Math.round(f.reduce((s, x) => s + x.avance, 0) / f.length) : 0;
              return (
                <div className="bar-row" key={ar} style={{ gridTemplateColumns: '150px 1fr 44px' }}>
                  <span className="bar-label">{ar}</span>
                  <div className="bar-track"><div className={`bar-fill ${v >= 70 ? 'ok' : 'warn'}`} style={{ width: `${v}%` }} /></div>
                  <span className="bar-val">{v}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------- Personal ----------
export function GPersonal() {
  const { db, rol, notify, update } = useCap();
  const { gente } = useAlcance();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [f, setF] = useState(params.get('f') || 'todos');
  const [area, setArea] = useState('');
  const [ver, setVer] = useState(null);
  const filas = gente.map((t) => {
    const cs = cursosDe(db, t);
    const ap = cs.filter((x) => x.p.aprobado).length;
    const malos = cs.filter((x) => x.estado === 'Vencido' || x.estado === 'No aprobado').length;
    const prox = cs.filter((x) => !x.p.aprobado && x.dias >= 0).sort((a, b) => a.dias - b.dias)[0];
    const av = cs.length ? Math.round(cs.reduce((s, x) => s + x.avance, 0) / cs.length) : 0;
    return { t, cs, ap, malos, prox, av, estado: malos ? 'Atrasado' : ap === cs.length ? 'Al día' : 'Con pendientes' };
  }).filter((r) => (f === 'todos' || (f === 'atrasado' && r.estado === 'Atrasado') || (f === 'pend' && r.estado === 'Con pendientes') || (f === 'ok' && r.estado === 'Al día'))
    && (!area || r.t.area === area) && (!q || `${r.t.nombre} ${r.t.dni} ${r.t.cargo}`.toLowerCase().includes(q.toLowerCase())));
  const recordar = (lista) => {
    update((d) => { d.recordatorios.push({ id: `r${Date.now()}`, cursoId: null, fecha: addDias(0), texto: 'Recordatorio de cursos pendientes', a: `${lista.length} personas`, area: '' }); });
    notify(`Recordatorio enviado por WhatsApp y correo a ${lista.length} ${lista.length === 1 ? 'persona' : 'personas'}`);
  };
  return (
    <>
      <PageHeader title={rol === 'admin' ? 'Personal' : 'Mi personal'} subtitle="Avance de cada persona en sus cursos asignados."
        actions={<button className="btn" onClick={() => recordar(filas.filter((r) => r.estado !== 'Al día'))}><Bell size={15} /> Recordar a quienes tienen pendientes</button>} />
      <div className="tabs">
        {[['todos', 'Todos'], ['pend', 'Con pendientes'], ['atrasado', 'Atrasados'], ['ok', 'Al día']].map(([k, l]) => <button key={k} className={f === k ? 'active' : ''} onClick={() => setF(k)}>{l}</button>)}
      </div>
      <div className="toolbar">
        <div className="search"><Search size={15} /><input placeholder="Buscar por nombre, DNI o cargo" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {rol === 'admin' && <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área"><option value="">Todas las áreas</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>}
        <span className="muted small">{filas.length} personas</span>
      </div>
      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Trabajador</th><th>Área y cargo</th><th>Aprobados</th><th>Próximo cierre</th><th style={{ width: 160 }}>Avance</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {filas.map((r) => (
                <tr key={r.t.dni}>
                  <td><div className="person"><div className="avatar">{iniciales(r.t.nombre)}</div><div><strong>{r.t.nombre}</strong><span>DNI {r.t.dni}</span></div></div></td>
                  <td>{r.t.area}<div className="muted small">{r.t.cargo}</div></td>
                  <td>{r.ap} de {r.cs.length}</td>
                  <td>{r.prox ? <>{r.prox.c.nombre}<div className="muted small">{fFecha(r.prox.a.cierre)} · {r.prox.dias} días</div></> : <span className="muted">—</span>}</td>
                  <td><Progress value={r.av} /><span className="small muted">{r.av}%</span></td>
                  <td><Badge tone={r.estado === 'Al día' ? 'ok' : r.estado === 'Atrasado' ? 'bad' : 'warn'}>{r.estado}</Badge></td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setVer(r.t)}>Ver detalle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filas.length && <Empty>No hay personas con estos filtros.</Empty>}
        </div>
      </Card>
      {ver && <DetallePersona t={ver} onClose={() => setVer(null)} onRecordar={() => recordar([ver])} />}
    </>
  );
}

function DetallePersona({ t, onClose, onRecordar }) {
  const { db, rol, update, notify } = useCap();
  const cs = cursosDe(db, t);
  const [cert, setCert] = useState(null);
  return (
    <Modal title={t.nombre} wide onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cerrar</button><button className="btn btn-primary" onClick={onRecordar}><Bell size={15} /> Enviar recordatorio</button></>}>
      <p className="muted" style={{ marginTop: 0 }}>DNI {t.dni} · {t.cargo} · {t.area} · {t.unidad}</p>
      <table className="table">
        <thead><tr><th>Curso</th><th>Estado</th><th>Avance</th><th>Nota</th><th>Cierre</th><th>Certificado</th><th /></tr></thead>
        <tbody>
          {cs.map((x) => (
            <tr key={x.c.id}>
              <td><strong>{x.c.nombre}</strong><div className="muted small">{x.completos} de {x.c.modulos.length} módulos · {x.p.intentos.length} de {x.maxIntentos} intentos</div></td>
              <td><Badge tone={TONO[x.estado]}>{x.estado}</Badge></td>
              <td style={{ width: 120 }}><Progress value={x.avance} /><span className="small muted">{x.avance}%</span></td>
              <td>{x.ultimo ? `${x.ultimo.nota}/20` : '—'}</td>
              <td className="small">{fFecha(x.a.cierre)}</td>
              <td className="small">{x.p.cert ? <button className="link" onClick={() => setCert(x)}>{x.p.cert.codigo}</button> : <span className="muted">—</span>}<div className="muted">{x.p.cert ? `vence ${fFecha(x.p.cert.vence)}` : ''}</div></td>
              <td className="right">{rol === 'admin' && x.estado === 'No aprobado' && (
                <button className="btn btn-sm" onClick={() => { update((d) => { d.extras[`${t.dni}:${x.c.id}`] = (d.extras[`${t.dni}:${x.c.id}`] || 0) + 1; const p = d.progreso[t.dni][x.c.id]; correctasDe(x.c, p).porModulo.forEach((y) => { if (y.n < y.total) p.mod[y.m.id].resp = null; }); p.cerrado = false; }); notify('Se habilitó un intento más'); }}>
                  <RotateCcw size={13} /> Habilitar intento
                </button>
              )}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {cert && <div style={{ marginTop: 16, maxWidth: 520 }}><Certificado persona={t} x={cert} /></div>}
    </Modal>
  );
}

// ---------- Cursos ----------
export function GCursos() {
  const { db, rol, persona } = useCap();
  const { filas } = useAlcance();
  const [ver, setVer] = useState(null);
  const lista = CURSOS.filter((c) => rol === 'admin' || c.areas.includes(persona.area));
  return (
    <>
      <PageHeader title={rol === 'admin' ? 'Cursos' : 'Cursos del área'} subtitle="Cada curso se arma con videos por módulo y 3 preguntas al final de cada video. Nota final mínima 14/20." />
      <div className="cards">
        {lista.map((c) => {
          const f = filas.filter((x) => x.c.id === c.id);
          const ap = f.filter((x) => x.p.aprobado).length;
          const enc = f.filter((x) => x.p.encuesta);
          const prom = enc.length ? (enc.reduce((s, x) => s + x.p.encuesta.estrellas, 0) / enc.length).toFixed(1) : '—';
          const a = db.asignaciones.filter((y) => y.cursoId === c.id).sort((x, y) => y.cierre.localeCompare(x.cierre))[0];
          return (
            <div key={c.id} style={{ '--c': c.color }}>
              <Card className="grupo-card" title={c.nombre} actions={<span className="badge badge-muted">{c.codigo}</span>}>
                <p className="muted" style={{ marginTop: 0 }}>{c.desc}</p>
                <div className="mini-stats">
                  <div><strong>{c.modulos.length}</strong><span>videos</span></div>
                  <div><strong>{totalPreguntas(c)}</strong><span>preguntas</span></div>
                  <div><strong>{f.length ? Math.round((ap / f.length) * 100) : 0}%</strong><span>aprobados</span></div>
                  <div><strong>{prom}</strong><span>satisfacción</span></div>
                </div>
                <p className="small muted">{a ? `Asignación: ${fFecha(a.inicio)} – ${fFecha(a.cierre)}` : 'Sin asignación'} · Certificado válido {c.vigencia} meses</p>
                <button className="btn btn-sm" onClick={() => setVer(c)}>Ver detalle <ChevronRight size={14} /></button>
              </Card>
            </div>
          );
        })}
      </div>
      {ver && <DetalleCurso c={ver} filas={filas.filter((x) => x.c.id === ver.id)} onClose={() => setVer(null)} />}
    </>
  );
}

function DetalleCurso({ c, filas, onClose }) {
  const enc = filas.filter((x) => x.p.encuesta).sort((a, b) => b.p.encuesta.fecha.localeCompare(a.p.encuesta.fecha));
  const est = (e) => filas.filter((x) => x.estado === e).length;
  return (
    <Modal title={c.nombre} wide onClose={onClose}>
      <div className="mini-stats" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {['Aprobado', 'En curso', 'Sin empezar', 'Vencido', 'No aprobado'].map((e) => <div key={e}><strong>{est(e)}</strong><span>{e}</span></div>)}
      </div>
      <div className="grid-2 tight" style={{ marginTop: 14 }}>
        <div>
          <h4 className="h4">Módulos</h4>
          {c.modulos.map((m, i) => (
            <div key={m.id} className="row-link static">
              <span className="badge badge-info">{i + 1}</span>
              <div className="grow"><strong>{m.titulo}</strong><span className="muted small">Video {m.min} min · {m.preguntas.length} preguntas · {m.recursos.length} recursos</span>
                <div>{m.recursos.map((r) => <span key={r.nombre} className="acc-tag" style={{ marginRight: 4 }}>{r.tipo === 'PPT' ? <Presentation size={11} /> : <FileText size={11} />} {r.nombre}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h4 className="h4">Encuesta de satisfacción · {enc.length} respuestas</h4>
          {enc.slice(0, 5).map((x) => (
            <div key={x.t.dni} className="row-link static">
              <div className="grow"><strong>{x.t.nombre}</strong><span className="muted small">«{x.p.encuesta.texto}»</span></div>
              <span className="nowrap">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} fill={n <= x.p.encuesta.estrellas ? '#F4C400' : 'none'} color="#e3a008" />)}</span>
            </div>
          ))}
          {!enc.length && <Empty>Aún no hay respuestas.</Empty>}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Programación (próximas fechas) ----------
export function GProgramacion() {
  const { db, acc, rol, persona, update, notify } = useCap();
  const { filas, asig } = useAlcance();
  const [rango, setRango] = useState(31);
  const [nuevo, setNuevo] = useState(false);
  const ev = [];
  asig.forEach((a) => {
    const c = getCurso(a.cursoId); const r = resumenAsig(filas, a);
    ev.push({ f: a.inicio, tipo: 'Asignación', tono: 'info', t: c.nombre, d: `${r.n} trabajadores · ${a.areas.length > 3 ? 'todas las áreas' : a.areas.join(', ')}`, btn: 'Ver personas', to: '/personal' });
    ev.push({ f: a.cierre, tipo: 'Cierre de curso', tono: 'bad', t: `Cierre: ${c.nombre}`, d: `${r.n - r.ap} de ${r.n} personas aún no terminan`, btn: 'Ver avance', to: '/personal?f=pend' });
  });
  const venc = {};
  filas.filter((x) => x.p.cert).forEach((x) => { const k = `${x.p.cert.vence}|${x.c.id}`; (venc[k] = venc[k] || []).push(x); });
  Object.values(venc).forEach((xs) => {
    const corto = (t) => `${t.nombre.split(' ')[0][0]}. ${t.nombre.split(' ')[1]}`;
    ev.push({ f: xs[0].p.cert.vence, tipo: 'Vencimiento', tono: 'warn', n: xs.length,
      t: xs.length === 1 ? `Vence certificado de ${corto(xs[0].t)}` : `Vencen ${xs.length} certificados`,
      d: `${xs[0].c.nombre}${xs.length > 1 ? ` · ${xs.slice(0, 3).map((x) => corto(x.t)).join(', ')}${xs.length > 3 ? '…' : ''}` : ''}`, btn: 'Reprogramar', to: '/certificados?f=por-vencer' });
  });
  db.recordatorios.filter((r) => rol === 'admin' || !r.area || r.area === persona.area).forEach((r) => ev.push({ f: r.fecha, tipo: 'Recordatorio', tono: 'muted', t: r.texto, d: `Se envía a: ${r.a}`, btn: 'Ver', to: '/personal' }));
  const vis = ev.filter((e) => diasHasta(e.f) >= -14 && diasHasta(e.f) <= rango).sort((a, b) => a.f.localeCompare(b.f));
  const dow = (new Date().getDay() + 6) % 7;
  const grupos = [
    ['Esta semana', (d) => d >= 0 && d <= 6 - dow],
    ['Próxima semana', (d) => d > 6 - dow && d <= 13 - dow],
    [rango > 31 ? 'Más adelante' : 'Resto del mes', (d) => d > 13 - dow],
    ['Ya pasaron', (d) => d < 0],
  ];
  const cuenta = (t) => vis.filter((e) => e.tipo === t && diasHasta(e.f) >= 0).reduce((a, e) => a + (e.n || 1), 0);
  return (
    <>
      <PageHeader title="Próximas fechas" subtitle={`${new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })} · lo que vence o cierra ${rol === 'admin' ? 'en la empresa' : 'en tu área'}`}
        actions={<>
          <div className="seg seg-rango">{[[31, 'Este mes'], [92, 'Próximos 3 meses']].map(([v, l]) => <button key={v} className={rango === v ? 'on' : ''} onClick={() => setRango(v)}>{l}</button>)}</div>
          <button className="btn btn-primary" onClick={() => setNuevo(true)}><Plus size={15} /> Programar</button>
        </>} />
      <div className="stats">
        <Stat label="Cierres de curso" value={cuenta('Cierre de curso')} tone="bad" />
        <Stat label="Certificados por vencer" value={cuenta('Vencimiento')} tone="warn" />
        <Stat label="Asignaciones nuevas" value={cuenta('Asignación')} />
        <Stat label="Recordatorios programados" value={cuenta('Recordatorio')} />
      </div>
      {grupos.map(([g, fn]) => {
        const es = vis.filter((e) => fn(diasHasta(e.f)));
        if (!es.length) return null;
        return (
          <Card key={g} title={g} className={g === 'Ya pasaron' ? 'pasado' : ''}>
            {es.slice(0, 12).map((e, i) => (
              <div key={i} className="ev">
                <div className="ev-cal"><b>{new Date(e.f + 'T00:00:00').getDate()}</b><span>{fFecha(e.f, { weekday: 'short' }).replace('.', '')}</span></div>
                <span className={`ev-tipo ${e.tono}`}>{e.tipo}</span>
                <div className="grow"><strong>{e.t}</strong><span className="muted small">{e.d}</span></div>
                <Link className="btn btn-sm" to={e.to}>{e.btn}</Link>
              </div>
            ))}
            {es.length > 12 && <p className="muted small">y {es.length - 12} más…</p>}
          </Card>
        );
      })}
      {!vis.length && <Empty>No hay fechas en este rango.</Empty>}
      {nuevo && <Programar onClose={() => setNuevo(false)} rol={rol} persona={persona} onSave={(x) => {
        update((d) => {
          if (x.tipo === 'asig') d.asignaciones.push({ id: `a-${Date.now().toString(36)}`, cursoId: x.curso, areas: x.areas, inicio: x.inicio, cierre: x.cierre, por: persona.nombre });
          else d.recordatorios.push({ id: `r${Date.now()}`, cursoId: x.curso, fecha: x.inicio, texto: `Recordatorio: ${getCurso(x.curso).nombre}`, a: x.a, area: rol === 'admin' ? '' : persona.area });
        });
        const n = participantes(acc).filter((t) => x.areas.includes(t.area)).length;
        notify(x.tipo === 'asig' ? `Curso asignado a ${n} personas. Se les avisará por WhatsApp y correo.` : 'Recordatorio programado');
        setNuevo(false);
      }} />}
    </>
  );
}

function Programar({ onClose, onSave, rol, persona }) {
  const [x, setX] = useState({ tipo: 'asig', curso: CURSOS[0].id, areas: rol === 'admin' ? [] : [persona.area], inicio: addDias(1), cierre: addDias(30), a: 'Personas con avance menor a 50 %' });
  const areas = rol === 'admin' ? AREAS : [persona.area];
  const ok = x.tipo === 'rec' || (x.areas.length && x.cierre > x.inicio);
  return (
    <Modal title="Programar" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave(x)}>Guardar</button></>}>
      <div className="tabs">
        <button className={x.tipo === 'asig' ? 'active' : ''} onClick={() => setX({ ...x, tipo: 'asig' })}>Asignar curso</button>
        <button className={x.tipo === 'rec' ? 'active' : ''} onClick={() => setX({ ...x, tipo: 'rec' })}>Recordatorio</button>
      </div>
      <Field label="Curso"><select value={x.curso} onChange={(e) => setX({ ...x, curso: e.target.value })}>{CURSOS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
      {x.tipo === 'asig' ? (
        <>
          <Field label="Áreas">
            <div className="opt-list">{areas.map((a) => <label key={a} className={`opt ${x.areas.includes(a) ? 'on' : ''}`}><input type="checkbox" checked={x.areas.includes(a)} disabled={rol !== 'admin'} onChange={() => setX({ ...x, areas: x.areas.includes(a) ? x.areas.filter((y) => y !== a) : [...x.areas, a] })} /><strong>{a}</strong></label>)}</div>
          </Field>
          <div className="form-2">
            <Field label="Inicio"><input type="date" value={x.inicio} onChange={(e) => setX({ ...x, inicio: e.target.value })} /></Field>
            <Field label="Fecha límite"><input type="date" value={x.cierre} onChange={(e) => setX({ ...x, cierre: e.target.value })} /></Field>
          </div>
        </>
      ) : (
        <div className="form-2">
          <Field label="Fecha de envío"><input type="date" value={x.inicio} onChange={(e) => setX({ ...x, inicio: e.target.value })} /></Field>
          <Field label="Enviar a"><select value={x.a} onChange={(e) => setX({ ...x, a: e.target.value })}><option>Personas con avance menor a 50 %</option><option>Personas que no empezaron</option><option>Todas las personas asignadas</option></select></Field>
        </div>
      )}
      <p className="note">Se avisa a cada trabajador por WhatsApp y correo, y aparece en sus avisos.</p>
    </Modal>
  );
}

// ---------- Certificados ----------
export function GCertificados() {
  const { filas } = useAlcance();
  const [params] = useSearchParams();
  const [f, setF] = useState(params.get('f') || 'todos');
  const [q, setQ] = useState('');
  const [ver, setVer] = useState(null);
  const certs = filas.filter((x) => x.p.cert).map((x) => ({ ...x, d: diasHasta(x.p.cert.vence) }))
    .filter((x) => (f === 'todos' || (f === 'vigente' && x.d > 30) || (f === 'por-vencer' && x.d >= 0 && x.d <= 30) || (f === 'vencido' && x.d < 0))
      && (!q || `${x.t.nombre} ${x.t.dni} ${x.c.nombre} ${x.p.cert.codigo}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.d - b.d);
  return (
    <>
      <PageHeader title="Certificados" subtitle="Certificados emitidos con código QR de verificación." />
      <div className="tabs">{[['todos', 'Todos'], ['vigente', 'Vigentes'], ['por-vencer', 'Por vencer (30 días)'], ['vencido', 'Vencidos']].map(([k, l]) => <button key={k} className={f === k ? 'active' : ''} onClick={() => setF(k)}>{l}</button>)}</div>
      <div className="toolbar"><div className="search"><Search size={15} /><input placeholder="Buscar por persona, curso o código" value={q} onChange={(e) => setQ(e.target.value)} /></div><span className="muted small">{certs.length} certificados</span></div>
      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Trabajador</th><th>Curso</th><th>Nota</th><th>Código</th><th>Emitido</th><th>Vence</th><th /></tr></thead>
            <tbody>
              {certs.slice(0, 150).map((x) => (
                <tr key={x.t.dni + x.c.id}>
                  <td><strong>{x.t.nombre}</strong><div className="muted small">{x.t.area}</div></td>
                  <td>{x.c.nombre}</td>
                  <td>{x.ultimo?.nota}/20</td>
                  <td className="small"><code>{x.p.cert.codigo}</code></td>
                  <td className="small">{fFecha(x.p.cert.fecha, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{fFecha(x.p.cert.vence, { day: 'numeric', month: 'short', year: 'numeric' })}<div><Badge tone={x.d < 0 ? 'bad' : x.d <= 30 ? 'warn' : 'ok'}>{x.d < 0 ? 'Vencido' : x.d <= 30 ? `${x.d} días` : 'Vigente'}</Badge></div></td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setVer(x)}><Award size={13} /> Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!certs.length && <Empty>No hay certificados con este filtro.</Empty>}
        </div>
      </Card>
      {ver && <Modal title={`Certificado · ${ver.t.nombre}`} onClose={() => setVer(null)}><Certificado persona={ver.t} x={ver} /></Modal>}
    </>
  );
}

// ---------- Reportes ----------
export function GReportes() {
  const { rol } = useCap();
  const { filas, gente } = useAlcance();
  const porCurso = CURSOS.map((c) => {
    const f = filas.filter((x) => x.c.id === c.id);
    const enc = f.filter((x) => x.p.encuesta);
    return { c, n: f.length, ap: f.filter((x) => x.p.aprobado).length, nota: f.filter((x) => x.ultimo).length ? (f.filter((x) => x.ultimo).reduce((s, x) => s + x.ultimo.nota, 0) / f.filter((x) => x.ultimo).length).toFixed(1) : '—', est: enc.length ? (enc.reduce((s, x) => s + x.p.encuesta.estrellas, 0) / enc.length).toFixed(1) : '—' };
  }).filter((r) => r.n);
  const exportar = () => {
    const cab = ['DNI', 'Trabajador', 'Área', 'Cargo', 'Curso', 'Estado', 'Avance %', 'Nota', 'Intentos', 'Fecha límite', 'Certificado', 'Vence certificado'];
    const rows = filas.map((x) => [x.t.dni, x.t.nombre, x.t.area, x.t.cargo, x.c.nombre, x.estado, x.avance, x.ultimo?.nota ?? '', x.p.intentos.length, x.a.cierre, x.p.cert?.codigo ?? '', x.p.cert?.vence ?? '']);
    const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
    const txt = '﻿' + [cab, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = `reporte_capacitaciones_${addDias(0)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <>
      <PageHeader title="Reportes" subtitle={`${gente.length} personas · ${filas.length} asignaciones ${rol === 'admin' ? 'en toda la empresa' : 'en tu área'}.`}
        actions={<button className="btn btn-primary" onClick={exportar}><Download size={15} /> Exportar a Excel (CSV)</button>} />
      <Card title="Resultados por curso">
        <table className="table">
          <thead><tr><th>Curso</th><th>Asignados</th><th>Aprobados</th><th style={{ width: 200 }}>% aprobación</th><th>Nota promedio</th><th>Satisfacción</th></tr></thead>
          <tbody>
            {porCurso.map((r) => (
              <tr key={r.c.id}>
                <td><strong>{r.c.nombre}</strong></td><td>{r.n}</td><td>{r.ap}</td>
                <td><Progress value={Math.round((r.ap / r.n) * 100)} /><span className="small muted">{Math.round((r.ap / r.n) * 100)}%</span></td>
                <td>{r.nota}</td>
                <td className="nowrap"><Star size={13} fill="#F4C400" color="#e3a008" /> {r.est}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="note"><Users size={15} /> El reporte exportado tiene una fila por persona y curso: estado, avance, nota, intentos y certificado.</div>
      <div className="note" style={{ background: '#f3f5f8', color: '#475467' }}><BookOpen size={15} /> La nota se calcula como respuestas correctas ÷ total de preguntas × 20; el mínimo aprobatorio es 14.</div>
    </>
  );
}
