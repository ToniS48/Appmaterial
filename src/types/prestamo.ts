
import { Timestamp } from 'firebase/firestore';

export type EstadoPrestamo = 'solicitado' | 'aprobado' | 'rechazado' | 'en_uso' | 'devuelto' | 'expirado' | 'pendiente' | 'perdido' | 'estropeado' | 'cancelado' | 'por_devolver';

export interface Prestamo {
  id?: string;
  materialId: string;
  nombreMaterial: string;
  usuarioId: string;
  nombreUsuario: string;
  cantidadPrestada: number;
  fechaPrestamo: Timestamp | Date;
  fechaDevolucionPrevista: Timestamp | Date;
  fechaDevolucion?: Timestamp | Date;
  estado: EstadoPrestamo;
  observaciones?: string;
  aprobadoPor?: string;
  nombreAprobador?: string;
    // Nuevos campos que faltan
  actividadId?: string;
  nombreActividad?: string; 
  registradoPor?: string;
  
  // Campo para optimizar detección de actividades finalizadas
  fechaFinActividad?: Timestamp | Date;
  
  // Responsables - nuevos campos
  responsableActividad?: string;
  nombreResponsableActividad?: string;
  responsableMaterial?: string;
  nombreResponsableMaterial?: string;
}