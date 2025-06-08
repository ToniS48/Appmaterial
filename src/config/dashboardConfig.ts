import { FaUsers, FaCog, FaChartBar, FaBox, FaCommentDots } from 'react-icons/fa';
import { MdInventory2 } from 'react-icons/md';
import { FiCalendar, FiPackage, FiBell, FiEye } from 'react-icons/fi';
import { DashboardCard } from '../components/dashboard/GenericDashboard';

// Configuración de cards para el dashboard de Admin
export const adminDashboardCards: DashboardCard[] = [
  {
    title: "Gestión Préstamos",
    icon: MdInventory2,
    route: "/admin/prestamos",
    description: "Administración de préstamos de material",
    colorScheme: "teal",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "préstamos activos"
  },  {
    title: "Gestión Material",
    icon: FaBox,
    route: "/material",
    description: "Gestión del inventario de material",
    colorScheme: "orange",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "material disponible"
  },{
    title: "Gestión Notificaciones",
    icon: FaCommentDots,
    route: "/admin/reportes",
    description: "Gestión de reportes de errores y sugerencias",
    colorScheme: "yellow",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "notificaciones pendientes"
  },
  {
    title: "Reportes",
    icon: FaChartBar,
    route: "/admin/estadisticas",
    description: "Estadísticas y reportes de uso del sistema",
    colorScheme: "blue",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "reportes generados"
  },
  {
    title: "Gestión Usuarios",
    icon: FaUsers,
    route: "/admin/usuarios",
    description: "Gestión completa de usuarios",
    colorScheme: "linkedin",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "usuarios en sistema"
  },{
    title: "Configuración",
    icon: FaCog,
    route: "/admin/settings",
    description: "Configuración general del sistema",
    colorScheme: "gray",
    showOnlyForAdmin: true
    // No tiene statValue ni statLabel - no mostrará estadísticas
  }
];

// Configuración de cards para el dashboard de Vocal
export const vocalDashboardCards: DashboardCard[] = [
  {
    title: "Gestión Préstamos",
    icon: MdInventory2,
    route: "/vocal/prestamos",
    description: "Administración de préstamos de material",
    colorScheme: "teal",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "préstamos activos"
  },  {
    title: "Gestión Material",
    icon: FaBox,
    route: "/material",
    description: "Supervisión del inventario de material",
    colorScheme: "orange",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "material disponible"
  },{
    title: "Gestión Notificaciones",
    icon: FaCommentDots,
    route: "/vocal/reportes",
    description: "Revisión de reportes de errores y sugerencias",
    colorScheme: "yellow",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "notificaciones pendientes"
  },
  {
    title: "Reportes",
    icon: FaChartBar,
    route: "/vocal/estadisticas",
    description: "Estadísticas y reportes de actividades",
    colorScheme: "blue",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "reportes generados"
  },
  {
    title: "Gestión Usuarios",
    icon: FaUsers,
    route: "/vocal/usuarios",
    description: "Supervisión de usuarios activos",
    colorScheme: "linkedin",
    statValue: 0, // Se calculará dinámicamente
    statLabel: "usuarios en sistema"
  }
];

// Configuración de cards para funcionalidades de socio (para agregar a admin/vocal)
export const socioAccessCards: DashboardCard[] = [
  {
    title: "Actividades",
    icon: FiCalendar,
    route: "/activities",
    description: "Gestiona todas las actividades del club",
    colorScheme: "purple"
  },
  {
    title: "Mis Actividades",
    icon: FiCalendar,
    route: "/mis-actividades",
    description: "Administra tus actividades como responsable o participante",
    colorScheme: "blue"
  },
  {
    title: "Calendario",
    icon: FiCalendar,
    route: "/activities/calendario",
    description: "Vista mensual de todas las actividades programadas",
    colorScheme: "cyan"
  },
  {
    title: "Inventario",
    icon: FiEye,
    route: "/material/inventario",
    description: "Consulta el inventario de material disponible",
    colorScheme: "teal"
  },
  {
    title: "Mis Préstamos",
    icon: FiPackage,
    route: "/mis-prestamos",
    description: "Controla tus préstamos de material activos",
    colorScheme: "green"  },
  {
    title: "Mensajería",
    icon: FaCommentDots,
    route: "/mensajeria",
    description: "Sistema de mensajería interna del club",
    colorScheme: "messenger"
  },
  {
    title: "Notificaciones",
    icon: FiBell,
    route: "/notificaciones",
    description: "Centro de notificaciones y alertas",
    colorScheme: "red"
  }
];
