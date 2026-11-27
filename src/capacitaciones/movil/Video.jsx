import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Play, Pause, Lock, Maximize, Sun, FileText, Presentation, Eye, Download, Info, Check, X, Send, Star, Award, AlertTriangle, ChevronRight } from 'lucide-react';
import { useCap, cursosDe, correctasDe } from '../store.jsx';
import { durSeg, pregEn, fmtMMSS, NOTA_MIN, totalPreguntas } from '../data.js';
import { useBase, Atras, MovilFull, Chip } from './Base.jsx';

const VELOCIDAD = 60; // la demo reproduce 1 minuto de video por segundo

export function Video() {
  const { mid } = useParams();
  return <VideoModulo key={mid} />;
}

function VideoModulo() {
  const { id, mid } = useParams();
  const { db, persona, acciones, notify } = useCap();
  const B = useBase();
  const nav = useNavigate();
  const x = cursosDe(db, persona).find((y) => y.c.id === id);
  const idx = x ? x.c.modulos.findIndex((m) => m.id === mid) : -1;
  const m = x?.c.modulos[idx];
  const pm = x?.p.mod[mid];
  const dur = m ? durSeg(m) : 0;
  const pq = m ? pregEn(m) : 0;
  const [pos, setPos] = useState(pm?.pos && !pm?.resp ? Math.min(pm.pos, dur) : 0);
  const [max, setMax] = useState(pm?.pos || 0);
  const [play, setPlay] = useState(false);
  const [tab, setTab] = useState('preg');
  const [q, setQ] = useState(0);
  const [resp, setResp] = useState([]);
  const [listo, setListo] = useState(false);
  const ref = useRef({ pos, max });
  ref.current = { pos, max };

  useEffect(() => {
    if (!play) return undefined;
    const t = setInterval(() => {
      setPos((p) => {
        const n = Math.min(dur, p + VELOCIDAD / 4);
        setMax((mx) => Math.max(mx, n));
        if (n >= dur) setPlay(false);
        return n;
      });
    }, 250);
    return () => clearInterval(t);
  }, [play, dur]);

  // Guarda el avance al pausar, al habilitar preguntas y al salir (si se corta la señal, sigue donde quedó)
  const guardar = () => { if (m) acciones.guardarPos(id, mid, Math.floor(ref.current.max), ref.current.max >= pq); };
  useEffect(() => { if (!play && max > 0) guardar(); }, [play]); // eslint-disable-line
  useEffect(() => { if (max >= pq && !(pm?.visto)) guardar(); }, [max >= pq]); // eslint-disable-line
  useEffect(() => () => guardar(), []); // eslint-disable-line

  if (!x || !m) return <MovilFull><Atras to={`${B}/cursos`} label="Mis cursos" /><p>Video no encontrado.</p></MovilFull>;
  const habil = max >= pq;
  const respondido = pm?.resp && !listo;
  const sig = x.c.modulos[idx + 1];
  const nResp = pm?.resp ? m.preguntas.filter((p, i) => pm.resp[i] === p.ok).length : 0;
  const falta = Math.max(0, pq - max);

  const enviar = () => {
    acciones.responder(id, mid, resp);
    setPlay(false);
    setListo(true);
  };

  return (
    <MovilFull dark>
      <div className="vd">
        <Atras to={`${B}/curso/${id}`} label={x.c.nombre} right={<span className="mono vd-n">{idx + 1} / {x.c.modulos.length}</span>} />
        <div className="vd-grid">
        <div className="vd-left">
        <div className="vd-screen" style={{ '--c': x.c.color }} onClick={() => setPlay(!play)}>
          <div className="vd-art"><span>{x.c.codigo}</span></div>
          <div className="vd-tools"><span><Sun size={15} /></span><span><Maximize size={15} /></span></div>
          {!play && <div className="vd-big"><Play size={30} fill="#fff" /></div>}
          <em className="vd-demo">Demo · reproducción acelerada</em>
        </div>
        <h2 className="vd-t">{m.titulo}</h2>
        <p className="vd-s">Módulo {idx + 1} · {m.min} min · puedes retroceder, no adelantar</p>
        <div className="vd-track">
          <div className="vd-max" style={{ width: `${(max / dur) * 100}%` }} />
          <div className="vd-pos" style={{ width: `${(pos / dur) * 100}%` }} />
          <i className="vd-mark" style={{ left: `${(pq / dur) * 100}%` }} />
          <input type="range" min={0} max={dur} value={pos} aria-label="Posición del video"
            onChange={(e) => { const v = Number(e.target.value); setPos(Math.min(v, max)); if (v > max) notify('No se puede adelantar el video'); }} />
        </div>
        <div className="vd-times mono"><span>{fmtMMSS(pos)}</span><span className="amarillo-t">preguntas {fmtMMSS(pq)}</span><span>{fmtMMSS(dur)}</span></div>
        <div className="vd-ctrl">
          <button onClick={() => setPos(Math.max(0, pos - 10))} aria-label="Retroceder 10 segundos"><RotateCcw size={18} /></button>
          <button className="vd-play" onClick={() => setPlay(!play)} aria-label={play ? 'Pausar' : 'Reproducir'}>{play ? <Pause size={24} fill="#0E2A4D" /> : <Play size={24} fill="#0E2A4D" />}</button>
          <button disabled aria-label="Adelantar (bloqueado)"><Lock size={16} /></button>
        </div>

        </div>
        <div className="vd-right">
        <div className="vd-tabs">
          <button className={tab === 'preg' ? 'on' : ''} onClick={() => setTab('preg')}>Preguntas <em>{m.preguntas.length}</em></button>
          <button className={tab === 'rec' ? 'on' : ''} onClick={() => setTab('rec')}>Recursos de apoyo</button>
        </div>

        {tab === 'rec' && (
          <>
            <div className="vd-card vd-recs">
              {m.recursos.map((r) => (
                <div key={r.nombre} className="vd-rec">
                  <span className={`vd-ft ${r.tipo === 'PPT' ? 'ppt' : ''}`}>{r.tipo === 'PPT' ? <Presentation size={16} /> : <FileText size={16} />}</span>
                  <div className="grow"><strong>{r.nombre}</strong><span>{r.tipo} · {r.tam}</span></div>
                  <button onClick={() => notify(`Vista previa: ${r.nombre} (demo)`)} aria-label="Ver"><Eye size={16} /></button>
                  <button onClick={() => notify(`Descargando ${r.nombre} (demo)`)} aria-label="Descargar"><Download size={16} /></button>
                </div>
              ))}
            </div>
            <p className="vd-foot">Los archivos quedan disponibles aunque ya hayas terminado el video.</p>
          </>
        )}

        {tab === 'preg' && listo && (
          <div className="vd-card center">
            <div className="cp-sheet-ico verde big"><Check size={28} /></div>
            <h3>Módulo completado</h3>
            <p className="vd-s">Tus respuestas se guardaron. La nota se muestra al final del curso.</p>
            {sig ? <button className="cp-btn amarillo" onClick={() => nav(`${B}/curso/${id}/video/${sig.id}`)}>Siguiente: {sig.titulo} <ChevronRight size={16} /></button>
              : <Link className="cp-btn amarillo" to={`${B}/curso/${id}`}>Volver al curso <ChevronRight size={16} /></Link>}
          </div>
        )}
        {tab === 'preg' && !listo && respondido && (
          <div className="vd-card">
            <h3><Check size={17} /> Ya respondiste este módulo</h3>
            <p className="vd-s">{m.preguntas.length} preguntas respondidas{x.p.cerrado ? ` · ${nResp} correctas` : ''}. Puedes volver a ver el video cuando quieras.</p>
            {sig && <Link className="cp-btn amarillo" to={`${B}/curso/${id}/video/${sig.id}`}>Siguiente módulo <ChevronRight size={16} /></Link>}
          </div>
        )}
        {tab === 'preg' && !listo && !respondido && !habil && (
          <div className="vd-card">
            <span className="vd-lock"><Lock size={18} /></span>
            <h3>{m.preguntas.length} preguntas de este video</h3>
            <p className="vd-s">Se habilitan al llegar al minuto {fmtMMSS(pq)}. Te faltan {Math.floor(falta / 60)} min {Math.floor(falta % 60)} s.</p>
          </div>
        )}
        {tab === 'preg' && !listo && !respondido && habil && (
          <div className="vd-card">
            <div className="vd-qh"><span className="amarillo-t">Pregunta {q + 1} de {m.preguntas.length}</span><span className="vd-dots">{m.preguntas.map((_, i) => <i key={i} className={i <= q ? 'on' : ''} />)}</span></div>
            <h3>{m.preguntas[q].p}</h3>
            <div className="vd-ops">
              {m.preguntas[q].ops.map((o, i) => (
                <button key={i} className={resp[q] === i ? 'on' : ''} onClick={() => { const r = [...resp]; r[q] = i; setResp(r); }}>
                  <span className="vd-radio" /><b>{String.fromCharCode(65 + i)}.</b> {o}
                </button>
              ))}
            </div>
            <div className="vd-qa">
              <button className="cp-btn borde-d" onClick={() => { setPos(Math.max(0, pq - 60)); setPlay(true); }}><RotateCcw size={14} /> Volver a ver 1 min</button>
              {q < m.preguntas.length - 1
                ? <button className="cp-btn amarillo" disabled={resp[q] == null} onClick={() => setQ(q + 1)}>Siguiente</button>
                : <button className="cp-btn amarillo" disabled={resp.filter((r) => r != null).length < m.preguntas.length} onClick={enviar}>Enviar respuestas</button>}
            </div>
            {q > 0 && <button className="cp-link-btn light" onClick={() => setQ(q - 1)}>Pregunta anterior</button>}
          </div>
        )}
        <p className="vd-foot"><Info size={13} /> Si se corta la señal, el video sigue desde donde quedaste.</p>
        </div>
        </div>
      </div>
    </MovilFull>
  );
}

export function Encuesta() {
  const { id } = useParams();
  const { db, persona, acciones } = useCap();
  const B = useBase();
  const nav = useNavigate();
  const x = cursosDe(db, persona).find((y) => y.c.id === id);
  const [est, setEst] = useState(0);
  const [txt, setTxt] = useState('');
  if (!x) return null;
  const etiquetas = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];
  return (
    <MovilFull>
      <div className="cp-page cp-narrow">
        <Atras to={`${B}/curso/${id}`} label="Mis cursos" />
        <div className="cp-card cp-enc">
          <span className="cp-lbl">Encuesta de satisfacción</span>
          <h1 className="cp-h1" style={{ marginTop: 0 }}>{x.c.nombre}</h1>
          <p className="cp-q">¿Cómo calificas el curso?</p>
          <div className="cp-stars">
            {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setEst(n)} aria-label={`${n} estrellas`}><Star size={30} fill={n <= est ? '#F4C400' : 'none'} color={n <= est ? '#F4C400' : '#B9C6D8'} /></button>)}
          </div>
          <span className="cp-muted small">{est ? `${est} de 5 · ${etiquetas[est]}` : 'Elige de 1 a 5 estrellas'}</span>
          <p className="cp-q">Tu opinión <span className="rojo-t">*</span></p>
          <textarea className="cp-ta" maxLength={500} rows={5} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="¿Qué te pareció? ¿Qué mejorarías?" />
          <div className="cp-row cp-muted small"><span>Obligatoria · mínimo 20 caracteres</span><span className="mono">{txt.length} / 500</span></div>
          <button className="cp-btn azul" disabled={!est || txt.trim().length < 20} onClick={() => { acciones.encuesta(id, est, txt.trim()); nav(`${B}/curso/${id}/resultado`); }}><Send size={16} /> Enviar encuesta</button>
          <p className="cp-muted center small">Al enviarla verás tu nota final.</p>
        </div>
      </div>
    </MovilFull>
  );
}

export function Resultado() {
  const { id } = useParams();
  const { db, persona, acciones } = useCap();
  const B = useBase();
  const nav = useNavigate();
  const x = cursosDe(db, persona).find((y) => y.c.id === id);
  if (!x || !x.ultimo) return <MovilFull><div className="cp-page"><Atras to={`${B}/curso/${id}`} label="Curso" /><div className="cp-card cp-empty">Aún no hay nota final para este curso.</div></div></MovilFull>;
  const { c, p } = x;
  const r = p.cerrado || p.aprobado ? correctasDe(c, p) : null;
  const nota = x.ultimo.nota;
  const ok = nota >= NOTA_MIN;
  const quedan = x.maxIntentos - p.intentos.length;
  return (
    <MovilFull>
      <div className="cp-page cp-narrow">
        <Atras to={`${B}/curso/${id}`} label={c.nombre} />
        <h1 className="cp-h1">Resultado final</h1>
        <div className={`cp-nota ${ok ? 'ok' : 'no'}`}>
          <Chip tono={ok ? 'verde' : 'rojo'}>{ok ? <><Check size={12} /> Aprobaste</> : <><X size={12} /> No aprobaste esta vez</>}</Chip>
          <div className="cp-nota-n"><b>{nota}</b><span>/ 20</span></div>
          <p>Respondiste bien {x.ultimo.correctas} de {x.ultimo.total} preguntas{ok ? ` · mínimo ${NOTA_MIN}` : `. Necesitas ${NOTA_MIN} para aprobar.`}</p>
        </div>
        {r && (
          <div className="cp-card cp-tabla">
            {r.porModulo.map((y) => (
              <div key={y.m.id} className="cp-row"><span>{y.m.titulo}</span><span>{y.n < y.total && !ok && <Chip tono="rojo">Repasar</Chip>} <b className={y.n < 2 && !ok ? 'rojo-t' : ''}>{y.n}/{y.total}</b></span></div>
            ))}
            <div className="cp-row total"><strong>Total</strong><strong>{r.ok}/{r.total}</strong></div>
          </div>
        )}
        <p className="cp-muted small">Nota = respuestas correctas ÷ {totalPreguntas(c)} × 20</p>
        {!ok && <div className="cp-warn amarillo"><AlertTriangle size={16} /> Intento {p.intentos.length} de {x.maxIntentos}. {quedan > 0 ? 'Repasa los videos marcados y sus recursos antes de volver a responder.' : 'Ya no te quedan intentos. Tu supervisor puede habilitarte uno más.'}</div>}
        <div className="cp-acc">
          {ok && !p.cert && <button className="cp-btn amarillo" onClick={() => { acciones.emitir(id); nav(`${B}/certificado/${id}`); }}><Award size={17} /> Emitir mi certificado</button>}
          {ok && p.cert && <Link className="cp-btn amarillo" to={`${B}/certificado/${id}`}><Award size={17} /> Ver mi certificado</Link>}
          {ok && <Link className="cp-btn borde" to={`${B}/cursos`}>Volver a mis cursos</Link>}
          {!ok && quedan > 0 && <button className="cp-btn azul" onClick={() => { acciones.reintentar(id); nav(`${B}/curso/${id}`); }}><RotateCcw size={16} /> Volver a intentar</button>}
          {!ok && <Link className="cp-btn borde" to={`${B}/curso/${id}`}>Ver recursos de apoyo</Link>}
        </div>
      </div>
    </MovilFull>
  );
}
