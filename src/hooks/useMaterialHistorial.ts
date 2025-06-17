/**
 * Hook para el registro automático de eventos en el historial de materiales
 * Se integra con las operaciones de material para crear un seguimiento transparente
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { materialHistorialService } from '../services/domain/MaterialHistorialService';
import { Material } from '../types/material';
import { TipoEventoMaterial, GravedadIncidencia } from '../types/materialHistorial';
import { Timestamp } from 'firebase/firestore';

interface RegistroEventoParams {
  materialId: string;
  nombreMaterial: string;
  tipoEvento: TipoEventoMaterial;
  descripcion: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  cantidadAfectada?: number;
  costoAsociado?: number;
  gravedad?: GravedadIncidencia;
  actividadId?: string;
  nombreActividad?: string;
  observaciones?: string;
  evidenciaFotos?: string[];
  documentosAdjuntos?: string[];
}

export const useMaterialHistorial = () => {
  const { currentUser, userProfile } = useAuth();
  /**
   * Registrar un evento de material
   */
  const registrarEvento = useCallback(async (params: RegistroEventoParams) => {
    if (!currentUser || !userProfile) {
      console.warn('No se puede registrar evento: usuario no autenticado');
      return null;
    }

    try {
      const evento = {
        materialId: params.materialId,
        nombreMaterial: params.nombreMaterial,
        tipoEvento: params.tipoEvento,
        fecha: new Date(),
        descripcion: params.descripcion,
        estadoAnterior: params.estadoAnterior,
        estadoNuevo: params.estadoNuevo,
        cantidadAfectada: params.cantidadAfectada,
        costoAsociado: params.costoAsociado,
        gravedad: params.gravedad,
        actividadId: params.actividadId,
        nombreActividad: params.nombreActividad,
        usuarioResponsable: currentUser.uid,
        nombreUsuarioResponsable: userProfile.nombre || currentUser.email || 'Usuario',
        observaciones: params.observaciones,
        evidenciaFotos: params.evidenciaFotos || [],
        documentosAdjuntos: params.documentosAdjuntos || [],
        registradoPor: currentUser.uid,
        nombreRegistrador: userProfile.nombre || currentUser.email || 'Usuario'
      };

      const eventoId = await materialHistorialService.registrarEvento(evento);
      console.log(`✅ Evento registrado en historial: ${params.tipoEvento} - ${params.nombreMaterial}`);
      return eventoId;
    } catch (error) {
      console.error('Error al registrar evento en historial:', error);
      return null;
    }
  }, [currentUser, userProfile]);

  /**
   * Registrar adquisición de material nuevo
   */
  const registrarAdquisicion = useCallback(async (
    material: Material,
    costoAdquisicion?: number,
    proveedor?: string
  ) => {    return await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento: TipoEventoMaterial.ADQUISICION,
      descripcion: `Material adquirido${proveedor ? ` de ${proveedor}` : ''}`,
      estadoNuevo: material.estado,
      cantidadAfectada: material.cantidad || 1,
      costoAsociado: costoAdquisicion,
      observaciones: material.observaciones
    });
  }, [registrarEvento]);

  /**
   * Registrar cambio de estado de material
   */
  const registrarCambioEstado = useCallback(async (
    material: Material,
    estadoAnterior: string,
    motivo?: string
  ) => {    let tipoEvento: TipoEventoMaterial = TipoEventoMaterial.CAMBIO_ESTADO;
    let gravedad: GravedadIncidencia | undefined;

    // Determinar el tipo de evento según el cambio de estado
    if (material.estado === 'baja') {
      tipoEvento = TipoEventoMaterial.BAJA_DEFINITIVA;
      gravedad = 'alta';
    } else if (material.estado === 'perdido') {
      tipoEvento = TipoEventoMaterial.PERDIDA;
      gravedad = 'critica';
    } else if (material.estado === 'mantenimiento') {
      tipoEvento = TipoEventoMaterial.INCIDENCIA_MENOR;
      gravedad = 'media';
    }

    return await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento,
      descripcion: `Cambio de estado: ${estadoAnterior} → ${material.estado}${motivo ? `. Motivo: ${motivo}` : ''}`,
      estadoAnterior,
      estadoNuevo: material.estado,
      gravedad,
      observaciones: material.observaciones
    });
  }, [registrarEvento]);

  /**
   * Registrar revisión periódica
   */  const registrarRevision = useCallback(async (
    material: Material,
    tipoRevision: TipoEventoMaterial.PRIMERA_REVISION | TipoEventoMaterial.REVISION_PERIODICA = TipoEventoMaterial.REVISION_PERIODICA,
    resultados?: string,
    costoRevision?: number
  ) => {
    return await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento: tipoRevision,
      descripcion: `Revisión ${tipoRevision === TipoEventoMaterial.PRIMERA_REVISION ? 'inicial' : 'periódica'} realizada${resultados ? `. Resultados: ${resultados}` : ''}`,
      estadoNuevo: material.estado,
      costoAsociado: costoRevision,
      observaciones: material.observaciones
    });
  }, [registrarEvento]);

  /**
   * Registrar incidencia en material
   */
  const registrarIncidencia = useCallback(async (
    material: Material,
    descripcionIncidencia: string,
    gravedad: GravedadIncidencia,
    costoReparacion?: number,
    actividadId?: string,
    nombreActividad?: string,
    evidenciaFotos?: string[]
  ) => {    const tipoEvento: TipoEventoMaterial = gravedad === 'baja' || gravedad === 'media' 
      ? TipoEventoMaterial.INCIDENCIA_MENOR 
      : TipoEventoMaterial.INCIDENCIA_MAYOR;

    return await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento,
      descripcion: descripcionIncidencia,
      gravedad,
      costoAsociado: costoReparacion,
      actividadId,
      nombreActividad,
      evidenciaFotos,
      estadoAnterior: 'disponible', // Asumimos que estaba disponible antes de la incidencia
      estadoNuevo: material.estado
    });
  }, [registrarEvento]);

  /**
   * Registrar préstamo de material
   */
  const registrarPrestamo = useCallback(async (
    material: Material,
    cantidad: number,
    actividadId: string,
    nombreActividad: string,
    usuarioSolicitante?: string
  ) => {
    return await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento: TipoEventoMaterial.PRESTAMO,
      descripcion: `Material prestado para actividad: ${nombreActividad}`,
      cantidadAfectada: cantidad,
      actividadId,
      nombreActividad,
      estadoAnterior: 'disponible',
      estadoNuevo: 'prestado',
      observaciones: usuarioSolicitante ? `Solicitado por: ${usuarioSolicitante}` : undefined
    });
  }, [registrarEvento]);

  /**
   * Registrar devolución de material
   */
  const registrarDevolucion = useCallback(async (
    material: Material,
    cantidad: number,
    actividadId: string,
    nombreActividad: string,
    incidenciasEnDevolucion?: {
      descripcion: string;
      gravedad: GravedadIncidencia;
      costo?: number;
    }
  ) => {
    const eventoId = await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento: TipoEventoMaterial.DEVOLUCION,
      descripcion: `Material devuelto de actividad: ${nombreActividad}${incidenciasEnDevolucion ? '. Con incidencias reportadas.' : ''}`,
      cantidadAfectada: cantidad,
      actividadId,
      nombreActividad,
      estadoAnterior: 'prestado',
      estadoNuevo: material.estado,
      observaciones: incidenciasEnDevolucion?.descripcion
    });

    // Si hay incidencias en la devolución, registrar un evento adicional
    if (incidenciasEnDevolucion) {
      await registrarIncidencia(
        material,
        `Incidencia en devolución: ${incidenciasEnDevolucion.descripcion}`,
        incidenciasEnDevolucion.gravedad,
        incidenciasEnDevolucion.costo,
        actividadId,
        nombreActividad
      );
    }

    return eventoId;
  }, [registrarEvento, registrarIncidencia]);

  /**
   * Registrar reparación de material
   */
  const registrarReparacion = useCallback(async (
    material: Material,
    descripcionReparacion: string,
    costoReparacion?: number,
    proveedor?: string
  ) => {
    return await registrarEvento({
      materialId: material.id,
      nombreMaterial: material.nombre,
      tipoEvento: TipoEventoMaterial.REPARACION,
      descripcion: `Reparación realizada: ${descripcionReparacion}${proveedor ? ` por ${proveedor}` : ''}`,
      costoAsociado: costoReparacion,
      estadoAnterior: 'mantenimiento',
      estadoNuevo: material.estado,
      observaciones: material.observaciones
    });
  }, [registrarEvento]);
  /**
   * Registrar múltiples eventos (para operaciones en bulk)
   */
  const registrarEventosBulk = useCallback(async (eventos: RegistroEventoParams[]) => {
    if (!currentUser || !userProfile) {
      console.warn('No se pueden registrar eventos: usuario no autenticado');
      return [];
    }

    const eventosCompletos = eventos.map(params => ({
      materialId: params.materialId,
      nombreMaterial: params.nombreMaterial,
      tipoEvento: params.tipoEvento,
      fecha: new Date(),
      descripcion: params.descripcion,
      estadoAnterior: params.estadoAnterior,
      estadoNuevo: params.estadoNuevo,
      cantidadAfectada: params.cantidadAfectada,
      costoAsociado: params.costoAsociado,
      gravedad: params.gravedad,
      actividadId: params.actividadId,
      nombreActividad: params.nombreActividad,
      usuarioResponsable: currentUser.uid,
      nombreUsuarioResponsable: userProfile.nombre || currentUser.email || 'Usuario',
      observaciones: params.observaciones,
      evidenciaFotos: params.evidenciaFotos || [],
      documentosAdjuntos: params.documentosAdjuntos || [],
      registradoPor: currentUser.uid,
      nombreRegistrador: userProfile.nombre || currentUser.email || 'Usuario'
    }));

    try {
      const eventoIds = await materialHistorialService.registrarEventosBulk(eventosCompletos);
      console.log(`✅ ${eventos.length} eventos registrados en bulk`);
      return eventoIds;
    } catch (error) {
      console.error('Error al registrar eventos en bulk:', error);
      return [];
    }
  }, [currentUser, userProfile]);

  return {
    registrarEvento,
    registrarAdquisicion,
    registrarCambioEstado,
    registrarRevision,
    registrarIncidencia,
    registrarPrestamo,
    registrarDevolucion,
    registrarReparacion,
    registrarEventosBulk
  };
};

export default useMaterialHistorial;
