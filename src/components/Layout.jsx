import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Wrench, FileSignature, Grid3x3, ClipboardCheck, AlertTriangle, ListChecks,
  Users, GraduationCap, HardHat, FolderTree, FileText, ShieldCheck, HeartPulse, Leaf, Award, LogOut, RotateCcw, Menu, FileStack,
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { ROLES } from '../data/seed.js';

const ALL = ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'sup_mant', 'medico', 'trabajador'];
const STAFF = ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'sup_mant', 'medico'];

export const NAV = [
  { grupo: 'General', items: [
    { to: '/', label: 'Tablero', icon: LayoutDashboard, roles: ALL, end: true },
    { to: '/unidades', label: 'Unidades mineras', icon: Building2, roles: STAFF },
  ] },
  { grupo: 'Operación HSE', items: [
    { to: '/paradas', label: 'Paradas de planta', icon: Wrench, roles: STAFF },
    { to: '/permisos', label: 'Permisos de alto riesgo', icon: FileSignature, roles: ALL },
    { to: '/iperc', label: 'IPERC', icon: Grid3x3, roles: ALL },
    { to: '/inspecciones', label: 'Inspecciones', icon: ClipboardCheck, roles: ALL },
    { to: '/incidentes', label: 'Incidentes', icon: AlertTriangle, roles: ALL },
    { to: '/planes', label: 'Planes de acción', icon: ListChecks, roles: ALL },
  ] },
  { grupo: 'Personas', items: [
    { to: '/personal', label: 'Personal y acreditación', icon: Users, roles: ALL },
    { to: '/capacitaciones', label: 'Capacitaciones', icon: GraduationCap, roles: STAFF },
    { to: '/epp', label: 'EPP', icon: HardHat, roles: STAFF },
  ] },
  { grupo: 'Salud y ambiente', items: [
    { to: '/salud', label: 'Salud ocupacional', icon: HeartPulse, roles: ['gerente', 'lider', 'supervisor', 'asistente', 'analista', 'medico'] },
    { to: '/ambiente', label: 'Medio ambiente', icon: Leaf, roles: STAFF },
  ] },
  { grupo: 'Gestión', items: [
    { to: '/gestion', label: 'PASSO, comité y auditorías', icon: Award, roles: STAFF },
    { to: '/formatos', label: 'Formatos', icon: FileStack, roles: STAFF },
    { to: '/archivos', label: 'Repositorio de archivos', icon: FolderTree, roles: ALL },
    { to: '/reportes', label: 'Reportes a la unidad', icon: FileText, roles: ['gerente', 'lider', 'supervisor', 'asistente', 'analista'] },
    { to: '/roles', label: 'Roles y permisos', icon: ShieldCheck, roles: ALL },
  ] },
];

export default function Layout() {
  const { user, db, setUserId, reset, todas, unidadFiltro, setUnidadFiltro, toast } = useStore();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const unidad = db.unidades.find((u) => u.id === user.unidad);

  return (
    <div className={`app ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <svg viewBox="0 0 32 32" width="30" height="30"><path d="M16 4l10 4.5v6.5c0 6.7-4.4 11-10 13-5.6-2-10-6.3-10-13V8.5z" fill="#ea7a12" /><path d="M11.5 16l3.2 3.2 5.8-6.4" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <strong>SSOMA DMZ</strong>
            <span>Gestión HSE · demo</span>
          </div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map((g) => {
            const items = g.items.filter((i) => i.roles.includes(user.rol));
            if (!items.length) return null;
            return (
              <div key={g.grupo} className="nav-group">
                <span className="nav-title">{g.grupo}</span>
                {items.map((i) => (
                  <NavLink key={i.to} to={i.to} end={i.end} className="nav-item">
                    <i.icon size={17} />
                    <span>{i.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">Datos ficticios para demostración</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="Menú"><Menu size={20} /></button>
          <div className="scope">
            {todas ? (
              <select value={unidadFiltro} onChange={(e) => setUnidadFiltro(e.target.value)} aria-label="Unidad minera">
                <option value="todas">Todas las unidades ({db.unidades.length})</option>
                {db.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            ) : (
              <span className="scope-fixed"><Building2 size={15} /> {unidad?.nombre}</span>
            )}
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost btn-sm" onClick={() => { if (confirmReset()) reset(); }} title="Restablecer datos de la demo">
              <RotateCcw size={15} /> <span className="hide-sm">Restablecer demo</span>
            </button>
            <div className="user-chip">
              <div className="avatar">{user.nombre.replace('Dra. ', '').split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
              <div className="hide-sm">
                <strong>{user.nombre}</strong>
                <span>{ROLES[user.rol].nombre}</span>
              </div>
            </div>
            <button className="icon-btn" title="Cambiar de usuario" aria-label="Cambiar de usuario" onClick={() => { setUserId(null); nav('/'); }}><LogOut size={18} /></button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// Sin diálogos bloqueantes del navegador: restablecer directamente
function confirmReset() { return true; }
