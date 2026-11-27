import { useStore } from '../store.jsx';
import { ROLES } from '../data/seed.js';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const { db, setUserId } = useStore();
  return (
    <div className="login">
      <div className="login-box">
        <a href="/" className="pt-to-portal"><ArrowLeft size={15} /> Volver al panel de acceso</a>
        <div className="login-brand">
          <svg viewBox="0 0 32 32" width="44" height="44"><rect width="32" height="32" rx="8" fill="#0f1b2d" /><path d="M16 5l9 4v6c0 6-4 10-9 12-5-2-9-6-9-12V9z" fill="#ea7a12" /><path d="M12 16l3 3 5-6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <h1>SSOMA DMZ</h1>
            <p>Sistema de Gestión de Seguridad, Salud Ocupacional y Medio Ambiente</p>
          </div>
        </div>
        <p className="login-hint">Demo con datos ficticios. Entra con cualquier perfil para ver qué puede hacer y ver cada rol.</p>
        <div className="login-grid">
          {db.usuarios.map((u) => (
            <button key={u.id} className="login-user" onClick={() => setUserId(u.id)}>
              <div className="avatar avatar-lg">{u.nombre.replace('Dra. ', '').split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
              <div>
                <strong>{u.nombre}</strong>
                <span>{ROLES[u.rol].nombre}</span>
                <em>{u.unidad ? db.unidades.find((x) => x.id === u.unidad)?.nombre : 'Todas las unidades'}</em>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
