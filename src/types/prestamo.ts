import { Timestamp } from 'firebase/firestore';

export type EstadoPrestamo = 'solicitado' | 'aprobado' | 'rechazado' | 'en_uso' | 'devuelto' | 'expirado' | 'pendiente' | 'perdido' | 'estropeado';

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
}