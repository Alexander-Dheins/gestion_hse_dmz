import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Unidades from './pages/Unidades.jsx';
import Paradas from './pages/Paradas.jsx';
import ParadaDetalle from './pages/ParadaDetalle.jsx';
import Permisos from './pages/Permisos.jsx';
import PermisoDetalle from './pages/PermisoDetalle.jsx';
import Iperc from './pages/Iperc.jsx';
import Inspecciones from './pages/Inspecciones.jsx';
import Incidentes from './pages/Incidentes.jsx';
import Planes from './pages/Planes.jsx';
import Personal from './pages/Personal.jsx';
import Capacitaciones from './pages/Capacitaciones.jsx';
import Epp from './pages/Epp.jsx';
import Archivos from './pages/Archivos.jsx';
import Reportes from './pages/Reportes.jsx';
import Roles from './pages/Roles.jsx';
import Fase from './pages/Fase.jsx';

export default function App() {
  const { user } = useStore();
  if (!user) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="unidades" element={<Unidades />} />
        <Route path="paradas" element={<Paradas />} />
        <Route path="paradas/:id" element={<ParadaDetalle />} />
        <Route path="permisos" element={<Permisos />} />
        <Route path="permisos/:id" element={<PermisoDetalle />} />
        <Route path="iperc" element={<Iperc />} />
        <Route path="inspecciones" element={<Inspecciones />} />
        <Route path="incidentes" element={<Incidentes />} />
        <Route path="planes" element={<Planes />} />
        <Route path="personal" element={<Personal />} />
        <Route path="capacitaciones" element={<Capacitaciones />} />
        <Route path="epp" element={<Epp />} />
        <Route path="archivos" element={<Archivos />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="roles" element={<Roles />} />
        <Route path="fase/:id" element={<Fase />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
