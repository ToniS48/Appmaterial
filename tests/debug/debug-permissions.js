// Script para verificar el menú de navegación y permisos de rol
// Ejecutar en consola del navegador

(function() {
    console.log('=== DEBUG MENÚ NAVEGACIÓN Y PERMISOS ===');
    
    function checkNavigationPermissions() {
        console.log('1. Verificando estado de usuario...');
        
        const currentUser = window.currentUser;
        const userProfile = window.userProfile;
        
        console.log('   - Usuario autenticado:', !!currentUser);
        console.log('   - Email:', currentUser?.email || 'No disponible');
        console.log('   - Perfil cargado:', !!userProfile);
        console.log('   - Rol del usuario:', userProfile?.rol || 'No disponible');
        
        console.log('2. Verificando permisos para material...');
        const allowedRoles = ['admin', 'vocal'];
        const userRole = userProfile?.rol;
        const hasPermission = userRole && allowedRoles.includes(userRole);
        
        console.log('   - Roles permitidos:', allowedRoles);
        console.log('   - Rol del usuario:', userRole);
        console.log('   - Tiene permiso:', hasPermission);
        
        console.log('3. Buscando menú de navegación...');
        // Buscar diferentes posibles selectores del menú
        const possibleMenus = [
            document.querySelector('nav'),
            document.querySelector('.navigation'),
            document.querySelector('.nav-menu'),
            document.querySelector('[role="navigation"]'),
            document.querySelector('.sidebar'),
            document.querySelector('.menu')
        ].filter(Boolean);
        
        console.log('   - Menús encontrados:', possibleMenus.length);
        
        possibleMenus.forEach((menu, index) => {
            console.log(`   - Menú ${index + 1}:`, menu.className || menu.tagName);
            
            // Buscar enlaces en este menú
            const links = menu.querySelectorAll('a');
            console.log(`     • Enlaces en menú ${index + 1}:`, links.length);
            
            links.forEach((link, linkIndex) => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim();
                const isMaterialLink = href?.includes('material') || text?.toLowerCase().includes('material');
                
                if (isMaterialLink) {
                    console.log(`     🎯 Enlace de material encontrado:`, {
                        href,
                        text,
                        visible: link.offsetParent !== null,
                        styles: window.getComputedStyle(link).display
                    });
                }
            });
        });
        
        console.log('4. Verificando visibilidad del enlace de material...');
        const materialLinks = document.querySelectorAll('a[href*="/material"]');
        
        if (materialLinks.length === 0) {
            console.log('   ❌ No se encontraron enlaces a /material');
            
            // Verificar si hay elementos ocultos
            const hiddenLinks = document.querySelectorAll('a[href*="/material"][style*="display: none"], a[href*="/material"][hidden]');
            if (hiddenLinks.length > 0) {
                console.log('   ⚠️ Encontrados enlaces ocultos:', hiddenLinks.length);
            }
        } else {
            console.log('   ✅ Enlaces de material encontrados:', materialLinks.length);
            
            materialLinks.forEach((link, index) => {
                const isVisible = link.offsetParent !== null;
                const computedStyle = window.getComputedStyle(link);
                const isDisplayed = computedStyle.display !== 'none';
                const isOpaque = computedStyle.opacity !== '0';
                
                console.log(`   - Enlace ${index + 1}:`, {
                    href: link.href,
                    text: link.textContent?.trim(),
                    visible: isVisible,
                    displayed: isDisplayed,
                    opaque: isOpaque,
                    className: link.className
                });
            });
        }
        
        console.log('5. Simulando lógica de filtrado del menú...');
        // Simular la lógica que debería mostrar/ocultar el enlace
        if (hasPermission) {
            console.log('   ✅ El usuario DEBERÍA ver el enlace de material');
        } else {
            console.log('   ❌ El usuario NO debería ver el enlace de material');
        }
        
        console.log('6. Verificando contextos React...');
        // Intentar acceder a contextos React si están disponibles
        if (window.React) {
            console.log('   - React está disponible');
            
            // Buscar elementos con propiedades React
            const reactElements = document.querySelectorAll('[data-reactroot] *');
            console.log('   - Elementos React:', reactElements.length);
        }
        
        console.log('=== FIN DEBUG MENÚ ===');
        
        return {
            userRole,
            hasPermission,
            materialLinksCount: materialLinks.length,
            menusFound: possibleMenus.length
        };
    }
    
    // Ejecutar verificación
    const result = checkNavigationPermissions();
    
    // Exponer función para uso manual
    window.checkNavPermissions = checkNavigationPermissions;
    
    console.log('💡 Función disponible: window.checkNavPermissions()');
    console.log('📊 Resultado:', result);
})();
