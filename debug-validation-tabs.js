/**
 * Script de depuración para analizar el problema de validación de pestañas
 */

console.log('=== ANÁLISIS DEL PROBLEMA DE VALIDACIÓN ===\n');

// Simular la función validateInfoTab con logging detallado
function debugValidateInfoTab(data, silent = true) {
    console.log('📊 DATOS RECIBIDOS PARA VALIDACIÓN:');
    console.log('  - nombre:', data.nombre, '| Tipo:', typeof data.nombre);
    console.log('  - lugar:', data.lugar, '| Tipo:', typeof data.lugar);
    console.log('  - tipo:', data.tipo, '| Tipo:', typeof data.tipo, '| Es Array:', Array.isArray(data.tipo));
    console.log('  - subtipo:', data.subtipo, '| Tipo:', typeof data.subtipo, '| Es Array:', Array.isArray(data.subtipo));
    console.log('  - fechaInicio:', data.fechaInicio, '| Tipo:', typeof data.fechaInicio);
    console.log('  - fechaFin:', data.fechaFin, '| Tipo:', typeof data.fechaFin);
    
    console.log('\n🔍 VALIDACIONES INDIVIDUALES:');
    
    // Validar nombre
    const nombreValido = data.nombre && data.nombre.trim() !== '';
    console.log('  ✓ Nombre válido:', nombreValido);
    
    // Validar lugar
    const lugarValido = data.lugar && data.lugar.trim() !== '';
    console.log('  ✓ Lugar válido:', lugarValido);
    
    // Validar tipo
    const tipoValido = data.tipo && Array.isArray(data.tipo) && data.tipo.length > 0;
    console.log('  ✓ Tipo válido:', tipoValido, '(Array con elementos?)');
    
    // Validar subtipo
    const subtipoValido = data.subtipo && Array.isArray(data.subtipo) && data.subtipo.length > 0;
    console.log('  ✓ Subtipo válido:', subtipoValido, '(Array con elementos?)');
    
    // Validar fechas
    const fechasValidas = data.fechaInicio && data.fechaFin;
    console.log('  ✓ Fechas válidas:', fechasValidas);
    
    const resultado = Boolean(nombreValido && lugarValido && tipoValido && subtipoValido && fechasValidas);
    
    console.log('\n📋 RESULTADO FINAL:');
    console.log('  - Todas las validaciones pasaron:', resultado);
    
    if (!resultado) {
        console.log('\n❌ CAMPOS QUE FALLAN:');
        if (!nombreValido) console.log('  - ❌ Nombre');
        if (!lugarValido) console.log('  - ❌ Lugar'); 
        if (!tipoValido) console.log('  - ❌ Tipo');
        if (!subtipoValido) console.log('  - ❌ Subtipo');
        if (!fechasValidas) console.log('  - ❌ Fechas');
    }
    
    return resultado;
}

// Test case 1: Datos completos típicos
console.log('\n--- TEST 1: Datos aparentemente completos ---');
const datosCompletos = {
    nombre: 'Exploración Cueva del Agua',
    lugar: 'Montanejos, Castellón',
    tipo: ['espeleologia'],
    subtipo: ['exploracion'], 
    fechaInicio: new Date('2025-06-10'),
    fechaFin: new Date('2025-06-11'),
};
debugValidateInfoTab(datosCompletos);

// Test case 2: Problema típico - arrays vacíos
console.log('\n--- TEST 2: Arrays vacíos (problema común) ---');
const datosArraysVacios = {
    nombre: 'Exploración Cueva del Agua',
    lugar: 'Montanejos, Castellón', 
    tipo: [],
    subtipo: [],
    fechaInicio: new Date('2025-06-10'),
    fechaFin: new Date('2025-06-11'),
};
debugValidateInfoTab(datosArraysVacios);

// Test case 3: Problema - undefined/null en arrays
console.log('\n--- TEST 3: Arrays undefined/null ---');
const datosUndefined = {
    nombre: 'Exploración Cueva del Agua',
    lugar: 'Montanejos, Castellón',
    tipo: undefined,
    subtipo: null,
    fechaInicio: new Date('2025-06-10'),
    fechaFin: new Date('2025-06-11'),
};
debugValidateInfoTab(datosUndefined);

// Test case 4: Problema - strings en lugar de arrays
console.log('\n--- TEST 4: Strings en lugar de arrays ---');
const datosStrings = {
    nombre: 'Exploración Cueva del Agua',
    lugar: 'Montanejos, Castellón',
    tipo: 'espeleologia',  // ❌ String en lugar de array
    subtipo: 'exploracion', // ❌ String en lugar de array
    fechaInicio: new Date('2025-06-10'),
    fechaFin: new Date('2025-06-11'),
};
debugValidateInfoTab(datosStrings);

console.log('\n=== DIAGNÓSTICO ===');
console.log('🔴 Si ves arrays vacíos [], undefined, null o strings individuales,');
console.log('   ese es el problema. Los datos no llegan correctamente al validador.');
console.log('✅ Solo arrays con elementos pasan la validación.');
console.log('\n🔧 SOLUCIÓN: Verificar cómo se están construyendo los datos antes');
console.log('   de pasarlos a validateInfoTab en el componente.');
