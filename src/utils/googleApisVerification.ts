/**
 * Script de verificación de Google APIs para Node.js/Firebase Functions
 * Verifica que todas las configuraciones están correctas
 */

import { GoogleApisConfigService } from '../services/configuracionService';

// Interfaces para el entorno de servidor
export interface GoogleApisVerificationResult {
  success: boolean;
  errors: string[];
  summary: {
    backend: { configured: boolean; errors: string[] };
    analytics: { configured: boolean; errors: string[] };
    bigQuery: { configured: boolean; errors: string[] };
    frontend: { configured: boolean; errors: string[] };
    environment: { configured: boolean; errors: string[] };
  };
  timestamp: string;
  environment: 'browser' | 'node' | 'functions';
}

export interface EnvironmentConfig {
  nodeEnv: string;
  isProduction: boolean;
  isFunctions: boolean;
  projectId?: string;
  gaPropertyId?: string;
  apiEncryptKey?: string;
}

/**
 * Detectar el entorno de ejecución
 */
function detectEnvironment(): EnvironmentConfig {
  const isNode = typeof window === 'undefined';
  const isFunctions = isNode && !!process.env.FUNCTION_NAME;
  
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isFunctions,
    projectId: process.env.REACT_APP_GCP_PROJECT_ID || process.env.GCP_PROJECT_ID,
    gaPropertyId: process.env.REACT_APP_GA_PROPERTY_ID || process.env.GA_PROPERTY_ID,
    apiEncryptKey: process.env.REACT_APP_API_ENCRYPT_KEY || process.env.API_ENCRYPT_KEY
  };
}

/**
 * Verificar configuración de Google APIs (versión Node.js)
 */
export async function verifyGoogleApisConfiguration(): Promise<GoogleApisVerificationResult> {
  const errors: string[] = [];
  const env = detectEnvironment();
  const summary: GoogleApisVerificationResult['summary'] = {
    backend: { configured: false, errors: [] },
    analytics: { configured: false, errors: [] },
    bigQuery: { configured: false, errors: [] },
    frontend: { configured: false, errors: [] },
    environment: { configured: false, errors: [] }
  };

  try {
    console.log('🔍 Verificando configuración de Google APIs...');
    console.log('🌍 Entorno detectado:', {
      nodeEnv: env.nodeEnv,
      isProduction: env.isProduction,
      isFunctions: env.isFunctions
    });

    // Verificar variables de entorno
    const envErrors: string[] = [];
    
    if (!env.projectId) {
      envErrors.push('PROJECT_ID no está configurado');
    }
    
    if (!env.gaPropertyId) {
      envErrors.push('GA_PROPERTY_ID no está configurado');
    }
    
    if (!env.apiEncryptKey) {
      envErrors.push('API_ENCRYPT_KEY no está configurado');
    }

    summary.environment.configured = envErrors.length === 0;
    summary.environment.errors = envErrors;

    // Solo verificar Firestore si no estamos en Functions (para evitar dependencias circulares)
    if (!env.isFunctions) {
      try {
        const config = await GoogleApisConfigService.get();
        console.log('📋 Configuración obtenida desde Firestore');

        // Verificar APIs del frontend
        const frontendApis = [
          'mapsJavaScriptApiKey',
          'mapsEmbedApiKey', 
          'geocodingApiKey',
          'gmailApiKey',
          'chatApiKey',
          'cloudMessagingApiKey'
        ];

        const frontendConfigured = frontendApis.some(key => config[key] && config[key].length > 0);
        summary.frontend.configured = frontendConfigured;
        
        if (!frontendConfigured) {
          summary.frontend.errors.push('No hay API keys de frontend configuradas');
        }

        // Verificar configuración de Analytics
        const analyticsConfigured = Boolean(config.analyticsEnabled && 
          (config.analyticsApiKey?.length > 0 || env.gaPropertyId));
        summary.analytics.configured = analyticsConfigured;
        
        if (!analyticsConfigured) {
          summary.analytics.errors.push('Analytics no está habilitado o configurado');
        }

        // Verificar configuración de BigQuery
        const bigQueryConfigured = Boolean(config.bigQueryEnabled && 
          (config.bigQueryApiKey?.length > 0 || env.projectId));
        summary.bigQuery.configured = bigQueryConfigured;
        
        if (!bigQueryConfigured) {
          summary.bigQuery.errors.push('BigQuery no está habilitado o configurado');
        }

      } catch (firestoreError) {
        summary.frontend.errors.push(`Error accediendo a Firestore: ${firestoreError}`);
        summary.analytics.errors.push('No se pudo verificar configuración desde Firestore');
        summary.bigQuery.errors.push('No se pudo verificar configuración desde Firestore');
      }
    } else {
      // En Functions, solo verificamos variables de entorno
      summary.analytics.configured = !!env.gaPropertyId;
      summary.bigQuery.configured = !!env.projectId;
      summary.frontend.configured = true; // Asumimos que está configurado en el frontend
      
      if (!env.gaPropertyId) {
        summary.analytics.errors.push('GA_PROPERTY_ID no configurado en Functions');
      }
      
      if (!env.projectId) {
        summary.bigQuery.errors.push('PROJECT_ID no configurado en Functions');
      }
    }

    // Verificar backend (Service Account)
    summary.backend.configured = env.isFunctions || !!env.projectId;
    
    if (!summary.backend.configured) {
      summary.backend.errors.push('Service Account no está configurado');
    }

    console.log('✅ Verificación completada');
    
    // Recopilar todos los errores
    Object.values(summary).forEach(section => {
      errors.push(...section.errors);
    });

    return {
      success: errors.length === 0,
      errors,
      summary,
      timestamp: new Date().toISOString(),
      environment: env.isFunctions ? 'functions' : 'node'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    errors.push(`Error durante verificación: ${errorMessage}`);
    
    return {
      success: false,
      errors,
      summary,
      timestamp: new Date().toISOString(),
      environment: env.isFunctions ? 'functions' : 'node'
    };
  }
}

/**
 * Imprimir reporte de verificación (para Node.js)
 */
export async function printVerificationReport(): Promise<GoogleApisVerificationResult> {
  console.log('\n📊 REPORTE DE VERIFICACIÓN - GOOGLE APIS');
  console.log('==========================================');
  
  const result = await verifyGoogleApisConfiguration();
  
  if (result.success) {
    console.log('✅ Verificación exitosa - Todas las APIs están correctamente configuradas');
  } else {
    console.log('❌ Se encontraron problemas:');
    result.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('\n📋 Resumen de Estado:');
  console.log('Entorno:', result.environment.toUpperCase());
  console.log('Backend (Service Account):', result.summary.backend.configured ? '✅ OK' : '❌ Error');
  console.log('Variables de Entorno:', result.summary.environment.configured ? '✅ OK' : '❌ Error');
  console.log('Frontend APIs:', result.summary.frontend.configured ? '✅ OK' : '⚠️  Sin configurar');
  console.log('Google Analytics:', result.summary.analytics.configured ? '✅ OK' : '⚠️  Sin configurar');
  console.log('BigQuery:', result.summary.bigQuery.configured ? '✅ OK' : '⚠️  Sin configurar');
  
  console.log('\n🎯 Próximos pasos recomendados:');
  
  if (!result.summary.environment.configured) {
    console.log('   1. Configurar variables de entorno requeridas');
    result.summary.environment.errors.forEach(error => 
      console.log(`      - ${error}`)
    );
  }
  
  if (!result.summary.frontend.configured && result.environment !== 'functions') {
    console.log('   2. Configurar API keys en Configuración > APIs > Google Maps & Services');
  }
  
  if (!result.summary.analytics.configured) {
    console.log('   3. Habilitar y configurar Google Analytics');
  }
  
  if (!result.summary.bigQuery.configured) {
    console.log('   4. Habilitar y configurar BigQuery');
  }
  
  console.log('\n==========================================\n');
  
  return result;
}

// Función para usar desde línea de comandos
export async function runVerification(): Promise<void> {
  try {
    const result = await printVerificationReport();
    
    // Exit code basado en el resultado
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error ejecutando verificación:', error);
    process.exit(1);
  }
}

// Si se ejecuta directamente desde Node.js
if (require.main === module) {
  runVerification();
}
