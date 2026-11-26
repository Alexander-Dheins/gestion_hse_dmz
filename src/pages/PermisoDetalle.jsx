import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PenLine, CheckCircle2, Circle, Printer } from 'lucide-react';
import { useStore, fmtFecha, nombreUnidad, nombreUsuario, nombrePersonal, puedeFirmar, acreditacion, motivosBloqueo } from '../store.jsx';
import { Badge, Card, PageHeader, Empty } from '../components/ui.jsx';
import { TIPOS_PERMISO, ETIQUETA_FIRMA, ROLES } from '../data/seed.js';

export default function PermisoDetalle() {
  const { id } = useParams();
  const { db, user, update, notify, inScope } = useStore();
  const p = db.permisos.find((x) => x.id === id);
  if (!p || !inScope(p.unidad)) return <Empty>Permiso no encontrado o fuera de tu alcance.</Empty>;
  const parada = db.paradas.find((x) => x.id === p.paradaId);
  const puede = puedeFirmar(user, p);

  const firmar = () => {
    if (user.rol === 'trabajador') {
      const yo = db.personal.find((w) => w.id === user.personalId);
      if (yo && acreditacion(yo) === 'bloqueado') {
        notify(`No puedes firmar: ${motivosBloqueo(yo).join(', ')}`);
        return;
      }
    }
    update((d) => {
      const per = d.permisos.find((x) => x.id === p.id);
      const f = per.firmas.find((x) => !x.userId);
      const now = new Date();
      f.userId = user.id;
      f.fecha = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
      per.estado = per.firmas.every((x) => x.userId) ? 'Aprobado' : 'Pendiente firmas';
    }, `${p.id} firmado por ${user.nombre}`);
  };
  const cambiar = (estado) => update((d) => { d.permisos.find((x) => x.id === p.id).estado = estado; }, `${p.id}: ${estado}`);
  const puedeCerrar = ['supervisor', 'lider'].includes(user.rol) && p.estado === 'Aprobado';
  const puedeAnular = ['supervisor', 'lider', 'gerente'].includes(user.rol) && ['Pendiente firmas', 'Borrador', 'Aprobado'].includes(p.estado);

  return (
    <>
      <Link to="/permisos" className="back"><ArrowLeft size={16} /> Permisos</Link>
      <PageHeader title={`${p.id} · ${TIPOS_PERMISO[p.tipo]}`} subtitle={`${nombreUnidad(db, p.unidad)} · ${parada ? parada.equipo : p.paradaId} · ${fmtFecha(p.fecha)}`}
        actions={<>
          <Badge>{p.estado}</Badge>
          {puede && <button className="btn btn-primary" onClick={firmar}><PenLine size={16} /> Firmar como {ETIQUETA_FIRMA[user.rol].toLowerCase()}</button>}
          {puedeCerrar && <button className="btn" onClick={() => cambiar('Cerrado')}>Cerrar permiso</button>}
          {puedeAnular && <button className="btn btn-ghost" onClick={() => cambiar('Anulado')}>Anular</button>}
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
        </>} />

      <div className="grid-2">
        <Card title="Trabajo autorizado">
          <p>{p.tarea}</p>
          {parada && <p className="muted small">Parada <Link className="link" to={`/paradas/${parada.id}`}>{parada.id}</Link> · {parada.tipo}</p>}
          {p.puntos && (
            <>
              <h4 className="h4">Puntos de bloqueo</h4>
              <table className="table compact">
                <thead><tr><th>Equipo</th><th>Energía</th><th>Candado</th><th>Verificado en cero</th></tr></thead>
                <tbody>{p.puntos.map((x, i) => <tr key={i}><td>{x.equipo}</td><td>{x.energia}</td><td><code>{x.candado}</code></td><td>{x.verificado ? <Badge tone="ok">Sí</Badge> : <Badge tone="warn">Pendiente</Badge>}</td></tr>)}</tbody>
              </table>
            </>
          )}
          {p.gases && (
            <>
              <h4 className="h4">Monitoreo de gases antes del ingreso</h4>
              <div className="mini-stats">
                <div><strong>{p.gases.o2}</strong><span>O₂ (19.5–23.5 %)</span></div>
                <div><strong>{p.gases.lel}</strong><span>LEL (&lt; 10 %)</span></div>
                <div><strong>{p.gases.co}</strong><span>CO (&lt; 25 ppm)</span></div>
                <div><strong>{p.gases.h2s}</strong><span>H₂S (&lt; 10 ppm)</span></div>
              </div>
              {p.vigia && <p className="small">Vigía: <strong>{nombrePersonal(db, p.vigia)}</strong></p>}
            </>
          )}
          {p.izaje && (
            <>
              <h4 className="h4">Datos del izaje</h4>
              <div className="mini-stats">
                <div><strong>{p.izaje.carga}</strong><span>carga</span></div>
                <div><strong>{p.izaje.capacidad}</strong><span>grúa</span></div>
                <div><strong>{p.izaje.radio}</strong><span>radio</span></div>
                <div><strong>{p.izaje.porcentaje}</strong><span>% de capacidad</span></div>
              </div>
            </>
          )}
        </Card>

        <Card title="Flujo de firmas">
          <ol className="flow">
            {p.firmas.map((f, i) => {
              const siguiente = !f.userId && p.firmas.slice(0, i).every((x) => x.userId);
              return (
                <li key={i} className={f.userId ? 'done' : siguiente ? 'next' : ''}>
                  {f.userId ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  <div>
                    <strong>{ETIQUETA_FIRMA[f.rol]}</strong>
                    <span className="muted small">{f.userId ? `${nombreUsuario(db, f.userId)} · ${fmtFecha(f.fecha)}` : siguiente ? `Pendiente · ${ROLES[f.rol].nombre}` : 'En espera'}</span>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="muted small">Cada firma queda registrada con usuario, fecha y hora, y no se puede borrar. El orden de firmas se configura por unidad y por tipo de trabajo.</p>
        </Card>
      </div>
    </>
  );
}
