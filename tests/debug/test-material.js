// Test específico para verificar la página de material
console.log('🔍 === TEST PÁGINA DE MATERIAL ===');

// Función para monitorear la navegación y carga de material
window.testMaterialPage = async function() {
  console.log('🚀 Iniciando test de página de material...');
  
  try {
    // 1. Verificar estado actual
    console.log('📍 URL actual:', window.location.href);
    console.log('👤 Usuario actual:', window.currentUser?.email);
    console.log('🔑 Rol del usuario:', window.userProfile?.rol);
    
    // 2. Verificar que tenemos acceso
    const userRole = window.userProfile?.rol;
    const hasAccess = ['admin', 'vocal'].includes(userRole);
    console.log('🔓 Tiene acceso a /material:', hasAccess);
    
    if (!hasAccess) {
      console.log('❌ Usuario no tiene permisos para acceder a /material');
      return false;
    }
    
    // 3. Intentar navegar a material
    console.log('🚀 Navegando a /material...');
    window.history.pushState({}, '', '/material');
    
    // Esperar un momento para que React Router procese la navegación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar que estamos en la página correcta
    console.log('📍 Nueva URL:', window.location.pathname);
    
    // 5. Verificar si el componente se está renderizando
    const pageElements = [
      document.querySelector('h1'),
      document.querySelector('h2'),
      document.querySelector('[data-testid*="material"]'),
      document.querySelector('.chakra-heading'),
      document.querySelector('button')
    ].filter(Boolean);
    
    console.log('🎯 Elementos encontrados en la página:', pageElements.length);
    
    if (pageElements.length > 0) {
      console.log('📝 Contenido de los elementos:');
      pageElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tagName}: ${el.textContent?.substring(0, 50)}...`);
      });
    }
    
    // 6. Verificar si hay errores en el componente
    const errorElements = document.querySelectorAll('[role="alert"], .chakra-alert');
    if (errorElements.length > 0) {
      console.log('⚠️ Errores encontrados:');
      errorElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.textContent}`);
      });
    }
    
    // 7. Verificar si hay spinners de carga
    const spinners = document.querySelectorAll('.chakra-spinner, [data-testid*="loading"]');
    if (spinners.length > 0) {
      console.log('⏳ Elementos de carga encontrados:', spinners.length);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en test de página de material:', error);
    return false;
  }
};

// Función para hacer un test completo del servicio de materiales
window.testMaterialService = async function() {
  console.log('🔧 Probando servicio de materiales...');
  
  try {
    // Verificar que Firebase esté disponible
    if (!window.db) {
      console.log('❌ Firebase DB no está disponible');
      return false;
    }
    
    console.log('✅ Firebase DB disponible');
    
    // Importar y probar el servicio
    const { listarMateriales } = await import('/src/services/MaterialService.js');
    console.log('✅ Servicio materialService importado');
    
    // Probar listar materiales
    console.log('📋 Intentando listar materiales...');
    const materiales = await listarMateriales();
    
    console.log('✅ Materiales obtenidos:', materiales.length);
    
    if (materiales.length > 0) {
      console.log('📋 Primer material:', {
        id: materiales[0].id,
        nombre: materiales[0].nombre,
        tipo: materiales[0].tipo,
        estado: materiales[0].estado
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error probando servicio de materiales:', error);
    return false;
  }
};

console.log('💡 Funciones de test disponibles:');
console.log('  - testMaterialPage() - Probar navegación y renderizado');
console.log('  - testMaterialService() - Probar servicio de datos');
