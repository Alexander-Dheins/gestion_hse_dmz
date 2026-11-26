import { useState } from 'react';
import { FileText, Plus, Lock, CalendarPlus } from 'lucide-react';
import { useStore, can, fmtFecha, nombreUnidad, estadoFecha, nextId, hoy } from '../store.jsx';
import { Badge, Card, PageHeader, Stat, Modal, Field, Empty, Locked } from '../components/ui.jsx';
import { FormatoModal } from '../components/Formato.jsx';
import { fmtMonitoreo } from '../formatos.jsx';

// horas simuladas (determinísticas) para el control de fatiga
const horas = (id, k) => { let h = 0; for (const c of id + k) h = (h * 31 + c.charCodeAt(0)) % 997; return h; };

export default function Salud() {
  const { db, user, inScope, visibleUnits, update } = useStore();
  const [tab, setTab] = useState('vigilancia');
  const [formato, setFormato] = useState(null);
  const [nuevoMon, setNuevoMon] = useState(null);
  if (!can(user, 'salud.ver')) return <Locked />;
  const medico = can(user, 'salud.editar');

  const personal = db.personal.filter((p) => inScope(p.unidad));
  const aptos = personal.filter((p) => p.aptitud === 'Apto').length;
  const restr = personal.filter((p) => p.aptitud === 'Apto con restricciones');
  const noAptos = personal.filter((p) => p.aptitud === 'No apto').length;
  const emoVenc = personal.filter((p) => estadoFecha(p.emoVence) === 'vencido');
  const emoPor = personal.filter((p) => estadoFecha(p.emoVence) === 'por vencer');
  const listaVig = [...emoVenc, ...emoPor, ...restr.filter((p) => !emoVenc.includes(p) && !emoPor.includes(p))];

  const mon = db.monitoreos.filter((m) => inScope(m.unidad));
  const paradas = db.paradas.filter((p) => inScope(p.unidad) && p.estado === 'En curso');

  const programarEmo = (p) => update((d) => {
    const w = d.personal.find((x) => x.id === p.id);
    w.emoVence = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  }, `EMO registrado para ${p.nombre}: vigente por 1 año`);
  const guardarMon = () => {
    update((d) => { d.monitoreos.push({ ...nuevoMon, id: nextId(d.monitoreos, 'MO'), valor: +nuevoMon.valor, lmp: +nuevoMon.lmp, fecha: hoy(), laboratorio: 'Laboratorio ficticio Andes S.A.C.' }); }, 'Monitoreo registrado');
    setNuevoMon(null);
  };

  return (
    <>
      <PageHeader title="Salud ocupacional" subtitle="Vigilancia médica, monitoreo de agentes y control de fatiga. El detalle clínico solo lo ve el área médica." />
      <div className="tabs">
        {[['vigilancia', 'Vigilancia médica'], ['monitoreo', 'Monitoreo de agentes'], ['fatiga', 'Fatiga y jornadas']].map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'vigilancia' && (
        <>
          <div className="stats">
            <Stat label="Aptos" value={aptos} tone="ok" />
            <Stat label="Con restricciones" value={restr.length} tone="warn" />
            <Stat label="No aptos" value={noAptos} tone={noAptos ? 'bad' : ''} />
            <Stat label="EMO vencido" value={emoVenc.length} tone={emoVenc.length ? 'bad' : 'ok'} hint="bloqueados para ingresar" />
            <Stat label="EMO por vencer (30 días)" value={emoPor.length} tone="warn" hint="programar examen" />
          </div>
          <Card title="Requieren atención médica o programación de EMO">
            {listaVig.length === 0 && <Empty>Nada pendiente.</Empty>}
            <table className="table">
              <thead><tr><th>Trabajador</th><th>Unidad</th><th>Aptitud</th><th>Vence EMO</th><th>Detalle clínico</th>{medico && <th />}</tr></thead>
              <tbody>
                {listaVig.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong><div className="muted small">{p.id} · {p.cargo}</div></td>
                    <td>{nombreUnidad(db, p.unidad)}</td>
                    <td><Badge>{p.aptitud}</Badge>{p.restriccion && <div className="small muted">{p.restriccion}</div>}</td>
                    <td><Badge>{estadoFecha(p.emoVence)}</Badge> <span className="small">{fmtFecha(p.emoVence)}</span></td>
                    <td>{medico ? <span className="small txt-info">{p.diagnostico}</span> : <span className="small muted"><Lock size={11} /> Confidencial</span>}</td>
                    {medico && <td><button className="btn btn-sm" onClick={() => programarEmo(p)}><CalendarPlus size={14} /> Registrar EMO</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'monitoreo' && (
        <Card title="Resultados de monitoreo" actions={<>
          {medico && <button className="btn btn-sm" onClick={() => setNuevoMon({ unidad: visibleUnits[0], agente: 'Ruido', puesto: '', valor: '', unidad_medida: 'dB(A)', lmp: 85 })}><Plus size={14} /> Registrar monitoreo</button>}
          <button className="btn btn-sm btn-primary" onClick={() => setFormato(fmtMonitoreo(db, mon[0]?.unidad || visibleUnits[0]))}><FileText size={14} /> Formato</button>
        </>}>
          {mon.length === 0 && <Empty>Sin monitoreos en esta unidad.</Empty>}
          <table className="table">
            <thead><tr><th>Código</th><th>Agente</th><th>Puesto</th><th>Unidad</th><th>Resultado vs límite</th><th>Condición</th><th>Fecha</th></tr></thead>
            <tbody>
              {mon.map((m) => {
                const ratio = m.inverso ? m.lmp / (m.valor || 1) : m.valor / m.lmp;
                const excede = m.inverso ? m.valor < m.lmp : m.valor > m.lmp;
                const cerca = !excede && ratio > 0.8;
                return (
                  <tr key={m.id}>
                    <td>{m.id}</td><td><strong>{m.agente}</strong></td><td>{m.puesto}</td><td>{nombreUnidad(db, m.unidad)}</td>
                    <td style={{ minWidth: 190 }}>
                      <div className="limit"><div className={excede ? 'bad' : cerca ? 'warn' : 'ok'} style={{ width: `${Math.min(100, Math.abs(ratio) * 80)}%` }} /><span className="limit-mark" /></div>
                      <span className="small">{m.valor} {m.unidad_medida} · límite {m.lmp}</span>
                    </td>
                    <td>{excede ? <Badge tone="bad">Excede</Badge> : cerca ? <Badge tone="warn">Cerca del límite</Badge> : <Badge tone="ok">Dentro del límite</Badge>}</td>
                    <td className="nowrap">{fmtFecha(m.fecha)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'fatiga' && (
        <Card title="Control de jornadas en paradas en curso">
          <p className="muted small">Alerta cuando un trabajador supera 12 h en el día o 60 h en los últimos 7 días (parámetros configurables por unidad).</p>
          {paradas.every((p) => !p.cuadrilla.length) && <Empty>No hay cuadrillas en paradas en curso.</Empty>}
          {paradas.filter((p) => p.cuadrilla.length).map((p) => (
            <div key={p.id}>
              <h4 className="h4">{p.id} · {p.equipo} · {nombreUnidad(db, p.unidad)}</h4>
              <table className="table compact">
                <thead><tr><th>Trabajador</th><th>Horas hoy</th><th>Horas 7 días</th><th>Último descanso</th><th>Estado</th></tr></thead>
                <tbody>
                  {p.cuadrilla.map((id) => {
                    const w = db.personal.find((x) => x.id === id);
                    const hd = 8 + (horas(id, 'd') % 6);
                    const hs = 48 + (horas(id, 's') % 20);
                    const alerta = hd > 12 || hs > 60;
                    return (
                      <tr key={id} className={alerta ? 'row-bad' : ''}>
                        <td><strong>{w?.nombre}</strong><div className="muted small">{w?.cargo}</div></td>
                        <td>{hd} h</td><td>{hs} h</td><td>{10 + (horas(id, 'r') % 3)} h</td>
                        <td>{alerta ? <Badge tone="bad">Requiere descanso</Badge> : <Badge tone="ok">Dentro de jornada</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </Card>
      )}

      {nuevoMon && (
        <Modal title="Registrar monitoreo" onClose={() => setNuevoMon(null)}
          footer={<><button className="btn" onClick={() => setNuevoMon(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarMon} disabled={!nuevoMon.puesto || nuevoMon.valor === ''}>Guardar</button></>}>
          <div className="form-2">
            <Field label="Unidad"><select value={nuevoMon.unidad} onChange={(e) => setNuevoMon({ ...nuevoMon, unidad: e.target.value })}>{visibleUnits.map((u) => <option key={u} value={u}>{nombreUnidad(db, u)}</option>)}</select></Field>
            <Field label="Agente">
              <select value={nuevoMon.agente} onChange={(e) => { const m = { Ruido: ['dB(A)', 85], 'Polvo respirable': ['mg/m³', 3], 'Humos metálicos': ['mg/m³', 5], 'Vibración mano-brazo': ['m/s²', 5] }[e.target.value]; setNuevoMon({ ...nuevoMon, agente: e.target.value, unidad_medida: m[0], lmp: m[1] }); }}>
                {['Ruido', 'Polvo respirable', 'Humos metálicos', 'Vibración mano-brazo'].map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Puesto evaluado"><input value={nuevoMon.puesto} onChange={(e) => setNuevoMon({ ...nuevoMon, puesto: e.target.value })} /></Field>
          <div className="form-2">
            <Field label={`Resultado (${nuevoMon.unidad_medida})`}><input type="number" value={nuevoMon.valor} onChange={(e) => setNuevoMon({ ...nuevoMon, valor: e.target.value })} /></Field>
            <Field label="Límite permisible"><input type="number" value={nuevoMon.lmp} onChange={(e) => setNuevoMon({ ...nuevoMon, lmp: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
