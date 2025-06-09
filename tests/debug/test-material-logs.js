// Script para probar navegación a Material y verificar logs del componente
// Ejecutar en consola del navegador

(function() {
    console.log('🧪 === PRUEBA NAVEGACIÓN MATERIAL CON LOGS ===');
    
    // Función para capturar logs específicos
    let materialLogs = [];
    const originalLog = console.log;
    
    console.log = function(...args) {
        // Capturar logs de GestionMaterialPage
        if (args.some(arg => typeof arg === 'string' && arg.includes('GestionMaterialPage'))) {
            materialLogs.push(['MATERIAL', Date.now(), ...args]);
        }
        originalLog.apply(console, args);
    };
    
    function testNavigationWithLogs() {
        console.log('1. Limpiando logs anteriores...');
        materialLogs = [];
        
        console.log('2. Estado actual:');
        console.log('   - URL:', window.location.pathname);
        console.log('   - Usuario:', window.currentUser?.email);
        console.log('   - Rol:', window.userProfile?.rol);
        
        console.log('3. Navegando a /material...');
        
        // Navegar usando history API
        window.history.pushState({}, '', '/material');
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        console.log('4. Esperando logs del componente...');
        
        // Verificar logs después de un tiempo
        setTimeout(() => {
            console.log('5. Logs de GestionMaterialPage capturados:', materialLogs.length);
            
            materialLogs.forEach((log, index) => {
                console.log(`   📝 Log ${index + 1}:`, ...log.slice(2));
            });
            
            console.log('6. Verificando DOM...');
            const materialElements = document.querySelectorAll('[data-testid*="material"], [class*="material"], [id*="material"]');
            console.log('   - Elementos material en DOM:', materialElements.length);
            
            const heading = document.querySelector('h1, h2, h3, h4, h5, h6');
            console.log('   - Heading encontrado:', heading?.textContent || 'Ninguno');
            
            const dashboardLayout = document.querySelector('[data-testid="dashboard-layout"]') || 
                                  document.querySelector('.dashboard-layout') ||
                                  document.querySelector('[class*="dashboard"]');
            console.log('   - DashboardLayout presente:', !!dashboardLayout);
            
            console.log('7. Verificando título de página...');
            console.log('   - document.title:', document.title);
            
            // Buscar texto específico del componente
            const inventarioText = document.body.textContent?.includes('Inventario de Material');
            const gestionText = document.body.textContent?.includes('Gestión de Material');
            
            console.log('   - Texto "Inventario de Material":', inventarioText);
            console.log('   - Texto "Gestión de Material":', gestionText);
            
            console.log('8. Análisis final:');
            if (materialLogs.length > 0) {
                console.log('   ✅ El componente GestionMaterialPage se está ejecutando');
            } else {
                console.log('   ❌ El componente GestionMaterialPage NO se está ejecutando');
            }
            
            if (inventarioText || gestionText) {
                console.log('   ✅ El contenido del componente está visible');
            } else {
                console.log('   ❌ El contenido del componente NO está visible');
            }
            
            console.log('🏁 === FIN PRUEBA ===');
            
        }, 2000);
        
        // Verificación adicional después de más tiempo
        setTimeout(() => {
            console.log('📊 Verificación tardía (5s):');
            console.log('   - Logs totales:', materialLogs.length);
            console.log('   - URL actual:', window.location.pathname);
            console.log('   - Elementos con "material":', document.querySelectorAll('[class*="material"], [id*="material"]').length);
        }, 5000);
    }
    
    // Ejecutar prueba
    testNavigationWithLogs();
    
    // Exponer función para uso manual
    window.testMaterialLogs = testNavigationWithLogs;
    
    // Función para restaurar console.log
    window.restoreConsole = function() {
        console.log = originalLog;
        console.log('Console.log restaurado');
    };
    
    console.log('💡 Funciones disponibles:');
    console.log('   - window.testMaterialLogs()');
    console.log('   - window.restoreConsole()');
})();
