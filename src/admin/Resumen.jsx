import { Link } from 'react-router-dom';
import { Upload, Send, Layers } from 'lucide-react';
import { useAcceso, accesosDe } from '../acceso/db.jsx';
import { PageHeader, Stat, Card } from '../components/ui.jsx';
import { GrupoChip, permisosTexto } from './comun.jsx';

export default function Resumen() {
  const { db } = useAcceso();
  const activos = db.trabajadores.filter((t) => t.activo);
  const acc = activos.map((t) => accesosDe(db, t));
  const ambos = acc.filter((a) => a.cap && a.ssoma).length;
  const soloCap = acc.filter((a) => a.cap && !a.ssoma).length;
  const soloSsoma = acc.filter((a) => !a.cap && a.ssoma).length;
  const sin = acc.filter((a) => !a.cap && !a.ssoma && !a.admin).length;
  const sinEnvio = db.trabajadores.filter((t) => t.activo && t.grupos.length && !t.envios.length).length;
  const max = Math.max(1, ...db.grupos.map((g) => db.trabajadores.filter((t) => t.grupos.includes(g.id)).length));

  return (
    <>
      <PageHeader title="Resumen de accesos" subtitle="Quién entra a qué módulo. El acceso de cada persona es la suma de los permisos de sus grupos."
        actions={<>
          <Link to="/carga" className="btn"><Upload size={15} /> Carga masiva</Link>
          <Link to="/grupos" className="btn btn-primary"><Layers size={15} /> Gestionar grupos</Link>
        </>} />
      <div className="stats">
        <Stat label="Trabajadores activos" value={activos.length} hint={`${db.trabajadores.length - activos.length} desactivados`} />
        <Stat label="Capacitaciones + SSOMA" value={ambos} tone="ok" hint="Acceso a ambos módulos" />
        <Stat label="Solo Capacitaciones" value={soloCap} />
        <Stat label="Solo SSOMA DMZ" value={soloSsoma} />
        <Stat label="Sin ningún acceso" value={sin} tone={sin ? 'warn' : ''} hint="No pertenecen a ningún grupo" />
      </div>
      {sinEnvio > 0 && (
        <div className="note"><Send size={15} /> {sinEnvio} trabajadores con grupo asignado todavía no recibieron su usuario y PIN. <Link className="link" to="/trabajadores?f=sin-envio">Ver y enviar</Link></div>
      )}
      <Card title="Personas por grupo">
        <div className="bars">
          {db.grupos.map((g) => {
            const n = db.trabajadores.filter((t) => t.grupos.includes(g.id)).length;
            return (
              <div className="bar-row grp" key={g.id}>
                <span className="bar-label"><GrupoChip g={g} /></span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / max) * 100}%`, background: g.color }} /></div>
                <span className="bar-val">{n}</span>
                <span className="muted small bar-extra">{permisosTexto(g.permisos)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
