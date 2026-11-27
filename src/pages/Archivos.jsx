import { useMemo, useRef, useState } from 'react';
import {
  Folder, FolderOpen, FileText, FileSpreadsheet, FileImage, File, Presentation, Upload, FolderPlus, Shield, Download, Trash2,
  ChevronRight, ChevronDown, Pencil, History, Search, Lock, Building2, Link2, Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { guardarBlob, leerBlob, borrarBlob, olvidarUrl } from '../lib/blobs.js';
import { SECCIONES, seccionesDeCarpeta, carpetaDeSeccion, rutaTexto } from '../lib/adjuntos.js';
import { VisorArchivo } from '../components/Adjuntos.jsx';
import { useStore, nivelCarpeta, rank, rutaCarpeta, nombreUsuario, nombreUnidad, fmtFecha, NIVELES } from '../store.jsx';
import { Badge, Card, PageHeader, Modal, Field, Empty } from '../components/ui.jsx';
import { ROLES } from '../data/seed.js';


const icono = (nombre) => {
  const ext = nombre.split('.').pop().toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={18} className="ic-xls" />;
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <FileImage size={18} className="ic-img" />;
  if (['pptx', 'ppt'].includes(ext)) return <Presentation size={18} className="ic-ppt" />;
  if (['pdf'].includes(ext)) return <FileText size={18} className="ic-pdf" />;
  if (['docx', 'doc'].includes(ext)) return <FileText size={18} className="ic-doc" />;
  return <File size={18} />;
};
const tam = (kb) => (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
const ETQ = { ninguno: 'Sin acceso', ver: 'Ver y descargar', subir: 'Ver y subir', editar: 'Editar', admin: 'Administrar' };

export default function Archivos() {
  const { db, user, update, notify } = useStore();
  const [actual, setActual] = useState('root');
  const [abiertas, setAbiertas] = useState(() => new Set(['root', 'f02']));
  const [q, setQ] = useState('');
  const [nuevaCarpeta, setNuevaCarpeta] = useState(null);
  const [renombrar, setRenombrar] = useState(null);
  const [permisos, setPermisos] = useState(null);
  const [asociar, setAsociar] = useState(false);
  const [ver, setVer] = useState(null);
  const fileInput = useRef(null);

  const nivel = useMemo(() => {
    const m = {};
    db.carpetas.forEach((c) => { m[c.id] = nivelCarpeta(db, user, c.id); });
    return m;
  }, [db, user]);
  const visible = (id) => rank(nivel[id]) >= rank('ver');
  const hijos = (id) => db.carpetas.filter((c) => c.parentId === id && visible(c.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));

  const carpeta = db.carpetas.find((c) => c.id === actual);
  const miNivel = nivel[actual] || 'ninguno';
  const ruta = rutaCarpeta(db, actual);
  const sub = hijos(actual);
  const archivos = db.archivos.filter((a) => a.folderId === actual).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const resultados = q.trim()
    ? db.archivos.filter((a) => visible(a.folderId) && a.nombre.toLowerCase().includes(q.toLowerCase()))
    : null;

  const ir = (id) => {
    setActual(id);
    setQ('');
    const r = rutaCarpeta(db, id).map((c) => c.id);
    setAbiertas((s) => new Set([...s, ...r]));
  };
  const toggle = (id) => setAbiertas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const subir = async (files) => {
    if (!files?.length) return;
    const lista = [...files].map((f) => {
      const existente = db.archivos.find((a) => a.folderId === actual && a.nombre === f.name);
      return { f, id: existente ? existente.id : 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), existente: !!existente };
    });
    for (const x of lista) { await guardarBlob(x.id, x.f); olvidarUrl(x.id); }
    update((d) => {
      lista.forEach(({ f, id, existente }) => {
        const kb = Math.max(1, Math.round(f.size / 1024));
        const fecha = new Date().toISOString().slice(0, 10);
        if (existente) { const e = d.archivos.find((a) => a.id === id); e.version += 1; e.actualizado = fecha; e.autor = user.id; e.kb = kb; }
        else d.archivos.push({ id, folderId: actual, nombre: f.name, kb, tipo: f.type || '', autor: user.id, actualizado: fecha, version: 1 });
      });
    }, `${files.length} archivo(s) subido(s) a "${carpeta.nombre}"`);
  };
  const descargar = async (a) => {
    const guardado = await leerBlob(a.id);
    const blob = guardado || new Blob([`Archivo de demostración: ${a.nombre}\nCarpeta: ${ruta.map((c) => c.nombre).join(' / ')}\nVersión ${a.version} · ${fmtFecha(a.actualizado)}\n\nEn el sistema real aquí se descarga el documento original.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = guardado ? a.nombre : a.nombre + '.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const nuevaVersion = (a) => update((d) => { const x = d.archivos.find((y) => y.id === a.id); x.version += 1; x.actualizado = new Date().toISOString().slice(0, 10); x.autor = user.id; }, `Nueva versión de ${a.nombre}`);
  const eliminar = (a) => { borrarBlob(a.id); olvidarUrl(a.id); update((d) => { d.archivos = d.archivos.filter((x) => x.id !== a.id); }, `${a.nombre} eliminado`); };

  const crearCarpeta = () => {
    const nombre = nuevaCarpeta.trim();
    if (!nombre) return;
    update((d) => { d.carpetas.push({ id: 'c' + Date.now(), nombre, parentId: actual, acl: null, usuarios: {}, unidad: null }); }, `Carpeta "${nombre}" creada`);
    setAbiertas((s) => new Set([...s, actual]));
    setNuevaCarpeta(null);
  };
  const guardarNombre = () => {
    if (!renombrar.trim()) return;
    update((d) => { d.carpetas.find((c) => c.id === actual).nombre = renombrar.trim(); }, 'Carpeta renombrada');
    setRenombrar(null);
  };
  const eliminarCarpeta = () => {
    const tieneContenido = db.carpetas.some((c) => c.parentId === actual) || archivos.length;
    if (tieneContenido) { notify('Solo se pueden eliminar carpetas vacías'); return; }
    const padre = carpeta.parentId;
    update((d) => { d.carpetas = d.carpetas.filter((c) => c.id !== actual); Object.keys(d.vinculos || {}).forEach((k) => { if (d.vinculos[k] === actual) delete d.vinculos[k]; }); }, 'Carpeta eliminada');
    setActual(padre);
  };

  const Nodo = ({ c, depth }) => {
    const hs = hijos(c.id);
    const open = abiertas.has(c.id);
    return (
      <li>
        <div className={`tree-row ${actual === c.id ? 'active' : ''}`} style={{ paddingLeft: 6 + depth * 14 }}>
          <button className="tree-caret" onClick={() => toggle(c.id)} disabled={!hs.length} aria-label="Expandir">
            {hs.length ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
          </button>
          <button className="tree-name" onClick={() => ir(c.id)}>
            {actual === c.id ? <FolderOpen size={16} /> : <Folder size={16} />}
            <span>{c.nombre}</span>
            {c.unidad && <Building2 size={12} className="muted" />}
            {seccionesDeCarpeta(db, c.id).length > 0 && <Link2 size={12} className="ic-link" />}
          </button>
        </div>
        {open && hs.length > 0 && <ul>{hs.map((h) => <Nodo key={h.id} c={h} depth={depth + 1} />)}</ul>}
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Repositorio de archivos" subtitle="Directorio compartido tipo servidor: carpetas y subcarpetas en el orden del área, con permisos por rol, unidad o persona." />
      {nivel.root === 'admin' && (
        <div className="vinc-strip">
          <span className="lbl-up"><Link2 size={13} /> Carpetas asociadas a secciones del sistema</span>
          {Object.entries(SECCIONES).map(([k, sct]) => {
            const f = carpetaDeSeccion(db, k);
            return (
              <span key={k} className={`vinc ${f ? 'on' : ''}`}>
                <strong>{sct.corto}</strong>
                {f ? <button className="link" onClick={() => ir(f)}>{rutaTexto(db, f).replace(/^Repositorio SSOMA \/ /, '')}</button> : <span className="muted">Sin asociar · no se pueden subir archivos</span>}
              </span>
            );
          })}
        </div>
      )}
      <div className="files">
        <aside className="files-tree">
          <ul className="tree">{visible('root') && <Nodo c={db.carpetas.find((c) => c.id === 'root')} depth={0} />}</ul>
        </aside>
        <section className="files-main">
          <div className="files-bar">
            <nav className="crumbs">
              {ruta.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <ChevronRight size={14} />}
                  {visible(c.id) ? <button onClick={() => ir(c.id)}>{c.nombre}</button> : <span className="muted">{c.nombre}</span>}
                </span>
              ))}
            </nav>
            <div className="search"><Search size={15} /><input placeholder="Buscar archivos" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>
          <div className="files-actions">
            <span className="muted small">Tu acceso aquí: </span><Badge>{miNivel}</Badge>
            <span className="small muted">{ETQ[miNivel]}</span>
            {carpeta?.unidad && <span className="small muted"> · Solo personal de {nombreUnidad(db, carpeta.unidad)} y roles corporativos</span>}
            <div className="grow" />
            {rank(miNivel) >= rank('editar') && <button className="btn btn-sm" onClick={() => setNuevaCarpeta('')}><FolderPlus size={15} /> Nueva carpeta</button>}
            {rank(miNivel) >= rank('subir') && (
              <>
                <button className="btn btn-sm btn-primary" onClick={() => fileInput.current?.click()}><Upload size={15} /> Subir archivos</button>
                <input ref={fileInput} type="file" multiple hidden onChange={(e) => { subir(e.target.files); e.target.value = ''; }} />
              </>
            )}
            {miNivel === 'admin' && actual !== 'root' && <button className="btn btn-sm" onClick={() => setRenombrar(carpeta.nombre)}><Pencil size={15} /> Renombrar</button>}
            {miNivel === 'admin' && actual !== 'root' && <button className="btn btn-sm" onClick={() => setAsociar(true)}><Link2 size={15} /> Asociar a sección</button>}
            {miNivel === 'admin' && <button className="btn btn-sm" onClick={() => setPermisos({ acl: { ...(carpeta.acl || {}) }, usuarios: { ...(carpeta.usuarios || {}) }, nuevoUser: '', nuevoNivel: 'ver' })}><Shield size={15} /> Permisos</button>}
            {miNivel === 'admin' && actual !== 'root' && <button className="icon-btn" title="Eliminar carpeta vacía" onClick={eliminarCarpeta}><Trash2 size={15} /></button>}
          </div>

          {seccionesDeCarpeta(db, actual).length > 0 && (
            <p className="vinc-note"><Link2 size={14} /><span>Aquí se guardan los archivos que se suben desde {seccionesDeCarpeta(db, actual).map((k) => <Link key={k} to={SECCIONES[k].ruta}>{SECCIONES[k].corto}</Link>).reduce((a, b) => [a, ' y ', b])}. Cada registro crea su propia subcarpeta. Quien tenga permiso de «subir» en esta carpeta podrá adjuntar archivos desde esa sección.</span></p>
          )}
          <div
            className={`files-list ${rank(miNivel) >= rank('subir') ? 'droppable' : ''}`}
            onDragOver={(e) => { if (rank(miNivel) >= rank('subir')) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (rank(miNivel) >= rank('subir')) subir(e.dataTransfer.files); }}
          >
            {resultados ? (
              <>
                <p className="muted small">{resultados.length} resultado(s) en carpetas a las que tienes acceso</p>
                {resultados.map((a) => (
                  <div key={a.id} className="file-row">
                    {icono(a.nombre)}
                    <div className="grow"><strong>{a.nombre}</strong><span className="muted small">{rutaCarpeta(db, a.folderId).map((c) => c.nombre).join(' / ')}</span></div>
                    <button className="btn btn-sm" onClick={() => ir(a.folderId)}>Abrir carpeta</button>
                  </div>
                ))}
              </>
            ) : (
              <>
                {sub.length === 0 && archivos.length === 0 && <Empty>Carpeta vacía{rank(miNivel) >= rank('subir') ? '. Arrastra archivos aquí o usa "Subir archivos".' : '.'}</Empty>}
                {sub.map((c) => (
                  <button key={c.id} className="file-row folder" onClick={() => ir(c.id)}>
                    <Folder size={18} className="ic-folder" />
                    <div className="grow"><strong>{c.nombre}</strong><span className="muted small">{db.carpetas.filter((x) => x.parentId === c.id && visible(x.id)).length} carpetas · {db.archivos.filter((x) => x.folderId === c.id).length} archivos</span></div>
                    {seccionesDeCarpeta(db, c.id).map((k) => <span key={k} className="vinc-tag"><Link2 size={11} /> {SECCIONES[k].corto}</span>)}
                    <Badge>{nivel[c.id]}</Badge>
                  </button>
                ))}
                {archivos.map((a) => (
                  <div key={a.id} className="file-row">
                    {icono(a.nombre)}
                    <button className="grow file-open" onClick={() => setVer(a)}>
                      <strong>{a.nombre}</strong>
                      <span className="muted small">v{a.version} · {tam(a.kb)} · {nombreUsuario(db, a.autor)} · {fmtFecha(a.actualizado)}{a.origen ? ` · desde ${SECCIONES[a.origen.seccion]?.corto || a.origen.seccion} (${a.origen.ref})` : ''}</span>
                    </button>
                    <button className="icon-btn" title="Vista previa" onClick={() => setVer(a)}><Eye size={16} /></button>
                    <button className="icon-btn" title="Descargar" onClick={() => descargar(a)}><Download size={16} /></button>
                    {rank(miNivel) >= rank('editar') && <button className="icon-btn" title="Registrar nueva versión" onClick={() => nuevaVersion(a)}><History size={16} /></button>}
                    {rank(miNivel) >= rank('editar') && <button className="icon-btn" title="Eliminar" onClick={() => eliminar(a)}><Trash2 size={16} /></button>}
                  </div>
                ))}
              </>
            )}
          </div>
          <p className="muted small files-note"><Lock size={12} /> Las carpetas sin acceso no aparecen. Las de cada unidad solo las ve el personal de esa unidad y los roles corporativos.</p>
        </section>
      </div>

      {nuevaCarpeta !== null && (
        <Modal title="Nueva carpeta" onClose={() => setNuevaCarpeta(null)}
          footer={<><button className="btn" onClick={() => setNuevaCarpeta(null)}>Cancelar</button><button className="btn btn-primary" onClick={crearCarpeta}>Crear</button></>}>
          <Field label={`Dentro de "${carpeta.nombre}"`}><input autoFocus value={nuevaCarpeta} onChange={(e) => setNuevaCarpeta(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && crearCarpeta()} placeholder="Nombre de la carpeta" /></Field>
          <p className="muted small">La carpeta nueva hereda los permisos de "{carpeta.nombre}". Puedes cambiarlos después.</p>
        </Modal>
      )}
      {renombrar !== null && (
        <Modal title="Renombrar carpeta" onClose={() => setRenombrar(null)}
          footer={<><button className="btn" onClick={() => setRenombrar(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarNombre}>Guardar</button></>}>
          <Field label="Nombre"><input autoFocus value={renombrar} onChange={(e) => setRenombrar(e.target.value)} /></Field>
        </Modal>
      )}
      {ver && <VisorArchivo archivo={ver} onClose={() => setVer(null)} />}
      {asociar && <AsociarSeccion carpeta={carpeta} onClose={() => setAsociar(false)} />}
      {permisos && <PermisosCarpeta carpeta={carpeta} estado={permisos} setEstado={setPermisos} onClose={() => setPermisos(null)} />}
    </>
  );
}

function PermisosCarpeta({ carpeta, estado, setEstado, onClose }) {
  const { db, update } = useStore();
  // vista previa: cómo quedaría con los cambios
  const simulado = { ...db, carpetas: db.carpetas.map((c) => (c.id === carpeta.id ? { ...c, acl: estado.acl, usuarios: estado.usuarios } : c)) };
  const heredado = (rol) => {
    const sinRegla = { ...simulado, carpetas: simulado.carpetas.map((c) => (c.id === carpeta.id ? { ...c, acl: { ...estado.acl, [rol]: undefined } } : c)) };
    const u = db.usuarios.find((x) => x.rol === rol) || { id: '_', rol, unidad: carpeta.unidad };
    return nivelCarpeta(sinRegla, { ...u, id: '_sim' }, carpeta.id);
  };
  const setRol = (rol, v) => {
    const acl = { ...estado.acl };
    if (v === 'heredar') delete acl[rol]; else acl[rol] = v;
    setEstado({ ...estado, acl });
  };
  const addUser = () => {
    if (!estado.nuevoUser) return;
    setEstado({ ...estado, usuarios: { ...estado.usuarios, [estado.nuevoUser]: estado.nuevoNivel }, nuevoUser: '' });
  };
  const delUser = (id) => { const u = { ...estado.usuarios }; delete u[id]; setEstado({ ...estado, usuarios: u }); };
  const guardar = () => {
    update((d) => {
      const c = d.carpetas.find((x) => x.id === carpeta.id);
      const acl = Object.fromEntries(Object.entries(estado.acl).filter(([, v]) => v));
      c.acl = Object.keys(acl).length ? acl : null;
      c.usuarios = estado.usuarios;
    }, `Permisos de "${carpeta.nombre}" actualizados`);
    onClose();
  };

  return (
    <Modal wide title={`Permisos · ${carpeta.nombre}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar permisos</button></>}>
      {carpeta.unidad && <p className="note"><Building2 size={14} /> Carpeta de {nombreUnidad(db, carpeta.unidad)}: además de estos permisos, solo la ve el personal de esa unidad y los roles corporativos.</p>}
      <div className="grid-2 tight">
        <div>
          <h4 className="h4">Por rol</h4>
          <table className="table compact">
            <tbody>
              {Object.keys(ROLES).map((rol) => (
                <tr key={rol}>
                  <td>{ROLES[rol].nombre}</td>
                  <td>
                    <select value={estado.acl[rol] || 'heredar'} onChange={(e) => setRol(rol, e.target.value)}>
                      <option value="heredar">Heredar ({heredado(rol)})</option>
                      {NIVELES.map((n) => <option key={n} value={n}>{ETQ[n]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 className="h4">Excepciones por persona</h4>
          {Object.entries(estado.usuarios).map(([id, n]) => (
            <div key={id} className="inline-form between">
              <span>{nombreUsuario(db, id)}</span>
              <span><Badge>{n}</Badge> <button className="icon-btn" onClick={() => delUser(id)}><Trash2 size={14} /></button></span>
            </div>
          ))}
          <div className="inline-form">
            <select value={estado.nuevoUser} onChange={(e) => setEstado({ ...estado, nuevoUser: e.target.value })}>
              <option value="">Agregar persona…</option>
              {db.usuarios.filter((u) => !estado.usuarios[u.id]).map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
            <select value={estado.nuevoNivel} onChange={(e) => setEstado({ ...estado, nuevoNivel: e.target.value })}>
              {NIVELES.map((n) => <option key={n} value={n}>{ETQ[n]}</option>)}
            </select>
            <button className="btn btn-sm" onClick={addUser}>Agregar</button>
          </div>
        </div>
        <div>
          <h4 className="h4">Así queda el acceso</h4>
          <table className="table compact">
            <tbody>
              {db.usuarios.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong><div className="muted small">{ROLES[u.rol].nombre}{u.unidad ? ' · ' + nombreUnidad(db, u.unidad) : ''}</div></td>
                  <td className="right"><Badge>{nivelCarpeta(simulado, u, carpeta.id)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">Las subcarpetas heredan estos permisos salvo que tengan los suyos.</p>
        </div>
      </div>
    </Modal>
  );
}

function AsociarSeccion({ carpeta, onClose }) {
  const { db, update } = useStore();
  const [sel, setSel] = useState(() => Object.fromEntries(Object.keys(SECCIONES).map((k) => [k, db.vinculos?.[k] === carpeta.id])));
  const guardar = () => {
    update((d) => {
      d.vinculos = d.vinculos || {};
      Object.keys(SECCIONES).forEach((k) => {
        if (sel[k]) d.vinculos[k] = carpeta.id;
        else if (d.vinculos[k] === carpeta.id) delete d.vinculos[k];
      });
    }, `Asociaciones de "${carpeta.nombre}" actualizadas`);
    onClose();
  };
  return (
    <Modal title={`Asociar «${carpeta.nombre}» a una sección`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></>}>
      <p className="muted small" style={{ marginTop: 0 }}>Los archivos que se adjunten en la sección se guardarán en esta carpeta, cada registro en su propia subcarpeta. Si una sección no tiene carpeta asociada, nadie puede subir archivos desde ella. Quién puede subir o ver lo decides con los permisos de la carpeta.</p>
      {Object.entries(SECCIONES).map(([k, sct]) => {
        const otra = carpetaDeSeccion(db, k);
        return (
          <label key={k} className="vinc-opt">
            <input type="checkbox" checked={sel[k]} onChange={(e) => setSel({ ...sel, [k]: e.target.checked })} />
            <span>
              <strong>{sct.nombre}</strong>
              <span className="muted small">{otra && otra !== carpeta.id ? `Hoy se guarda en «${rutaTexto(db, otra)}»; al marcarla pasará a esta carpeta (lo ya subido se queda donde está).` : otra === carpeta.id ? 'Asociada a esta carpeta.' : 'Sin carpeta asociada.'}</span>
            </span>
          </label>
        );
      })}
    </Modal>
  );
}
