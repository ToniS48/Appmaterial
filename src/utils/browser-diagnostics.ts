/**
 * Diagnósticos para ejecutar desde la consola del navegador
 * Usar las credenciales ya establecidas de la aplicación web
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';

export class BrowserDiagnostics {
  
  /**
   * Diagnóstico de documentos desactualizados - ejecutar desde consola del navegador
   * Uso: await window.diagnostics.analyzeOutdatedDocuments('usuarios')
   */
  static async analyzeOutdatedDocuments(collectionName: string, sampleSize: number = 20) {
    console.log('🔍 DIAGNÓSTICO DE DOCUMENTOS DESACTUALIZADOS');
    console.log('============================================');
    console.log(`📋 Analizando colección: ${collectionName}`);
    
    try {
      // Obtener documentos de muestra
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, limit(sampleSize));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('❌ No se encontraron documentos en la colección');
        return { error: 'No documents found' };
      }
      
      console.log(`📊 Documentos encontrados: ${snapshot.size}`);
      
      // Analizar estructura de cada documento
      const fieldCounts: Record<string, number> = {};
      const documents: Array<{
        id: string;
        fieldCount: number;
        fields: string[];
      }> = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const fields = Object.keys(data);
        const docInfo = {
          id: doc.id,
          fieldCount: fields.length,
          fields: fields
        };
        documents.push(docInfo);
        
        // Contar frecuencia de cada campo
        fields.forEach(field => {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        });
      });
      
      // Mostrar estadísticas por documento
      console.log('\n📄 Análisis por documento:');
      const fieldCountStats: Record<number, number> = {};
      documents.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.id.substring(0, 8)}... → ${doc.fieldCount} campos`);
        fieldCountStats[doc.fieldCount] = (fieldCountStats[doc.fieldCount] || 0) + 1;
      });
      
      // Estadísticas de campos por documento
      console.log('\n📊 Distribución de número de campos:');
      Object.entries(fieldCountStats)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([count, docs]) => {
          console.log(`  - ${count} campos: ${docs} documentos`);
        });
      
      // Campos más comunes
      console.log('\n📋 Campos más comunes:');
      const sortedFields = Object.entries(fieldCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20);
      
      sortedFields.forEach(([field, count]) => {
        const percentage = Math.round((count / snapshot.size) * 100);
        console.log(`  - ${field}: ${count}/${snapshot.size} (${percentage}%)`);
      });
      
      // Identificar campos que no están en todos los documentos
      console.log('\n🔍 Campos que no están en todos los documentos:');
      const missingFields = Object.entries(fieldCounts)
        .filter(([field, count]) => count < snapshot.size)
        .sort(([,a], [,b]) => a - b);
      
      if (missingFields.length > 0) {
        missingFields.forEach(([field, count]) => {
          const missing = snapshot.size - count;
          console.log(`  - ${field}: falta en ${missing} documentos`);
        });
      } else {
        console.log('  ✅ Todos los campos están presentes en todos los documentos');
      }
      
      // Identificar documentos con diferente número de campos
      const maxFields = Math.max(...documents.map(d => d.fieldCount));
      const minFields = Math.min(...documents.map(d => d.fieldCount));
      
      if (maxFields !== minFields) {
        console.log(`\n⚠️ INCONSISTENCIA DETECTADA:`);
        console.log(`  - Documento con más campos: ${maxFields}`);
        console.log(`  - Documento con menos campos: ${minFields}`);
        console.log(`  - Diferencia: ${maxFields - minFields} campos`);
        
        // Mostrar documentos con menos campos
        const docsWithFewerFields = documents.filter(d => d.fieldCount < maxFields);
        console.log(`\n📋 Documentos con menos de ${maxFields} campos:`);
        docsWithFewerFields.forEach(doc => {
          const missingFieldsForDoc = sortedFields
            .map(([field]) => field)
            .filter(field => !doc.fields.includes(field))
            .slice(0, 5); // Primeros 5 campos más comunes que faltan
          
          console.log(`  - ${doc.id.substring(0, 8)}... (${doc.fieldCount} campos)`);
          if (missingFieldsForDoc.length > 0) {
            console.log(`    ↳ Posibles campos faltantes: ${missingFieldsForDoc.join(', ')}`);
          }
        });
      } else {
        console.log('\n✅ Todos los documentos tienen la misma cantidad de campos');
      }
      
      console.log('\n✅ Diagnóstico completado');
      
      return {
        totalDocuments: documents.length,
        fieldCountStats,
        fieldCounts,
        missingFields: missingFields.map(([field, count]) => ({
          field,
          presentIn: count,
          missingIn: snapshot.size - count
        })),
        inconsistencyDetected: maxFields !== minFields,
        maxFields,
        minFields,
        documentsWithFewerFields: documents.filter(d => d.fieldCount < maxFields)
      };
      
    } catch (error) {
      console.error('❌ Error durante el diagnóstico:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Comparar documentos específicos
   */
  static async compareDocuments(collectionName: string, docIds: string[]) {
    console.log(`🔍 Comparando documentos en ${collectionName}:`);
    
    try {
      const docs = await Promise.all(
        docIds.map(async (id) => {
          const docRef = collection(db, collectionName);
          const q = query(docRef, limit(1));
          const snapshot = await getDocs(q);
          const doc = snapshot.docs.find(d => d.id === id);
          return doc ? { id: doc.id, data: doc.data() } : null;
        })
      );
      
      docs.forEach((doc, index) => {
        if (doc) {
          const fields = Object.keys(doc.data);
          console.log(`${index + 1}. ${doc.id}: ${fields.length} campos`);
          console.log(`   Campos: ${fields.join(', ')}`);
        } else {
          console.log(`${index + 1}. ${docIds[index]}: No encontrado`);
        }
      });
      
      return docs;
    } catch (error) {
      console.error('Error comparando documentos:', error);
      return null;
    }
  }
  
  /**
   * Función de prueba para validar la detección mejorada de documentos desactualizados
   */
  static async testImprovedNormalizationDetection(collectionName: string, sampleSize: number = 20) {
    console.log('🔬 PRUEBA DE DETECCIÓN MEJORADA DE NORMALIZACIÓN');
    console.log('===============================================');
    console.log(`📋 Analizando colección: ${collectionName}`);
    
    try {
      // Usar el servicio mejorado
      const service = (window as any).firestoreDynamicService;
      
      if (!service) {
        console.log('❌ FirestoreDynamicService no disponible - asegúrate de que la app esté en modo desarrollo');
        return null;
      }
      
      const results = await service.analyzeDocumentNormalizationNeeds(collectionName, sampleSize);
      
      console.log(`📊 Resultados de la detección mejorada:`);
      console.log(`  - Documentos analizados: ${sampleSize}`);
      console.log(`  - Documentos que necesitan normalización: ${results.length}`);
      console.log(`  - Porcentaje: ${Math.round((results.length / sampleSize) * 100)}%`);
      
      // Mostrar detalles de documentos detectados
      if (results.length > 0) {
        console.log('\n📋 Documentos detectados como desactualizados:');
        results.forEach((doc: any, index: number) => {
          console.log(`  ${index + 1}. ${doc.documentId.substring(0, 8)}...`);
          console.log(`     - Campos en documento: ${doc.fieldCount || 'N/A'}`);
          console.log(`     - Campos de referencia: ${doc.referenceFieldCount || 'N/A'}`);
          console.log(`     - Campos faltantes: ${doc.missingFields.length} ${doc.missingFields.length > 0 ? `(${doc.missingFields.slice(0, 3).join(', ')}${doc.missingFields.length > 3 ? '...' : ''})` : ''}`);
          console.log(`     - Campos desconocidos: ${doc.unknownFields.length}`);
          console.log(`     - Campos con tipo incorrecto: ${doc.invalidFields.length}`);
        });
        
        // Comparar con el diagnóstico manual
        const manualResult = await this.analyzeOutdatedDocuments(collectionName, sampleSize);
        
        console.log('\n📊 COMPARACIÓN CON ANÁLISIS MANUAL:');
        console.log(`  - Manual: ${manualResult.documentsWithFewerFields?.length || 0} documentos detectados`);
        console.log(`  - Servicio: ${results.length} documentos detectados`);
        
        if (results.length === (manualResult.documentsWithFewerFields?.length || 0)) {
          console.log('  ✅ ¡COINCIDENCIA PERFECTA! La detección mejorada funciona correctamente');
        } else {
          console.log(`  ⚠️ Discrepancia detectada - diferencia: ${Math.abs(results.length - (manualResult.documentsWithFewerFields?.length || 0))} documentos`);
        }
      } else {
        console.log('  ✅ No se detectaron documentos que necesiten normalización');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Error durante la prueba:', error);
      return null;
    }
  }
}

// Hacer disponible en window para usar desde consola
declare global {
  interface Window {
    diagnostics: typeof BrowserDiagnostics;
  }
}

if (typeof window !== 'undefined') {
  window.diagnostics = BrowserDiagnostics;
}
