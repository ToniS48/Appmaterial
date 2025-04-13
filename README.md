## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

# ESPEMO - Aplicación de Gestión

## Despliegue

La aplicación está configurada para desplegarse automáticamente en Firebase Hosting mediante GitHub Actions.

### Proceso de CI/CD

1. Cuando se hace push a la rama `main`, se dispara el workflow de GitHub Actions
2. Se ejecutan los tests automáticos
3. Se construye la aplicación (build)
4. Si todo es correcto, se despliega automáticamente a Firebase Hosting

Despliegue automático con GitHub Actions
El proyecto incluye un workflow de GitHub Actions que se ejecuta automáticamente al hacer push a la rama principal:

Configura los secretos necesarios en tu repositorio de GitHub:

FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT (JSON completo de la cuenta de servicio)
Cada push a la rama principal activará el workflow que:

Instala las dependencias
Ejecuta los tests
Construye la aplicación
Despliega a Firebase Hosting
Consideraciones de rendimiento y seguridad
La aplicación utiliza memorización de componentes para optimizar el rendimiento
Implementa lazy loading para componentes grandes
Utiliza reglas de seguridad en Firestore para control de acceso basado en roles
Sanitiza entradas de usuario para prevenir inyecciones
Gestiona copias de seguridad periódicas
Mantenimiento
Datos: Se recomienda exportar datos de actividades/préstamos anualmente
Archivado: Actividades de más de 2 años se pueden archivar
Logs: Se mantienen por 6 meses
Licencia
Este proyecto es privado y para uso exclusivo del club ESPEMO.

Contribuciones
Para contribuir al proyecto:

Crea una rama desde develop con el formato: feature/nombre-funcionalidad
Desarrolla tu contribución siguiendo el estilo de código establecido
Crea un Pull Request a develop con una descripción clara de los cambios
Espera revisión de código y aprobación
© 2025 ESPEMO - Todos los derechos reservados

### Despliegue manual

Si necesitas desplegar manualmente:

git add .
git commit -m "Prueba de despliegue automatizado"
git push origin main


ESPEMO - Sistema de Gestión de Material Deportivo
<img alt="Estado del despliegue" src="https://img.shields.io/badge/estado-desplegado-success">
Descripción general
ESPEMO es una aplicación web para la gestión integral del material deportivo y actividades del club de espeleología ESPEMO. La aplicación permite gestionar material deportivo especializado (cuerdas, anclajes y varios), planificar actividades, gestionar préstamos, y mantener un control del estado y mantenimiento del equipamiento.

Tecnologías utilizadas
Frontend: React 18, TypeScript, Chakra UI
Backend: Firebase (Firestore, Authentication, Functions, Storage, Hosting)
Herramientas adicionales:
React Hook Form para formularios
date-fns para manipulación de fechas
QRCode para generación de códigos QR
GitHub Actions para CI/CD
Estructura del proyecto
El proyecto sigue una arquitectura basada en componentes con React y TypeScript:

components: Componentes reutilizables organizados por funcionalidad
contexts: Contextos de React para el estado global (autenticación, notificaciones, etc.)
services: Servicios para comunicación con Firebase
types: Interfaces y tipos TypeScript
pages: Páginas principales de la aplicación
constants: Constantes y mensajes de la aplicación
styles: Estilos globales y tema de Chakra UI
utils: Utilidades y funciones auxiliares
functions: Funciones de Firebase (backend serverless)
Características principales
Gestión de material deportivo
Inventario detallado de material con categorías (cuerdas, anclajes, varios)
Seguimiento del ciclo de vida del material (adquisición, revisiones, baja)
Generación de códigos QR para identificación rápida
Control de estado (disponible, prestado, mantenimiento, baja, perdido)
Alertas automáticas para revisiones programadas
Sistema de préstamos
Gestión de préstamos de material a socios
Vinculación de préstamos a actividades
Registro de devoluciones con control de incidencias
Seguimiento del estado del material prestado
Notificaciones para recordatorios de devolución
Planificación de actividades
Calendario de actividades del club
Asignación de responsables y participantes
Gestión de material necesario para cada actividad
Estados de actividad (planificada, en curso, finalizada, cancelada)
Integración con Google Calendar
Comentarios y comunicación entre participantes
Sistema de notificaciones
Notificaciones en tiempo real para usuarios
Alertas de sistema (material pendiente de revisión, préstamos vencidos)
Recordatorios para devoluciones y actividades próximas
Panel de administración
Gestión de usuarios y roles
Configuración global del sistema
Estadísticas y reportes
Gestión de copias de seguridad
Roles de usuario
El sistema contempla tres roles principales con diferentes permisos:

1. Administrador
Gestión total del sistema
Configuración de la aplicación
Gestión de roles y permisos
Acceso a logs y estadísticas
2. Vocal
Supervisión del material deportivo
Validación de devoluciones
Gestión de incidencias
Creación y gestión de actividades
Control limitado de usuarios
3. Socio
Creación de actividades
Solicitud y devolución de material
Participación en actividades
Reporte de incidencias
Modelo de datos
El sistema utiliza Firebase Firestore con las siguientes colecciones principales:

usuarios: Información de usuarios, roles y permisos
actividades: Eventos planificados con participantes y material asignado
material_deportivo: Inventario de material (cuerdas, anclajes, varios)
prestamos: Registro de material prestado y devoluciones
incidencias: Registro de problemas con el material
notificaciones: Sistema de alertas y comunicaciones
Configuración y despliegue
Requisitos previos
Node.js 22 o superior
Cuenta de Firebase (plan Spark o superior)