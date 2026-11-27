import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { fLarga } from '../store.jsx';

// Certificado imprimible con código QR de verificación
export default function Certificado({ persona, x }) {
  const [qr, setQr] = useState(null);
  const cert = x.p.cert;
  const url = `${window.location.origin}/capacitaciones/verificar/${cert.codigo}`;
  useEffect(() => {
    let vivo = true;
    import('qrcode').then((m) => m.toDataURL(url, { margin: 1, width: 220, color: { dark: '#0E2A4D' } })).then((d) => vivo && setQr(d)).catch(() => {});
    return () => { vivo = false; };
  }, [url]);
  const imprimir = () => {
    document.body.classList.add('imprime-cert');
    window.print();
    setTimeout(() => document.body.classList.remove('imprime-cert'), 500);
  };
  return (
    <>
      <div className="cert">
        <div className="cert-band"><i /><i /><i /></div>
        <div className="cert-head">
          <img src="/logo-dimarza.png" alt="DMZ Corp." />
          <div><strong>DIMARZA S.A.C.</strong><span>Ingeniería y Servicios Mineros</span></div>
        </div>
        <span className="cert-lbl">Certificado de capacitación</span>
        <p className="cert-txt">Se certifica que</p>
        <h2 className="cert-name">{persona.nombre}</h2>
        <p className="cert-txt">DNI {persona.dni} · {persona.cargo}</p>
        <p className="cert-txt">aprobó el curso</p>
        <h3 className="cert-curso">{x.c.nombre}</h3>
        <p className="cert-txt">con nota <strong>{x.ultimo?.nota ?? '—'}/20</strong> · {x.c.modulos.length} módulos en video con evaluación</p>
        <div className="cert-foot">
          <div><span>Emitido</span><strong>{fLarga(cert.fecha)}</strong></div>
          <div><span>Vence</span><strong>{fLarga(cert.vence)}</strong></div>
          <div><span>Código</span><strong className="mono">{cert.codigo}</strong></div>
          {qr && <img src={qr} alt="Código QR de verificación" className="cert-qr" />}
        </div>
      </div>
      <button className="cp-btn amarillo no-print" onClick={imprimir} style={{ marginTop: 14 }}><Printer size={16} /> Descargar / imprimir</button>
      <p className="cp-muted center small no-print">Elige «Guardar como PDF» en el diálogo de impresión.</p>
    </>
  );
}
