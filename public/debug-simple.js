// Script de debugging simple para verificar la página de material
console.log('🔍 === DEBUGGING MATERIAL PAGE SIMPLE ===');

// Verificación básica
console.log('📍 URL actual:', window.location.href);
console.log('📍 Pathname:', window.location.pathname);

// Verificar usuario
console.log('👤 Usuario autenticado:', !!window.currentUser);
if (window.currentUser) {
  console.log('📧 Email:', window.currentUser.email);
}

// Verificar perfil de usuario
console.log('👤 Perfil de usuario:', window.userProfile);
if (window.userProfile) {
  console.log('🔑 Rol:', window.userProfile.rol);
}

// Verificar React Router
console.log('⚛️ React Router disponible:', !!window.React);

// Verificar si estamos en la página correcta
if (window.location.pathname === '/material') {
  console.log('✅ Estamos en la página de material');
  
  // Verificar si el componente se está renderizando
  const materialPageElement = document.querySelector('[data-testid="material-page"], .material-page, h1, h2, h3');
  console.log('🎯 Elemento de página encontrado:', !!materialPageElement);
  if (materialPageElement) {
    console.log('📝 Contenido del elemento:', materialPageElement.textContent);
  }
  
  // Verificar errores en consola
  console.log('🔍 Buscar errores en Network tab del DevTools');
  console.log('🔍 Buscar errores en Console tab del DevTools');
  
} else {
  console.log('❌ No estamos en la página de material');
  console.log('💡 Intentar navegar manualmente a http://localhost:3000/material');
}

// Función simple para probar navegación
window.irAMaterial = function() {
  console.log('🚀 Navegando a /material...');
  window.location.href = '/material';
};

console.log('💡 Función disponible: irAMaterial()');
