/**
 * Tipos y interfaces para el Dashboard de Usuario
 */
import { 
  EstadisticasAnualesUsuarios, 
  EventoUsuario, 
  UsuarioProblematico
} from '../../../types/usuarioHistorial';

export interface DashboardState {
  añoSeleccionado: number;
  estadisticas: EstadisticasAnualesUsuarios | null;
  eventosRecientes: EventoUsuario[];
  usuarios: any[];
  usuariosProblematicos: UsuarioProblematico[];
  comparacionAños: any | null;
  cargando: boolean;
  cargandoMigracion: boolean;
  error: string | null;
  reporteTexto: string;
}

export interface DashboardProps {
  añoInicial?: number;
}

export interface TabComponentProps {
  state: DashboardState;
  actions: DashboardActions;
  esAdmin: boolean;
}

export interface DashboardActions {
  cargarDatos: (silencioso?: boolean) => Promise<void>;
  generarReporte: () => Promise<void>;
  generarDatosIniciales: () => Promise<void>;
  debugConexion: () => Promise<void>;
  limpiarLogs: () => void;
  setAñoSeleccionado: (año: number) => void;
}

export enum TipoReporte {
  COMPLETO = 'completo',
  USUARIOS_ACTIVOS = 'usuarios-activos',
  USUARIOS_PROBLEMÁTICOS = 'usuarios-problematicos',
  ESTADISTICAS_MENSUALES = 'estadisticas-mensuales',
  COMPARATIVO_ANUAL = 'comparativo-anual'
}
