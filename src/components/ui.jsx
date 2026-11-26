import { X } from 'lucide-react';

const TONOS = {
  vigente: 'ok', habilitado: 'ok', apto: 'ok', aprobado: 'ok', cerrado: 'ok', cerrada: 'muted', conforme: 'ok', ejecutada: 'ok', firmado: 'ok',
  'por vencer': 'warn', 'pendiente firmas': 'warn', 'en proceso': 'info', 'en curso': 'info', 'en investigación': 'warn', 'con hallazgos': 'warn', programada: 'info', 'apto con restricciones': 'warn', planificada: 'muted', borrador: 'muted',
  vencido: 'bad', bloqueado: 'bad', abierto: 'bad', 'no apto': 'bad', anulado: 'muted', 'accidente incapacitante': 'bad', 'accidente leve': 'warn', 'incidente peligroso': 'warn', incidente: 'info',
  admin: 'bad', editar: 'warn', subir: 'info', ver: 'ok', ninguno: 'muted',
};

export function Badge({ children, tone }) {
  const t = tone || TONOS[String(children).toLowerCase()] || 'muted';
  return <span className={`badge badge-${t}`}>{children}</span>;
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = '' }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-label={title}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Progress({ value }) {
  return (
    <div className="progress" title={`${value}%`}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

export function Locked({ children = 'Tu rol no tiene acceso a este módulo.' }) {
  return <div className="locked">{children}</div>;
}
