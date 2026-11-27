// Logo de la empresa (public/logo-dimarza.png, fondo transparente) con el nombre al lado.
export default function Logo({ size = 96, conTexto = true }) {
  return (
    <div className="pt-logo" style={{ '--s': `${size}px` }}>
      <img src="/logo-dimarza.png" alt="DMZ Corp." className="pt-logo-img" style={{ height: size }} />
      {conTexto && (
        <div className="pt-logo-txt">
          <strong>DIMARZA</strong>
          <span>Ingeniería y Servicios Mineros</span>
        </div>
      )}
    </div>
  );
}
