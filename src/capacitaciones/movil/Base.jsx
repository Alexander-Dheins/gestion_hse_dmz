import { createContext, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Award, User, ChevronLeft } from 'lucide-react';
import { useCap } from '../store.jsx';

// Prefijo de rutas de la vista del trabajador ('' para participantes, '/mi' para supervisores)
export const BaseCtx = createContext('');
export const useBase = () => useContext(BaseCtx);

export function MovilLayout({ base = '' }) {
  const { toast } = useCap();
  const items = [
    { to: base || '/', end: true, label: 'Inicio', icon: Home },
    { to: `${base}/cursos`, label: 'Cursos', icon: BookOpen, also: ['/curso'] },
    { to: `${base}/certificados`, label: 'Certificados', icon: Award, also: ['/certificado'] },
    { to: `${base}/perfil`, label: 'Perfil', icon: User },
  ];
  return (
    <BaseCtx.Provider value={base}>
      <div className="cp-bg">
        <div className="cp-app">
          <div className="cp-scroll"><Outlet /></div>
          <nav className="cp-nav">
            {items.map((i) => (
              <NavLink key={i.label} to={i.to} end={i.end} className={({ isActive }) => `cp-nav-i ${isActive ? 'on' : ''}`}>
                <span><i.icon size={19} /></span>{i.label}
              </NavLink>
            ))}
          </nav>
          {toast && <div className="cp-toast">{toast}</div>}
        </div>
      </div>
    </BaseCtx.Provider>
  );
}

// Pantallas sin barra inferior (video, encuesta, resultado)
export function MovilFull({ children, dark }) {
  const { toast } = useCap();
  return (
    <div className="cp-bg">
      <div className={`cp-app ${dark ? 'cp-dark' : ''}`}>
        <div className="cp-scroll full">{children}</div>
        {toast && <div className="cp-toast">{toast}</div>}
      </div>
    </div>
  );
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
