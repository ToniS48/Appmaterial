import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Actividad } from '../types/actividad';
import { determinarEstadoActividad, toTimestamp } from '../utils/dateUtils';
import { obtenerPrestamosPorActividad } from './prestamoService';
import { obtenerUsuarioPorId } from './usuarioService';
import { notificacionService } from './domain/NotificacionService';

export interface ActividadConRetraso {
  actividad: Actividad;
  diasRetraso: number;
  prestamosActivos: number;
  responsables: {
    actividad?: { id: string; nombre: string; email?: string };
    material?: { id: string; nombre: string; email?: string };
  };
}

/**
 * Detecta actividades que están marcadas como "en_curso" pero que por fecha 
 * ya deberían estar "finalizada"
 */
export const detectarActividadesConRetraso = async (): Promise<ActividadConRetraso[]> => {
  try {
    console.log('🔍 Iniciando detección de actividades con retraso...');
    
    // Obtener todas las actividades marcadas como "en_curso"
    const actividadesRef = collection(db, 'actividades');
    const q = query(actividadesRef, where('estado', '==', 'en_curso'));
    const snapshot = await getDocs(q);
    
    const actividadesConRetraso: ActividadConRetraso[] = [];
    const hoy = Timestamp.now();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const actividad: Actividad = {
        id: doc.id,
        ...data,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin
      } as Actividad;
      
      // Verificar si la actividad debería estar finalizada por fecha
      const fechaFinTimestamp = toTimestamp(actividad.fechaFin);
      if (!fechaFinTimestamp) continue;
      
      const estadoEsperado = determinarEstadoActividad(
        toTimestamp(actividad.fechaInicio),
        fechaFinTimestamp,
        actividad.estado
      );
      
      // Si el estado esperado es "finalizada" pero está marcada como "en_curso"
      if (estadoEsperado === 'finalizada' && actividad.estado === 'en_curso') {
        console.log(`⚠️ Actividad con retraso detectada: ${actividad.nombre} (${actividad.id})`);
        
        // Calcular días de retraso
        const diasRetraso = Math.floor((hoy.seconds - fechaFinTimestamp.seconds) / (24 * 60 * 60));
        
        // Verificar préstamos activos
        let prestamosActivos = 0;
        if (actividad.necesidadMaterial) {
          try {
            const prestamos = await obtenerPrestamosPorActividad(actividad.id!);
            prestamosActivos = prestamos.filter(p => p.estado === 'en_uso' || p.estado === 'pendiente').length;
          } catch (error) {
            console.warn(`Error al obtener préstamos para actividad ${actividad.id}:`, error);
          }
        }
        
        // Obtener información de responsables
        const responsables: ActividadConRetraso['responsables'] = {};
        
        if (actividad.responsableActividadId) {
          try {
            const responsableActividad = await obtenerUsuarioPorId(actividad.responsableActividadId);
            if (responsableActividad) {
              responsables.actividad = {
                id: responsableActividad.uid,
                nombre: `${responsableActividad.nombre} ${responsableActividad.apellidos}`,
                email: responsableActividad.email
              };
            }
          } catch (error) {
            console.warn(`Error al obtener responsable de actividad ${actividad.responsableActividadId}:`, error);
          }
        }
        
        if (actividad.responsableMaterialId) {
          try {
            const responsableMaterial = await obtenerUsuarioPorId(actividad.responsableMaterialId);
            if (responsableMaterial) {
              responsables.material = {
                id: responsableMaterial.uid,
                nombre: `${responsableMaterial.nombre} ${responsableMaterial.apellidos}`,
                email: responsableMaterial.email
              };
            }
          } catch (error) {
            console.warn(`Error al obtener responsable de material ${actividad.responsableMaterialId}:`, error);
          }
        }
        
        actividadesConRetraso.push({
          actividad,
          diasRetraso,
          prestamosActivos,
          responsables
        });
      }
    }
    
    console.log(`✅ Detección completada. ${actividadesConRetraso.length} actividades con retraso encontradas`);
    return actividadesConRetraso;
    
  } catch (error) {
    console.error('❌ Error al detectar actividades con retraso:', error);
    throw error;
  }
};

/**
 * Envía notificaciones sobre actividades con retraso a los responsables correspondientes
 */
export const notificarActividadesConRetraso = async (actividadesConRetraso: ActividadConRetraso[]): Promise<void> => {
  if (actividadesConRetraso.length === 0) return;
  
  console.log(`📢 Enviando notificaciones para ${actividadesConRetraso.length} actividades con retraso...`);
  
  try {
    for (const { actividad, diasRetraso, prestamosActivos, responsables } of actividadesConRetraso) {
      const mensajeBase = `La actividad "${actividad.nombre}" finalizó hace ${diasRetraso} día(s) pero sigue marcada como "en curso"`;
      const mensajeMaterial = prestamosActivos > 0 
        ? ` Hay ${prestamosActivos} préstamo(s) de material pendiente(s) de devolución.`
        : '';
      const mensaje = mensajeBase + mensajeMaterial;
      
      const enlace = `/activities/${actividad.id}`;
      
      // Notificar al responsable de la actividad
      if (responsables.actividad) {
        await notificacionService.crearNotificacion({
          usuarioId: responsables.actividad.id,
          tipo: 'actividad',
          mensaje: `[Responsable de Actividad] ${mensaje}`,
          enlace,
          entidadId: actividad.id,
          entidadTipo: 'actividad',
          prioridad: diasRetraso > 7 ? 'alta' : 'normal'
        });
        console.log(`✅ Notificación enviada al responsable de actividad: ${responsables.actividad.nombre}`);
      }
      
      // Notificar al responsable de material (si es diferente y hay préstamos activos)
      if (responsables.material && 
          responsables.material.id !== responsables.actividad?.id && 
          prestamosActivos > 0) {
        await notificacionService.crearNotificacion({
          usuarioId: responsables.material.id,
          tipo: 'material',
          mensaje: `[Responsable de Material] ${mensaje}`,
          enlace,
          entidadId: actividad.id,
          entidadTipo: 'actividad',
          prioridad: diasRetraso > 7 ? 'alta' : 'normal'
        });
        console.log(`✅ Notificación enviada al responsable de material: ${responsables.material.nombre}`);
      }
    }
    
    // TODO: También notificar a admins y vocales si hay muchas actividades con retraso
    if (actividadesConRetraso.length >= 3) {
      console.log(`⚠️ Se detectaron ${actividadesConRetraso.length} actividades con retraso. Considerar notificar a administradores.`);
    }
    
  } catch (error) {
    console.error('❌ Error al enviar notificaciones de retraso:', error);
    throw error;
  }
};

/**
 * Función principal que ejecuta la verificación completa y envía notificaciones
 */
export const verificarYNotificarRetrasos = async (): Promise<ActividadConRetraso[]> => {
  try {
    console.log('🚀 Iniciando verificación programada de retrasos...');
    
    const actividadesConRetraso = await detectarActividadesConRetraso();
    
    if (actividadesConRetraso.length > 0) {
      await notificarActividadesConRetraso(actividadesConRetraso);
    } else {
      console.log('✅ No se encontraron actividades con retraso');
    }
    
    return actividadesConRetraso;
    
  } catch (error) {
    console.error('❌ Error en verificación de retrasos:', error);
    throw error;
  }
};

/**
 * Marcar manualmente una actividad como finalizada (acción correctiva)
 */
export const finalizarActividadConRetraso = async (actividadId: string, motivo?: string): Promise<void> => {
  try {
    console.log(`🔧 Finalizando actividad con retraso: ${actividadId}`);
    
    // Importar dinámicamente para evitar dependencias circulares
    const { actualizarActividad } = await import('./actividadService');
      await actualizarActividad(actividadId, {
      estado: 'finalizada' as const
    });
    
    console.log(`✅ Actividad ${actividadId} marcada como finalizada`);
    
  } catch (error) {
    console.error(`❌ Error al finalizar actividad ${actividadId}:`, error);
    throw error;
  }
};
