import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import Portal from './portal/Portal.jsx';
import CapacitacionesApp from './capacitaciones/CapacitacionesApp.jsx';
import './styles.css';
import './portal/portal.css';
import './acceso/acceso.css';
import AdminApp from './admin/AdminApp.jsx';

// Panel central de acceso:
//   /                 -> portal (splash + selección de módulo)
//   /ssoma/...        -> Sistema de Gestión HSE (app existente)
//   /capacitaciones/… -> Plataforma de Capacitaciones
//   /admin/…          -> Administración de accesos (trabajadores, grupos, carga masiva)
// Cada módulo tiene su propio ingreso (Capacitaciones: DNI + PIN; SSOMA y Administración: correo + contraseña)
// y deja pasar solo a quien tiene el permiso por sus grupos.
const path = window.location.pathname;
const enModulo = (base) => path === base || path.startsWith(base + '/');

// Compatibilidad: enlaces antiguos del HSE sin prefijo (/paradas, /iperc, …) pasan a /ssoma
const RUTAS_HSE = ['unidades', 'paradas', 'permisos', 'iperc', 'inspecciones', 'incidentes', 'planes', 'personal', 'epp', 'archivos', 'reportes', 'roles', 'salud', 'ambiente', 'gestion', 'formatos', 'fase'];
const primero = path.split('/')[1];
if (RUTAS_HSE.includes(primero)) window.history.replaceState(null, '', '/ssoma' + path);

let root;
if (enModulo('/ssoma') || RUTAS_HSE.includes(primero)) {
  root = (
    <StoreProvider>
      <BrowserRouter basename="/ssoma">
        <App />
      </BrowserRouter>
    </StoreProvider>
  );
} else if (enModulo('/admin')) {
  root = (
    <BrowserRouter basename="/admin">
      <AdminApp />
    </BrowserRouter>
  );
} else if (enModulo('/capacitaciones')) {
  root = (
    <BrowserRouter basename="/capacitaciones">
      <CapacitacionesApp />
    </BrowserRouter>
  );
} else {
  if (path !== '/') window.history.replaceState(null, '', '/');
  root = <Portal />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>{root}</React.StrictMode>);
