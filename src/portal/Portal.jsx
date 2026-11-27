import { useEffect, useState } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from './Logo.jsx';

const MODULOS = [
  {
    id: 'capacitaciones',
    href: '/capacitaciones',
    icon: GraduationCap,
    titulo: 'Capacitaciones',
    desc: 'Cursos, inducciones, evaluaciones y certificados del personal.',
    color: '#0b5cad',
  },
  {
    id: 'ssoma',
    href: '/ssoma',
    icon: ShieldCheck,
    titulo: 'SSOMA DMZ',
    desc: 'Gestión HSE: paradas de planta, PETAR, IPERC, inspecciones, incidentes y reportes a la unidad.',
    color: '#ea7a12',
  },
];

// Splash solo la primera vez de la sesión del navegador
const VISTO = 'dmz_splash_visto';

export default function Portal() {
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem(VISTO); } catch { return true; }
  });
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (!splash) return;
    const t1 = setTimeout(() => setSaliendo(true), 1500);
    const t2 = setTimeout(() => {
      setSplash(false);
      try { sessionStorage.setItem(VISTO, '1'); } catch { /* sin almacenamiento */ }
    }, 1950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [splash]);

  if (splash) {
    return (
      <div className={`pt-splash ${saliendo ? 'out' : ''}`}>
        <div className="pt-splash-in">
          <Logo size={150} />
          <div className="pt-loader"><i /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-wrap">
      <header className="pt-head">
        <Logo size={64} />
      </header>
      <main className="pt-main">
        <h1>Panel de acceso</h1>
        <p className="pt-sub">Elige el módulo al que quieres ingresar.</p>
        <div className="pt-grid">
          {MODULOS.map((m, i) => (
            <a key={m.id} href={m.href} className="pt-card" style={{ '--c': m.color, animationDelay: `${i * 90}ms` }}>
              <div className="pt-card-ico"><m.icon size={30} /></div>
              <div className="pt-card-body">
                <h2>{m.titulo}</h2>
                <p>{m.desc}</p>
              </div>
              <span className="pt-card-go">Ingresar <ArrowRight size={16} /></span>
            </a>
          ))}
        </div>
      </main>
      <footer className="pt-foot">Demo con datos ficticios · Área de TI</footer>
    </div>
  );
}
