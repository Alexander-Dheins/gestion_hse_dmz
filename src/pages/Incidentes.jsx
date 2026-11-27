import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bell, FileText, Search } from 'lucide-react';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtIncidente } from '../formatos.jsx';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty, Stat } from '../components/ui.jsx';
import { CLASES_EVENTO, AREAS_EVENTO, PARTES_CUERPO, GRUPOS_EDAD, ANTIGUEDADES, TURNOS, GENEROS, ANIO, MES_ACTUAL, tipoDeClase } from '../data/seed3.js';
import { clase as claseDe, indicadores, diasSinLti, rango } from '../lib/sgsst.js';
import { COLOR_CLASE } from '../components/charts.jsx';
import PanelEventos from './eventos/PanelEventos.jsx';

const TONO_GRUPO = { lesion: 'bad', incidente: 'warn', enfermedad: 'info', otro: 'muted' };

export default function Incidentes() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [params, setParams] = useSearchParams();
  const [nuevo, setNuevo] = useState(null);
  const [inv, setInv] = useState(null);
  const [formato, setFormato] = useState(null);
  const [q, setQ] = useState('');
  const [fClase, setFClase] = useState('');
  const tab = params.get('tab') || 'registro';
  const staff = user.rol !== 'trabajador';
  const lista = db.incidentes.filter((x) => inScope(x.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha))
    .filter((x) => (!fClase || x.clase === fClase) && (!q || `${x.id} ${x.descripcion} ${x.area || ''}`.toLowerCase().includes(q.toLowerCase())));
  const ytd = indicadores(db, { sedes: visibleUnits, meses: rango(0, MES_ACTUAL), anio: ANIO });
  const sinLti = diasSinLti(db, visibleUnits);

  const abrir = () => {
    const unidad = visibleUnits[0];
    setNuevo({ clase: 'INC', unidad, paradaId: db.paradas.find((p) => p.unidad === unidad && p.estado === 'En curso')?.id || '', descripcion: '', diasPerdidos: 0, fecha: hoy(), area: 'Operaciones', turno: 'Día', parteCuerpo: '', edad: '', antiguedad: '', genero: '' });
  };
  useEffect(() => {
    if (params.get('nuevo') && can(user, 'incidente.crear')) { abrir(); setParams({}, { replace: true }); }
  }, [params]); // eslint-disable-line

  const lesion = nuevo && claseDe(nuevo.clase).grupo === 'lesion';
  const guardar = () => {
    if (!nuevo.descripcion.trim()) return;
    const rec = {
      id: nextId(db.incidentes, 'INC'), ...nuevo, tipo: tipoDeClase(nuevo.clase), paradaId: nuevo.paradaId || null,
      diasPerdidos: nuevo.clase === 'LTI' ? +nuevo.diasPerdidos || 0 : 0, estado: 'En investigación', reportadoPor: user.id,
      parteCuerpo: lesion ? nuevo.parteCuerpo || null : null, edad: nuevo.edad || null, antiguedad: nuevo.antiguedad || null, genero: nuevo.genero || null,
    };
    update((d) => { d.incidentes.push(rec); }, `${claseDe(rec.clase).nombre} reportado · se notificó al líder HSE y a la unidad`);
    setNuevo(null);
    setFormato(fmtIncidente(db, rec));
  };
  const cerrarInv = () => {
    update((d) => {
      const i = d.incidentes.find((x) => x.id === inv.id);
      i.estado = 'Cerrado';
      i.causaRaiz = inv.causa;
      if (inv.accion.trim()) d.planes.push({ id: nextId(d.planes, 'PA'), origen: inv.id, unidad: i.unidad, descripcion: inv.accion.trim(), responsable: user.id, vence: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), estado: 'Abierto' });
    }, `Investigación de ${inv.id} cerrada`);
    setInv(null);
  };

  return (
    <>
      <PageHeader title="Eventos: accidentes e incidentes" subtitle="Reporte inmediato desde campo, clasificación del evento (LTI, WRC, MTC, FAC, PD, HPH…), investigación y panel de control."
        actions={can(user, 'incidente.crear') && <button className="btn btn-danger" onClick={abrir}><AlertTriangle size={16} /> Reportar evento</button>} />
      {staff && (
        <div className="tabs tabs-main">
          {[['registro', 'Registro de eventos'], ['panel', 'Panel de control']].map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setParams(k === 'registro' ? {} : { tab: k })}>{l}</button>)}
        </div>
      )}
      {tab === 'panel' && staff ? <PanelEventos /> : (
        <>
          {staff && (
            <div className="stats">
              <Stat label={`Eventos ${ANIO}`} value={ytd.eventos.length} hint={`${ytd.registrables} registrables`} />
              <Stat label="En investigación" value={lista.filter((x) => x.estado === 'En investigación').length} tone="warn" />
              <Stat label="Días sin accidente con tiempo perdido" value={sinLti ?? '—'} tone={sinLti > 100 ? 'ok' : ''} />
              <Stat label="Índice de frecuencia (IF)" value={ytd.IF.toFixed(2)} hint="LTI + mortales × 10⁶ / HHT del año" />
              <Stat label="TRIR" value={ytd.TRIR.toFixed(2)} hint={`Meta ${db.estadisticas.metas.TRIR} · registrables × 200 000 / HHT`} tone={ytd.TRIR > db.estadisticas.metas.TRIR ? 'bad' : 'ok'} />
            </div>
          )}
          <div className="toolbar">
            <div className="search"><Search size={15} /><input placeholder="Buscar evento" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select value={fClase} onChange={(e) => setFClase(e.target.value)} aria-label="Clasificación"><option value="">Todas las clasificaciones</option>{CLASES_EVENTO.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            <span className="muted small">{lista.length} eventos</span>
          </div>
          <Card>
            {lista.length === 0 && <Empty>Sin eventos reportados.</Empty>}
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>N.º</th><th>Clasificación</th><th>Descripción</th><th>Sede / área</th><th>Fecha</th><th>Días perdidos</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {lista.slice(0, 150).map((x) => {
                    const c = claseDe(x.clase);
                    return (
                      <tr key={x.id}>
                        <td><strong>{x.id}</strong></td>
                        <td><span className="ev-clase"><i style={{ background: COLOR_CLASE[x.clase] }} />{x.clase}</span><div className="muted small">{c.nombre.replace(/ \(.*\)/, '')}</div></td>
                        <td>{x.descripcion}<div className="muted small">Reportó {nombreUsuario(db, x.reportadoPor)}{x.causaRaiz ? ` · Causa raíz: ${x.causaRaiz}` : ''}</div></td>
                        <td>{nombreUnidad(db, x.unidad)}<div className="muted small">{x.area || '—'} · turno {x.turno?.toLowerCase() || '—'}</div></td>
                        <td className="nowrap">{fmtFecha(x.fecha)}</td>
                        <td className="center">{x.diasPerdidos || 0}</td>
                        <td><Badge tone={x.estado === 'Cerrado' ? 'ok' : TONO_GRUPO[c.grupo]}>{x.estado}</Badge></td>
                        <td className="actions-cell">{x.estado === 'En investigación' && can(user, 'incidente.investigar') && <button className="btn btn-sm" onClick={() => setInv({ id: x.id, causa: '', accion: '' })}>Investigar</button>}<button className="btn btn-sm" onClick={() => setFormato(fmtIncidente(db, x))}><FileText size={14} /> Formato</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {nuevo && (
        <Modal wide title="Reportar evento" onClose={() => setNuevo(null)}
          footer={<><span className="muted small grow"><Bell size={14} /> Se avisará al líder HSE y a la unidad.</span><button className="btn" onClick={() => setNuevo(null)}>Cancelar</button><button className="btn btn-danger" disabled={!nuevo.descripcion.trim()} onClick={guardar}>Enviar y generar reporte</button></>}>
          <div className="form-3">
            <Field label="Clasificación del evento"><select value={nuevo.clase} onChange={(e) => setNuevo({ ...nuevo, clase: e.target.value })}>{CLASES_EVENTO.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
            <Field label="Sede"><select value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value, paradaId: '' })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Fecha"><input type="date" value={nuevo.fecha} max={hoy()} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} /></Field>
            <Field label="Área"><select value={nuevo.area} onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })}>{AREAS_EVENTO.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Turno"><select value={nuevo.turno} onChange={(e) => setNuevo({ ...nuevo, turno: e.target.value })}>{TURNOS.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Parada (opcional)">
              <select value={nuevo.paradaId} onChange={(e) => setNuevo({ ...nuevo, paradaId: e.target.value })}>
                <option value="">Sin parada</option>
                {db.paradas.filter((p) => p.unidad === nuevo.unidad).map((p) => <option key={p.id} value={p.id}>{p.id} · {p.equipo}</option>)}
              </select>
            </Field>
          </div>
          <Field label="¿Qué pasó?"><textarea rows={3} value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Describe el evento, lugar y personas involucradas" /></Field>
          {lesion && (
            <>
              <span className="lbl-up">Datos del lesionado (para estadísticas)</span>
              <div className="form-3">
                <Field label="Parte del cuerpo afectada"><select value={nuevo.parteCuerpo} onChange={(e) => setNuevo({ ...nuevo, parteCuerpo: e.target.value })}><option value="">Sin dato</option>{PARTES_CUERPO.map((a) => <option key={a}>{a}</option>)}</select></Field>
                <Field label="Grupo de edad"><select value={nuevo.edad} onChange={(e) => setNuevo({ ...nuevo, edad: e.target.value })}><option value="">Sin dato</option>{GRUPOS_EDAD.map((a) => <option key={a}>{a}</option>)}</select></Field>
                <Field label="Antigüedad"><select value={nuevo.antiguedad} onChange={(e) => setNuevo({ ...nuevo, antiguedad: e.target.value })}><option value="">Sin dato</option>{ANTIGUEDADES.map((a) => <option key={a}>{a}</option>)}</select></Field>
                <Field label="Género"><select value={nuevo.genero} onChange={(e) => setNuevo({ ...nuevo, genero: e.target.value })}><option value="">Sin dato</option>{GENEROS.map((a) => <option key={a}>{a}</option>)}</select></Field>
                {nuevo.clase === 'LTI' && <Field label="Días perdidos (estimado)"><input type="number" min="0" value={nuevo.diasPerdidos} onChange={(e) => setNuevo({ ...nuevo, diasPerdidos: e.target.value })} /></Field>}
              </div>
            </>
          )}
          <p className="muted small">{claseDe(nuevo.clase).registrable ? 'Evento registrable: suma al TRIR.' : 'Evento no registrable: no suma al TRIR.'} {['LTI', 'FAT'].includes(nuevo.clase) ? 'Además suma al IF y reinicia el contador de días sin LTI.' : ''}</p>
        </Modal>
      )}
      {inv && (
        <Modal title={`Investigación ${inv.id}`} onClose={() => setInv(null)}
          footer={<><button className="btn" onClick={() => setInv(null)}>Cancelar</button><button className="btn btn-primary" onClick={cerrarInv} disabled={!inv.causa.trim()}>Cerrar investigación</button></>}>
          <Field label="Causa raíz"><textarea rows={3} value={inv.causa} onChange={(e) => setInv({ ...inv, causa: e.target.value })} placeholder="Ej.: falta de bandeja colectora en desmontaje de pernos" /></Field>
          <Field label="Acción correctiva (crea un plan de acción)"><input value={inv.accion} onChange={(e) => setInv({ ...inv, accion: e.target.value })} /></Field>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}

