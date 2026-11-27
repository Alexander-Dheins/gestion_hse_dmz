import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, CalendarDays, Award, BarChart3, GraduationCap, UsersRound, RotateCcw } from 'lucide-react';
import { CapProvider, useCap } from './store.jsx';
import { sesionActual, CAP_ROL } from '../acceso/db.jsx';
import Shell, { SinAcceso } from '../acceso/Shell.jsx';
import { MovilLayout, BaseCtx } from './movil/Base.jsx';
import { Inicio, Cursos, Detalle, Certificados, VerCertificado, Avisos, Perfil } from './movil/Paginas.jsx';
import { Video, Encuesta, Resultado } from './movil/Video.jsx';
import { GInicio, GPersonal, GCursos, GProgramacion, GCertificados, GReportes, useAlcance } from './gestion/Gestion.jsx';
import './cap.css';

export default function CapacitacionesApp() {
  const { persona, accesos } = sesionActual();
  if (!persona) return null;
  if (!accesos.cap) return <SinAcceso modulo="Capacitaciones" />;
  return (
    <CapProvider persona={persona} rol={accesos.cap}>
      {accesos.cap === 'participante' ? <RutasTrabajador /> : <RutasGestion accesos={accesos} />}
    </CapProvider>
  );
}

// Vista del trabajador (móvil primero). El supervisor también la usa en /mi para sus propios cursos.
function Full({ base }) {
  return <BaseCtx.Provider value={base}><Outlet /></BaseCtx.Provider>;
}

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
    <Route key="f" element={<Full base={base} />}>
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
    <Shell titulo="DIMARZA" subtitulo="Capacitación SSOMA" nav={nav} persona={persona} rol={`${CAP_ROL[rol]} · Capacitaciones`} toast={toast}
      extraTop={<>
        {accesos.admin && <a href="/admin" className="btn btn-ghost btn-sm"><UsersRound size={15} /> <span className="hide-sm">Usuarios y accesos</span></a>}
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
