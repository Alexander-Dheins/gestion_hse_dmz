import { ShieldCheck } from 'lucide-react';
import LoginModulo from '../acceso/LoginModulo.jsx';

// Ingreso a SSOMA DMZ con correo y contraseña. El rol dentro de SSOMA
// (gerente, líder HSE, supervisor, médico…) lo define el administrador de accesos.
export default function Login() {
  return (
    <LoginModulo
      modulo="ssoma"
      tipo="correo"
      titulo="SSOMA DMZ"
      subtitulo="Sistema de gestión de Seguridad, Salud Ocupacional y Medio Ambiente para las unidades mineras."
      color="#ea7a12"
      Icono={ShieldCheck}
      puntos={['Paradas de planta, PETAR e IPERC', 'Inspecciones, incidentes y planes de acción', 'Reportes diarios en el formato de cada unidad']}
      demo={['09876512', '42310987', '43987015', '40221587', '40998123', '45872103']}
      permiso={(a) => a.ssoma}
      onOk={() => { window.location.href = '/ssoma'; }}
    />
  );
}
