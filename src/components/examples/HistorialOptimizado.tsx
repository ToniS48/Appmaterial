/**
 * Ejemplo de componente optimizado que utiliza las nuevas mejoras de rendimiento
 * Demuestra el uso de hooks optimizados, cache y procesamiento de datos grandes
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useOptimizedMaterialHistorial } from '../../hooks/useOptimizedMaterialHistorial';
import { useMaterialHistorial } from '../../hooks/useMaterialHistorial';
import { processDataInChunks, debounce } from '../../utils/performanceUtils';
import { TipoEventoMaterial, EventoMaterial } from '../../types/materialHistorial';

interface HistorialOptimizadoProps {
  materialId?: string;
  año?: number;
}

export const HistorialOptimizado: React.FC<HistorialOptimizadoProps> = ({ 
  materialId, 
  año 
}) => {
  const [filtroTipo, setFiltroTipo] = useState<TipoEventoMaterial | undefined>();
  const [procesandoDatos, setProcesandoDatos] = useState(false);
  const [resultadosProcesamiento, setResultadosProcesamiento] = useState<any[]>([]);

  // Hook optimizado para cargar historial con cache
  const { 
    eventos, 
    loading, 
    error, 
    refetch, 
    clearCache 
  } = useOptimizedMaterialHistorial({
    materialId,
    año,
    tipoEvento: filtroTipo,
    limit: 100,
    enableCache: true
  });

  // Hook para registrar eventos
  const { registrarEvento } = useMaterialHistorial();

  // Función debounced para cambiar filtros (evita múltiples llamadas)
  const handleFiltroChange = useMemo(
    () => debounce((nuevoFiltro: TipoEventoMaterial | undefined) => {
      setFiltroTipo(nuevoFiltro);
    }, 300),
    []
  );

  // Ejemplo de procesamiento de datos grandes optimizado
  const procesarDatosGrandes = useCallback(async () => {
    if (eventos.length === 0) return;

    setProcesandoDatos(true);
    setResultadosProcesamiento([]);

    try {
      // Simular procesamiento de datos grandes en chunks
      const resultados = await processDataInChunks(
        eventos,        async (chunk: EventoMaterial[]) => {
          // Simular procesamiento asíncrono pesado
          return chunk.map((evento: EventoMaterial) => ({
            id: evento.id,
            procesado: true,
            tipoEvento: evento.tipoEvento,
            fechaProcesamiento: new Date(),
            costoCalculado: evento.costoAsociado ? evento.costoAsociado * 1.1 : 0
          }));
        },
        50, // Procesar de 50 en 50
        10  // Pausa de 10ms entre chunks para no bloquear UI
      );

      setResultadosProcesamiento(resultados);
      console.log(`✅ Procesamiento completado: ${resultados.length} elementos`);
    } catch (error) {
      console.error('❌ Error en procesamiento:', error);
    } finally {
      setProcesandoDatos(false);
    }
  }, [eventos]);

  // Función para agregar evento de ejemplo
  const agregarEventoEjemplo = useCallback(async () => {
    if (!materialId) {
      alert('Se necesita un materialId para agregar eventos');
      return;
    }

    try {
      await registrarEvento({
        materialId,
        nombreMaterial: `Material ${materialId}`,
        tipoEvento: TipoEventoMaterial.REVISION,
        descripcion: 'Evento de ejemplo agregado desde componente optimizado',
        observaciones: `Creado en: ${new Date().toLocaleString()}`
      });

      // Refrescar datos después de agregar
      await refetch();
      console.log('✅ Evento agregado y datos refrescados');
    } catch (error) {
      console.error('❌ Error agregando evento:', error);
    }
  }, [materialId, registrarEvento, refetch]);

  // Renderizado condicional para estados de carga
  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
        </div>
        <p className="text-blue-600 mt-2">⏳ Cargando historial optimizado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">❌ Error de carga</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={refetch}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          📊 Historial Optimizado de Material
        </h2>
        <p className="text-gray-600 text-sm">
          Demuestra optimizaciones: cache, deduplicación, procesamiento en chunks
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtro por tipo:
          </label>          <select
            value={filtroTipo || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFiltroChange(e.target.value as TipoEventoMaterial || undefined)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value={TipoEventoMaterial.ADQUISICION}>Adquisición</option>
            <option value={TipoEventoMaterial.REVISION}>Revisión</option>
            <option value={TipoEventoMaterial.MANTENIMIENTO}>Mantenimiento</option>
            <option value={TipoEventoMaterial.INCIDENCIA}>Incidencia</option>
          </select>
        </div>

        <button
          onClick={clearCache}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          🧹 Limpiar Cache
        </button>

        <button
          onClick={refetch}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          🔄 Refrescar
        </button>

        {materialId && (
          <button
            onClick={agregarEventoEjemplo}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            ➕ Agregar Evento
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-2xl font-bold text-blue-600">{eventos.length}</div>
          <div className="text-sm text-blue-800">Eventos cargados</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-2xl font-bold text-green-600">
            {eventos.filter(e => e.tipoEvento === TipoEventoMaterial.ADQUISICION).length}
          </div>
          <div className="text-sm text-green-800">Adquisiciones</div>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-2xl font-bold text-orange-600">
            {eventos.filter(e => e.tipoEvento === TipoEventoMaterial.INCIDENCIA).length}
          </div>
          <div className="text-sm text-orange-800">Incidencias</div>
        </div>
      </div>

      {/* Procesamiento de datos grandes */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-medium text-gray-800 mb-2">
          🚀 Procesamiento Optimizado de Datos
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={procesarDatosGrandes}
            disabled={procesandoDatos || eventos.length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {procesandoDatos ? '⏳ Procesando...' : '🔄 Procesar Datos'}
          </button>
          {resultadosProcesamiento.length > 0 && (
            <span className="text-sm text-green-600">
              ✅ {resultadosProcesamiento.length} elementos procesados
            </span>
          )}
        </div>
        {procesandoDatos && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse w-1/3"></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Procesando en chunks para no bloquear la UI...
            </p>
          </div>
        )}
      </div>

      {/* Lista de eventos */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">📋 Eventos</h3>
        {eventos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            📭 No hay eventos para mostrar
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">            {eventos.slice(0, 20).map((evento: EventoMaterial) => (
              <div
                key={evento.id}
                className="border border-gray-200 rounded p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">
                      {evento.tipoEvento.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {evento.descripcion}
                    </div>
                  </div>                  <div className="text-xs text-gray-500">
                    {evento.fechaRegistro instanceof Date ? 
                      evento.fechaRegistro.toLocaleDateString() : 
                      evento.fechaRegistro?.toDate ? 
                        evento.fechaRegistro.toDate().toLocaleDateString() :
                        'Fecha no disponible'
                    }
                  </div>
                </div>
              </div>
            ))}
            {eventos.length > 20 && (
              <div className="text-center text-sm text-gray-500 py-2">
                ... y {eventos.length - 20} eventos más
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información de rendimiento */}
      <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
        <strong>🔧 Optimizaciones activas:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Cache local con TTL de 10 minutos</li>
          <li>Deduplicación de consultas idénticas</li>
          <li>Debouncing en cambios de filtros (300ms)</li>
          <li>Procesamiento en chunks para datos grandes</li>
          <li>Memoización de funciones costosas</li>
        </ul>
      </div>
    </div>
  );
};

export default HistorialOptimizado;
