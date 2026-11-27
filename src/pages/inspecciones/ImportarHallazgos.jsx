import { useMemo, useState } from 'react';
import { FileSpreadsheet, AlertTriangle, Info, Upload } from 'lucide-react';
import { useStore, nombreUnidad } from '../../store.jsx';
import { Modal, Badge } from '../../components/ui.jsx';
import { ANIO } from '../../data/seed3.js';
import { encontrarHoja, interpretarFilas } from '../../lib/importHallazgos.js';

// Importa el archivo «Análisis de inspecciones internas» tal como lo usa el área HSE
export default function ImportarHallazgos({ onClose }) {
  const { db, update, scopeUnits } = useStore();
  const [hoja, setHoja] = useState(null);
  const [archivo, setArchivo] = useState('');
  const [error, setError] = useState('');
  const [mapa, setMapa] = useState({});
  const [omitir, setOmitir] = useState(true);
  const [reemplazar, setReemplazar] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const sedes = scopeUnits.map((id) => ({ id, nombre: nombreUnidad(db, id) }));

  const leer = async (file) => {
    if (!file) return;
    setError(''); setLeyendo(true);
    try {
      const { default: readExcelFile } = await import('read-excel-file/browser');
      const hojas = await readExcelFile(file);
      const h = encontrarHoja(hojas);
      if (!h) setError('No encontré una hoja con las columnas «DESCRIPCIÓN DEL HALLAZGO» y «NIVEL DE RIESGO».');
      else { setHoja(h); setArchivo(file.name); }
    } catch {
      setError('No se pudo leer el archivo. Debe ser un Excel (.xlsx).');
    }
    setLeyendo(false);
  };

  const res = useMemo(() => (hoja ? interpretarFilas(hoja, { sedes, mapa, anioRef: ANIO }) : null), [hoja, mapa]); // eslint-disable-line
  const validas = res ? res.filas.filter((f) => !f.errores.length || (!omitir && f.h.sede && f.h.fecha && f.h.riesgo)) : [];

  const importar = () => {
    let n = reemplazar ? 0 : db.hallazgos.filter((h) => h.id.startsWith(`HZ-${ANIO}`)).length;
    const existentes = new Set((reemplazar ? [] : db.hallazgos).map((h) => `${h.fecha}|${h.sede}|${h.descripcion}`));
    const nuevos = [];
    validas.forEach((f) => {
      const k = `${f.h.fecha}|${f.h.sede}|${f.h.descripcion}`;
      if (existentes.has(k)) return;
      existentes.add(k);
      n++;
      nuevos.push({ ...f.h, id: `HZ-${ANIO}-${String(n).padStart(3, '0')}` });
    });
    update((d) => { d.hallazgos = reemplazar ? nuevos : [...d.hallazgos, ...nuevos]; }, `${nuevos.length} hallazgos importados desde ${archivo}`);
    onClose();
  };

  return (
    <Modal wide title="Importar análisis de inspecciones internas" onClose={onClose}
      footer={res ? <>
        <span className="muted small grow">{validas.length} de {res.filas.length} filas se importarán. Se omiten los duplicados.</span>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!validas.length} onClick={importar}><Upload size={15} /> Importar {validas.length}</button>
      </> : <button className="btn" onClick={onClose}>Cancelar</button>}>
      {!res && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>Sube el Excel de análisis de inspecciones tal como lo llevan hoy. El sistema busca la hoja con los hallazgos, lee las columnas por su nombre y revisa fechas, ubicaciones y niveles de riesgo antes de importar.</p>
          <label className="drop">
            <FileSpreadsheet size={34} color="#2370b8" />
            <strong>{leyendo ? 'Leyendo el archivo…' : 'Elige el archivo .xlsx'}</strong>
            <span className="muted small">Columnas: fecha, ubicación, ubicación detallada, descripción, nivel de riesgo, conclusiones (plan de acción), responsable, fecha de plazo, % de avance, status, clasificación, tipo y tipo de inspección</span>
            <input type="file" accept=".xlsx" hidden onChange={(e) => leer(e.target.files[0])} />
          </label>
          {error && <p className="cell-err" style={{ marginTop: 10 }}>{error}</p>}
          <p className="note" style={{ marginTop: 12 }}><Info size={15} /> En esta demo los datos importados quedan solo en tu navegador; no se publican.</p>
        </>
      )}
      {res && (
        <>
          <div className="imp-sum">
            <div><strong>{archivo}</strong><span className="muted small">Hoja «{hoja.hoja}» · cabecera en la fila {hoja.filaCabecera + 1}</span></div>
            <Badge tone="info">{res.filas.length} filas</Badge>
            <Badge tone={res.filas.filter((f) => f.errores.length).length ? 'bad' : 'ok'}>{res.filas.filter((f) => f.errores.length).length} con error</Badge>
            <Badge tone="warn">{res.filas.filter((f) => f.avisos.length).length} con advertencias</Badge>
          </div>
          {res.faltan.length > 0 && <p className="cell-err">Faltan columnas: {res.faltan.join(', ')}</p>}
          {res.noReconocidas.length > 0 && (
            <div className="imp-map">
              <strong>Asigna una sede a las ubicaciones que no reconocí</strong>
              {res.noReconocidas.map((u) => (
                <label key={u}><span>{u}</span>
                  <select value={mapa[u] || ''} onChange={(e) => setMapa({ ...mapa, [u]: e.target.value })}>
                    <option value="">Elegir sede…</option>
                    {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
          <div className="imp-opts">
            <label><input type="checkbox" checked={omitir} onChange={(e) => setOmitir(e.target.checked)} /> Omitir las filas con error (recomendado)</label>
            <label><input type="checkbox" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} /> Reemplazar los hallazgos actuales por los del archivo</label>
          </div>
          <div className="table-wrap imp-table">
            <table className="table compact">
              <thead><tr><th>Fila</th><th>Fecha</th><th>Sede</th><th>Hallazgo</th><th>Riesgo</th><th>Avance</th><th>Revisión</th></tr></thead>
              <tbody>
                {[...res.filas.filter((f) => f.errores.length), ...res.filas.filter((f) => !f.errores.length && f.avisos.length), ...res.filas.filter((f) => !f.errores.length && !f.avisos.length)].slice(0, 120).map((f) => (
                  <tr key={f.fila} className={f.errores.length ? 'row-err' : ''}>
                    <td className="muted">{f.fila}</td>
                    <td className="nowrap">{f.h.fecha || '—'}</td>
                    <td>{f.h.sede ? nombreUnidad(db, f.h.sede) : '—'}</td>
                    <td>{f.h.descripcion.slice(0, 90)}{f.h.descripcion.length > 90 ? '…' : ''}<div className="muted small">{f.h.clasificacion} · {f.h.subtipo}</div></td>
                    <td>{f.h.riesgo || '—'}</td>
                    <td>{f.h.avance}%</td>
                    <td>
                      {f.errores.map((e) => <div key={e} className="cell-err"><AlertTriangle size={12} /> {e}</div>)}
                      {f.avisos.map((e) => <div key={e} className="cell-warn">{e}</div>)}
                      {!f.errores.length && !f.avisos.length && <span className="muted small">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
