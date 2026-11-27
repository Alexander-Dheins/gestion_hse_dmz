import { GraduationCap, ArrowLeft } from 'lucide-react';
import Logo from '../portal/Logo.jsx';

// Módulo de Capacitaciones: aquí se construirá la plataforma a partir del mockup.
export default function CapacitacionesApp() {
  return (
    <div className="pt-wrap">
      <header className="pt-head">
        <Logo size={64} />
      </header>
      <main className="pt-main">
        <div className="pt-empty">
          <div className="pt-card-ico" style={{ '--c': '#0b5cad' }}><GraduationCap size={30} /></div>
          <h1>Capacitaciones</h1>
          <p className="pt-sub">Módulo en construcción. Aquí irá la plataforma de capacitaciones.</p>
          <a href="/" className="pt-back"><ArrowLeft size={16} /> Volver al panel</a>
        </div>
      </main>
      <footer className="pt-foot">Demo con datos ficticios · Área de TI</footer>
    </div>
  );
}
