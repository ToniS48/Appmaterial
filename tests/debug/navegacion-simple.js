// Script simple para probar navegación directa
// Ejecutar en consola del navegador

console.log('🔥 NAVEGACIÓN DIRECTA A MATERIAL');

// Función para navegar y verificar
function navegarAMaterial() {
    console.log('🎯 Intentando navegación a /material...');
    
    // Método 1: History API
    console.log('Método 1: History pushState');
    window.history.pushState({}, '', '/material');
    console.log('URL después de pushState:', window.location.pathname);
    
    // Método 2: Disparar eventos de router
    console.log('Método 2: Disparando eventos de router');
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    
    // Método 3: Forzar re-render si hay React
    if (window.React) {
        console.log('Método 3: React detectado, intentando forzar actualización');
        // Intentar disparar evento personalizado
        window.dispatchEvent(new CustomEvent('routechange', { detail: '/material' }));
    }
    
    // Verificar después de un momento
    setTimeout(() => {
        console.log('📊 Verificación 1 segundo después:');
        console.log('  - URL:', window.location.pathname);
        console.log('  - Título:', document.title);
        console.log('  - Headings:', Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent));
        console.log('  - Links material:', document.querySelectorAll('a[href*="material"]').length);
    }, 1000);
}

// Función para verificar estado actual
function verificarEstado() {
    console.log('📋 ESTADO ACTUAL:');
    console.log('  - URL:', window.location.pathname);
    console.log('  - Usuario:', window.currentUser?.email || 'No autenticado');
    console.log('  - Rol:', window.userProfile?.rol || 'Sin rol');
    console.log('  - Auth cargando:', window.authDebug?.loading);
    console.log('  - React disponible:', !!window.React);
    console.log('  - Elementos React:', document.querySelectorAll('[data-reactroot] *').length);
}

// Ejecutar verificación inicial
verificarEstado();

// Ejecutar navegación
navegarAMaterial();

// Exponer funciones
window.navegarAMaterial = navegarAMaterial;
window.verificarEstado = verificarEstado;

console.log('💡 Funciones disponibles: window.navegarAMaterial(), window.verificarEstado()');
