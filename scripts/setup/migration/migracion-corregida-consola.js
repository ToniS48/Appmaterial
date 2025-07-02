/**
 * Script corregido para migración de API Keys a sistema seguro
 * Este script utiliza las funciones ya expuestas en window por App.tsx
 * 
 * USO EN CONSOLA:
 * 1. Copiar todo este código
 * 2. Pegarlo en la consola del navegador
 * 3. Ejecutar: await migrarApiKeysSeguras()
 */

// Verificar que estamos en la aplicación correcta
if (typeof window.SecureEncryption === 'undefined') {
  console.error('❌ Este script debe ejecutarse en la consola de la aplicación Material App');
  console.log('💡 Asegúrate de estar en la página correcta y que la app haya cargado completamente');
} else {
  console.log('✅ Script de migración cargado correctamente');
  console.log('💡 Para ejecutar la migración, usa: await migrarApiKeysSeguras()');
  console.log('💡 Para diagnóstico, usa: await diagnosticarSistemaSeguro()');
  
  // Función auxiliar para mostrar el estado actual
  window.mostrarEstadoMigracion = async () => {
    try {
      console.log('📊 ESTADO ACTUAL DEL SISTEMA');
      console.log('============================\n');
      
      // Verificar autenticación
      if (window.auth && window.auth.currentUser) {
        console.log('✅ Usuario autenticado:', window.auth.currentUser.email);
      } else {
        console.log('⚠️ Estado de autenticación no disponible directamente');
        console.log('💡 La función de migración verificará la autenticación internamente');
      }
      
      // Verificar servicios disponibles
      console.log('\n🔧 SERVICIOS DISPONIBLES:');
      console.log('✅ SecureEncryption:', typeof window.SecureEncryption !== 'undefined');
      console.log('✅ migrarApiKeysSeguras:', typeof window.migrarApiKeysSeguras !== 'undefined');
      console.log('✅ diagnosticarSistemaSeguro:', typeof window.diagnosticarSistemaSeguro !== 'undefined');
      
      console.log('\n💡 PRÓXIMOS PASOS:');
      console.log('1. Ejecutar: await migrarApiKeysSeguras()');
      console.log('2. Si hay problemas: await diagnosticarSistemaSeguro()');
      
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
    }
  };
  
  // Función para limpiar la consola y mostrar el estado
  window.iniciarMigracion = () => {
    console.clear();
    console.log('🚀 MIGRACIÓN DE API KEYS A SISTEMA SEGURO');
    console.log('========================================\n');
    window.mostrarEstadoMigracion();
  };
}

// Auto-ejecutar el estado inicial
if (typeof window.SecureEncryption !== 'undefined') {
  setTimeout(() => {
    window.iniciarMigracion();
  }, 1000);
}
