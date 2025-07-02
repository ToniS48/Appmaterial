#!/usr/bin/env node
/**
 * Script para configurar variables de entorno en Firebase Functions
 * 
 * Uso:
 * node setup-firebase-config.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando variables de entorno para Firebase Functions...\n');

// Leer el archivo .env del proyecto principal
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env en el directorio raíz del proyecto');
  console.log('💡 Crea el archivo .env con las siguientes variables:');
  console.log('   GOOGLE_PROJECT_ID=fichamaterial');
  console.log('   GOOGLE_CLIENT_EMAIL=tu-service-account@fichamaterial.iam.gserviceaccount.com');
  console.log('   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"');
  process.exit(1);
}

// Leer variables del archivo .env
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

// Variables requeridas
const requiredVars = [
  'GOOGLE_PROJECT_ID',
  'GOOGLE_CLIENT_EMAIL', 
  'GOOGLE_PRIVATE_KEY'
];

// Verificar que existan todas las variables
const missingVars = requiredVars.filter(varName => !envVars[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Faltan las siguientes variables en el archivo .env:');
  missingVars.forEach(varName => console.log(`   ${varName}`));
  process.exit(1);
}

console.log('✅ Variables encontradas en .env:');
requiredVars.forEach(varName => {
  const value = envVars[varName];
  const displayValue = varName === 'GOOGLE_PRIVATE_KEY' 
    ? '[PRIVATE_KEY_OCULTA]' 
    : value;
  console.log(`   ${varName}: ${displayValue}`);
});

console.log('\n🚀 Configurando Firebase Functions...');

try {
  // Configurar variables en Firebase Functions
  console.log('📝 Configurando GOOGLE_PROJECT_ID...');
  execSync(`firebase functions:config:set google.project_id="${envVars.GOOGLE_PROJECT_ID}"`, { stdio: 'inherit' });

  console.log('📝 Configurando GOOGLE_CLIENT_EMAIL...');
  execSync(`firebase functions:config:set google.client_email="${envVars.GOOGLE_CLIENT_EMAIL}"`, { stdio: 'inherit' });

  console.log('📝 Configurando GOOGLE_PRIVATE_KEY...');
  // Escapar caracteres especiales en la private key
  const privateKey = envVars.GOOGLE_PRIVATE_KEY.replace(/"/g, '\\"');
  execSync(`firebase functions:config:set google.private_key="${privateKey}"`, { stdio: 'inherit' });

  console.log('\n✅ ¡Configuración completada exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Construir las functions: cd functions && npm run build');
  console.log('   2. Desplegar las functions: firebase deploy --only functions');
  console.log('   3. Verificar el endpoint: [TU_URL]/googleApisHealthCheck');

} catch (error) {
  console.error('❌ Error configurando Firebase Functions:', error.message);
  console.log('\n💡 Asegúrate de:');
  console.log('   1. Estar autenticado: firebase login');
  console.log('   2. Tener seleccionado el proyecto: firebase use fichamaterial');
  console.log('   3. Tener permisos de administrador en el proyecto');
  process.exit(1);
}

console.log('\n🔍 Para verificar la configuración:');
console.log('   firebase functions:config:get');
