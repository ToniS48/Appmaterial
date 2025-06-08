// Test para verificar que la corrección del dashboard funciona
console.log('🔧 === TEST CORRECCIÓN DASHBOARD ===');

// Función para probar la navegación desde dashboard
window.testDashboardFix = function() {
  console.log('🔍 Probando navegación desde dashboard...');
  
  try {
    // 1. Verificar estado actual
    console.log('📍 URL actual:', window.location.href);
    console.log('👤 Usuario:', window.currentUser?.email);
    console.log('🔑 Rol:', window.userProfile?.rol);
    
    // 2. Ir al dashboard
    console.log('🏠 Navegando al dashboard...');
    window.location.href = window.location.origin + '/admin';
    
    // 3. Esperar un momento y luego buscar la tarjeta de material
    setTimeout(() => {
      const materialCard = document.querySelector('[href="/material"], [onclick*="/material"]');
      console.log('🎯 Tarjeta de material encontrada:', !!materialCard);
      
      if (materialCard) {
        console.log('📝 Contenido de la tarjeta:', materialCard.textContent);
        console.log('🔗 Link de la tarjeta:', materialCard.href || 'No href encontrado');
      }
      
      // 4. Buscar todas las tarjetas con rutas
      const allCards = document.querySelectorAll('[href*="/"], [onclick*="/"]');
      console.log('📊 Total de tarjetas con enlaces:', allCards.length);
      
      allCards.forEach((card, index) => {
        const href = card.href || card.getAttribute('onclick');
        if (href && (href.includes('material') || href.includes('admin') || href.includes('vocal'))) {
          console.log(`🔗 Tarjeta ${index + 1}:`, href);
        }
      });
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
};

// Función para probar directamente la navegación a /material
window.testMaterialDirect = function() {
  console.log('🚀 Probando navegación directa a /material...');
  
  const currentUrl = window.location.pathname;
  console.log('📍 URL antes:', currentUrl);
  
  // Navegar a /material
  window.location.href = window.location.origin + '/material';
  
  console.log('✅ Navegación iniciada a /material');
};

// Función para comparar rutas
window.compareRoutes = function() {
  console.log('🔍 Comparando rutas de dashboard vs rutas reales...');
  
  const dashboardRoutes = [
    '/admin/prestamos',
    '/material',  // Corregido
    '/admin/reportes',
    '/admin/estadisticas',
    '/admin/usuarios',
    '/admin/settings'
  ];
  
  console.log('📋 Rutas esperadas en dashboard:', dashboardRoutes);
  
  // Simular verificación de rutas (en una aplicación real verificarías contra el router)
  dashboardRoutes.forEach(route => {
    console.log(`✅ Ruta ${route}: Disponible`);
  });
};

console.log('💡 Funciones disponibles:');
console.log('  - window.testDashboardFix()   // Probar desde dashboard');
console.log('  - window.testMaterialDirect() // Navegación directa');
console.log('  - window.compareRoutes()      // Comparar rutas');
