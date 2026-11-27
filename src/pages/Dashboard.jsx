import { Link } from 'react-router-dom';
import { indicadores as indicadoresSg, rango, ultimoMesCerrado } from '../lib/sgsst.js';
import { ANIO } from '../data/seed3.js';
import { useStore, acreditacion, motivosBloqueo, estadoFecha, fmtFecha, nombreUnidad, nombreUsuario, puedeFirmar, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Progress, Stat, Empty } from '../components/ui.jsx';
import { TIPOS_PERMISO, ROLES } from '../data/seed.js';

export default function Dashboard() {
  const { db, user, visibleUnits, inScope } = useStore();
  if (user.rol === 'trabajador') return <MiPanel />;

  const personal = db.personal.filter((p) => inScope(p.unidad));
  const bloqueados = personal.filter((p) => acreditacion(p) === 'bloqueado');
  const porVencer = personal.filter((p) => acreditacion(p) === 'por vencer');
  const paradas = db.paradas.filter((p) => inScope(p.unidad));
  const enCurso = paradas.filter((p) => p.estado === 'En curso');
  const proximas = paradas.filter((p) => p.estado === 'Planificada').sort((a, b) => a.inicio.localeCompare(b.inicio));
  const permisos = db.permisos.filter((p) => inScope(p.unidad));
  const pendientes = permisos.filter((p) => p.estado === 'Pendiente firmas');
  const misFirmas = permisos.filter((p) => puedeFirmar(user, p));
  const planes = db.planes.filter((p) => inScope(p.unidad));
  const abiertos = planes.filter((p) => p.estado !== 'Cerrado');
  const vencidos = abiertos.filter((p) => p.vence < hoy());
  const kpi = indicadoresSg(db, { sedes: visibleUnits, meses: rango(0, ultimoMesCerrado(db)), anio: ANIO });
  const habil = personal.length ? Math.round(((personal.length - bloqueados.length) / personal.length) * 100) : 0;

  const porUnidad = visibleUnits.map((u) => ({
    u, abiertos: planes.filter((p) => p.unidad === u && p.estado !== 'Cerrado').length,
    bloq: personal.filter((p) => p.unidad === u && acreditacion(p) === 'bloqueado').length,
  }));
  const maxA = Math.max(1, ...porUnidad.map((x) => x.abiertos));

  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(' ')[0]}`} subtitle={`${ROLES[user.rol].nombre} · ${visibleUnits.length === 1 ? nombreUnidad(db, visibleUnits[0]) : `${visibleUnits.filter((u) => !u.startsWith('T')).length} unidades mineras y ${visibleUnits.filter((u) => u.startsWith('T')).length} talleres`} · ${fmtFecha(hoy())}`} />

      <div className="stats">
        <Stat label="Personal habilitado" value={`${habil}%`} hint={`${bloqueados.length} bloqueados · ${porVencer.length} por vencer`} tone={bloqueados.length ? 'warn' : 'ok'} />
        <Stat label="Paradas en curso" value={enCurso.length} hint={`${proximas.length} planificadas`} />
        <Stat label="Permisos por firmar" value={pendientes.length} hint={misFirmas.length ? `${misFirmas.length} esperan tu firma` : 'Ninguno espera tu firma'} tone={misFirmas.length ? 'warn' : ''} />
        <Stat label="Planes de acción abiertos" value={abiertos.length} hint={`${vencidos.length} vencidos`} tone={vencidos.length ? 'bad' : 'ok'} />
        <Stat label="Índice de frecuencia" value={kpi.IF.toFixed(2)} hint={`IG ${kpi.IG.toFixed(2)} · TRIR ${kpi.TRIR.toFixed(2)}`} />
        <Stat label="Horas hombre (año)" value={kpi.hht.toLocaleString('es-PE')} hint={`${kpi.eventos.length} eventos en el año`} />
      </div>

      <div className="grid-2">
        <Card title="Paradas en curso" actions={<Link to="/paradas" className="link">Ver todas</Link>}>
          {enCurso.length === 0 && <Empty>No hay paradas en curso.</Empty>}
          {enCurso.map((p) => (
            <Link to={`/paradas/${p.id}`} key={p.id} className="row-link">
              <div className="grow">
                <strong>{p.equipo}</strong>
                <span className="muted small">{nombreUnidad(db, p.unidad)} · {p.tipo} · hasta {fmtFecha(p.fin)}</span>
                <Progress value={p.avance} />
              </div>
              <span className="pct">{p.avance}%</span>
            </Link>
          ))}
          {proximas.slice(0, 3).map((p) => (
            <Link to={`/paradas/${p.id}`} key={p.id} className="row-link">
              <div className="grow">
                <strong>{p.equipo}</strong>
                <span className="muted small">{nombreUnidad(db, p.unidad)} · inicia {fmtFecha(p.inicio)}</span>
              </div>
              <Badge>Planificada</Badge>
            </Link>
          ))}
        </Card>

        <Card title="Esperan tu firma" actions={<Link to="/permisos" className="link">Ir a permisos</Link>}>
          {misFirmas.length === 0 && <Empty>No tienes permisos pendientes de firma.</Empty>}
          {misFirmas.map((p) => (
            <Link to={`/permisos/${p.id}`} key={p.id} className="row-link">
              <div className="grow">
                <strong>{p.id} · {TIPOS_PERMISO[p.tipo]}</strong>
                <span className="muted small">{p.tarea}</span>
              </div>
              <Badge>Pendiente firmas</Badge>
            </Link>
          ))}
        </Card>

        <Card title="Personal bloqueado para ingresar" actions={<Link to="/personal" className="link">Ver personal</Link>}>
          {bloqueados.length === 0 && <Empty>Todo el personal está habilitado.</Empty>}
          <table className="table compact">
            <tbody>
              {bloqueados.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong><div className="muted small">{p.cargo} · {nombreUnidad(db, p.unidad)}</div></td>
                  <td className="right">{motivosBloqueo(p).map((m) => <Badge key={m} tone="bad">{m}</Badge>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Planes de acción vencidos" actions={<Link to="/planes" className="link">Ver planes</Link>}>
          {vencidos.length === 0 && <Empty>Sin planes vencidos.</Empty>}
          <table className="table compact">
            <tbody>
              {vencidos.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.descripcion}</strong><div className="muted small">{p.id} · {nombreUsuario(db, p.responsable)} · {nombreUnidad(db, p.unidad)}</div></td>
                  <td className="right"><Badge tone="bad">Venció {fmtFecha(p.vence)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {visibleUnits.length > 1 && (
        <Card title="Planes de acción abiertos por sede">
          <div className="bars">
            {porUnidad.map((x) => (
              <div className="bar-row" key={x.u}>
                <span className="bar-label">{nombreUnidad(db, x.u)}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(x.abiertos / maxA) * 100}%` }} /></div>
                <span className="bar-val">{x.abiertos}</span>
                <span className="muted small bar-extra">{x.bloq} bloqueados</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function MiPanel() {
  const { db, user } = useStore();
  const yo = db.personal.find((p) => p.id === user.personalId);
  const estado = yo ? acreditacion(yo) : 'bloqueado';
  const misPermisos = db.permisos.filter((p) => p.unidad === user.unidad && p.firmas.some((f) => f.rol === 'trabajador'));
  const misFirmas = misPermisos.filter((p) => puedeFirmar(user, p));
  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(' ')[0]}`} subtitle={`${user.cargo} · ${nombreUnidad(db, user.unidad)}`} />
      <div className="grid-2">
        <Card title="Mi acreditación">
          {yo && (
            <>
              <p>Estado para ingresar a planta: <Badge>{estado === 'habilitado' ? 'Habilitado' : estado === 'por vencer' ? 'Por vencer' : 'Bloqueado'}</Badge></p>
              <table className="table compact">
                <tbody>
                  <tr><td>Examen médico (aptitud)</td><td>{yo.aptitud}</td><td className="right"><Badge>{estadoFecha(yo.emoVence)}</Badge> {fmtFecha(yo.emoVence)}</td></tr>
                  <tr><td>SCTR</td><td /><td className="right"><Badge>{estadoFecha(yo.sctrVence)}</Badge> {fmtFecha(yo.sctrVence)}</td></tr>
                  <tr><td>Inducción de la unidad</td><td /><td className="right"><Badge>{estadoFecha(yo.induccionVence)}</Badge> {fmtFecha(yo.induccionVence)}</td></tr>
                </tbody>
              </table>
            </>
          )}
        </Card>
        <Card title="Permisos que esperan tu firma">
          {misFirmas.length === 0 && <Empty>Nada pendiente.</Empty>}
          {misFirmas.map((p) => (
            <Link to={`/permisos/${p.id}`} key={p.id} className="row-link">
              <div className="grow"><strong>{p.id} · {TIPOS_PERMISO[p.tipo]}</strong><span className="muted small">{p.tarea}</span></div>
              <Badge>Pendiente firmas</Badge>
            </Link>
          ))}
        </Card>
      </div>
      <div className="quick">
        <Link to="/incidentes?nuevo=1" className="btn btn-danger">Reportar un incidente</Link>
        <Link to="/inspecciones?nuevo=1" className="btn">Registrar una observación</Link>
        <Link to="/iperc" className="btn">Ver IPERC de mi tarea</Link>
      </div>
    </>
  );
}
