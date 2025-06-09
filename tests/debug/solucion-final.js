// 🔥 SCRIPT DEFINITIVO PARA RESOLVER PROBLEMA NAVEGACIÓN MATERIAL
// Ejecutar este código completo en la consola del navegador

(function() {
    console.log('🚀 === DIAGNÓSTICO Y SOLUCIÓN FINAL - MATERIAL ===');
    
    // Variables globales para el diagnóstico
    let logs = [];
    let originalConsoleLog = console.log;
    
    // Interceptar logs del componente Material
    console.log = function(...args) {
        if (args.some(arg => typeof arg === 'string' && (arg.includes('GestionMaterialPage') || arg.includes('Material')))) {
            logs.push([Date.now(), ...args]);
        }
        originalConsoleLog.apply(console, args);
    };
    
    async function solucionCompleta() {
        console.log('🔍 PASO 1: Verificación inicial');
        console.log('   URL actual:', window.location.pathname);
        console.log('   Usuario:', window.currentUser?.email || 'No autenticado');
        console.log('   Rol:', window.userProfile?.rol || 'Sin rol');
        console.log('   Permisos para material:', ['admin', 'vocal'].includes(window.userProfile?.rol));
        
        console.log('🎯 PASO 2: Navegación múltiple');
        
        // Método 1: Navegación directa con window.location
        console.log('   Método 1: window.location.pathname');
        window.location.pathname = '/material';
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('   Resultado método 1:');
        console.log('     - URL:', window.location.pathname);
        console.log('     - Título:', document.title);
        
        // Verificar si hay contenido de material
        const checkContent = () => {
            return {
                headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent?.trim()),
                materialText: document.body.textContent?.includes('Inventario de Material') || document.body.textContent?.includes('Gestión de Material'),
                loadingText: document.body.textContent?.includes('Cargando'),
                materialElements: document.querySelectorAll('[class*="material"], [data-testid*="material"]').length,
                dashboardPresent: !!document.querySelector('[class*="dashboard"]')
            };
        };
        
        let content = checkContent();
        console.log('     - Contenido detectado:', content);
        
        if (!content.materialText && !content.loadingText) {
            console.log('⚠️ PASO 3: Contenido no encontrado, intentando métodos alternativos');
            
            // Método 2: History API + eventos
            console.log('   Método 2: History API + eventos');
            window.history.pushState({}, '', '/material');
            window.dispatchEvent(new PopStateEvent('popstate'));
            window.dispatchEvent(new Event('locationchange'));
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            content = checkContent();
            console.log('   Resultado método 2:', content);
        }
        
        if (!content.materialText && !content.loadingText) {
            console.log('🔧 PASO 4: Forzando recarga completa');
            
            // Método 3: Recarga completa de la página
            console.log('   Método 3: Recarga completa');
            window.location.href = window.location.origin + '/material';
            return; // No continuamos porque la página se recargará
        }
        
        console.log('📊 PASO 5: Análisis final');
        
        // Esperar un poco más para logs del componente
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('   Logs de componentes Material capturados:', logs.length);
        logs.forEach((log, index) => {
            console.log(`     📝 ${index + 1}:`, ...log.slice(1));
        });
        
        content = checkContent();
        
        console.log('   Estado final:');
        console.log('     - URL:', window.location.pathname);
        console.log('     - Contenido Material visible:', content.materialText);
        console.log('     - Mostrando loading:', content.loadingText);
        console.log('     - Elementos Material:', content.materialElements);
        console.log('     - Dashboard presente:', content.dashboardPresent);
        console.log('     - Headings:', content.headings);
        
        console.log('🎉 DIAGNÓSTICO COMPLETO');
        
        if (content.materialText || content.loadingText) {
            console.log('✅ ÉXITO: La página de Material está funcionando');
        } else if (content.dashboardPresent) {
            console.log('⚠️ PARCIAL: Dashboard presente pero contenido Material no detectado');
            console.log('   Posibles causas:');
            console.log('   - El componente se está cargando lentamente');
            console.log('   - Hay un error silencioso en el componente');
            console.log('   - Los datos tardan en cargar');
        } else {
            console.log('❌ PROBLEMA: La navegación no está funcionando correctamente');
            console.log('   Recomendaciones:');
            console.log('   - Verificar configuración de React Router');
            console.log('   - Revisar errores en consola');
            console.log('   - Comprobar ProtectedRoute');
        }
        
        // Restaurar console.log original
        console.log = originalConsoleLog;
    }
    
    // Ejecutar solución
    solucionCompleta().catch(error => {
        console.error('Error en diagnóstico:', error);
        console.log = originalConsoleLog;
    });
    
    // Funciones de utilidad
    window.forzarMaterial = () => {
        window.location.href = window.location.origin + '/material';
    };
    
    window.estadoActual = () => {
        const content = {
            url: window.location.pathname,
            title: document.title,
            headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent?.trim()),
            materialText: document.body.textContent?.includes('Inventario de Material') || document.body.textContent?.includes('Gestión de Material'),
            userRole: window.userProfile?.rol,
            authenticated: !!window.currentUser
        };
        console.log('📊 Estado actual:', content);
        return content;
    };
    
    console.log('💡 Funciones disponibles:');
    console.log('   - window.forzarMaterial() // Navegación forzada');
    console.log('   - window.estadoActual()   // Ver estado actual');
})();
