/**
 * Script de debug para interceptar y analizar datos en tiempo real
 * durante la validación de la pestaña de información
 */

// Función para agregar logs temporales a la aplicación en ejecución
function injectDebugLogs() {
    console.log('🔧 INYECTANDO LOGS DE DEBUG PARA VALIDACIÓN DE TABS...\n');
    
    // Simular exactamente la misma lógica que useActividadFormTabs
    const debugValidateInfoTab = (data, silent = true) => {
        console.log('\n=== 🚀 DEBUG: validateInfoTab LLAMADA ===');
        console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
        console.log('🔧 Modo silencioso:', silent);
        
        console.log('\n📊 DATOS RECIBIDOS (data):');
        console.log('  📝 data.nombre:', data.nombre, '| Tipo:', typeof data.nombre);
        console.log('  📍 data.lugar:', data.lugar, '| Tipo:', typeof data.lugar);
        console.log('  🏷️ data.tipo:', data.tipo, '| Tipo:', typeof data.tipo, '| Es Array:', Array.isArray(data.tipo), '| Length:', data.tipo?.length);
        console.log('  🏷️ data.subtipo:', data.subtipo, '| Tipo:', typeof data.subtipo, '| Es Array:', Array.isArray(data.subtipo), '| Length:', data.subtipo?.length);
        console.log('  📅 data.fechaInicio:', data.fechaInicio, '| Tipo:', typeof data.fechaInicio);
        console.log('  📅 data.fechaFin:', data.fechaFin, '| Tipo:', typeof data.fechaFin);
        
        console.log('\n🔍 VALIDACIONES PASO A PASO:');
        
        // Simular validaciones como en el código real
        const nombreValido = data.nombre && data.nombre.trim() !== '';
        const lugarValido = data.lugar && data.lugar.trim() !== '';
        
        console.log('  ✅ Nombre válido:', nombreValido);
        console.log('  ✅ Lugar válido:', lugarValido);
        
        // AQUÍ ESTÁ EL PROBLEMA PRINCIPAL - verificar estas condiciones exactas
        const tipoValido = data.tipo && Array.isArray(data.tipo) && data.tipo.length > 0;
        const subtipoValido = data.subtipo && Array.isArray(data.subtipo) && data.subtipo.length > 0;
        
        console.log('  🏷️ Tipo válido:', tipoValido);
        console.log('    - data.tipo existe?', !!data.tipo);
        console.log('    - Es array?', Array.isArray(data.tipo));
        console.log('    - Tiene elementos?', data.tipo?.length > 0);
        
        console.log('  🏷️ Subtipo válido:', subtipoValido);
        console.log('    - data.subtipo existe?', !!data.subtipo);
        console.log('    - Es array?', Array.isArray(data.subtipo));
        console.log('    - Tiene elementos?', data.subtipo?.length > 0);
        
        const fechasValidas = Boolean(data.fechaInicio && data.fechaFin);
        console.log('  📅 Fechas válidas:', fechasValidas);
        
        const resultado = Boolean(nombreValido && lugarValido && tipoValido && subtipoValido && fechasValidas);
        
        console.log('\n📋 RESULTADO FINAL:');
        console.log('  🎯 Validación exitosa:', resultado);
        
        if (!resultado) {
            console.log('\n❌ CAMPOS QUE FALLAN:');
            if (!nombreValido) console.log('  - ❌ Nombre inválido');
            if (!lugarValido) console.log('  - ❌ Lugar inválido');
            if (!tipoValido) console.log('  - ❌ Tipo inválido');
            if (!subtipoValido) console.log('  - ❌ Subtipo inválido');
            if (!fechasValidas) console.log('  - ❌ Fechas inválidas');
        }
        
        console.log('=== FIN DEBUG validateInfoTab ===\n');
        
        return resultado;
    };
    
    return debugValidateInfoTab;
}

// Instrucciones para usar en la consola del navegador
console.log(`
🔧 INSTRUCCIONES PARA DEBUG EN VIVO:

1. Abrir localhost:3000 en el navegador
2. Abrir DevTools (F12) y ir a la pestaña Console
3. Copiar y pegar la función debugValidateInfoTab de arriba
4. En el hook useActividadFormTabs.ts, reemplazar temporalmente la llamada:
   
   // ANTES:
   const isValid = validateInfoTab(data);
   
   // DESPUÉS (temporal):
   const isValid = debugValidateInfoTab(data);

5. Llenar el formulario y hacer clic en "Siguiente"
6. Revisar la consola para ver exactamente qué datos se están pasando

🔍 BUSCAR ESTOS PROBLEMAS COMUNES:
- tipo: [] (array vacío)
- subtipo: [] (array vacío) 
- tipo: undefined (no definido)
- subtipo: null (nulo)
- tipo: "espeleologia" (string en lugar de array)
`);

// Crear tests rápidos
const testCases = [
    {
        name: "Datos típicos que deberían pasar",
        data: {
            nombre: "Exploración Cueva del Agua",
            lugar: "Montanejos, Castellón",
            tipo: ["espeleologia"],
            subtipo: ["exploracion"],
            fechaInicio: new Date(),
            fechaFin: new Date()
        }
    },
    {
        name: "Problema: Arrays vacíos",
        data: {
            nombre: "Exploración Cueva del Agua", 
            lugar: "Montanejos, Castellón",
            tipo: [],
            subtipo: [],
            fechaInicio: new Date(),
            fechaFin: new Date()
        }
    },
    {
        name: "Problema: Valores undefined",
        data: {
            nombre: "Exploración Cueva del Agua",
            lugar: "Montanejos, Castellón", 
            tipo: undefined,
            subtipo: undefined,
            fechaInicio: new Date(),
            fechaFin: new Date()
        }
    }
];

// Ejecutar tests
const debugFn = injectDebugLogs();
testCases.forEach(testCase => {
    console.log(`\n🧪 TEST: ${testCase.name}`);
    debugFn(testCase.data);
});
