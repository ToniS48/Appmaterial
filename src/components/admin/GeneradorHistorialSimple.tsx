import React, { useState } from 'react';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface EstadisticasHistorial {
  totalEventos: number;
  totalMateriales: number;
  materialesConHistorial: number;
  eventosHoy: number;
}

interface Material {
  id: string;
  nombre?: string;
  cantidad?: number;
  unidad?: string;
  categoria?: string;
  ubicacion?: string;
  precio?: number;
  estado?: string;
  fechaCreacion?: Date;
  stockMinimo?: number;
  stockMaximo?: number;
}

export const GeneradorHistorialSimple: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasHistorial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<string>('');

  // Tipos de eventos para el historial
  const TIPOS_EVENTO = [
    'entrada_inicial',
    'consumo_diario', 
    'reposicion',
    'ajuste_inventario',
    'transferencia',
    'caducidad'
  ] as const;

  // Función para generar fecha aleatoria en los últimos 6 meses
  const generarFechaAleatoria = (): Date => {
    const ahora = new Date();
    const seiseMesesAtras = new Date(ahora.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
    const tiempo = seiseMesesAtras.getTime() + Math.random() * (ahora.getTime() - seiseMesesAtras.getTime());
    return new Date(tiempo);
  };

  // Función para generar cantidad aleatoria basada en el tipo de evento
  const generarCantidad = (tipo: string): number => {
    switch (tipo) {
      case 'entrada_inicial':
        return Math.floor(Math.random() * 500) + 100;
      case 'consumo_diario':
        return -(Math.floor(Math.random() * 20) + 1);
      case 'reposicion':
        return Math.floor(Math.random() * 200) + 50;
      case 'ajuste_inventario':
        return Math.floor(Math.random() * 21) - 10; // -10 a +10
      case 'transferencia':
        return -(Math.floor(Math.random() * 30) + 5);
      case 'caducidad':
        return -(Math.floor(Math.random() * 15) + 1);
      default:
        return Math.floor(Math.random() * 50);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerarHistorial = async (eventosPorMaterial = 25, limpiarAntes = false) => {
    try {
      setLoading(true);
      setError(null);
      setProgreso('Iniciando generación...');
      
      // 1. Limpiar historial existente si se solicita
      if (limpiarAntes) {
        setProgreso('Limpiando historial existente...');
        const historialSnapshot = await getDocs(collection(db, 'material_historial'));
        const deletePromises = historialSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
        setProgreso(`Eliminados ${historialSnapshot.size} eventos existentes`);
      }

      // 2. Obtener materiales del inventario
      setProgreso('Obteniendo materiales del inventario...');
      const inventarioSnapshot = await getDocs(collection(db, 'inventario_materiales'));
      
      if (inventarioSnapshot.empty) {
        setProgreso('No hay materiales, creando ejemplos...');
        
        // Crear materiales de ejemplo
        const materialesEjemplo = [
          { nombre: 'Cemento Portland', cantidad: 150, unidad: 'sacos', categoria: 'Cemento', precio: 12.50 },
          { nombre: 'Arena Fina', cantidad: 80, unidad: 'm³', categoria: 'Agregados', precio: 25.00 },
          { nombre: 'Grava 20mm', cantidad: 120, unidad: 'm³', categoria: 'Agregados', precio: 28.00 },
          { nombre: 'Acero #4', cantidad: 200, unidad: 'varillas', categoria: 'Acero', precio: 15.75 },
          { nombre: 'Ladrillo Rojo', cantidad: 5000, unidad: 'unidades', categoria: 'Mampostería', precio: 0.35 },
          { nombre: 'Cal Hidratada', cantidad: 100, unidad: 'sacos', categoria: 'Cemento', precio: 8.50 },
          { nombre: 'Tubería PVC 4"', cantidad: 50, unidad: 'metros', categoria: 'Plomería', precio: 12.00 }
        ];
        
        for (const material of materialesEjemplo) {
          const materialRef = doc(collection(db, 'inventario_materiales'));
          await setDoc(materialRef, {
            ...material,
            fechaCreacion: new Date(),
            estado: 'activo',
            ubicacion: 'Almacén Principal',
            stockMinimo: Math.floor(material.cantidad * 0.2),
            stockMaximo: Math.floor(material.cantidad * 1.5)
          });
        }
        setProgreso(`Creados ${materialesEjemplo.length} materiales de ejemplo`);
      }      // 3. Obtener materiales finales
      const materialesSnapshot = await getDocs(collection(db, 'inventario_materiales'));
      const materiales: Material[] = materialesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Material));

      setProgreso(`Generando eventos para ${materiales.length} materiales...`);

      // 4. Generar eventos históricos
      let totalEventos = 0;
      const historialRef = collection(db, 'material_historial');

      for (let i = 0; i < materiales.length; i++) {
        const material = materiales[i];
        setProgreso(`Procesando ${material.nombre || `Material ${i + 1}`} (${i + 1}/${materiales.length})`);

        for (let j = 0; j < eventosPorMaterial; j++) {
          const tipoEvento = TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)];
          const cantidad = generarCantidad(tipoEvento);
          const fecha = generarFechaAleatoria();

          const evento = {
            materialId: material.id,
            materialNombre: material.nombre || 'Material sin nombre',
            tipo: tipoEvento,
            cantidad: cantidad,
            cantidadAnterior: Math.max(0, (material.cantidad || 100) + Math.floor(Math.random() * 100)),
            cantidadNueva: Math.max(0, (material.cantidad || 100) + cantidad),
            timestamp: fecha,
            observaciones: `${tipoEvento.replace('_', ' ').toUpperCase()} - ${cantidad > 0 ? 'Entrada' : 'Salida'} de ${Math.abs(cantidad)} ${material.unidad || 'unidades'}`,
            usuario: 'Sistema Automático',
            origen: 'generador_simple',
            categoria: material.categoria || 'Sin categoría',
            ubicacion: material.ubicacion || 'Almacén Principal'
          };

          await addDoc(historialRef, evento);
          totalEventos++;

          // Pequeña pausa cada 10 eventos para no sobrecargar
          if (totalEventos % 10 === 0) {
            await delay(50);
          }
        }
      }

      setProgreso(`✅ ¡Completado! Se generaron ${totalEventos} eventos históricos`);
      await handleVerificarHistorial();
      
    } catch (error: any) {
      setError(`Error generando historial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarHistorial = async () => {
    try {
      const historialSnapshot = await getDocs(collection(db, 'material_historial'));
      const materialesSnapshot = await getDocs(collection(db, 'inventario_materiales'));
      
      const eventosHoy = historialSnapshot.docs.filter(docSnap => {
        const timestamp = docSnap.data().timestamp;
        const fecha = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return fecha.toDateString() === new Date().toDateString();
      });
      
      const materialesConHistorial = new Set(
        historialSnapshot.docs.map(docSnap => docSnap.data().materialId)
      );
      
      setEstadisticas({
        totalEventos: historialSnapshot.size,
        totalMateriales: materialesSnapshot.size,
        materialesConHistorial: materialesConHistorial.size,
        eventosHoy: eventosHoy.length
      });
      
    } catch (error: any) {
      setError(`Error verificando historial: ${error.message}`);
    }
  };

  // Verificar estado al cargar
  React.useEffect(() => {
    handleVerificarHistorial();
  }, []);

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>🚀 Generador Simple de Historial de Materiales</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Genera eventos históricos directamente desde el navegador sin necesidad de Cloud Functions.
      </p>
      
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

      {/* Progreso */}
      {loading && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
          <h3>⏳ En Progreso...</h3>
          <p>{progreso}</p>
          <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '10px' }}>
            <div style={{ 
              width: loading ? '100%' : '0%', 
              backgroundColor: '#4CAF50', 
              height: '100%', 
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🚀 Acciones</h3>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button
            onClick={() => handleGenerarHistorial(20, false)}
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
            {loading ? '⏳ Generando...' : '📈 Generar Historial (20 eventos/material)'}
          </button>
          
          <button
            onClick={() => handleGenerarHistorial(40, false)}
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
            📊 Más Datos (40 eventos/material)
          </button>
          
          <button
            onClick={() => handleGenerarHistorial(30, true)}
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
        </div>
      </div>

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
          <li><strong>Más Datos:</strong> Añade más eventos para análisis más detallados</li>
          <li><strong>Regenerar Todo:</strong> Limpia todo y crea un historial completamente nuevo</li>
        </ul>
        <p><strong>📍 Dashboard:</strong> Ve a <em>Material {'>'} Seguimiento</em> para ver las visualizaciones</p>
        <p><strong>⚡ Ventaja:</strong> No requiere Cloud Functions, funciona directamente en el navegador</p>
      </div>
    </div>
  );
};

export default GeneradorHistorialSimple;
