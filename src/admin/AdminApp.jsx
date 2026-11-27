import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, Upload, RotateCcw } from 'lucide-react';
import Shell, { SinAcceso } from '../acceso/Shell.jsx';
import { AccesoProvider, useAcceso, accesosDe, getSesionDni } from '../acceso/db.jsx';
import Resumen from './Resumen.jsx';
import Trabajadores from './Trabajadores.jsx';
import Trabajador from './Trabajador.jsx';
import Grupos from './Grupos.jsx';
import Carga from './Carga.jsx';

export default function AdminApp() {
  return (
    <AccesoProvider>
      <Inner />
    </AccesoProvider>
  );
}

function Inner() {
  const { db, toast, reset } = useAcceso();
  const persona = db.trabajadores.find((t) => t.dni === getSesionDni() && t.activo);
  if (!persona) { window.location.replace('/'); return null; }
  if (!accesosDe(db, persona).admin) return <SinAcceso modulo="la administración de accesos" />;

  const nav = [
    { grupo: 'General', items: [{ to: '/', label: 'Resumen', icon: LayoutDashboard, end: true }] },
    { grupo: 'Usuarios y accesos', items: [
      { to: '/trabajadores', label: 'Trabajadores', icon: Users, count: db.trabajadores.length },
      { to: '/grupos', label: 'Grupos', icon: Layers, count: db.grupos.length },
      { to: '/carga', label: 'Carga masiva', icon: Upload },
    ] },
  ];
  return (
    <Routes>
      <Route element={
        <Shell titulo="DIMARZA" subtitulo="Administración de accesos" nav={nav} persona={persona} rol="Administrador de la plataforma" toast={toast}
          extraTop={<button className="btn btn-ghost btn-sm" onClick={reset} title="Volver a los datos iniciales"><RotateCcw size={15} /> <span className="hide-sm">Restablecer demo</span></button>} />
      }>
        <Route index element={<Resumen />} />
        <Route path="trabajadores" element={<Trabajadores />} />
        <Route path="trabajadores/:dni" element={<Trabajador />} />
        <Route path="grupos" element={<Grupos />} />
        <Route path="carga" element={<Carga />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
