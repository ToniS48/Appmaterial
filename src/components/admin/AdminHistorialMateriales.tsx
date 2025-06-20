import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

interface EstadisticasHistorial {
  totalEventos: number;
  totalMateriales: number;
  materialesConHistorial: number;
  eventosHoy: number;
  ultimaActualizacion: Date;
}

interface ResultadoGeneracion {
  materialesProcesados: number;
  eventosGenerados: number;
  eventosPorMaterial: number;
  fechaGeneracion: Date;
  historialLimpiado: boolean;
  usuario: string;
}

// Tipos para las respuestas de Cloud Functions
interface CloudFunctionResponse<T = any> {
  data: {
    success: boolean;
    message?: string;
    estadisticas?: T;
    eventosEliminados?: number;
  } | any; // Permitir any para compatibilidad con httpsCallable
}

export const AdminHistorialMateriales: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasHistorial | null>(null);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cloud Functions
  const generarHistorial = httpsCallable(functions, 'generarHistorialMateriales');
  const verificarHistorial = httpsCallable(functions, 'verificarHistorialMateriales');
  const limpiarHistorial = httpsCallable(functions, 'limpiarHistorialMateriales');
  const handleGenerarHistorial = async (limpiarExistente = false, eventosPorMaterial = 25) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await generarHistorial({
        limpiarHistorialExistente: limpiarExistente,
        numeroEventosPorMaterial: eventosPorMaterial
      }) as CloudFunctionResponse<ResultadoGeneracion>;
      
      if (response.data?.success) {
        setResultado(response.data.estadisticas || null);
        await handleVerificarHistorial(); // Actualizar estadísticas
      }
    } catch (error: any) {
      setError(`Error generando historial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleVerificarHistorial = async () => {
    try {
      const response = await verificarHistorial() as CloudFunctionResponse<EstadisticasHistorial>;
      if (response.data?.success) {
        setEstadisticas(response.data.estadisticas || null);
      }
    } catch (error: any) {
      setError(`Error verificando historial: ${error.message}`);
    }
  };
  const handleLimpiarHistorial = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODOS los eventos históricos? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await limpiarHistorial() as CloudFunctionResponse;
      if (response.data?.success) {
        await handleVerificarHistorial(); // Actualizar estadísticas
        alert(`Historial limpiado: ${response.data.eventosEliminados || 0} eventos eliminados`);
      }
    } catch (error: any) {
      setError(`Error limpiando historial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Verificar estado al cargar el componente
  React.useEffect(() => {
    handleVerificarHistorial();
  }, []);

  return (
    <div className="admin-historial-container" style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>🔧 Administrador de Historial de Materiales</h2>
      
      {/* Estado actual */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📊 Estado Actual</h3>
        {estadisticas ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div><strong>Total Eventos:</strong> {estadisticas.totalEventos}</div>
            <div><strong>Total Materiales:</strong> {estadisticas.totalMateriales}</div>
            <div><strong>Materiales con Historial:</strong> {estadisticas.materialesConHistorial}</div>
            <div><strong>Eventos Hoy:</strong> {estadisticas.eventosHoy}</div>
          </div>
        ) : (
          <p>Cargando estadísticas...</p>
        )}
        <button 
          onClick={handleVerificarHistorial}
          style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Acciones */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🚀 Acciones</h3>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button
            onClick={() => handleGenerarHistorial(false, 25)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Generando...' : '📈 Generar Historial (25 eventos/material)'}
          </button>
          
          <button
            onClick={() => handleGenerarHistorial(false, 50)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            📊 Generar Más Datos (50 eventos/material)
          </button>
          
          <button
            onClick={() => handleGenerarHistorial(true, 30)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            🔄 Regenerar Todo (30 eventos/material)
          </button>
          
          <button
            onClick={handleLimpiarHistorial}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>

      {/* Resultado de la última operación */}
      {resultado && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3>✅ Última Generación Exitosa</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div><strong>Materiales Procesados:</strong> {resultado.materialesProcesados}</div>
            <div><strong>Eventos Generados:</strong> {resultado.eventosGenerados}</div>
            <div><strong>Eventos por Material:</strong> {resultado.eventosPorMaterial}</div>
            <div><strong>Fecha:</strong> {new Date(resultado.fechaGeneracion).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Instrucciones */}
      <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>💡 Instrucciones</h3>
        <ul>
          <li><strong>Generar Historial:</strong> Crea eventos históricos manteniendo los existentes</li>
          <li><strong>Generar Más Datos:</strong> Añade más eventos para análisis más detallados</li>
          <li><strong>Regenerar Todo:</strong> Limpia todo y crea un historial completamente nuevo</li>
          <li><strong>Limpiar Todo:</strong> Elimina todos los eventos históricos</li>
        </ul>
        <p><strong>📍 Dashboard:</strong> Ve a <em>Material {'>'} Seguimiento</em> para ver las visualizaciones</p>
      </div>
    </div>
  );
};

export default AdminHistorialMateriales;
