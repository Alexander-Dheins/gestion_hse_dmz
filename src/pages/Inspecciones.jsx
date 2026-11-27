import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { PageHeader } from '../components/ui.jsx';
import Hallazgos from './inspecciones/Hallazgos.jsx';
import KpiHallazgos from './inspecciones/KpiHallazgos.jsx';
import Programa from './inspecciones/Programa.jsx';
import Checklists from './inspecciones/Checklists.jsx';

// Inspecciones (elemento 4.1 del SGSST): hallazgos internos, panel de KPIs, programa anual y checklists de campo
export default function Inspecciones() {
  const { user } = useStore();
  const [params, setParams] = useSearchParams();
  const trabajador = user.rol === 'trabajador';
  const tabs = trabajador
    ? [['hallazgos', 'Reportes de actos y condiciones'], ['campo', 'Checklists de campo']]
    : [['hallazgos', 'Hallazgos'], ['kpi', 'Panel de KPIs'], ['programa', 'Programa anual'], ['campo', 'Checklists de campo']];
  const tab = params.get('nuevo') ? 'campo' : params.get('tab') || 'hallazgos';
  return (
    <>
      <PageHeader title="Inspecciones" subtitle="Inspecciones internas de talleres y unidades: hallazgos con su plan de acción, indicadores de cierre y cumplimiento del programa anual." />
      <div className="tabs tabs-main">
        {tabs.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setParams(k === 'hallazgos' ? {} : { tab: k })}>{l}</button>)}
      </div>
      {tab === 'hallazgos' && <Hallazgos />}
      {tab === 'kpi' && !trabajador && <KpiHallazgos />}
      {tab === 'programa' && !trabajador && <Programa />}
      {tab === 'campo' && <Checklists />}
    </>
  );
}
