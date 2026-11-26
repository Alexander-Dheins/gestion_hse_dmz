import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, puedeFirmar, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';
import { TIPOS_PERMISO, FLUJO_FIRMAS, ETIQUETA_FIRMA } from '../data/seed.js';

export default function Permisos() {
  const { db, user, inScope, update } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todos');
  const [nuevo, setNuevo] = useState(null);

  const paradasAbiertas = db.paradas.filter((p) => inScope(p.unidad) && p.estado !== 'Cerrada');

  useEffect(() => {
    if (params.get('nuevo') && can(user, 'permiso.crear')) {
      const par = params.get('parada') || paradasAbiertas[0]?.id || '';
      setNuevo({ tipo: 'EC', paradaId: par, tarea: '', fecha: hoy() });
      setParams({}, { replace: true });
    }
  }, [params]); // eslint-disable-line

  const lista = db.permisos
    .filter((p) => inScope(p.unidad))
    .filter((p) => filtro === 'todos' || (filtro === 'mios' ? puedeFirmar(user, p) : p.estado === filtro))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const guardar = () => {
    const par = db.paradas.find((p) => p.id === nuevo.paradaId);
    if (!par || !nuevo.tarea.trim()) return;
    let creado;
    update((d) => {
      const n = Math.max(...d.permisos.map((p) => parseInt(p.id.split('-')[1], 10))) + 1;
      creado = `PT-${n}`;
      d.permisos.push({
        id: creado, tipo: nuevo.tipo, paradaId: par.id, unidad: par.unidad, tarea: nuevo.tarea.trim(), fecha: nuevo.fecha, estado: 'Pendiente firmas',
        firmas: FLUJO_FIRMAS.map((rol) => ({ rol, userId: null, fecha: null })),
        ...(nuevo.tipo === 'LOTO' ? { puntos: [{ equipo: 'Por definir', energia: 'Eléctrica', candado: '—', verificado: false }] } : {}),
        ...(nuevo.tipo === 'EC' ? { gases: { o2: '—', lel: '—', co: '—', h2s: '—' } } : {}),
      });
    }, `Permiso creado para ${par.id}`);
    setNuevo(null);
    setTimeout(() => creado && navigate(`/permisos/${creado}`), 0);
  };

  return (
    <>
      <PageHeader title="Permisos de alto riesgo" subtitle="PETAR y bloqueo y etiquetado (LOTO) con firmas en orden: ejecutante → responsable del trabajo → supervisor HSE → jefe HSE."
        actions={can(user, 'permiso.crear') && <button className="btn btn-primary" onClick={() => setNuevo({ tipo: 'EC', paradaId: paradasAbiertas[0]?.id || '', tarea: '', fecha: hoy() })}><Plus size={16} /> Nuevo permiso</button>} />
      <div className="tabs">
        {[['todos', 'Todos'], ['mios', 'Esperan mi firma'], ['Pendiente firmas', 'Pendientes'], ['Aprobado', 'Aprobados'], ['Cerrado', 'Cerrados'], ['Borrador', 'Borradores']].map(([k, l]) => (
          <button key={k} className={filtro === k ? 'active' : ''} onClick={() => setFiltro(k)}>{l}</button>
        ))}
      </div>
      <Card>
        {lista.length === 0 && <Empty>No hay permisos para mostrar.</Empty>}
        <table className="table">
          <thead><tr><th>N.º</th><th>Tipo</th><th>Tarea</th><th>Parada</th><th>Fecha</th><th>Firmas</th><th>Estado</th></tr></thead>
          <tbody>
            {lista.map((p) => {
              const ok = p.firmas.filter((f) => f.userId).length;
              return (
                <tr key={p.id}>
                  <td><Link className="link" to={`/permisos/${p.id}`}>{p.id}</Link></td>
                  <td>{TIPOS_PERMISO[p.tipo]}</td>
                  <td>{p.tarea}<div className="muted small">{nombreUnidad(db, p.unidad)}</div></td>
                  <td className="nowrap">{p.paradaId}</td>
                  <td className="nowrap">{fmtFecha(p.fecha)}</td>
                  <td><div className="sig-dots">{p.firmas.map((f, i) => <span key={i} className={f.userId ? 'on' : ''} title={ETIQUETA_FIRMA[f.rol]} />)}</div><span className="small muted">{ok}/{p.firmas.length}</span></td>
                  <td>{puedeFirmar(user, p) ? <Badge tone="warn">Tu firma</Badge> : <Badge>{p.estado}</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {nuevo && (
        <Modal title="Nuevo permiso de trabajo" onClose={() => setNuevo(null)}
          footer={<><button className="btn" onClick={() => setNuevo(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar} disabled={!nuevo.paradaId || !nuevo.tarea.trim()}>Crear y enviar a firmas</button></>}>
          <Field label="Tipo de permiso">
            <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
              {Object.entries(TIPOS_PERMISO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Parada">
            <select value={nuevo.paradaId} onChange={(e) => setNuevo({ ...nuevo, paradaId: e.target.value })}>
              {paradasAbiertas.length === 0 && <option value="">No hay paradas abiertas</option>}
              {paradasAbiertas.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.equipo}</option>)}
            </select>
          </Field>
          <Field label="Tarea"><textarea rows={3} value={nuevo.tarea} onChange={(e) => setNuevo({ ...nuevo, tarea: e.target.value })} placeholder="Describe el trabajo de alto riesgo" /></Field>
          <Field label="Fecha"><input type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}
