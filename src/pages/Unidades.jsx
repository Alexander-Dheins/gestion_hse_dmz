import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore, acreditacion } from '../store.jsx';
import { Card, PageHeader, Modal, Field, Badge } from '../components/ui.jsx';

export default function Unidades() {
  const { db, user, scopeUnits, update } = useStore();
  const [nueva, setNueva] = useState(null);
  const unidades = db.unidades.filter((u) => scopeUnits.includes(u.id));

  const guardar = () => {
    if (!nueva.nombre.trim()) return;
    update((d) => {
      const n = d.unidades.length + 1;
      const id = 'UM' + n;
      d.unidades.push({ id, nombre: nueva.nombre.trim(), titular: nueva.titular || '—', region: nueva.region || '—', planta: nueva.planta || '—', formato: nueva.formato || 'Por definir', contacto: '—', estandares: 0 });
      d.hh[id] = 0;
      // Al crear la unidad, se crean sus carpetas estándar en el repositorio
      const base = 'u' + n + 'x';
      d.carpetas.push({ id: base, nombre: nueva.nombre.trim(), parentId: 'f02', acl: { lider: 'admin' }, usuarios: {}, unidad: id });
      ['Estándares y requisitos de la unidad', 'Reportes diarios', 'Paradas', 'Inspecciones y hallazgos'].forEach((nom, i) =>
        d.carpetas.push({ id: base + i, nombre: nom, parentId: base, acl: null, usuarios: {}, unidad: null }));
    }, `Unidad "${nueva.nombre.trim()}" creada con su estructura de carpetas`);
    setNueva(null);
  };

  return (
    <>
      <PageHeader
        title="Unidades mineras"
        subtitle="Cada unidad tiene sus estándares, formatos de reporte y requisitos de ingreso. Agregar una unidad es configuración, no desarrollo."
        actions={user.rol === 'gerente' && <button className="btn btn-primary" onClick={() => setNueva({ nombre: '', titular: '', region: '', planta: '', formato: '' })}><Plus size={16} /> Agregar unidad</button>}
      />
      <div className="cards">
        {unidades.map((u) => {
          const pers = db.personal.filter((p) => p.unidad === u.id);
          const bloq = pers.filter((p) => acreditacion(p) === 'bloqueado').length;
          const par = db.paradas.filter((p) => p.unidad === u.id);
          const curso = par.filter((p) => p.estado === 'En curso').length;
          const abiertos = db.planes.filter((p) => p.unidad === u.id && p.estado !== 'Cerrado').length;
          return (
            <Card key={u.id} title={u.nombre} actions={curso ? <Badge tone="info">{curso} parada en curso</Badge> : null}>
              <p className="muted small">{u.titular}</p>
              <dl className="dl">
                <dt>Planta</dt><dd>{u.planta}</dd>
                <dt>Región</dt><dd>{u.region}</dd>
                <dt>Formato de reporte diario</dt><dd><code>{u.formato}</code></dd>
                <dt>Estándares cargados</dt><dd>{u.estandares}</dd>
                <dt>Contacto SSO del titular</dt><dd>{u.contacto}</dd>
              </dl>
              <div className="mini-stats">
                <div><strong>{pers.length}</strong><span>trabajadores</span></div>
                <div><strong className={bloq ? 'txt-bad' : ''}>{bloq}</strong><span>bloqueados</span></div>
                <div><strong>{par.length}</strong><span>paradas</span></div>
                <div><strong className={abiertos ? 'txt-warn' : ''}>{abiertos}</strong><span>hallazgos abiertos</span></div>
              </div>
            </Card>
          );
        })}
      </div>

      {nueva && (
        <Modal title="Agregar unidad minera" onClose={() => setNueva(null)}
          footer={<><button className="btn" onClick={() => setNueva(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Crear unidad</button></>}>
          <Field label="Nombre de la unidad"><input value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="U.M. ..." /></Field>
          <Field label="Titular minero"><input value={nueva.titular} onChange={(e) => setNueva({ ...nueva, titular: e.target.value })} /></Field>
          <div className="form-2">
            <Field label="Región"><input value={nueva.region} onChange={(e) => setNueva({ ...nueva, region: e.target.value })} /></Field>
            <Field label="Código de formato de reporte"><input value={nueva.formato} onChange={(e) => setNueva({ ...nueva, formato: e.target.value })} /></Field>
          </div>
          <Field label="Planta"><input value={nueva.planta} onChange={(e) => setNueva({ ...nueva, planta: e.target.value })} /></Field>
          <p className="muted small">Se crearán automáticamente sus carpetas en el repositorio y su espacio de configuración.</p>
        </Modal>
      )}
    </>
  );
}
