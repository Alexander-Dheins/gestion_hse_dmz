import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, CalendarDays, Award, BarChart3, GraduationCap, RotateCcw } from 'lucide-react';
import { CapProvider, useCap } from './store.jsx';
import { sesionModulo, CAP_ROL } from '../acceso/db.jsx';
import Shell from '../acceso/Shell.jsx';
import LoginModulo from '../acceso/LoginModulo.jsx';
import { MovilLayout } from './movil/Base.jsx';
import { Inicio, Cursos, Detalle, Certificados, VerCertificado, Avisos, Perfil } from './movil/Paginas.jsx';
import { Video, Encuesta, Resultado } from './movil/Video.jsx';
import { GInicio, GPersonal, GCursos, GProgramacion, GCertificados, GReportes, useAlcance } from './gestion/Gestion.jsx';
import './cap.css';

export default function CapacitacionesApp() {
  const { persona, accesos } = sesionModulo('cap');
  if (!persona || !accesos.cap) {
    return (
      <LoginModulo modulo="cap" tipo="dni" titulo="Capacitaciones" color="#2370B8" Icono={GraduationCap}
        subtitulo="Tus cursos obligatorios de seguridad, en video y desde cualquier dispositivo."
        puntos={['Videos con evaluación por módulo', 'Encuesta y nota final del curso', 'Certificados con código QR']}
        demo={['45872103', '46120934', '40221587', '41556790']} permiso={(a) => !!a.cap} onOk={() => { window.location.href = '/capacitaciones'; }} />
    );
  }
  return (
    <CapProvider persona={persona} rol={accesos.cap}>
      {accesos.cap === 'participante' ? <RutasTrabajador /> : <RutasGestion accesos={accesos} />}
    </CapProvider>
  );
}

// Vista del trabajador (móvil primero). El supervisor también la usa en /mi para sus propios cursos.
function rutasTrabajador(base) {
  return [
    <Route key="l" element={<MovilLayout base={base} />}>
      <Route index element={<Inicio />} />
      <Route path="cursos" element={<Cursos />} />
      <Route path="curso/:id" element={<Detalle />} />
      <Route path="certificados" element={<Certificados />} />
      <Route path="certificado/:id" element={<VerCertificado />} />
      <Route path="avisos" element={<Avisos />} />
      <Route path="perfil" element={<Perfil />} />
    </Route>,
    <Route key="f" element={<MovilLayout base={base} full />}>
      <Route path="curso/:id/video/:mid" element={<Video />} />
      <Route path="curso/:id/encuesta" element={<Encuesta />} />
      <Route path="curso/:id/resultado" element={<Resultado />} />
    </Route>,
  ];
}

function RutasTrabajador() {
  return (
    <Routes>
      {rutasTrabajador('')}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RutasGestion({ accesos }) {
  const { persona, rol, toast, reset } = useCap();
  const { gente } = useAlcance();
  const admin = rol === 'admin';
  const nav = [
    { grupo: admin ? 'General' : persona.area, items: [
      { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
      { to: '/personal', label: admin ? 'Personal' : 'Mi personal', icon: Users, count: gente.length },
      { to: '/cursos', label: admin ? 'Cursos' : 'Cursos del área', icon: BookOpen },
      { to: '/programacion', label: 'Programación', icon: CalendarDays },
    ] },
    { grupo: 'Control', items: [
      { to: '/certificados', label: 'Certificados', icon: Award },
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
      ...(!admin ? [{ to: '/mi', label: 'Mis cursos', icon: GraduationCap }] : []),
    ] },
  ];
  const shell = (
    <Shell modulo="cap" titulo="DIMARZA" subtitulo="Capacitación SSOMA" nav={nav} persona={persona} rol={`${CAP_ROL[rol]} · Capacitaciones`} toast={toast}
      extraTop={<>
        <button className="btn btn-ghost btn-sm" onClick={reset} title="Volver a los datos iniciales"><RotateCcw size={15} /> <span className="hide-sm">Restablecer demo</span></button>
      </>} />
  );
  return (
    <Routes>
      <Route element={shell}>
        <Route index element={<GInicio />} />
        <Route path="personal" element={<GPersonal />} />
        <Route path="cursos" element={<GCursos />} />
        <Route path="programacion" element={<GProgramacion />} />
        <Route path="certificados" element={<GCertificados />} />
        <Route path="reportes" element={<GReportes />} />
      </Route>
      {!admin && <Route path="mi">{rutasTrabajador('/mi')}</Route>}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
