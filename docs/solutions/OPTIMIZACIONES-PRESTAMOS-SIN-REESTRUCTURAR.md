/**
 * OPTIMIZACIONES PARA PRÉSTAMOS SIN CAMBIAR ESTRUCTURA
 * 
 * En lugar de agrupar materiales por actividad, podemos optimizar
 * la estructura actual con estos enfoques:
 */

// 1. ÍNDICES COMPUESTOS más eficientes
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "prestamos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "actividadId", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaPrestamo", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "prestamos", 
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "usuarioId", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaFinActividad", "order": "ASCENDING" }
      ]
    }
  ]
}

// 2. CACHE INTELIGENTE por actividad
class PrestamoService {
  private static cacheByActivity = new Map<string, Prestamo[]>();
  
  async obtenerPrestamosPorActividad(actividadId: string): Promise<Prestamo[]> {
    // Verificar cache primero
    if (this.cacheByActivity.has(actividadId)) {
      return this.cacheByActivity.get(actividadId)!;
    }
    
    // Query única con todos los materiales de la actividad
    const prestamos = await this.queryPrestamosByActividad(actividadId);
    
    // Guardar en cache
    this.cacheByActivity.set(actividadId, prestamos);
    
    return prestamos;
  }
}

// 3. BATCH OPERATIONS para operaciones conjuntas
async devolverTodosLosMaterialesActividad(actividadId: string): Promise<void> {
  const prestamos = await this.obtenerPrestamosPorActividad(actividadId);
  
  // Batch write para actualizar todos a la vez
  const batch = db.batch();
  
  prestamos.forEach(prestamo => {
    const prestamoRef = doc(db, 'prestamos', prestamo.id!);
    batch.update(prestamoRef, {
      estado: 'devuelto',
      fechaDevolucion: serverTimestamp()
    });
  });
  
  await batch.commit();
}

// 4. AGREGACIONES eficientes
async obtenerEstadisticasActividad(actividadId: string) {
  const prestamos = await this.obtenerPrestamosPorActividad(actividadId);
  
  return {
    totalMateriales: prestamos.length,
    devueltos: prestamos.filter(p => p.estado === 'devuelto').length,
    pendientes: prestamos.filter(p => p.estado === 'en_uso').length,
    materialesConRetraso: prestamos.filter(p => this.esFinalizadaConMaterialPendiente(p)).length
  };
}

// 5. SUBCOLLECTIONS para casos específicos (opcional)
// Si necesitamos agrupación ocasional, usar subcollection:
// actividades/{actividadId}/prestamos/{prestamoId}

async obtenerPrestamosPorActividadSubcollection(actividadId: string): Promise<Prestamo[]> {
  const prestamosRef = collection(db, 'actividades', actividadId, 'prestamos');
  const snapshot = await getDocs(prestamosRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }) as Prestamo);
}
