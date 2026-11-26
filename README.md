# SSOMA DMZ · Sistema de Gestión HSE (demo)

Demo funcional del sistema de gestión de Seguridad, Salud Ocupacional y Medio Ambiente para trabajos de mantenimiento en plantas mineras (molinos de bolas y equipos similares) en varias unidades mineras.

> **Todos los datos son ficticios.** Ninguna persona, unidad minera ni empresa es real. Los cambios se guardan solo en el navegador (localStorage); el botón **Restablecer demo** vuelve a los datos iniciales.

## Qué incluye

| Módulo | Qué se puede probar |
| --- | --- |
| Tablero | Indicadores (IF, IS, IA), personal bloqueado, paradas en curso, firmas pendientes, planes vencidos. Panel propio para el trabajador. |
| Unidades mineras | 7 unidades con sus formatos y estándares. El gerente puede agregar una unidad y se crean sus carpetas. |
| Paradas de planta | Cuadrilla con acreditación, tareas críticas, checklist de inicio. No deja iniciar con personal bloqueado. |
| Permisos de alto riesgo | PETAR (espacio confinado, caliente, izaje, altura) y LOTO con firmas en orden por rol. |
| IPERC | Matriz con nivel de riesgo inicial y residual. |
| Inspecciones | Checklist; cada "No cumple" crea un plan de acción. |
| Incidentes | Reporte, investigación, causa raíz y acción correctiva. |
| Planes de acción | Responsable, fecha, evidencia y cierre. |
| Personal y acreditación | EMO, SCTR e inducción; bloqueo automático. El detalle médico solo lo ve el médico. |
| Capacitaciones y EPP | Vista previa (fase 2). |
| Repositorio de archivos | Directorio tipo servidor compartido: carpetas y subcarpetas, subir (arrastrar y soltar), versiones, búsqueda y permisos por rol, unidad o persona con vista previa de quién ve qué. |
| Reportes a la unidad | Reporte diario HSE en el formato de cada unidad; imprimir/PDF y guardar en el repositorio. |
| Roles y permisos | Matriz rol × módulo. |

### Usuarios de prueba

En la pantalla de inicio se elige el perfil (no hay contraseña en la demo): gerente de seguridad, líderes HSE de unidad, supervisor HSE, asistente, analista, supervisor de mantenimiento, médico ocupacional y trabajador. Cada uno ve solo su unidad y lo que su rol permite.

## Ejecutar en local

```bash
npm install
npm run dev
```

## Publicar en Vercel

1. En Vercel: **Add New → Project** e importar este repositorio.
2. Vercel detecta **Vite** solo (build `npm run build`, salida `dist`).
3. **Deploy**. El archivo `vercel.json` ya redirige las rutas internas a `index.html`.

## Stack

React 18 + Vite + React Router. Sin backend: la versión real usará una API con PostgreSQL, almacenamiento de objetos para archivos y app móvil offline.
