import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileSpreadsheet, File, Film, Lock, Paperclip, Plus, X, Download, FolderOpen, Link2, Upload } from 'lucide-react';
import { useStore, fmtFecha, nombreUsuario } from '../store.jsx';
import { Modal } from './ui.jsx';
import { urlDe } from '../lib/blobs.js';
import { SECCIONES, MAX_MB, estadoSubida, puedeVer, esImagen, esPdf, esVideo, extDe, rutaTexto, prepararAdjuntos, registrarAdjuntos } from '../lib/adjuntos.js';

const IconoTipo = ({ nombre, size = 26 }) => {
  const e = extDe(nombre);
  if (['xlsx', 'xls', 'csv'].includes(e)) return <FileSpreadsheet size={size} className="ic-xls" />;
  if (e === 'pdf') return <FileText size={size} className="ic-pdf" />;
  if (['doc', 'docx'].includes(e)) return <FileText size={size} className="ic-doc" />;
  if (esVideo(nombre)) return <Film size={size} />;
  return <File size={size} />;
};
const tam = (kb) => (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');

// URL del contenido: archivo recién elegido (File) o guardado (id en IndexedDB)
function useUrl(fuente) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let vivo = true;
    if (fuente instanceof Blob) {
      const u = URL.createObjectURL(fuente);
      setUrl(u);
      return () => { vivo = false; URL.revokeObjectURL(u); };
    }
    if (fuente) urlDe(fuente).then((u) => vivo && setUrl(u));
    else setUrl(null);
    return () => { vivo = false; };
  }, [fuente]);
  return url;
}

function Tile({ nombre, fuente, meta, onOpen, onRemove, bloqueado }) {
  const url = useUrl(bloqueado ? null : fuente);
  return (
    <div className={`adj-tile ${bloqueado ? 'lock' : ''}`}>
      <button type="button" className="adj-thumb" onClick={bloqueado ? undefined : onOpen} title={bloqueado ? 'Sin acceso a esta carpeta del repositorio' : `Ver ${nombre}`}>
        {bloqueado ? <Lock size={22} /> : url && esImagen(nombre) ? <img src={url} alt={nombre} /> : <IconoTipo nombre={nombre} />}
        {!bloqueado && !esImagen(nombre) && <span className="adj-ext">{extDe(nombre)}</span>}
      </button>
      <span className="adj-name" title={nombre}>{nombre}</span>
      {meta && <span className="adj-meta">{meta}</span>}
      {onRemove && <button type="button" className="adj-x" onClick={onRemove} aria-label={`Quitar ${nombre}`}><X size={12} /></button>}
    </div>
  );
}

// Visor de un archivo (imagen, PDF, video o descarga)
export function VisorArchivo({ archivo, file, onClose }) {
  const { db } = useStore();
  const nombre = file ? file.name : archivo.nombre;
  const url = useUrl(file || archivo?.id);
  const [listo, setListo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setListo(true), 400); return () => clearTimeout(t); }, []);
  const descargar = () => {
    const blobUrl = url || URL.createObjectURL(new Blob([`Archivo de demostración: ${nombre}\nEn el sistema real aquí se descarga el documento original.`], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = blobUrl; a.download = url ? nombre : nombre + '.txt'; a.click();
  };
  return (
    <Modal wide title={nombre} onClose={onClose}
      footer={<>
        {archivo?.id && <span className="muted small grow"><FolderOpen size={13} /> {rutaTexto(db, archivo.folderId)}</span>}
        <button className="btn" onClick={descargar}><Download size={15} /> Descargar</button>
      </>}>
      <div className="visor">
        {url && esImagen(nombre) && <img src={url} alt={nombre} />}
        {url && esPdf(nombre) && <iframe src={url} title={nombre} />}
        {url && esVideo(nombre) && <video src={url} controls />}
        {(!url || (!esImagen(nombre) && !esPdf(nombre) && !esVideo(nombre))) && listo && (
          <div className="visor-vacio">
            <IconoTipo nombre={nombre} size={44} />
            <p>{url ? 'Este tipo de archivo no tiene vista previa. Descárgalo para abrirlo.' : 'Archivo de demostración: no tiene contenido guardado en este navegador.'}</p>
          </div>
        )}
      </div>
      {archivo?.id && <p className="muted small">v{archivo.version} · {tam(archivo.kb)} · subido por {nombreUsuario(db, archivo.autor)} · {fmtFecha(archivo.actualizado)}</p>}
    </Modal>
  );
}

// Aviso cuando no se puede subir en la sección
function AvisoSubida({ seccion, est }) {
  const { db } = useStore();
  if (est.ok) return null;
  if (est.motivo === 'sin-carpeta') {
    return (
      <p className="adj-aviso"><Link2 size={14} />
        {est.esAdmin
          ? <span>«{SECCIONES[seccion].corto}» aún no tiene una carpeta del repositorio asociada, por eso no se pueden subir archivos. <Link to="/archivos">Asóciala en el repositorio</Link> (botón «Asociar a sección»).</span>
          : <span>Aún no se pueden adjuntar archivos: el administrador debe asociar una carpeta del repositorio a «{SECCIONES[seccion].corto}».</span>}
      </p>
    );
  }
  return <p className="adj-aviso"><Lock size={14} /><span>No tienes permiso para subir en «{rutaTexto(db, est.carpeta)}». Pide acceso al administrador del repositorio.</span></p>;
}

// Archivos ya guardados (miniaturas que abren el visor)
export function ListaAdjuntos({ ids = [], legado, vacio = 'Sin archivos adjuntos.' }) {
  const { db, user } = useStore();
  const [ver, setVer] = useState(null);
  const archivos = ids.map((id) => db.archivos.find((a) => a.id === id) || { id, nombre: 'Archivo eliminado del repositorio', perdido: true });
  if (!archivos.length && !legado) return <p className="muted small">{vacio}</p>;
  return (
    <>
      <div className="adj-grid">
        {archivos.map((a) => (a.perdido
          ? <Tile key={a.id} nombre={a.nombre} bloqueado meta="Ya no existe" />
          : <Tile key={a.id} nombre={a.nombre} fuente={a.id} bloqueado={!puedeVer(db, user, a)} meta={tam(a.kb)} onOpen={() => setVer(a)} />))}
        {legado && <Tile nombre={legado} meta="Registro anterior (solo nombre)" bloqueado={false} onOpen={() => setVer({ id: null, nombre: legado, folderId: 'root', version: 1, kb: 0, autor: null, actualizado: '' })} />}
      </div>
      {ver && <VisorArchivo archivo={ver} onClose={() => setVer(null)} />}
    </>
  );
}

// Selector de archivos nuevos con vista previa, sujeto a la carpeta asociada
export function SelectorAdjuntos({ seccion, nuevos, setNuevos, etiqueta = 'Adjuntar fotos o documentos' }) {
  const { db, user, notify } = useStore();
  const est = estadoSubida(db, user, seccion);
  const input = useRef(null);
  const [ver, setVer] = useState(null);
  const agregar = (files) => {
    const ok = [...files].filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (ok.length < files.length) notify(`Se omitieron archivos de más de ${MAX_MB} MB`);
    setNuevos([...nuevos, ...ok]);
  };
  return (
    <div className="adj">
      <div className="adj-head">
        <span className="lbl-up"><Paperclip size={13} /> {etiqueta}</span>
        {est.ok && <span className="muted small">Se guardan en «{rutaTexto(db, est.carpeta)}»</span>}
      </div>
      <AvisoSubida seccion={seccion} est={est} />
      {est.ok && (
        <div className="adj-grid" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); agregar(e.dataTransfer.files); }}>
          {nuevos.map((f, i) => (
            <Tile key={f.name + i} nombre={f.name} fuente={f} meta={tam(Math.max(1, Math.round(f.size / 1024)))} onOpen={() => setVer(f)} onRemove={() => setNuevos(nuevos.filter((_, j) => j !== i))} />
          ))}
          <button type="button" className="adj-add" onClick={() => input.current?.click()}><Plus size={20} /><span>Agregar</span></button>
          <input ref={input} type="file" multiple hidden accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => { agregar(e.target.files); e.target.value = ''; }} />
        </div>
      )}
      {ver && <VisorArchivo file={ver} onClose={() => setVer(null)} />}
    </div>
  );
}

// Guarda los archivos nuevos en el repositorio y devuelve sus ids (para usar dentro de update)
export async function subirAdjuntos(nuevos, user) {
  return nuevos.length ? prepararAdjuntos(nuevos, user) : [];
}
export { registrarAdjuntos };

// Ventana de evidencias de un registro: ver lo subido y agregar más
export function EvidenciasModal({ seccion, coleccion, registro, titulo, onClose }) {
  const { db, user, update } = useStore();
  const [nuevos, setNuevos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const actual = db[coleccion].find((x) => x.id === registro.id) || registro;
  const est = estadoSubida(db, user, seccion);
  const guardar = async () => {
    setSubiendo(true);
    const items = await subirAdjuntos(nuevos, user);
    update((d) => {
      const r = d[coleccion].find((x) => x.id === registro.id);
      r.adjuntos = [...(r.adjuntos || []), ...registrarAdjuntos(d, seccion, registro.id, items)];
    }, `${items.length} archivo(s) adjuntado(s) a ${registro.id} y guardado(s) en el repositorio`);
    setNuevos([]);
    setSubiendo(false);
  };
  return (
    <Modal wide title={titulo || `Evidencias · ${registro.id}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cerrar</button>{est.ok && <button className="btn btn-primary" disabled={!nuevos.length || subiendo} onClick={guardar}><Upload size={15} /> {subiendo ? 'Subiendo…' : `Subir ${nuevos.length || ''}`}</button>}</>}>
      <span className="lbl-up">Archivos adjuntos</span>
      <ListaAdjuntos ids={actual.adjuntos} legado={actual.evidencia} />
      <hr className="sep" />
      <SelectorAdjuntos seccion={seccion} nuevos={nuevos} setNuevos={setNuevos} etiqueta="Agregar archivos" />
    </Modal>
  );
}

// Botón compacto para tablas: clip + cantidad
export function BotonAdjuntos({ registro, onClick }) {
  const n = (registro.adjuntos?.length || 0) + (registro.evidencia ? 1 : 0);
  return (
    <button type="button" className={`adj-btn ${n ? 'con' : ''}`} onClick={onClick} title={n ? `${n} archivo(s) adjunto(s)` : 'Adjuntar archivos'}>
      <Paperclip size={13} /> {n || '+'}
    </button>
  );
}
