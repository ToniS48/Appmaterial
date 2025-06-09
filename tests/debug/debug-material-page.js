// Script de debugging para la página de material
console.log('🔍 === DEBUGGING GESTIÓN MATERIAL PAGE ===');

// Función para verificar la carga de materiales
window.debugGestionMaterial = async function() {
  console.log('🔍 Iniciando debug de GestionMaterialPage...');
  
  try {
    // 1. Verificar que Firebase esté disponible
    console.log('📡 Firebase DB disponible:', !!window.db);
    
    // 2. Verificar servicios de material
    console.log('🔧 Verificando servicios...');
    const { listarMateriales } = await import('./src/services/materialService.js');
    console.log('📦 Servicio listarMateriales disponible:', !!listarMateriales);
    
    // 3. Intentar cargar materiales
    console.log('📋 Intentando cargar materiales...');
    const materiales = await listarMateriales();
    console.log('✅ Materiales cargados:', materiales);
    console.log('📊 Cantidad de materiales:', materiales.length);
    
    if (materiales.length > 0) {
      console.log('📋 Primer material:', materiales[0]);
    }
    
    return materiales;
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    console.error('📍 Stack trace:', error.stack);
    return null;
  }
};

// Función para verificar la navegación
window.verificarNavegacionMaterial = function() {
  console.log('🔍 Verificando navegación a /material...');
  
  // Verificar ruta actual
  console.log('📍 Ruta actual:', window.location.pathname);
  
  // Verificar componente React
  const reactFiber = document.querySelector('[data-reactroot]')?._reactInternalInstance;
  console.log('⚛️ React disponible:', !!reactFiber);
  
  // Verificar autenticación
  if (window.currentUser) {
    console.log('👤 Usuario actual:', window.currentUser.email);
    console.log('🔑 Rol del usuario:', window.userProfile?.rol);
  } else {
    console.log('❌ No hay usuario autenticado');
  }
};

// Función para verificar permisos de ruta
window.verificarPermisosRuta = function() {
  console.log('🔍 Verificando permisos para ruta /material...');
  
  const userRole = window.userProfile?.rol;
  const allowedRoles = ['admin', 'vocal'];
  
  console.log('👤 Rol actual:', userRole);
  console.log('✅ Roles permitidos:', allowedRoles);
  console.log('🔓 Acceso permitido:', allowedRoles.includes(userRole));
  
  return allowedRoles.includes(userRole);
};

console.log('🚀 Scripts de debugging cargados');
console.log('💡 Funciones disponibles:');
console.log('  - debugGestionMaterial()');
console.log('  - verificarNavegacionMaterial()');
console.log('  - verificarPermisosRuta()');
