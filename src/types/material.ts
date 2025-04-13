import { Timestamp } from 'firebase/firestore';

export interface Material {
  id: string;
  nombre: string;
  tipo: 'cuerda' | 'anclaje' | 'varios';
  codigo?: string;
  estado: 'disponible' | 'prestado' | 'mantenimiento' | 'baja' | 'perdido' | 'revision' | 'retirado';
  fechaAdquisicion: Timestamp | Date;
  fechaUltimaRevision: Timestamp | Date;
  proximaRevision: Timestamp | Date;
  observaciones?: string;
  cantidad?: number;
  cantidadDisponible?: number;
  fechaCreacion?: Timestamp | Date;
  fechaActualizacion?: Timestamp | Date;
  
  // Campos específicos para cuerdas
  longitud?: number;
  diametro?: number;
  usos?: number;
  tipoCuerda?: string;
  fechaFabricacion?: Timestamp | Date;
  fechaPrimerUso?: Timestamp | Date;
  vidaUtilRestante?: number;
  
  // Campos específicos para anclajes
  tipoAnclaje?: string;
  
  // Campos específicos para varios
  categoria?: string;
  subcategoria?: string;
}