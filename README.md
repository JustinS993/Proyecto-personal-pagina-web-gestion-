# Gestión de Citas  Psicología

Sistema completo de gestión de citas para consultorio de psicología con autenticación, dashboard, auditoría y exportación de datos.

##  Características

### Gestión de Datos
-  Gestión completa de pacientes (crear, editar, eliminar)
-  Gestión completa de citas con validación de solapamientos
-  Gestión de psicólogos con especialidades
-  Definición de horarios disponibles por psicólogo

### Funcionalidades Principales
-  **Dashboard interactivo** con estadísticas y gráficos (Chart.js)
-  **Vista "Mi agenda"** para que psicólogos vean sus propias citas
-  **Calendario interactivo** con vista mensual
-  **Registro de auditoría completo** de todas las operaciones
-  **Validación de disponibilidad** (solapamientos + horarios configurados)
-  **Exportación a CSV** (citas, pacientes, auditoría)
-  **Filtros avanzados** en auditoría (acción, actor, fechas, búsqueda)
-  **Sistema de autenticación** (Admin y Empleado)

##  Estructura del Proyecto

\\\
 index.html        Página principal (vistas, modales, formularios)
 css/styles.css    Estilos (colores, layouts, componentes)
 js/app.js         Lógica de la aplicación
 iniciar.bat       Script para ejecutar en Windows
 package.json      Configuración y dependencias
 README.md         Este archivo
\\\

##  Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- No requiere backend ni instalación de dependencias externas
- Funciona con LocalStorage para persistencia de datos

##  Instalación y Ejecución

### Opción 1: Windows (Recomendado)
Haz doble clic en **\iniciar.bat\** - Esto abrirá la aplicación en tu navegador automáticamente.

### Opción 2: Terminal
\\\ash
npm.cmd run dev
\\\

La aplicación se abrirá en \http://localhost:3000\

##  Usuarios de Prueba

| Rol | Usuario | Contraseña | Acceso |
|-----|---------|-----------|--------|
| **Admin** | \dmin\ | \dmin123\ | Todas las funciones |
| **Empleado** | \empleado\ | \empleado123\ | Crear/editar citas, ver su agenda |

##  Flujo de Uso

1. **Login**: Ingresa con admin o empleado
2. **Setup Inicial**: 
   - Crea al menos 1 paciente
   - Crea al menos 1 psicólogo
   - Define horarios del psicólogo ( Horarios)
3. **Crear Citas**: Asigna citas a pacientes con psicólogos disponibles
4. **Monitorear**: Dashboard muestra estadísticas en tiempo real
5. **Reportes**: Exporta datos a CSV cuando lo necesites

##  Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Diseño responsive (grid, flexbox)
- **JavaScript Vanilla** - Sin frameworks
- **Chart.js** - Gráficos interactivos
- **LocalStorage** - Persistencia de datos
- **Google Fonts** - Tipografía (DM Sans, Libre Baskerville)

##  Diseño

La interfaz utiliza:
- Paleta de colores serenos (sage, terracota, pizarra)
- Tipografía limpia y profesional
- Modales para formularios
- Cards responsive para listados
- Iconos Unicode para acciones rápidas

##  Almacenamiento de Datos

Todos los datos se guardan automáticamente en LocalStorage del navegador:
- \psicologia-pacientes\ - Pacientes
- \psicologia-citas\ - Citas
- \psicologia-usuarios\ - Usuarios (login)
- \psicologia-psicologos\ - Psicólogos
- \psicologia-audits\ - Registro de auditoría
- \psicologia-horarios\ - Horarios disponibles

Para limpiar datos, abre DevTools (F12)  Application  LocalStorage  Elimina las claves anteriores.

##  Dashboard

El dashboard muestra:
- **Citas hoy** - Cantidad de citas agendadas para hoy
- **Citas esta semana** - Total de citas de la semana
- **Total de pacientes** - Cantidad de pacientes registrados
- **Citas completadas** - Citas con estado 'completada'
- **Citas canceladas** - Citas con estado 'cancelada'
- **Gráfico 1**: Citas por psicólogo (barras)
- **Gráfico 2**: Estado de citas (doughnut)

##  Validaciones

-  No permite crear citas en horarios ocupados (solapamiento)
-  No permite crear citas fuera de horarios configurados del psicólogo
-  Valida que se seleccione un paciente y psicólogo
-  Registra todo en auditoría (crear, editar, eliminar, cancelar)
-  Previene eliminación accidental de psicólogos con citas

##  Auditoría

Todos los cambios quedan registrados con:
- Acción realizada (crear, editar, eliminar, cancelar)
- Usuario que lo realizó
- Rol del usuario
- Timestamp exacto
- Detalles del cambio (paciente, cita, hora, motivo)

Acceso: Panel Administración  Auditoría  Filtros avanzados

##  Mejoras Futuras

- [ ] Backend (Node.js/Express)
- [ ] Base de datos persistente (MongoDB, PostgreSQL)
- [ ] Envío de correos/SMS de confirmación
- [ ] Recordatorios automáticos de citas
- [ ] Reportes avanzados en PDF
- [ ] Multi-idioma
- [ ] Tema oscuro
- [ ] Historial de cambios por cita
- [ ] Disponibilidad vacaciones

##  Licencia

Proyecto personal - All rights reserved

##  Autor

**JustinS993** - 2026

---

**¿Problemas?** Los datos se almacenan localmente. Si hay errores, limpia LocalStorage y recarga la página.
