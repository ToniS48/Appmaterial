/**
 * Debug para interceptar y analizar datos en tiempo real
 * Este script ayuda a diagnosticar el problema de validación de tabs
 */

console.log('🔧 INICIANDO DEBUG DE VALIDACIÓN EN TIEMPO REAL...\n');

// Función para agregar logs de debug temporales
function addDebugToValidation() {
    console.log('📝 Para usar este debug:');
    console.log('1. Abrir localhost:3000 en el navegador');
    console.log('2. Abrir DevTools (F12) → Console');
    console.log('3. Copiar el siguiente código en la consola:\n');
    
    console.log(`
// ==============================================
// CÓDIGO PARA COPIAR EN LA CONSOLA DEL NAVEGADOR
// ==============================================

// Override temporal de getValues para ver qué datos captura react-hook-form
if (window.React && window.ReactDOM) {
    console.log('🔧 Interceptando react-hook-form...');
    
    // Buscar el objeto methods (react-hook-form) en la ventana global
    window.debugFormData = null;
    
    // Función para interceptar cuando se llama getValues()
    const originalConsoleLog = console.log;
    
    // Interceptor para capturar datos del formulario
    window.interceptFormSubmit = function(data) {
        console.log('\\n=== 🚀 DATOS CAPTURADOS EN SUBMIT ===');
        console.log('📅 Timestamp:', new Date().toLocaleTimeString());
        console.log('\\n📊 ESTRUCTURA COMPLETA DEL OBJETO:');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\\n🔍 ANÁLISIS ESPECÍFICO DE CAMPOS PROBLEMÁTICOS:');
        console.log('  📝 nombre:', data.nombre, '| Existe:', !!data.nombre);
        console.log('  📍 lugar:', data.lugar, '| Existe:', !!data.lugar);
        console.log('  🎯 tipo:', data.tipo, '| Es Array:', Array.isArray(data.tipo), '| Longitud:', data.tipo?.length);
        console.log('  🎯 subtipo:', data.subtipo, '| Es Array:', Array.isArray(data.subtipo), '| Longitud:', data.subtipo?.length);
        console.log('  📅 fechaInicio:', data.fechaInicio, '| Existe:', !!data.fechaInicio);
        console.log('  📅 fechaFin:', data.fechaFin, '| Existe:', !!data.fechaFin);
        
        console.log('\\n⚠️ PROBLEMA IDENTIFICADO:');
        if (!data.tipo || !Array.isArray(data.tipo) || data.tipo.length === 0) {
            console.log('❌ El campo tipo está vacío, null, undefined o no es un array');
        }
        if (!data.subtipo || !Array.isArray(data.subtipo) || data.subtipo.length === 0) {
            console.log('❌ El campo subtipo está vacío, null, undefined o no es un array');
        }
        
        return data;
    };
    
    console.log('✅ Debug instalado. Ahora llena el formulario y haz clic en "Siguiente"');
}

// ==============================================
// FIN DEL CÓDIGO PARA COPIAR
// ==============================================
    `);
    
    console.log('\n4. Llenar el formulario (nombre, lugar, seleccionar tipo/subtipo, fechas)');
    console.log('5. Hacer clic en "Siguiente"');
    console.log('6. Revisar la consola para ver exactamente qué datos se capturan\n');
}

// Instrucciones para el debug manual
console.log(`
🚨 PROBLEMA IDENTIFICADO:
Los arrays tipo[] y subtipo[] llegan vacíos al validador, pero no sabemos por qué.

🔍 NECESITAMOS VERIFICAR:
1. ¿Se están guardando las selecciones en react-hook-form?
2. ¿Los botones de tipo/subtipo están conectados correctamente?
3. ¿Los datos se pierden entre el formulario y la validación?

📋 PASOS SIGUIENTES:
`);

addDebugToValidation();

// También crear un interceptor más específico
console.log(`
🔧 INTERCEPTOR AVANZADO (usar en la consola si el primer método no funciona):

// Interceptar específicamente las llamadas a setValue de react-hook-form
window.debugSetValue = function(name, value) {
    console.log('📝 setValue llamado:', name, '→', value);
    if (name === 'tipo' || name === 'subtipo') {
        console.log('🎯 ¡CAMPO CRÍTICO ACTUALIZADO!');
        console.log('  Campo:', name);
        console.log('  Nuevo valor:', value);
        console.log('  Es array:', Array.isArray(value));
        console.log('  Longitud:', value?.length);
    }
};

// Interceptar handleTipoToggle y handleSubtipoToggle
window.debugToggle = function(type, value, currentArray) {
    console.log('🔄 Toggle ejecutado:');
    console.log('  Tipo:', type);
    console.log('  Valor:', value);
    console.log('  Array actual:', currentArray);
    console.log('  Incluye valor:', currentArray?.includes(value));
};
`);
