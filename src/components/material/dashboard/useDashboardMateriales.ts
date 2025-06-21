import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { Timestamp } from 'firebase/firestore';
import { listarMateriales } from '../../../services/materialService';
import { Material } from '../../../types/material';
import { 
  DashboardMaterialesState, 
  EstadisticasMateriales, 
  EventoMaterial,
  MaterialProblematico,
  ComparacionMateriales,
  TipoReporteMaterial
} from './types';

// Helper function para convertir Timestamp a Date de manera segura
const convertirTimestampADate = (timestamp: Timestamp | Date | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
};

const calcularEstadisticas = (materiales: Material[]): EstadisticasMateriales => {
  const stats = materiales.reduce((acc, material) => {
    // Contar por estado
    if (material.estado === 'disponible') acc.materialesDisponibles++;
    else if (material.estado === 'prestado') acc.materialesPrestados++;
    else if (material.estado === 'mantenimiento') acc.materialesMantenimiento++;
    else if (material.estado === 'baja') acc.materialesBaja++;
    else if (material.estado === 'perdido') acc.materialesPerdidos++;
    else if (material.estado === 'revision') acc.materialesRevision++;
    else if (material.estado === 'retirado') acc.materialesRetirados++;

    // Contar por tipo
    if (material.tipo === 'cuerda') acc.materialesPorTipo.cuerda++;
    else if (material.tipo === 'anclaje') acc.materialesPorTipo.anclaje++;
    else if (material.tipo === 'varios') acc.materialesPorTipo.varios++;    // Calcular valor total
    if (material.precio) {
      acc.valorTotalInventario += material.precio;
    }

    // Calcular edad promedio
    if (material.fechaAdquisicion) {
      const fechaAdq = convertirTimestampADate(material.fechaAdquisicion);
      if (fechaAdq) {
        const diasDesdeAdquisicion = Math.floor((Date.now() - fechaAdq.getTime()) / (1000 * 60 * 60 * 24));
        acc.edadTotal += diasDesdeAdquisicion;
        acc.materialesConFecha++;
        
        // Considerar nuevo si tiene menos de 6 meses
        if (diasDesdeAdquisicion < 180) {
          acc.materialesNuevos++;
        } else if (diasDesdeAdquisicion > 365 * 2) {
          acc.materialesAntiguos++;
        }
      }
    }

    return acc;
  }, {
    materialesDisponibles: 0,
    materialesPrestados: 0,
    materialesMantenimiento: 0,
    materialesBaja: 0,
    materialesPerdidos: 0,
    materialesRevision: 0,
    materialesRetirados: 0,
    materialesPorTipo: { cuerda: 0, anclaje: 0, varios: 0 },
    valorTotalInventario: 0,
    materialesNuevos: 0,
    materialesAntiguos: 0,
    edadTotal: 0,
    materialesConFecha: 0
  });

  const totalMateriales = materiales.length;
  const materialesActivos = stats.materialesDisponibles + stats.materialesPrestados + stats.materialesRevision;
  
  return {
    totalMateriales,
    materialesDisponibles: stats.materialesDisponibles,
    materialesPrestados: stats.materialesPrestados,
    materialesMantenimiento: stats.materialesMantenimiento,
    materialesBaja: stats.materialesBaja,
    materialesPerdidos: stats.materialesPerdidos,
    materialesRevision: stats.materialesRevision,
    materialesRetirados: stats.materialesRetirados,
    porcentajeDisponibilidad: totalMateriales > 0 ? (stats.materialesDisponibles / totalMateriales) * 100 : 0,
    porcentajeUso: totalMateriales > 0 ? (stats.materialesPrestados / totalMateriales) * 100 : 0,
    materialesPorTipo: stats.materialesPorTipo,
    materialesNuevos: stats.materialesNuevos,
    materialesAntiguos: stats.materialesAntiguos,
    valorTotalInventario: stats.valorTotalInventario,
    promedioEdadMateriales: stats.materialesConFecha > 0 ? stats.edadTotal / stats.materialesConFecha : 0
  };
};

const identificarMaterialesProblematicos = (materiales: Material[]): MaterialProblematico[] => {
  return materiales
    .map(material => {
      const problemas: string[] = [];
      let prioridad: 'alta' | 'media' | 'baja' = 'baja';

      // Problemas de alta prioridad
      if (material.estado === 'perdido') {
        problemas.push('Material perdido');
        prioridad = 'alta';
      }
      if (material.estado === 'baja') {
        problemas.push('Material dado de baja');
        prioridad = 'alta';
      }      // Problemas de media prioridad
      if (material.estado === 'mantenimiento') {
        problemas.push('Requiere mantenimiento');
        if (prioridad === 'baja') prioridad = 'media';
      }
      
      if (!material.fechaUltimaRevision && material.fechaAdquisicion) {
        const fechaAdq = convertirTimestampADate(material.fechaAdquisicion);
        if (fechaAdq) {
          const diasSinRevision = Math.floor((Date.now() - fechaAdq.getTime()) / (1000 * 60 * 60 * 24));
          if (diasSinRevision > 365) {
            problemas.push('Sin revisión por más de un año');
            if (prioridad === 'baja') prioridad = 'media';
          }
        }
      }

      // Problemas de baja prioridad
      if (!material.nombre || material.nombre.trim() === '') {
        problemas.push('Sin nombre');
      }
      if (!material.fechaAdquisicion) {
        problemas.push('Sin fecha de adquisición');
      }

      return problemas.length > 0 ? {
        material,
        problemas,
        prioridad
      } : null;
    })
    .filter((item): item is MaterialProblematico => item !== null)
    .sort((a, b) => {
      const prioridadOrder = { alta: 3, media: 2, baja: 1 };
      return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
    });
};

const generarEventosRecientes = (materiales: Material[]): EventoMaterial[] => {
  const eventos: EventoMaterial[] = [];
    // Generar eventos simulados basados en los materiales
  materiales.forEach(material => {
    if (material.fechaCreacion) {
      const fechaCreacion = convertirTimestampADate(material.fechaCreacion);
      if (fechaCreacion) {
        eventos.push({
          id: `creacion-${material.id}`,
          tipo: 'creacion',
          materialId: material.id,
          materialNombre: material.nombre,
          fecha: fechaCreacion,
          descripcion: `Material ${material.nombre} agregado al inventario`
        });
      }
    }
    
    if (material.fechaUltimaRevision) {
      const fechaRevision = convertirTimestampADate(material.fechaUltimaRevision);
      if (fechaRevision) {
        eventos.push({
          id: `revision-${material.id}`,          tipo: 'revision',
          materialId: material.id,
          materialNombre: material.nombre,
          fecha: fechaRevision,
          descripcion: `Revisión realizada al material ${material.nombre}`
        });
      }
    }
  });
  
  return eventos
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 10); // Últimos 10 eventos
};

export const useDashboardMateriales = (añoInicial?: number) => {
  const toast = useToast();
  const añoActual = new Date().getFullYear();
  
  const [state, setState] = useState<DashboardMaterialesState>({
    añoSeleccionado: añoInicial || añoActual,
    estadisticas: null,
    eventosRecientes: [],
    materiales: [],
    materialesProblematicos: [],
    comparacionAños: [],
    cargando: false,
    error: null,
    reporteTexto: ''
  });

  // Función para cargar datos
  const cargarDatos = useCallback(async (mostrarToast = true) => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    
    try {
      console.log('🔄 Cargando datos de materiales...');
      
      const materiales = await listarMateriales();
      const estadisticas = calcularEstadisticas(materiales);
      const materialesProblematicos = identificarMaterialesProblematicos(materiales);
      const eventosRecientes = generarEventosRecientes(materiales);
      
      setState(prev => ({
        ...prev,
        materiales,
        estadisticas,
        materialesProblematicos,
        eventosRecientes,
        cargando: false
      }));
      
      if (mostrarToast) {
        toast({
          title: "Datos actualizados",
          description: `Se cargaron ${materiales.length} materiales`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      
      console.log('✅ Datos de materiales cargados:', {
        total: materiales.length,
        problematicos: materialesProblematicos.length
      });
      
    } catch (error) {
      console.error('❌ Error cargando datos de materiales:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar los datos de materiales',
        cargando: false
      }));
      
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar los datos de materiales",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Función para generar reporte
  const generarReporte = useCallback(async (tipo: TipoReporteMaterial) => {
    setState(prev => ({ ...prev, cargando: true }));
    
    try {
      const { estadisticas, materiales, materialesProblematicos } = state;
      
      let reporte = '';
      
      switch (tipo) {
        case 'inventario-completo':
          reporte = `REPORTE COMPLETO DE INVENTARIO - ${state.añoSeleccionado}
==========================================

RESUMEN GENERAL:
- Total de materiales: ${estadisticas?.totalMateriales || 0}
- Materiales disponibles: ${estadisticas?.materialesDisponibles || 0}
- Materiales prestados: ${estadisticas?.materialesPrestados || 0}
- Materiales en mantenimiento: ${estadisticas?.materialesMantenimiento || 0}
- Disponibilidad: ${estadisticas?.porcentajeDisponibilidad.toFixed(1) || 0}%

DISTRIBUCIÓN POR TIPO:
- Cuerdas: ${estadisticas?.materialesPorTipo.cuerda || 0}
- Anclajes: ${estadisticas?.materialesPorTipo.anclaje || 0}
- Varios: ${estadisticas?.materialesPorTipo.varios || 0}

VALOR DEL INVENTARIO:
- Valor total: $${estadisticas?.valorTotalInventario.toFixed(2) || 0}

LISTADO COMPLETO:
${materiales.map(m => 
  `- ${m.nombre} (${m.tipo}) - Estado: ${m.estado}`
).join('\n')}`;
          break;

        case 'materiales-problematicos':
          reporte = `REPORTE DE MATERIALES PROBLEMÁTICOS - ${state.añoSeleccionado}
===========================================

TOTAL DE MATERIALES CON PROBLEMAS: ${materialesProblematicos.length}

${materialesProblematicos.map(mp => 
  `${mp.material.nombre} (${mp.material.tipo}) - Prioridad: ${mp.prioridad.toUpperCase()}
  Problemas: ${mp.problemas.join(', ')}`
).join('\n\n')}`;
          break;

        default:
          reporte = 'Tipo de reporte no implementado';
      }
      
      setState(prev => ({ ...prev, reporteTexto: reporte, cargando: false }));
      
      toast({
        title: "Reporte generado",
        description: "El reporte se ha generado correctamente",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      setState(prev => ({ ...prev, cargando: false }));
      
      toast({
        title: "Error al generar reporte",
        description: "No se pudo generar el reporte",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [state, toast]);

  // Cargar datos al inicializar
  useEffect(() => {
    cargarDatos(false);
  }, [cargarDatos]);

  // Años disponibles (simulado)
  const añosDisponibles = Array.from({ length: 5 }, (_, i) => añoActual - i);

  return {
    state,
    actions: {
      cargarDatos,
      generarReporte,
      setAñoSeleccionado: (año: number) => 
        setState(prev => ({ ...prev, añoSeleccionado: año }))
    },
    añosDisponibles
  };
};
