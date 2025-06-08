/**
 * Script para ejecutar en la consola del navegador
 * Para diagnosticar el problema de validación de tabs en tiempo real
 */

console.log('🔧 INICIANDO DIAGNÓSTICO AUTOMÁTICO...\n');

// Función para simular la interacción con el formulario
function diagnosticarFormulario() {
    console.log('📋 PASO 1: Verificando estructura del formulario...');
    
    // Buscar elementos del formulario
    const nombreInput = document.querySelector('input[name="nombre"]');
    const lugarInput = document.querySelector('input[name="lugar"]');
    const tipoButtons = document.querySelectorAll('button[data-testid*="tipo"], button:contains("Escalada"), button:contains("Espeleología")');
    const subtipoButtons = document.querySelectorAll('button[data-testid*="subtipo"], button:contains("Exploración"), button:contains("Deportiva")');
    
    console.log('  📝 Input nombre encontrado:', !!nombreInput);
    console.log('  📍 Input lugar encontrado:', !!lugarInput);
    console.log('  🎯 Botones tipo encontrados:', tipoButtons.length);
    console.log('  🎯 Botones subtipo encontrados:', subtipoButtons.length);
    
    if (nombreInput) {
        console.log('    → Nombre actual:', nombreInput.value);
    }
    if (lugarInput) {
        console.log('    → Lugar actual:', lugarInput.value);
    }
    
    // Buscar el botón de "Siguiente"
    const siguienteButton = document.querySelector('button:contains("Siguiente"), button[type="submit"]');
    console.log('  ➡️ Botón Siguiente encontrado:', !!siguienteButton);
    
    console.log('\n📋 PASO 2: Verificando datos en react-hook-form...');
    
    // Intentar acceder a los datos del formulario si está disponible
    if (window.React) {
        console.log('  ✅ React disponible');
        
        // Buscar cualquier referencia a getValues o formData
        const forms = document.querySelectorAll('form');
        console.log('  📄 Formularios encontrados:', forms.length);
        
        forms.forEach((form, index) => {
            console.log(`    Form ${index}:`, form);
        });
    }
    
    console.log('\n📋 PASO 3: Interceptar eventos de submit...');
    
    // Interceptar eventos de submit
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        form.addEventListener('submit', function(e) {
            console.log(`\n🚀 SUBMIT INTERCEPTADO EN FORM ${index}:`);
            console.log('  Event:', e);
            console.log('  Form data:', new FormData(form));
            
            // Intentar capturar datos de react-hook-form
            if (window.interceptFormSubmit) {
                console.log('  🔧 Interceptor personalizado disponible');
            }
        });
    });
    
    console.log('\n✅ Diagnóstico configurado. Interactúa con el formulario para ver los resultados.');
}

// Función para llenar automáticamente el formulario si los elementos existen
function llenarFormularioAutomatico() {
    console.log('\n🤖 LLENADO AUTOMÁTICO DEL FORMULARIO...');
    
    // Llenar nombre
    const nombreInput = document.querySelector('input[name="nombre"]');
    if (nombreInput) {
        nombreInput.value = 'Exploración Cueva del Agua';
        nombreInput.dispatchEvent(new Event('input', { bubbles: true }));
        nombreInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('  ✅ Nombre llenado');
    }
    
    // Llenar lugar
    const lugarInput = document.querySelector('input[name="lugar"]');
    if (lugarInput) {
        lugarInput.value = 'Montanejos, Castellón';
        lugarInput.dispatchEvent(new Event('input', { bubbles: true }));
        lugarInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('  ✅ Lugar llenado');
    }
    
    // Simular clic en botón de tipo (buscar por texto)
    const botonesTipo = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Espeleología') || 
        btn.textContent.includes('Escalada') ||
        btn.textContent.includes('Senderismo')
    );
    
    if (botonesTipo.length > 0) {
        console.log('  🎯 Intentando hacer clic en botón de tipo...');
        botonesTipo[0].click();
        console.log('  ✅ Clic en tipo:', botonesTipo[0].textContent);
    }
    
    // Simular clic en botón de subtipo
    setTimeout(() => {
        const botonesSubtipo = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent.includes('Exploración') || 
            btn.textContent.includes('Deportiva') ||
            btn.textContent.includes('Iniciación')
        );
        
        if (botonesSubtipo.length > 0) {
            console.log('  🎯 Intentando hacer clic en botón de subtipo...');
            botonesSubtipo[0].click();
            console.log('  ✅ Clic en subtipo:', botonesSubtipo[0].textContent);
        }
        
        // Después de llenar todo, intentar submit
        setTimeout(() => {
            const siguienteButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Siguiente') || btn.type === 'submit'
            );
            
            if (siguienteButton) {
                console.log('\n🚀 INTENTANDO SUBMIT AUTOMÁTICO...');
                siguienteButton.click();
            }
        }, 1000);
        
    }, 500);
}

// Exportar funciones para uso manual
window.diagnosticarFormulario = diagnosticarFormulario;
window.llenarFormularioAutomatico = llenarFormularioAutomatico;

// Ejecutar automáticamente el diagnóstico
setTimeout(() => {
    diagnosticarFormulario();
}, 1000);

console.log(`
🔧 FUNCIONES DISPONIBLES:
- diagnosticarFormulario() - Analiza la estructura del formulario
- llenarFormularioAutomatico() - Llena y envía el formulario automáticamente

📋 INSTRUCCIONES:
1. Navega al formulario de actividad (/activities/new)
2. Ejecuta: llenarFormularioAutomatico()
3. Observa los logs de debug en la consola
`);
