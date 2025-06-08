// Script completo de debugging para resolver problema de navegación a Material
// Ejecutar en la consola del navegador con la aplicación cargada

(function() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO NAVEGACIÓN MATERIAL ===');
    
    // Función para esperar elementos DOM
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout esperando ${selector}`));
            }, timeout);
        });
    }
    
    async function diagnosticoCompleto() {
        console.log('📱 1. INFORMACIÓN BÁSICA');
        console.log('   URL actual:', window.location.href);
        console.log('   User Agent:', navigator.userAgent);
        console.log('   React disponible:', !!window.React);
        
        console.log('👤 2. ESTADO DE AUTENTICACIÓN');
        console.log('   currentUser:', window.currentUser?.email || 'No disponible');
        console.log('   userProfile:', window.userProfile || 'No disponible');
        console.log('   authDebug:', window.authDebug || 'No disponible');
        
        const userRole = window.userProfile?.rol || window.authDebug?.userProfile?.rol;
        console.log('   Rol detectado:', userRole);
        
        console.log('🔐 3. VERIFICACIÓN DE PERMISOS');
        const allowedRoles = ['admin', 'vocal'];
        const hasPermission = userRole && allowedRoles.includes(userRole);
        console.log('   Roles permitidos para Material:', allowedRoles);
        console.log('   Rol del usuario:', userRole);
        console.log('   ✅ Tiene permiso:', hasPermission);
        
        console.log('🧭 4. ANÁLISIS DE NAVEGACIÓN');
        try {
            await waitForElement('nav, [role="navigation"], .navigation');
            console.log('   ✅ Elemento de navegación encontrado');
        } catch (error) {
            console.log('   ❌ No se encontró navegación:', error.message);
        }
        
        // Buscar todos los enlaces de material
        const materialLinks = document.querySelectorAll('a[href*="/material"]');
        console.log('   Enlaces de material encontrados:', materialLinks.length);
        
        materialLinks.forEach((link, index) => {
            const rect = link.getBoundingClientRect();
            const styles = window.getComputedStyle(link);
            console.log(`   📎 Enlace ${index + 1}:`, {
                href: link.href,
                text: link.textContent?.trim(),
                visible: link.offsetParent !== null,
                inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
                display: styles.display,
                opacity: styles.opacity,
                visibility: styles.visibility
            });
        });
        
        console.log('📋 5. ANÁLISIS DEL MENÚ DE NAVEGACIÓN');
        const menus = document.querySelectorAll('nav, .navigation, .nav-menu, [role="navigation"]');
        console.log('   Menús encontrados:', menus.length);
        
        menus.forEach((menu, index) => {
            console.log(`   📂 Menú ${index + 1}:`, menu.tagName, menu.className);
            const menuLinks = menu.querySelectorAll('a');
            console.log(`     Enlaces en menú: ${menuLinks.length}`);
            
            menuLinks.forEach(link => {
                if (link.href.includes('/material')) {
                    console.log('     🎯 ENLACE MATERIAL ENCONTRADO:', {
                        href: link.href,
                        text: link.textContent?.trim(),
                        parent: link.parentElement?.tagName,
                        visible: link.offsetParent !== null
                    });
                }
            });
        });
        
        console.log('🚦 6. PRUEBA DE NAVEGACIÓN');
        if (hasPermission) {
            console.log('   ✅ Usuario tiene permisos, probando navegación...');
            
            try {
                // Método 1: History API
                const originalPath = window.location.pathname;
                window.history.pushState({}, '', '/material');
                console.log('   📍 URL cambiada a:', window.location.pathname);
                
                // Disparar eventos de router
                window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
                window.dispatchEvent(new Event('locationchange'));
                
                setTimeout(() => {
                    console.log('   📊 Resultado después de 1s:');
                    console.log('     - URL actual:', window.location.pathname);
                    console.log('     - Título:', document.title);
                    console.log('     - Elementos con "material":', document.querySelectorAll('[class*="material"], [id*="material"]').length);
                    
                    // Restaurar URL original si no cambió el contenido
                    if (document.title === 'ESPEMO' || !document.querySelector('[class*="material"]')) {
                        window.history.pushState({}, '', originalPath);
                        console.log('   🔄 URL restaurada a:', originalPath);
                    }
                }, 1000);
                
                // Método 2: Clic programático
                const materialLink = document.querySelector('a[href="/material"]');
                if (materialLink) {
                    console.log('   🖱️ Probando clic en enlace...');
                    materialLink.click();
                } else {
                    console.log('   ❌ No se encontró enlace directo a /material');
                }
                
            } catch (error) {
                console.error('   ❌ Error en navegación:', error);
            }
        } else {
            console.log('   ❌ Usuario sin permisos, navegación no debería funcionar');
        }
        
        console.log('🔍 7. DIAGNÓSTICO DE ERRORES');
        // Capturar errores de consola
        const originalError = console.error;
        const originalWarn = console.warn;
        const errors = [];
        
        console.error = function(...args) {
            errors.push(['ERROR', ...args]);
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            errors.push(['WARN', ...args]);
            originalWarn.apply(console, args);
        };
        
        setTimeout(() => {
            console.log('   Errores capturados en los últimos 5 segundos:', errors.length);
            errors.forEach((error, index) => {
                console.log(`   🔴 ${index + 1}:`, ...error);
            });
            
            // Restaurar funciones originales
            console.error = originalError;
            console.warn = originalWarn;
        }, 5000);
        
        console.log('🎯 8. RECOMENDACIONES');
        if (!hasPermission) {
            console.log('   🔑 Verificar autenticación y rol de usuario');
        } else if (materialLinks.length === 0) {
            console.log('   🔗 El enlace de Material no se está renderizando');
            console.log('   💡 Verificar componente AppNavigationMenu');
        } else if (materialLinks.length > 0 && !materialLinks[0].offsetParent) {
            console.log('   👁️ El enlace existe pero está oculto');
            console.log('   💡 Verificar estilos CSS y filtrado por rol');
        } else {
            console.log('   🎭 El enlace existe y es visible, verificar React Router');
        }
        
        console.log('🏁 === FIN DIAGNÓSTICO ===');
        
        return {
            userRole,
            hasPermission,
            materialLinksCount: materialLinks.length,
            visibleMaterialLinks: Array.from(materialLinks).filter(link => link.offsetParent !== null).length,
            currentPath: window.location.pathname,
            errorsCount: errors.length
        };
    }
    
    // Ejecutar diagnóstico
    diagnosticoCompleto().then(result => {
        console.log('📈 RESUMEN DIAGNÓSTICO:', result);
        window.diagnosticoResult = result;
    }).catch(console.error);
    
    // Exponer funciones para uso manual
    window.diagnosticoMaterial = diagnosticoCompleto;
    window.irAMaterial = function() {
        console.log('🎯 Navegando a Material...');
        window.location.pathname = '/material';
    };
    
    console.log('💡 Funciones disponibles:');
    console.log('   - window.diagnosticoMaterial()');
    console.log('   - window.irAMaterial()');
})();
