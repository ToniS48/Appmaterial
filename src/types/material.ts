
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
  fechaCreacion?: Timestamp;
  fechaActualizacion?: Timestamp;
  
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
  descripcion?: string;
  
  // Campo de precio/coste
  precio?: number;
}

// Tipo para representar un material en la UI (lista de materiales)
export interface MaterialItem {
  id: string;
  nombre: string;
  tipo: 'cuerda' | 'anclaje' | 'varios';
  estado: string;
  cantidadDisponible: number | undefined;
  codigo?: string;
  descripcion?: string;
}

// Tipo para campos de materiales en formularios
export interface MaterialField {
  id: string;
  materialId: string;
  nombre: string;
  cantidad: number;
}
