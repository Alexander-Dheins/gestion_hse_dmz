import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bell, FileText } from 'lucide-react';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtIncidente } from '../formatos.jsx';
import { useStore, can, fmtFecha, nombreUnidad, nombreUsuario, nextId, hoy, indicadores } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty, Stat } from '../components/ui.jsx';

const TIPOS = ['Incidente', 'Incidente peligroso', 'Accidente leve', 'Accidente incapacitante'];

export default function Incidentes() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [params, setParams] = useSearchParams();
  const [nuevo, setNuevo] = useState(null);
  const [inv, setInv] = useState(null);
  const [formato, setFormato] = useState(null);
  const lista = db.incidentes.filter((x) => inScope(x.unidad)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const kpi = indicadores(db, visibleUnits);

  const abrir = () => {
    const unidad = visibleUnits[0];
    setNuevo({ tipo: 'Incidente', unidad, paradaId: db.paradas.find((p) => p.unidad === unidad && p.estado === 'En curso')?.id || '', descripcion: '', diasPerdidos: 0 });
  };
  useEffect(() => {
    if (params.get('nuevo') && can(user, 'incidente.crear')) { abrir(); setParams({}, { replace: true }); }
  }, [params]); // eslint-disable-line

  const guardar = () => {
    if (!nuevo.descripcion.trim()) return;
    const rec = { id: nextId(db.incidentes, 'INC'), ...nuevo, paradaId: nuevo.paradaId || null, diasPerdidos: +nuevo.diasPerdidos || 0, fecha: hoy(), estado: 'En investigación', reportadoPor: user.id };
    update((d) => { d.incidentes.push(rec); }, 'Incidente reportado · se notificó al líder HSE y a la unidad minera');
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
      <PageHeader title="Incidentes y accidentes" subtitle="Reporte inmediato desde campo, aviso automático a la unidad, investigación y causa raíz."
        actions={can(user, 'incidente.crear') && <button className="btn btn-danger" onClick={abrir}><AlertTriangle size={16} /> Reportar</button>} />
      {user.rol !== 'trabajador' && (
        <div className="stats">
          <Stat label="Eventos reportados" value={lista.length} />
          <Stat label="En investigación" value={lista.filter((x) => x.estado === 'En investigación').length} tone="warn" />
          <Stat label="Índice de frecuencia (IF)" value={kpi.IF.toFixed(2)} hint="accidentes incapacitantes × 10⁶ / HH" />
          <Stat label="Índice de severidad (IS)" value={kpi.IS.toFixed(2)} hint="días perdidos × 10⁶ / HH" />
          <Stat label="Índice de accidentabilidad" value={kpi.IA.toFixed(3)} hint="IF × IS / 1000" />
        </div>
      )}
      <Card>
        {lista.length === 0 && <Empty>Sin eventos reportados.</Empty>}
        <table className="table">
          <thead><tr><th>N.º</th><th>Tipo</th><th>Descripción</th><th>Unidad</th><th>Fecha</th><th>Días perdidos</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.map((x) => (
              <tr key={x.id}>
                <td><strong>{x.id}</strong></td>
                <td><Badge>{x.tipo}</Badge></td>
                <td>{x.descripcion}<div className="muted small">Reportó {nombreUsuario(db, x.reportadoPor)}{x.causaRaiz ? ` · Causa raíz: ${x.causaRaiz}` : ''}</div></td>
                <td>{nombreUnidad(db, x.unidad)}</td>
                <td className="nowrap">{fmtFecha(x.fecha)}</td>
                <td className="center">{x.diasPerdidos}</td>
                <td><Badge>{x.estado}</Badge></td>
                <td className="actions-cell">{x.estado === 'En investigación' && can(user, 'incidente.investigar') && <button className="btn btn-sm" onClick={() => setInv({ id: x.id, causa: '', accion: '' })}>Investigar</button>}<button className="btn btn-sm" onClick={() => setFormato(fmtIncidente(db, x))}><FileText size={14} /> Formato</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {nuevo && (
        <Modal title="Reportar incidente" onClose={() => setNuevo(null)}
          footer={<><span className="muted small grow"><Bell size={14} /> Se avisará al líder HSE y a la unidad.</span><button className="btn" onClick={() => setNuevo(null)}>Cancelar</button><button className="btn btn-danger" onClick={guardar}>Enviar y generar reporte</button></>}>
          <div className="form-2">
            <Field label="Tipo"><select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Unidad"><select value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value, paradaId: '' })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
          </div>
          <Field label="Parada (opcional)">
            <select value={nuevo.paradaId} onChange={(e) => setNuevo({ ...nuevo, paradaId: e.target.value })}>
              <option value="">Sin parada</option>
              {db.paradas.filter((p) => p.unidad === nuevo.unidad).map((p) => <option key={p.id} value={p.id}>{p.id} · {p.equipo}</option>)}
            </select>
          </Field>
          <Field label="¿Qué pasó?"><textarea rows={4} value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Describe el evento, lugar y personas involucradas" /></Field>
          {nuevo.tipo.startsWith('Accidente') && <Field label="Días perdidos (estimado)"><input type="number" min="0" value={nuevo.diasPerdidos} onChange={(e) => setNuevo({ ...nuevo, diasPerdidos: e.target.value })} /></Field>}
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
