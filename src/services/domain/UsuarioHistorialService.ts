/**
 * Servicio para el seguimiento de usuarios por años
 * Gestiona el historial, estadísticas, estados de aprobación y actividad de usuarios
 */
import { 
  EventoUsuario, 
  ResumenAnualUsuarios, 
  EstadisticasAnualesUsuarios, 
  FiltroHistorialUsuarios,
  TipoEventoUsuario,
  EstadoAprobacion,
  EstadoActividad,
  UsuarioProblematico,
  GravedadIncidenciaUsuario
} from '../../types/usuarioHistorial';
import { Usuario } from '../../types/usuario';
import { usuarioHistorialRepository } from '../../repositories/UsuarioHistorialRepository';
import { Timestamp } from 'firebase/firestore';
import { startOfYear, endOfYear, format, differenceInDays, subMonths, isWithinInterval } from 'date-fns';
import { logger } from '../../utils/loggerUtils';

export class UsuarioHistorialService {
  private readonly MESES_INACTIVIDAD = 6; // 6 meses para considerar inactivo
  private readonly MINIMO_ACTIVIDADES_ACTIVO = 1; // Mínimo 1 actividad para ser activo

  /**
   * Registrar un evento en el historial de un usuario
   */
  async registrarEvento(evento: Omit<EventoUsuario, 'id' | 'fechaRegistro' | 'año' | 'mes'>): Promise<string> {
    const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
    
    const eventoCompleto: Omit<EventoUsuario, 'id'> = {
      ...evento,
      año: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      fechaRegistro: Timestamp.now()
    };
    
    const nuevoEvento = await usuarioHistorialRepository.create(eventoCompleto);
    
    // Actualizar estadísticas del año automáticamente
    await this.actualizarResumenAnual(evento.usuarioId, fecha.getFullYear());
    
    console.log(`👤 Evento registrado: ${evento.tipoEvento} para usuario ${evento.nombreUsuario}`);
    return nuevoEvento.id || '';
  }
  /**
   * Registrar múltiples eventos (para operaciones en bulk)
   */
  async registrarEventosBulk(eventos: Omit<EventoUsuario, 'id' | 'fechaRegistro' | 'año' | 'mes'>[]): Promise<string[]> {
    const eventosCompletos = eventos.map(evento => {
      const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
      return {
        ...evento,
        año: fecha.getFullYear(),
        mes: fecha.getMonth() + 1,
        fechaRegistro: Timestamp.now()
      };
    });
    
    const ids = await usuarioHistorialRepository.registrarEventosBulk(eventosCompletos);

    // Actualizar estadísticas para todos los años afectados
    const añosAfectados = Array.from(new Set(eventosCompletos.map(e => e.año)));
    for (const año of añosAfectados) {
      await this.actualizarResumenAnual('bulk-update', año);
    }
    
    console.log(`👥 ${eventos.length} eventos de usuarios registrados en bulk`);
    return ids;
  }

  /**
   * Registrar múltiples eventos y devolver los eventos creados para cálculo inmediato de estadísticas
   */
  async registrarEventosBulkConEventos(eventos: Omit<EventoUsuario, 'id' | 'fechaRegistro' | 'año' | 'mes'>[]): Promise<{ ids: string[], eventos: EventoUsuario[] }> {
    const eventosCompletos = eventos.map(evento => {
      const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
      return {
        ...evento,
        año: fecha.getFullYear(),
        mes: fecha.getMonth() + 1,
        fechaRegistro: Timestamp.now()
      };    });
    
    const ids = await usuarioHistorialRepository.registrarEventosBulk(eventosCompletos);

    // Crear eventos con IDs para devolver
    const eventosConIds: EventoUsuario[] = eventosCompletos.map((evento, index) => ({
      ...evento,
      id: ids[index]
    }));

    // Actualizar estadísticas para todos los años afectados usando los eventos recién creados
    const añosAfectados = Array.from(new Set(eventosCompletos.map((e: any) => e.año)));
    for (const año of añosAfectados) {
      // Por ahora usamos el método normal, pero los eventos ya están en memoria
      await this.actualizarResumenAnual('bulk-update', año as number);
    }
    
    console.log(`👥 ${eventos.length} eventos de usuarios registrados en bulk con eventos devueltos`);
    return { ids, eventos: eventosConIds };
  }
  /**
   * Calcular el estado de actividad de un usuario basado en participación en actividades
   */  async calcularEstadoActividad(usuarioId: string): Promise<EstadoActividad> {
    try {
      console.log(`🔍 Calculando estado de actividad para usuario: ${usuarioId}`);
      
      // Verificar si está suspendido primero
      const eventosSuspension = await usuarioHistorialRepository.obtenerEventosPorFiltros({
        usuarioId,
        tipoEvento: [TipoEventoUsuario.SUSPENSION],
        limit: 1
      });

      const eventosReactivacion = await usuarioHistorialRepository.obtenerEventosPorFiltros({
        usuarioId,
        tipoEvento: [TipoEventoUsuario.REACTIVACION],
        limit: 1
      });

      // Si hay suspensión más reciente que reactivación, está suspendido
      if (eventosSuspension.length > 0) {
        const ultimaSuspension = eventosSuspension[0];
        const ultimaReactivacion = eventosReactivacion[0];
        
        if (!ultimaReactivacion || ultimaSuspension.fecha > ultimaReactivacion.fecha) {
          console.log(`⚠️ Usuario ${usuarioId} está suspendido`);
          return EstadoActividad.SUSPENDIDO;
        }
      }

      // Calcular actividad basada en participación real en actividades
      const fechaLimite = subMonths(new Date(), this.MESES_INACTIVIDAD);
      console.log(`📅 Buscando actividades desde: ${fechaLimite.toISOString()}`);
      
      // Importar el servicio de actividades dinámicamente para evitar dependencias circulares
      const { listarActividades } = await import('../actividadService');
      const actividades = await listarActividades();
      console.log(`📋 Total de actividades en el sistema: ${actividades.length}`);
      
      // Filtrar actividades donde el usuario ha participado en los últimos 6 meses
      const actividadesRecientes = actividades.filter(actividad => {
        // Verificar si el usuario participa en la actividad
        const esParticipante = actividad.participanteIds?.includes(usuarioId);
        const esCreador = actividad.creadorId === usuarioId;
        const esResponsableActividad = actividad.responsableActividadId === usuarioId;
        const esResponsableMaterial = actividad.responsableMaterialId === usuarioId;
        
        const participa = esParticipante || esCreador || esResponsableActividad || esResponsableMaterial;
        
        if (!participa) return false;        // Verificar si la actividad es dentro del período de actividad
        let fechaActividad: Date;
        if (actividad.fechaInicio instanceof Date) {
          fechaActividad = actividad.fechaInicio;
        } else if (actividad.fechaInicio && typeof (actividad.fechaInicio as any)?.toDate === 'function') {
          fechaActividad = (actividad.fechaInicio as any).toDate();
        } else {
          // Fallback para otros tipos de fecha
          fechaActividad = new Date(actividad.fechaInicio as unknown as string);
        }
          
        const esDentroDelPeriodo = fechaActividad >= fechaLimite;
        
        if (participa && esDentroDelPeriodo) {
          console.log(`🎯 Actividad válida encontrada para ${usuarioId}: "${actividad.nombre}" (${fechaActividad.toISOString().split('T')[0]}) - Rol: ${esCreador ? 'Creador' : esResponsableActividad ? 'Resp. Actividad' : esResponsableMaterial ? 'Resp. Material' : 'Participante'}`);
        }
        
        return esDentroDelPeriodo;
      });
      
      console.log(`📊 Usuario ${usuarioId}: ${actividadesRecientes.length} actividades en últimos ${this.MESES_INACTIVIDAD} meses de ${actividades.length} total`);

      // Determinar actividad basada en participación
      if (actividadesRecientes.length >= this.MINIMO_ACTIVIDADES_ACTIVO) {
        console.log(`✅ Usuario ${usuarioId} está ACTIVO (${actividadesRecientes.length} actividades válidas)`);
        return EstadoActividad.ACTIVO;
      } else {
        console.log(`💤 Usuario ${usuarioId} está INACTIVO (${actividadesRecientes.length} actividades válidas, mínimo requerido: ${this.MINIMO_ACTIVIDADES_ACTIVO})`);
        return EstadoActividad.INACTIVO;
      }
      
    } catch (error) {
      console.error(`❌ Error al calcular estado de actividad para usuario ${usuarioId}:`, error);
      return EstadoActividad.INACTIVO;
    }
  }

  /**
   * Actualizar automáticamente el estado de un usuario
   */
  async actualizarEstadoUsuario(usuarioId: string, usuario: Usuario): Promise<{
    estadoAprobacion: EstadoAprobacion;
    estadoActividad: EstadoActividad;
    cambios: string[];
  }> {
    const cambios: string[] = [];
    let nuevoEstadoAprobacion = usuario.estadoAprobacion;
    let nuevoEstadoActividad = await this.calcularEstadoActividad(usuarioId);

    // Verificar cambios en estado de actividad
    if (nuevoEstadoActividad !== usuario.estadoActividad) {
      cambios.push(`Estado de actividad: ${usuario.estadoActividad} → ${nuevoEstadoActividad}`);
      
      // Registrar evento del cambio
      await this.registrarEvento({
        usuarioId,
        nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
        emailUsuario: usuario.email,
        tipoEvento: nuevoEstadoActividad === EstadoActividad.ACTIVO 
          ? TipoEventoUsuario.ACTIVACION 
          : TipoEventoUsuario.DESACTIVACION,
        descripcion: `Usuario cambió a estado: ${nuevoEstadoActividad}`,
        fecha: new Date(),
        observaciones: `Cambio automático basado en participación en actividades`
      });
    }

    return {
      estadoAprobacion: nuevoEstadoAprobacion,
      estadoActividad: nuevoEstadoActividad,
      cambios
    };
  }
  /**
   * Obtener estadísticas anuales de usuarios
   */  async obtenerEstadisticasAnuales(año: number): Promise<EstadisticasAnualesUsuarios> {
    console.log(`🔍 [UsuarioHistorialService] Obteniendo estadísticas para año: ${año}`);
    
    try {
      const resultado = await this.calcularEstadisticasAnuales(año, null, null);
      console.log(`✅ [UsuarioHistorialService] Estadísticas obtenidas exitosamente para año ${año}`);
      return resultado;
    } catch (error) {
      console.error(`❌ [UsuarioHistorialService] Error obteniendo estadísticas para año ${año}:`, error);
      throw error;
    }
  }

  /**
   * Calcular estadísticas anuales completas
   */  private async calcularEstadisticasAnuales(
    año: number, 
    eventosPrecalculados?: EventoUsuario[] | null,
    resumenAnterior?: EstadisticasAnualesUsuarios | null
  ): Promise<EstadisticasAnualesUsuarios> {
    
    console.log(`🔍 [UsuarioHistorialService] Calculando estadísticas para año: ${año}`);
      try {
      console.log(`🔍 [UsuarioHistorialService] Obteniendo eventos para año ${año}...`);
      
      let eventos = eventosPrecalculados;
      
      if (!eventos) {
        // Intentar obtener eventos con reintentos para problemas de consistencia eventual
        let intentos = 0;
        const maxIntentos = 3;
        
        while (intentos < maxIntentos) {
          try {
            eventos = await usuarioHistorialRepository.obtenerEventosPorAño(año);
            console.log(`📊 [UsuarioHistorialService] Intento ${intentos + 1}: Eventos encontrados: ${eventos.length}`);
            
            if (eventos.length > 0) {
              break; // Eventos encontrados, salir del bucle
            }
            
            if (intentos < maxIntentos - 1) {
              console.log(`⏳ [UsuarioHistorialService] Esperando 2s antes del siguiente intento...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (repoError) {
            console.error(`❌ [UsuarioHistorialService] Error en intento ${intentos + 1}:`, repoError);
            if (intentos === maxIntentos - 1) {
              throw repoError;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          intentos++;
        }
      }
      
      console.log(`📊 [UsuarioHistorialService] Eventos finales encontrados: ${eventos?.length || 0}`);
      
      if (!eventos || eventos.length === 0) {
        console.log(`⚠️ [UsuarioHistorialService] No hay eventos para el año ${año}, devolviendo estadísticas vacías`);
        return {
          año,
          totalEventos: 0,
          usuariosRegistrados: 0,
          usuariosAprobados: 0,
          usuariosRechazados: 0,
          usuariosSuspendidos: 0,
          usuariosActivos: 0,
          usuariosInactivos: 0,
          tasaAprobacion: 0,
          tasaActividad: 0,
          tasaRetencion: 0,
          eventosPorMes: Array(12).fill(0),
          eventosPorTipo: {} as Record<TipoEventoUsuario, number>,
          usuariosPorRol: {},
          usuariosProblematicos: [],
          tiempoPromedioAprobacion: 0,
          participacionPromedio: 0
        };
      }
    
    // Inicializar estadísticas
    const estadisticas: EstadisticasAnualesUsuarios = {
      año,
      totalEventos: eventos.length,
      usuariosRegistrados: 0,
      usuariosAprobados: 0,
      usuariosRechazados: 0,
      usuariosSuspendidos: 0,
      usuariosActivos: 0,
      usuariosInactivos: 0,
      tasaAprobacion: 0,
      tasaActividad: 0,
      tasaRetencion: 0,
      eventosPorMes: Array(12).fill(0),
      eventosPorTipo: {} as Record<TipoEventoUsuario, number>,
      usuariosPorRol: {},
      usuariosProblematicos: [],
      tiempoPromedioAprobacion: 0,
      participacionPromedio: 0
    };

    // Contadores por tipo de evento
    const contadores = {
      registros: new Set<string>(),
      aprobaciones: new Set<string>(),
      rechazos: new Set<string>(),
      suspensiones: new Set<string>(),
      activaciones: new Set<string>(),
      desactivaciones: new Set<string>()
    };

    // Procesar eventos
    for (const evento of eventos) {
      // Contar por mes (0-based a 1-based)
      if (evento.mes >= 1 && evento.mes <= 12) {
        estadisticas.eventosPorMes[evento.mes - 1]++;
      }

      // Contar por tipo
      estadisticas.eventosPorTipo[evento.tipoEvento] = 
        (estadisticas.eventosPorTipo[evento.tipoEvento] || 0) + 1;

      // Trackear usuarios únicos por tipo de evento
      switch (evento.tipoEvento) {
        case TipoEventoUsuario.REGISTRO:
          contadores.registros.add(evento.usuarioId);
          break;
        case TipoEventoUsuario.APROBACION:
          contadores.aprobaciones.add(evento.usuarioId);
          break;
        case TipoEventoUsuario.RECHAZO:
          contadores.rechazos.add(evento.usuarioId);
          break;
        case TipoEventoUsuario.SUSPENSION:
          contadores.suspensiones.add(evento.usuarioId);
          break;
        case TipoEventoUsuario.ACTIVACION:
          contadores.activaciones.add(evento.usuarioId);
          break;
        case TipoEventoUsuario.DESACTIVACION:
          contadores.desactivaciones.add(evento.usuarioId);
          break;
      }
    }

    // Calcular totales
    estadisticas.usuariosRegistrados = contadores.registros.size;
    estadisticas.usuariosAprobados = contadores.aprobaciones.size;
    estadisticas.usuariosRechazados = contadores.rechazos.size;
    estadisticas.usuariosSuspendidos = contadores.suspensiones.size;
    estadisticas.usuariosActivos = contadores.activaciones.size;
    estadisticas.usuariosInactivos = contadores.desactivaciones.size;

    // Calcular tasas
    if (estadisticas.usuariosRegistrados > 0) {
      estadisticas.tasaAprobacion = 
        (estadisticas.usuariosAprobados / estadisticas.usuariosRegistrados) * 100;
    }

    const totalUsuariosActividad = estadisticas.usuariosActivos + estadisticas.usuariosInactivos;
    if (totalUsuariosActividad > 0) {
      estadisticas.tasaActividad = 
        (estadisticas.usuariosActivos / totalUsuariosActividad) * 100;
    }

    // Calcular usuarios problemáticos
    estadisticas.usuariosProblematicos = await this.obtenerUsuariosProblematicos(año);

    // Comparación con año anterior
    if (resumenAnterior) {
      estadisticas.crecimientoUsuarios = 
        ((estadisticas.usuariosRegistrados - (resumenAnterior.usuariosRegistrados || 0)) / 
         (resumenAnterior.usuariosRegistrados || 1)) * 100;
      
      estadisticas.cambioTasaActividad = 
        estadisticas.tasaActividad - (resumenAnterior.tasaActividad || 0);

      if (estadisticas.crecimientoUsuarios > 5) {
        estadisticas.tendencia = 'creciente';
      } else if (estadisticas.crecimientoUsuarios < -5) {
        estadisticas.tendencia = 'decreciente';
      } else {
        estadisticas.tendencia = 'estable';
      }    }    console.log(`✅ [UsuarioHistorialService] Estadísticas calculadas para año ${año}:`, {
      totalEventos: estadisticas.totalEventos,
      usuariosRegistrados: estadisticas.usuariosRegistrados,
      usuariosAprobados: estadisticas.usuariosAprobados
    });

    return estadisticas;
    
    } catch (error) {
      console.error(`❌ [UsuarioHistorialService] Error calculando estadísticas para año ${año}:`, error);
      throw error;
    }
  }

  /**
   * Obtener usuarios problemáticos del año
   */
  async obtenerUsuariosProblematicos(año: number, umbralEventos: number = 3): Promise<UsuarioProblematico[]> {
    const eventos = await usuarioHistorialRepository.obtenerEventosPorAño(año);
    const usuariosEventos = new Map<string, EventoUsuario[]>();

    // Agrupar eventos por usuario
    for (const evento of eventos) {
      if (!usuariosEventos.has(evento.usuarioId)) {
        usuariosEventos.set(evento.usuarioId, []);
      }
      usuariosEventos.get(evento.usuarioId)!.push(evento);
    }

    const problematicos: UsuarioProblematico[] = [];    for (const [usuarioId, eventosUsuario] of Array.from(usuariosEventos.entries())) {
      // Solo considerar problemáticos si tienen eventos críticos o muchos eventos
      const eventosCriticos = eventosUsuario.filter((e: EventoUsuario) => 
        e.tipoEvento === TipoEventoUsuario.SUSPENSION ||
        e.tipoEvento === TipoEventoUsuario.RECHAZO ||
        e.gravedad === GravedadIncidenciaUsuario.ALTA ||
        e.gravedad === GravedadIncidenciaUsuario.CRITICA
      );

      if (eventosUsuario.length >= umbralEventos || eventosCriticos.length > 0) {
        const ultimoEvento = eventosUsuario.sort((a: EventoUsuario, b: EventoUsuario) => {
          const fechaA = a.fecha instanceof Timestamp ? a.fecha.toDate() : new Date(a.fecha);
          const fechaB = b.fecha instanceof Timestamp ? b.fecha.toDate() : new Date(b.fecha);
          return fechaB.getTime() - fechaA.getTime();
        })[0];

        const tiposEventos = {} as Record<TipoEventoUsuario, number>;
        for (const evento of eventosUsuario) {
          tiposEventos[evento.tipoEvento] = (tiposEventos[evento.tipoEvento] || 0) + 1;
        }

        const gravedad = eventosCriticos.length > 0 
          ? GravedadIncidenciaUsuario.ALTA 
          : eventosUsuario.length > 5 
            ? GravedadIncidenciaUsuario.MEDIA 
            : GravedadIncidenciaUsuario.BAJA;

        problematicos.push({
          usuarioId,
          nombreUsuario: ultimoEvento.nombreUsuario,
          emailUsuario: ultimoEvento.emailUsuario,
          totalEventos: eventosUsuario.length,
          tiposEventos,
          ultimoEvento: ultimoEvento.fecha,
          gravedad,
          recomendaciones: this.generarRecomendaciones(eventosUsuario, gravedad),
          estadoActual: {
            aprobacion: EstadoAprobacion.PENDIENTE, // Se actualizaría con datos reales
            actividad: EstadoActividad.INACTIVO,
            rol: 'socio'
          }
        });
      }
    }

    return problematicos.sort((a, b) => b.totalEventos - a.totalEventos);
  }

  /**
   * Generar recomendaciones para usuario problemático
   */
  private generarRecomendaciones(eventos: EventoUsuario[], gravedad: GravedadIncidenciaUsuario): string[] {
    const recomendaciones: string[] = [];
    const tiposEventos = eventos.map(e => e.tipoEvento);

    if (tiposEventos.includes(TipoEventoUsuario.SUSPENSION)) {
      recomendaciones.push('Revisar motivos de suspensión');
      recomendaciones.push('Evaluar posible reactivación o medidas correctivas');
    }

    if (tiposEventos.includes(TipoEventoUsuario.RECHAZO)) {
      recomendaciones.push('Analizar criterios de rechazo');
      recomendaciones.push('Considerar segunda evaluación si es apropiado');
    }

    const inactividades = tiposEventos.filter(t => t === TipoEventoUsuario.DESACTIVACION).length;
    if (inactividades > 1) {
      recomendaciones.push('Usuario con múltiples períodos de inactividad');
      recomendaciones.push('Implementar programa de reenganche');
    }

    if (gravedad === GravedadIncidenciaUsuario.CRITICA) {
      recomendaciones.push('Requiere atención inmediata del administrador');
      recomendaciones.push('Evaluar posibles medidas disciplinarias');
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push('Monitorear evolución del usuario');
    }

    return recomendaciones;
  }

  /**
   * Generar reporte anual de usuarios
   */
  async generarReporteAnual(año: number): Promise<string> {
    const estadisticas = await this.obtenerEstadisticasAnuales(año);
    const fechaGeneracion = format(new Date(), "dd/MM/yyyy 'a las' HH:mm");

    let reporte = `
═══════════════════════════════════════════════════════════════
                REPORTE ANUAL DE USUARIOS - ${año}
═══════════════════════════════════════════════════════════════

📊 RESUMEN EJECUTIVO
───────────────────────────────────────────────────────────────
• Total de eventos registrados: ${estadisticas.totalEventos}
• Usuarios registrados: ${estadisticas.usuariosRegistrados}
• Usuarios aprobados: ${estadisticas.usuariosAprobados}
• Usuarios rechazados: ${estadisticas.usuariosRechazados}
• Tasa de aprobación: ${estadisticas.tasaAprobacion.toFixed(1)}%

👥 ESTADO DE ACTIVIDAD
───────────────────────────────────────────────────────────────
• Usuarios activos: ${estadisticas.usuariosActivos}
• Usuarios inactivos: ${estadisticas.usuariosInactivos}
• Usuarios suspendidos: ${estadisticas.usuariosSuspendidos}
• Tasa de actividad: ${estadisticas.tasaActividad.toFixed(1)}%

📈 DISTRIBUCIÓN MENSUAL
───────────────────────────────────────────────────────────────`;

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    for (let i = 0; i < 12; i++) {
      if (estadisticas.eventosPorMes[i] > 0) {
        reporte += `\n• ${meses[i]}: ${estadisticas.eventosPorMes[i]} eventos`;
      }
    }

    reporte += `\n\n🔍 USUARIOS PROBLEMÁTICOS
───────────────────────────────────────────────────────────────`;

    if (estadisticas.usuariosProblematicos.length === 0) {
      reporte += `\n✅ No se identificaron usuarios problemáticos este año.`;
    } else {
      for (const usuario of estadisticas.usuariosProblematicos.slice(0, 5)) {
        reporte += `
• ${usuario.nombreUsuario} (${usuario.emailUsuario})
  - Total eventos: ${usuario.totalEventos}
  - Gravedad: ${usuario.gravedad}
  - Estado: ${usuario.estadoActual.aprobacion}/${usuario.estadoActual.actividad}`;
      }
    }

    reporte += `\n\n📋 EVENTOS POR TIPO
───────────────────────────────────────────────────────────────`;
    
    for (const [tipo, cantidad] of Object.entries(estadisticas.eventosPorTipo)) {
      if (cantidad > 0) {
        reporte += `\n• ${tipo}: ${cantidad} eventos`;
      }
    }

    if (estadisticas.tendencia) {
      reporte += `\n\n📊 TENDENCIAS
───────────────────────────────────────────────────────────────
• Crecimiento de usuarios: ${estadisticas.crecimientoUsuarios?.toFixed(1)}%
• Cambio en tasa de actividad: ${estadisticas.cambioTasaActividad?.toFixed(1)}%
• Tendencia general: ${estadisticas.tendencia}`;
    }

    reporte += `\n\n═══════════════════════════════════════════════════════════════
Reporte generado el ${fechaGeneracion}
Sistema de Seguimiento de Usuarios - AppMaterial
═══════════════════════════════════════════════════════════════`;

    return reporte;
  }

  /**
   * Comparar estadísticas entre años
   */
  async compararAños(añoActual: number, añoAnterior: number): Promise<{
    añoActual: EstadisticasAnualesUsuarios;
    añoAnterior: EstadisticasAnualesUsuarios;
    comparacion: {
      crecimientoUsuarios: number;
      cambioTasaAprobacion: number;
      cambioTasaActividad: number;
      cambioEventos: number;
      tendencia: string;
    };
  }> {
    const [statsActual, statsAnterior] = await Promise.all([
      this.obtenerEstadisticasAnuales(añoActual),
      this.obtenerEstadisticasAnuales(añoAnterior)
    ]);

    const comparacion = {
      crecimientoUsuarios: 
        ((statsActual.usuariosRegistrados - statsAnterior.usuariosRegistrados) / 
         (statsAnterior.usuariosRegistrados || 1)) * 100,
      cambioTasaAprobacion: statsActual.tasaAprobacion - statsAnterior.tasaAprobacion,
      cambioTasaActividad: statsActual.tasaActividad - statsAnterior.tasaActividad,
      cambioEventos: 
        ((statsActual.totalEventos - statsAnterior.totalEventos) / 
         (statsAnterior.totalEventos || 1)) * 100,
      tendencia: ''
    };

    // Determinar tendencia general
    if (comparacion.crecimientoUsuarios > 10 && comparacion.cambioTasaActividad > 5) {
      comparacion.tendencia = 'Crecimiento saludable';
    } else if (comparacion.crecimientoUsuarios > 0 && comparacion.cambioTasaActividad > 0) {
      comparacion.tendencia = 'Crecimiento moderado';
    } else if (comparacion.crecimientoUsuarios < -10 || comparacion.cambioTasaActividad < -10) {
      comparacion.tendencia = 'Declive preocupante';
    } else {
      comparacion.tendencia = 'Estabilidad';
    }

    return {
      añoActual: statsActual,
      añoAnterior: statsAnterior,
      comparacion
    };
  }

  /**
   * Actualizar resumen anual (llamado automáticamente)
   */
  private async actualizarResumenAnual(usuarioId: string, año: number): Promise<void> {
    try {
      const estadisticas = await this.calcularEstadisticasAnuales(año);
      
      const resumen: Omit<ResumenAnualUsuarios, 'id'> = {
        año,
        totalUsuarios: estadisticas.usuariosRegistrados + estadisticas.usuariosAprobados,
        usuariosNuevos: estadisticas.usuariosRegistrados,
        usuariosAprobados: estadisticas.usuariosAprobados,
        usuariosRechazados: estadisticas.usuariosRechazados,
        usuariosSuspendidos: estadisticas.usuariosSuspendidos,
        usuariosEliminados: estadisticas.eventosPorTipo[TipoEventoUsuario.ELIMINACION] || 0,
        usuariosPendientes: 0, // Se calcularía con datos reales
        tasaAprobacion: estadisticas.tasaAprobacion,
        usuariosActivos: estadisticas.usuariosActivos,
        usuariosInactivos: estadisticas.usuariosInactivos,
        tasaActividad: estadisticas.tasaActividad,
        distribucuonRoles: estadisticas.usuariosPorRol as any,
        registrosPorMes: estadisticas.eventosPorMes,
        aprobaciónPorMes: Array(12).fill(0), // Se calcularía específicamente
        suspesionesPorMes: Array(12).fill(0), // Se calcularía específicamente
        eventosPorTipo: estadisticas.eventosPorTipo,
        usuariosProblematicos: estadisticas.usuariosProblematicos,
        fechaCalculo: Timestamp.now()
      };

      await usuarioHistorialRepository.guardarResumenAnual(resumen);
      
    } catch (error) {
      console.error('Error al actualizar resumen anual de usuarios:', error);
    }
  }

  /**
   * Obtiene los eventos más recientes
   */
  async obtenerEventosRecientes(limit: number = 50): Promise<EventoUsuario[]> {
    try {
      const eventos = await usuarioHistorialRepository.obtenerEventosPorFiltros({
        limit,
        // Ordenar por fecha de creación descendente para obtener los más recientes
      });

      return eventos;
    } catch (error) {
      logger.error('Error al obtener eventos recientes:', error);
      throw error;
    }
  }

  /**
   * Recalcular y actualizar el estado de actividad de todos los usuarios
   * Útil para corregir estados incorrectos o después de cambios en la lógica
   */
  async recalcularEstadosActividad(): Promise<{ 
    usuariosActualizados: number, 
    cambios: Array<{ uid: string, nombre: string, estadoAnterior: string, estadoNuevo: string }>
  }> {
    try {
      console.log('🔄 Iniciando recálculo de estados de actividad para todos los usuarios...');
      
      // Obtener todos los usuarios activos
      const { listarUsuarios } = await import('../usuarioService');
      const usuarios = await listarUsuarios();
      
      const cambios: Array<{ uid: string, nombre: string, estadoAnterior: string, estadoNuevo: string }> = [];
      let usuariosActualizados = 0;
      
      for (const usuario of usuarios) {
        try {
          const estadoAnterior = usuario.estadoActividad;
          const estadoNuevo = await this.calcularEstadoActividad(usuario.uid);
          
          // Solo actualizar si hay cambio
          if (estadoAnterior !== estadoNuevo) {            // Actualizar en la base de datos
            const { actualizarUsuario } = await import('../usuarioService');
            await actualizarUsuario(usuario.uid, { 
              estadoActividad: estadoNuevo 
            });
            
            // Registrar el cambio de estado
            await this.registrarEvento({
              usuarioId: usuario.uid,
              nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
              emailUsuario: usuario.email,
              tipoEvento: estadoNuevo === EstadoActividad.ACTIVO 
                ? TipoEventoUsuario.REACTIVACION 
                : TipoEventoUsuario.DESACTIVACION,
              descripcion: `Estado de actividad actualizado automáticamente: ${estadoAnterior} → ${estadoNuevo}`,
              fecha: new Date(),
              responsableId: 'sistema',
              responsableNombre: 'Sistema de Recálculo Automático'
            });
            
            cambios.push({
              uid: usuario.uid,
              nombre: `${usuario.nombre} ${usuario.apellidos}`,
              estadoAnterior: estadoAnterior || 'no definido',
              estadoNuevo
            });
            
            usuariosActualizados++;
            console.log(`✅ Usuario ${usuario.nombre}: ${estadoAnterior} → ${estadoNuevo}`);
          }
        } catch (error) {
          console.error(`❌ Error procesando usuario ${usuario.email}:`, error);
        }
      }
      
      console.log(`🎉 Recálculo completado: ${usuariosActualizados} usuarios actualizados de ${usuarios.length} total`);
      
      if (cambios.length > 0) {
        console.log('\n📋 Resumen de cambios:');
        cambios.forEach(cambio => {
          console.log(`  • ${cambio.nombre}: ${cambio.estadoAnterior} → ${cambio.estadoNuevo}`);
        });
      }
      
      return { usuariosActualizados, cambios };
      
    } catch (error) {
      console.error('❌ Error en recálculo de estados de actividad:', error);
      throw error;
    }
  }

  /**
   * Diagnosticar usuarios que deberían estar activos pero aparecen como inactivos
   */
  async diagnosticarUsuariosInactivos(): Promise<{
    usuariosProblematicos: Array<{
      usuario: Usuario;
      problemas: string[];
      actividadesRecientes: number;
      estadoEsperado: EstadoActividad;
      estadoActual: EstadoActividad;
    }>;
    resumen: {
      totalUsuarios: number;
      usuariosConProblemas: number;
      usuariosAprobadosPeroInactivos: number;
      usuariosConActividadPeroInactivos: number;
    };
  }> {
    console.log('🔍 Iniciando diagnóstico de usuarios inactivos...');
    
    const { listarUsuarios } = await import('../usuarioService');
    const usuarios = await listarUsuarios();
    const { listarActividades } = await import('../actividadService');
    const actividades = await listarActividades();
    
    const fechaLimite = subMonths(new Date(), this.MESES_INACTIVIDAD);
    const usuariosProblematicos: any[] = [];
    
    let usuariosAprobadosPeroInactivos = 0;
    let usuariosConActividadPeroInactivos = 0;
    
    for (const usuario of usuarios) {
      const problemas: string[] = [];
      
      // Contar actividades del usuario
      const actividadesUsuario = actividades.filter(actividad => {
        const participa = actividad.participanteIds?.includes(usuario.uid) ||
                         actividad.creadorId === usuario.uid ||
                         actividad.responsableActividadId === usuario.uid ||
                         actividad.responsableMaterialId === usuario.uid;
        
        if (!participa) return false;
        
        let fechaActividad: Date;
        if (actividad.fechaInicio instanceof Date) {
          fechaActividad = actividad.fechaInicio;
        } else if (actividad.fechaInicio && typeof (actividad.fechaInicio as any)?.toDate === 'function') {
          fechaActividad = (actividad.fechaInicio as any).toDate();
        } else {
          fechaActividad = new Date(actividad.fechaInicio as unknown as string);
        }
        
        return fechaActividad >= fechaLimite;
      });
      
      const estadoEsperado = await this.calcularEstadoActividad(usuario.uid);
      const estadoActual = usuario.estadoActividad || EstadoActividad.INACTIVO;
      
      // Detectar problemas
      if (usuario.estadoAprobacion === EstadoAprobacion.APROBADO && usuario.estadoActividad === EstadoActividad.INACTIVO) {
        if (actividadesUsuario.length > 0) {
          problemas.push(`Usuario aprobado con ${actividadesUsuario.length} actividades recientes pero marcado como inactivo`);
          usuariosConActividadPeroInactivos++;
        } else {
          problemas.push('Usuario aprobado pero sin actividades recientes');
        }
        usuariosAprobadosPeroInactivos++;
      }
      
      if (estadoEsperado !== estadoActual) {
        problemas.push(`Estado actual (${estadoActual}) no coincide con el esperado (${estadoEsperado})`);
      }
      
      if (actividadesUsuario.length >= this.MINIMO_ACTIVIDADES_ACTIVO && usuario.estadoActividad === EstadoActividad.INACTIVO) {
        problemas.push(`Tiene ${actividadesUsuario.length} actividades pero está marcado como inactivo`);
      }
      
      if (problemas.length > 0) {
        usuariosProblematicos.push({
          usuario,
          problemas,
          actividadesRecientes: actividadesUsuario.length,
          estadoEsperado,
          estadoActual
        });
      }
    }
    
    const resumen = {
      totalUsuarios: usuarios.length,
      usuariosConProblemas: usuariosProblematicos.length,
      usuariosAprobadosPeroInactivos,
      usuariosConActividadPeroInactivos
    };
    
    console.log('📊 Diagnóstico completado:', resumen);
    
    return {
      usuariosProblematicos,
      resumen
    };
  }
}

// Instancia singleton del servicio
export const usuarioHistorialService = new UsuarioHistorialService();
