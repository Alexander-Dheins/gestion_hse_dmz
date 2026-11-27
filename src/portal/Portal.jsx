import { useEffect, useState } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight, UsersRound, LogOut, Lock, IdCard, KeyRound } from 'lucide-react';
import Logo from './Logo.jsx';
import { cargarAcceso, guardarAcceso, accesosDe, getSesionDni, setSesionDni, CAP_ROL, iniciales } from '../acceso/db.jsx';

const VISTO = 'dmz_splash_visto';
const RECORDAR = 'dmz-recordar-modulo';

function modulosDe(acc) {
  const m = [];
  if (acc.cap) m.push({
    id: 'capacitaciones', href: '/capacitaciones', icon: GraduationCap, titulo: 'Capacitaciones', color: '#0b5cad',
    desc: acc.cap === 'participante' ? 'Tus cursos obligatorios, evaluaciones por video y certificados.' : `Gestión de cursos, avance del personal y certificados · ${CAP_ROL[acc.cap]}.`,
  });
  if (acc.ssoma) m.push({
    id: 'ssoma', href: '/ssoma', icon: ShieldCheck, titulo: 'SSOMA DMZ', color: '#ea7a12',
    desc: 'Gestión HSE: paradas de planta, PETAR, IPERC, inspecciones, incidentes y reportes a la unidad.',
  });
  if (acc.admin) m.push({
    id: 'admin', href: '/admin', icon: UsersRound, titulo: 'Administración de accesos', color: '#c0262d',
    desc: 'Trabajadores, grupos, carga masiva y envío de usuario y PIN.',
  });
  return m;
}

export default function Portal() {
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem(VISTO); } catch { return true; }
  });
  const [saliendo, setSaliendo] = useState(false);
  const [db, setDb] = useState(cargarAcceso);
  const [dni, setDni] = useState(getSesionDni);
  const persona = db.trabajadores.find((t) => t.dni === dni && t.activo) || null;

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

  const entrar = (p) => {
    setSesionDni(p.dni);
    const mods = modulosDe(accesosDe(db, p));
    let recordado = null;
    try { recordado = localStorage.getItem(`${RECORDAR}-${p.dni}`); } catch { /* sin almacenamiento */ }
    const destino = mods.find((m) => m.id === recordado) || (mods.length === 1 ? mods[0] : null);
    if (destino && !p.pinTemporal) { window.location.href = destino.href; return; }
    setDni(p.dni);
  };
  const salir = () => { setSesionDni(null); setDni(null); };

  return (
    <div className="pt-wrap">
      <header className="pt-head">
        <Logo size={64} />
        {persona && (
          <div className="pt-user">
            <div className="pt-avatar">{iniciales(persona.nombre)}</div>
            <div className="pt-user-txt"><strong>{persona.nombre}</strong><span>DNI {persona.dni}</span></div>
            <button className="pt-icon" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        )}
      </header>
      <main className="pt-main">
        {!persona && <Login db={db} onLogin={entrar} />}
        {persona && persona.pinTemporal && (
          <CrearPin persona={persona} onListo={(pin) => {
            const nuevo = structuredClone(db);
            const t = nuevo.trabajadores.find((x) => x.dni === persona.dni);
            t.pin = pin; t.pinTemporal = false;
            guardarAcceso(nuevo); setDb(nuevo);
          }} />
        )}
        {persona && !persona.pinTemporal && <Panel db={db} persona={persona} />}
      </main>
      <footer className="pt-foot">Demo con datos ficticios · Área de TI</footer>
    </div>
  );
}

function Login({ db, onLogin }) {
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const enviar = (e) => {
    e.preventDefault();
    const p = db.trabajadores.find((t) => t.dni === dni.trim());
    if (!p || p.pin !== pin) { setError('DNI o PIN incorrecto.'); return; }
    if (!p.activo) { setError('Tu usuario está desactivado. Comunícate con el área de TI.'); return; }
    onLogin(p);
  };
  const demo = ['10000001', '45872103', '40221587', '41556790', '46120934', '43987015']
    .map((d) => db.trabajadores.find((t) => t.dni === d)).filter(Boolean);

  return (
    <div className="pt-login">
      <form className="pt-login-card" onSubmit={enviar}>
        <span className="pt-lbl">Plataformas internas</span>
        <h1>Ingresar</h1>
        <p className="pt-sub2">Usa tu DNI y el PIN que te llegó por correo o WhatsApp.</p>
        <label className="pt-field">
          <span>Usuario (DNI)</span>
          <div><IdCard size={17} /><input inputMode="numeric" maxLength={8} value={dni} onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="12345678" autoFocus /></div>
        </label>
        <label className="pt-field">
          <span>PIN</span>
          <div><KeyRound size={17} /><input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="••••" /></div>
        </label>
        {error && <p className="pt-error">{error}</p>}
        <button className="pt-btn" type="submit" disabled={dni.length < 8 || pin.length < 4}>Ingresar <ArrowRight size={17} /></button>
        <p className="pt-mini"><Lock size={13} /> ¿Olvidaste tu PIN? Pide a tu supervisor o al área de TI que te reenvíe el acceso.</p>
      </form>
      <div className="pt-demo">
        <span className="pt-lbl">Usuarios de prueba · PIN 1234</span>
        {demo.map((p) => {
          const acc = accesosDe(db, p);
          const tags = [acc.admin && 'Admin accesos', acc.cap && `Capacitaciones · ${CAP_ROL[acc.cap]}`, acc.ssoma && 'SSOMA DMZ'].filter(Boolean);
          return (
            <button key={p.dni} className="pt-demo-user" onClick={() => onLogin(p)}>
              <div className="pt-avatar">{iniciales(p.nombre)}</div>
              <div><strong>{p.nombre}</strong><span>{tags.join(' · ') || 'Sin accesos'}</span></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CrearPin({ persona, onListo }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const ok = a.length === 4 && a === b && a !== '1234' && a !== '0000';
  return (
    <div className="pt-login">
      <form className="pt-login-card" onSubmit={(e) => { e.preventDefault(); if (ok) onListo(a); }}>
        <span className="pt-lbl">Primer ingreso</span>
        <h1>Crea tu PIN</h1>
        <p className="pt-sub2">Hola, {persona.nombre.split(' ')[0]}. Reemplaza el PIN temporal por uno de 4 dígitos que solo tú conozcas.</p>
        <label className="pt-field"><span>Nuevo PIN</span><div><KeyRound size={17} /><input type="password" inputMode="numeric" maxLength={4} value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ''))} autoFocus /></div></label>
        <label className="pt-field"><span>Repite el PIN</span><div><KeyRound size={17} /><input type="password" inputMode="numeric" maxLength={4} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ''))} /></div></label>
        {b.length === 4 && a !== b && <p className="pt-error">Los PIN no coinciden.</p>}
        {a.length === 4 && (a === '1234' || a === '0000') && <p className="pt-error">Elige un PIN menos obvio.</p>}
        <button className="pt-btn" type="submit" disabled={!ok}>Guardar PIN <ArrowRight size={17} /></button>
      </form>
    </div>
  );
}

function Panel({ db, persona }) {
  const mods = modulosDe(accesosDe(db, persona));
  const key = `${RECORDAR}-${persona.dni}`;
  const [recordar, setRecordar] = useState(() => { try { return !!localStorage.getItem(key); } catch { return false; } });
  const ir = (m) => {
    if (m.id === 'admin') return;
    try { recordar ? localStorage.setItem(key, m.id) : localStorage.removeItem(key); } catch { /* sin almacenamiento */ }
  };
  const nombre = persona.nombre.split(' ')[0];

  if (!mods.length) {
    return (
      <div className="pt-empty">
        <div className="pt-card-ico" style={{ '--c': '#667085' }}><Lock size={28} /></div>
        <h1>Hola, {nombre}</h1>
        <p className="pt-sub">Tu usuario todavía no tiene módulos habilitados. Pide al área de TI que te agregue a un grupo.</p>
      </div>
    );
  }
  return (
    <>
      <span className="pt-lbl">Panel de acceso</span>
      <h1>Hola, {nombre}. ¿A qué plataforma quieres entrar?</h1>
      <p className="pt-sub">{mods.length > 1 ? 'Tu usuario tiene acceso a estos módulos.' : 'Este es el módulo habilitado para tu usuario.'}</p>
      <div className="pt-grid">
        {mods.map((m, i) => (
          <a key={m.id} href={m.href} onClick={() => ir(m)} className="pt-card" style={{ '--c': m.color, animationDelay: `${i * 90}ms` }}>
            <div className="pt-card-ico"><m.icon size={30} /></div>
            <div className="pt-card-body">
              <h2>{m.titulo}</h2>
              <p>{m.desc}</p>
            </div>
            <span className="pt-card-go">Ingresar <ArrowRight size={16} /></span>
          </a>
        ))}
      </div>
      {mods.filter((m) => m.id !== 'admin').length > 1 && (
        <label className="pt-check">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
          Recordar mi elección en este dispositivo
        </label>
      )}
    </>
  );
}
