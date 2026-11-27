import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { LayoutGrid, LogOut, Menu, Lock, ArrowLeft } from 'lucide-react';
import { cerrarSesion, iniciales } from './db.jsx';

// Marco de escritorio común (panel de accesos y gestión de Capacitaciones)
export default function Shell({ titulo, subtitulo, nav, persona, rol, toast, extraTop }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`app shell ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo-dimarza.png" alt="DMZ Corp." className="shell-logo" />
          <div>
            <strong>{titulo}</strong>
            <span>{subtitulo}</span>
          </div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {nav.map((g) => (
            <div key={g.grupo} className="nav-group">
              <span className="nav-title">{g.grupo}</span>
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} className="nav-item">
                  <i.icon size={17} />
                  <span>{i.label}</span>
                  {i.count != null && <em className="nav-count">{i.count}</em>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <a href="/" className="nav-item sidebar-portal"><LayoutGrid size={17} /><span>Panel de acceso</span></a>
        <div className="shell-user">
          <div className="avatar">{iniciales(persona.nombre)}</div>
          <div><strong>{persona.nombre}</strong><span>{rol}</span></div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="Menú"><Menu size={20} /></button>
          {extraTop}
          <div className="topbar-right">
            <button className="icon-btn" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={cerrarSesion}><LogOut size={18} /></button>
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

export function SinAcceso({ modulo, mensaje }) {
  return (
    <div className="pt-wrap">
      <main className="pt-main">
        <div className="pt-empty">
          <div className="pt-card-ico" style={{ '--c': '#c0262d' }}><Lock size={28} /></div>
          <h1>Sin acceso a {modulo}</h1>
          <p className="pt-sub">{mensaje || 'Tu usuario no pertenece a ningún grupo con acceso a este módulo. Pide al área de TI que te habilite.'}</p>
          <a href="/" className="pt-back"><ArrowLeft size={16} /> Volver al panel de acceso</a>
        </div>
      </main>
    </div>
  );
}

// Si no hay sesión, vuelve al portal para iniciarla
export function requiereSesion(persona) {
  if (!persona) { window.location.replace('/'); return false; }
  return true;
}
