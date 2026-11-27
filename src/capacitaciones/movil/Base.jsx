import { createContext, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Award, User, Bell, ChevronLeft, LayoutGrid, LogOut } from 'lucide-react';
import { useCap, avisosDe } from '../store.jsx';
import { cerrarSesion, iniciales } from '../../acceso/db.jsx';

// Prefijo de rutas de la vista del trabajador ('' para participantes, '/mi' para supervisores)
export const BaseCtx = createContext('');
export const useBase = () => useContext(BaseCtx);

// Aplicación web responsive: menú lateral en escritorio y barra inferior en celular.
// full: pantallas de trabajo (video, encuesta, resultado) sin barra inferior en celular.
export function MovilLayout({ base = '', full = false }) {
  const { toast, db, persona, rol } = useCap();
  const sinLeer = avisosDe(db, persona).filter((a) => !a.leido).length;
  const items = [
    { to: base || '/', end: true, label: 'Inicio', icon: Home },
    { to: `${base}/cursos`, label: 'Mis cursos', corto: 'Cursos', icon: BookOpen },
    { to: `${base}/certificados`, label: 'Certificados', icon: Award },
    { to: `${base}/avisos`, label: 'Avisos', icon: Bell, count: sinLeer, soloWeb: true },
    { to: `${base}/perfil`, label: 'Perfil', icon: User },
  ];
  return (
    <BaseCtx.Provider value={base}>
      <div className={`cp-web ${full ? 'is-full' : ''}`}>
        <aside className="cp-side">
          <div className="cp-side-brand">
            <img src="/logo-dimarza.png" alt="DMZ Corp." />
            <div><strong>DIMARZA</strong><span>Capacitación SSOMA</span></div>
          </div>
          <nav>
            {base && <NavLink to="/" end className="cp-side-i"><LayoutGrid size={18} /><span>Panel del supervisor</span></NavLink>}
            {items.map((i) => (
              <NavLink key={i.label} to={i.to} end={i.end} className="cp-side-i">
                <i.icon size={18} /><span>{i.label}</span>{i.count > 0 && <em>{i.count}</em>}
              </NavLink>
            ))}
          </nav>
          <div className="cp-side-foot">
            <a href="/" className="cp-side-i"><LayoutGrid size={18} /><span>Panel de acceso</span></a>
            <div className="cp-side-user">
              <span className="cp-av sm">{iniciales(persona.nombre)}</span>
              <div className="grow"><strong>{persona.nombre}</strong><span>{rol === 'supervisor' ? 'Supervisor' : persona.cargo}</span></div>
              <button onClick={() => cerrarSesion('cap')} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={16} /></button>
            </div>
          </div>
        </aside>
        <div className="cp-main"><Outlet /></div>
        {!full && (
          <nav className="cp-nav">
            {items.filter((i) => !i.soloWeb).map((i) => (
              <NavLink key={i.label} to={i.to} end={i.end} className={({ isActive }) => `cp-nav-i ${isActive ? 'on' : ''}`}>
                <span><i.icon size={19} /></span>{i.corto || i.label}
              </NavLink>
            ))}
          </nav>
        )}
        {toast && <div className="cp-toast">{toast}</div>}
      </div>
    </BaseCtx.Provider>
  );
}

// Contenedor de las pantallas de trabajo (el video usa fondo oscuro)
export function MovilFull({ children, dark }) {
  return <div className={`cp-fullpage ${dark ? 'cp-dark' : ''}`}>{children}</div>;
}

export function Atras({ to, label, right }) {
  const nav = useNavigate();
  return (
    <div className="cp-back">
      <button onClick={() => (to ? nav(to) : nav(-1))}><ChevronLeft size={18} /> {label}</button>
      {right}
    </div>
  );
}

export function Chip({ tono = 'gris', children }) {
  return <span className={`cp-chip ${tono}`}>{children}</span>;
}

export function Barra({ v, tono }) {
  return <div className={`cp-bar ${tono || ''}`}><i style={{ width: `${v}%` }} /></div>;
}

export function Anillo({ v, size = 76 }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cp-ring" aria-label={`${v}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.14)" strokeWidth="8" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#F4C400" strokeWidth="8" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#fff" fontWeight="700" fontSize={size * 0.21}>{v}%</text>
    </svg>
  );
}

export const tonoEstado = { Aprobado: 'verde', 'En curso': 'azul', 'Sin empezar': 'gris', Vencido: 'rojo', 'No aprobado': 'rojo' };
