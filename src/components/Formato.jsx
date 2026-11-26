import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Save, X } from 'lucide-react';
import { useStore, fmtFecha, hoy } from '../store.jsx';

// Hoja de formato oficial (A4) lista para imprimir o guardar como PDF.
// doc = { codigo, titulo, version, referencia, unidad, datos: [[etiqueta, valor]], body, firmas: [{ rol, nombre, fecha }], ref }
export function FormatoSheet({ doc }) {
  const { db } = useStore();
  const u = db.unidades.find((x) => x.id === doc.unidad);
  return (
    <div className="fx-sheet">
      <table className="fx-head">
        <tbody>
          <tr>
            <td rowSpan="3" className="fx-logo">
              <svg viewBox="0 0 32 32" width="34" height="34"><rect width="32" height="32" rx="7" fill="#0f1b2d" /><path d="M16 5l9 4v6c0 6-4 10-9 12-5-2-9-6-9-12V9z" fill="#ea7a12" /><path d="M12 16l3 3 5-6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <strong>DMZ</strong>
              <span>Gestión SSOMA</span>
            </td>
            <td rowSpan="3" className="fx-title">
              <span>SISTEMA DE GESTIÓN DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE</span>
              <strong>{doc.titulo}</strong>
            </td>
            <td className="fx-meta">Código: <b>{doc.codigo}</b></td>
          </tr>
          <tr><td className="fx-meta">Versión: <b>{doc.version || '03'}</b> · Aprobado: <b>15/01/2026</b></td></tr>
          <tr><td className="fx-meta">Página: <b>1 de 1</b></td></tr>
        </tbody>
      </table>

      <table className="fx-table fx-data">
        <tbody>
          <tr>
            <th>Unidad minera</th><td>{u ? u.nombre : '—'}</td>
            <th>Titular minero</th><td>{u ? u.titular : '—'}</td>
          </tr>
          {chunk(doc.datos || [], 2).map((par, i) => (
            <tr key={i}>
              {par.map(([k, v]) => [<th key={k + 'h'}>{k}</th>, <td key={k + 'd'}>{v}</td>])}
              {par.length === 1 && [<th key="e1" />, <td key="e2" />]}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="fx-body">{doc.body}</div>

      {doc.firmas?.length > 0 && (
        <div className="fx-firmas" style={{ gridTemplateColumns: `repeat(${Math.min(doc.firmas.length, 4)}, 1fr)` }}>
          {doc.firmas.map((f, i) => (
            <div key={i}>
              <div className="fx-firma-line">{f.firmado ? <em>Firmado digitalmente</em> : null}</div>
              <strong>{f.nombre || ' '}</strong>
              <span>{f.rol}</span>
              {f.fecha && <span>{fmtFecha(f.fecha)}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="fx-foot">
        <span>{doc.referencia || 'Referencia: D.S. 024-2016-EM y modificatorias'}</span>
        <span>Generado en SSOMA DMZ · {doc.ref || ''} · {fmtFecha(hoy())} · Documento de demostración con datos ficticios</span>
      </div>
    </div>
  );
}

export function FormatoModal({ doc, onClose }) {
  const { update, db, user } = useStore();
  useEffect(() => {
    document.body.classList.add('has-formato');
    return () => document.body.classList.remove('has-formato');
  }, []);
  const guardar = () => {
    const u = db.unidades.find((x) => x.id === doc.unidad);
    update((d) => {
      d.archivos.push({ id: 'A' + Date.now(), folderId: 'f08', nombre: `${doc.codigo} ${doc.titulo}${doc.ref ? ' ' + doc.ref : ''}${u ? ' – ' + u.nombre : ''}.pdf`, kb: 180 + Math.floor(Math.random() * 200), autor: user.id, actualizado: hoy(), version: 1 });
    }, 'Formato guardado en "08 Formatos registrados"');
  };
  return createPortal(
    <div className="fx-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fx-toolbar">
        <strong>{doc.codigo} · {doc.titulo}</strong>
        <div className="grow" />
        <button className="btn btn-sm" onClick={guardar}><Save size={15} /> Guardar en repositorio</button>
        <button className="btn btn-sm btn-primary" onClick={() => window.print()}><Printer size={15} /> Imprimir / Guardar PDF</button>
        <button className="icon-btn light" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
      </div>
      <div className="fx-scroll"><FormatoSheet doc={doc} /></div>
    </div>,
    document.body
  );
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
