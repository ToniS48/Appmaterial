// Script de debugging para probar navegación a página de materiales
// Ejecutar en la consola del navegador después de que la aplicación haya cargado

(function() {
    console.log('=== DEBUG NAVEGACIÓN MATERIAL ===');
    
    // Función para esperar que React esté listo
    function waitForReact() {
        return new Promise((resolve) => {
            if (window.React || document.querySelector('[data-reactroot]')) {
                resolve();
            } else {
                setTimeout(() => waitForReact().then(resolve), 100);
            }
        });
    }
    
    // Función principal de testing
    async function testNavigation() {
        await waitForReact();
        
        console.log('1. Verificando estado de autenticación...');
        console.log('   - currentUser:', window.currentUser?.email || 'No disponible');
        console.log('   - userProfile:', window.userProfile?.rol || 'No disponible');
        console.log('   - authDebug:', window.authDebug || 'No disponible');
        
        console.log('2. Verificando URL actual...');
        console.log('   - URL:', window.location.href);
        console.log('   - pathname:', window.location.pathname);
        
        console.log('3. Verificando React Router...');
        const reactRouter = window.history;
        console.log('   - history:', reactRouter);
        
        console.log('4. Verificando elementos de navegación...');
        const navLinks = document.querySelectorAll('a[href*="material"]');
        console.log('   - Enlaces de material encontrados:', navLinks.length);
        navLinks.forEach((link, index) => {
            console.log(`   - Link ${index + 1}:`, link.href, link.textContent?.trim());
        });
        
        console.log('5. Verificando menú de navegación...');
        const navMenu = document.querySelector('[data-testid="navigation-menu"]') || 
                       document.querySelector('nav') ||
                       document.querySelector('.nav') ||
                       document.querySelector('.navigation');
        console.log('   - Menú encontrado:', !!navMenu);
        if (navMenu) {
            console.log('   - Contenido del menú:', navMenu.innerHTML.substring(0, 200) + '...');
        }
        
        console.log('6. Intentando navegación programática...');
        try {
            // Intentar navegación usando history API
            if (window.history && window.history.pushState) {
                window.history.pushState({}, '', '/material');
                console.log('   ✓ URL cambiada a /material');
                
                // Disparar evento de cambio de ruta
                window.dispatchEvent(new PopStateEvent('popstate'));
                console.log('   ✓ Evento popstate disparado');
                
                // Verificar cambio después de un momento
                setTimeout(() => {
                    console.log('   - Nueva URL:', window.location.pathname);
                    console.log('   - Contenido actual de la página:', document.title);
                }, 1000);
            }
        } catch (error) {
            console.error('   ✗ Error en navegación programática:', error);
        }
        
        console.log('7. Verificando errores en consola...');
        // Capturar errores futuros
        const originalError = console.error;
        console.error = function(...args) {
            console.log('   🔴 Error capturado:', ...args);
            originalError.apply(console, args);
        };
        
        console.log('8. Probando clic en enlace de material...');
        const materialLink = Array.from(navLinks).find(link => 
            link.textContent?.toLowerCase().includes('material') ||
            link.href.includes('/material')
        );
        
        if (materialLink) {
            console.log('   - Enlace encontrado:', materialLink.href);
            console.log('   - Texto del enlace:', materialLink.textContent?.trim());
            
            try {
                // Simular clic
                materialLink.click();
                console.log('   ✓ Clic simulado en enlace de material');
                
                setTimeout(() => {
                    console.log('   - URL después del clic:', window.location.pathname);
                }, 500);
            } catch (error) {
                console.error('   ✗ Error al hacer clic:', error);
            }
        } else {
            console.log('   ✗ No se encontró enlace de material válido');
        }
        
        console.log('9. Verificando componentes React...');
        const reactElements = document.querySelectorAll('[data-reactroot] *');
        console.log('   - Elementos React encontrados:', reactElements.length);
        
        // Buscar componentes específicos
        const materialPageElements = document.querySelectorAll('[class*="material"], [id*="material"]');
        console.log('   - Elementos relacionados con material:', materialPageElements.length);
        
        console.log('=== FIN DEBUG NAVEGACIÓN ===');
    }
    
    // Ejecutar test
    testNavigation().catch(console.error);
    
    // Exponer función para ejecutar manualmente
    window.testMaterialNavigation = testNavigation;
    
    console.log('💡 Función disponible: window.testMaterialNavigation()');
})();
