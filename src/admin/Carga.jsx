import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Sparkles, RotateCcw } from 'lucide-react';
import { useAcceso, accesosDe, pinAleatorio, passAleatoria, SSOMA_PERFILES } from '../acceso/db.jsx';
import { AREAS, UNIDADES } from '../acceso/seed.js';
import { PageHeader, Card, Badge, Field } from '../components/ui.jsx';
import { AccTags, aplicarEnvio, credencialesNuevas } from './comun.jsx';

const COLS = ['DNI', 'Nombres y apellidos', 'Área', 'Cargo', 'Unidad', 'Correo', 'WhatsApp', 'Grupos', 'Rol SSOMA'];
const ROLES_SSOMA = SSOMA_PERFILES.map((p) => ({ id: p.id, rol: p.label.split(' · ')[0] }));
const EJEMPLO = [
  ['47120558', 'Marco Antonio Lazo Pérez', 'Mantenimiento', 'Técnico mecánico', 'U.M. Kallpa Norte', 'mlazo@dimarza.com.pe', '+51 987 111 222', 'Capacitaciones · Participantes', ''],
  ['48233190', 'Yessica Huarcaya Ríos', 'Seguridad (SSOMA)', 'Asistente SSOMA', 'U.M. Kallpa Norte', 'yhuarcaya@dimarza.com.pe', '+51 987 333 444', 'Acceso completo', 'Asistente HSE'],
  ['42876013', 'Julio César Ñahui Poma', 'Mantenimiento', 'Supervisor de mantenimiento', 'U.M. Kallpa Norte', 'jnahui@dimarza.com.pe', '+51 987 555 666', 'Capacitaciones · Supervisores; SSOMA DMZ · Usuarios', 'Supervisor de mantenimiento'],
  ['44590321', 'Gabriela Torres Lindo', 'Administración', 'Analista de RR. HH.', 'Sede Lima', 'gtorres@dimarza.com.pe', '+51 987 777 888', 'Capacitaciones · Administradores', ''],
  ['45872103', 'Jhonatan Ramírez Quispe', 'Mantenimiento', 'Técnico mecánico', 'U.M. Cerro Azul', 'jramirez@dimarza.com.pe', '+51 987 654 321', 'Acceso completo', 'Trabajador'],
  ['4588', 'Pedro Sin DNI Válido', 'Logística', 'Almacenero', 'U.M. Llamac', '', '', 'Capacitaciones · Participantes', ''],
  ['49011772', 'Ruth Mamani Coaquira', 'Operaciones', 'Operador de grúa', 'U.M. Pampa Roja', 'rmamani@dimarza.com.pe', '+51 987 999 000', 'Grupo que no existe', 'Trabajador'],
];

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function mapearColumnas(cab) {
  const m = {};
  cab.forEach((c, i) => {
    const n = norm(c);
    if (n.includes('dni') || n.includes('documento')) m.dni = i;
    else if (n.includes('nombre')) m.nombre = i;
    else if (n.includes('area')) m.area = i;
    else if (n.includes('cargo') || n.includes('puesto')) m.cargo = i;
    else if (n.includes('unidad') || n.includes('sede')) m.unidad = i;
    else if (n.includes('correo') || n.includes('email')) m.correo = i;
    else if (n.includes('whatsapp') || n.includes('celular') || n.includes('telefono')) m.whatsapp = i;
    else if (n.includes('rol')) m.rol = i;
    else if (n.includes('grupo')) m.grupos = i;
  });
  return m;
}

function parseCsv(txt) {
  const linea1 = txt.split(/\r?\n/)[0] || '';
  const sep = (linea1.match(/;/g) || []).length > (linea1.match(/,/g) || []).length ? ';' : ',';
  const filas = []; let fila = []; let celda = ''; let comillas = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (comillas) {
      if (ch === '"' && txt[i + 1] === '"') { celda += '"'; i++; } else if (ch === '"') comillas = false; else celda += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) { fila.push(celda); celda = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; fila.push(celda); filas.push(fila); fila = []; celda = ''; }
    else celda += ch;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }
  return filas.filter((f) => f.some((c) => String(c).trim()));
}

export default function Carga() {
  const { db, update, notify } = useAcceso();
  const [filas, setFilas] = useState(null);
  const [archivo, setArchivo] = useState('');
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const [grupoTodos, setGrupoTodos] = useState('');
  const [existentes, setExistentes] = useState('actualizar');
  const [enviar, setEnviar] = useState(true);
  const [hecho, setHecho] = useState(null);
  const input = useRef();

  const procesar = (matriz, nombre) => {
    setError(''); setHecho(null);
    if (!matriz.length) { setError('El archivo está vacío.'); return; }
    const m = mapearColumnas(matriz[0]);
    if (m.dni == null || m.nombre == null) { setError('No encontré las columnas "DNI" y "Nombres y apellidos". Usa la plantilla.'); return; }
    const vistos = new Set();
    const res = matriz.slice(1).map((r, i) => {
      const v = (k) => (m[k] == null ? '' : String(r[m[k]] ?? '').trim());
      const dni = v('dni').replace(/\D/g, '');
      const nombresGrupos = v('grupos').split(/[;|]/).map((x) => x.trim()).filter(Boolean);
      const grupos = []; const errores = [];
      nombresGrupos.forEach((ng) => {
        const g = db.grupos.find((x) => norm(x.nombre) === norm(ng));
        if (g) grupos.push(g.id); else errores.push(`Grupo "${ng}" no existe`);
      });
      if (!/^\d{8}$/.test(dni)) errores.push('DNI debe tener 8 dígitos');
      if (v('nombre').length < 4) errores.push('Falta el nombre');
      if (vistos.has(dni)) errores.push('DNI repetido en el archivo');
      const rolTxt = v('rol');
      const perfil = rolTxt ? ROLES_SSOMA.find((x) => norm(x.rol) === norm(rolTxt))?.id : null;
      if (rolTxt && !perfil) errores.push(`Rol SSOMA "${rolTxt}" no existe`);
      const correoOtro = v('correo') && db.trabajadores.find((t) => t.correo.toLowerCase() === v('correo').toLowerCase() && t.dni !== dni);
      if (correoOtro) errores.push('Correo usado por otro trabajador');
      vistos.add(dni);
      const area = AREAS.find((a) => norm(a) === norm(v('area'))) || v('area') || AREAS[0];
      const existe = db.trabajadores.find((t) => t.dni === dni);
      return { n: i + 2, dni, perfil, nombre: v('nombre'), area, cargo: v('cargo'), unidad: v('unidad') || UNIDADES[0], correo: v('correo'), whatsapp: v('whatsapp'), grupos, errores, existe: !!existe };
    });
    setArchivo(nombre); setFilas(res);
  };

  const leer = async (file) => {
    if (!file) return;
    try {
      if (/\.csv$/i.test(file.name)) procesar(parseCsv(await file.text()), file.name);
      else if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import('read-excel-file/browser');
        procesar(await readSheet(file), file.name);
      } else setError('Formato no soportado. Sube un archivo .xlsx o .csv.');
    } catch {
      setError('No se pudo leer el archivo. Revisa que sea la plantilla en Excel (.xlsx) o CSV.');
    }
  };

  const plantillaXlsx = async () => {
    const { default: writeExcelFile } = await import('write-excel-file/browser');
    const data = [COLS.map((c) => ({ value: c, fontWeight: 'bold', backgroundColor: '#0E2A4D', color: '#FFFFFF' })), ...EJEMPLO.slice(0, 2).map((r) => r.map((value) => ({ value, type: String })))];
    const grupos = [[{ value: 'Grupos disponibles (escribir el nombre exacto; varios separados por ;)', fontWeight: 'bold' }], ...db.grupos.map((g) => [{ value: g.nombre }])];
    await writeExcelFile([{ data, sheet: 'Trabajadores', columns: [12, 32, 20, 26, 20, 28, 18, 40, 26].map((width) => ({ width })) }, { data: grupos, sheet: 'Grupos', columns: [{ width: 60 }] }]).toFile('plantilla_trabajadores_dmz.xlsx');
  };
  const plantillaCsv = () => {
    const esc = (x) => (/[;"\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
    const txt = '﻿' + [COLS, ...EJEMPLO.slice(0, 2)].map((r) => r.map(esc).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'plantilla_trabajadores_dmz.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const validas = (filas || []).filter((f) => !f.errores.length && !(f.existe && existentes === 'omitir'));
  const importar = () => {
    let nuevos = 0; let act = 0;
    update((d) => {
      validas.forEach((f) => {
        const grupos = [...new Set([...f.grupos, ...(grupoTodos ? [grupoTodos] : [])])];
        let t = d.trabajadores.find((x) => x.dni === f.dni);
        if (t) {
          Object.assign(t, { nombre: f.nombre, area: f.area, cargo: f.cargo || t.cargo, unidad: f.unidad, correo: f.correo || t.correo, whatsapp: f.whatsapp || t.whatsapp });
          t.grupos = [...new Set([...t.grupos, ...grupos])];
          if (f.perfil) t.ssomaPerfil = f.perfil;
          act++;
        } else {
          t = { dni: f.dni, nombre: f.nombre, area: f.area, cargo: f.cargo, unidad: f.unidad, correo: f.correo, whatsapp: f.whatsapp, grupos, ssomaPerfil: f.perfil || 'u9', pin: '', pinTemporal: true, password: '', passTemporal: true, activo: true, envios: [] };
          d.trabajadores.unshift(t);
          nuevos++;
        }
        if (enviar && t.grupos.length) aplicarEnvio(t, ['Correo', 'WhatsApp'].filter((c) => (c === 'Correo' ? t.correo : t.whatsapp)), credencialesNuevas(accesosDe(d, t), pinAleatorio, passAleatoria));
      });
    });
    setHecho({ nuevos, act, omitidos: filas.length - validas.length });
    notify(`Carga completada: ${nuevos} nuevos, ${act} actualizados`);
    setFilas(null);
  };

  const paso = hecho ? 4 : filas ? 3 : 1;
  return (
    <>
      <PageHeader title="Carga masiva de trabajadores" subtitle="Sube la lista en Excel o CSV. Cada persona puede traer sus grupos en la columna «Grupos», o puedes asignar un grupo a todos los de la carga." />
      <div className="steps">
        {['Descarga la plantilla', 'Sube el archivo', 'Revisa y asigna grupos', 'Listo'].map((s, i) => (
          <span key={s} style={{ display: 'contents' }}>{i > 0 && <i />}<span className={paso >= i + 1 ? 'on' : ''}><b>{i + 1}</b>{s}</span></span>
        ))}
      </div>

      {hecho && (
        <Card>
          <div className="row-link static">
            <CheckCircle2 size={28} color="#15803d" />
            <div className="grow"><strong>Carga completada</strong><span className="muted">{hecho.nuevos} trabajadores nuevos · {hecho.act} actualizados · {hecho.omitidos} omitidos{enviar ? ' · acceso enviado por correo y WhatsApp' : ''}</span></div>
            <Link to="/trabajadores" className="btn btn-primary">Ver trabajadores</Link>
            <button className="btn" onClick={() => setHecho(null)}><RotateCcw size={15} /> Otra carga</button>
          </div>
        </Card>
      )}

      {!filas && !hecho && (
        <div className="grid-2">
          <Card title="1 · Plantilla">
            <p className="muted" style={{ marginTop: 0 }}>Columnas: {COLS.join(', ')}. En «Grupos» escribe el nombre del grupo; si son varios, sepáralos con punto y coma. «Rol SSOMA» es opcional (por defecto, Trabajador).</p>
            <div className="page-actions">
              <button className="btn btn-primary" onClick={plantillaXlsx}><Download size={15} /> Plantilla Excel</button>
              <button className="btn" onClick={plantillaCsv}><Download size={15} /> Plantilla CSV</button>
            </div>
            <span className="lbl-up">Roles SSOMA</span>
            <p className="muted small" style={{ marginTop: 0 }}>{[...new Set(ROLES_SSOMA.map((r) => r.rol))].join(' · ')}</p>
            <span className="lbl-up">Grupos disponibles</span>
            <div>{db.grupos.map((g) => <span key={g.id} className="chip-g" style={{ '--c': g.color }}>{g.nombre}</span>)}</div>
          </Card>
          <Card title="2 · Sube el archivo">
            <div className={`drop ${over ? 'over' : ''}`} onClick={() => input.current.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); leer(e.dataTransfer.files[0]); }}>
              <FileSpreadsheet size={34} color="#2370b8" />
              <strong>Arrastra aquí tu archivo o haz clic para elegirlo</strong>
              <span className="muted small">Excel (.xlsx) o CSV · hasta 5 000 filas</span>
              <input ref={input} type="file" accept=".xlsx,.csv" hidden onChange={(e) => { leer(e.target.files[0]); e.target.value = ''; }} />
            </div>
            {error && <p className="cell-err" style={{ marginTop: 10 }}>{error}</p>}
            <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => procesar([COLS, ...EJEMPLO], 'ejemplo_demo.xlsx')}><Sparkles size={14} /> Probar con un archivo de ejemplo</button>
          </Card>
        </div>
      )}

      {filas && (
        <>
          <Card title={`3 · Revisa la carga · ${archivo}`} actions={<button className="btn btn-sm" onClick={() => setFilas(null)}>Cambiar archivo</button>}>
            <div className="form-2" style={{ gridTemplateColumns: '1.3fr 1fr 1fr' }}>
              <Field label="Agregar a todos al grupo (opcional)">
                <select value={grupoTodos} onChange={(e) => setGrupoTodos(e.target.value)}>
                  <option value="">Solo los grupos del archivo</option>
                  {db.grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </Field>
              <Field label="Si el DNI ya existe">
                <select value={existentes} onChange={(e) => setExistentes(e.target.value)}>
                  <option value="actualizar">Actualizar datos y sumar grupos</option>
                  <option value="omitir">Omitir esa fila</option>
                </select>
              </Field>
              <Field label="Al importar">
                <label className="opt on" style={{ padding: '7px 10px' }}><input type="checkbox" checked={enviar} onChange={(e) => setEnviar(e.target.checked)} /><span style={{ color: 'var(--text)' }}>Enviar usuario y PIN</span></label>
              </Field>
            </div>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>Fila</th><th>Estado</th><th>DNI</th><th>Nombre</th><th>Área · cargo</th><th>Grupos</th><th>Accesos resultantes</th></tr></thead>
                <tbody>
                  {filas.map((f) => {
                    const grupos = [...new Set([...f.grupos, ...(grupoTodos ? [grupoTodos] : [])])];
                    const prev = db.trabajadores.find((t) => t.dni === f.dni);
                    const final = { activo: true, grupos: [...new Set([...(prev?.grupos || []), ...grupos])] };
                    return (
                      <tr key={f.n} className={f.errores.length ? 'row-err' : ''}>
                        <td className="muted">{f.n}</td>
                        <td>{f.errores.length ? <Badge tone="bad">Error</Badge> : f.existe ? (existentes === 'omitir' ? <Badge tone="muted">Se omite</Badge> : <Badge tone="info">Actualiza</Badge>) : <Badge tone="ok">Nuevo</Badge>}</td>
                        <td>{f.dni || '—'}</td>
                        <td><strong>{f.nombre}</strong>{f.errores.map((e) => <div key={e} className="cell-err"><AlertTriangle size={12} /> {e}</div>)}</td>
                        <td className="small">{f.area}<div className="muted">{f.cargo}</div></td>
                        <td>{grupos.length ? grupos.map((g) => { const x = db.grupos.find((y) => y.id === g); return <span key={g} className="chip-g" style={{ '--c': x.color }}>{x.nombre}</span>; }) : <span className="muted small">Sin grupo</span>}</td>
                        <td>{f.errores.length ? '—' : <AccTags acc={accesosDe(db, final)} />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="page-actions" style={{ justifyContent: 'flex-end' }}>
            <span className="muted">{validas.length} se importarán · {filas.length - validas.length} con error u omitidas</span>
            <button className="btn btn-primary" disabled={!validas.length} onClick={importar}><Upload size={15} /> Importar {validas.length} trabajadores</button>
          </div>
        </>
      )}
    </>
  );
}
