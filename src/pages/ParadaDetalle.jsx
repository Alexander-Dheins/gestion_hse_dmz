import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, CheckSquare, Square, UserPlus, Trash2 } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, acreditacion, motivosBloqueo } from '../store.jsx';
import { Badge, Card, PageHeader, Progress, Empty } from '../components/ui.jsx';
import { TIPOS_PERMISO } from '../data/seed.js';

export default function ParadaDetalle() {
  const { id } = useParams();
  const { db, user, update, notify, inScope } = useStore();
  const p = db.paradas.find((x) => x.id === id);
  const [agregar, setAgregar] = useState('');
  if (!p || !inScope(p.unidad)) return <Empty>Parada no encontrada o fuera de tu alcance.</Empty>;

  const cuadrilla = p.cuadrilla.map((pid) => db.personal.find((x) => x.id === pid)).filter(Boolean);
  const bloqueados = cuadrilla.filter((w) => acreditacion(w) === 'bloqueado');
  const permisos = db.permisos.filter((x) => x.paradaId === p.id);
  const insp = db.inspecciones.filter((x) => x.paradaId === p.id);
  const inc = db.incidentes.filter((x) => x.paradaId === p.id);
  const disponibles = db.personal.filter((w) => w.unidad === p.unidad && !p.cuadrilla.includes(w.id));
  const puedeCheck = can(user, 'parada.checklist');
  const puedeEditar = can(user, 'parada.crear') || user.rol === 'lider';
  const listo = p.checklist.length > 0 && p.checklist.every((c) => c.ok) && bloqueados.length === 0;

  const toggle = (i) => update((d) => {
    const c = d.paradas.find((x) => x.id === p.id).checklist[i];
    c.ok = !c.ok;
  }, 'Checklist de inicio actualizado');

  const addWorker = () => {
    const w = db.personal.find((x) => x.id === agregar);
    if (!w) return;
    if (acreditacion(w) === 'bloqueado') {
      notify(`${w.nombre} no puede ingresar: ${motivosBloqueo(w).join(', ')}`);
      return;
    }
    update((d) => { d.paradas.find((x) => x.id === p.id).cuadrilla.push(w.id); }, `${w.nombre} agregado a la cuadrilla`);
    setAgregar('');
  };
  const removeWorker = (wid) => update((d) => {
    const par = d.paradas.find((x) => x.id === p.id);
    par.cuadrilla = par.cuadrilla.filter((x) => x !== wid);
  }, 'Trabajador retirado de la cuadrilla');

  const avanzar = (estado) => update((d) => {
    const par = d.paradas.find((x) => x.id === p.id);
    par.estado = estado;
    if (estado === 'Cerrada') par.avance = 100;
  }, `Parada ${p.id}: ${estado}`);

  return (
    <>
      <Link to="/paradas" className="back"><ArrowLeft size={16} /> Paradas</Link>
      <PageHeader title={`${p.id} · ${p.equipo}`} subtitle={`${p.tipo} · ${nombreUnidad(db, p.unidad)} · ${fmtFecha(p.inicio)} al ${fmtFecha(p.fin)}`}
        actions={<>
          <Badge>{p.estado}</Badge>
          {puedeEditar && p.estado === 'Planificada' && <button className="btn btn-primary" disabled={!listo} title={listo ? '' : 'Completa el checklist y retira al personal bloqueado'} onClick={() => avanzar('En curso')}>Iniciar parada</button>}
          {puedeEditar && p.estado === 'En curso' && <button className="btn" onClick={() => avanzar('Cerrada')}>Cerrar parada</button>}
        </>} />

      <div className="stats">
        <div className="stat"><span className="stat-label">Avance</span><strong className="stat-value">{p.avance}%</strong><Progress value={p.avance} /></div>
        <div className={`stat ${bloqueados.length ? 'bad' : 'ok'}`}><span className="stat-label">Cuadrilla</span><strong className="stat-value">{cuadrilla.length}</strong><span className="stat-hint">{bloqueados.length} bloqueados</span></div>
        <div className="stat"><span className="stat-label">Permisos</span><strong className="stat-value">{permisos.length}</strong><span className="stat-hint">{permisos.filter((x) => x.estado === 'Pendiente firmas').length} por firmar</span></div>
        <div className="stat"><span className="stat-label">Responsables</span><strong className="stat-value small-val">{nombreUsuario(db, p.jefe)}</strong><span className="stat-hint">HSE: {nombreUsuario(db, p.hse)}</span></div>
      </div>

      <div className="grid-2">
        <Card title="Checklist de inicio" actions={listo ? <Badge tone="ok">Lista para iniciar</Badge> : <Badge tone="warn">Pendiente</Badge>}>
          {p.checklist.length === 0 && <Empty>Sin checklist registrado.</Empty>}
          <ul className="checklist">
            {p.checklist.map((c, i) => (
              <li key={i}>
                <button className={`check ${c.ok ? 'on' : ''}`} disabled={!puedeCheck} onClick={() => toggle(i)}>
                  {c.ok ? <CheckSquare size={18} /> : <Square size={18} />} {c.item}
                </button>
              </li>
            ))}
          </ul>
          {!puedeCheck && <p className="muted small">Solo el líder o supervisor HSE marca el checklist.</p>}
        </Card>

        <Card title="Tareas críticas">
          <ol className="ol">{p.tareas.map((t) => <li key={t}>{t}</li>)}</ol>
        </Card>
      </div>

      <Card title="Cuadrilla" actions={puedeEditar && p.estado !== 'Cerrada' && (
        <div className="inline-form">
          <select value={agregar} onChange={(e) => setAgregar(e.target.value)}>
            <option value="">Agregar trabajador…</option>
            {disponibles.map((w) => <option key={w.id} value={w.id}>{w.nombre} · {w.cargo}{acreditacion(w) === 'bloqueado' ? ' (bloqueado)' : ''}</option>)}
          </select>
          <button className="btn btn-sm" onClick={addWorker} disabled={!agregar}><UserPlus size={15} /> Agregar</button>
        </div>
      )}>
        {cuadrilla.length === 0 && <Empty>Aún no hay cuadrilla asignada.</Empty>}
        <table className="table compact">
          <thead><tr><th>Trabajador</th><th>Cargo</th><th>Acreditación</th><th /></tr></thead>
          <tbody>
            {cuadrilla.map((w) => {
              const a = acreditacion(w);
              return (
                <tr key={w.id} className={a === 'bloqueado' ? 'row-bad' : ''}>
                  <td><strong>{w.nombre}</strong><div className="muted small">{w.id}</div></td>
                  <td>{w.cargo}</td>
                  <td>{a === 'bloqueado' ? motivosBloqueo(w).map((m) => <Badge key={m} tone="bad">{m}</Badge>) : <Badge>{a === 'habilitado' ? 'Habilitado' : 'Por vencer'}</Badge>}</td>
                  <td className="right">{puedeEditar && p.estado !== 'Cerrada' && <button className="icon-btn" title="Retirar" onClick={() => removeWorker(w.id)}><Trash2 size={15} /></button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="grid-2">
        <Card title="Permisos de la parada" actions={can(user, 'permiso.crear') && p.estado !== 'Cerrada' && <Link className="btn btn-sm" to={`/permisos?nuevo=1&parada=${p.id}`}><Plus size={15} /> Nuevo permiso</Link>}>
          {permisos.length === 0 && <Empty>Sin permisos registrados.</Empty>}
          {permisos.map((x) => (
            <Link key={x.id} to={`/permisos/${x.id}`} className="row-link">
              <div className="grow"><strong>{x.id} · {TIPOS_PERMISO[x.tipo]}</strong><span className="muted small">{x.tarea}</span></div>
              <Badge>{x.estado}</Badge>
            </Link>
          ))}
        </Card>
        <Card title="Inspecciones e incidentes">
          {insp.length + inc.length === 0 && <Empty>Sin registros.</Empty>}
          {insp.map((x) => (
            <div key={x.id} className="row-link static">
              <div className="grow"><strong>{x.id} · {x.tipo}</strong><span className="muted small">{fmtFecha(x.fecha)} · {x.cumplimiento}% cumplimiento</span></div>
              <Badge>{x.estado}</Badge>
            </div>
          ))}
          {inc.map((x) => (
            <div key={x.id} className="row-link static">
              <div className="grow"><strong>{x.id} · {x.tipo}</strong><span className="muted small">{x.descripcion}</span></div>
              <Badge>{x.estado}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
