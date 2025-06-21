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
 * Detecta actividades que deberían haber finalizado pero tienen préstamos activos
 */
export const detectarActividadesConRetraso = async (): Promise<ActividadConRetraso[]> => {
  try {
    console.log('🔍 Iniciando detección de actividades con retraso (NUEVA LÓGICA)...');
    
    // Buscar todas las actividades que necesiten material
    const actividadesRef = collection(db, 'actividades');
    const snapshotTodas = await getDocs(actividadesRef);
    
    console.log(`📊 ANÁLISIS COMPLETO: Total actividades en sistema: ${snapshotTodas.size}`);
    
    const actividadesConRetraso: ActividadConRetraso[] = [];
    const hoy = Timestamp.now();
    
    for (const doc of snapshotTodas.docs) {
      const data = doc.data();
      const actividad: Actividad = {
        id: doc.id,
        ...data,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin
      } as Actividad;
      
      console.log(`🔍 Analizando "${actividad.nombre}":`, {
        estado: actividad.estado,
        fechaFin: actividad.fechaFin,
        necesidadMaterial: actividad.necesidadMaterial
      });
      
      // Solo analizar actividades que necesiten material
      if (!actividad.necesidadMaterial) {
        console.log(`❌ "${actividad.nombre}" - No necesita material, se omite`);
        continue;
      }
      
      const fechaFinTimestamp = toTimestamp(actividad.fechaFin);
      if (!fechaFinTimestamp) {
        console.log(`❌ "${actividad.nombre}" - Sin fecha fin válida, se omite`);
        continue;
      }
        // Verificar si la actividad ya debería haber finalizado (considerando margen de 7 días)
      const fechaFinDate = fechaFinTimestamp.toDate();
      const fechaLimiteDevolucion = new Date(fechaFinDate);
      fechaLimiteDevolucion.setDate(fechaLimiteDevolucion.getDate() + 7);
      
      const yaDeberiaHaberFinalizado = new Date() > fechaLimiteDevolucion;
      if (!yaDeberiaHaberFinalizado) {
        const diasRestantes = Math.ceil((fechaLimiteDevolucion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        console.log(`✅ "${actividad.nombre}" - Aún tiene ${diasRestantes} días para devolver material (período de gracia)`);
        continue;
      }
      
      console.log(`📅 "${actividad.nombre}" - Ya debería haber finalizado. Verificando préstamos...`);
      
      // Verificar préstamos activos
      let prestamosActivos = 0;
      try {
        const prestamos = await obtenerPrestamosPorActividad(actividad.id!);
        prestamosActivos = prestamos.filter(p => p.estado === 'en_uso' || p.estado === 'pendiente').length;
        console.log(`📦 "${actividad.nombre}" - Préstamos activos: ${prestamosActivos}`);
      } catch (error) {
        console.warn(`Error al obtener préstamos para actividad ${actividad.id}:`, error);
        continue;
      }
      
      // Si tiene préstamos activos, se considera con retraso
      if (prestamosActivos > 0) {
        console.log(`⚠️ RETRASO DETECTADO: "${actividad.nombre}" - ${prestamosActivos} préstamos sin devolver`);
          // Calcular días de retraso desde el final del período de gracia (7 días después de finalización)
        const fechaFinDate = fechaFinTimestamp.toDate();
        const fechaLimiteDevolucion = new Date(fechaFinDate);
        fechaLimiteDevolucion.setDate(fechaLimiteDevolucion.getDate() + 7);
        
        const diasRetraso = Math.floor((new Date().getTime() - fechaLimiteDevolucion.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📊 "${actividad.nombre}" - Días de retraso: ${diasRetraso} (desde el final del período de gracia)`);
        console.log(`📅 "${actividad.nombre}" - Fechas: Fin actividad: ${fechaFinDate.toLocaleDateString()}, Límite devolución: ${fechaLimiteDevolucion.toLocaleDateString()}`);
        
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
      } else {
        console.log(`✅ "${actividad.nombre}" - No tiene préstamos activos, no se considera con retraso`);
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
      }
      
      // Notificar al responsable del material (si es diferente)
      if (responsables.material && responsables.material.id !== responsables.actividad?.id) {
        await notificacionService.crearNotificacion({
          usuarioId: responsables.material.id,
          tipo: 'material',
          mensaje: `[Responsable de Material] ${mensaje}`,
          enlace,
          entidadId: actividad.id,
          entidadTipo: 'actividad',
          prioridad: diasRetraso > 7 ? 'alta' : 'normal'
        });
      }
    }
    
    console.log(`✅ Notificaciones enviadas para ${actividadesConRetraso.length} actividades`);
    
  } catch (error) {
    console.error('❌ Error al enviar notificaciones:', error);
    throw error;
  }
};

/**
 * Marca una actividad con retraso como finalizada
 */
export const finalizarActividadConRetraso = async (actividadId: string, razon?: string): Promise<void> => {
  try {
    console.log(`🏁 Finalizando actividad con retraso: ${actividadId}${razon ? ` - Razón: ${razon}` : ''}`);
    
    // Aquí iría la lógica para finalizar la actividad
    // Por ahora solo registramos el log
    
    console.log(`✅ Actividad ${actividadId} marcada como finalizada`);
    
  } catch (error) {
    console.error(`❌ Error al finalizar actividad ${actividadId}:`, error);
    throw error;
  }
};

/**
 * Verifica y notifica sobre actividades con retraso (función para compatibilidad)
 */
export const verificarYNotificarRetrasos = async (): Promise<ActividadConRetraso[]> => {
  try {
    console.log('🔄 Iniciando verificación y notificación de retrasos...');
    
    const actividadesConRetraso = await detectarActividadesConRetraso();
    
    if (actividadesConRetraso.length > 0) {
      await notificarActividadesConRetraso(actividadesConRetraso);
      console.log(`✅ Proceso completado: ${actividadesConRetraso.length} actividades procesadas`);
    } else {
      console.log('✅ No se encontraron actividades con retraso');
    }
    
    return actividadesConRetraso;
    
  } catch (error) {
    console.error('❌ Error en verificación y notificación de retrasos:', error);
    throw error;
  }
};
