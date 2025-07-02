/**
 * Script para verificar la configuración de Google APIs
 * Ejecutar con: node scripts/check-google-apis.js
 */

console.log('🔍 Verificando configuración de Google APIs...\n');

// Verificar variables de entorno
const requiredVars = [
  'GOOGLE_PROJECT_ID',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_CLIENT_ID'
];

const optionalVars = [
  'REACT_APP_GOOGLE_DRIVE_FOLDER_ID',
  'REACT_APP_GOOGLE_CALENDAR_ID',
  'REACT_APP_GOOGLE_SPREADSHEET_ID'
];

// Cargar variables de entorno
require('dotenv').config();

console.log('📋 ESTADO DE VARIABLES DE ENTORNO:\n');

let allConfigured = true;
let hasWarnings = false;

// Verificar variables requeridas
console.log('✅ Variables requeridas:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('PRIVATE_KEY') ? '[CONFIGURADA]' : value) : '[NO CONFIGURADA]';
  
  console.log(`  ${status} ${varName}: ${display}`);
  
  if (!value) {
    allConfigured = false;
  }
});

console.log('\n🔶 Variables opcionales:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const display = value || '[NO CONFIGURADA]';
  
  console.log(`  ${status} ${varName}: ${display}`);
  
  if (!value) {
    hasWarnings = true;
  }
});

console.log('\n📝 Variables del club:');
['REACT_APP_GOOGLE_PROJECT_ID', 'REACT_APP_CLUB_EMAIL', 'REACT_APP_CLUB_NAME', 'REACT_APP_CLUB_ADMIN_EMAIL'].forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const display = value || '[NO CONFIGURADA]';
  
  console.log(`  ${status} ${varName}: ${display}`);
});

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE CONFIGURACIÓN:');
console.log('='.repeat(50));

if (allConfigured) {
  console.log('✅ Configuración básica: COMPLETA');
  console.log('✅ Google APIs están listas para usar');
} else {
  console.log('❌ Configuración básica: INCOMPLETA');
  console.log('❌ Faltan variables requeridas');
}

if (hasWarnings) {
  console.log('⚠️  Funcionalidades limitadas: Algunas variables opcionales no están configuradas');
} else {
  console.log('✅ Configuración completa: Todas las funcionalidades disponibles');
}

// Próximos pasos
console.log('\n🚀 PRÓXIMOS PASOS:');

if (!allConfigured) {
  console.log('1. Obtener archivo JSON del Service Account de tonisoler@espemo.org');
  console.log('2. Configurar variables requeridas en .env');
  console.log('3. Volver a ejecutar esta verificación');
} else {
  console.log('1. Obtener IDs de recursos de espeleo@espemo.org:');
  console.log('   - ID de carpeta Drive');
  console.log('   - ID de calendario');
  console.log('2. Configurar variables opcionales en .env');
  console.log('3. Probar conexión desde la aplicación');
}

// Información de contacto
console.log('\n📞 CONTACTOS:');
console.log('- Admin Google Cloud: tonisoler@espemo.org');
console.log('- Gestión recursos: espeleo@espemo.org');
console.log('- Soporte técnico: Desarrollador del proyecto');

console.log('\n📖 Documentación: docs/GOOGLE-APIS-INTEGRATION.md');

process.exit(allConfigured ? 0 : 1);