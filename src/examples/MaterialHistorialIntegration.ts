/**
 * EJEMPLO DE INTEGRACIÓN - Sistema de Seguimiento de Material
 * 
 * Este archivo muestra cómo integrar el registro automático de eventos
 * de historial con las operaciones existentes de material.
 */

import { useMaterialHistorial } from '../hooks/useMaterialHistorial';
import { materialHistorialService } from '../services/domain/MaterialHistorialService';
import { Material } from '../types/material';
import { Prestamo } from '../types/prestamo';

/**
 * EJEMPLO 1: Integración en el servicio de materiales
 * 
 * Cuando se actualiza el estado de un material, registrar automáticamente en el historial
 */

// EN: src/services/materialService.ts
/*
export const actualizarEstadoMaterial = async (
  materialId: string, 
  nuevoEstado: string, 
  motivo?: string
) => {
  const material = await materialRepository.findById(materialId);
  const estadoAnterior = material.estado;
  
  // Actualizar el material
  await materialRepository.update(materialId, { estado: nuevoEstado });
  
  // 🆕 REGISTRAR EN HISTORIAL
  await materialHistorialService.registrarEvento({
    materialId: material.id,
    nombreMaterial: material.nombre,
    tipoEvento: nuevoEstado === 'baja' ? 'baja_definitiva' : 
                nuevoEstado === 'perdido' ? 'perdida' : 'cambio_estado',
    fecha: new Date(),
    descripcion: `Cambio de estado: ${estadoAnterior} → ${nuevoEstado}${motivo ? `. Motivo: ${motivo}` : ''}`,
    estadoAnterior,
    estadoNuevo: nuevoEstado,
    gravedad: nuevoEstado === 'perdido' ? 'critica' : 
              nuevoEstado === 'baja' ? 'alta' : 'media',
    registradoPor: getCurrentUser().uid,
    nombreRegistrador: getCurrentUser().displayName
  });
};
*/

/**
 * EJEMPLO 2: Integración en formularios de material con hook
 * 
 * Uso en componentes React para registro automático
 */

// EN: src/components/material/MaterialForm.tsx
/*
import useMaterialHistorial from '../../hooks/useMaterialHistorial';

const MaterialForm = () => {
  const { registrarAdquisicion, registrarCambioEstado } = useMaterialHistorial();
  
  const handleCrearMaterial = async (materialData) => {
    // Crear el material
    const nuevoMaterial = await materialService.crearMaterial(materialData);
    
    // 🆕 REGISTRAR ADQUISICIÓN AUTOMÁTICAMENTE
    await registrarAdquisicion(
      nuevoMaterial,
      materialData.costoAdquisicion,
      materialData.proveedor
    );
  };
  
  const handleCambiarEstado = async (material, nuevoEstado, motivo) => {
    const estadoAnterior = material.estado;
    
    // Actualizar material
    await materialService.actualizarMaterial(material.id, { estado: nuevoEstado });
    
    // 🆕 REGISTRAR CAMBIO AUTOMÁTICAMENTE
    await registrarCambioEstado(
      { ...material, estado: nuevoEstado },
      estadoAnterior,
      motivo
    );
  };
};
*/

/**
 * EJEMPLO 3: Integración en el servicio de préstamos
 * 
 * Registro automático de préstamos y devoluciones
 */

// EN: src/services/prestamoService.ts
/*
import { materialHistorialService } from '../services/domain/MaterialHistorialService';

export const crearPrestamo = async (prestamoData: Omit<Prestamo, 'id'>): Promise<Prestamo> => {
  // ... lógica existente ...
  
  const prestamo = await addDoc(prestamosRef, prestamoData);
  
  // 🆕 REGISTRAR PRÉSTAMO EN HISTORIAL
  await materialHistorialService.registrarEvento({
    materialId: prestamoData.materialId,
    nombreMaterial: prestamoData.nombreMaterial,
    tipoEvento: 'prestamo',
    fecha: prestamoData.fechaPrestamo,
    descripcion: `Material prestado para actividad: ${prestamoData.nombreActividad || 'Sin especificar'}`,
    cantidadAfectada: prestamoData.cantidadPrestada,
    actividadId: prestamoData.actividadId,
    nombreActividad: prestamoData.nombreActividad,
    estadoAnterior: 'disponible',
    estadoNuevo: 'prestado',
    usuarioResponsable: prestamoData.usuarioId,
    nombreUsuarioResponsable: prestamoData.nombreUsuario,
    registradoPor: getCurrentUser().uid,
    nombreRegistrador: getCurrentUser().displayName
  });
  
  return prestamo;
};

export const registrarDevolucionConIncidencia = async (
  prestamoId: string,
  observaciones?: string,
  incidencia?: {
    tipo: string;
    gravedad: string;
    descripcion: string;
  }
) => {
  // ... lógica existente de devolución ...
  
  const prestamo = await obtenerPrestamo(prestamoId);
  
  // 🆕 REGISTRAR DEVOLUCIÓN EN HISTORIAL
  await materialHistorialService.registrarEvento({
    materialId: prestamo.materialId,
    nombreMaterial: prestamo.nombreMaterial,
    tipoEvento: 'devolucion',
    fecha: new Date(),
    descripcion: `Material devuelto de actividad: ${prestamo.nombreActividad}${incidencia ? '. Con incidencias reportadas.' : ''}`,
    cantidadAfectada: prestamo.cantidadPrestada,
    actividadId: prestamo.actividadId,
    nombreActividad: prestamo.nombreActividad,
    estadoAnterior: 'prestado',
    estadoNuevo: 'disponible',
    observaciones,
    registradoPor: getCurrentUser().uid,
    nombreRegistrador: getCurrentUser().displayName
  });
  
  // Si hay incidencia, registrar evento adicional
  if (incidencia) {
    await materialHistorialService.registrarEvento({
      materialId: prestamo.materialId,
      nombreMaterial: prestamo.nombreMaterial,
      tipoEvento: incidencia.gravedad === 'baja' || incidencia.gravedad === 'media' 
        ? 'incidencia_menor' 
        : 'incidencia_mayor',
      fecha: new Date(),
      descripcion: `Incidencia en devolución: ${incidencia.descripcion}`,
      gravedad: incidencia.gravedad as any,
      actividadId: prestamo.actividadId,
      nombreActividad: prestamo.nombreActividad,
      registradoPor: getCurrentUser().uid,
      nombreRegistrador: getCurrentUser().displayName
    });
  }
};
*/

/**
 * EJEMPLO 4: Registro de revisiones periódicas
 * 
 * Para mantenimiento y revisiones del material
 */

// EN: src/components/material/RevisionForm.tsx
/*
const RevisionForm = () => {
  const { registrarRevision } = useMaterialHistorial();
  
  const handleRegistrarRevision = async (material, resultados, costo) => {
    // Actualizar fechas de revisión en el material
    await materialService.actualizarMaterial(material.id, {
      fechaUltimaRevision: new Date(),
      proximaRevision: addYears(new Date(), 1)
    });
    
    // 🆕 REGISTRAR REVISIÓN EN HISTORIAL
    await registrarRevision(
      material,
      'revision_periodica',
      resultados,
      costo
    );
  };
};
*/

/**
 * EJEMPLO 5: Batch de eventos para operaciones múltiples
 * 
 * Cuando se hacen operaciones en bulk sobre múltiples materiales
 */

// EN: src/services/materialBulkService.ts
/*
export const darDeBajaMaterialesEnBulk = async (materiales: Material[], motivo: string) => {
  const eventos = materiales.map(material => ({
    materialId: material.id,
    nombreMaterial: material.nombre,
    tipoEvento: 'baja_definitiva' as const,
    descripcion: `Material dado de baja en operación bulk. Motivo: ${motivo}`,
    estadoAnterior: material.estado,
    estadoNuevo: 'baja' as const,
    gravedad: 'alta' as const,
    observaciones: motivo
  }));
  
  // 🆕 REGISTRAR TODOS LOS EVENTOS EN BULK
  await materialHistorialService.registrarEventosBulk(eventos);
};
*/

/**
 * EJEMPLO 6: Consultas para dashboards
 * 
 * Obtener datos para mostrar en interfaces de usuario
 */

// EN: src/components/dashboard/MaterialStatsDashboard.tsx
/*
const MaterialStatsDashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  
  useEffect(() => {
    const cargarEstadisticas = async () => {
      // Obtener estadísticas del año actual
      const añoActual = new Date().getFullYear();
      const stats = await materialHistorialService.obtenerEstadisticasAnuales(añoActual);
      setEstadisticas(stats);
      
      // Obtener materiales problemáticos
      const problemáticos = await materialHistorialService.obtenerMaterialesProblematicos(añoActual);
      setMaterialesProblematicos(problemáticos);
    };
    
    cargarEstadisticas();
  }, []);
};
*/

/**
 * EJEMPLO 7: Generación de reportes automáticos
 * 
 * Para reportes programados o bajo demanda
 */

// EN: src/services/reporteService.ts
/*
export const generarReporteAnualMaterial = async (año: number) => {
  // Generar reporte
  const reporte = await materialHistorialService.generarReporteAnual(año);
  
  // Enviar por email a administradores
  await enviarReportePorEmail(reporte, año);
  
  // Guardar en sistema de archivos
  await guardarReporteEnArchivos(reporte, año);
  
  return reporte;
};
*/

/**
 * PASOS PARA IMPLEMENTAR EN TU CÓDIGO:
 * 
 * 1. Importar el hook en componentes React:
 *    import useMaterialHistorial from '../hooks/useMaterialHistorial';
 * 
 * 2. Importar el servicio en servicios backend:
 *    import { materialHistorialService } from '../services/domain/MaterialHistorialService';
 * 
 * 3. Agregar llamadas de registro después de operaciones críticas:
 *    - Crear material → registrarAdquisicion()
 *    - Cambiar estado → registrarCambioEstado()
 *    - Préstamo → registrarPrestamo()
 *    - Devolución → registrarDevolucion()
 *    - Incidencia → registrarIncidencia()
 *    - Revisión → registrarRevision()
 * 
 * 4. Para consultas, usar el servicio directamente:
 *    - materialHistorialService.obtenerHistorial()
 *    - materialHistorialService.obtenerEstadisticasAnuales()
 *    - materialHistorialService.obtenerMaterialesProblematicos()
 *  * 5. Para dashboards, usar el dashboard modular:
 *    import DashboardMateriales from '../components/material/DashboardMateriales';
 */

export default {
  // Este archivo es solo para documentación y ejemplos
  // No exporta funcionalidad real
};
