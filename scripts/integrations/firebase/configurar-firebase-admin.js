#!/usr/bin/env node

/**
 * CONFIGURADOR DE FIREBASE ADMIN SDK
 * Script para ayudar a configurar las credenciales necesarias
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CONFIGURADOR DE FIREBASE ADMIN SDK');
console.log('=====================================\n');

async function verificarConfiguracion() {
  const resultados = {
    firebaseTools: false,
    autenticado: false,
    serviceAccount: false,
    googleCredentials: false,
    projectConfig: false
  };

  // 1. Verificar Firebase CLI
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    resultados.firebaseTools = true;
    console.log('✅ Firebase CLI instalado');
  } catch (error) {
    console.log('❌ Firebase CLI no encontrado');
    console.log('   💡 Instalar con: npm install -g firebase-tools');
  }

  // 2. Verificar autenticación
  try {
    const loginResult = execSync('firebase projects:list --json', { stdio: 'pipe' }).toString();
    const projects = JSON.parse(loginResult);
    if (projects && projects.length > 0) {
      resultados.autenticado = true;
      console.log('✅ Usuario autenticado en Firebase');
      
      // Verificar si el proyecto fichamaterial está disponible
      const proyectoFicha = projects.find(p => p.projectId === 'fichamaterial');
      if (proyectoFicha) {
        resultados.projectConfig = true;
        console.log('✅ Proyecto "fichamaterial" encontrado');
      } else {
        console.log('⚠️  Proyecto "fichamaterial" no encontrado en la lista');
      }
    }
  } catch (error) {
    console.log('❌ Usuario no autenticado');
    console.log('   💡 Ejecutar: firebase login');
  }

  // 3. Verificar service account key
  const serviceAccountPath = path.join(__dirname, '..', 'functions', 'service-account-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    resultados.serviceAccount = true;
    console.log('✅ Service Account Key encontrado');
  } else {
    console.log('❌ Service Account Key no encontrado');
    console.log(`   📁 Ruta esperada: ${serviceAccountPath}`);
  }

  // 4. Verificar variable de entorno
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    resultados.googleCredentials = true;
    console.log('✅ Variable GOOGLE_APPLICATION_CREDENTIALS configurada');
    console.log(`   📁 Ruta: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  } else {
    console.log('❌ Variable GOOGLE_APPLICATION_CREDENTIALS no configurada');
  }

  return resultados;
}

function mostrarInstrucciones(resultados) {
  console.log('\n📋 INSTRUCCIONES DE CONFIGURACIÓN');
  console.log('==================================\n');

  if (!resultados.firebaseTools) {
    console.log('1️⃣ INSTALAR FIREBASE CLI:');
    console.log('   npm install -g firebase-tools\n');
  }

  if (!resultados.autenticado) {
    console.log('2️⃣ AUTENTICARSE EN FIREBASE:');
    console.log('   firebase login\n');
  }

  if (!resultados.serviceAccount) {
    console.log('3️⃣ OBTENER SERVICE ACCOUNT KEY:');
    console.log('   a) Ir a Firebase Console: https://console.firebase.google.com/');
    console.log('   b) Seleccionar proyecto "fichamaterial"');
    console.log('   c) Ir a Configuración del proyecto > Cuentas de servicio');
    console.log('   d) Hacer clic en "Generar nueva clave privada"');
    console.log('   e) Descargar el archivo JSON');
    console.log('   f) Guardar como: functions/service-account-key.json\n');
  }

  if (!resultados.googleCredentials && !resultados.serviceAccount) {
    console.log('4️⃣ CONFIGURAR VARIABLE DE ENTORNO (ALTERNATIVA):');
    console.log('   En PowerShell:');
    console.log('   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\ruta\\completa\\al\\archivo.json"');
    console.log('   ');
    console.log('   En CMD:');
    console.log('   set GOOGLE_APPLICATION_CREDENTIALS=C:\\ruta\\completa\\al\\archivo.json\n');
  }

  // Mostrar métodos disponibles
  console.log('🎯 MÉTODOS DE AUTENTICACIÓN DISPONIBLES:');
  if (resultados.serviceAccount) {
    console.log('✅ Service Account Key (Recomendado para desarrollo)');
  }
  if (resultados.googleCredentials) {
    console.log('✅ Variable de entorno GOOGLE_APPLICATION_CREDENTIALS');
  }
  if (resultados.autenticado) {
    console.log('✅ Firebase CLI autenticado (Application Default Credentials)');
  }

  if (resultados.serviceAccount || resultados.googleCredentials || resultados.autenticado) {
    console.log('\n🚀 YA PUEDES EJECUTAR:');
    console.log('   node scripts/generar-datos-terminal.js');
    console.log('   node scripts/verificar-datos-terminal.js');
  }
}

async function main() {
  try {
    const resultados = await verificarConfiguracion();
    mostrarInstrucciones(resultados);
    
    console.log('\n📁 ARCHIVOS DEL PROYECTO:');
    console.log(`   .firebaserc: ${fs.existsSync('.firebaserc') ? '✅' : '❌'}`);
    console.log(`   firebase.json: ${fs.existsSync('firebase.json') ? '✅' : '❌'}`);
    console.log(`   package.json: ${fs.existsSync('package.json') ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verificarConfiguracion };
