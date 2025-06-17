/**
 * Servicio para el seguimiento de material por años
 * Gestiona el historial, estadísticas y reportes anuales de materiales
 */
import { 
  EventoMaterial, 
  ResumenAnualMaterial, 
  EstadisticasAnuales, 
  FiltroHistorial,
  TipoEventoMaterial,
  GravedadIncidencia
} from '../../types/materialHistorial';
import { Material } from '../../types/material';
import { materialHistorialRepository } from '../../repositories/MaterialHistorialRepository';
import { Timestamp } from 'firebase/firestore';
import { startOfYear, endOfYear, format, differenceInDays, isWithinInterval } from 'date-fns';

export class MaterialHistorialService {
  
  /**
   * Registrar un evento en el historial de un material
   */
  async registrarEvento(evento: Omit<EventoMaterial, 'id' | 'fechaRegistro' | 'año' | 'mes'>): Promise<string> {
    const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
    
    const eventoCompleto: Omit<EventoMaterial, 'id'> = {
      ...evento,
      año: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      fechaRegistro: Timestamp.now()
    };
    
    const nuevoEvento = await materialHistorialRepository.create(eventoCompleto);
      // Actualizar estadísticas del año automáticamente
    await this.actualizarResumenAnual(evento.materialId, fecha.getFullYear());
    
    console.log(`📝 Evento registrado: ${evento.tipoEvento} para material ${evento.nombreMaterial}`);
    return nuevoEvento.id || '';
  }

  /**
   * Registrar múltiples eventos (para operaciones en bulk)
   */
  async registrarEventosBulk(eventos: Omit<EventoMaterial, 'id' | 'fechaRegistro' | 'año' | 'mes'>[]): Promise<string[]> {
    const eventosCompletos = eventos.map(evento => {
      const fecha = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
      return {
        ...evento,
        año: fecha.getFullYear(),
        mes: fecha.getMonth() + 1,
        fechaRegistro: Timestamp.now()
      };
    });

    const nuevosEventos = await materialHistorialRepository.createMany(eventosCompletos);
      // Actualizar estadísticas de todos los años afectados
    const añosAfectados = new Set(eventosCompletos.map(e => e.año));
    const añosArray = Array.from(añosAfectados);
    for (const año of añosArray) {
      const materialesAfectados = new Set(eventosCompletos.filter(e => e.año === año).map(e => e.materialId));
      const materialesArray = Array.from(materialesAfectados);
      for (const materialId of materialesArray) {
        await this.actualizarResumenAnual(materialId, año);
      }
    }

    console.log(`📝 ${eventos.length} eventos registrados en bulk`);
    return nuevosEventos.map(e => e.id || '').filter(id => id !== '');
  }

  /**
   * Obtener historial de eventos con filtros
   */
  async obtenerHistorial(filtros: FiltroHistorial = {}): Promise<EventoMaterial[]> {
    const queryOptions: any = {
      orderBy: [{ field: 'fecha', direction: 'desc' }]
    };

    // Aplicar filtros
    const where: any[] = [];

    if (filtros.años && filtros.años.length > 0) {
      where.push({
        field: 'año',
        operator: 'in',
        value: filtros.años
      });
    }

    if (filtros.materiales && filtros.materiales.length > 0) {
      where.push({
        field: 'materialId',
        operator: 'in',
        value: filtros.materiales
      });
    }

    if (filtros.tipoEvento && filtros.tipoEvento.length > 0) {
      where.push({
        field: 'tipoEvento',
        operator: 'in',
        value: filtros.tipoEvento
      });
    }

    if (filtros.gravedad && filtros.gravedad.length > 0) {
      where.push({
        field: 'gravedad',
        operator: 'in',
        value: filtros.gravedad
      });
    }

    if (filtros.responsable) {
      where.push({
        field: 'usuarioResponsable',
        operator: '==',
        value: filtros.responsable
      });
    }

    if (filtros.conCosto) {
      where.push({
        field: 'costoAsociado',
        operator: '>',
        value: 0
      });
    }

    queryOptions.where = where;

    let eventos = await materialHistorialRepository.find(queryOptions);

    // Filtros adicionales que requieren procesamiento local
    if (filtros.fechaInicio || filtros.fechaFin) {
      eventos = eventos.filter(evento => {
        const fechaEvento = evento.fecha instanceof Date ? evento.fecha : evento.fecha.toDate();
        
        if (filtros.fechaInicio && fechaEvento < filtros.fechaInicio) return false;
        if (filtros.fechaFin && fechaEvento > filtros.fechaFin) return false;
        
        return true;
      });
    }

    return eventos;
  }

  /**
   * Obtener resumen anual de un material específico
   */
  async obtenerResumenAnualMaterial(materialId: string, año: number): Promise<ResumenAnualMaterial | null> {
    // Buscar si ya existe un resumen calculado
    const resumenExistente = await materialHistorialRepository.findResumenAnual(materialId, año);
    
    if (resumenExistente) {
      return resumenExistente;
    }

    // Si no existe, calcularlo
    return await this.calcularResumenAnual(materialId, año);
  }

  /**
   * Obtener estadísticas generales de un año
   */
  async obtenerEstadisticasAnuales(año: number): Promise<EstadisticasAnuales> {
    const eventos = await this.obtenerHistorial({ años: [año] });
    const resumenesMateriales = await materialHistorialRepository.findResumenesAnuales(año);
    
    return this.calcularEstadisticasAnuales(año, eventos, resumenesMateriales);
  }

  /**
   * Comparar estadísticas entre años
   */
  async compararAños(año1: number, año2: number): Promise<{
    año1: EstadisticasAnuales;
    año2: EstadisticasAnuales;
    comparacion: {
      mejoraMateriales: number;
      mejoraIncidencias: number;
      mejoraCostos: number;
      tendencia: 'mejora' | 'estable' | 'empeora';
    };
  }> {
    const [estadisticas1, estadisticas2] = await Promise.all([
      this.obtenerEstadisticasAnuales(año1),
      this.obtenerEstadisticasAnuales(año2)
    ]);

    const mejoraMateriales = ((estadisticas2.materialesActivos - estadisticas1.materialesActivos) / estadisticas1.materialesActivos) * 100;
    const totalIncidencias1 = estadisticas1.eventosPorMes.reduce((a, b) => a + b, 0);
    const totalIncidencias2 = estadisticas2.eventosPorMes.reduce((a, b) => a + b, 0);
    const mejoraIncidencias = ((totalIncidencias1 - totalIncidencias2) / totalIncidencias1) * 100;
    const mejoraCostos = ((estadisticas1.costoPerdidas - estadisticas2.costoPerdidas) / estadisticas1.costoPerdidas) * 100;

    let tendencia: 'mejora' | 'estable' | 'empeora' = 'estable';
    const puntuacionMejora = (mejoraIncidencias + mejoraCostos) / 2;
    
    if (puntuacionMejora > 10) tendencia = 'mejora';
    else if (puntuacionMejora < -10) tendencia = 'empeora';

    return {
      año1: estadisticas1,
      año2: estadisticas2,
      comparacion: {
        mejoraMateriales,
        mejoraIncidencias,
        mejoraCostos,
        tendencia
      }
    };
  }

  /**
   * Obtener top materiales problemáticos
   */
  async obtenerMaterialesProblematicos(año?: number, limite: number = 10): Promise<{
    materialId: string;
    nombreMaterial: string;
    totalIncidencias: number;
    costoTotal: number;
    ultimaIncidencia: Date;
    gravedad: GravedadIncidencia;
  }[]> {    const filtros: FiltroHistorial = {
      tipoEvento: [TipoEventoMaterial.INCIDENCIA_MENOR, TipoEventoMaterial.INCIDENCIA_MAYOR, TipoEventoMaterial.PERDIDO, TipoEventoMaterial.BAJA_DEFINITIVA]
    };
    
    if (año) {
      filtros.años = [año];
    }

    const eventos = await this.obtenerHistorial(filtros);
    
    // Agrupar por material
    const materialesPorId = new Map<string, {
      nombre: string;
      incidencias: EventoMaterial[];
      costoTotal: number;
    }>();

    eventos.forEach(evento => {
      if (!materialesPorId.has(evento.materialId)) {
        materialesPorId.set(evento.materialId, {
          nombre: evento.nombreMaterial,
          incidencias: [],
          costoTotal: 0
        });
      }
      
      const material = materialesPorId.get(evento.materialId)!;
      material.incidencias.push(evento);
      material.costoTotal += evento.costoAsociado || 0;
    });

    // Convertir a array y ordenar por número de incidencias
    const resultado = Array.from(materialesPorId.entries()).map(([materialId, data]) => ({
      materialId,
      nombreMaterial: data.nombre,
      totalIncidencias: data.incidencias.length,
      costoTotal: data.costoTotal,
      ultimaIncidencia: new Date(Math.max(...data.incidencias.map(i => {
        const fecha = i.fecha instanceof Date ? i.fecha : i.fecha.toDate();
        return fecha.getTime();
      }))),
      gravedad: this.calcularGravedadGeneral(data.incidencias)
    }))
    .sort((a, b) => b.totalIncidencias - a.totalIncidencias)
    .slice(0, limite);

    return resultado;
  }

  /**
   * Generar reporte anual en formato de texto
   */
  async generarReporteAnual(año: number): Promise<string> {
    const estadisticas = await this.obtenerEstadisticasAnuales(año);
    const materialesProblematicos = await this.obtenerMaterialesProblematicos(año, 5);
    
    let reporte = `📊 REPORTE ANUAL DE MATERIALES - ${año}\n`;
    reporte += `${'='.repeat(50)}\n\n`;
    
    reporte += `📈 RESUMEN GENERAL:\n`;
    reporte += `• Total de materiales: ${estadisticas.totalMateriales}\n`;
    reporte += `• Materiales activos: ${estadisticas.materialesActivos}\n`;
    reporte += `• Nuevos materiales: ${estadisticas.materialesNuevos}\n`;
    reporte += `• Materiales dados de baja: ${estadisticas.materialesDadosBaja}\n`;
    reporte += `• Materiales perdidos: ${estadisticas.materialesPerdidos}\n\n`;
    
    reporte += `💰 ANÁLISIS ECONÓMICO:\n`;
    reporte += `• Inversión total: €${estadisticas.inversionTotal.toFixed(2)}\n`;
    reporte += `• Costo mantenimiento: €${estadisticas.costoMantenimiento.toFixed(2)}\n`;
    reporte += `• Costo pérdidas: €${estadisticas.costoPerdidas.toFixed(2)}\n\n`;
    
    reporte += `🔧 ANÁLISIS POR TIPO:\n`;
    Object.entries(estadisticas.estadisticasPorTipo).forEach(([tipo, stats]) => {
      reporte += `• ${tipo.toUpperCase()}:\n`;
      reporte += `  - Total: ${stats.total}\n`;
      reporte += `  - Perdidos: ${stats.perdidos}\n`;
      reporte += `  - Incidencias: ${stats.incidencias}\n`;
      reporte += `  - Costo: €${stats.costoTotal.toFixed(2)}\n`;
    });
    
    reporte += `\n⚠️ MATERIALES MÁS PROBLEMÁTICOS:\n`;
    materialesProblematicos.forEach((material, index) => {
      reporte += `${index + 1}. ${material.nombreMaterial}\n`;
      reporte += `   - Incidencias: ${material.totalIncidencias}\n`;
      reporte += `   - Costo: €${material.costoTotal.toFixed(2)}\n`;
      reporte += `   - Gravedad: ${material.gravedad}\n`;
    });
    
    reporte += `\n📊 TENDENCIAS:\n`;
    reporte += `• Incidencias: ${estadisticas.tendenciaIncidencias}\n`;
    reporte += `• Costos: ${estadisticas.tendenciaCostos}\n`;
    
    reporte += `\n📅 Reporte generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n`;
    
    return reporte;
  }

  // Métodos privados auxiliares

  private async actualizarResumenAnual(materialId: string, año: number): Promise<void> {
    const resumen = await this.calcularResumenAnual(materialId, año);
    if (resumen) {
      await materialHistorialRepository.saveResumenAnual(resumen);
    }
  }

  private async calcularResumenAnual(materialId: string, año: number): Promise<ResumenAnualMaterial | null> {
    const eventos = await this.obtenerHistorial({
      materiales: [materialId],
      años: [año]
    });

    if (eventos.length === 0) return null;

    const inicioAño = startOfYear(new Date(año, 0, 1));
    const finAño = endOfYear(new Date(año, 0, 1));

    // Calcular contadores
    const contadores = {      totalEventos: eventos.length,
      adquisiciones: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.ADQUISICION).length,      revisiones: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.PRIMERA_REVISION || e.tipoEvento === TipoEventoMaterial.REVISION_PERIODICA).length,
      incidencias: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.INCIDENCIA_MENOR || e.tipoEvento === TipoEventoMaterial.INCIDENCIA_MAYOR).length,
      perdidas: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.PERDIDO).length,
      bajas: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.BAJA_DEFINITIVA).length,
      prestamos: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.PRESTAMO).length
    };

    // Calcular costos
    const costos = {
      costoTotal: eventos.reduce((sum, e) => sum + (e.costoAsociado || 0), 0),      costoMantenimiento: eventos.filter(e => 
        e.tipoEvento === TipoEventoMaterial.PRIMERA_REVISION || 
        e.tipoEvento === TipoEventoMaterial.REVISION_PERIODICA || 
        e.tipoEvento === TipoEventoMaterial.REPARACION
      ).reduce((sum, e) => sum + (e.costoAsociado || 0), 0),
      costoPerdidas: eventos.filter(e => e.tipoEvento === TipoEventoMaterial.PERDIDO)
                           .reduce((sum, e) => sum + (e.costoAsociado || 0), 0)
    };

    // Obtener estado final del año
    const eventosFecha = eventos.sort((a, b) => {
      const fechaA = a.fecha instanceof Date ? a.fecha : a.fecha.toDate();
      const fechaB = b.fecha instanceof Date ? b.fecha : b.fecha.toDate();
      return fechaB.getTime() - fechaA.getTime();
    });
    
    const estadoFinalAño = eventosFecha[0]?.estadoNuevo || 'disponible';

    // Calcular días en diferentes estados (simulado)
    const diasTotales = differenceInDays(finAño, inicioAño) + 1;
    const diasEnUso = Math.round(diasTotales * 0.7); // Simulado
    const diasEnMantenimiento = Math.round(diasTotales * 0.2); // Simulado
    const diasPerdido = diasTotales - diasEnUso - diasEnMantenimiento;

    const resumen: ResumenAnualMaterial = {
      año,
      materialId,
      nombreMaterial: eventos[0].nombreMaterial,
      tipo: '', // Se obtendrá del material
      ...contadores,
      ...costos,
      estadoFinalAño,
      diasEnUso,
      diasEnMantenimiento,
      diasPerdido,
      porcentajeUso: (diasEnUso / diasTotales) * 100,
      incidenciasPorUso: diasEnUso > 0 ? contadores.incidencias / diasEnUso : 0
    };

    return resumen;
  }

  private calcularEstadisticasAnuales(
    año: number, 
    eventos: EventoMaterial[], 
    resumenes: ResumenAnualMaterial[]
  ): EstadisticasAnuales {
    // Implementación del cálculo de estadísticas anuales
    const estadisticasPorTipo: { [tipo: string]: any } = {};
    const eventosPorMes = new Array(12).fill(0);
    const incidenciasPorMes = new Array(12).fill(0);

    eventos.forEach(evento => {
      eventosPorMes[evento.mes - 1]++;
      if (evento.tipoEvento.includes('incidencia')) {
        incidenciasPorMes[evento.mes - 1]++;
      }
    });

    const estadisticas: EstadisticasAnuales = {
      año,
      totalMateriales: resumenes.length,
      materialesActivos: resumenes.filter(r => r.estadoFinalAño === 'disponible').length,
      materialesNuevos: resumenes.filter(r => r.adquisiciones > 0).length,
      materialesDadosBaja: resumenes.filter(r => r.bajas > 0).length,
      materialesPerdidos: resumenes.filter(r => r.perdidas > 0).length,
      estadisticasPorTipo,
      inversionTotal: resumenes.reduce((sum, r) => sum + r.costoTotal, 0),
      costoMantenimiento: resumenes.reduce((sum, r) => sum + r.costoMantenimiento, 0),
      costoPerdidas: resumenes.reduce((sum, r) => sum + r.costoPerdidas, 0),
      eventosPorMes,
      incidenciasPorMes,
      materialesConMasIncidencias: resumenes
        .sort((a, b) => b.incidencias - a.incidencias)
        .slice(0, 5)
        .map(r => ({
          materialId: r.materialId,
          nombre: r.nombreMaterial,
          incidencias: r.incidencias,
          costoTotal: r.costoTotal
        })),
      tendenciaIncidencias: 'estable', // Se calcularía comparando con años anteriores
      tendenciaCostos: 'estable' // Se calcularía comparando con años anteriores
    };

    return estadisticas;
  }

  private calcularGravedadGeneral(incidencias: EventoMaterial[]): GravedadIncidencia {
    if (incidencias.some(i => i.gravedad === 'critica')) return 'critica';
    if (incidencias.some(i => i.gravedad === 'alta')) return 'alta';
    if (incidencias.some(i => i.gravedad === 'media')) return 'media';
    return 'baja';
  }
}

// Instancia singleton del servicio
export const materialHistorialService = new MaterialHistorialService();
