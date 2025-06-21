/**
 * Tipos para gráficos dinámicos de usuarios
 */
import { Usuario } from '../../../types/usuario';

export type TipoGrafico = 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'histogram';

export type MetricaUsuario = 
  | 'registrosPorMes'
  | 'registrosPorAño' 
  | 'estadosAprobacion'
  | 'estadosActividad'
  | 'distribucionRoles'
  | 'actividadTemporal'
  | 'ultimaConexion'
  | 'tendenciaAprobaciones'
  | 'analisisActividad'
  | 'comparacionAnual'
  | 'retencionUsuarios'
  | 'crecimientoMensual';

export type PeriodoTiempo = 'mes' | 'trimestre' | 'año' | 'semana' | 'dia';

export type FiltroUsuario = {
  roles?: string[];
  estadosAprobacion?: string[];
  estadosActividad?: string[];
  fechaDesde?: Date;
  fechaHasta?: Date;
  ultimaConexionDesde?: Date;
  soloActivos?: boolean;
  incluyeEliminados?: boolean;
};

export interface ConfiguracionGrafico {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoGrafico;
  metrica: MetricaUsuario;
  periodo?: PeriodoTiempo;
  filtros?: FiltroUsuario;
  opciones?: {
    mostrarLeyenda?: boolean;
    animaciones?: boolean;
    responsive?: boolean;
    aspectRatio?: number;
    colores?: string[];
    ejesPersonalizados?: boolean;
    mostrarValores?: boolean;
    agrupamiento?: 'stack' | 'group' | 'none';
  };
}

export interface DatosGrafico {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    pointBackgroundColor?: string | string[];
    pointBorderColor?: string | string[];
  }[];
}

export interface ResultadoAnalisis {
  configuracion: ConfiguracionGrafico;
  datos: DatosGrafico;
  estadisticas: {
    total: number;
    promedio?: number;
    maximo?: number;
    minimo?: number;
    tendencia?: 'creciente' | 'decreciente' | 'estable';
    porcentajeCambio?: number;
  };
  insights: string[];
}

// Configuraciones predefinidas de gráficos
export const CONFIGURACIONES_PREDEFINIDAS: ConfiguracionGrafico[] = [
  {
    id: 'registros-mes',
    titulo: 'Registros por Mes',
    descripcion: 'Número de usuarios registrados cada mes',
    tipo: 'bar',
    metrica: 'registrosPorMes',
    periodo: 'mes',
    opciones: {
      mostrarLeyenda: true,
      animaciones: true,
      responsive: true,
      colores: ['#3182CE', '#63B3ED', '#90CDF4']
    }
  },
  {
    id: 'estados-aprobacion',
    titulo: 'Estados de Aprobación',
    descripcion: 'Distribución de usuarios por estado de aprobación',
    tipo: 'pie',
    metrica: 'estadosAprobacion',
    opciones: {
      mostrarLeyenda: true,
      colores: ['#48BB78', '#F56565', '#ED8936']
    }
  },
  {
    id: 'distribucion-roles',
    titulo: 'Distribución por Roles',
    descripcion: 'Cantidad de usuarios por rol en el sistema',
    tipo: 'doughnut',
    metrica: 'distribucionRoles',
    opciones: {
      mostrarLeyenda: true,
      colores: ['#805AD5', '#3182CE', '#38B2AC', '#68D391']
    }
  },
  {
    id: 'actividad-temporal',
    titulo: 'Actividad en el Tiempo',
    descripcion: 'Evolución de la actividad de usuarios a lo largo del tiempo',
    tipo: 'line',
    metrica: 'actividadTemporal',
    periodo: 'mes',
    opciones: {
      mostrarLeyenda: true,
      animaciones: true,
      colores: ['#48BB78', '#3182CE']
    }
  },  {
    id: 'ultima-conexion',
    titulo: 'Análisis de Última Conexión',
    descripcion: 'Distribución de usuarios según su última conexión',
    tipo: 'histogram',
    metrica: 'ultimaConexion',
    opciones: {
      mostrarLeyenda: false,
      colores: ['#ED8936']
    }
  },
  {
    id: 'tendencia-aprobaciones',
    titulo: 'Tendencia de Aprobaciones',
    descripcion: 'Evolución de las aprobaciones de usuarios por período',
    tipo: 'area',
    metrica: 'tendenciaAprobaciones',
    periodo: 'mes',
    opciones: {
      mostrarLeyenda: true,
      colores: ['#48BB78', '#F56565']
    }
  }
];

export const COLORES_TEMA = {
  primary: '#3182CE',
  secondary: '#63B3ED',
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  info: '#38B2AC',
  purple: '#805AD5',
  teal: '#319795',
  pink: '#D53F8C',
  gray: '#718096'
};

export const PALETAS_COLORES = {
  azules: ['#E6FFFA', '#B2F5EA', '#81E6D9', '#4FD1C7', '#38B2AC', '#319795', '#2C7A7B'],
  verdes: ['#F0FFF4', '#C6F6D5', '#9AE6B4', '#68D391', '#48BB78', '#38A169', '#2F855A'],
  rojos: ['#FED7D7', '#FEB2B2', '#FC8181', '#F56565', '#E53E3E', '#C53030', '#9B2C2C'],
  morados: ['#FAF5FF', '#E9D8FD', '#D6BCFA', '#B794F6', '#9F7AEA', '#805AD5', '#6B46C1'],
  naranjas: ['#FFFAF0', '#FEEBC8', '#FBD38D', '#F6AD55', '#ED8936', '#DD6B20', '#C05621'],
  multicolor: ['#3182CE', '#48BB78', '#F56565', '#ED8936', '#805AD5', '#38B2AC', '#D53F8C']
};
