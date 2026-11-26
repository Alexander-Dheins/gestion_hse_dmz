import { useStore, nombreUnidad } from '../store.jsx';
import { Card, PageHeader } from '../components/ui.jsx';
import { ROLES } from '../data/seed.js';

const R = ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'sup_mant', 'medico', 'trabajador'];
// C crear · E editar · A aprobar/firmar · V ver · — sin acceso
const MATRIZ = [
  ['Inspecciones y observaciones', 'V', 'V·A', 'C·E', 'C', 'C', 'V', '—', 'C'],
  ['Incidentes y accidentes', 'V·A', 'A', 'C·E', 'C', 'C', 'C', 'C', 'C'],
  ['Planes de acción', 'A', 'C·A', 'C·E', 'V', 'E', 'E', '—', 'V'],
  ['Permisos de alto riesgo', 'V', 'A', 'A', 'V', 'V', 'C·A', '—', 'C·A'],
  ['IPERC y PETS', 'V', 'A', 'C·E', 'V', 'E', 'V', '—', 'V'],
  ['Paradas de planta', 'C', 'C·A', 'A', 'V', 'V', 'C·E', '—', '—'],
  ['Personal y acreditación', 'V', 'E', 'V', 'C·E', 'V', 'V', 'E (aptitud)', 'V (propio)'],
  ['Detalle médico del EMO', '—', '—', '—', '—', '—', '—', 'C·E', '—'],
  ['Capacitaciones y EPP', 'V', 'A', 'C', 'C·E', 'V', 'V', 'V', 'V (propio)'],
  ['Salud ocupacional', 'V', 'V', 'V', 'V', 'V', '—', 'C·E·A', '—'],
  ['Medio ambiente', 'V', 'C·A', 'C', 'C', 'C', 'V', 'V', '—'],
  ['PASSO, comité y auditorías', 'C·A', 'C·E', 'V', 'V', 'C·E', 'V', 'V', '—'],
  ['Formatos (generar e imprimir)', 'V', 'C', 'C', 'C', 'C', 'C', 'C', 'C (propios)'],
  ['Repositorio de archivos', 'Admin', 'Según carpeta', 'Según carpeta', 'Según carpeta', 'Según carpeta', 'Según carpeta', 'Según carpeta', 'Según carpeta'],
  ['Reportes a la unidad', 'V', 'C·A', 'C', 'C', 'C', '—', '—', '—'],
  ['Tableros e indicadores', 'V (todas)', 'V', 'V', 'V', 'C·E', 'V', 'V', '—'],
];

export default function Roles() {
  const { db } = useStore();
  return (
    <>
      <PageHeader title="Roles y permisos" subtitle="C crear · E editar · A aprobar o firmar · V solo ver · — sin acceso. Los permisos se aplican además por unidad minera." />
      <Card title="Alcance de datos por rol">
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>Rol</th><th>Alcance</th><th>Usuarios demo</th></tr></thead>
            <tbody>
              {R.map((r) => (
                <tr key={r}><td><strong>{ROLES[r].nombre}</strong></td><td>{ROLES[r].alcance}</td><td>{db.usuarios.filter((u) => u.rol === r).map((u) => `${u.nombre}${u.unidad ? ' (' + nombreUnidad(db, u.unidad) + ')' : ''}`).join(', ')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Matriz rol × módulo">
        <div className="table-wrap">
          <table className="table compact matrix">
            <thead><tr><th>Módulo</th>{R.map((r) => <th key={r}>{ROLES[r].nombre}</th>)}</tr></thead>
            <tbody>
              {MATRIZ.map(([mod, ...cells]) => (
                <tr key={mod}><td><strong>{mod}</strong></td>{cells.map((c, i) => <td key={i} className={c.includes('A') && !c.includes('Admin') ? 'cell-a' : c === '—' ? 'cell-none' : ''}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
