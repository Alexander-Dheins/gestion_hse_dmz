import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Bell, ChevronRight, CalendarDays, X, Check, Play, Lock, Star, Award, List, RotateCcw, ShieldCheck, Clock3, Hash,
  KeyRound, ArrowLeftRight, LogOut, Info, AlertTriangle, BookOpen, MessageCircle,
} from 'lucide-react';
import { useCap, cursosDe, avisosDe, fFecha, diasHasta, participantes } from '../store.jsx';
import { totalPreguntas, NOTA_MIN, fmtMMSS } from '../data.js';
import { accesosDe, cerrarSesion, iniciales, cargarAcceso, guardarAcceso } from '../../acceso/db.jsx';
import { useBase, Atras, Chip, Barra, Anillo, tonoEstado } from './Base.jsx';
import Certificado from './Certificado.jsx';

const MODAL_VISTO = 'dmz-cap-aviso-visto';

// ---------- Inicio ----------
export function Inicio() {
  const { db, persona } = useCap();
  const B = useBase();
  const nav = useNavigate();
  const lista = cursosDe(db, persona);
  const aprob = lista.filter((x) => x.p.aprobado).length;
  const pend = lista.filter((x) => !x.p.aprobado && x.estado !== 'No aprobado' && x.estado !== 'Vencido');
  const porVencer = lista.filter((x) => x.p.cert && diasHasta(x.p.cert.vence) <= 30).length;
  const avisos = avisosDe(db, persona);
  const sinLeer = avisos.some((a) => !a.leido);
  const seguir = pend.find((x) => x.estado === 'En curso') || pend[0];
  const [modal, setModal] = useState(() => { try { return pend.length > 0 && !sessionStorage.getItem(MODAL_VISTO); } catch { return false; } });
  const cerrar = () => { setModal(false); try { sessionStorage.setItem(MODAL_VISTO, '1'); } catch { /* sin almacenamiento */ } };
  const fechas = [
    ...pend.map((x) => ({ f: x.a.cierre, t: `Cierre: ${x.c.nombre}`, d: `Te faltan ${x.c.modulos.length - x.completos} módulos`, tono: 'amarillo' })),
    ...lista.filter((x) => x.p.cert && diasHasta(x.p.cert.vence) <= 60).map((x) => ({ f: x.p.cert.vence, t: `Vence cert. ${x.c.nombre}`, d: 'Tu supervisor ya fue avisado', tono: 'rojo' })),
  ].sort((a, b) => a.f.localeCompare(b.f)).slice(0, 4);
  const pct = lista.length ? Math.round((aprob / lista.length) * 100) : 0;

  return (
    <div className="cp-page">
      <header className="cp-hello">
        <div className="cp-av">{iniciales(persona.nombre)}</div>
        <div className="grow">
          <span>{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          <strong>Hola, {persona.nombre.split(' ')[0]}</strong>
        </div>
        <Link to={`${B}/avisos`} className="cp-ibtn" aria-label="Avisos"><Bell size={18} />{sinLeer && <i className="cp-dot" />}</Link>
      </header>

      <div className="cp-home">
      <div className="cp-col">
      <section className="cp-hero">
        <Anillo v={pct} />
        <div>
          <span>Tu avance general</span>
          <strong>{aprob} de {lista.length} cursos aprobados</strong>
          <em>{persona.area} · {new Date().getFullYear()}</em>
        </div>
        <div className="cp-hero-stats">
          <div><b className="amarillo">{pend.length}</b><span>Por terminar</span></div>
          <div><b>{aprob}</b><span>Aprobados</span></div>
          <div><b className="rojo">{porVencer}</b><span>Cert. por vencer</span></div>
        </div>
      </section>

      {seguir && (
        <>
          <span className="cp-lbl">Continúa donde te quedaste</span>
          <Link to={`${B}/curso/${seguir.c.id}`} className="cp-card cp-cont">
            <div className="cp-thumb" style={{ '--c': seguir.c.color }}><Play size={22} fill="#fff" /></div>
            <div className="cp-row"><strong>{seguir.c.nombre}</strong><span className="mono">{seguir.avance}%</span></div>
            <Barra v={seguir.avance} />
            <div className="cp-row"><span className="cp-muted">Módulo {Math.min(seguir.completos + 1, seguir.c.modulos.length)} de {seguir.c.modulos.length} · vence {fFecha(seguir.a.cierre)}</span><span className="cp-link">Continuar <ChevronRight size={14} /></span></div>
          </Link>
        </>
      )}

      </div>
      <div className="cp-col">
      {fechas.length > 0 && (
        <>
          <span className="cp-lbl first">Próximas fechas</span>
          <div className="cp-card cp-list">
            {fechas.map((x, i) => (
              <div key={i} className="cp-fecha">
                <div className="cp-cal"><b>{new Date(x.f + 'T00:00:00').getDate()}</b><span>{fFecha(x.f, { month: 'short' }).replace('.', '')}</span></div>
                <div className="grow"><strong>{x.t}</strong><span className="cp-muted">{x.d}</span></div>
                <Chip tono={x.tono}>{diasHasta(x.f)} días</Chip>
              </div>
            ))}
          </div>
        </>
      )}
      {!lista.length && <div className="cp-card cp-empty">Todavía no tienes cursos asignados.</div>}
      </div>
      </div>

      {modal && (
        <div className="cp-sheet-back">
          <div className="cp-sheet">
            <button className="cp-x" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>
            <div className="cp-sheet-ico amarillo"><CalendarDays size={22} /></div>
            <h2>Tienes {pend.length} {pend.length === 1 ? 'curso pendiente' : 'cursos pendientes'}</h2>
            <p className="cp-muted">Termínalos antes de la fecha límite para mantener tu habilitación en campo.</p>
            {pend.slice(0, 3).map((x) => (
              <div key={x.c.id} className="cp-pend">
                <div className="cp-row"><strong>{x.c.nombre}</strong><Chip tono={x.dias <= 15 ? 'amarillo' : 'gris'}>Faltan {x.dias} días</Chip></div>
                <Barra v={x.avance} tono={x.avance ? '' : 'vacio'} />
                <span className="cp-muted">{x.avance ? `${x.avance}%` : 'Sin empezar'} · vence el {fFecha(x.a.cierre, { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
            <button className="cp-btn azul" onClick={() => { cerrar(); nav(`${B}/curso/${pend[0].c.id}`); }}>Continuar {pend[0].c.nombre}</button>
            <button className="cp-btn borde" onClick={cerrar}>Cerrar y ver mi resumen</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Mis cursos ----------
export function Cursos() {
  const { db, persona } = useCap();
  const B = useBase();
  const [tab, setTab] = useState('pend');
  const lista = cursosDe(db, persona);
  const vis = lista.filter((x) => (tab === 'pend' ? !x.p.aprobado : tab === 'ok' ? x.p.aprobado : true));
  return (
    <div className="cp-page">
      <h1 className="cp-h1">Mis cursos</h1>
      <div className="cp-tabs">
        {[['pend', 'Pendientes', lista.filter((x) => !x.p.aprobado).length], ['ok', 'Aprobados', lista.filter((x) => x.p.aprobado).length], ['todos', 'Todos', lista.length]].map(([k, l, n]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} <em>{n}</em></button>
        ))}
      </div>
      <div className="cp-stack cp-grid">
        {vis.map((x) => (
          <Link key={x.c.id} to={`${B}/curso/${x.c.id}`} className="cp-card cp-curso">
            <div className="cp-row"><div className="cp-thumb sm" style={{ '--c': x.c.color }}><BookOpen size={16} /></div><strong className="grow">{x.c.nombre}</strong><Chip tono={tonoEstado[x.estado]}>{x.estado}</Chip></div>
            <Barra v={x.avance} tono={x.p.aprobado ? 'verde' : ''} />
            <div className="cp-row cp-muted"><span>{x.completos} de {x.c.modulos.length} módulos{x.ultimo ? ` · nota ${x.ultimo.nota}/20` : ''}</span><span>{x.p.aprobado ? `Aprobado` : `Vence ${fFecha(x.a.cierre)}`}</span></div>
          </Link>
        ))}
        {!vis.length && <div className="cp-card cp-empty">{tab === 'pend' ? '¡Al día! No tienes cursos pendientes.' : 'No hay cursos aquí.'}</div>}
      </div>
    </div>
  );
}

// ---------- Detalle del curso ----------
export function Detalle() {
  const { id } = useParams();
  const { db, persona } = useCap();
  const B = useBase();
  const nav = useNavigate();
  const x = cursosDe(db, persona).find((y) => y.c.id === id);
  const [aviso, setAviso] = useState(false);
  useEffect(() => { if (x && x.completos === x.c.modulos.length && !x.p.encuesta) setAviso(true); }, [x?.completos, x?.p.encuesta]); // eslint-disable-line
  if (!x) return <div className="cp-page"><Atras to={`${B}/cursos`} label="Mis cursos" /><div className="cp-card cp-empty">Este curso no está asignado a tu área.</div></div>;
  const { c, p } = x;
  const todos = x.completos === c.modulos.length;
  const bloqueado = x.estado === 'No aprobado' || x.estado === 'Vencido';
  const cerrado = p.cerrado || p.aprobado;

  return (
    <div className="cp-page">
      <Atras to={`${B}/cursos`} label="Mis cursos" right={<span className="cp-ibtn"><List size={17} /></span>} />
      <div className="cp-det">
      <div className="cp-col">
      <h1 className="cp-h1">{c.nombre}</h1>
      <p className="cp-muted cp-sub">Obligatorio · vence {fFecha(x.a.cierre)} · {c.modulos.length} videos · {totalPreguntas(c)} preguntas</p>
      <div className="cp-row cp-muted small"><span>Avance del curso</span><span className="mono">{x.completos} de {c.modulos.length} módulos</span></div>
      <Barra v={x.avance} tono={p.aprobado ? 'verde' : ''} />

      <div className="cp-card cp-list cp-mods">
        {c.modulos.map((m, i) => {
          const pm = p.mod[m.id];
          const listo = pm?.visto && pm?.resp;
          const disponible = i === 0 || (p.mod[c.modulos[i - 1].id]?.visto && p.mod[c.modulos[i - 1].id]?.resp);
          const enCurso = !listo && disponible && pm;
          const n = pm?.resp ? m.preguntas.filter((q, k) => pm.resp[k] === q.ok).length : null;
          const repasar = cerrado && !p.aprobado && n != null && n < m.preguntas.length;
          const contenido = (
            <>
              <div className={`cp-mi ${listo ? (repasar ? 'rojo' : 'verde') : disponible ? 'azul' : 'gris'}`}>{listo ? (repasar ? <RotateCcw size={16} /> : <Check size={16} />) : disponible ? <Play size={15} fill="currentColor" /> : <Lock size={15} />}</div>
              <div className="grow">
                <strong>{m.titulo}</strong>
                <span className="cp-muted">Video · {m.min} min · {listo ? `evaluación ${pm.resp.length}/3 respondida` : enCurso ? `vas en ${fmtMMSS(pm.pos)}` : `${m.preguntas.length} preguntas`}</span>
              </div>
              {listo ? <Chip tono={repasar ? 'rojo' : 'verde'}>{repasar ? 'Repasar' : 'Listo'}</Chip> : enCurso ? <Chip tono="azul">En curso</Chip> : null}
            </>
          );
          return disponible && !bloqueado
            ? <Link key={m.id} to={`${B}/curso/${c.id}/video/${m.id}`} className="cp-li">{contenido}</Link>
            : <div key={m.id} className={`cp-li ${disponible ? '' : 'off'}`}>{contenido}</div>;
        })}
        <Link to={todos && !p.encuesta ? `${B}/curso/${c.id}/encuesta` : '#'} className={`cp-li ${todos ? '' : 'off'}`} onClick={(e) => { if (!todos || p.encuesta) e.preventDefault(); }}>
          <div className={`cp-mi ${p.encuesta ? 'verde' : todos ? 'amarillo' : 'gris'}`}>{p.encuesta ? <Check size={16} /> : <Star size={15} />}</div>
          <div className="grow"><strong>Encuesta de satisfacción</strong><span className="cp-muted">{p.encuesta ? `Enviada · ${p.encuesta.estrellas} de 5` : `Se habilita al terminar los ${c.modulos.length} videos`}</span></div>
          {p.encuesta && <Chip tono="verde">Listo</Chip>}
        </Link>
        <Link to={cerrado ? `${B}/curso/${c.id}/resultado` : '#'} className={`cp-li ${cerrado ? '' : 'off'}`} onClick={(e) => { if (!cerrado) e.preventDefault(); }}>
          <div className={`cp-mi ${p.aprobado ? 'verde' : cerrado ? 'rojo' : 'gris'}`}><Award size={16} /></div>
          <div className="grow"><strong>Nota final y certificado</strong><span className="cp-muted">{x.ultimo ? `Nota ${x.ultimo.nota}/20 · intento ${p.intentos.length} de ${x.maxIntentos}` : `Suma de las ${totalPreguntas(c)} preguntas · mínimo ${NOTA_MIN}`}</span></div>
          {cerrado && <ChevronRight size={17} color="#5B6778" />}
        </Link>
      </div>

      </div>
      <div className="cp-col cp-side-col">
      {bloqueado && <div className="cp-warn"><AlertTriangle size={16} /> {x.estado === 'Vencido' ? 'La fecha límite pasó. Pide a tu supervisor que reprograme el curso.' : 'Usaste tus 3 intentos. Tu supervisor puede habilitarte uno más.'}</div>}

      <span className="cp-lbl first">Reglas del curso</span>
      <div className="cp-reglas">
        <div><RotateCcw size={15} /> Puedes pausar y retroceder</div>
        <div><Lock size={15} /> No se puede adelantar</div>
        <div><Clock3 size={15} /> 3 preguntas al final de cada video</div>
        <div><Hash size={15} /> Nota final mínima {NOTA_MIN} / 20</div>
      </div>

      {!cerrado && !bloqueado && x.actual && (
        <Link className="cp-btn azul" to={`${B}/curso/${c.id}/video/${x.actual.id}`} style={{ marginTop: 16 }}><Play size={16} fill="#fff" /> {x.completos || p.mod[x.actual.id] ? 'Continuar' : 'Empezar'}: {x.actual.titulo}</Link>
      )}
      </div>
      </div>

      {aviso && (
        <div className="cp-sheet-back">
          <div className="cp-sheet center">
            <div className="cp-sheet-ico verde big"><Check size={30} /></div>
            <h2>¡Terminaste los {c.modulos.length} videos!</h2>
            <p className="cp-muted">Respondiste las {totalPreguntas(c)} preguntas del curso. Para ver tu <strong>nota final</strong>, completa la encuesta de satisfacción. Toma 1 minuto.</p>
            <button className="cp-btn azul" onClick={() => nav(`${B}/curso/${c.id}/encuesta`)}>Hacer la encuesta</button>
            <button className="cp-btn borde" onClick={() => setAviso(false)}>Más tarde</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Certificados ----------
export function Certificados() {
  const { db, persona } = useCap();
  const B = useBase();
  const certs = cursosDe(db, persona).filter((x) => x.p.cert);
  return (
    <div className="cp-page">
      <h1 className="cp-h1">Mis certificados</h1>
      <p className="cp-muted cp-sub">Cada certificado tiene un código QR para verificarlo en campo.</p>
      <div className="cp-stack cp-grid">
        {certs.map((x) => {
          const d = diasHasta(x.p.cert.vence);
          return (
            <Link key={x.c.id} to={`${B}/certificado/${x.c.id}`} className="cp-card cp-cert">
              <div className="cp-thumb sm" style={{ '--c': x.c.color }}><Award size={17} /></div>
              <div className="grow">
                <strong>{x.c.nombre}</strong>
                <span className="cp-muted">Nota {x.ultimo?.nota}/20 · vence {fFecha(x.p.cert.vence, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <Chip tono={d < 0 ? 'rojo' : d <= 30 ? 'amarillo' : 'verde'}>{d < 0 ? 'Vencido' : d <= 30 ? `Vence en ${d} d` : 'Vigente'}</Chip>
            </Link>
          );
        })}
        {!certs.length && <div className="cp-card cp-empty">Aún no tienes certificados. Aprueba un curso para emitir el tuyo.</div>}
      </div>
    </div>
  );
}

export function VerCertificado() {
  const { id } = useParams();
  const { db, persona } = useCap();
  const B = useBase();
  const x = cursosDe(db, persona).find((y) => y.c.id === id);
  if (!x?.p.cert) return <div className="cp-page"><Atras to={`${B}/certificados`} label="Certificados" /><div className="cp-card cp-empty">Certificado no disponible.</div></div>;
  return (
    <div className="cp-page">
      <Atras to={`${B}/certificados`} label="Certificados" />
      <Certificado persona={persona} x={x} />
    </div>
  );
}

// ---------- Avisos ----------
export function Avisos() {
  const { db, persona, acciones } = useCap();
  const B = useBase();
  const [tab, setTab] = useState('Todos');
  const todos = useMemo(() => avisosDe(db, persona).sort((a, b) => (b.atencion - a.atencion) || b.fecha.localeCompare(a.fecha)), [db, persona]);
  const vis = todos.filter((a) => tab === 'Todos' || a.tipo === tab);
  const ico = { warn: <Clock3 size={17} />, bad: <AlertTriangle size={17} />, info: <BookOpen size={17} />, ok: <Award size={17} /> };
  const fila = (a) => (
    <div key={a.id} className="cp-aviso">
      <div className={`cp-mi ${a.tono === 'warn' ? 'amarillo' : a.tono === 'bad' ? 'rojo' : a.tono === 'ok' ? 'verde' : 'azul'}`}>{ico[a.tono]}</div>
      <div className="grow">
        <strong>{a.titulo}</strong>
        <span className="cp-muted">{a.det}</span>
        <Link to={`${B}${a.to}`} className="cp-link" onClick={() => acciones.leer([a.id])}>{a.accion} <ChevronRight size={14} /></Link>
      </div>
      {!a.leido && <i className="cp-dot static" />}
    </div>
  );
  return (
    <div className="cp-page">
      <div className="cp-narrow">
      <Atras to={B || '/'} label="Inicio" right={<button className="cp-link-btn" onClick={() => acciones.leer(todos.map((a) => a.id))}>Marcar todo leído</button>} />
      <h1 className="cp-h1">Avisos</h1>
      <div className="cp-tabs">
        {['Todos', 'Cursos', 'Certificados'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t} <em>{todos.filter((a) => t === 'Todos' || a.tipo === t).length}</em></button>)}
      </div>
      {vis.some((a) => a.atencion) && <><span className="cp-lbl rojo">Requiere tu atención</span><div className="cp-card cp-list">{vis.filter((a) => a.atencion).map(fila)}</div></>}
      {vis.some((a) => !a.atencion) && <><span className="cp-lbl">Anteriores</span><div className="cp-card cp-list">{vis.filter((a) => !a.atencion).map(fila)}</div></>}
      {!vis.length && <div className="cp-card cp-empty">No tienes avisos.</div>}
      <p className="cp-muted cp-foot"><MessageCircle size={13} /> También llegan a tu WhatsApp registrado</p>
      </div>
    </div>
  );
}

// ---------- Perfil ----------
export function Perfil() {
  const { acc, persona, notify } = useCap();
  const [pinModal, setPinModal] = useState(false);
  const sup = participantes(acc).find((t) => t.area === persona.area && t.dni !== persona.dni && accesosDe(acc, t).cap === 'supervisor');
  return (
    <div className="cp-page">
      <h1 className="cp-h1 web-only">Mi perfil</h1>
      <div className="cp-prof">
      <div className="cp-col">
      <div className="cp-perfil">
        <div className="cp-av lg">{iniciales(persona.nombre)}</div>
        <h1>{persona.nombre}</h1>
        <span className="mono cp-muted">DNI {persona.dni}</span>
      </div>
      <div className="cp-card cp-dl">
        <div><span>Área</span><strong>{persona.area}</strong></div>
        <div><span>Cargo</span><strong>{persona.cargo}</strong></div>
        <div><span>Unidad</span><strong>{persona.unidad}</strong></div>
        <div><span>Supervisor</span><strong>{sup?.nombre || '—'}</strong></div>
      </div>
      </div>
      <div className="cp-col">
      <div className="cp-card cp-list">
        <button className="cp-li" onClick={() => setPinModal(true)}><div className="cp-mi azul"><KeyRound size={16} /></div><div className="grow"><strong>Cambiar mi PIN</strong><span className="cp-muted">4 dígitos que solo tú conoces</span></div><ChevronRight size={17} /></button>
        <a className="cp-li" href="/"><div className="cp-mi azul"><ArrowLeftRight size={16} /></div><div className="grow"><strong>Cambiar de plataforma</strong><span className="cp-muted">Volver al panel de acceso</span></div><ChevronRight size={17} /></a>
        <button className="cp-li" onClick={() => cerrarSesion('cap')}><div className="cp-mi rojo"><LogOut size={16} /></div><div className="grow"><strong className="rojo-t">Cerrar sesión</strong></div></button>
      </div>
      <div className="cp-info"><Info size={15} /> ¿Tus datos, correo o número de WhatsApp están mal? Pide a tu supervisor que los actualice.</div>
      </div>
      </div>
      {pinModal && <CambiarPin onClose={() => setPinModal(false)} onOk={() => { setPinModal(false); notify('PIN actualizado'); }} persona={persona} />}
    </div>
  );
}

function CambiarPin({ persona, onClose, onOk }) {
  const [actual, setActual] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [err, setErr] = useState('');
  const guardar = () => {
    const db = cargarAcceso();
    const t = db.trabajadores.find((x) => x.dni === persona.dni);
    if (!t || t.pin !== actual) { setErr('El PIN actual no es correcto.'); return; }
    t.pin = nuevo; t.pinTemporal = false; guardarAcceso(db); onOk();
  };
  const dig = (f) => (e) => { f(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr(''); };
  return (
    <div className="cp-sheet-back">
      <div className="cp-sheet">
        <button className="cp-x" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        <h2>Cambiar mi PIN</h2>
        <label className="cp-in"><span>PIN actual</span><input type="password" inputMode="numeric" value={actual} onChange={dig(setActual)} /></label>
        <label className="cp-in"><span>Nuevo PIN</span><input type="password" inputMode="numeric" value={nuevo} onChange={dig(setNuevo)} /></label>
        {err && <p className="cp-err">{err}</p>}
        <button className="cp-btn azul" disabled={actual.length < 4 || nuevo.length < 4 || nuevo === actual} onClick={guardar}><ShieldCheck size={16} /> Guardar PIN</button>
      </div>
    </div>
  );
}

