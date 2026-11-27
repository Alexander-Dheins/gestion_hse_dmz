import { useEffect, useState } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight, IdCard, Mail, Settings } from 'lucide-react';
import Logo from './Logo.jsx';

const VISTO = 'dmz_splash_visto';

// Cada módulo tiene su propio ingreso: Capacitaciones con DNI y SSOMA DMZ con correo y contraseña
const MODULOS = [
  {
    id: 'capacitaciones', href: '/capacitaciones', icon: GraduationCap, titulo: 'Capacitaciones', color: '#2370B8',
    desc: 'Cursos obligatorios en video con evaluación, encuesta, nota final y certificados con QR.',
    ingreso: 'Ingresas con tu DNI', IconoIngreso: IdCard,
  },
  {
    id: 'ssoma', href: '/ssoma', icon: ShieldCheck, titulo: 'SSOMA DMZ', color: '#ea7a12',
    desc: 'Gestión HSE: paradas de planta, PETAR, IPERC, inspecciones, incidentes y reportes a la unidad.',
    ingreso: 'Ingresas con correo y contraseña', IconoIngreso: Mail,
  },
];

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
        <span className="pt-lbl">Plataformas internas</span>
        <h1>¿A qué plataforma quieres entrar?</h1>
        <p className="pt-sub">Elige el módulo. Cada uno tiene su propio ingreso.</p>
        <div className="pt-grid">
          {MODULOS.map((m, i) => (
            <a key={m.id} href={m.href} className="pt-card" style={{ '--c': m.color, animationDelay: `${i * 90}ms` }}>
              <div className="pt-card-ico"><m.icon size={30} /></div>
              <div className="pt-card-body">
                <h2>{m.titulo}</h2>
                <p>{m.desc}</p>
              </div>
              <span className="pt-ingreso"><m.IconoIngreso size={14} /> {m.ingreso}</span>
              <span className="pt-card-go">Entrar <ArrowRight size={16} /></span>
            </a>
          ))}
        </div>
      </main>
      <footer className="pt-foot">
        <span>Demo con datos ficticios · Área de TI</span>
        <a href="/admin" className="pt-admin"><Settings size={13} /> Administración de accesos</a>
      </footer>
    </div>
  );
}
