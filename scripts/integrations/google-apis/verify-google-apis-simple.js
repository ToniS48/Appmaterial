#!/usr/bin/env node

/**
 * Script de verificación simplificado para Google APIs
 * Versión JavaScript pura (sin dependencias TypeScript)
 */

require('dotenv').config();

async function verifyEnvironmentVariables() {
  console.log('🔍 Verificando variables de entorno...\n');
  
  const requiredVars = [
    { name: 'REACT_APP_GCP_PROJECT_ID', alt: 'GCP_PROJECT_ID', purpose: 'ID del proyecto de Google Cloud' },
    { name: 'REACT_APP_GA_PROPERTY_ID', alt: 'GA_PROPERTY_ID', purpose: 'ID de Google Analytics' },
    { name: 'REACT_APP_API_ENCRYPT_KEY', alt: 'API_ENCRYPT_KEY', purpose: 'Clave de encriptación' }
  ];
  
  const results = [];
  let allConfigured = true;
  
  for (const varConfig of requiredVars) {
    const value = process.env[varConfig.name] || process.env[varConfig.alt];
    const isConfigured = Boolean(value && value.length > 0);
    
    results.push({
      name: varConfig.name,
      alt: varConfig.alt,
      purpose: varConfig.purpose,
      configured: isConfigured,
      value: isConfigured ? '✅ Configurado' : '❌ No configurado'
    });
    
    if (!isConfigured) {
      allConfigured = false;
    }
  }
  
  return { results, allConfigured };
}

function checkNodeEnvironment() {
  console.log('🌍 Información del entorno:\n');
  
  const nodeVersion = process.version;
  const platform = process.platform;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log(`   Node.js: ${nodeVersion}`);
  console.log(`   Platform: ${platform}`);
  console.log(`   NODE_ENV: ${nodeEnv}`);
  
  return {
    nodeVersion,
    platform,
    nodeEnv,
    isProduction: nodeEnv === 'production'
  };
}

async function main() {
  try {
    console.log('🚀 VERIFICACIÓN SIMPLIFICADA DE GOOGLE APIS');
    console.log('=============================================\n');
    
    // Verificar entorno Node.js
    const envInfo = checkNodeEnvironment();
    
    // Verificar variables de entorno
    const { results, allConfigured } = await verifyEnvironmentVariables();
    
    console.log('\n📋 Estado de Variables de Entorno:');
    console.log('==================================');
    
    results.forEach(result => {
      console.log(`${result.value} ${result.name}`);
      if (result.alt !== result.name) {
        console.log(`   └─ (Alt: ${result.alt})`);
      }
      console.log(`   └─ ${result.purpose}`);
      console.log('');
    });
    
    // Verificar archivos de configuración
    const fs = require('fs');
    const path = require('path');
    
    console.log('📁 Archivos de Configuración:');
    console.log('=============================');
    
    const configFiles = [
      { path: '.env', purpose: 'Variables de entorno locales' },
      { path: 'firebase.json', purpose: 'Configuración de Firebase' },
      { path: 'src/config/firebase.ts', purpose: 'Configuración Firebase cliente' },
      { path: 'functions/src/index.ts', purpose: 'Firebase Functions' }
    ];
    
    configFiles.forEach(file => {
      const exists = fs.existsSync(file.path);
      console.log(`${exists ? '✅' : '❌'} ${file.path} - ${file.purpose}`);
    });
    
    // Resumen final
    console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
    console.log('===========================');
    
    if (allConfigured) {
      console.log('✅ Todas las variables de entorno están configuradas');
    } else {
      console.log('⚠️  Algunas variables de entorno necesitan configuración');
    }
    
    console.log('\n📝 Próximos pasos recomendados:');
    console.log('==============================');
    
    if (!allConfigured) {
      console.log('1. Crear archivo .env con las variables faltantes');
      console.log('2. Configurar las variables en tu sistema o CI/CD');
    }
    
    console.log('3. Ejecutar la aplicación: npm start');
    console.log('4. Visitar el Dashboard: http://localhost:3000/testing/google-apis');
    console.log('5. Configurar API keys en: Configuración > APIs');
    
    console.log('\n🔗 Documentación completa:');
    console.log('   docs/GOOGLE-APIS-SCRIPTS-VERIFICATION.md');
    
    // Exit code
    if (allConfigured) {
      console.log('\n🎉 ¡Verificación completada exitosamente!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Verificación completada con advertencias.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error durante la verificación:');
    console.error('   ', error.message);
    
    console.error('\n💡 Soluciones posibles:');
    console.error('   • Verificar que Node.js está instalado');
    console.error('   • Ejecutar npm install');
    console.error('   • Verificar permisos de archivos');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
