import { useParams } from 'react-router-dom';
import { Card, PageHeader, Badge } from '../components/ui.jsx';

const FASES = {
  salud: { titulo: 'Salud ocupacional', fase: 2, intro: 'Vigilancia médica y salud del trabajador, con el detalle clínico visible solo para el área médica.', items: ['Vigilancia médica: EMO, aptitudes, restricciones y seguimiento', 'Monitoreo de agentes: ruido, polvo respirable, gases y ergonomía por puesto', 'Control de fatiga: horas trabajadas y descansos en paradas largas', 'Alertas automáticas de restricciones al asignar cuadrillas'] },
  ambiente: { titulo: 'Medio ambiente', fase: 3, intro: 'Registro y control de los aspectos ambientales de los trabajos en planta.', items: ['Residuos: generación, segregación y disposición por unidad', 'Derrames: reporte, contención y cierre', 'Matriz de aspectos e impactos por actividad', 'Reporte ambiental a cada unidad minera'] },
  gestion: { titulo: 'PASSO, comité y auditorías', fase: 2, intro: 'La gestión del sistema: programa anual, comité, requisitos legales y auditorías.', items: ['Programa anual (PASSO) con avance por unidad', 'Comité SSO: actas, acuerdos y seguimiento', 'Matriz de requisitos legales y de cada unidad', 'Auditorías internas y del titular, con sus hallazgos conectados a planes de acción', 'Gestión del cambio (fase 3)'] },
};

export default function Fase() {
  const { id } = useParams();
  const f = FASES[id] || FASES.salud;
  return (
    <>
      <PageHeader title={f.titulo} subtitle={f.intro} actions={<Badge tone="info">Fase {f.fase}</Badge>} />
      <Card title="Qué incluirá este módulo">
        <ul className="ol">{f.items.map((i) => <li key={i}>{i}</li>)}</ul>
        <p className="muted small">Módulo previsto en la hoja de ruta. Usará la misma base de unidades, personal, permisos por rol y repositorio de archivos.</p>
      </Card>
    </>
  );
}
