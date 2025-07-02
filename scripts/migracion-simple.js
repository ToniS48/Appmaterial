/**
 * Script simplificado para migración de API Keys
 * 
 * INSTRUCCIONES:
 * 1. Copiar todo este código
 * 2. Pegarlo en la consola del navegador (F12)
 * 3. Ejecutar una de estas opciones:
 *    - MIGRAR: await migrarAhora()
 *    - DIAGNOSTICAR: await verificarSistema()
 *    - LIMPIAR: limpiarConsola()
 */

// Verificar entorno
const verificarEntorno = () => {
  if (typeof window.SecureEncryption === 'undefined') {
    console.error('❌ ERROR: Este script debe ejecutarse en Material App');
    console.log('💡 Asegúrate de estar en la página correcta');
    return false;
  }
  
  if (typeof window.migrarApiKeysSeguras === 'undefined') {
    console.error('❌ ERROR: Funciones de migración no disponibles');
    console.log('💡 Recarga la página y espera a que cargue completamente');
    return false;
  }
  
  return true;
};

// Función para limpiar y preparar la consola
window.limpiarConsola = () => {
  console.clear();
  console.log('🚀 MIGRACIÓN DE API KEYS - MATERIAL APP');
  console.log('=====================================\n');
  
  if (!verificarEntorno()) {
    return;
  }
  
  console.log('✅ Entorno verificado correctamente');
  console.log('\n📋 COMANDOS DISPONIBLES:');
  console.log('• await migrarAhora() - Ejecutar migración');
  console.log('• await verificarSistema() - Diagnóstico completo');
  console.log('• limpiarConsola() - Limpiar pantalla\n');
};

// Función simplificada para migrar
window.migrarAhora = async () => {
  if (!verificarEntorno()) {
    return;
  }
  
  console.log('🔄 INICIANDO MIGRACIÓN...\n');
  await window.migrarApiKeysSeguras();
};

// Función simplificada para verificar
window.verificarSistema = async () => {
  if (!verificarEntorno()) {
    return;
  }
  
  console.log('🔍 INICIANDO DIAGNÓSTICO...\n');
  await window.diagnosticarSistemaSeguro();
};

// Auto-inicializar
if (verificarEntorno()) {
  setTimeout(() => {
    window.limpiarConsola();
  }, 500);
} else {
  console.log('⚠️ Script cargado pero entorno no válido');
}
