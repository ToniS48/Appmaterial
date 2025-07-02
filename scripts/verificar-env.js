/**
 * Script para verificar las variables de entorno de Firebase
 */

require('dotenv').config();

console.log('🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO');
console.log('=====================================');

const firebaseVars = [
  'REACT_APP_FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

firebaseVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      console.log(`✅ ${varName}: [CONFIGURADA - ${value.length} caracteres]`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`);
  }
});

console.log('\n🔍 Verificando si podemos crear credenciales...');
try {
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  console.log(`Project ID: ${projectId ? '✅' : '❌'}`);
  console.log(`Client Email: ${clientEmail ? '✅' : '❌'}`);
  console.log(`Private Key: ${privateKey ? '✅ (' + privateKey.length + ' chars)' : '❌'}`);
  
  if (privateKey) {
    console.log('Private Key starts with:', privateKey.substring(0, 50) + '...');
  }
  
} catch (error) {
  console.error('❌ Error verificando credenciales:', error.message);
}
