import { useState } from 'react';
import { ArrowRight, ArrowLeft, IdCard, KeyRound, Mail, Lock, Check, Eye, EyeOff } from 'lucide-react';
import { cargarAcceso, guardarAcceso, accesosDe, setSesion, iniciales, CAP_ROL, perfilSsoma } from './db.jsx';

// Ingreso propio de cada módulo.
//   tipo 'dni'    -> DNI + PIN de 4 dígitos (Capacitaciones)
//   tipo 'correo' -> correo + contraseña (SSOMA DMZ y Administración de accesos)
export default function LoginModulo({ modulo, tipo, titulo, subtitulo, color, Icono, puntos, demo, permiso, onOk }) {
  const [db, setDb] = useState(cargarAcceso);
  const [id, setId] = useState('');
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [nueva, setNueva] = useState(null); // persona que debe cambiar su clave temporal

  const esDni = tipo === 'dni';
  const buscar = (valor) => db.trabajadores.find((t) => (esDni ? t.dni === valor.trim() : t.correo.toLowerCase() === valor.trim().toLowerCase()));
  const entrar = (p, sinClave) => {
    setError('');
    if (!p || (!sinClave && (esDni ? p.pin !== clave : p.password !== clave))) { setError(esDni ? 'DNI o PIN incorrecto.' : 'Correo o contraseña incorrectos.'); return; }
    if (!p.activo) { setError('Tu usuario está desactivado. Comunícate con el área de TI.'); return; }
    if (!permiso(accesosDe(db, p))) { setError(`Tu usuario no tiene acceso a ${titulo}. Pide al área de TI que te habilite.`); return; }
    if (esDni ? p.pinTemporal : p.passTemporal) { setNueva(p); return; }
    setSesion(modulo, p.dni);
    onOk(p);
  };
  const demoUsers = demo.map((d) => db.trabajadores.find((t) => t.dni === d)).filter(Boolean);
  const valido = esDni ? id.length === 8 && clave.length === 4 : id.includes('@') && clave.length >= 4;

  return (
    <div className="lg-wrap" style={{ '--c': color }}>
      <aside className="lg-brand">
        <a href="/" className="lg-back"><ArrowLeft size={15} /> Panel de acceso</a>
        <div className="lg-brand-in">
          <img src="/logo-dimarza.png" alt="DMZ Corp." />
          <span className="lg-ico"><Icono size={26} /></span>
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
          <ul>{puntos.map((x) => <li key={x}><Check size={15} /> {x}</li>)}</ul>
        </div>
        <span className="lg-foot">DIMARZA S.A.C. · Ingeniería y Servicios Mineros</span>
      </aside>
      <main className="lg-main">
        {nueva ? (
          <NuevaClave p={nueva} esDni={esDni} onListo={(valor) => {
            const d = structuredClone(db);
            const t = d.trabajadores.find((x) => x.dni === nueva.dni);
            if (esDni) { t.pin = valor; t.pinTemporal = false; } else { t.password = valor; t.passTemporal = false; }
            guardarAcceso(d); setDb(d); setSesion(modulo, t.dni); onOk(t);
          }} />
        ) : (
          <form className="lg-form" onSubmit={(e) => { e.preventDefault(); entrar(buscar(id)); }}>
            <span className="lg-lbl">Ingresar a {titulo}</span>
            <h2>{esDni ? 'Ingresa con tu DNI' : 'Ingresa con tu correo'}</h2>
            <p className="lg-sub">{esDni ? 'Usa tu DNI y el PIN de 4 dígitos que te llegó por WhatsApp o correo.' : 'Usa tu correo de la empresa y tu contraseña.'}</p>
            <label className="pt-field">
              <span>{esDni ? 'DNI' : 'Correo'}</span>
              <div>{esDni ? <IdCard size={17} /> : <Mail size={17} />}
                {esDni
                  ? <input inputMode="numeric" maxLength={8} value={id} onChange={(e) => { setId(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="12345678" autoFocus />
                  : <input type="email" value={id} onChange={(e) => { setId(e.target.value); setError(''); }} placeholder="nombre@dimarza.com.pe" autoComplete="username" autoFocus />}
              </div>
            </label>
            <label className="pt-field">
              <span>{esDni ? 'PIN' : 'Contraseña'}</span>
              <div>{esDni ? <KeyRound size={17} /> : <Lock size={17} />}
                {esDni
                  ? <input type="password" inputMode="numeric" maxLength={4} value={clave} onChange={(e) => { setClave(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="••••" />
                  : <input type={ver ? 'text' : 'password'} value={clave} onChange={(e) => { setClave(e.target.value); setError(''); }} autoComplete="current-password" className="txt" />}
                {!esDni && <button type="button" className="lg-eye" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{ver ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
              </div>
            </label>
            {error && <p className="pt-error">{error}</p>}
            <button className="pt-btn lg-btn" type="submit" disabled={!valido}>Ingresar <ArrowRight size={17} /></button>
            <p className="pt-mini"><Lock size={13} /> {esDni ? '¿Olvidaste tu PIN? Pide a tu supervisor o al área de TI que te reenvíe el acceso.' : '¿Olvidaste tu contraseña? El área de TI puede enviarte una temporal.'}</p>

            {demoUsers.length > 0 && (
              <div className="lg-demo">
                <span className="lg-lbl">Usuarios de prueba · {esDni ? 'PIN 1234' : 'contraseña Dmz2026'}</span>
                {demoUsers.map((p) => {
                  const a = accesosDe(db, p);
                  const det = modulo === 'cap' ? `DNI ${p.dni} · ${a.cap ? CAP_ROL[a.cap] : 'sin acceso'}` : modulo === 'ssoma' ? `${p.correo} · ${perfilSsoma(p.ssomaPerfil).split(' · ')[0]}` : p.correo;
                  return (
                    <button type="button" key={p.dni} className="lg-demo-user" onClick={() => { setId(esDni ? p.dni : p.correo); setClave(esDni ? p.pin : p.password); entrar(p, true); }}>
                      <span className="pt-avatar">{iniciales(p.nombre)}</span>
                      <span><strong>{p.nombre}</strong><em>{det}</em></span>
                    </button>
                  );
                })}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}

function NuevaClave({ p, esDni, onListo }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const debil = esDni ? ['1234', '0000', '1111'].includes(a) : a.length < 8 || !/\d/.test(a) || !/[A-Za-z]/.test(a);
  const ok = a === b && !debil && (esDni ? a.length === 4 : true);
  const campo = (v, set) => esDni
    ? <input type="password" inputMode="numeric" maxLength={4} value={v} onChange={(e) => set(e.target.value.replace(/\D/g, ''))} />
    : <input type="password" value={v} onChange={(e) => set(e.target.value)} className="txt" />;
  return (
    <form className="lg-form" onSubmit={(e) => { e.preventDefault(); if (ok) onListo(a); }}>
      <span className="lg-lbl">Primer ingreso</span>
      <h2>{esDni ? 'Crea tu PIN' : 'Crea tu contraseña'}</h2>
      <p className="lg-sub">Hola, {p.nombre.split(' ')[0]}. {esDni ? 'Reemplaza el PIN temporal por uno de 4 dígitos que solo tú conozcas.' : 'Reemplaza la contraseña temporal. Debe tener al menos 8 caracteres, con letras y números.'}</p>
      <label className="pt-field"><span>{esDni ? 'Nuevo PIN' : 'Nueva contraseña'}</span><div><KeyRound size={17} />{campo(a, setA)}</div></label>
      <label className="pt-field"><span>Repítelo</span><div><KeyRound size={17} />{campo(b, setB)}</div></label>
      {b && a !== b && <p className="pt-error">No coinciden.</p>}
      {a && debil && <p className="pt-error">{esDni ? 'Elige un PIN menos obvio.' : 'Usa al menos 8 caracteres con letras y números.'}</p>}
      <button className="pt-btn lg-btn" type="submit" disabled={!ok}>Guardar y entrar <ArrowRight size={17} /></button>
    </form>
  );
}
