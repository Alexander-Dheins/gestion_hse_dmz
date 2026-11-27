import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, Upload, RotateCcw, UsersRound } from 'lucide-react';
import LoginModulo from '../acceso/LoginModulo.jsx';
import Shell from '../acceso/Shell.jsx';
import { AccesoProvider, useAcceso, accesosDe, getSesion } from '../acceso/db.jsx';
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
  const persona = db.trabajadores.find((t) => t.dni === getSesion('admin') && t.activo);
  if (!persona || !accesosDe(db, persona).admin) {
    return (
      <LoginModulo modulo="admin" tipo="correo" titulo="Administración de accesos" color="#c0262d" Icono={UsersRound}
        subtitulo="Gestiona quién entra a Capacitaciones y a SSOMA DMZ."
        puntos={['Trabajadores y grupos con permisos por módulo', 'Carga masiva desde Excel o CSV', 'Envío de DNI + PIN y correo + contraseña']}
        demo={['10000001']} permiso={(a) => a.admin} onOk={() => { window.location.href = '/admin'; }} />
    );
  }

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
        <Shell modulo="admin" titulo="DIMARZA" subtitulo="Administración de accesos" nav={nav} persona={persona} rol="Administrador de la plataforma" toast={toast}
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
