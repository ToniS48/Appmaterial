/**
 * Tipos para el sistema de seguimiento de material por años
 */
import { Timestamp } from 'firebase/firestore';

export enum TipoEventoMaterial {
  ADQUISICION = 'adquisicion',
  PRIMERA_REVISION = 'primera_revision',
  REVISION = 'revision', // Agregar para compatibilidad
  REVISION_PERIODICA = 'revision_periodica',
  MANTENIMIENTO = 'mantenimiento', // Agregar para compatibilidad
  INCIDENCIA = 'incidencia', // Agregar para compatibilidad
  INCIDENCIA_MENOR = 'incidencia_menor',
  INCIDENCIA_MAYOR = 'incidencia_mayor',
  REPARACION = 'reparacion',
  REPARADO = 'reparado', // Alias para compatibilidad con tests
  PERDIDA = 'perdida',
  PERDIDO = 'perdido', // Alias para compatibilidad con tests
  DAÑADO = 'dañado',   // Nuevo para compatibilidad con tests
  BAJA_DEFINITIVA = 'baja_definitiva',
  CAMBIO_ESTADO = 'cambio_estado',
  PRESTAMO = 'prestamo',
  DEVOLUCION = 'devolucion'
}

export type TipoEventoMaterialType = 
  | 'adquisicion'
  | 'primera_revision'
  | 'revision_periodica'
  | 'incidencia_menor'
  | 'incidencia_mayor'
  | 'reparacion'
  | 'perdida'
  | 'baja_definitiva'
  | 'cambio_estado'
  | 'prestamo'
  | 'devolucion';

export type GravedadIncidencia = 'baja' | 'media' | 'alta' | 'critica';

export interface EventoMaterial {
  id?: string;
  materialId: string;
  nombreMaterial: string;
  tipoEvento: TipoEventoMaterial;
  fecha: Timestamp | Date;
  año: number; // Año del evento para facilitar consultas
  mes: number; // Mes del evento (1-12)
  descripcion: string;
  
  // Información adicional según el tipo de evento
  estadoAnterior?: string;
  estadoNuevo?: string;
  cantidadAfectada?: number;
  costoAsociado?: number;
  gravedad?: GravedadIncidencia;
  
  // Referencias relacionadas
  actividadId?: string;
  nombreActividad?: string;
  usuarioResponsable?: string;
  nombreUsuarioResponsable?: string;
  
  // Metadatos
  observaciones?: string;
  evidenciaFotos?: string[]; // URLs de fotos de la incidencia
  documentosAdjuntos?: string[]; // URLs de documentos
  registradoPor: string;
  nombreRegistrador: string;
  fechaRegistro: Timestamp | Date;
}

export interface ResumenAnualMaterial {
  id?: string; // Agregar el campo ID
  año: number;
  materialId: string;
  nombreMaterial: string;
  tipo: string;
  
  // Contadores de eventos
  totalEventos: number;
  adquisiciones: number;
  revisiones: number;
  incidencias: number;
  perdidas: number;
  bajas: number;
  prestamos: number;
  
  // Análisis económico
  costoTotal: number;
  costoMantenimiento: number;
  costoPerdidas: number;
  
  // Estado al final del año
  estadoFinalAño: string;
  diasEnUso: number;
  diasEnMantenimiento: number;
  diasPerdido: number;
  
  // Eficiencia
  porcentajeUso: number; // % del año que estuvo disponible/en uso
  incidenciasPorUso: number; // incidencias por día de uso
}

export interface EstadisticasAnuales {
  año: number;
  
  // Resumen general
  totalMateriales: number;
  materialesActivos: number;
  materialesNuevos: number;
  materialesDadosBaja: number;
  materialesPerdidos: number;
  
  // Análisis por tipo
  estadisticasPorTipo: {
    [tipo: string]: {
      total: number;
      perdidos: number;
      dadosBaja: number;
      incidencias: number;
      costoTotal: number;
    }
  };
  
  // Análisis económico
  inversionTotal: number;
  costoMantenimiento: number;
  costoPerdidas: number;
  
  // Análisis temporal
  eventosPorMes: number[];
  incidenciasPorMes: number[];
  
  // Top materiales problemáticos
  materialesConMasIncidencias: {
    materialId: string;
    nombre: string;
    incidencias: number;
    costoTotal: number;
  }[];
  
  // Tendencias
  tendenciaIncidencias: 'mejora' | 'estable' | 'empeora';
  tendenciaCostos: 'mejora' | 'estable' | 'empeora';
}

export interface FiltroHistorial {
  años?: number[];
  materiales?: string[];
  tipoEvento?: TipoEventoMaterial[];
  gravedad?: GravedadIncidencia[];
  fechaInicio?: Date;
  fechaFin?: Date;
  responsable?: string;
  conCosto?: boolean;
}

export interface ConfiguracionSeguimiento {
  // Alertas automáticas
  alertarIncidenciasRepetidas: boolean;
  umbralIncidenciasAlerta: number; // Número de incidencias para alerta
  alertarCostoElevado: boolean;
  umbralCostoAlerta: number; // Costo que dispara alerta
  
  // Reportes automáticos
  generarReporteAnual: boolean;
  enviarReporteAutomatico: boolean;
  destinatariosReporte: string[];
  
  // Archivado automático
  archivarEventosAntiguos: boolean;
  añosParaArchivar: number; // Después de cuántos años archivar
}
