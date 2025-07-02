#!/usr/bin/env node

/**
 * Script de línea de comandos para verificar Google APIs
 * Uso: npm run apis:verify
 */

const path = require('path');

// Configurar ts-node con el tsconfig específico
require('ts-node').register({
  project: path.join(__dirname, '..', 'tsconfig.node.json')
});

// Configurar variables de entorno si existe un archivo .env
require('dotenv').config();

// Simular algunas dependencias que normalmente están en el navegador
global.console = console;

async function main() {
  try {
    console.log('🚀 Iniciando verificación de Google APIs desde Node.js...\n');
    
    // Verificar argumentos de línea de comandos
    const args = process.argv.slice(2);
    const isDetailed = args.includes('--detailed');
    
    if (isDetailed) {
      console.log('📋 Modo detallado activado\n');
    }
    
    // Importar y ejecutar la verificación
    const { printVerificationReport } = require('../src/utils/googleApisVerification.ts');
    
    const result = await printVerificationReport();
    
    if (isDetailed) {
      console.log('\n📊 INFORMACIÓN DETALLADA:');
      console.log('============================');
      console.log('Timestamp:', result.timestamp);
      console.log('Environment:', result.environment);
      console.log('Summary:', JSON.stringify(result.summary, null, 2));
    }
    
    if (result.success) {
      console.log('\n🎉 ¡Verificación completada exitosamente!');
      console.log('💡 Todas las configuraciones están correctas.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Verificación completada con advertencias.');
      console.log('💡 Revisa las configuraciones señaladas arriba.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error ejecutando la verificación:');
    console.error('   ', error.message);
    
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\n🔍 Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Asegúrate de que:');
    console.error('   • Firebase está configurado correctamente');
    console.error('   • Las variables de entorno están configuradas');
    console.error('   • Las dependencias están instaladas (npm install)');
    console.error('   • El archivo .env existe (si usas variables locales)');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
