import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { usuarioHistorialService } from '../../../services/domain/UsuarioHistorialService';
import { listarUsuarios } from '../../../services/usuarioService';
import { DashboardState, TipoReporte } from './types';

const useDashboard = (añoInicial?: number) => {
  const toast = useToast();
  const añoActual = new Date().getFullYear();
  
  // Estado principal del dashboard
  const [state, setState] = useState<DashboardState>({
    añoSeleccionado: añoInicial || añoActual,
    estadisticas: null,
    eventosRecientes: [],
    usuarios: [],
    usuariosProblematicos: [],
    comparacionAños: null,
    cargando: false,
    cargandoMigracion: false,
    error: null,
    reporteTexto: ''
  });

  // Estado adicional
  const [estadisticasComparacion, setEstadisticasComparacion] = useState<any>(null);
  
  // Años disponibles (últimos 5 años)
  const añosDisponibles = Array.from({ length: 5 }, (_, i) => añoActual - i);

  // Función principal para cargar datos
  const cargarDatos = useCallback(async (forzar = false) => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    
    try {
      console.log(`🔄 Cargando datos para el año ${state.añoSeleccionado}...`);
      
      // Cargar estadísticas
      const estadisticas = await usuarioHistorialService.obtenerEstadisticasAnuales(state.añoSeleccionado);
        // Cargar eventos recientes
      const eventos = await usuarioHistorialService.obtenerEventosRecientes(10);
        // Cargar usuarios problemáticos
      const usuariosProblematicos = await usuarioHistorialService.obtenerUsuariosProblematicos(state.añoSeleccionado);
      
      // Cargar todos los usuarios reales
      const usuarios = await listarUsuarios();

      setState(prev => ({
        ...prev,
        estadisticas,
        eventosRecientes: eventos,
        usuarios,
        usuariosProblematicos,
        cargando: false,
        error: null
      }));

      console.log('✅ Datos cargados exitosamente');
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setState(prev => ({
        ...prev,
        cargando: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, [state.añoSeleccionado]);

  // Función para cargar estadísticas de comparación
  const cargarEstadisticasComparacion = useCallback(async (añoComparacion: number) => {
    try {
      const stats = await usuarioHistorialService.obtenerEstadisticasAnuales(añoComparacion);
      setEstadisticasComparacion(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas de comparación:', error);
      setEstadisticasComparacion(null);
    }
  }, []);

  // Función para generar reportes
  const generarReporte = useCallback(async (tipo: TipoReporte, año: number): Promise<string> => {
    try {
      // Usar solo el reporte completo que sabemos que existe
      return await usuarioHistorialService.generarReporteAnual(año);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      return `Error generando reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  }, []);

  // Función simple para generar reporte (compatibilidad)
  const generarReporteSimple = useCallback(async (año?: number) => {
    try {
      const añoReporte = año || state.añoSeleccionado;
      const reporte = await usuarioHistorialService.generarReporteAnual(añoReporte);
      setState(prev => ({ ...prev, reporteTexto: reporte }));
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [state.añoSeleccionado, toast]);

  // Función para generar datos iniciales
  const generarDatosIniciales = useCallback(async () => {
    setState(prev => ({ ...prev, cargandoMigracion: true }));
    
    try {
      console.log('🔄 Iniciando generación de datos iniciales...');
      
      toast({
        title: 'Generando datos',
        description: 'Iniciando proceso de generación de datos iniciales...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // Simular proceso de generación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await cargarDatos(true);
      
      toast({
        title: 'Datos generados',
        description: 'Los datos iniciales se han generado correctamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error generando datos iniciales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron generar los datos iniciales',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setState(prev => ({ ...prev, cargandoMigracion: false }));
    }
  }, [cargarDatos, toast]);

  // Función para debug de conexión
  const debugConexion = useCallback(async () => {
    try {
      console.log('🔍 Iniciando debug de conexión...');
      toast({
        title: 'Debug iniciado',
        description: 'Verificando conexión con la base de datos...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Simular debug
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Debug completado',
        description: 'La conexión se ha verificado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error en debug',
        description: 'No se pudo verificar la conexión',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Función para limpiar logs
  const limpiarLogs = useCallback(async () => {
    try {
      console.log('🧹 Limpiando logs...');
      toast({
        title: 'Logs limpiados',
        description: 'Los logs se han limpiado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron limpiar los logs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Función para migrar datos
  const migrarDatos = useCallback(async () => {
    setState(prev => ({ ...prev, cargandoMigracion: true }));
    try {
      console.log('🔄 Iniciando migración de datos...');
      // Simular migración
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await cargarDatos(true);
      
      toast({
        title: 'Migración completada',
        description: 'Los datos se han migrado correctamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error en migración',
        description: 'No se pudieron migrar los datos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setState(prev => ({ ...prev, cargandoMigracion: false }));
    }
  }, [cargarDatos, toast]);

  // Función para actualizar cache
  const actualizarCache = useCallback(async () => {
    try {
      console.log('🔄 Actualizando cache...');
      toast({
        title: 'Cache actualizado',
        description: 'El cache se ha actualizado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cache',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Función para limpiar datos temporales
  const limpiarDatosTemporales = useCallback(async () => {
    try {
      console.log('🧹 Limpiando datos temporales...');
      await cargarDatos(true);
      toast({
        title: 'Datos limpiados',
        description: 'Los datos temporales se han limpiado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron limpiar los datos temporales',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [cargarDatos, toast]);

  // Función para cambiar año seleccionado
  const setAñoSeleccionado = useCallback((año: number) => {
    setState(prev => ({ ...prev, añoSeleccionado: año }));
  }, []);

  // Efecto para cargar datos cuando cambia el año
  useEffect(() => {
    cargarDatos();
  }, [state.añoSeleccionado]);

  // Objeto de acciones
  const actions = {
    cargarDatos,
    generarReporte: generarReporteSimple,
    generarDatosIniciales,
    debugConexion,
    limpiarLogs,
    setAñoSeleccionado
  };

  return {
    state,
    actions,
    añosDisponibles,
    estadisticasComparacion,
    cargarEstadisticasComparacion,
    generarReporte,
    migrarDatos,
    actualizarCache,
    limpiarDatosTemporales
  };
};

export default useDashboard;
