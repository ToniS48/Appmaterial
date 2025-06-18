
import { Timestamp } from 'firebase/firestore';

export type TipoActividad = 'espeleologia' | 'barranquismo' | 'exterior';
export type SubtipoActividad = 'visita' | 'exploracion' | 'formacion' | 'otro';
export type EstadoActividad = 'planificada' | 'en_curso' | 'finalizada' | 'cancelada';

export interface MaterialAsignado {
  materialId: string;
  nombre: string;
  cantidad: number;
}

export interface Comentario {
  uid: string;
  nombre: string;
  texto: string;
  fecha: Timestamp;
}

export interface Actividad {
  id?: string;
  nombre: string;
  nombreNormalizado?: string; // Campo nuevo para búsquedas insensibles a mayúsculas/minúsculas
  tipo: TipoActividad[];
  subtipo: SubtipoActividad[];
  descripcion: string;
  // Estandarizar el tipo para facilitar la manipulación interna
  fechaInicio: Date | Timestamp;
  fechaFin: Date | Timestamp;  lugar: string;
  ubicacionLat?: number; // Latitud para el clima (opcional)
  ubicacionLon?: number; // Longitud para el clima (opcional)
  responsableActividadId: string;
  responsableMaterialId?: string;
  participanteIds: string[];
  necesidadMaterial: boolean;
  materiales: { materialId: string; nombre: string; cantidad: number }[];
  estado: EstadoActividad;
  comentarios: Comentario[];
  creadorId: string;
  fechaCreacion?: Timestamp;
  fechaActualizacion?: Timestamp;
  // Enlaces categorizados
  enlacesWikiloc: { url: string, esEmbed: boolean }[];
  enlacesTopografias: string[];
  enlacesDrive: string[];
  enlacesWeb: string[];
  // Mantener el campo enlaces para compatibilidad
  enlaces: string[];
  imagenesTopografia: string[];
  archivosAdjuntos: string[];
  dificultad?: 'baja' | 'media' | 'alta';
}

// Añadir estas interfaces
export interface TipoActividadOption {
  value: TipoActividad;
  label: string;
}

export interface SubtipoActividadOption {
  value: SubtipoActividad;
  label: string;
}