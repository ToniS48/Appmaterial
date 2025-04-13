import { collection, addDoc, updateDoc, doc, getDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { handleFirebaseError } from '../utils/errorHandling';
import { Material } from '../types/material';
import { enviarNotificacionMasiva } from './notificacionService';
import { obtenerUsuarioPorId, listarUsuarios } from './usuarioService';
import { Usuario } from '../types/usuario';

// Función para crear un nuevo material
export const crearMaterial = async (materialData: any) => {
  try {
    // Colección principal 'material_deportivo'
    const collectionRef = collection(db, 'material_deportivo');
    const docRef = await addDoc(collectionRef, {
      ...materialData,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    });
    
    // Si es necesario guardar subcollecciones
    if (materialData.tipo === 'cuerda') {
      // Aquí podríamos crear subcollecciones específicas para cuerdas si fuera necesario
    }
    
    return {
      id: docRef.id,
      ...materialData
    };
  } catch (error) {
    console.error('Error al crear material:', error);
    throw error;
  }
};

// Función para actualizar un material existente
export const actualizarMaterial = async (materialId: string, materialData: any) => {
  try {
    // Corregido: referencia a documento en colección principal
    const materialRef = doc(db, 'material_deportivo', materialId);
    
    await updateDoc(materialRef, {
      ...materialData,
      fechaActualizacion: new Date()
    });
    
    return {
      id: materialId,
      ...materialData
    };
  } catch (error) {
    console.error('Error al actualizar material:', error);
    throw error;
  }
};

// Función para obtener un material específico
export const obtenerMaterial = async (materialId: string): Promise<Material> => {
  try {
    const materialRef = doc(db, 'material_deportivo', materialId);
    const materialDoc = await getDoc(materialRef);
    
    if (!materialDoc.exists()) {
      throw new Error('El material no existe');
    }
    
    return {
      id: materialDoc.id,
      ...materialDoc.data() as Omit<Material, 'id'>
    } as Material;
  } catch (error) {
    console.error('Error al obtener material:', error);
    throw error;
  }
};

// Función para obtener lista de materiales
export const listarMateriales = async (filters?: { estado?: string }): Promise<Material[]> => {
  try {
    let materialesQuery: any = collection(db, 'material_deportivo');
    
    // Aplicar filtros si se proporcionan
    if (filters && filters.estado) {
      materialesQuery = query(
        materialesQuery,
        where('estado', '==', filters.estado)
      );
    }
    
    const materialesSnapshot = await getDocs(materialesQuery);
    
    return materialesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Record<string, any> // Asegurar que TypeScript lo reconozca como objeto
    })) as Material[];
  } catch (error) {
    handleFirebaseError(error, 'Error al listar materiales');
    throw error;
  }
};

// Función para eliminar un material
export const eliminarMaterial = async (materialId: string) => {
  try {
    // Corregido: referencia a documento en colección principal
    const materialRef = doc(db, 'material_deportivo', materialId);
    await deleteDoc(materialRef);
    return { id: materialId };
  } catch (error) {
    console.error('Error al eliminar material:', error);
    throw error;
  }
};

// Crear servicio para registrar incidencias

// Registrar incidencia de material
export const registrarIncidenciaMaterial = async (
  materialId: string,
  incidencia: {
    descripcion: string;
    reportadoPor: string;
    tipo: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
    gravedad?: 'baja' | 'media' | 'alta' | 'critica';
  }
): Promise<void> => {
  try {
    const material = await obtenerMaterial(materialId);
    
    // Registrar incidencia en colección de incidencias (puedes crear esta colección)
    const incidenciaRef = collection(db, 'incidencias_material');
    await addDoc(incidenciaRef, {
      materialId,
      nombreMaterial: material.nombre,
      ...incidencia,
      fechaReporte: Timestamp.now(),
      estado: 'pendiente'
    });
    
    // Cambiar estado del material según el tipo de incidencia
    let nuevoEstado = '';
    switch (incidencia.tipo) {
      case 'daño':
        nuevoEstado = 'revision';
        break;
      case 'perdida':
        nuevoEstado = 'perdido';
        break;
      case 'mantenimiento':
        nuevoEstado = 'mantenimiento';
        break;
      default:
        nuevoEstado = 'revision';
    }
    
    // Actualizar estado del material
    await actualizarMaterial(materialId, { estado: nuevoEstado });
    
    // Enviar notificaciones
    await enviarNotificacionIncidencia(material, incidencia);
    
  } catch (error) {
    handleFirebaseError(error, 'Error al registrar incidencia');
    throw error;
  }
};

// Enviar notificación de incidencia de material
async function enviarNotificacionIncidencia(
  material: Material,
  incidencia: { 
    descripcion: string;
    reportadoPor: string;
    tipo: string;
    gravedad?: string;
  }
): Promise<void> {
  try {
    // Obtener usuario que reportó la incidencia
    const usuario = await obtenerUsuarioPorId(incidencia.reportadoPor);
    const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario desconocido';
    
    // Notificar a administradores y vocales
    const usuarios = await listarUsuarios();
    const adminsYVocales = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
    
    if (adminsYVocales.length > 0) {
      const gravedadTexto = incidencia.gravedad ? `[${incidencia.gravedad.toUpperCase()}] ` : '';
      const mensaje = `${gravedadTexto}Incidencia en ${material.nombre}: ${incidencia.tipo}. Reportado por ${nombreUsuario}`;
      
      await enviarNotificacionMasiva(
        adminsYVocales.map((u: Usuario) => u.uid),
        'incidencia',
        mensaje,
        material.id,
        'material',
        `/material`
      );
    }
  } catch (error) {
    console.error('Error al enviar notificaciones de incidencia:', error);
  }
}

// Función para actualizar la cantidad disponible de un material
export const actualizarCantidadDisponible = async (materialId: string, cantidadDelta: number): Promise<void> => {
  try {
    const materialRef = doc(db, 'material_deportivo', materialId);
    const materialSnapshot = await getDoc(materialRef);
    
    if (!materialSnapshot.exists()) {
      throw new Error('Material no encontrado');
    }
    
    const materialData = materialSnapshot.data();
    
    // Si es cuerda o material único, actualizamos el estado
    if (!materialData.cantidadDisponible) {
      // Es un material único, actualizamos estado en lugar de cantidad
      await updateDoc(materialRef, {
        estado: cantidadDelta < 0 ? 'prestado' : 'disponible'
      });
      return;
    }
    
    // Para materiales con cantidad (anclajes, varios), actualizamos la cantidad disponible
    const cantidadActual = materialData.cantidadDisponible || 0;
    const nuevaCantidad = Math.max(0, cantidadActual + cantidadDelta);
    
    if (nuevaCantidad > materialData.cantidad) {
      throw new Error('La cantidad disponible no puede superar la cantidad total');
    }
    
    await updateDoc(materialRef, {
      cantidadDisponible: nuevaCantidad,
      estado: nuevaCantidad > 0 ? 'disponible' : 'prestado'
    });
  } catch (error) {
    handleFirebaseError(error, 'Error al actualizar cantidad disponible');
    throw error;
  }
};

// Obtener estadísticas de material
export const obtenerEstadisticasMaterial = async () => {
  try {
    const materiales = await listarMateriales();
    return {
      buenEstado: materiales.filter(m => m.estado === 'disponible').length,
      enMantenimiento: materiales.filter(m => m.estado === 'mantenimiento').length,
      prestados: materiales.filter(m => m.estado === 'prestado').length,
      bajaOPerdido: materiales.filter(m => m.estado === 'baja' || m.estado === 'perdido').length
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de material:', error);
    return { buenEstado: 0, enMantenimiento: 0, prestados: 0, bajaOPerdido: 0 };
  }
};