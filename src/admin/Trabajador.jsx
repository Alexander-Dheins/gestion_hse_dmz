import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Send, Mail, MessageCircle, Check, Power, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react';
import { useAcceso, accesosDe, iniciales, pinAleatorio, passAleatoria, CAP_ROL, SSOMA_PERFILES, perfilSsoma } from '../acceso/db.jsx';
import { AREAS, UNIDADES } from '../acceso/seed.js';
import { Card, Field, Badge, Empty } from '../components/ui.jsx';
import { fechaHora, aplicarEnvio, mensajeAcceso } from './comun.jsx';

export default function Trabajador() {
  const { dni } = useParams();
  const { db, update, notify } = useAcceso();
  const t = db.trabajadores.find((x) => x.dni === dni);
  const [pin, setPin] = useState(pinAleatorio);
  const [pass, setPass] = useState(passAleatoria);
  const [canales, setCanales] = useState(['Correo', 'WhatsApp']);
  if (!t) return <Empty>No existe el trabajador. <Link className="link" to="/trabajadores">Volver</Link></Empty>;
  const acc = accesosDe(db, t);
  const set = (fn) => update((d) => { fn(d.trabajadores.find((x) => x.dni === dni)); });
  const toggleGrupo = (gid) => set((x) => { x.grupos = x.grupos.includes(gid) ? x.grupos.filter((g) => g !== gid) : [...x.grupos, gid]; });
  const toggleCanal = (c) => setCanales((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const enviar = () => {
    set((x) => aplicarEnvio(x, canales, cred));
    notify(`Acceso enviado a ${t.nombre.split(' ')[0]} por ${canales.join(' y ')}`);
    setPin(pinAleatorio()); setPass(passAleatoria());
  };
  const ultimo = t.envios[0];
  const cred = { pin: acc.cap ? pin : null, pass: acc.ssoma || acc.admin ? pass : null };
  const plataformas = [
    { on: !!acc.cap, icon: GraduationCap, n: 'Capacitaciones', d: acc.cap ? `Rol: ${CAP_ROL[acc.cap]}` : 'Sin acceso' },
    { on: acc.ssoma, icon: ShieldCheck, n: 'SSOMA DMZ', d: acc.ssoma ? perfilSsoma(t.ssomaPerfil) : 'Sin acceso' },
    { on: acc.admin, icon: UsersRound, n: 'Administración de accesos', d: acc.admin ? 'Gestiona usuarios y grupos' : 'Sin acceso' },
  ];

  return (
    <>
      <Link to="/trabajadores" className="back"><ArrowLeft size={15} /> Trabajadores</Link>
      <div className="page-head">
        <div className="person" style={{ gap: 14 }}>
          <div className="avatar avatar-lg" style={{ width: 52, height: 52, background: '#0e2a4d' }}>{iniciales(t.nombre)}</div>
          <div>
            <h1 style={{ fontSize: 22 }}>{t.nombre}</h1>
            <span>{t.cargo} · {t.area} · {t.unidad}</span>
          </div>
        </div>
        <div className="page-actions">
          {!t.activo && <Badge tone="bad">Desactivado</Badge>}
          {ultimo ? <Badge tone="ok">Acceso enviado · {fechaHora(ultimo.fecha)}</Badge> : <Badge tone="warn">Acceso no enviado</Badge>}
          <button className="btn btn-sm" onClick={() => { set((x) => { x.activo = !x.activo; }); notify(t.activo ? 'Usuario desactivado: ya no podrá ingresar' : 'Usuario reactivado'); }}>
            <Power size={14} /> {t.activo ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>
      </div>

      <div className="grid-2">
        <Card title="Grupos y accesos">
          <p className="muted small" style={{ marginTop: 0 }}>Marca los grupos de la persona. Sus accesos son la suma de los permisos de esos grupos.</p>
          <div className="opt-list">
            {db.grupos.map((g) => {
              const on = t.grupos.includes(g.id);
              return (
                <label key={g.id} className={`opt ${on ? 'on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleGrupo(g.id)} />
                  <span className="dot" style={{ background: g.color }} aria-hidden="true" />
                  <div><strong>{g.nombre}</strong><span>{g.desc}</span></div>
                </label>
              );
            })}
          </div>
          <span className="lbl-up">Plataformas habilitadas</span>
          <div className="mini-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {plataformas.map((p) => (
              <div key={p.n} style={{ opacity: p.on ? 1 : 0.5, textAlign: 'left' }}>
                <p.icon size={18} color={p.on ? '#15803d' : '#98a2b3'} />
                <strong style={{ fontSize: 13 }}>{p.n}</strong>
                <span>{p.d}</span>
              </div>
            ))}
          </div>
        </Card>

        <div>
          <Card title="Enviar acceso">
            {acc.cap && (
              <>
                <span className="lbl-up" style={{ marginTop: 0 }}>Capacitaciones · ingresa con DNI + PIN</span>
                <div className="form-2">
                  <Field label="Usuario (DNI)"><input value={t.dni} readOnly /></Field>
                  <Field label="PIN temporal">
                    <div className="pin-box">{pin.split('').join(' ')}<button className="icon-btn" title="Generar otro" aria-label="Generar otro PIN" onClick={() => setPin(pinAleatorio())}><RefreshCw size={15} /></button></div>
                  </Field>
                </div>
              </>
            )}
            {(acc.ssoma || acc.admin) && (
              <>
                <span className="lbl-up" style={acc.cap ? {} : { marginTop: 0 }}>{acc.ssoma ? 'SSOMA DMZ' : 'Administración'} · ingresa con correo + contraseña</span>
                <div className="form-2">
                  <Field label="Correo"><input value={t.correo} readOnly /></Field>
                  <Field label="Contraseña temporal">
                    <div className="pin-box" style={{ letterSpacing: 1 }}>{pass}<button className="icon-btn" title="Generar otra" aria-label="Generar otra contraseña" onClick={() => setPass(passAleatoria())}><RefreshCw size={15} /></button></div>
                  </Field>
                </div>
                {acc.ssoma && (
                  <Field label="Rol dentro de SSOMA DMZ">
                    <select value={t.ssomaPerfil || 'u9'} onChange={(e) => { set((x) => { x.ssomaPerfil = e.target.value; }); notify('Rol en SSOMA actualizado'); }}>
                      {SSOMA_PERFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </Field>
                )}
              </>
            )}
            <p className="muted small" style={{ marginTop: -4 }}>En su primer ingreso, el trabajador cambia el PIN o la contraseña temporal.</p>
            <span className="lbl-up">Enviar por</span>
            <div className="opt-list">
              <label className={`opt ${canales.includes('Correo') ? 'on' : ''}`}><input type="checkbox" checked={canales.includes('Correo')} onChange={() => toggleCanal('Correo')} /><Mail size={17} /><div><strong>Correo</strong><span>{t.correo || 'Sin correo registrado'}</span></div></label>
              <label className={`opt ${canales.includes('WhatsApp') ? 'on' : ''}`}><input type="checkbox" checked={canales.includes('WhatsApp')} onChange={() => toggleCanal('WhatsApp')} /><MessageCircle size={17} /><div><strong>WhatsApp</strong><span>{t.whatsapp || 'Sin número registrado'}</span></div></label>
            </div>
            <span className="lbl-up">Así le llega el mensaje</span>
            <div className="msg-preview"><strong>DIMARZA · Acceso a plataformas</strong>{'\n'}{mensajeAcceso(t, acc, cred)}</div>
            <div className="modal-foot" style={{ padding: '14px 0 0', border: 'none' }}>
              <button className="btn btn-primary" disabled={!canales.length || !t.activo || (!acc.cap && !acc.ssoma && !acc.admin)} onClick={enviar}>
                <Send size={15} /> {ultimo ? 'Reenviar acceso' : 'Enviar acceso'}
              </button>
            </div>
            {!acc.cap && !acc.ssoma && !acc.admin && <p className="cell-err right">Agrega a la persona a un grupo antes de enviarle acceso.</p>}
          </Card>

          <Card title="Historial de envíos">
            {t.envios.length ? t.envios.map((e, i) => (
              <div key={i} className="row-link static">
                {e.canales.includes('WhatsApp') && !e.canales.includes('Correo') ? <MessageCircle size={17} /> : <Mail size={17} />}
                <div className="grow"><strong>{e.canales.join(' y ')}</strong><span className="muted small">{fechaHora(e.fecha)}</span></div>
                <Badge tone={e.estado === 'Entregado' ? 'ok' : 'info'}>{e.estado}</Badge>
              </div>
            )) : <Empty>Todavía no se le envió su acceso.</Empty>}
          </Card>

          <Card title="Datos del trabajador">
            <div className="form-2">
              <Field label="Área"><select value={t.area} onChange={(e) => set((x) => { x.area = e.target.value; })}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></Field>
              <Field label="Cargo"><input value={t.cargo} onChange={(e) => set((x) => { x.cargo = e.target.value; })} /></Field>
              <Field label="Unidad / sede"><select value={t.unidad} onChange={(e) => set((x) => { x.unidad = e.target.value; })}>{UNIDADES.map((a) => <option key={a}>{a}</option>)}</select></Field>
              <Field label="Correo"><input value={t.correo} onChange={(e) => set((x) => { x.correo = e.target.value; })} /></Field>
              <Field label="WhatsApp"><input value={t.whatsapp} onChange={(e) => set((x) => { x.whatsapp = e.target.value; })} /></Field>
            </div>
            <p className="muted small" style={{ margin: 0 }}><Check size={13} /> Los cambios se guardan al instante.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
