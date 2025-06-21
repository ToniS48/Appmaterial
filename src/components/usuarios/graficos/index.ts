/**
 * Barrel export para el módulo de gráficos dinámicos de usuarios
 */

export { default as GraficosDinamicosUsuarios } from './GraficosDinamicosUsuarios';
export { default as ConfiguradorGraficos } from './ConfiguradorGraficos';
export { default as VisualizadorGraficos } from './VisualizadorGraficos';
export { analisisUsuariosService } from './analisisService';

export type {
  ConfiguracionGrafico,
  DatosGrafico,
  ResultadoAnalisis,
  TipoGrafico,
  MetricaUsuario,
  PeriodoTiempo,
  FiltroUsuario
} from './tipos';

export {
  CONFIGURACIONES_PREDEFINIDAS,
  COLORES_TEMA,
  PALETAS_COLORES
} from './tipos';
