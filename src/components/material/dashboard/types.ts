import { Material } from '../../../types/material';

export interface EstadisticasMateriales {
  totalMateriales: number;
  materialesDisponibles: number;
  materialesPrestados: number;
  materialesMantenimiento: number;
  materialesBaja: number;
  materialesPerdidos: number;
  materialesRevision: number;
  materialesRetirados: number;
  porcentajeDisponibilidad: number;
  porcentajeUso: number;
  materialesPorTipo: {
    cuerda: number;
    anclaje: number;
    varios: number;
  };
  materialesNuevos: number;
  materialesAntiguos: number;
  valorTotalInventario: number;
  promedioEdadMateriales: number;
}

export interface EventoMaterial {
  id: string;
  tipo: 'creacion' | 'prestamo' | 'devolucion' | 'mantenimiento' | 'baja' | 'revision';
  materialId: string;
  materialNombre: string;
  fecha: Date;
  descripcion: string;
  usuarioId?: string;
  usuarioNombre?: string;
}

export interface MaterialProblematico {
  material: Material;
  problemas: string[];
  prioridad: 'alta' | 'media' | 'baja';
}

export interface ComparacionMateriales {
  año: number;
  estadisticas: EstadisticasMateriales;
}

export type TipoReporteMaterial = 
  | 'inventario-completo'
  | 'materiales-disponibles'
  | 'materiales-prestados'
  | 'materiales-mantenimiento'
  | 'estadisticas-uso'
  | 'materiales-problematicos';

export interface DashboardMaterialesState {
  añoSeleccionado: number;
  estadisticas: EstadisticasMateriales | null;
  eventosRecientes: EventoMaterial[];
  materiales: Material[];
  materialesProblematicos: MaterialProblematico[];
  comparacionAños: ComparacionMateriales[];
  cargando: boolean;
  error: string | null;
  reporteTexto: string;
}
