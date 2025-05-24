/**
 * Definiciones de tipos locales para los componentes de material
 */

export interface MaterialItem {
  id: string;
  nombre: string;
  tipo: 'cuerda' | 'anclaje' | 'varios';
  estado: string;
  cantidadDisponible: number;
  codigo?: string;
  descripcion?: string;
}

export interface MaterialField {
  id: string;
  materialId: string;
  nombre: string;
  cantidad: number;
}
