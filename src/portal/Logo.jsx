import { useState } from 'react';

// Logo de la empresa. Para usar el logo oficial, copiar el archivo a
// public/logo-dimarza.png (fondo transparente). Si no existe, se muestra el logo provisional.
export default function Logo({ size = 96, claro = true }) {
  const [oficial, setOficial] = useState(true);
  if (oficial) {
    return (
      <img
        src="/logo-dimarza.png"
        alt="Dimarza"
        className="pt-logo-img"
        style={{ height: size }}
        onError={() => setOficial(false)}
      />
    );
  }
  return (
    <div className="pt-logo" style={{ '--s': `${size}px` }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#172a45" />
        <path d="M32 10l18 8v12c0 12-8 20-18 24-10-4-18-12-18-24V18z" fill="#ea7a12" />
        <path d="M24 32l6 6 11-12" stroke="#fff" strokeWidth="4.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={`pt-logo-txt ${claro ? '' : 'dark'}`}>
        <strong>DIMARZA</strong>
        <span>Ingeniería y Servicios Mineros</span>
      </div>
    </div>
  );
}
